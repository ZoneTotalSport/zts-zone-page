// studio.js — editeur visuel Studio Jeu. Vanilla ES module.
// Logique de projection / scene deleguee aux modules purs de shared/studio-engine/.

import { createProjector } from '../../shared/studio-engine/projection.js';
import {
  createScene, createStep, duplicateStep, nextElementId, addAsset,
  interpolateSteps, validateScene, pickUnivers, PLAYER_COLORS,
} from '../../shared/studio-engine/scene-schema.js';
import {
  PALETTE, iconSVG, arrowSVG, zoneSVG, textSVG,
  imageSVG, imageHalfBox, svgDefs,
} from '../../shared/studio-engine/elements.js';

const CONFIG_URL = '../../shared/studio-engine/terrain-gym.config.json';
const TERRAIN_URL = '../../shared/studio-engine/assets/terrain-gym.png';
const INDEX_URL = 'data/jeux-index.json';

// Repere du viewBox SVG (unites internes). H recalcule apres chargement config.
let VBW = 1000, VBH = 773;
const ICON_BASE = 0.60;   // echelle de base des icones (local R=46 -> ~28 u)
const TEXT_BASE = 42;     // taille de police de base (u) a scale 1

const UNIV_HEX = { eps: '#00E5FF', sdg: '#39FF14', camps: '#FF6B00' };

// ---- etat global -----------------------------------------------------------
const state = {
  config: null,
  projector: null,
  scene: null,
  stepIndex: 0,
  selectedId: null,
  tool: null,          // outil arme depuis la palette {type,...}
  playing: false,
  calib: false,
  gamesIndex: null,
};

// ---- utilitaires DOM -------------------------------------------------------
const $ = (s) => document.querySelector(s);
const overlay = $('#overlay');
const stage = $('#stage');
const inspector = $('#inspector');

function svgEl(tag, attrs) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  return e;
}
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toast._t); toast._t = setTimeout(() => t.classList.remove('show'), 1600);
}
function curStep() { return state.scene.steps[state.stepIndex]; }
function univHex() { return UNIV_HEX[state.scene?.univers] || '#00E5FF'; }

// ---- coordonnees : ecran <-> terrain --------------------------------------
function clientToUV(clientX, clientY) {
  const r = overlay.getBoundingClientRect();
  const fx = (clientX - r.left) / r.width;   // fraction image 0-1
  const fy = (clientY - r.top) / r.height;
  return state.projector.unproject(fx, fy);
}
function projPx(u, v) {
  const p = state.projector.project(u, v);
  return { x: p.x * VBW, y: p.y * VBH, scale: p.scale };
}
function clientToVB(clientX, clientY) {
  const r = overlay.getBoundingClientRect();
  return { x: (clientX - r.left) / r.width * VBW, y: (clientY - r.top) / r.height * VBH };
}

// ---- rendu de la scene -----------------------------------------------------
function render() {
  // vide l'overlay
  while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
  overlay.setAttribute('viewBox', `0 0 ${VBW} ${VBH}`);
  overlay.insertAdjacentHTML('afterbegin', svgDefs()); // ombre BD persos

  const step = curStep();
  if (step) {
    for (const el of step.elements) overlay.appendChild(buildElementNode(el, 1));
  }
  if (state.calib) drawCalibHandles();
  renderInspector();
  renderStepChips();
  if (document.body.classList.contains('projection')) updateProjUI();
  const hint = $('#emptyHint');
  if (hint) hint.classList.toggle('show',
    step && step.elements.length === 0 && !state.calib && !state.playing
    && !document.body.classList.contains('projection'));
}

// construit le noeud SVG d'un element (opacity pour la lecture)
function buildElementNode(el, opacity) {
  const g = svgEl('g', { class: 'el', 'data-id': el.id });
  if (opacity != null && opacity < 1) g.setAttribute('opacity', opacity.toFixed(3));
  if (el.id === state.selectedId) g.classList.add('selected');

  if (el.type === 'arrow') {
    g.innerHTML = arrowMarkup(el);
  } else if (el.type === 'zone') {
    g.innerHTML = zoneMarkup(el);
  } else if (el.type === 'image') {
    g.innerHTML = imageMarkup(el);
  } else if (el.type === 'text') {
    const p = projPx(el.u, el.v);
    const s = (el.scaleMul || 1) * p.scale;
    g.setAttribute('transform', `translate(${p.x},${p.y}) scale(${s}) rotate(${el.rotation || 0})`);
    g.innerHTML = textSVG(el) + (el.id === state.selectedId ? selBox(TEXT_BASE * 1.4) : '');
  } else {
    // icones ponctuelles
    const p = projPx(el.u, el.v);
    const s = ICON_BASE * (el.scaleMul || 1) * p.scale;
    g.setAttribute('transform', `translate(${p.x},${p.y}) scale(${s})`);
    g.innerHTML = iconSVG(el) + (el.id === state.selectedId ? selBox(60) : '');
  }
  return g;
}

