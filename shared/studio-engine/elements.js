// elements.js — generateurs SVG des elements de scene (style Pop Art ZTS).
// ES module PUR : chaque fonction retourne une CHAINE de balisage SVG, aucune
// manipulation de DOM. Reutilisable par l'editeur ET par Remotion.
//
// Convention : les icones ponctuelles sont dessinees CENTREES sur (0,0) dans un
// repere local d'environ 100 unites (rayon ~46). L'editeur les place via un
// <g transform="translate(x,y) scale(s)">. Les fleches et zones recoivent des
// points deja projetes (ecran) car elles suivent la perspective.

import { PLAYER_COLORS, ARROW_KINDS } from './scene-schema.js';

const INK = '#1A1A2E';           // contour + ombre BD
const STROKE = 7;                // epaisseur contour icones
const SHADOW = 'rgba(26,26,46,.85)';
const R = 46;                    // rayon nominal des pastilles

// Palette de la barre d'outils (ordre d'affichage).
export const PALETTE = [
  { type: 'player', color: 'rouge', label: 'Joueur rouge',  emoji: '🔴' },
  { type: 'player', color: 'bleu',  label: 'Joueur bleu',   emoji: '🟦' },
  { type: 'player', color: 'blanc', label: 'Joueur blanc',  emoji: '🔺' },
  { type: 'player', color: 'noir',  label: 'Joueur noir',   emoji: '🔶' },
  { type: 'ball',   label: 'Ballon',   emoji: '🏀' },
  { type: 'cone',   label: 'Cône',     emoji: '🔻' },
  { type: 'hoop',   label: 'Cerceau',  emoji: '⭕' },
  { type: 'pinnie', label: 'Dossard',  emoji: '🎽' },
  { type: 'arrow',  kind: 'run',   label: 'Course', emoji: '➡️' },
  { type: 'arrow',  kind: 'pass',  label: 'Passe',  emoji: '⇢' },
  { type: 'arrow',  kind: 'throw', label: 'Lancer', emoji: '↗️' },
  { type: 'zone',   shape: 'rect',   label: 'Zone', emoji: '▭' },
  { type: 'zone',   shape: 'circle', label: 'Cercle', emoji: '◯' },
  { type: 'text',   label: 'Texte', emoji: '💬' },
];

// ---- helpers ---------------------------------------------------------------

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Ombre BD : meme forme, decalee, sombre. `shapeFn(dx,dy)` renvoie le path/forme. */
function withShadow(shapeMarkup, dx, dy) {
  return `<g transform="translate(${dx},${dy})" fill="${SHADOW}" stroke="none">${shapeMarkup}</g>`;
}

function labelSVG(label, color) {
  if (label == null || label === '') return '';
  const fill = color === 'noir' ? '#fff' : INK;
  return `<text x="0" y="0" text-anchor="middle" dominant-baseline="central" `
    + `font-family="'Luckiest Guy','Impact',sans-serif" font-size="${R}" `
    + `fill="${fill}" stroke="none">${esc(label)}</text>`;
}

// ---- icones ponctuelles ----------------------------------------------------

/** Joueur : forme distincte par couleur (impression N&B) + contour + ombre + label. */
export function playerSVG(color, label) {
  const def = PLAYER_COLORS[color] || PLAYER_COLORS.rouge;
  const fill = def.hex;
  const shape = def.shape;
  let body;
  if (shape === 'circle') {
    body = `<circle cx="0" cy="0" r="${R}"/>`;
  } else if (shape === 'square') {
    const s = R * 0.9;
    body = `<rect x="${-s}" y="${-s}" width="${2 * s}" height="${2 * s}" rx="10"/>`;
  } else if (shape === 'triangle') {
    const p = [[0, -R * 1.05], [R, R * 0.8], [-R, R * 0.8]].map((q) => q.join(',')).join(' ');
    body = `<polygon points="${p}"/>`;
  } else { // diamond
    const p = [[0, -R * 1.1], [R * 1.05, 0], [0, R * 1.1], [-R * 1.05, 0]].map((q) => q.join(',')).join(' ');
    body = `<polygon points="${p}"/>`;
  }
  return withShadow(body, 5, 6)
    + `<g fill="${fill}" stroke="${INK}" stroke-width="${STROKE}" stroke-linejoin="round">${body}</g>`
    + labelSVG(label, color);
}

