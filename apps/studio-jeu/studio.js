// studio.js — editeur visuel Studio Jeu. Vanilla ES module.
// Logique de projection / scene deleguee aux modules purs de shared/studio-engine/.

import { createProjector } from '../../shared/studio-engine/projection.js';
import {
  createScene, createStep, duplicateStep, nextElementId, addAsset,
  interpolateSteps, validateScene, pickUnivers, PLAYER_COLORS,
  createJouee, samplePath, applyAction,
} from '../../shared/studio-engine/scene-schema.js';
import {
  PALETTE, iconSVG, arrowSVG, zoneSVG, textSVG, lineSVG,
  imageSVG, imageHalfBox, svgDefs, bubbleSVG, bubbleBox,
} from '../../shared/studio-engine/elements.js';
import { t, lang, setLang, initLang, applyStatic } from './i18n.js';

const ENGINE = '../../shared/studio-engine/';
const TERRAINS = {
  'terrain-gym': { labelKey: 'terrainGym', config: ENGINE + 'terrain-gym.config.json', image: ENGINE + 'assets/terrain-gym.png' },
  'terrain-nu':  { labelKey: 'terrainNu', config: ENGINE + 'terrain-nu.config.json', image: ENGINE + 'assets/terrain-nu.png' },
};
const DEFAULT_TERRAIN = 'terrain-nu'; // plancher nu par defaut — Joey trace ses lignes
const CONFIG_URL = TERRAINS[DEFAULT_TERRAIN].config; // reset calibration
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
  animAction: false,     // une action de jouee s'anime
  jCur: {},              // curseur de relecture par etape { stepId: n }
};