// echantillonne A->B en (u,v) et projette -> points ecran (perspective)
function arrowPoints(el, n) {
  const pts = [];
  const k = n || 10;
  for (let i = 0; i <= k; i++) {
    const t = i / k;
    const u = el.u + (el.u2 - el.u) * t;
    const v = el.v + (el.v2 - el.v) * t;
    pts.push(projPx(u, v));
  }
  return pts;
}
function arrowMarkup(el) {
  const pts = arrowPoints(el, el.kind === 'throw' ? 2 : 10);
  const color = el.hex || '#1A1A2E';
  let m = arrowSVG(pts, el.kind, color, 8);
  if (el.id === state.selectedId) {
    const a = projPx(el.u, el.v), b = projPx(el.u2, el.v2);
    m += handleDot(a.x, a.y, 'a') + handleDot(b.x, b.y, 'b');
  }
  return m;
}
function zonePoints(el) {
  if (el.shape === 'circle') {
    const cx = (el.u + el.u2) / 2, cy = (el.v + el.v2) / 2;
    const ru = Math.abs(el.u2 - el.u) / 2, rv = Math.abs(el.v2 - el.v) / 2;
    const pts = [];
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      pts.push(projPx(cx + Math.cos(a) * ru, cy + Math.sin(a) * rv));
    }
    return pts;
  }
  return [
    projPx(el.u, el.v), projPx(el.u2, el.v),
    projPx(el.u2, el.v2), projPx(el.u, el.v2),
  ];
}
function zoneMarkup(el) {
  let m = zoneSVG(zonePoints(el), el.hex || univHex());
  if (el.id === state.selectedId) {
    const b = projPx(el.u2, el.v2);
    m += handleDot(b.x, b.y, 'b');
  }
  return m;
}
function getAsset(el) {
  return state.scene.assets && state.scene.assets[el.assetId];
}
function imageMarkup(el) {
  const asset = getAsset(el);
  if (!asset) return '';
  const p = projPx(el.u, el.v);
  const s = (el.scaleMul || 1) * p.scale;
  let m = `<g transform="translate(${p.x},${p.y}) scale(${s}) rotate(${el.rotation || 0})">${imageSVG(asset)}</g>`;
  if (el.id === state.selectedId) {
    const hb = imageHalfBox(asset);
    const hw = s * hb.hw, hh = s * hb.hh;
    m += `<rect x="${p.x - hw}" y="${p.y - hh}" width="${hw * 2}" height="${hh * 2}" `
      + `fill="none" stroke="#FF2D87" stroke-width="4" stroke-dasharray="10 8"/>`
      + `<circle class="handle" data-h="size" cx="${p.x + hw}" cy="${p.y + hh}" r="11" `
      + `fill="#FFEA00" stroke="#1A1A2E" stroke-width="3"/>`;
  }
  return m;
}
function handleDot(x, y, role) {
  return `<circle class="handle" data-h="${role}" cx="${x}" cy="${y}" r="9" fill="#fff" stroke="#1A1A2E" stroke-width="3"/>`;
}
function selBox(r) {
  return `<circle class="sel-box" cx="0" cy="0" r="${r}" fill="none" stroke="#FF2D87" stroke-width="4" stroke-dasharray="10 8"/>`;
}

// ---- palette ---------------------------------------------------------------
// etat ouvert/ferme des groupes (persiste pendant la session)
const palOpen = { persos: true, joueurs: true, objets: false, fleches: false, zones: false, texte: false };

function palGroup(pal, key, title, fill) {
  const wrap = document.createElement('div');
  wrap.className = 'pal-group' + (palOpen[key] ? '' : ' closed');
  const head = document.createElement('button');
  head.className = 'pal-head';
  head.textContent = (palOpen[key] ? '▾ ' : '▸ ') + title;
  head.addEventListener('click', () => { palOpen[key] = !palOpen[key]; buildPalette(); });
  const body = document.createElement('div');
  body.className = 'pal-items';
  fill(body);
  wrap.appendChild(head); wrap.appendChild(body);
  pal.appendChild(wrap);
}
function palToolBtn(it) {
  const b = document.createElement('button');
  b.className = 'pal-item';
  b.dataset.tool = JSON.stringify(it);
  b.innerHTML = `<svg viewBox="-60 -60 120 120">${paletteIcon(it)}</svg><span>${it.label}</span>`;
  b.addEventListener('click', () => armTool(it, b));
  return b;
}
function buildPalette() {
  const pal = $('#palette');
  pal.innerHTML = '';

  palGroup(pal, 'persos', 'Mes persos', (body) => {
    const imp = document.createElement('button');
    imp.className = 'pal-item'; imp.innerHTML = '<span style="font-size:26px">＋</span><span>Importer</span>';
    imp.addEventListener('click', importCharacter);
    body.appendChild(imp);
    const assets = (state.scene && state.scene.assets) || {};
    for (const [id, a] of Object.entries(assets)) {
      const b = document.createElement('button');
      b.className = 'pal-item'; b.title = a.name;
      b.innerHTML = `<img src="${a.src}" alt="${a.name}" style="width:34px;height:34px;object-fit:contain">`
        + `<span>${a.name.slice(0, 10)}</span>`;
      b.addEventListener('click', () => placeImage(id));
      body.appendChild(b);
    }
  });

  const groups = [
    ['joueurs', 'Joueurs', PALETTE.filter((p) => p.type === 'player')],
    ['objets', 'Objets', PALETTE.filter((p) => ['ball', 'cone', 'hoop', 'pinnie'].includes(p.type))],
    ['fleches', 'Flèches', PALETTE.filter((p) => p.type === 'arrow')],
    ['zones', 'Zones', PALETTE.filter((p) => p.type === 'zone')],
    ['texte', 'Texte', PALETTE.filter((p) => p.type === 'text')],
  ];
  for (const [key, title, items] of groups) {
    palGroup(pal, key, title, (body) => items.forEach((it) => body.appendChild(palToolBtn(it))));
  }
}
function paletteIcon(it) {
  if (it.type === 'player') return iconSVG({ type: 'player', color: it.color });
  if (it.type === 'arrow') return arrowSVG([{ x: -40, y: 30 }, { x: 45, y: -25 }], it.kind, '#1A1A2E', 8);
  if (it.type === 'zone') return zoneSVG(it.shape === 'circle'
    ? [{ x: -38, y: -20 }, { x: 0, y: -32 }, { x: 38, y: -20 }, { x: 38, y: 20 }, { x: 0, y: 32 }, { x: -38, y: 20 }]
    : [{ x: -42, y: -28 }, { x: 42, y: -28 }, { x: 42, y: 28 }, { x: -42, y: 28 }], '#00E5FF');
  if (it.type === 'text') return textSVG({ text: 'GO!', style: 'onomatopee', fontSize: 44 });
  return iconSVG({ type: it.type });
}
function armTool(it, btn) {
  const already = state.tool && JSON.stringify(state.tool) === JSON.stringify(it);
  document.querySelectorAll('.pal-item.active').forEach((e) => e.classList.remove('active'));
  if (already) { state.tool = null; return; }
  state.tool = it; btn.classList.add('active');
  if (['player', 'ball', 'cone', 'hoop', 'pinnie', 'text'].includes(it.type)) {
    // placement direct au centre, puis on desarme
    addPointElement(it, 0.5, 0.5); state.tool = null; btn.classList.remove('active');
  } else {
    toast(it.type === 'arrow' ? 'Glisse de A vers B sur le terrain' : 'Glisse pour tracer la zone');
  }
}