/** Ballon style basket (orange, lignes noires). */
export function ballSVG() {
  const body = `<circle cx="0" cy="0" r="${R * 0.82}"/>`;
  const lines = `<g fill="none" stroke="${INK}" stroke-width="4">`
    + `<line x1="${-R * 0.82}" y1="0" x2="${R * 0.82}" y2="0"/>`
    + `<line x1="0" y1="${-R * 0.82}" x2="0" y2="${R * 0.82}"/>`
    + `<path d="M ${-R * 0.58} ${-R * 0.58} Q 0 0 ${-R * 0.58} ${R * 0.58}"/>`
    + `<path d="M ${R * 0.58} ${-R * 0.58} Q 0 0 ${R * 0.58} ${R * 0.58}"/></g>`;
  return withShadow(body, 5, 6)
    + `<g fill="#FF6B00" stroke="${INK}" stroke-width="${STROKE}">${body}</g>` + lines;
}

/** Cône orange. */
export function coneSVG() {
  const base = `<ellipse cx="0" cy="${R * 0.8}" rx="${R * 0.95}" ry="${R * 0.25}"/>`;
  const cone = `<polygon points="0,${-R} ${R * 0.62},${R * 0.8} ${-R * 0.62},${R * 0.8}"/>`;
  const stripe = `<polygon points="${-R * 0.28},${-R * 0.1} ${R * 0.28},${-R * 0.1} ${R * 0.38},${R * 0.25} ${-R * 0.38},${R * 0.25}" fill="#FFEA00" stroke="none"/>`;
  return withShadow(cone, 5, 6)
    + `<g fill="#FF6B00" stroke="${INK}" stroke-width="${STROKE}" stroke-linejoin="round">${base}${cone}</g>${stripe}`;
}

/** Cerceau (anneau). */
export function hoopSVG(color) {
  const hex = (PLAYER_COLORS[color] && PLAYER_COLORS[color].hex) || '#39FF14';
  const body = `<ellipse cx="0" cy="0" rx="${R}" ry="${R * 0.5}"/>`;
  const hole = `<ellipse cx="0" cy="0" rx="${R * 0.62}" ry="${R * 0.3}" fill="#FFFEF7"/>`;
  return withShadow(body, 5, 6)
    + `<g fill="${hex}" stroke="${INK}" stroke-width="${STROKE}">${body}</g>${hole}`;
}

/** Dossard / foulard (petite chasuble). */
export function pinnieSVG(color) {
  const hex = (PLAYER_COLORS[color] && PLAYER_COLORS[color].hex) || '#FFEA00';
  const body = `<path d="M ${-R * 0.55} ${-R * 0.7} L ${-R * 0.95} ${-R * 0.35} L ${-R * 0.6} ${0}`
    + ` L ${-R * 0.6} ${R * 0.85} L ${R * 0.6} ${R * 0.85} L ${R * 0.6} 0`
    + ` L ${R * 0.95} ${-R * 0.35} L ${R * 0.55} ${-R * 0.7}`
    + ` L ${R * 0.28} ${-R * 0.5} L ${-R * 0.28} ${-R * 0.5} Z"/>`;
  return withShadow(body, 5, 6)
    + `<g fill="${hex}" stroke="${INK}" stroke-width="${STROKE}" stroke-linejoin="round">${body}</g>`;
}

/** Icone ponctuelle par type (pour la palette + placement). */
export function iconSVG(el) {
  switch (el.type) {
    case 'player': return playerSVG(el.color, el.label);
    case 'ball':   return ballSVG();
    case 'cone':   return coneSVG();
    case 'hoop':   return hoopSVG(el.color);
    case 'pinnie': return pinnieSVG(el.color);
    default:       return '';
  }
}

// ---- perso importe (image) -------------------------------------------------

// Hauteur locale de reference d'un perso a scaleMul=1 (avant, scale=1).
export const IMAGE_BASE_H = 120;

/**
 * <defs> a inserer UNE fois dans l'overlay : ombre BD (offset dur) pour persos.
 * Reference par filter="url(#ztsShadow)".
 */
export function svgDefs() {
  return '<defs><filter id="ztsShadow" x="-25%" y="-25%" width="155%" height="155%">'
    + '<feDropShadow dx="5" dy="6" stdDeviation="0" flood-color="#1A1A2E" flood-opacity="0.85"/>'
    + '</filter></defs>';
}

/** Perso importe centre sur (0,0), hauteur locale ~IMAGE_BASE_H, aspect conserve. */
export function imageSVG(asset) {
  if (!asset || !asset.src) return '';
  const h = IMAGE_BASE_H;
  const ar = asset.w && asset.h ? asset.w / asset.h : 1;
  const w = h * ar;
  return `<image href="${asset.src}" xlink:href="${asset.src}" `
    + `x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" `
    + `preserveAspectRatio="xMidYMid meet" filter="url(#ztsShadow)"/>`;
}

