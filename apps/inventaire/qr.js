/**
 * qr.js — encodeur de codes QR, sans dependance et sans reseau.
 *
 * POURQUOI CE FICHIER EXISTE. Le cahier des charges demande une petite
 * librairie QR « vendoree localement, pas de CDN, pas d'appel reseau ». Aucune
 * n'etait deja presente dans le depot. Plutot que de coller un fichier tiers
 * telecharge, l'encodage est ecrit ici : l'algorithme est la norme publique
 * ISO/IEC 18004, il tient en un fichier, et il n'entraine ni licence a suivre
 * ni mise a jour a surveiller. Rien de ce fichier n'est copie d'ailleurs.
 *
 * PERIMETRE DELIBEREMENT ETROIT — c'est ce qui le garde court et verifiable :
 *   · mode OCTET seulement (le texte est encode en UTF-8) ;
 *   · versions 1 a 10, soit jusqu'a 271 octets au niveau M.
 * Une URL de l'app fait ~90 caracteres : elle tient en version 5 au niveau M.
 * Au-dela de 10, `matrice()` leve — elle ne rend jamais un code tronque, qui
 * scannerait mal ou renverrait la mauvaise fiche.
 *
 * NIVEAUX DE CORRECTION : 'L' 7 %, 'M' 15 %, 'Q' 25 %, 'H' 30 %.
 * L'app imprime en 'M' : une etiquette collee sur un bac de gymnase se salit
 * et se corne, et M encaisse ca sans gonfler la grille au point de la rendre
 * illisible a 40 mm.
 *
 * API
 *   ZTSQR.matrice(texte, niveau) -> tableau NxN de 0/1, 1 = module sombre.
 *                                   SANS marge : c'est a l'appelant de poser
 *                                   la zone calme de 4 modules, faute de quoi
 *                                   beaucoup de lecteurs refusent le code.
 *   ZTSQR.svg(texte, opts)       -> chaine SVG prete a imprimer (marge posee).
 */