// ---- ajout d'elements ------------------------------------------------------
function addPointElement(it, u, v) {
  const step = curStep();
  const el = { id: nextElementId(step), type: it.type, u, v };
  if (it.type === 'player') { el.color = it.color; el.label = ''; }
  if (it.type === 'hoop' || it.type === 'pinnie') el.color = it.color || (it.type === 'hoop' ? 'blanc' : 'rouge');
  if (it.type === 'text') { el.text = 'GO!'; el.style = 'onomatopee'; el.rotation = -6; el.hex = '#FFEA00'; el.fontSize = TEXT_BASE; }
  step.elements.push(el);
  selectElement(el.id);
  render(); autosave();
  return el;
}
function addSpanElement(it, u, v, u2, v2) {
  const step = curStep();
  const el = { id: nextElementId(step), type: it.type, u, v, u2, v2 };
  if (it.type === 'arrow') { el.kind = it.kind; el.hex = '#1A1A2E'; }
  if (it.type === 'zone') { el.shape = it.shape; el.hex = univHex(); }
  step.elements.push(el);
  selectElement(el.id);
  render(); autosave();
  return el;
}

function findEl(id) { return curStep().elements.find((e) => e.id === id); }
function selectElement(id) { state.selectedId = id; }

// ---- import de persos (image) ----------------------------------------------
function importCharacter() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.addEventListener('change', () => { if (inp.files[0]) readCharacter(inp.files[0]); });
  inp.click();
}
function readCharacter(file) {
  const rd = new FileReader();
  rd.onload = () => {
    const img = new Image();
    img.onload = () => {
      const d = downscale(img, 512);
      const name = file.name.replace(/\.[^.]+$/, '').slice(0, 24) || 'perso';
      const id = addAsset(state.scene, { name, src: d.src, w: d.w, h: d.h });
      buildPalette();
      placeImage(id);
      toast('Perso importé — glisse-le, redimensionne, il s\'anime entre les étapes');
    };
    img.onerror = () => toast('Image illisible');
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
}
function downscale(img, max) {
  let w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const k = Math.min(1, max / Math.max(w, h));
  w = Math.max(1, Math.round(w * k)); h = Math.max(1, Math.round(h * k));
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  c.getContext('2d').drawImage(img, 0, 0, w, h);
  return { src: c.toDataURL('image/png'), w, h }; // PNG = garde la transparence
}
function placeImage(assetId) {
  const step = curStep();
  const el = { id: nextElementId(step), type: 'image', assetId, u: 0.5, v: 0.5, scaleMul: 1, rotation: 0 };
  step.elements.push(el);
  selectElement(el.id); render(); autosave();
}

// ---- interactions pointeur sur la scene ------------------------------------
let drag = null;

overlay.addEventListener('pointerdown', (e) => {
  if (state.playing) return;
  const uv = clientToUV(e.clientX, e.clientY);

  // mode calibration : deplacer un coin
  if (state.calib) {
    const c = e.target.closest('.corner-handle');
    if (c) { drag = { type: 'corner', corner: c.dataset.corner }; overlay.setPointerCapture(e.pointerId); }
    return;
  }

  // outil trace (fleche / zone) : demarre un glisser
  if (state.tool && (state.tool.type === 'arrow' || state.tool.type === 'zone')) {
    const el = addSpanElement(state.tool, uv.u, uv.v, uv.u + 0.001, uv.v + 0.001);
    drag = { type: 'create-b', id: el.id };
    overlay.setPointerCapture(e.pointerId);
    return;
  }

  // poignee de bout d'un element selectionne
  const handle = e.target.closest('.handle');
  if (handle && state.selectedId) {
    drag = { type: 'handle', id: state.selectedId, h: handle.dataset.h };
    overlay.setPointerCapture(e.pointerId);
    return;
  }

  // clic sur un element -> selection + deplacement
  const node = e.target.closest('.el');
  if (node) {
    const id = node.dataset.id;
    selectElement(id);
    const el = findEl(id);
    drag = { type: 'move', id, startUV: uv, snap: { u: el.u, v: el.v, u2: el.u2, v2: el.v2 } };
    node.classList.add('dragging');
    overlay.setPointerCapture(e.pointerId);
    render();
    return;
  }

  // clic dans le vide -> deselection
  state.selectedId = null; render();
});

overlay.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const uv = clientToUV(e.clientX, e.clientY);

  if (drag.type === 'corner') {
    const r = overlay.getBoundingClientRect();
    const fx = clamp((e.clientX - r.left) / r.width, 0, 1);
    const fy = clamp((e.clientY - r.top) / r.height, 0, 1);
    state.config.corners[drag.corner] = { x: round4(fx), y: round4(fy) };
    rebuildProjector(); render(); return;
  }

  const el = findEl(drag.id); if (!el) return;

  if (drag.type === 'handle' && drag.h === 'size') {
    const c = projPx(el.u, el.v);
    const vb = clientToVB(e.clientX, e.clientY);
    const hb = imageHalfBox(getAsset(el));
    const localDiag = Math.hypot(hb.hw, hb.hh) || 1;
    const dist = Math.hypot(vb.x - c.x, vb.y - c.y);
    el.scaleMul = clamp(dist / (localDiag * c.scale), 0.2, 6);
    render(); return;
  }
  if (drag.type === 'create-b' || (drag.type === 'handle' && drag.h === 'b')) {
    el.u2 = clamp(uv.u, -0.2, 1.2); el.v2 = clamp(uv.v, -0.2, 1.2);
  } else if (drag.type === 'handle' && drag.h === 'a') {
    el.u = clamp(uv.u, -0.2, 1.2); el.v = clamp(uv.v, -0.2, 1.2);
  } else if (drag.type === 'move') {
    const du = uv.u - drag.startUV.u, dv = uv.v - drag.startUV.v;
    el.u = drag.snap.u + du; el.v = drag.snap.v + dv;
    if (drag.snap.u2 != null) { el.u2 = drag.snap.u2 + du; el.v2 = drag.snap.v2 + dv; }
  }
  render();
});

