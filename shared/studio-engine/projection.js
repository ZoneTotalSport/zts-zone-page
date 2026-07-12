// projection.js — projection perspective terrain <-> image.
// ES module PUR : aucune reference a window/document. Importable par l'editeur
// ET par Remotion (Phase 2). Toute la logique est deterministe.
//
// Systeme de coordonnees TERRAIN normalisees :
//   u in [0,1] : 0 = cote gauche, 1 = cote droit
//   v in [0,1] : 0 = fond (loin, petit), 1 = avant (proche, gros)
// project(u,v) renvoie {x, y, scale} ou x,y sont en fractions de l'image (0-1)
// et scale est un facteur relatif (~1 a l'avant, plus petit vers le fond).

/**
 * Homographie unite -> quadrilatere (algorithme de Heckbert).
 * Mappe (0,0)->p0, (1,0)->p1, (1,1)->p2, (0,1)->p3.
 * Retourne [a,b,c,d,e,f,g,h] tel que, pour (u,v) :
 *   w = g*u + h*v + 1 ; x = (a*u+b*v+c)/w ; y = (d*u+e*v+f)/w
 */
export function squareToQuad(p0, p1, p2, p3) {
  const dx1 = p1.x - p2.x, dx2 = p3.x - p2.x, dx3 = p0.x - p1.x + p2.x - p3.x;
  const dy1 = p1.y - p2.y, dy2 = p3.y - p2.y, dy3 = p0.y - p1.y + p2.y - p3.y;

  let a, b, c, d, e, f, g, h;
  if (Math.abs(dx3) < 1e-12 && Math.abs(dy3) < 1e-12) {
    // cas affine (parallelogramme parfait)
    a = p1.x - p0.x; b = p2.x - p1.x; c = p0.x;
    d = p1.y - p0.y; e = p2.y - p1.y; f = p0.y;
    g = 0; h = 0;
  } else {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (dx3 * dy2 - dx2 * dy3) / den;
    h = (dx1 * dy3 - dx3 * dy1) / den;
    a = p1.x - p0.x + g * p1.x;
    b = p3.x - p0.x + h * p3.x;
    c = p0.x;
    d = p1.y - p0.y + g * p1.y;
    e = p3.y - p0.y + h * p3.y;
    f = p0.y;
  }
  return [a, b, c, d, e, f, g, h];
}

const ORDER = ['farLeft', 'farRight', 'nearRight', 'nearLeft'];

/**
 * Construit un projecteur a partir d'un config terrain (voir terrain-gym.config.json).
 * @returns {{ project, scaleAt, map, unproject, corners, matrix, config }}
 */
export function createProjector(config) {
  const C = config.corners;
  const [p0, p1, p2, p3] = ORDER.map((k) => C[k]);
  const M = squareToQuad(p0, p1, p2, p3);
  const [a, b, c, d, e, f, g, h] = M;

  /** (u,v) -> {x,y} en fractions d'image, sans scale. */
  function map(u, v) {
    const w = g * u + h * v + 1;
    return { x: (a * u + b * v + c) / w, y: (d * u + e * v + f) / w };
  }

  /** Largeur image du terrain a la profondeur v (distance bord gauche->droit). */
  function widthAt(v) {
    const l = map(0, v), r = map(1, v);
    return Math.hypot(r.x - l.x, r.y - l.y);
  }

  const wNear = widthAt(1) || 1;
  const sMin = config.scale && config.scale.min != null ? config.scale.min : 0.3;
  const sMax = config.scale && config.scale.max != null ? config.scale.max : 1.3;

  /** Facteur d'echelle a la profondeur v : ~1 a l'avant, plus petit au fond. */
  function scaleAt(v) {
    const s = widthAt(v) / wNear;
    return Math.max(sMin, Math.min(sMax, s));
  }

  /** (u,v) -> {x, y, scale}. x,y en fractions d'image (0-1). */
  function project(u, v) {
    const p = map(u, v);
    return { x: p.x, y: p.y, scale: scaleAt(v) };
  }

  /**
   * Inverse : (x,y) fractions d'image -> {u,v}. Sert au drag depuis l'ecran.
   * Resout le systeme homographique 2x2 en (u,v).
   */
  function unproject(x, y) {
    // x*(g*u+h*v+1) = a*u+b*v+c  ->  (a - x*g)u + (b - x*h)v = x - c
    // y*(g*u+h*v+1) = d*u+e*v+f  ->  (d - y*g)u + (e - y*h)v = y - f
    const A = a - x * g, B = b - x * h, E = x - c;
    const Cc = d - y * g, D = e - y * h, F = y - f;
    const det = A * D - B * Cc;
    if (Math.abs(det) < 1e-12) return { u: 0, v: 0 };
    return { u: (E * D - B * F) / det, v: (A * F - E * Cc) / det };
  }

  return { project, scaleAt, map, unproject, corners: C, matrix: M, config };
}