(function (global) {
  'use strict';

  /* ── Tables de la norme ─────────────────────────────────────────────── */

  // Nombre total de mots de code (donnees + correction) par version.
  var TOTAL = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];

  // Par niveau puis par version : [mots de correction par bloc,
  //                                nb blocs groupe 1, mots de donnees groupe 1,
  //                                nb blocs groupe 2, mots de donnees groupe 2]
  var BLOCS = {
    L: [null, [7,1,19,0,0], [10,1,34,0,0], [15,1,55,0,0], [20,1,80,0,0],
        [26,1,108,0,0], [18,2,68,0,0], [20,2,78,0,0], [24,2,97,0,0],
        [30,2,116,0,0], [18,2,68,2,69]],
    M: [null, [10,1,16,0,0], [16,1,28,0,0], [26,1,44,0,0], [18,2,32,0,0],
        [24,2,43,0,0], [16,4,27,0,0], [18,4,31,0,0], [22,2,38,2,39],
        [22,3,36,2,37], [26,4,43,1,44]],
    Q: [null, [13,1,13,0,0], [22,1,22,0,0], [18,2,17,0,0], [26,2,24,0,0],
        [18,2,15,2,16], [24,4,19,0,0], [18,2,14,4,15], [22,4,18,2,19],
        [20,4,16,4,17], [24,6,19,2,20]],
    H: [null, [17,1,9,0,0], [28,1,16,0,0], [22,2,13,0,0], [16,4,9,0,0],
        [22,2,11,2,12], [28,4,15,0,0], [26,4,13,1,14], [26,4,14,2,15],
        [24,4,12,4,13], [28,6,15,2,16]]
  };

  // Centres des motifs d'alignement. Une combinaison dont le centre tombe sur
  // un motif de detection n'est pas posee — d'ou le test sur `res` plus bas.
  var ALIGN = [null, [], [6,18], [6,22], [6,26], [6,30], [6,34],
               [6,22,38], [6,24,42], [6,26,46], [6,28,50]];

  // Bits de bourrage apres les mots de code, par version.
  var RESTE = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0];

  // Codage du niveau dans l'information de format. Ce n'est PAS l'ordre
  // alphabetique ni l'ordre de robustesse : c'est la table de la norme.
  var NIV_BITS = { L: 1, M: 0, Q: 3, H: 2 };

  /* ── Corps de Galois GF(256), polynome primitif 0x11D ────────────────── */

  var EXP = new Uint8Array(512), LOG = new Uint8Array(256);
  (function () {
    var x = 1;
    for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 0x100) x ^= 0x11D; }
    for (i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
  })();

  function mul(a, b) { return (a === 0 || b === 0) ? 0 : EXP[LOG[a] + LOG[b]]; }

  // Polynome generateur de degre n : produit des (x + alpha^i).
  // Coefficients du degre le PLUS HAUT au plus bas ; g[0] vaut toujours 1.
  function generateur(n) {
    var g = [1];
    for (var i = 0; i < n; i++) {
      var ng = new Array(g.length + 1);
      for (var k = 0; k < ng.length; k++) ng[k] = 0;
      for (var j = 0; j < g.length; j++) {
        ng[j] ^= g[j];                    // terme en x
        ng[j + 1] ^= mul(g[j], EXP[i]);   // terme constant alpha^i
      }
      g = ng;
    }
    return g;
  }

  // Reste de la division polynomiale = mots de correction d'erreur.
  function correction(donnees, n) {
    var g = generateur(n);
    var r = donnees.slice();
    for (var i = 0; i < n; i++) r.push(0);
    for (i = 0; i < donnees.length; i++) {
      var coef = r[i];
      if (coef === 0) continue;
      for (var j = 0; j < g.length; j++) r[i + j] ^= mul(g[j], coef);
    }
    return r.slice(donnees.length);
  }

  /* ── Encodage du texte ───────────────────────────────────────────────── */

  function utf8(texte) {
    var out = [];
    for (var i = 0; i < texte.length; i++) {
      var c = texte.charCodeAt(i);
      if (c < 0x80) out.push(c);
      else if (c < 0x800) { out.push(0xC0 | (c >> 6), 0x80 | (c & 63)); }
      else if (c >= 0xD800 && c <= 0xDBFF && i + 1 < texte.length) {
        // Paire de substitution : un emoji occupe DEUX unites JS.
        var c2 = texte.charCodeAt(++i);
        var cp = 0x10000 + ((c - 0xD800) << 10) + (c2 - 0xDC00);
        out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 63),
                 0x80 | ((cp >> 6) & 63), 0x80 | (cp & 63));
      } else { out.push(0xE0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63)); }
    }
    return out;
  }

  function motsDeDonnees(octets, v, niv) {
    var b = BLOCS[niv][v];
    var capacite = b[1] * b[2] + b[3] * b[4];       // en mots de code
    var tailleCompte = v <= 9 ? 8 : 16;              // mode octet
    var bits = [];
    function pousse(val, n) { for (var i = n - 1; i >= 0; i--) bits.push((val >> i) & 1); }

    pousse(4, 4);                                    // indicateur de mode OCTET
    pousse(octets.length, tailleCompte);
    for (var i = 0; i < octets.length; i++) pousse(octets[i], 8);

    // Terminaison : jusqu'a quatre zeros, sans deborder la capacite.
    var max = capacite * 8;
    for (i = 0; i < 4 && bits.length < max; i++) bits.push(0);
    while (bits.length % 8) bits.push(0);

    var mots = [];
    for (i = 0; i < bits.length; i += 8) {
      var o = 0;
      for (var j = 0; j < 8; j++) o = (o << 1) | bits[i + j];
      mots.push(o);
    }
    // Bourrage alterne, impose par la norme.
    var pad = [0xEC, 0x11], k = 0;
    while (mots.length < capacite) mots.push(pad[k++ % 2]);
    return mots;
  }

  // Entrelacement des blocs : donnees d'abord, puis correction.
  function entrelace(mots, v, niv) {
    var b = BLOCS[niv][v], ecLen = b[0];
    var tailles = [], i;
    for (i = 0; i < b[1]; i++) tailles.push(b[2]);
    for (i = 0; i < b[3]; i++) tailles.push(b[4]);

    var blocs = [], ecs = [], p = 0;
    tailles.forEach(function (len) {
      var d = mots.slice(p, p + len); p += len;
      blocs.push(d); ecs.push(correction(d, ecLen));
    });

    var out = [], maxD = Math.max.apply(null, tailles);
    for (i = 0; i < maxD; i++) blocs.forEach(function (d) { if (i < d.length) out.push(d[i]); });
    for (i = 0; i < ecLen; i++) ecs.forEach(function (e) { out.push(e[i]); });
    return out;
  }

  /* ── Motifs de fonction ──────────────────────────────────────────────── */

  // Information de version, BCH(18,6), generateur 0x1F25. Version 7 et plus.
  function bitsVersion(v) {
    var d = v << 12;
    for (var i = 17; i >= 12; i--) if ((d >> i) & 1) d ^= 0x1F25 << (i - 12);
    return (v << 12) | d;
  }

  // Information de format, BCH(15,5), generateur 0x537, masque final 0x5412.
  function bitsFormat(niv, masque) {
    var data = (NIV_BITS[niv] << 3) | masque;
    var d = data << 10;
    for (var i = 14; i >= 10; i--) if ((d >> i) & 1) d ^= 0x537 << (i - 10);
    return ((data << 10) | d) ^ 0x5412;
  }

  function motifs(m, res, v) {
    var n = m.length, i, r, c;

    // Detection de position + separateur, aux trois coins.
    [[0, 0], [0, n - 7], [n - 7, 0]].forEach(function (p) {
      for (r = -1; r <= 7; r++) for (c = -1; c <= 7; c++) {
        var y = p[0] + r, x = p[1] + c;
        if (y < 0 || y >= n || x < 0 || x >= n) continue;
        var sombre = (r >= 0 && r <= 6 && (c === 0 || c === 6)) ||
                     (c >= 0 && c <= 6 && (r === 0 || r === 6)) ||
                     (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        m[y][x] = sombre ? 1 : 0; res[y][x] = 1;
      }
    });

    // Synchronisation.
    for (i = 8; i < n - 8; i++) {
      var b = (i % 2 === 0) ? 1 : 0;
      m[6][i] = b; res[6][i] = 1;
      m[i][6] = b; res[i][6] = 1;
    }

    // Alignement. Seules sont ecartees les combinaisons dont le motif
    // recouvrirait un motif de DETECTION, aux trois coins.
    //
    // Ne PAS ecrire ce test « si le centre est deja reserve » : la ligne et la
    // colonne de synchronisation sont posees juste au-dessus, et les centres
    // valant 6 tombent dessus. A partir de la version 7, ou les centres
    // commencent a 6, ce raccourci sautait deux motifs d'alignement bien
    // reels — 40 modules laisses au flux de donnees, qui decalait tout le
    // reste. Les versions 1 a 6 n'ont aucun centre sur la synchronisation :
    // le defaut y etait invisible. Trouve le 23 aout 2026 en comparant la
    // carte des modules de fonction a celle de la norme.
    //
    // Le recouvrement avec la synchronisation, lui, est normal et sans
    // consequence : la rangee mediane d'un motif d'alignement alterne
    // exactement comme la synchronisation qu'elle traverse.
    var a = ALIGN[v];
    for (var i1 = 0; i1 < a.length; i1++) for (var i2 = 0; i2 < a.length; i2++) {
      var cy = a[i1], cx = a[i2];
      var coin = (cy <= 8 && cx <= 8) ||
                 (cy <= 8 && cx >= n - 9) ||
                 (cy >= n - 9 && cx <= 8);
      if (coin) continue;
      for (r = -2; r <= 2; r++) for (c = -2; c <= 2; c++) {
        var d = (Math.max(Math.abs(r), Math.abs(c)) !== 1) ? 1 : 0;
        m[cy + r][cx + c] = d; res[cy + r][cx + c] = 1;
      }
    }

    // Module sombre, toujours au meme endroit.
    m[n - 8][8] = 1; res[n - 8][8] = 1;

    // Reservation des zones d'information de format.
    for (i = 0; i < 9; i++) {
      if (!res[8][i]) { res[8][i] = 1; m[8][i] = 0; }
      if (!res[i][8]) { res[i][8] = 1; m[i][8] = 0; }
    }
    for (i = 0; i < 8; i++) {
      if (!res[8][n - 1 - i]) { res[8][n - 1 - i] = 1; m[8][n - 1 - i] = 0; }
      if (!res[n - 1 - i][8]) { res[n - 1 - i][8] = 1; m[n - 1 - i][8] = 0; }
    }

    if (v >= 7) {
      var vb = bitsVersion(v);
      for (i = 0; i < 18; i++) {
        var bit = (vb >> i) & 1, rr = Math.floor(i / 3), cc = i % 3;
        m[rr][n - 11 + cc] = bit; res[rr][n - 11 + cc] = 1;
        m[n - 11 + cc][rr] = bit; res[n - 11 + cc][rr] = 1;
      }
    }
  }

  // Parcours en zigzag, deux colonnes a la fois, de la droite vers la gauche.
  function poserDonnees(m, res, bits) {
    var n = m.length, idx = 0, versLeHaut = true;
    for (var col = n - 1; col > 0; col -= 2) {
      if (col === 6) col--;             // la colonne 6 est la synchronisation
      for (var k = 0; k < n; k++) {
        var row = versLeHaut ? (n - 1 - k) : k;
        for (var c = 0; c < 2; c++) {
          var x = col - c;
          if (res[row][x]) continue;
          m[row][x] = idx < bits.length ? bits[idx] : 0;
          idx++;
        }
      }
      versLeHaut = !versLeHaut;
    }
  }

  function masqueTest(k, i, j) {
    switch (k) {
      case 0: return (i + j) % 2 === 0;
      case 1: return i % 2 === 0;
      case 2: return j % 3 === 0;
      case 3: return (i + j) % 3 === 0;
      case 4: return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
      case 5: return ((i * j) % 2) + ((i * j) % 3) === 0;
      case 6: return (((i * j) % 2) + ((i * j) % 3)) % 2 === 0;
      default: return (((i + j) % 2) + ((i * j) % 3)) % 2 === 0;
    }
  }

  // Pose des 15 bits d'information de format, en DEUX exemplaires.
  //
  // L'ordre des bits est le piege de cette fonction. Le bit 0 (poids faible)
  // va en HAUT de la colonne 8 et a DROITE de la ligne 8 ; le bit 14 va en bas
  // de la colonne et a gauche de la ligne. Ecrite dans l'autre sens — ce qui
  // parait tout aussi naturel — la valeur posee est le miroir binaire de la
  // bonne, et le code BCH(15,5) a une distance minimale de 7 : le miroir n'est
  // donc JAMAIS un mot de code valide. Aucun lecteur ne decode, et rien dans
  // la grille ne laisse voir l'erreur. Verifie le 23 aout 2026 contre
  // l'encodeur d'OpenCV, puis par decodage effectif de 68 codes.
  //
  // La copie verticale saute la ligne n-8 : c'est le module sombre, pose par
  // motifs(), qui n'appartient pas au format.
  function poserFormat(m, niv, masque) {
    var n = m.length, bits = bitsFormat(niv, masque);
    for (var i = 0; i < 15; i++) {
      var b = (bits >> i) & 1;

      // Colonne 8 : lignes 0-5, 7, 8, puis n-7 a n-1.
      if (i < 6) m[i][8] = b;
      else if (i < 8) m[i + 1][8] = b;
      else m[n - 15 + i][8] = b;

      // Ligne 8 : colonnes n-1 a n-8, puis 7, puis 5 a 0.
      if (i < 8) m[8][n - 1 - i] = b;
      else if (i === 8) m[8][7] = b;
      else m[8][14 - i] = b;
    }
  }

  // Quatre regles de penalite de la norme. Le masque retenu est celui qui
  // marque le moins : c'est ce qui evite les grandes plages uniformes et les
  // faux motifs de detection, deux choses qui font echouer un lecteur.
  function penalite(m) {
    var n = m.length, p = 0, i, j, k;

    // 1 — suites de cinq modules ou plus de meme couleur.
    for (i = 0; i < n; i++) {
      var suiteL = 1, suiteC = 1;
      for (j = 1; j < n; j++) {
        suiteL = (m[i][j] === m[i][j - 1]) ? suiteL + 1 : 1;
        if (suiteL === 5) p += 3; else if (suiteL > 5) p += 1;
        suiteC = (m[j][i] === m[j - 1][i]) ? suiteC + 1 : 1;
        if (suiteC === 5) p += 3; else if (suiteC > 5) p += 1;
      }
    }

    // 2 — blocs 2x2 de meme couleur.
    for (i = 0; i < n - 1; i++) for (j = 0; j < n - 1; j++) {
      var v = m[i][j];
      if (v === m[i][j + 1] && v === m[i + 1][j] && v === m[i + 1][j + 1]) p += 3;
    }

    // 3 — motif 1:1:3:1:1 precede ou suivi de quatre clairs.
    var A = [1,0,1,1,1,0,1,0,0,0,0], B = [0,0,0,0,1,0,1,1,1,0,1];
    for (i = 0; i < n; i++) for (j = 0; j <= n - 11; j++) {
      var okLA = true, okLB = true, okCA = true, okCB = true;
      for (k = 0; k < 11; k++) {
        if (m[i][j + k] !== A[k]) okLA = false;
        if (m[i][j + k] !== B[k]) okLB = false;
        if (m[j + k][i] !== A[k]) okCA = false;
        if (m[j + k][i] !== B[k]) okCB = false;
      }
      if (okLA) p += 40; if (okLB) p += 40; if (okCA) p += 40; if (okCB) p += 40;
    }

    // 4 — ecart a 50 % de modules sombres.
    var sombres = 0;
    for (i = 0; i < n; i++) for (j = 0; j < n; j++) sombres += m[i][j];
    var pct = sombres * 100 / (n * n);
    p += Math.floor(Math.abs(pct - 50) / 5) * 10;
    return p;
  }

  /* ── API ─────────────────────────────────────────────────────────────── */

  function matrice(texte, niveau) {
    var niv = NIV_BITS.hasOwnProperty(niveau) ? niveau : 'M';
    var octets = utf8(String(texte == null ? '' : texte));

    // Plus petite version qui contient le message. Le compteur de caracteres
    // change de taille a la version 10 : la capacite doit donc etre evaluee
    // version par version, pas une fois pour toutes.
    var v = 0;
    for (var t = 1; t <= 10; t++) {
      var b = BLOCS[niv][t];
      var capacite = b[1] * b[2] + b[3] * b[4];
      var entete = 4 + (t <= 9 ? 8 : 16);
      if (octets.length * 8 + entete <= capacite * 8) { v = t; break; }
    }
    if (!v) {
      throw new Error('QR : ' + octets.length + ' octets, au-dela de la version 10 ' +
                      'au niveau ' + niv + '. Raccourcis le texte.');
    }

    var mots = entrelace(motsDeDonnees(octets, v, niv), v, niv);
    var bits = [];
    for (var i = 0; i < mots.length; i++)
      for (var j = 7; j >= 0; j--) bits.push((mots[i] >> j) & 1);
    for (i = 0; i < RESTE[v]; i++) bits.push(0);

    var n = v * 4 + 17;
    function neuve() {
      var g = [];
      for (var r = 0; r < n; r++) { g.push([]); for (var c = 0; c < n; c++) g[r].push(0); }
      return g;
    }
    var base = neuve(), res = neuve();
    motifs(base, res, v);
    poserDonnees(base, res, bits);

    // Les huit masques sont evalues ; on garde le moins penalise.
    var meilleur = null, meilleurScore = Infinity;
    for (var k = 0; k < 8; k++) {
      var m = base.map(function (l) { return l.slice(); });
      for (var r2 = 0; r2 < n; r2++) for (var c2 = 0; c2 < n; c2++)
        if (!res[r2][c2] && masqueTest(k, r2, c2)) m[r2][c2] ^= 1;
      poserFormat(m, niv, k);
      var s = penalite(m);
      if (s < meilleurScore) { meilleurScore = s; meilleur = m; }
    }
    return meilleur;
  }

  /**
   * SVG pret a imprimer. La zone calme de 4 modules est POSEE ICI : sans
   * elle, beaucoup de lecteurs — dont la camera de l'iPhone — refusent le
   * code, et c'est l'oubli le plus frequent.
   * @param {string} texte
   * @param {{taille?:number, niveau?:string, marge?:number, fond?:string, encre?:string}} opts
   */
  function svg(texte, opts) {
    opts = opts || {};
    var m = matrice(texte, opts.niveau || 'M');
    var n = m.length;
    var marge = opts.marge == null ? 4 : opts.marge;
    var total = n + marge * 2;
    var taille = opts.taille || 160;
    var encre = opts.encre || '#000000';
    var fond = opts.fond || '#FFFFFF';

    // Un seul <path> plutot que N rects : a 45x45 modules, cela fait un noeud
    // au lieu de deux mille, et l'impression d'une planche de 40 etiquettes
    // reste fluide.
    var d = '';
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++)
      if (m[r][c]) d += 'M' + (c + marge) + ' ' + (r + marge) + 'h1v1h-1z';

    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + taille + '" height="' + taille +
      '" viewBox="0 0 ' + total + ' ' + total + '" shape-rendering="crispEdges" role="img">' +
      '<rect width="' + total + '" height="' + total + '" fill="' + fond + '"/>' +
      '<path d="' + d + '" fill="' + encre + '"/></svg>';
  }

  global.ZTSQR = { matrice: matrice, svg: svg };
  if (typeof module !== 'undefined' && module.exports) module.exports = global.ZTSQR;
})(typeof window !== 'undefined' ? window : globalThis);