overlay.addEventListener('pointerup', (e) => {
  if (!drag) return;
  if (drag.type === 'create-b') state.tool = null,
    document.querySelectorAll('.pal-item.active').forEach((x) => x.classList.remove('active'));
  const wasCalib = drag.type === 'corner';
  drag = null;
  try { overlay.releasePointerCapture(e.pointerId); } catch (_) {}
  if (!wasCalib) autosave();
  render();
});

function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function round4(x) { return Math.round(x * 1e4) / 1e4; }

// ---- inspecteur (element selectionne) --------------------------------------
function renderInspector() {
  if (!state.selectedId) { inspector.classList.remove('show'); return; }
  const el = findEl(state.selectedId);
  if (!el) { inspector.classList.remove('show'); state.selectedId = null; return; }
  inspector.classList.add('show');
  let html = `<h4>✏️ ${labelFor(el)}</h4>`;

  if (el.type === 'player') {
    html += `<label>Numéro / lettre</label><input type="text" id="insLabel" maxlength="3" value="${el.label || ''}">`;
    html += colorSwatches(el.color);
  } else if (el.type === 'hoop' || el.type === 'pinnie') {
    html += colorSwatches(el.color);
  } else if (el.type === 'text') {
    html += `<label>Texte</label><input type="text" id="insText" value="${(el.text || '').replace(/"/g, '&quot;')}">`;
    html += `<label>Style</label><select id="insStyle">
      <option value="onomatopee"${el.style === 'onomatopee' ? ' selected' : ''}>Onomatopée BD</option>
      <option value="libre"${el.style !== 'onomatopee' ? ' selected' : ''}>Texte libre</option></select>`;
    html += `<div class="row"><button class="btn small" data-rot="-15">⟲ 15°</button><button class="btn small" data-rot="15">15° ⟳</button></div>`;
  } else if (el.type === 'arrow') {
    html += `<label>Type</label><select id="insKind">
      <option value="run"${el.kind === 'run' ? ' selected' : ''}>Course</option>
      <option value="pass"${el.kind === 'pass' ? ' selected' : ''}>Passe</option>
      <option value="throw"${el.kind === 'throw' ? ' selected' : ''}>Lancer</option></select>`;
  } else if (el.type === 'image') {
    const nm = (getAsset(el) && getAsset(el).name) || 'perso';
    html += `<label>${nm}</label>
      <div class="row"><button class="btn small" data-size="0.85">➖ Petit</button>
      <button class="btn small" data-size="1.18">➕ Grand</button></div>
      <div class="row"><button class="btn small" data-rot="-15">⟲ 15°</button>
      <button class="btn small" data-rot="15">15° ⟳</button></div>
      <div style="font-size:11px;opacity:.6;margin-top:4px">Poignée jaune = redimensionner</div>`;
  }

  html += `<div class="row">
    <button class="btn small" data-act="dup">⧉ Dupliquer</button>
    <button class="btn small" data-act="front">⬆ Devant</button>
    <button class="btn small" data-act="back">⬇ Derrière</button>
    <button class="btn small btn--camps" data-act="del">🗑 Suppr.</button>
  </div>`;
  inspector.innerHTML = html;
  wireInspector(el);
}
function labelFor(el) {
  return ({ player: 'Joueur', ball: 'Ballon', cone: 'Cône', hoop: 'Cerceau',
    pinnie: 'Dossard', arrow: 'Flèche', zone: 'Zone', text: 'Texte', image: 'Perso' })[el.type] || el.type;
}
function colorSwatches(current) {
  let s = '<label>Couleur</label><div class="swatches">';
  for (const [name, def] of Object.entries(PLAYER_COLORS)) {
    s += `<div class="swatch${name === current ? ' on' : ''}" data-color="${name}" title="${name}" style="background:${def.hex}"></div>`;
  }
  return s + '</div>';
}
function wireInspector(el) {
  const li = inspector.querySelector('#insLabel');
  if (li) li.addEventListener('input', () => { el.label = li.value; render(); autosave(); });
  const it = inspector.querySelector('#insText');
  if (it) it.addEventListener('input', () => { el.text = it.value; render(); autosave(); });
  const is = inspector.querySelector('#insStyle');
  if (is) is.addEventListener('change', () => { el.style = is.value; render(); autosave(); });
  const ik = inspector.querySelector('#insKind');
  if (ik) ik.addEventListener('change', () => { el.kind = ik.value; render(); autosave(); });
  inspector.querySelectorAll('.swatch').forEach((sw) =>
    sw.addEventListener('click', () => { el.color = sw.dataset.color; render(); autosave(); }));
  inspector.querySelectorAll('[data-rot]').forEach((b) =>
    b.addEventListener('click', () => { el.rotation = (el.rotation || 0) + (+b.dataset.rot); render(); autosave(); }));
  inspector.querySelectorAll('[data-size]').forEach((b) =>
    b.addEventListener('click', () => { el.scaleMul = clamp((el.scaleMul || 1) * (+b.dataset.size), 0.2, 6); render(); autosave(); }));
  inspector.querySelectorAll('[data-act]').forEach((b) =>
    b.addEventListener('click', () => inspectorAction(b.dataset.act, el)));
}
function inspectorAction(act, el) {
  const step = curStep();
  const i = step.elements.indexOf(el);
  if (act === 'del') { step.elements.splice(i, 1); state.selectedId = null; }
  else if (act === 'dup') {
    const copy = { ...el, id: nextElementId(step), u: el.u + 0.04, v: el.v + 0.04 };
    if (el.u2 != null) { copy.u2 = el.u2 + 0.04; copy.v2 = el.v2 + 0.04; }
    step.elements.push(copy); state.selectedId = copy.id;
  } else if (act === 'front') { step.elements.splice(i, 1); step.elements.push(el); }
  else if (act === 'back') { step.elements.splice(i, 1); step.elements.unshift(el); }
  render(); autosave();
}