// capture permanente : chaque geste devient une action (sauf pendant une
// animation, la lecture, la calibration ou la projection)
function capturing() {
  return !state.animAction && !state.playing && !state.calib
    && !document.body.classList.contains('projection');
}

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
    // _opacity = fondu en cours (apparition/disparition d'une action de jouee)
    for (const el of step.elements) overlay.appendChild(buildElementNode(el, el._opacity != null ? el._opacity : 1));
  }
  if (state.calib) drawCalibHandles();
  renderInspector();
  renderStepChips();
  renderJoueeBar();
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
  } else if (el.type === 'line') {
    g.innerHTML = lineMarkup(el);
  } else if (el.type === 'image') {
    g.innerHTML = imageMarkup(el);
  } else if (el.type === 'bubble') {
    g.innerHTML = bubbleMarkup(el);
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
function lineMarkup(el) {
  const sA = projPx(el.u, el.v).scale, sB = projPx(el.u2, el.v2).scale;
  const w = (el.width || 8) * ((sA + sB) / 2); // epaisseur suit la profondeur moyenne
  const circle = el.shape === 'circle';
  const pts = circle ? zonePoints(el) : arrowPoints(el, 12);
  // trait invisible large en dessous = zone de clic confortable
  let m = lineSVG(pts, { hex: 'rgba(0,0,0,0)', width: Math.max(w, 26), close: circle })
    + lineSVG(pts, { hex: el.hex || '#FFFFFF', width: w, dash: !!el.dash, close: circle });
  if (el.id === state.selectedId) {
    const a = projPx(el.u, el.v), b = projPx(el.u2, el.v2);
    m += (circle ? '' : handleDot(a.x, a.y, 'a')) + handleDot(b.x, b.y, 'b');
  }
  return m;
}
function bubbleMarkup(el) {
  const pc = projPx(el.u, el.v);
  const s = (el.scaleMul || 1) * pc.scale;
  let tail = null, pt = null;
  if (el.u2 != null && el.kind !== 'rect') {
    pt = projPx(el.u2, el.v2);
    tail = { x: (pt.x - pc.x) / s, y: (pt.y - pc.y) / s };
  }
  let m = `<g transform="translate(${pc.x},${pc.y}) scale(${s})">${bubbleSVG(el, tail)}</g>`;
  if (el.id === state.selectedId) {
    const bb = bubbleBox(el);
    const hw = s * bb.hw * 1.15, hh = s * bb.hh * 1.3;
    m += `<rect x="${pc.x - hw}" y="${pc.y - hh}" width="${hw * 2}" height="${hh * 2}" `
      + `fill="none" stroke="#FF2D87" stroke-width="4" stroke-dasharray="10 8"/>`
      + `<circle class="handle" data-h="size" cx="${pc.x + hw}" cy="${pc.y + hh}" r="11" `
      + `fill="#FFEA00" stroke="#1A1A2E" stroke-width="3"/>`;
    if (pt) m += handleDot(pt.x, pt.y, 'b');
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
const palOpen = { persos: true, joueurs: true, objets: false, fleches: false, zones: false, lignes: false, texte: false, bulles: false };

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
  b.innerHTML = `<svg viewBox="-60 -60 120 120">${paletteIcon(it)}</svg><span>${lang() === 'en' && it.labelEn ? it.labelEn : it.label}</span>`;
  b.addEventListener('click', () => armTool(it, b));
  return b;
}
function buildPalette() {
  const pal = $('#palette');
  pal.innerHTML = '';

  palGroup(pal, 'persos', t('gPersos'), (body) => {
    const imp = document.createElement('button');
    imp.className = 'pal-item'; imp.innerHTML = `<span style="font-size:26px">＋</span><span>${t('gImport')}</span>`;
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
    ['joueurs', t('gJoueurs'), PALETTE.filter((p) => p.type === 'player')],
    ['objets', t('gObjets'), PALETTE.filter((p) => ['ball', 'cone', 'hoop', 'pinnie'].includes(p.type))],
    ['fleches', t('gFleches'), PALETTE.filter((p) => p.type === 'arrow')],
    ['zones', t('gZones'), PALETTE.filter((p) => p.type === 'zone')],
    ['lignes', t('gLignes'), PALETTE.filter((p) => p.type === 'line')],
    ['texte', t('gTexte'), PALETTE.filter((p) => p.type === 'text')],
    ['bulles', t('gBulles'), PALETTE.filter((p) => p.type === 'bubble')],
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
  if (it.type === 'line') {
    if (it.kind === 'circle') {
      const pts = []; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI * 2; pts.push({ x: Math.cos(a) * 40, y: Math.sin(a) * 24 }); }
      return lineSVG(pts, { hex: '#1A1A2E', width: 7, close: true });
    }
    return lineSVG([{ x: -42, y: 22 }, { x: 42, y: -22 }], { hex: '#1A1A2E', width: 8 });
  }
  if (it.type === 'text') return textSVG({ text: 'GO!', style: 'onomatopee', fontSize: 44 });
  if (it.type === 'bubble') return bubbleSVG(
    { kind: it.kind, text: it.kind === 'rect' ? 'ABC' : '...', fontSize: 26 },
    it.kind === 'rect' ? null : { x: 34, y: 46 });
  return iconSVG({ type: it.type });
}
function armTool(it, btn) {
  const already = state.tool && JSON.stringify(state.tool) === JSON.stringify(it);
  document.querySelectorAll('.pal-item.active').forEach((e) => e.classList.remove('active'));
  if (already) { state.tool = null; return; }
  state.tool = it; btn.classList.add('active');
  if (['player', 'ball', 'cone', 'hoop', 'pinnie', 'text', 'bubble'].includes(it.type)) {
    // placement direct au centre, puis on desarme
    addPointElement(it, 0.5, 0.5); state.tool = null; btn.classList.remove('active');
  } else {
    toast(it.type === 'arrow' ? t('dragAB') : it.type === 'line' ? t('dragLine') : t('dragZone'));
  }
}

// ---- ajout d'elements ------------------------------------------------------
function addPointElement(it, u, v) {
  ensureJoueeBase();
  const step = curStep();
  const el = { id: nextElementId(step), type: it.type, u, v };
  if (it.type === 'player') { el.color = it.color; el.label = ''; }
  if (it.type === 'hoop' || it.type === 'pinnie') el.color = it.color || (it.type === 'hoop' ? 'blanc' : 'rouge');
  if (it.type === 'text') {
    el.text = 'GO!'; el.rotation = -6; el.fontSize = TEXT_BASE;
    el.font = 'zts'; el.hex = '#FFEA00'; el.strokeHex = '#1A1A2E'; el.strokeW = 5; el.shadow = true;
  }
  if (it.type === 'bubble') {
    el.kind = it.kind || 'speech';
    el.text = el.kind === 'rect' ? t('defaultRule') : t('defaultBubble');
    el.fontSize = 26; el.hex = '#FFFFFF'; el.scaleMul = 1;
    if (el.kind !== 'rect') { el.u2 = u + 0.10; el.v2 = v + 0.13; }
  }
  step.elements.push(el);
  selectElement(el.id);
  if (capturing()) recordAction({ kind: 'add', element: { ...el } });
  render(); autosave();
  return el;
}
function addSpanElement(it, u, v, u2, v2) {
  ensureJoueeBase();
  const step = curStep();
  const el = { id: nextElementId(step), type: it.type, u, v, u2, v2 };
  if (it.type === 'arrow') { el.kind = it.kind; el.hex = '#1A1A2E'; }
  if (it.type === 'zone') { el.shape = it.shape; el.hex = univHex(); }
  if (it.type === 'line') {
    el.kind = it.kind;
    if (it.kind === 'circle') el.shape = 'circle';
    el.hex = '#FFFFFF'; el.width = 8; el.dash = false;
  }
  // les lignes de terrain vont derriere tout le reste
  if (it.type === 'line') step.elements.unshift(el); else step.elements.push(el);
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
      toast(t('persoOk'));
    };
    img.onerror = () => toast(t('imgBad'));
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
  ensureJoueeBase();
  const step = curStep();
  const el = { id: nextElementId(step), type: 'image', assetId, u: 0.5, v: 0.5, scaleMul: 1, rotation: 0 };
  step.elements.push(el);
  selectElement(el.id);
  if (capturing()) recordAction({ kind: 'add', element: { ...el } });
  render(); autosave();
}

// ---- jouee : enregistrement des gestes --------------------------------------
let dragPath = null, dragT0 = 0; // echantillons [[u,v,ms],...] du drag en cours

function getJouee() { return curStep().jouee || null; }
function jCurGet() {
  const j = getJouee(); if (!j) return 0;
  const c = state.jCur[curStep().id];
  return c == null ? j.actions.length : Math.min(c, j.actions.length);
}
function jCurSet(n) { state.jCur[curStep().id] = n; }

// photographie l'etat AVANT le geste (sinon le replay partirait de l'etat final)
function ensureJoueeBase() {
  const step = curStep();
  if (capturing() && !step.jouee) step.jouee = createJouee(step.elements);
}
function recordAction(action) {
  const step = curStep();
  if (!step.jouee) step.jouee = createJouee(step.elements);
  step.jouee.actions.push(action);
  jCurSet(step.jouee.actions.length);
  renderJoueeBar(); autosave();
}

function resetJouee(silent) {
  const j = getJouee(); if (!j) return;
  curStep().elements = j.base.map((e) => ({ ...e }));
  jCurSet(0); state.selectedId = null;
  render(); renderJoueeBar();
  if (!silent) autosave();
}

function clearJouee() {
  if (!getJouee()) return;
  if (!confirm(t('confirmClear'))) return;
  resetJouee(true);
  delete curStep().jouee;
  delete state.jCur[curStep().id];
  groupSel = null;
  render(); renderJoueeBar(); autosave();
  toast(t('joueeCleared'));
}

// ---- groupement d'actions ----------------------------------------------------
let groupSel = null; // null = mode normal ; Set d'indices = selection en cours

function toggleGroupMode() {
  const j = getJouee();
  if (!groupSel) {
    if (!j || j.actions.length < 2) { toast(t('groupNeed2')); return; }
    groupSel = new Set();
    toast(t('groupMode'));
  } else {
    const idx = [...groupSel].sort((a, b) => a - b);
    if (idx.length >= 2) {
      const picked = [];
      for (const i of idx) {
        const a = j.actions[i];
        if (a.kind === 'group') picked.push(...a.actions); else picked.push(a);
      }
      for (let k = idx.length - 1; k >= 0; k--) j.actions.splice(idx[k], 1);
      j.actions.splice(idx[0], 0, { kind: 'group', actions: picked });
      groupSel = null;
      resetJouee(true); jCurSet(0);
      toast(t('grouped'));
    } else {
      groupSel = null;
      if (idx.length === 1) toast(t('groupNeed2'));
    }
    autosave();
  }
  renderJoueeBar();
}
function ungroupAction(i) {
  const j = getJouee();
  const a = j.actions[i];
  if (!a || a.kind !== 'group') return;
  j.actions.splice(i, 1, ...a.actions);
  resetJouee(true); jCurSet(0);
  renderJoueeBar(); autosave();
  toast(t('ungrouped'));
}

/** Espace : joue la prochaine action (revient au debut apres la derniere). */
function playNextAction() {
  const j = getJouee();
  if (!j || !j.actions.length) { toast(t('noJouee')); return; }
  if (state.animAction || state.playing) return;
  let cur = jCurGet();
  if (cur >= j.actions.length) { resetJouee(true); cur = 0; }
  animateAction(j.actions[cur], () => { jCurSet(cur + 1); renderJoueeBar(); autosave(); });
}

// anime une action ; un 'group' joue toutes ses sous-actions EN MEME TEMPS
// (ex. plusieurs joueurs apparaissent ensemble, chacun en fondu)
function animateAction(action, done) {
  const step = curStep();
  state.animAction = true; state.selectedId = null;
  document.body.classList.add('animating'); // curseur masque
  const finishAll = () => {
    step.elements.forEach((e) => { delete e._opacity; });
    render(); state.animAction = false;
    document.body.classList.remove('animating');
    done();
  };
  const subs = action.kind === 'group' ? (action.actions || []) : [action];
  let left = subs.length;
  if (!left) { finishAll(); return; }
  const doneOne = () => { if (--left === 0) finishAll(); };
  for (const a of subs) runOneAnim(step, a, doneOne);
}

// anime UNE action simple ; applique son etat final puis appelle done()
function runOneAnim(step, action, done) {
  const finish = () => { applyAction(step.elements, actionForApply(action)); done(); };

  if (action.kind === 'move' || action.kind === 'pose') {
    const el = step.elements.find((e) => e.id === action.elementId);
    if (!el) { finish(); return; }
    const from = {};
    if (action.kind === 'pose') for (const k in action.after) from[k] = el[k];
    const recDur = action.kind === 'move' ? (action.path[action.path.length - 1][2] || 600) : 500;
    const dur = Math.max(400, Math.min(2500, recDur));
    const t0 = performance.now();
    (function frame(now) {
      const tt = Math.min(1, (now - t0) / dur);
      if (action.kind === 'move') {
        const p = samplePath(action.path, tt);
        if (p) { el.u = p.u; el.v = p.v; }
      } else {
        const e2 = easeInOut(tt);
        for (const k in action.after) {
          if (typeof action.after[k] === 'number' && typeof from[k] === 'number') {
            el[k] = from[k] + (action.after[k] - from[k]) * e2;
          }
        }
      }
      render();
      tt < 1 ? requestAnimationFrame(frame) : finish();
    })(t0);
  } else if (action.kind === 'add' || action.kind === 'remove') {
    // fondu 300 ms
    let el;
    if (action.kind === 'add') { el = { ...action.element, _opacity: 0 }; step.elements.push(el); }
    else { el = step.elements.find((e) => e.id === action.elementId); }
    if (!el) { finish(); return; }
    const t0 = performance.now();
    (function frame(now) {
      const tt = Math.min(1, (now - t0) / 300);
      el._opacity = action.kind === 'add' ? tt : 1 - tt;
      render();
      tt < 1 ? requestAnimationFrame(frame) : finish();
    })(t0);
  } else { finish(); }
}
// l'add anime insere deja l'element : applyAction ne doit pas le dupliquer
function actionForApply(action) {
  if (action.kind !== 'add') return action;
  const step = curStep();
  if (step.elements.some((e) => e.id === action.element.id)) return { kind: 'noop' };
  return action;
}

function renderJoueeBar() {
  const chips = $('#joueeChips'); if (!chips) return;
  chips.innerHTML = '';
  const j = getJouee();
  const has = j && j.actions.length > 0;
  $('#btnJoueeReset').disabled = !has;
  $('#btnJoueeNext').disabled = !has;
  $('#btnJoueeClear').disabled = !has;
  $('#btnJoueeSave').disabled = false;
  const gb = $('#btnJoueeGroup');
  gb.disabled = !has || (!groupSel && j.actions.length < 2);
  gb.textContent = groupSel ? t('groupOkBtn') : t('groupBtn');
  gb.classList.toggle('arming', !!groupSel);
  if (!j) return;
  const cur = jCurGet();
  const KINDS = { move: t('kMove'), pose: t('kPose'), add: t('kAdd'), remove: t('kRemove'), group: t('kGroup') };
  j.actions.forEach((a, i) => {
    const isGroup = a.kind === 'group';
    const c = document.createElement('button');
    c.className = 'jouee-chip' + (i < cur ? ' done' : '') + (i === cur ? ' next' : '')
      + (isGroup ? ' group' : '') + (groupSel && groupSel.has(i) ? ' pick' : '');
    const kindLbl = isGroup ? `${t('kGroup')} (${a.actions.length})` : (KINDS[a.kind] || a.kind);
    c.title = kindLbl + (isGroup ? t('chipHintGroup') : t('chipHint'));
    const num = document.createElement('span');
    num.textContent = isGroup ? `${i + 1}⧉${a.actions.length}` : i + 1;
    c.appendChild(num);
    if (groupSel) {
      // mode selection : clic = choisir/deselectionner
      c.addEventListener('click', () => {
        groupSel.has(i) ? groupSel.delete(i) : groupSel.add(i);
        renderJoueeBar();
      });
      chips.appendChild(c);
      return;
    }
    const x = document.createElement('span'); x.className = 'chip-x'; x.textContent = '✕';
    x.title = isGroup ? t('chipUngroupT') : t('chipDelT');
    x.addEventListener('click', (e) => {
      e.stopPropagation();
      if (isGroup) { ungroupAction(i); return; }
      j.actions.splice(i, 1);
      jCurSet(Math.min(jCurGet(), j.actions.length));
      renderJoueeBar(); autosave();
      toast(t('actionDeleted'));
    });
    c.appendChild(x);
    c.addEventListener('click', () => {
      // saute juste avant l'action i : base + actions 0..i-1 appliquees d'un coup
      resetJouee(true);
      for (let k = 0; k < i; k++) applyAction(curStep().elements, j.actions[k]);
      jCurSet(i); render(); renderJoueeBar();
    });
    chips.appendChild(c);
  });
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

  // outil trace (fleche / zone / ligne) : demarre un glisser
  if (state.tool && (state.tool.type === 'arrow' || state.tool.type === 'zone' || state.tool.type === 'line')) {
    const el = addSpanElement(state.tool, uv.u, uv.v, uv.u + 0.001, uv.v + 0.001);
    drag = { type: 'create-b', id: el.id };
    overlay.setPointerCapture(e.pointerId);
    return;
  }

  // poignee de bout d'un element selectionne
  const handle = e.target.closest('.handle');
  if (handle && state.selectedId) {
    ensureJoueeBase();
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
    if (capturing()) { ensureJoueeBase(); dragPath = [[el.u, el.v, 0]]; dragT0 = performance.now(); }
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
    const hb = el.type === 'bubble' ? bubbleBox(el) : imageHalfBox(getAsset(el));
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
    if (capturing() && dragPath) {
      const ms = performance.now() - dragT0;
      const last = dragPath[dragPath.length - 1];
      if (ms - last[2] > 40 || Math.hypot(el.u - last[0], el.v - last[1]) > 0.01) {
        dragPath.push([el.u, el.v, Math.round(ms)]);
      }
    }
  }
  render();
});

overlay.addEventListener('pointerup', (e) => {
  if (!drag) return;
  if (drag.type === 'create-b') state.tool = null,
    document.querySelectorAll('.pal-item.active').forEach((x) => x.classList.remove('active'));
  if (capturing()) {
    const el = drag.id ? findEl(drag.id) : null;
    if (drag.type === 'move' && el && dragPath && dragPath.length > 1) {
      if (drag.snap.u2 != null) {
        // element a deux points (fleche, zone, ligne, bulle) : la relecture
        // doit deplacer les deux — pose plutot que chemin (qui ne bouge que u,v)
        const after = {};
        for (const k of ['u', 'v', 'u2', 'v2']) if (typeof el[k] === 'number') after[k] = el[k];
        recordAction({ kind: 'pose', elementId: el.id, after });
      } else {
        // borne le temps final : un pointerup tardif ne doit pas etirer la relecture
        const lastMs = dragPath[dragPath.length - 1][2];
        const endMs = Math.min(Math.round(performance.now() - dragT0), lastMs + 200);
        dragPath.push([el.u, el.v, endMs]);
        recordAction({ kind: 'move', elementId: el.id, path: dragPath });
      }
    } else if (drag.type === 'handle' && el) {
      const after = {};
      for (const k of ['u', 'v', 'u2', 'v2', 'scaleMul']) if (typeof el[k] === 'number') after[k] = el[k];
      recordAction({ kind: 'pose', elementId: el.id, after });
    } else if (drag.type === 'create-b' && el) {
      recordAction({ kind: 'add', element: { ...el } });
    }
  }
  dragPath = null;
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
    html += `<label>${t('numLetter')}</label><input type="text" id="insLabel" maxlength="3" value="${el.label || ''}">`;
    html += colorSwatches(el.color);
  } else if (el.type === 'hoop' || el.type === 'pinnie') {
    html += colorSwatches(el.color);
  } else if (el.type === 'text') {
    const cols = ['#FFEA00', '#FFFFFF', '#00E5FF', '#FF2D2D', '#1E90FF', '#39FF14', '#FF6B00', '#1A1A2E'];
    html += `<label>${t('textLbl')}</label><input type="text" id="insText" value="${(el.text || '').replace(/"/g, '&quot;')}">`;
    html += `<label>${t('font')}</label><select id="insFont">
      <option value="zts"${el.font === 'zts' ? ' selected' : ''}>${t('fontZts')}</option>
      <option value="luckiest"${el.font !== 'zts' ? ' selected' : ''}>Luckiest Guy</option></select>`;
    html += `<label>${t('size')} : <span id="insSizeVal">${el.fontSize || TEXT_BASE}</span></label>
      <input type="range" id="insSize" min="18" max="110" step="2" value="${el.fontSize || TEXT_BASE}" style="width:100%">`;
    html += `<label>${t('color')}</label><div class="swatches">`
      + cols.map((h) => `<div class="swatch${(el.hex || '#FFEA00').toUpperCase() === h ? ' on' : ''}" data-hex="${h}" style="background:${h}"></div>`).join('')
      + '</div>';
    html += `<input type="color" id="insHex" value="${el.hex || '#FFEA00'}" title="${t('otherColor')}" style="width:100%;height:26px;border:2px solid var(--ink);border-radius:7px;padding:0;cursor:pointer;margin-top:4px">`;
    html += `<label>${t('strokeLbl')} : <span id="insStrokeWVal">${el.strokeW != null ? el.strokeW : 5}</span></label>
      <div style="display:flex;gap:6px;align-items:center">
      <input type="range" id="insStrokeW" min="0" max="14" step="1" value="${el.strokeW != null ? el.strokeW : 5}" style="flex:1">
      <input type="color" id="insStrokeHex" value="${el.strokeHex || '#1A1A2E'}" title="${t('strokeColorT')}" style="width:34px;height:26px;border:2px solid var(--ink);border-radius:7px;padding:0;cursor:pointer"></div>`;
    html += `<label style="display:flex;gap:6px;align-items:center;margin-top:8px">
      <input type="checkbox" id="insShadow"${el.shadow ? ' checked' : ''}> ${t('shadowBD')}</label>`;
    if (el.shadow) {
      const shOff = el.shadowOff != null ? el.shadowOff : 3;
      const shAlpha = el.shadowAlpha != null ? Math.round(el.shadowAlpha * 100) : 85;
      html += `<label>${t('offsetLbl')} : <span id="insShOffVal">${shOff}</span></label>
        <input type="range" id="insShOff" min="1" max="20" step="1" value="${shOff}" style="width:100%">`;
      html += `<label>${t('intensityLbl')} : <span id="insShAlphaVal">${shAlpha}%</span></label>
        <input type="range" id="insShAlpha" min="10" max="100" step="5" value="${shAlpha}" style="width:100%">`;
    }
    html += `<div class="row"><button class="btn small" data-rot="-15">⟲ 15°</button><button class="btn small" data-rot="15">15° ⟳</button></div>`;
  } else if (el.type === 'bubble') {
    const cols = ['#FFFFFF', '#FFEA00', '#CCFAFF', '#FFD6EB', '#E8FFDA'];
    html += `<label>${t('multiline')}</label>
      <textarea id="insText" rows="3">${(el.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;')}</textarea>`;
    html += `<label>${t('styleLbl')}</label><select id="insBubbleKind">
      <option value="speech"${el.kind === 'speech' ? ' selected' : ''}>${t('bubbleSpeech')}</option>
      <option value="thought"${el.kind === 'thought' ? ' selected' : ''}>${t('bubbleThought')}</option>
      <option value="rect"${el.kind === 'rect' ? ' selected' : ''}>${t('bubbleRect')}</option></select>`;
    html += `<label>${t('textSize')} : <span id="insSizeVal">${el.fontSize || 26}</span></label>
      <input type="range" id="insSize" min="14" max="64" step="2" value="${el.fontSize || 26}" style="width:100%">`;
    html += `<label>${t('bg')}</label><div class="swatches">`
      + cols.map((h) => `<div class="swatch${(el.hex || '#FFFFFF').toUpperCase() === h ? ' on' : ''}" data-hex="${h}" style="background:${h}"></div>`).join('')
      + '</div>';
    if (el.kind !== 'rect') html += `<div style="font-size:11px;opacity:.6;margin-top:4px">${t('bubbleHandles')}</div>`;
  } else if (el.type === 'arrow') {
    html += `<label>${t('typeLbl')}</label><select id="insKind">
      <option value="run"${el.kind === 'run' ? ' selected' : ''}>${t('run')}</option>
      <option value="pass"${el.kind === 'pass' ? ' selected' : ''}>${t('pass')}</option>
      <option value="throw"${el.kind === 'throw' ? ' selected' : ''}>${t('throw')}</option></select>`;
  } else if (el.type === 'line') {
    const cols = ['#FFFFFF', '#FFEA00', '#00E5FF', '#FF2D2D', '#1E90FF', '#39FF14', '#FF6B00', '#1A1A2E'];
    html += `<label>${t('color')}</label><div class="swatches">`
      + cols.map((h) => `<div class="swatch${(el.hex || '#FFFFFF').toUpperCase() === h ? ' on' : ''}" data-hex="${h}" style="background:${h}"></div>`).join('')
      + '</div>';
    html += `<label>${t('otherColor')}</label><input type="color" id="insHex" value="${el.hex || '#FFFFFF'}" style="width:100%;height:30px;border:2px solid var(--ink);border-radius:7px;padding:0;cursor:pointer">`;
    html += `<label>${t('widthLbl')} : <span id="insWidthVal">${el.width || 8}</span></label>
      <input type="range" id="insWidth" min="2" max="30" step="1" value="${el.width || 8}" style="width:100%">`;
    html += `<label>${t('styleLbl')}</label><select id="insDash">
      <option value="0"${!el.dash ? ' selected' : ''}>${t('solid')}</option>
      <option value="1"${el.dash ? ' selected' : ''}>${t('dashed')}</option></select>`;
  } else if (el.type === 'image') {
    const nm = (getAsset(el) && getAsset(el).name) || 'perso';
    html += `<label>${nm}</label>
      <div class="row"><button class="btn small" data-size="0.85">${t('smaller')}</button>
      <button class="btn small" data-size="1.18">${t('bigger')}</button></div>
      <div class="row"><button class="btn small" data-rot="-15">⟲ 15°</button>
      <button class="btn small" data-rot="15">15° ⟳</button></div>
      <div style="font-size:11px;opacity:.6;margin-top:4px">${t('yellowHandle')}</div>`;
  }

  html += `<div class="row">
    <button class="btn small" data-act="dup">${t('dup')}</button>
    <button class="btn small" data-act="front">${t('front')}</button>
    <button class="btn small" data-act="back">${t('back')}</button>
    <button class="btn small btn--camps" data-act="del">${t('del')}</button>
  </div>`;
  inspector.innerHTML = html;
  wireInspector(el);
}
function labelFor(el) {
  return t('el_' + el.type);
}
function colorSwatches(current) {
  let s = `<label>${t('color')}</label><div class="swatches">`;
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
  const ifo = inspector.querySelector('#insFont');
  if (ifo) ifo.addEventListener('change', () => { el.font = ifo.value; render(); autosave(); });
  const isz = inspector.querySelector('#insSize');
  if (isz) isz.addEventListener('input', () => {
    el.fontSize = +isz.value;
    const lbl = inspector.querySelector('#insSizeVal'); if (lbl) lbl.textContent = isz.value;
    const node = overlay.querySelector(`.el[data-id="${el.id}"]`);
    if (node) {
      if (el.type === 'bubble') { node.innerHTML = bubbleMarkup(el); }
      else { const p = projPx(el.u, el.v); const s = (el.scaleMul || 1) * p.scale;
        node.setAttribute('transform', `translate(${p.x},${p.y}) scale(${s}) rotate(${el.rotation || 0})`);
        node.innerHTML = textSVG(el) + (el.id === state.selectedId ? selBox((el.fontSize || TEXT_BASE) * 1.4) : ''); }
    }
    autosave();
  });
  const refreshTextNode = () => {
    const node = overlay.querySelector(`.el[data-id="${el.id}"]`);
    if (node) node.innerHTML = textSVG(el) + (el.id === state.selectedId ? selBox((el.fontSize || TEXT_BASE) * 1.4) : '');
  };
  const iso = inspector.querySelector('#insShOff');
  if (iso) iso.addEventListener('input', () => {
    el.shadowOff = +iso.value;
    const lbl = inspector.querySelector('#insShOffVal'); if (lbl) lbl.textContent = iso.value;
    refreshTextNode(); autosave();
  });
  const isa = inspector.querySelector('#insShAlpha');
  if (isa) isa.addEventListener('input', () => {
    el.shadowAlpha = +isa.value / 100;
    const lbl = inspector.querySelector('#insShAlphaVal'); if (lbl) lbl.textContent = isa.value + '%';
    refreshTextNode(); autosave();
  });
  const ibk = inspector.querySelector('#insBubbleKind');
  if (ibk) ibk.addEventListener('change', () => {
    el.kind = ibk.value;
    if (el.kind === 'rect') { delete el.u2; delete el.v2; }
    else if (el.u2 == null) { el.u2 = el.u + 0.10; el.v2 = el.v + 0.13; }
    render(); autosave();
  });
  const isw = inspector.querySelector('#insStrokeW');
  if (isw) isw.addEventListener('input', () => {
    el.strokeW = +isw.value;
    const lbl = inspector.querySelector('#insStrokeWVal'); if (lbl) lbl.textContent = isw.value;
    const node = overlay.querySelector(`.el[data-id="${el.id}"]`);
    if (node) node.innerHTML = textSVG(el) + (el.id === state.selectedId ? selBox((el.fontSize || TEXT_BASE) * 1.4) : '');
    autosave();
  });
  const ish = inspector.querySelector('#insStrokeHex');
  if (ish) ish.addEventListener('input', () => { el.strokeHex = ish.value; render(); autosave(); });
  const ichk = inspector.querySelector('#insShadow');
  if (ichk) ichk.addEventListener('change', () => { el.shadow = ichk.checked; render(); autosave(); });
  const ik = inspector.querySelector('#insKind');
  if (ik) ik.addEventListener('change', () => { el.kind = ik.value; render(); autosave(); });
  inspector.querySelectorAll('.swatch[data-color]').forEach((sw) =>
    sw.addEventListener('click', () => { el.color = sw.dataset.color; render(); autosave(); }));
  inspector.querySelectorAll('.swatch[data-hex]').forEach((sw) =>
    sw.addEventListener('click', () => { el.hex = sw.dataset.hex; render(); autosave(); }));
  const ihx = inspector.querySelector('#insHex');
  if (ihx) ihx.addEventListener('input', () => { el.hex = ihx.value; render(); autosave(); });
  const iw = inspector.querySelector('#insWidth');
  if (iw) iw.addEventListener('input', () => {
    el.width = +iw.value;
    const lbl = inspector.querySelector('#insWidthVal'); if (lbl) lbl.textContent = iw.value;
    // re-render leger sans reconstruire l'inspecteur (sinon le slider perd le focus)
    const node = overlay.querySelector(`.el[data-id="${el.id}"]`);
    if (node) node.innerHTML = lineMarkup(el);
    autosave();
  });
  const idh = inspector.querySelector('#insDash');
  if (idh) idh.addEventListener('change', () => { el.dash = idh.value === '1'; render(); autosave(); });
  inspector.querySelectorAll('[data-rot]').forEach((b) =>
    b.addEventListener('click', () => { el.rotation = (el.rotation || 0) + (+b.dataset.rot); render(); autosave(); }));
  inspector.querySelectorAll('[data-size]').forEach((b) =>
    b.addEventListener('click', () => { el.scaleMul = clamp((el.scaleMul || 1) * (+b.dataset.size), 0.2, 6); render(); autosave(); }));
  inspector.querySelectorAll('[data-act]').forEach((b) =>
    b.addEventListener('click', () => inspectorAction(b.dataset.act, el)));
}
function inspectorAction(act, el) {
  ensureJoueeBase();
  const step = curStep();
  const i = step.elements.indexOf(el);
  if (act === 'del') {
    if (capturing()) recordAction({ kind: 'remove', elementId: el.id });
    step.elements.splice(i, 1); state.selectedId = null;
  }
  else if (act === 'dup') {
    const copy = { ...el, id: nextElementId(step), u: el.u + 0.04, v: el.v + 0.04 };
    if (el.u2 != null) { copy.u2 = el.u2 + 0.04; copy.v2 = el.v2 + 0.04; }
    step.elements.push(copy); state.selectedId = copy.id;
    if (capturing()) recordAction({ kind: 'add', element: { ...copy } });
  } else if (act === 'front') { step.elements.splice(i, 1); step.elements.push(el); }
  else if (act === 'back') { step.elements.splice(i, 1); step.elements.unshift(el); }
  render(); autosave();
}

// ---- etapes ----------------------------------------------------------------
function renderStepChips() {
  const wrap = $('#stepChips'); wrap.innerHTML = '';
  // les etapes ne s'affichent que sur les anciennes scenes multi-etapes
  const legacy = state.scene.steps.length > 1;
  const bp = $('#btnPlay'); if (bp) bp.hidden = !legacy;
  if (!legacy) return;
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
      x.textContent = '✕'; x.style.cursor = 'pointer'; x.title = t('stepDelT');
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
    if (state.scene.steps.length < 2) toast(t('add2'));
    return;
  }
  state.playing = true; state.selectedId = null;
  inspector.classList.remove('show');
  document.body.classList.add('animating'); // curseur masque pendant la lecture
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
function stopPlay() { state.playing = false; document.body.classList.remove('animating'); render(); }
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
  $('#sceneTitle').value = state.scene.title || '';
  applyTitleStyle();
  buildPalette(); render();
}
function undo() {
  clearTimeout(snapT); snapshot(); // capture un changement en attente avant d'annuler
  if (history.undo.length < 2) { toast(t('nothingUndo')); return; }
  history.redo.push(history.undo.pop());
  applySnap(history.undo[history.undo.length - 1]);
}
function redo() {
  if (!history.redo.length) { toast(t('nothingRedo')); return; }
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
function downloadJSON(msg) {
  const blob = new Blob([JSON.stringify(state.scene, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `scene-${state.scene.gameId || 'libre'}.json`);
  toast(msg || t('jsonDl'));
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
      setScene(sc); toast(t('sceneLoaded'));
    } catch (_) { toast(t('jsonBad')); }
  };
  rd.readAsText(file);
}

// ---- style du titre de scene -------------------------------------------------
// scene.titleStyle = { hex, strokeW, strokeHex, shadowOff, shadowAlpha }
function titleStyle() {
  if (!state.scene.titleStyle) state.scene.titleStyle = {};
  return state.scene.titleStyle;
}
function applyTitleStyle() {
  const ts = state.scene.titleStyle || {};
  const inp = $('#sceneTitle');
  inp.style.color = ts.hex || '#1A1A2E';
  inp.style.webkitTextStroke = (ts.strokeW || 0) > 0 ? `${ts.strokeW}px ${ts.strokeHex || '#FFFFFF'}` : '';
  const off = ts.shadowOff || 0;
  inp.style.textShadow = off > 0
    ? `${off}px ${off}px 0 rgba(26,26,46,${ts.shadowAlpha != null ? ts.shadowAlpha : 0.85})` : '';
}
function renderTitlePanel() {
  const p = $('#titlePanel');
  const ts = titleStyle();
  const cols = ['#1A1A2E', '#FFEA00', '#FFFFFF', '#00E5FF', '#FF2D2D', '#FF6B00'];
  const shOff = ts.shadowOff || 0;
  const shAlpha = ts.shadowAlpha != null ? Math.round(ts.shadowAlpha * 100) : 85;
  p.innerHTML = `<h4>${t('titlePanelT')}</h4>`
    + `<label>${t('textColor')}</label><div class="swatches">`
    + cols.map((h) => `<div class="swatch${(ts.hex || '#1A1A2E').toUpperCase() === h ? ' on' : ''}" data-hex="${h}" style="background:${h}"></div>`).join('')
    + '</div>'
    + `<label>${t('strokeLbl')} : <span id="tpStrokeVal">${ts.strokeW || 0}</span></label>
      <div style="display:flex;gap:6px;align-items:center">
      <input type="range" id="tpStroke" min="0" max="14" step="1" value="${ts.strokeW || 0}" style="flex:1">
      <input type="color" id="tpStrokeHex" value="${ts.strokeHex || '#FFFFFF'}" title="${t('strokeColorT')}" style="width:34px;height:26px;border:2px solid var(--ink);border-radius:7px;padding:0;cursor:pointer"></div>`
    + `<label>${t('shadowBD')} — ${t('offsetLbl').toLowerCase()} : <span id="tpShOffVal">${shOff}</span></label>
      <input type="range" id="tpShOff" min="0" max="20" step="1" value="${shOff}" style="width:100%">`
    + `<label>${t('intensityLbl')} : <span id="tpShAlphaVal">${shAlpha}%</span></label>
      <input type="range" id="tpShAlpha" min="10" max="100" step="5" value="${shAlpha}" style="width:100%">`;
  const upd = () => { applyTitleStyle(); autosave(); };
  p.querySelectorAll('.swatch[data-hex]').forEach((sw) =>
    sw.addEventListener('click', () => { ts.hex = sw.dataset.hex; renderTitlePanel(); upd(); }));
  p.querySelector('#tpStroke').addEventListener('input', (e) => {
    ts.strokeW = +e.target.value; p.querySelector('#tpStrokeVal').textContent = e.target.value; upd();
  });
  p.querySelector('#tpStrokeHex').addEventListener('input', (e) => { ts.strokeHex = e.target.value; upd(); });
  p.querySelector('#tpShOff').addEventListener('input', (e) => {
    ts.shadowOff = +e.target.value; p.querySelector('#tpShOffVal').textContent = e.target.value; upd();
  });
  p.querySelector('#tpShAlpha').addEventListener('input', (e) => {
    ts.shadowAlpha = +e.target.value / 100; p.querySelector('#tpShAlphaVal').textContent = e.target.value + '%'; upd();
  });
}

// ---- gestion de la scene / jeu ---------------------------------------------
function setScene(sc) {
  state.scene = sc; state.stepIndex = 0; state.selectedId = null;
  const tid = TERRAINS[sc.terrain] ? sc.terrain : DEFAULT_TERRAIN;
  if (tid !== state.terrainId) loadTerrain(tid).then(() => render());
  document.body.dataset.metier = ({ eps: 'ep', sdg: 'sdg', camps: 'camp' })[sc.univers] || 'ep';
  $('#gameName').textContent = sc.gameTitle;
  $('#gameName').title = sc.gameTitle;
  $('#sceneTitle').value = sc.title || '';
  applyTitleStyle();
  buildPalette(); render(); autosave();
  resetHistory();
}
function newScene(game) {
  const saved = loadAutosave(game ? game.id : null);
  if (saved && !validateScene(saved)) { setScene(saved); return; }
  const sc = createScene(game || null);
  sc.terrain = DEFAULT_TERRAIN;
  if (!game) sc.gameTitle = t('freeScene');
  if (sc.steps[0]) sc.steps[0].title = t('setup');
  setScene(sc);
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
  toast(state.calib ? t('calibOn') : t('calibOff'));
}
function configText() {
  return JSON.stringify(state.config, null, 2);
}
function rebuildProjector() { state.projector = createProjector(state.config); }

// ---- terrains (fonds interchangeables) ---------------------------------------
const configCache = {};
async function loadTerrain(id) {
  const def = TERRAINS[id] || TERRAINS[DEFAULT_TERRAIN];
  if (!configCache[id]) configCache[id] = await (await fetch(def.config)).json();
  state.config = configCache[id];
  state.terrainId = id;
  VBW = 1000; VBH = Math.round(VBW * state.config.imageHeight / state.config.imageWidth);
  rebuildProjector();
  $('#terrainImg').src = def.image;
  buildTerrainMenu();
}
async function switchTerrain(id) {
  if (!TERRAINS[id]) return;
  state.scene.terrain = id;
  await loadTerrain(id);
  render(); autosave();
  toast(t('terrainSet') + t(TERRAINS[id].labelKey).replace(/^\S+\s/, ''));
}
function buildTerrainMenu() {
  const list = $('#terrainMenuList'); if (!list) return;
  list.innerHTML = '';
  for (const [id, def] of Object.entries(TERRAINS)) {
    const b = document.createElement('button');
    b.textContent = (id === state.terrainId ? '✓ ' : '') + t(def.labelKey);
    b.addEventListener('click', () => { b.closest('.menu').classList.remove('open'); switchTerrain(id); });
    list.appendChild(b);
  }
}

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
  return loadImg(im.src);
}