/** Demi-largeur / demi-hauteur locales du perso (pour boite de selection + poignee). */
export function imageHalfBox(asset) {
  const h = IMAGE_BASE_H;
  const ar = asset && asset.w && asset.h ? asset.w / asset.h : 1;
  return { hw: (h * ar) / 2, hh: h / 2 };
}

// ---- fleches (points ecran projetes) ---------------------------------------

/**
 * Fleche entre points ecran deja projetes.
 * @param pts   [{x,y}, ...] au moins 2 (polyline perspective-correcte)
 * @param kind  'run' (pleine) | 'pass' (pointillee) | 'throw' (courbe)
 * @param color hex du trait (defaut noir)
 * @param sw    epaisseur du trait (defaut 8)
 */
export function arrowSVG(pts, kind, color, sw) {
  if (!pts || pts.length < 2) return '';
  const stroke = color || INK;
  const width = sw || 8;
  const kk = ARROW_KINDS.includes(kind) ? kind : 'run';
  const a = pts[0], b = pts[pts.length - 1];

  let path;
  if (kk === 'throw') {
    // courbe : point de controle au-dessus du milieu
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    const dx = b.x - a.x, dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const cx = mx - (dy / len) * len * 0.28;
    const cy = my - (Math.abs(dx) / len) * len * 0.28 - len * 0.12;
    path = `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  } else {
    path = 'M ' + pts.map((p) => `${p.x} ${p.y}`).join(' L ');
  }
  const dash = kk === 'pass' ? ` stroke-dasharray="${width * 2.2} ${width * 1.6}"` : '';
  // tangente d'arrivee pour la pointe
  let tx = b.x - a.x, ty = b.y - a.y;
  if (kk === 'throw') { tx = b.x - (a.x + b.x) / 2; ty = b.y - (a.y + b.y) / 2; }
  const head = arrowHead(b, tx, ty, width, stroke);
  return `<g fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">`
    + `<path d="${path}"${dash}/></g>${head}`;
}

function arrowHead(tip, dx, dy, width, color) {
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const s = width * 2.6;
  const back = { x: tip.x - ux * s, y: tip.y - uy * s };
  const nx = -uy, ny = ux;
  const p1 = `${back.x + nx * s * 0.6},${back.y + ny * s * 0.6}`;
  const p2 = `${back.x - nx * s * 0.6},${back.y - ny * s * 0.6}`;
  return `<polygon points="${tip.x},${tip.y} ${p1} ${p2}" fill="${color}" stroke="none"/>`;
}

// ---- zones (points ecran projetes) -----------------------------------------

/**
 * Zone semi-transparente. Pour 'rect' : polygone des 4 coins projetes.
 * Pour 'circle' : polygone approxime (anneau echantillonne).
 * @param pts  liste de {x,y} ecran (bord de la zone)
 * @param hex  couleur univers
 */
export function zoneSVG(pts, hex) {
  if (!pts || pts.length < 3) return '';
  const fill = hex || '#00E5FF';
  const poly = pts.map((p) => `${p.x},${p.y}`).join(' ');
  return `<polygon points="${poly}" fill="${fill}" fill-opacity="0.22" `
    + `stroke="${fill}" stroke-width="6" stroke-dasharray="14 10" stroke-linejoin="round"/>`;
}

// ---- texte / onomatopee ----------------------------------------------------

/**
 * Texte libre ou onomatopee BD (Luckiest Guy, contour, rotation).
 * Dessine centre sur (0,0) ; l'editeur applique translate+scale+rotation.
 */
export function textSVG(el) {
  const size = el.fontSize || R * 1.2;
  const isOno = el.style === 'onomatopee';
  const fill = isOno ? (el.hex || '#FFEA00') : (el.hex || INK);
  const stroke = isOno ? INK : 'none';
  const sw = isOno ? Math.max(4, size * 0.12) : 0;
  return `<text x="0" y="0" text-anchor="middle" dominant-baseline="central" `
    + `font-family="'Luckiest Guy','Impact',sans-serif" font-size="${size}" `
    + `fill="${fill}" stroke="${stroke}" stroke-width="${sw}" `
    + `paint-order="stroke" stroke-linejoin="round">${esc(el.text || 'Texte')}</text>`;
}