// ---- etapes ----------------------------------------------------------------
function renderStepChips() {
  const wrap = $('#stepChips'); wrap.innerHTML = '';
  state.scene.steps.forEach((s, i) => {
    const chip = document.createElement('div');
    chip.className = 'step-chip' + (i === state.stepIndex ? ' active' : '');
    chip.innerHTML = `<span class="num">${i + 1}</span>`;
    const inp = document.createElement('input');
    inp.className = 'step-title-in'; inp.value = s.title;
    inp.addEventListener('click', (e) => e.stopPropagation());
    inp.addEventListener('input', () => { s.title = inp.value; autosave(); });
    chip.appendChild(inp);
    if (state.scene.steps.length > 1) {
      const x = document.createElement('span');
      x.textContent = '✕'; x.style.cursor = 'pointer'; x.title = 'Supprimer l\'étape';
      x.addEventListener('click', (e) => { e.stopPropagation(); deleteStep(i); });
      chip.appendChild(x);
    }
    chip.addEventListener('click', () => { state.stepIndex = i; state.selectedId = null; render(); });
    wrap.appendChild(chip);
  });
}
function deleteStep(i) {
  if (state.scene.steps.length <= 1) return;
  state.scene.steps.splice(i, 1);
  state.stepIndex = Math.min(state.stepIndex, state.scene.steps.length - 1);
  state.selectedId = null; render(); autosave();
}

