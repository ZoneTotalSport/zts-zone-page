/**
 * zts-fiche-formes.js — rendu des formes et des surcharges de style.
 *
 * Presentation SEULE : aucune poignee, aucun evenement, aucune selection.
 * C'est la moitie non interactive de ce que l'editeur (/admin/fiches) sait
 * dessiner. La logique geometrique est reprise trait pour trait de
 * `renderShapes()` et `applyStyle()` de l'editeur, dont il reste la source
 * de verite : si un type de forme y change, il change ici aussi.
 *
 * Types couverts : rect · cercle · ligne · fleche · texte · boite · badge ·
 * trace (plume vectorielle, points en unites de page, angles ou courbes).
 *
 * Les coordonnees sont en pixels dans le repere de la page — 850x1100 en
 * portrait, 1100x850 en paysage. C'est pour ca que ces dimensions ne
 * doivent jamais bouger : tout ce qui a ete place se decalerait.
 *
 * Expose window.ZTSFormes.
 */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var POLICE_ZTS = "'ZoneTotalSportFiche', Bangers, cursive";

  function nombre(v, defaut) {
    var n = parseFloat(v);
    return isFinite(n) ? n : defaut;
  }

  /* ── Surcharges de style sur un element existant ─────────────────────
   * Miroir de applyStyle() de l'editeur, sans le rappel a baseCss() : ici
   * le style de base vient deja du balisage produit par zts-fiche-modele.js.
   */
  function appliquerStyle(el, s) {
    if (!el || !s) return;
    if (s.font) el.style.fontFamily = s.font === 'zts' ? POLICE_ZTS : s.font;
    if (s.size) el.style.fontSize = s.size + 'px';
    if (s.stroke !== undefined) {
      el.style.webkitTextStroke = s.stroke + 'pt ' + (s.strokeColor || '#000');
      el.style.paintOrder = 'stroke fill';
    }
    if (s.word !== undefined) el.style.wordSpacing = s.word + 'px';
    if (s.shadow !== undefined) {
      el.style.textShadow = s.shadow > 0
        ? s.shadow + 'px ' + s.shadow + 'px 0 ' + (s.strokeColor || '#000')
        : 'none';
    }
    if (s.color) el.style.color = s.color;
    if (s.align) el.style.textAlign = s.align;
    if (s.lh) el.style.lineHeight = s.lh;
    if (s.ls !== undefined) el.style.letterSpacing = s.ls + 'px';
    if (s.z !== undefined) {
      if (!el.style.position) el.style.position = 'relative';
      el.style.zIndex = s.z;
    }
    // `hidden` masque cote editeur ; en public on retire l'element du flux
    // exactement pareil, sinon une case masquee reapparaitrait au visiteur.
    if (s.hidden) el.style.display = 'none';
    if (s.w) el.style.width = s.w + 'px';
    if (s.hgt) el.style.height = s.hgt + 'px';
    var tr = [];
    if (s.dx || s.dy) tr.push('translate(' + (s.dx || 0) + 'px,' + (s.dy || 0) + 'px)');
    if (s.rot) tr.push('rotate(' + s.rot + 'deg)');
    if (tr.length) el.style.transform = tr.join(' ');
  }

  /**
   * Resout une cle de style vers son element.
   *
   * Deux familles, toutes deux EXPLICITES — jamais un chemin d'indices DOM,
   * qui se reattacherait au mauvais element des qu'un div bouge :
   *   `<chemin>`     -> [data-champ]  texte editable ou <image-slot>
   *   `b:<chemin>`   -> [data-bloc]   cadre d'image (le contour noir)
   */
  function elementDeCle(racine, cle) {
    var bloc = cle.indexOf('b:') === 0;
    var attr = bloc ? 'data-bloc' : 'data-champ';
    var val = bloc ? cle.slice(2) : cle;
    return racine.querySelector('[' + attr + '="' + val.replace(/"/g, '\\"') + '"]');
  }

  /**
   * Applique toutes les surcharges d'une fiche.
   * Une cle qui ne resout rien est ignoree en silence : c'est le cas normal
   * d'une fiche dont la structure a change.
   */
  function appliquerStyles(racine, styles) {
    if (!styles) return { appliques: 0, orphelins: [] };
    var ok = 0, orphelins = [];
    Object.keys(styles).forEach(function (cle) {
      var el = elementDeCle(racine, cle);
      if (!el) { orphelins.push(cle); return; }
      appliquerStyle(el, styles[cle]);
      ok++;
    });
    return { appliques: ok, orphelins: orphelins };
  }

  /* ── Chemin SVG d'un trace ──────────────────────────────────────────
   * Repris a l'identique de l'editeur : en mode « courbes », chaque point
   * intermediaire devient le point de controle d'un Q vers le milieu du
   * segment suivant. Toute autre interpolation deplacerait les traces
   * deja dessines.
   */
  function cheminTrace(points, lisse, ferme) {
    var pts = points || [];
    if (!pts.length) return '';
    var d;
    if (lisse && pts.length > 2) {
      d = 'M ' + pts[0][0] + ' ' + pts[0][1];
      for (var i = 1; i < pts.length - 1; i++) {
        var mx = (pts[i][0] + pts[i + 1][0]) / 2;
        var my = (pts[i][1] + pts[i + 1][1]) / 2;
        d += ' Q ' + pts[i][0] + ' ' + pts[i][1] + ' ' + mx + ' ' + my;
      }
      d += ' L ' + pts[pts.length - 1][0] + ' ' + pts[pts.length - 1][1];
    } else {
      d = 'M ' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L ');
    }
    if (ferme && pts.length > 2) d += ' Z';
    return d;
  }

  function svgTrace(sh, largeurPage, hauteurPage) {
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', largeurPage);
    svg.setAttribute('height', hauteurPage);
    svg.setAttribute('class', 'zts-forme');
    svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;pointer-events:none;';
    var path = document.createElementNS(NS, 'path');
    path.setAttribute('d', cheminTrace(sh.points, sh.smooth, sh.closed));
    path.setAttribute('fill', sh.fill && sh.fill !== 'transparent' ? sh.fill : 'none');
    path.setAttribute('stroke', sh.strokeColor || '#101010');
    path.setAttribute('stroke-width', nombre(sh.thickness, 6));
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('stroke-linecap', 'round');
    svg.appendChild(path);
    return svg;
  }

  /** Fleche : une ligne + une pointe, en SVG pour rester nette a l'impression. */
  function svgFleche(sh) {
    var w = Math.max(1, nombre(sh.w, 120));
    var h = Math.max(1, nombre(sh.h, 40));
    var ep = nombre(sh.thickness, 6);
    var c = sh.strokeColor || '#101010';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible;';
    var y = h / 2;
    var pointe = Math.min(w * 0.4, Math.max(10, ep * 3));
    var ligne = document.createElementNS(NS, 'path');
    ligne.setAttribute('d', 'M 0 ' + y + ' L ' + (w - pointe) + ' ' + y);
    ligne.setAttribute('stroke', c);
    ligne.setAttribute('stroke-width', ep);
    ligne.setAttribute('stroke-linecap', 'round');
    ligne.setAttribute('fill', 'none');
    var tete = document.createElementNS(NS, 'path');
    tete.setAttribute('d', 'M ' + w + ' ' + y +
      ' L ' + (w - pointe) + ' ' + (y - pointe * 0.6) +
      ' L ' + (w - pointe) + ' ' + (y + pointe * 0.6) + ' Z');
    tete.setAttribute('fill', c);
    svg.appendChild(ligne);
    svg.appendChild(tete);
    return svg;
  }

  /** Une forme -> un element pret a inserer dans la page. */
  function elementForme(sh, largeurPage, hauteurPage) {
    if (sh.type === 'trace') return svgTrace(sh, largeurPage, hauteurPage);

    var el = document.createElement('div');
    el.className = 'zts-forme';
    el.style.position = 'absolute';
    el.style.left = nombre(sh.x, 0) + 'px';
    el.style.top = nombre(sh.y, 0) + 'px';
    el.style.width = nombre(sh.w, 100) + 'px';
    el.style.height = nombre(sh.h, 100) + 'px';
    el.style.boxSizing = 'border-box';
    if (sh.rot) el.style.transform = 'rotate(' + sh.rot + 'deg)';

    var trait = sh.strokeColor || '#101010';
    var fond = sh.fill && sh.fill !== 'transparent' ? sh.fill : null;
    var ombre = sh.shadow === undefined ? 3 : nombre(sh.shadow, 3);

    switch (sh.type) {
      case 'rect':
        el.style.background = fond || 'transparent';
        el.style.border = nombre(sh.thickness, 3) + 'px solid ' + trait;
        break;

      case 'cercle':
        el.style.background = fond || 'transparent';
        el.style.border = nombre(sh.thickness, 3) + 'px solid ' + trait;
        el.style.borderRadius = '50%';
        break;

      case 'ligne':
        el.style.height = nombre(sh.thickness, 6) + 'px';
        el.style.background = trait;
        break;

      case 'fleche':
        el.appendChild(svgFleche(sh));
        break;

      case 'boite':
        el.style.background = fond || '#FFF200';
        el.style.border = nombre(sh.thickness, 3) + 'px solid ' + trait;
        el.style.boxShadow = ombre + 'px ' + ombre + 'px 0 ' + trait;
        break;

      case 'texte':
        el.style.font = '700 ' + nombre(sh.size, 40) + 'px ' + (sh.font || POLICE_ZTS);
        el.style.color = sh.color || '#22ccf5';
        el.style.webkitTextStroke = (sh.stroke === undefined ? 1.5 : nombre(sh.stroke, 1.5)) + 'pt ' + trait;
        el.style.paintOrder = 'stroke fill';
        el.style.textShadow = nombre(sh.shadow, 0) > 0
          ? sh.shadow + 'px ' + sh.shadow + 'px 0 ' + trait : 'none';
        el.style.lineHeight = '1.4';
        el.style.whiteSpace = 'pre-wrap';
        el.style.wordSpacing = '5px';
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.textAlign = 'center';
        el.textContent = sh.text || '';
        break;

      case 'badge':
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.justifyContent = 'center';
        el.style.padding = '4px 12px';
        el.style.background = fond || '#FFF200';
        el.style.border = nombre(sh.thickness, 3) + 'px solid ' + trait;
        el.style.boxShadow = ombre + 'px ' + ombre + 'px 0 ' + trait;
        el.style.font = '700 ' + nombre(sh.size, 15) + 'px ' + (sh.font || POLICE_ZTS);
        el.style.color = sh.color || '#ffffff';
        el.style.webkitTextStroke = (sh.stroke === undefined ? 0.9 : nombre(sh.stroke, 0.9)) + 'pt ' + trait;
        el.style.paintOrder = 'stroke fill';
        el.style.textShadow = '2px 2px 0 ' + trait;
        el.style.wordSpacing = '5px';
        el.style.letterSpacing = '0.6px';
        el.style.textAlign = 'center';
        el.style.lineHeight = '1.5';
        el.textContent = sh.text || '';
        break;

      default:
        // Type inconnu : on ne devine pas, on n'affiche rien. Mieux vaut une
        // page fidele au reste qu'un rectangle inventé au milieu d'une fiche.
        return null;
    }
    return el;
  }

  /**
   * Dessine les formes d'une fiche.
   *
   * @param {Element} racine      conteneur rendu par ZTSFiche.rendre()
   * @param {Array}   formes      tableau `formes` de la fiche
   * @returns {{dessinees:number, ignorees:number}}
   */
  function dessiner(racine, formes) {
    if (!formes || !formes.length) return { dessinees: 0, ignorees: 0 };

    // Les pages, dans l'ordre — meme indexation que l'editeur (index du
    // .zts-page-wrap), c'est la cle du champ `page` de chaque forme.
    var pages = Array.prototype.map.call(
      racine.querySelectorAll('.zts-page-wrap'),
      function (w) { return w.querySelector('[data-page]'); }
    );

    Array.prototype.forEach.call(racine.querySelectorAll('.zts-forme'),
      function (n) { n.parentNode.removeChild(n); });

    var dessinees = 0, ignorees = 0;
    formes.forEach(function (sh, rang) {
      var page = pages[sh.page];
      // Une forme posee sur une page qui n'existe plus (section retiree)
      // est ignoree, pas rejetee sur la page 1 : elle atterrirait au milieu
      // du titre.
      if (!page || sh.hiddenLayer) { ignorees++; return; }
      var el = elementForme(sh, page.offsetWidth, page.offsetHeight);
      if (!el) { ignorees++; return; }
      // L'identifiant sert a retrouver la forme apres un redessin complet —
      // l'index de la boucle ne suffit pas, les formes masquees sont sautees.
      if (sh.id) el.setAttribute('data-forme', sh.id);
      // L'ordre de peinture est l'ordre du tableau, comme dans le panneau
      // CALQUES de l'editeur.
      el.style.zIndex = 10 + rang;
      page.appendChild(el);
      dessinees++;
    });

    return { dessinees: dessinees, ignorees: ignorees };
  }

  global.ZTSFormes = {
    dessiner: dessiner,
    elementForme: elementForme,
    appliquerStyles: appliquerStyles,
    appliquerStyle: appliquerStyle,
    elementDeCle: elementDeCle,
    cheminTrace: cheminTrace,
    POLICE_ZTS: POLICE_ZTS
  };
})(window);