// police maison en data-URI pour les exports (le SVG rasterise n'herite pas du CSS)
let ztsFontURI = null;
async function fontDataURI() {
  if (ztsFontURI != null) return ztsFontURI;
  try {
    const buf = await (await fetch('../../fonts/ZoneTotalSport.ttf')).arrayBuffer();
    const b = new Uint8Array(buf); let s = '';
    for (let i = 0; i < b.length; i += 8192) s += String.fromCharCode.apply(null, b.subarray(i, i + 8192));
    ztsFontURI = 'data:font/ttf;base64,' + btoa(s);
  } catch (_) { ztsFontURI = ''; }
  return ztsFontURI;
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
  const fd = await fontDataURI();
  if (fd) clone.insertAdjacentHTML('afterbegin',
    `<style>@font-face{font-family:'ZoneTotalSport';src:url(${fd}) format('truetype');size-adjust:50%;}</style>`);
  if (state.scene.title) {
    // bandeau blanc du titre de scene (meme rendu + style que l'editeur)
    const escT = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const ts = state.scene.titleStyle || {};
    const fs = 64; // ZoneTotalSport size-adjust 50% => ~32 u visuel
    const bw = Math.min(VBW * 0.86, Math.max(state.scene.title.length * fs * 0.30 + 44, 240));
    const bh = fs * 0.82;
    const sw = (ts.strokeW || 0) * 1.2;
    const off = (ts.shadowOff || 0) * 1.2;
    const alpha = ts.shadowAlpha != null ? ts.shadowAlpha : 0.85;
    const shCol = `rgba(26,26,46,${alpha})`;
    const txt = (dx, dy, fill, stroke) =>
      `<text x="${VBW / 2 + dx}" y="${16 + bh / 2 + dy}" text-anchor="middle" dominant-baseline="central" `
      + `font-family="'ZoneTotalSport','Luckiest Guy',sans-serif" font-size="${fs}" fill="${fill}" `
      + `stroke="${stroke}" stroke-width="${sw}" paint-order="stroke" stroke-linejoin="round">${escT(state.scene.title)}</text>`;
    clone.insertAdjacentHTML('beforeend',
      `<g><rect x="${(VBW - bw) / 2}" y="16" width="${bw}" height="${bh}" rx="14" fill="#FFFFFF" stroke="#1A1A2E" stroke-width="5"/>`
      + (off > 0 ? txt(off, off, shCol, sw > 0 ? shCol : 'none') : '')
      + txt(0, 0, ts.hex || '#1A1A2E', sw > 0 ? (ts.strokeHex || '#FFFFFF') : 'none')
      + '</g>');
  }
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
  toast(t('pngGen'));
  const canvas = await stepCanvas(state.stepIndex);
  canvas.toBlob((b) => {
    triggerDownload(b, `studio-${state.scene.gameId || 'libre'}-etape${state.stepIndex + 1}.png`);
    toast(t('pngOk'));
  }, 'image/png');
}