// ---- lecture (interpolation entre etapes) ----------------------------------
function play() {
  if (state.playing || state.scene.steps.length < 2) {
    if (state.scene.steps.length < 2) toast('Ajoute au moins 2 étapes');
    return;
  }
  state.playing = true; state.selectedId = null;
  inspector.classList.remove('show');
  const steps = state.scene.steps;
  const DUR = 900, HOLD = 500;
  let seg = 0, segStart = performance.now(), holding = false;

  function frame(now) {
    if (!state.playing) return;
    let t = (now - segStart) / DUR;
    if (holding) { if (now - segStart >= HOLD) { holding = false; seg++; segStart = now; } t = seg < steps.length ? 0 : 1; }
    if (!holding) {
      if (t >= 1) { t = 1; holding = true; segStart = now; }
      const a = steps[seg], b = steps[Math.min(seg + 1, steps.length - 1)];
      drawInterpolated(interpolateSteps(a, b, easeInOut(t)));
      $('#stepChips').querySelectorAll('.step-chip').forEach((c, i) =>
        c.classList.toggle('active', i === (t < 1 ? seg : seg + 1)));
    }
    if (seg >= steps.length - 1 && t >= 1 && !holding) { stopPlay(); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
function drawInterpolated(elements) {
  while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
  for (const el of elements) overlay.appendChild(buildElementNode(el, el._opacity));
}
function stopPlay() { state.playing = false; render(); }
function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

// ---- historique annuler/refaire ---------------------------------------------
const history = { undo: [], redo: [] };
let snapT = null;
function snapshot() {
  const s = JSON.stringify(state.scene);
  if (history.undo[history.undo.length - 1] === s) return;
  history.undo.push(s);
  if (history.undo.length > 60) history.undo.shift();
  history.redo.length = 0;
}
function resetHistory() {
  history.undo.length = 0; history.redo.length = 0;
  clearTimeout(snapT);
  history.undo.push(JSON.stringify(state.scene));
}
function applySnap(s) {
  clearTimeout(snapT);
  state.scene = JSON.parse(s);
  state.stepIndex = Math.min(state.stepIndex, state.scene.steps.length - 1);
  state.selectedId = null;
  try { localStorage.setItem(storageKey(), s); } catch (_) {}
  buildPalette(); render();
}
function undo() {
  clearTimeout(snapT); snapshot(); // capture un changement en attente avant d'annuler
  if (history.undo.length < 2) { toast('Rien à annuler'); return; }
  history.redo.push(history.undo.pop());
  applySnap(history.undo[history.undo.length - 1]);
}
function redo() {
  if (!history.redo.length) { toast('Rien à refaire'); return; }
  const s = history.redo.pop();
  history.undo.push(s);
  applySnap(s);
}

// ---- sauvegarde ------------------------------------------------------------
function storageKey() { return 'zts-studio-' + (state.scene.gameId || 'libre'); }
function autosave() {
  try { localStorage.setItem(storageKey(), JSON.stringify(state.scene)); } catch (_) {}
  clearTimeout(snapT); snapT = setTimeout(snapshot, 350);
}
function loadAutosave(gameId) {
  try {
    const raw = localStorage.getItem('zts-studio-' + (gameId || 'libre'));
    return raw ? JSON.parse(raw) : null;
  } catch (_) { return null; }
}
function downloadJSON() {
  const blob = new Blob([JSON.stringify(state.scene, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `scene-${state.scene.gameId || 'libre'}.json`);
  toast('JSON téléchargé');
}
function triggerDownload(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function loadFromFile(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const sc = JSON.parse(rd.result);
      const err = validateScene(sc);
      if (err) { toast(err); return; }
      setScene(sc); toast('Scène chargée');
    } catch (_) { toast('JSON invalide'); }
  };
  rd.readAsText(file);
}

// ---- gestion de la scene / jeu ---------------------------------------------
function setScene(sc) {
  state.scene = sc; state.stepIndex = 0; state.selectedId = null;
  document.body.dataset.metier = ({ eps: 'ep', sdg: 'sdg', camps: 'camp' })[sc.univers] || 'ep';
  $('#gameName').textContent = sc.gameTitle;
  $('#gameName').title = sc.gameTitle;
  buildPalette(); render(); autosave();
  resetHistory();
}
function newScene(game) {
  const saved = loadAutosave(game ? game.id : null);
  if (saved && !validateScene(saved)) { setScene(saved); return; }
  setScene(createScene(game || null));
}

// ---- selecteur de jeu ------------------------------------------------------
async function ensureGamesIndex() {
  if (state.gamesIndex) return state.gamesIndex;
  const res = await fetch(INDEX_URL);
  state.gamesIndex = await res.json();
  return state.gamesIndex;
}
async function openPicker() {
  $('#pickModal').classList.add('show');
  const list = await ensureGamesIndex();
  renderGameList(list.slice(0, 200));
  $('#gameSearch').focus();
}
function renderGameList(games) {
  const box = $('#gameList'); box.innerHTML = '';
  for (const g of games) {
    const row = document.createElement('button');
    row.className = 'game-row';
    row.innerHTML = `<span class="ico">${g.categoryIcon || '🎯'}</span>
      <span><span class="tt">${g.title}</span><br><span class="uni">${g.univers} · ${g.categoryName || ''}</span></span>`;
    row.addEventListener('click', () => { $('#pickModal').classList.remove('show'); newScene(g); });
    box.appendChild(row);
  }
}
function wirePicker() {
  $('#btnPick').addEventListener('click', openPicker);
  $('#pickClose').addEventListener('click', () => $('#pickModal').classList.remove('show'));
  $('#pickModal').addEventListener('click', (e) => { if (e.target.id === 'pickModal') e.currentTarget.classList.remove('show'); });
  $('#gameSearch').addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    const list = state.gamesIndex || [];
    const filtered = q ? list.filter((g) => (g.title + ' ' + (g.titleEn || '')).toLowerCase().includes(q)) : list;
    renderGameList(filtered.slice(0, 200));
  });
}

// ---- calibration (touche C) ------------------------------------------------
function drawCalibHandles() {
  const order = ['farLeft', 'farRight', 'nearRight', 'nearLeft'];
  const labels = { farLeft: 'FG', farRight: 'FD', nearRight: 'AD', nearLeft: 'AG' };
  const c = state.config.corners;
  // trapeze
  const pts = order.map((k) => `${c[k].x * VBW},${c[k].y * VBH}`).join(' ');
  overlay.appendChild(svgEl('polygon', { points: pts, fill: 'rgba(255,45,135,.12)', stroke: '#FF2D87', 'stroke-width': 3, 'stroke-dasharray': '10 8' }));
  for (const k of order) {
    const x = c[k].x * VBW, y = c[k].y * VBH;
    overlay.appendChild(svgEl('circle', { class: 'corner-handle', 'data-corner': k, cx: x, cy: y, r: 13 }));
    const t = svgEl('text', { x: x, y: y - 20, 'text-anchor': 'middle', fill: '#FF2D87', 'font-family': 'Luckiest Guy', 'font-size': 22 });
    t.textContent = labels[k]; overlay.appendChild(t);
  }
}
function toggleCalib() {
  state.calib = !state.calib;
  document.body.classList.toggle('calib', state.calib);
  state.selectedId = null; render();
  toast(state.calib ? 'Calibration ON' : 'Calibration OFF');
}
function configText() {
  return JSON.stringify(state.config, null, 2);
}
function rebuildProjector() { state.projector = createProjector(state.config); }

// ---- exports ---------------------------------------------------------------
function loadImg(src) {
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => res(im); im.onerror = rej; im.src = src;
  });
}
async function ensureTerrainLoaded() {
  const im = $('#terrainImg');
  if (im.complete && im.naturalWidth) return im;
  return loadImg(TERRAIN_URL);
}

