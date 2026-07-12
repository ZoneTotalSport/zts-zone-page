// scene-schema.js — modele de scene + etapes + interpolation.
// ES module PUR : aucune reference a window/document, aucune source d'alea
// (Date.now/Math.random). Ids deterministes bases sur l'existant.
// Meme fichier utilise par l'editeur (edition) et par Remotion (lecture).

export const SCENE_VERSION = 1;

export const ELEMENT_TYPES = [
  'player', 'ball', 'cone', 'hoop', 'pinnie', // objets ponctuels (u,v)
  'image',                                     // perso importe (u,v) + assetId
  'arrow',                                     // A->B (u,v)->(u2,v2)
  'zone',                                      // rect/cercle (u,v)+(u2,v2)
  'text',                                      // texte/onomatopee (u,v)
];

// Couleurs joueurs : chaque couleur = une FORME distincte (impression N&B).
export const PLAYER_COLORS = {
  rouge: { hex: '#FF2D2D', shape: 'circle' },
  bleu:  { hex: '#1E90FF', shape: 'square' },
  blanc: { hex: '#FFFFFF', shape: 'triangle' },
  noir:  { hex: '#1A1A2E', shape: 'diamond' },
};

export const ARROW_KINDS = ['run', 'pass', 'throw']; // course / passe / lancer

/** Univers -> couleur d'accent (mappe sur shared/zts.css). */
export function pickUnivers(game) {
  const u = game && game.univers;
  if (Array.isArray(u)) {
    if (u.includes('eps')) return 'eps';
    if (u.includes('sdg')) return 'sdg';
    if (u.includes('camps')) return 'camps';
  }
  return 'eps';
}

/** Cree une scene vierge (1 etape) pour un jeu donne, ou en mode libre. */
export function createScene(game) {
  const scene = {
    version: SCENE_VERSION,
    gameId: game && game.id ? game.id : null,
    gameTitle: game && game.title ? game.title : 'Scène libre',
    univers: pickUnivers(game),
    terrain: 'terrain-gym',
    assets: {},   // { assetId: { name, src (data-URI), w, h } } — persos importes
    steps: [],
  };
  scene.steps.push(createStep(scene, 'Mise en place'));
  return scene;
}

/** Enregistre un asset (perso importe) et retourne son id deterministe. */
export function addAsset(scene, asset) {
  if (!scene.assets) scene.assets = {};
  const id = `asset-${maxNum(Object.keys(scene.assets), 'asset') + 1}`;
  scene.assets[id] = { name: asset.name || 'perso', src: asset.src, w: asset.w, h: asset.h };
  return id;
}

export function createStep(scene, title) {
  return { id: nextStepId(scene), title: title || 'Étape', elements: [] };
}

/** Copie profonde d'une etape avec de nouveaux ids d'etape (elements gardent leur id pour l'animation). */
export function duplicateStep(scene, step, title) {
  return {
    id: nextStepId(scene),
    title: title || (step.title + ' (copie)'),
    elements: step.elements.map((e) => ({ ...e })),
  };
}

// ---- Ids deterministes -----------------------------------------------------

export function nextStepId(scene) {
  return `step-${maxNum((scene.steps || []).map((s) => s.id), 'step') + 1}`;
}

export function nextElementId(step) {
  return `el-${maxNum((step.elements || []).map((e) => e.id), 'el') + 1}`;
}

function maxNum(ids, prefix) {
  let m = 0;
  const pre = prefix + '-';
  for (const id of ids) {
    if (typeof id === 'string' && id.startsWith(pre)) {
      const n = parseInt(id.slice(pre.length), 10);
      if (Number.isFinite(n) && n > m) m = n;
    }
  }
  return m;
}

// ---- Interpolation (lecture navigateur + Remotion Phase 2) ------------------

export function lerp(a, b, t) { return a + (b - a) * t; }

const LERP_KEYS = ['u', 'v', 'u2', 'v2', 'rotation', 'w', 'h', 'radius', 'fontSize', 'scaleMul'];

/**
 * Interpole tous les elements entre deux etapes a l'instant t in [0,1].
 * Appariement par id : meme id => la position s'anime. Element seulement dans A
 * => disparait (_opacity 1->0). Seulement dans B => apparait (_opacity 0->1).
 * @returns {Array} elements avec coords interpolees + _opacity.
 */
export function interpolateSteps(stepA, stepB, t) {
  const out = [];
  const elemsA = (stepA && stepA.elements) || [];
  const elemsB = (stepB && stepB.elements) || [];
  const bById = new Map(elemsB.map((e) => [e.id, e]));
  const seen = new Set();

  for (const ea of elemsA) {
    const eb = bById.get(ea.id);
    if (eb) {
      seen.add(ea.id);
      out.push(lerpElement(ea, eb, t));
    } else {
      out.push({ ...ea, _opacity: 1 - t }); // sortie
    }
  }
  for (const eb of elemsB) {
    if (!seen.has(eb.id)) out.push({ ...eb, _opacity: t }); // entree
  }
  return out;
}

function lerpElement(ea, eb, t) {
  const o = { ...ea, _opacity: 1 };
  for (const k of LERP_KEYS) {
    if (typeof ea[k] === 'number' && typeof eb[k] === 'number') {
      o[k] = lerp(ea[k], eb[k], t);
    }
  }
  return o;
}

// ---- jouee : gestes enregistres, rejoues action par action -------------------
// step.jouee = { base: [elements au depart], actions: [...] }
// kinds : move {elementId, path:[[u,v,ms],...]} · pose {elementId, after:{...}}
//         add {element} · remove {elementId}

export function createJouee(elements) {
  return { base: elements.map((e) => ({ ...e })), actions: [] };
}

/** Position sur un chemin enregistre a t in [0,1] (interp. lineaire par temps). */
export function samplePath(path, t) {
  if (!path || !path.length) return null;
  const total = path[path.length - 1][2] || 1;
  const ms = Math.max(0, Math.min(1, t)) * total;
  let prev = path[0];
  for (const p of path) {
    if (p[2] >= ms) {
      const span = (p[2] - prev[2]) || 1;
      const k = (ms - prev[2]) / span;
      return { u: prev[0] + (p[0] - prev[0]) * k, v: prev[1] + (p[1] - prev[1]) * k };
    }
    prev = p;
  }
  const last = path[path.length - 1];
  return { u: last[0], v: last[1] };
}

/** Applique instantanement l'etat final d'une action (mutation en place). */
export function applyAction(elements, action) {
  if (action.kind === 'add') {
    elements.push({ ...action.element });
  } else if (action.kind === 'remove') {
    const i = elements.findIndex((e) => e.id === action.elementId);
    if (i >= 0) elements.splice(i, 1);
  } else if (action.kind === 'move') {
    const el = elements.find((e) => e.id === action.elementId);
    const p = action.path && action.path[action.path.length - 1];
    if (el && p) { el.u = p[0]; el.v = p[1]; }
  } else if (action.kind === 'pose') {
    const el = elements.find((e) => e.id === action.elementId);
    if (el) Object.assign(el, action.after);
  }
  return elements;
}

/** Valide grossierement une scene chargee depuis un JSON externe. */
export function validateScene(scene) {
  if (!scene || typeof scene !== 'object') return 'Scène invalide (objet attendu).';
  if (!Array.isArray(scene.steps) || scene.steps.length === 0) return 'Scène sans étapes.';
  for (const s of scene.steps) {
    if (!Array.isArray(s.elements)) return 'Étape sans liste d\'éléments.';
  }
  return null; // OK
}