async function exportPDF() {
  if (!window.jspdf || !window.jspdf.jsPDF) { toast(t('pdfWait')); return; }
  toast(t('pdfGen'));
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pageW = 297, pageH = 210, margin = 12;
  const steps = state.scene.steps;
  for (let i = 0; i < steps.length; i++) {
    if (i > 0) doc.addPage();
    doc.setFont('helvetica', 'bold'); doc.setFontSize(20); doc.setTextColor(26, 26, 46);
    doc.text(state.scene.gameTitle, margin, 16);
    doc.setFontSize(13); doc.setTextColor(255, 45, 135);
    doc.text(`${t('step')} ${i + 1} — ${steps[i].title}`, margin, 24);

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
  toast(t('pdfOk'));
}

// ---- mode projection (plein écran TNI) --------------------------------------
function updateProjUI() {
  const st = curStep() ? curStep().title : '';
  $('#projTitle').textContent = state.scene.title ? state.scene.title + (st ? ' — ' + st : '') : st;
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
  if (!recSupported()) { toast(t('recNo')); return; }
  try {
    // 1) écran (l'utilisateur choisit l'onglet/écran dans la boîte du navigateur)
    const screen = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 30 }, audio: false,
    });
    // 2) micro (voix) — optionnel : on continue sans si refusé
    let mic = null;
    try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch (_) { toast(t('micNo')); }

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
      toast(t('videoOk'));
    };
    // si l'utilisateur arrête le partage via la barre du navigateur
    screen.getVideoTracks()[0].addEventListener('ended', () => { if (recState) stopRecording(); });

    recorder.start();
    recState = { recorder, chunks, streams: [screen, mic].filter(Boolean) };
    setRecButtons(true);
    toast(t('recOn'));
  } catch (_) {
    toast(t('captureNo'));
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
  if (e.code === 'Space') {
    if (document.querySelector('.modal.show')) return;
    e.preventDefault(); playNextAction();
  }
  else if (e.key === 'c' || e.key === 'C') { toggleCalib(); }
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
    if (groupSel) { groupSel = null; renderJoueeBar(); }
    $('#titlePanel').classList.remove('show');
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
  $('#sceneTitle').addEventListener('input', (e) => { state.scene.title = e.target.value; autosave(); });
  $('#btnSave').addEventListener('click', downloadJSON);
  $('#btnLoad').addEventListener('click', () => $('#fileInput').click());
  $('#fileInput').addEventListener('change', (e) => { if (e.target.files[0]) loadFromFile(e.target.files[0]); e.target.value = ''; });
  $('#btnPng').addEventListener('click', exportPNG);
  $('#btnPdf').addEventListener('click', exportPDF);
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
  $('#btnJoueeReset').addEventListener('click', () => resetJouee());
  $('#btnJoueeNext').addEventListener('click', playNextAction);
  $('#btnJoueeClear').addEventListener('click', clearJouee);
  $('#btnJoueeGroup').addEventListener('click', toggleGroupMode);
  $('#btnJoueeSave').addEventListener('click', () => downloadJSON(t('animSaved')));
  $('#titleStyleBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    const p = $('#titlePanel');
    const open = p.classList.toggle('show');
    if (open) renderTitlePanel();
  });
  $('#titlePanel').addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', () => $('#titlePanel').classList.remove('show'));
  $('#btnLang').addEventListener('click', () => {
    setLang(lang() === 'fr' ? 'en' : 'fr');
    applyStatic(); updateLangBtn();
    if (!state.scene.gameId) {
      state.scene.gameTitle = t('freeScene');
      $('#gameName').textContent = state.scene.gameTitle;
      $('#gameName').title = state.scene.gameTitle;
    }
    buildPalette(); buildTerrainMenu(); render(); autosave();
  });
  $('#projSpace').addEventListener('click', playNextAction);
  $('#btnHelp').addEventListener('click', () => $('#helpModal').classList.add('show'));
  $('#helpClose').addEventListener('click', () => $('#helpModal').classList.remove('show'));
  $('#helpModal').addEventListener('click', (e) => { if (e.target.id === 'helpModal') e.currentTarget.classList.remove('show'); });
  $('#calibCopy').addEventListener('click', () => {
    navigator.clipboard.writeText(configText()).then(() => toast(t('configCopied')), () => toast(t('copyNo')));
  });
  $('#calibDownload').addEventListener('click', () => {
    triggerDownload(new Blob([configText()], { type: 'application/json' }), 'terrain-gym.config.json');
    toast(t('configDl'));
  });
  $('#calibReset').addEventListener('click', async () => {
    const def = TERRAINS[state.terrainId] || TERRAINS[DEFAULT_TERRAIN];
    state.config = await (await fetch(def.config + '?t=' + Date.now())).json();
    configCache[state.terrainId] = state.config;
    rebuildProjector(); render(); toast(t('configReset'));
  });
}

// ---- init ------------------------------------------------------------------
function updateLangBtn() {
  const b = $('#btnLang');
  b.textContent = lang() === 'fr' ? 'EN' : 'FR';
  b.title = t('langBtn');
}
async function init() {
  initLang(); applyStatic(); updateLangBtn();
  await loadTerrain(DEFAULT_TERRAIN);
  buildPalette(); wireToolbar(); wirePicker();
  newScene(null);
}
init();