// rasterise une etape (terrain PNG + overlay) sur un canvas pleine resolution
async function stepCanvas(stepIndex) {
  const prev = { s: state.stepIndex, sel: state.selectedId, cal: state.calib };
  state.stepIndex = stepIndex; state.selectedId = null; state.calib = false;
  render();

  const W = state.config.imageWidth, H = state.config.imageHeight;
  const clone = overlay.cloneNode(true);
  clone.setAttribute('width', W); clone.setAttribute('height', H);
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const svgStr = new XMLSerializer().serializeToString(clone);
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  const terrain = await ensureTerrainLoaded();
  ctx.drawImage(terrain, 0, 0, W, H);
  const ov = await loadImg(svgUrl);
  ctx.drawImage(ov, 0, 0, W, H);

  state.stepIndex = prev.s; state.selectedId = prev.sel; state.calib = prev.cal;
  document.body.classList.toggle('calib', state.calib); render();
  return canvas;
}

async function exportPNG() {
  toast('Génération PNG…');
  const canvas = await stepCanvas(state.stepIndex);
  canvas.toBlob((b) => {
    triggerDownload(b, `studio-${state.scene.gameId || 'libre'}-etape${state.stepIndex + 1}.png`);
    toast('PNG exporté ✅');
  }, 'image/png');
}

async function exportPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) { toast('jsPDF pas encore chargé, réessaie'); return; }
  toast('Génération PDF…');
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pageW = 297, pageH = 210, margin = 12;
  const steps = state.scene.steps;
  for (let i = 0; i < steps.length; i++) {
    if (i > 0) doc.addPage();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(26, 26, 46);
    doc.text(state.scene.gameTitle, margin, 16);
    doc.setFontSize(13); doc.setTextColor(255, 45, 135);
    doc.text(`Étape ${i + 1} — ${steps[i].title}`, margin, 24);

    const canvas = await stepCanvas(i);
    const imgData = canvas.toDataURL('image/png');
    const availW = pageW - margin * 2, availH = pageH - 30 - margin;
    const ar = canvas.width / canvas.height;
    let w = availW, h = w / ar; if (h > availH) { h = availH; w = h * ar; }
    doc.addImage(imgData, 'PNG', (pageW - w) / 2, 30, w, h);

    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(140, 140, 140);
    doc.text('zonetotalsport.ca — Studio Jeu', margin, pageH - 6);
    doc.text(`${i + 1} / ${steps.length}`, pageW - margin - 12, pageH - 6);
  }
  doc.save(`studio-${state.scene.gameId || 'libre'}.pdf`);
  toast('PDF exporté ✅');
}

// ---- mode projection (plein écran TNI) --------------------------------------
function updateProjUI() {
  $('#projTitle').textContent = curStep() ? curStep().title : '';
  $('#projStep').textContent = `${state.stepIndex + 1}/${state.scene.steps.length}`;
}
function enterProjection() {
  document.body.classList.add('projection');
  state.selectedId = null; render(); updateProjUI();
  const el = document.documentElement;
  if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
}
function exitProjection() {
  document.body.classList.remove('projection');
  if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  render();
}
function toggleProjection() {
  document.body.classList.contains('projection') ? exitProjection() : enterProjection();
}
// Esc/quitter plein écran par le navigateur -> sortir aussi du mode
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && document.body.classList.contains('projection')) {
    document.body.classList.remove('projection'); render();
  }
});
function projStepDelta(d) {
  const n = state.scene.steps.length;
  state.stepIndex = (state.stepIndex + d + n) % n;
  state.selectedId = null; render(); updateProjUI();
}

// ---- enregistrement écran + voix (MediaRecorder) ----------------------------
let recState = null; // { recorder, chunks, streams }

function recSupported() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia && window.MediaRecorder);
}
function setRecButtons(on) {
  ['#btnRec', '#projRec'].forEach((s) => {
    const b = $(s); if (!b) return;
    b.classList.toggle('recording', on);
    b.textContent = on ? '⏹ STOP' : '🎙️ REC';
  });
}
async function toggleRecording() {
  if (recState) { stopRecording(); return; }
  if (!recSupported()) { toast('Enregistrement non supporté par ce navigateur'); return; }
  try {
    // 1) écran (l'utilisateur choisit l'onglet/écran dans la boîte du navigateur)
    const screen = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 }, audio: false,
    });
    // 2) micro (voix) — optionnel : on continue sans si refusé
    let mic = null;
    try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (_) { toast('Micro refusé — enregistrement sans voix'); }

    const tracks = [...screen.getVideoTracks(), ...(mic ? mic.getAudioTracks() : [])];
    const mixed = new MediaStream(tracks);
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      .find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const recorder = new MediaRecorder(mixed, mime ? { mimeType: mime } : undefined);
    const chunks = [];
    recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      triggerDownload(blob, `studio-${state.scene.gameId || 'libre'}-capture.webm`);
      toast('Vidéo téléchargée 🎥');
    };
    // si l'utilisateur arrête le partage via la barre du navigateur
    screen.getVideoTracks()[0].addEventListener('ended', () => { if (recState) stopRecording(); });

    recorder.start();
    recState = { recorder, chunks, streams: [screen, mic].filter(Boolean) };
    setRecButtons(true);
    toast('Enregistrement en cours — reclique pour arrêter');
  } catch (_) {
    toast('Capture d\'écran refusée');
  }
}
function stopRecording() {
  if (!recState) return;
  const { recorder, streams } = recState;
  recState = null;
  setRecButtons(false);
  if (recorder.state !== 'inactive') recorder.stop();
  streams.forEach((st) => st.getTracks().forEach((t) => t.stop()));
}

// ---- clavier ---------------------------------------------------------------
window.addEventListener('keydown', (e) => {
  if (e.target.matches('input, textarea, select')) return;
  if (e.key === 'c' || e.key === 'C') { toggleCalib(); }
  else if (e.key === 'p' || e.key === 'P') { toggleProjection(); }
  else if (e.key === 'ArrowRight' && document.body.classList.contains('projection')) { projStepDelta(1); }
  else if (e.key === 'ArrowLeft' && document.body.classList.contains('projection')) { projStepDelta(-1); }
  else if ((e.key === 'Delete' || e.key === 'Backspace') && state.selectedId) {
    e.preventDefault(); inspectorAction('del', findEl(state.selectedId));
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
    e.preventDefault(); e.shiftKey ? redo() : undo();
  } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd' && state.selectedId) {
    e.preventDefault(); inspectorAction('dup', findEl(state.selectedId));
  } else if (e.key === 'Escape') {
    if (state.playing) stopPlay();
    state.selectedId = null; state.tool = null;
    document.querySelectorAll('.pal-item.active').forEach((x) => x.classList.remove('active'));
    render();
  }
});

// ---- wiring boutons --------------------------------------------------------
function wireMenus() {
  document.querySelectorAll('.menu > .btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const m = btn.parentElement;
      const wasOpen = m.classList.contains('open');
      document.querySelectorAll('.menu.open').forEach((x) => x.classList.remove('open'));
      if (!wasOpen) m.classList.add('open');
    });
  });
  // un item cliqué ferme son menu ; un clic ailleurs ferme tout
  document.querySelectorAll('.menu-list button').forEach((b) =>
    b.addEventListener('click', () => b.closest('.menu').classList.remove('open')));
  document.addEventListener('click', () =>
    document.querySelectorAll('.menu.open').forEach((x) => x.classList.remove('open')));
}
function wireToolbar() {
  wireMenus();
  $('#btnLibre').addEventListener('click', () => newScene(null));
  $('#btnSave').addEventListener('click', downloadJSON);
  $('#btnLoad').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', (e) => { if (e.target.files[0]) loadFromFile(e.target.files[0]); e.target.value = ''; });
  $('#btnPng').addEventListener('click', exportPNG);
  $('#btnPdf').addEventListener('click', exportPDF);
  $('#btnAddStep').addEventListener('click', () => {
    state.scene.steps.push(createStep(state.scene, 'Étape ' + (state.scene.steps.length + 1)));
    state.stepIndex = state.scene.steps.length - 1; state.selectedId = null; render(); autosave();
  });
  $('#btnDupStep').addEventListener('click', () => {
    const dup = duplicateStep(state.scene, curStep());
    state.scene.steps.splice(state.stepIndex + 1, 0, dup);
    state.stepIndex += 1; state.selectedId = null; render(); autosave();
    toast('Étape dupliquée — déplace les éléments');
  });
  $('#btnPlay').addEventListener('click', () => state.playing ? stopPlay() : play());
  $('#btnProj').addEventListener('click', enterProjection);
  $('#btnRec').addEventListener('click', toggleRecording);
  $('#projQuit').addEventListener('click', exitProjection);
  $('#projPrev').addEventListener('click', () => projStepDelta(-1));
  $('#projNext').addEventListener('click', () => projStepDelta(1));
  $('#projPlay').addEventListener('click', () => state.playing ? stopPlay() : play());
  $('#projRec').addEventListener('click', toggleRecording);
  $('#btnUndo').addEventListener('click', undo);
  $('#btnRedo').addEventListener('click', redo);
  $('#btnHelp').addEventListener('click', () => $('#helpModal').classList.add('show'));
  $('#helpClose').addEventListener('click', () => $('#helpModal').classList.remove('show'));
  $('#helpModal').addEventListener('click', (e) => { if (e.target.id === 'helpModal') e.currentTarget.classList.remove('show'); });
  $('#calibCopy').addEventListener('click', () => {
    navigator.clipboard.writeText(configText()).then(() => toast('Config copiée'), () => toast('Copie refusée'));
  });
  $('#calibDownload').addEventListener('click', () => {
    triggerDownload(new Blob([configText()], { type: 'application/json' }), 'terrain-gym.config.json');
    toast('Config téléchargée');
  });
  $('#calibReset').addEventListener('click', async () => {
    state.config = await (await fetch(CONFIG_URL + '?t=' + Date.now())).json();
    rebuildProjector(); render(); toast('Config réinitialisée');
  });
}

// ---- init ------------------------------------------------------------------
async function init() {
  state.config = await (await fetch(CONFIG_URL)).json();
  VBW = 1000; VBH = Math.round(VBW * state.config.imageHeight / state.config.imageWidth);
  rebuildProjector();
  $('#terrainImg').src = TERRAIN_URL;
  buildPalette(); wireToolbar(); wirePicker();
  newScene(null);
}
init();
