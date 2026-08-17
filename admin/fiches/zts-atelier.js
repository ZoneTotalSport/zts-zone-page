/**
 * zts-atelier.js — coque d'edition des fiches de jeu (/admin/fiches).
 *
 * Portage natif de la disposition « logiciel vectoriel » de la maquette
 * « Fiche de jeu.dc.html » : barre superieure, rail d'outils, dock, barre
 * d'etat. Tout le chrome porte `.zts-ui`, donc rien de tout ca n'existe a
 * l'impression ni pour un visiteur.
 *
 * CE QUE L'ATELIER ECRIT — et rien d'autre :
 *
 *   fiche.formes  [ {id,page,type,x,y,w,h,thickness,fill,strokeColor,color,
 *                    size,stroke,shadow,rot,text,hiddenLayer} ]
 *   fiche.styles  { <cle>: {font,size,stroke,strokeColor,word,shadow,color,
 *                           align,lh,ls,rot,z,hidden,dx,dy,w,hgt,altA,altB} }
 *
 * Les deux champs sont deja acceptes par zts-fiches-firebase.js (partie
 * privee du document) et deja rendus par zts-fiche-formes.js cote public :
 * l'atelier ferme la boucle, il n'invente pas de format.
 *
 * CLES DE STYLE — explicites, jamais des chemins d'indices DOM :
 *   `sections.0.explications.1.texte`   -> [data-champ]
 *   `b:sections.0.explications.1.imagePath` -> [data-bloc] (cadre d'image)
 *
 * ABSENT DE CETTE ETAPE (etape 2) : plume vectorielle et edition des
 * points, grille / regles / reperes, magnetisme et guides, import-export
 * JSON. Les traces deja poses restent rendus, ici comme en public — ils ne
 * sont simplement pas selectionnables (leur SVG est en pointer-events:none).
 *
 * Expose window.ZTSAtelier.
 */
(function (global) {
  'use strict';

  var MARGE_X = 62;   // marges de composition de la maquette, en unites de page
  var MARGE_Y = 54;
  var MAX_HIST = 40;

  var POLICES = [
    { v: 'zts', n: 'ZoneTotalSport' },
    { v: "'Luckiest Guy',cursive", n: 'Luckiest Guy' },
    { v: "'Bangers',cursive", n: 'Bangers' },
    { v: "'Comic Neue','Comic Sans MS',cursive", n: 'Comic Neue' },
    { v: "'Quicksand',sans-serif", n: 'Quicksand' }
  ];

  /* Gabarits de forme. Les valeurs par defaut sont celles que
   * zts-fiche-formes.js utilise quand le champ manque : une forme posee ici
   * rend donc exactement pareil en public. */
  var OUTILS = [
    { id: 'rect',   icone: '▭', titre: 'Rectangle',  w: 220, h: 140 },
    { id: 'cercle', icone: '◯', titre: 'Cercle',     w: 160, h: 160 },
    { id: 'ligne',  icone: '╱', titre: 'Ligne',      w: 240, h: 6   },
    { id: 'fleche', icone: '➜', titre: 'Flèche',     w: 180, h: 60  },
    { id: 'boite',  icone: '▧', titre: 'Boîte',      w: 240, h: 120 },
    { id: 'badge',  icone: '⬭', titre: 'Étiquette',  w: 180, h: 44, text: 'ÉTIQUETTE' },
    { id: 'texte',  icone: 'T', titre: 'Texte',      w: 320, h: 70, text: 'Texte' }
  ];

  var ctx = null;          // fourni par zts-editeur.js
  var actif = false;
  var construit = false;

  var sel = null;          // { genre:'forme'|'champ'|'bloc', id, cle, el }
  var outil = null;        // id d'outil de pose, ou null
  var onglet = 'transformer';
  var hist = { pile: [], pos: -1, gele: false };

  var dom = {};

  /* ══ Acces au modele ═══════════════════════════════════════════════════ */

  function fiche() { return ctx.fiche(); }

  function formes() {
    var f = fiche();
    if (!f.formes) f.formes = [];
    return f.formes;
  }

  function styles() {
    var f = fiche();
    if (!f.styles) f.styles = {};
    return f.styles;
  }

  /**
   * Le style d'une cle, cree a la demande.
   * A n'appeler qu'au moment d'ECRIRE : le creer a la selection sèmerait des
   * `{}` vides dans le document, que le rendu public compterait ensuite en
   * cles orphelines a chaque fiche ouverte puis refermee sans rien changer.
   */
  function style(cle) {
    var s = styles();
    if (!s[cle]) s[cle] = {};
    return s[cle];
  }

  /** Lecture seule — ne cree rien. */
  function styleLu(cle) {
    var f = fiche();
    return (f && f.styles && f.styles[cle]) || {};
  }

  function formeParId(id) {
    var l = formes();
    for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i];
    return null;
  }

  /**
   * Identifiant de forme. Un compteur relu depuis le tableau, pas un
   * horodatage : deux formes posees dans la meme milliseconde auraient le
   * meme id, et l'une effacerait l'autre au redessin.
   */
  function nouvelIdForme() {
    var max = 0;
    formes().forEach(function (s) {
      var m = /^f(\d+)$/.exec(String(s.id || ''));
      if (m && +m[1] > max) max = +m[1];
    });
    return 'f' + (max + 1);
  }

  /* ══ Historique ════════════════════════════════════════════════════════ */

  /**
   * Instantanes de la fiche entiere. Snapshots plutot que commandes
   * inversibles : une fiche fait quelques dizaines de kilo-octets, et
   * l'inverse d'un « redimensionner un cadre » n'est pas trivial a ecrire.
   */
  function instantane(libelle) {
    if (hist.gele) return;
    var copie = JSON.stringify(fiche());
    if (hist.pos >= 0 && hist.pile[hist.pos] &&
        hist.pile[hist.pos].data === copie) return;
    hist.pile = hist.pile.slice(0, hist.pos + 1);
    hist.pile.push({ libelle: libelle || 'Modification', data: copie });
    if (hist.pile.length > MAX_HIST) hist.pile.shift();
    hist.pos = hist.pile.length - 1;
    majDock();
    majBarre();
  }

  function allerA(pos) {
    if (pos < 0 || pos >= hist.pile.length) return;
    hist.pos = pos;
    hist.gele = true;
    try {
      ctx.remplacer(JSON.parse(hist.pile[pos].data));
    } finally {
      hist.gele = false;
    }
    deselectionner();
    majBarre();
    majDock();
  }

  function annuler() { if (hist.pos > 0) allerA(hist.pos - 1); }
  function refaire() { if (hist.pos < hist.pile.length - 1) allerA(hist.pos + 1); }

  /** Premier instantane : l'etat d'ouverture, pour pouvoir y revenir. */
  function reinitialiserHistorique() {
    hist.pile = [];
    hist.pos = -1;
    instantane('Ouverture');
  }

  /* ══ Construction du chrome ════════════════════════════════════════════ */

  function bouton(txt, titre, onclic, cls) {
    var b = document.createElement('button');
    b.type = 'button';
    b.textContent = txt;
    if (titre) b.title = titre;
    if (cls) b.className = cls;
    b.addEventListener('click', onclic);
    return b;
  }

  function sep() {
    var s = document.createElement('span');
    s.className = 'zts-atl-sep';
    return s;
  }

  function champ(type, titre, onchange, attrs) {
    var i = document.createElement('input');
    i.type = type;
    if (titre) i.title = titre;
    Object.keys(attrs || {}).forEach(function (k) { i.setAttribute(k, attrs[k]); });
    i.addEventListener('change', onchange);
    return i;
  }

  function etiquette(texte, controle) {
    var l = document.createElement('label');
    l.appendChild(document.createTextNode(texte));
    l.appendChild(controle);
    return l;
  }

  function panneau(id, classe) {
    var d = document.createElement('div');
    d.id = id;
    d.className = 'zts-atl zts-ui' + (classe ? ' ' + classe : '');
    return d;
  }

  function construireBarre() {
    var barre = panneau('zts-atl-barre');

    var r1 = document.createElement('div');
    r1.className = 'rangee';
    dom.annuler = bouton('↶', 'Annuler (Ctrl+Z)', annuler);
    dom.refaire = bouton('↷', 'Refaire (Ctrl+Maj+Z)', refaire);
    dom.devant = bouton('⤒', 'Mettre devant', function () { ordonner(1); });
    dom.derriere = bouton('⤓', 'Mettre derrière', function () { ordonner(-1); });
    dom.dupliquer = bouton('⧉', 'Dupliquer (Ctrl+D)', dupliquer);
    dom.supprimer = bouton('✕', 'Supprimer (Suppr)', supprimerSelection);
    [dom.annuler, dom.refaire, sep(), dom.devant, dom.derriere, sep(),
     dom.dupliquer, dom.supprimer].forEach(function (e) { r1.appendChild(e); });

    dom.doc = document.createElement('span');
    dom.doc.className = 'doc';
    r1.appendChild(dom.doc);
    r1.appendChild(bouton('▴', 'Replier la barre', function () {
      dom.corps.hidden = !dom.corps.hidden;
      appliquerDecalages();
    }));
    barre.appendChild(r1);

    dom.corps = document.createElement('div');
    dom.corps.id = 'zts-atl-corps';
    barre.appendChild(dom.corps);

    dom.corps.appendChild(construireRangeeObjet());
    dom.corps.appendChild(construireRangeeTexte());
    return barre;
  }

  /** Rangee OBJET — remplissage, trait, epaisseur, ombre, alignement page. */
  function construireRangeeObjet() {
    var r = document.createElement('div');
    r.className = 'rangee';
    r.appendChild(titre('Objet'));

    dom.fill = champ('color', 'Couleur de remplissage', function () {
      majSel({ fill: dom.fill.value }, 'Remplissage');
    });
    dom.sansFond = bouton('∅', 'Sans remplissage', function () {
      majSel({ fill: 'transparent' }, 'Sans remplissage');
    });
    dom.trait = champ('color', 'Couleur du trait', function () {
      majSel({ strokeColor: dom.trait.value }, 'Trait');
    });
    dom.epaisseur = champ('number', 'Épaisseur du trait', function () {
      majSel({ thickness: +dom.epaisseur.value }, 'Épaisseur');
    }, { min: 0, max: 40, step: 1 });
    dom.ombre = champ('number', 'Décalage de l’ombre (px)', function () {
      majSel({ shadow: +dom.ombre.value }, 'Ombre');
    }, { min: 0, max: 14, step: 1 });

    // Remplissage et trait ne concernent que les formes ; l'alignement vaut
    // pour tout ce qui se pose sur une page, cadre d'image compris.
    dom.grpForme = document.createElement('span');
    dom.grpForme.style.cssText = 'display:inline-flex;align-items:center;gap:6px;';
    [etiquette('Fond', dom.fill), dom.sansFond, etiquette('Trait', dom.trait),
     etiquette('Ép.', dom.epaisseur), etiquette('Ombre', dom.ombre), sep()]
      .forEach(function (e) { dom.grpForme.appendChild(e); });
    r.appendChild(dom.grpForme);

    r.appendChild(titre('Aligner'));
    [['⇤', 'gauche'], ['⇔', 'centre-h'], ['⇥', 'droite'],
     ['⤒', 'haut'], ['⇕', 'centre-v'], ['⤓', 'bas']].forEach(function (a) {
      r.appendChild(bouton(a[0], 'Aligner sur la page : ' + a[1], function () { aligner(a[1]); }));
    });
    dom.rangeeObjet = r;
    return r;
  }

  /** Rangee CARACTERE — ce qui s'ecrit dans `styles[cle]` ou sur la forme. */
  function construireRangeeTexte() {
    var r = document.createElement('div');
    r.className = 'rangee';
    r.appendChild(titre('Caractère'));

    dom.police = document.createElement('select');
    POLICES.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p.v; o.textContent = p.n;
      dom.police.appendChild(o);
    });
    dom.police.title = 'Police';
    dom.police.addEventListener('change', function () {
      majSel({ font: dom.police.value }, 'Police');
    });

    dom.taille = champ('number', 'Taille (px)', function () {
      majSel({ size: +dom.taille.value }, 'Taille');
    }, { min: 6, max: 200, step: 1 });
    dom.couleur = champ('color', 'Couleur du texte', function () {
      majSel({ color: dom.couleur.value }, 'Couleur');
    });
    dom.contour = champ('number', 'Épaisseur du contour (pt)', function () {
      majSel({ stroke: +dom.contour.value }, 'Contour');
    }, { min: 0, max: 8, step: 0.5 });
    dom.contourCouleur = champ('color', 'Couleur du contour', function () {
      majSel({ strokeColor: dom.contourCouleur.value }, 'Contour');
    });
    dom.ombreTexte = champ('number', 'Ombre portée du texte (px)', function () {
      majSel({ shadow: +dom.ombreTexte.value }, 'Ombre');
    }, { min: 0, max: 14, step: 1 });
    dom.interligne = champ('number', 'Interligne', function () {
      majSel({ lh: +dom.interligne.value }, 'Interligne');
    }, { min: 0.5, max: 6, step: 0.05 });
    dom.lettres = champ('number', 'Espacement des lettres (px)', function () {
      majSel({ ls: +dom.lettres.value }, 'Lettres');
    }, { min: -5, max: 20, step: 0.1 });
    dom.mots = champ('number', 'Espacement des mots (px)', function () {
      majSel({ word: +dom.mots.value }, 'Mots');
    }, { min: 0, max: 40, step: 1 });

    r.appendChild(dom.police);
    r.appendChild(etiquette('Taille', dom.taille));
    r.appendChild(etiquette('Coul.', dom.couleur));
    r.appendChild(etiquette('Contour', dom.contour));
    r.appendChild(dom.contourCouleur);
    r.appendChild(etiquette('Ombre', dom.ombreTexte));
    r.appendChild(sep());
    dom.aligns = {};
    [['⯇', 'left'], ['≡', 'center'], ['⯈', 'right']].forEach(function (a) {
      var b = bouton(a[0], 'Alignement du texte', function () {
        majSel({ align: a[1] }, 'Alignement');
      });
      dom.aligns[a[1]] = b;
      r.appendChild(b);
    });
    r.appendChild(etiquette('Interl.', dom.interligne));
    r.appendChild(etiquette('Lettres', dom.lettres));
    r.appendChild(etiquette('Mots', dom.mots));

    // Titre alterne : deux couleurs, appliquees au RENDU (les <span> sont
    // regeneres), pas par appliquerStyle(). Visible seulement sur le titre.
    dom.altBoite = document.createElement('span');
    dom.altBoite.style.cssText = 'display:inline-flex;align-items:center;gap:5px;';
    dom.altA = champ('color', 'Titre alterné — 1re couleur', function () {
      majSel({ altA: dom.altA.value }, 'Titre alterné');
    });
    dom.altB = champ('color', 'Titre alterné — 2e couleur', function () {
      majSel({ altB: dom.altB.value }, 'Titre alterné');
    });
    dom.altBoite.appendChild(sep());
    dom.altBoite.appendChild(titre('Titre alterné'));
    dom.altBoite.appendChild(dom.altA);
    dom.altBoite.appendChild(dom.altB);
    r.appendChild(dom.altBoite);

    dom.rangeeTexte = r;
    return r;
  }

  function titre(txt) {
    var s = document.createElement('span');
    s.className = 'zts-atl-titre';
    s.textContent = txt;
    return s;
  }

  function construireRail() {
    var rail = panneau('zts-atl-rail');
    dom.outils = {};

    var b = bouton('↖', 'Sélection (Échap)', function () { choisirOutil(null); });
    dom.outils[''] = b;
    rail.appendChild(b);

    OUTILS.forEach(function (o) {
      var t = bouton(o.icone, o.titre + ' — clique ensuite dans une page', function () {
        choisirOutil(o.id);
      });
      dom.outils[o.id] = t;
      rail.appendChild(t);
    });

    rail.appendChild(bouton('⧉', 'Dupliquer', dupliquer));
    rail.appendChild(bouton('👁', 'Masquer / afficher', basculerVisibilite));
    rail.appendChild(bouton('✕', 'Supprimer', supprimerSelection));
    return rail;
  }

  function construireDock() {
    var d = panneau('zts-atl-dock');

    var ong = document.createElement('div');
    ong.className = 'onglets';
    dom.onglets = {};
    [['transformer', 'Transf.'], ['calques', 'Calques'], ['historique', 'Histo.']]
      .forEach(function (o) {
        var b = bouton(o[1], null, function () { onglet = o[0]; majDock(); });
        dom.onglets[o[0]] = b;
        ong.appendChild(b);
      });
    d.appendChild(ong);

    dom.panneau = document.createElement('div');
    dom.panneau.className = 'panneau';
    d.appendChild(dom.panneau);
    return d;
  }

  function construireEtat() {
    var e = panneau('zts-atl-etat');
    dom.etatSel = document.createElement('span');
    dom.etatSel.className = 'sel';
    e.appendChild(dom.etatSel);
    var aide = document.createElement('span');
    aide.textContent =
      'Clic : sélectionner · Double-clic : écrire · Suppr : effacer · ' +
      'Échap : désélectionner · Ctrl+Z / Ctrl+Maj+Z · Ctrl+D : dupliquer';
    e.appendChild(aide);
    return e;
  }

  function construire() {
    if (construit) return;
    dom.barre = construireBarre();
    dom.rail = construireRail();
    dom.dock = construireDock();
    dom.etat = construireEtat();
    [dom.barre, dom.rail, dom.dock, dom.etat].forEach(function (n) {
      n.style.display = 'none';
      document.body.appendChild(n);
    });
    document.addEventListener('keydown', auClavier, true);
    global.addEventListener('resize', appliquerDecalages);
    construit = true;
  }

  /* ══ Decalages de la zone de travail ═══════════════════════════════════
   *
   * SEUL endroit a ajuster si un en-tete ou un pied de site vient s'inserer
   * autour des pages : tout se calcule a partir des dimensions REELLES du
   * chrome, jamais de constantes.
   *
   * La barre d'outils du document (#zts-barre-outils) est collante ; on la
   * repousse sous la barre de l'atelier au lieu de la laisser passer
   * dessous.
   */
  function appliquerDecalages() {
    var racine = ctx.racine();
    if (!actif) {
      racine.style.padding = '';
      var bo0 = document.getElementById('zts-barre-outils');
      if (bo0) bo0.style.top = '';
      return;
    }
    var hBarre = dom.barre.offsetHeight;
    var hEtat = dom.etat.offsetHeight;
    var lRail = dom.rail.offsetWidth;
    var lDock = dom.dock.offsetWidth;

    dom.rail.style.top = hBarre + 'px';
    dom.rail.style.bottom = hEtat + 'px';
    dom.dock.style.top = hBarre + 'px';
    dom.dock.style.bottom = hEtat + 'px';

    var bo = document.getElementById('zts-barre-outils');
    if (bo) bo.style.top = hBarre + 'px';

    racine.style.paddingTop = hBarre + 'px';
    racine.style.paddingBottom = hEtat + 12 + 'px';
    racine.style.paddingLeft = lRail + 12 + 'px';
    racine.style.paddingRight = lDock + 12 + 'px';
  }

  /* ══ Selection ═════════════════════════════════════════════════════════ */

  function pageDe(el) {
    var p = el.closest('[data-page]');
    return p || null;
  }

  function indexPage(page) {
    var pages = ctx.racine().querySelectorAll('[data-page]');
    return Array.prototype.indexOf.call(pages, page);
  }

  function elementSelection() {
    if (!sel) return null;
    if (sel.genre === 'forme') return ctx.racine().querySelector('[data-forme="' + sel.id + '"]');
    return ZTSFormes.elementDeCle(ctx.racine(), sel.cle);
  }

  function selectionnerForme(id) {
    sel = { genre: 'forme', id: id, cle: null };
    apresSelection();
  }

  function selectionnerCle(genre, cle) {
    sel = { genre: genre, id: null, cle: cle };
    apresSelection();
  }

  function deselectionner() {
    arreterEcriture();
    sel = null;
    apresSelection();
  }

  function apresSelection() {
    majCadre();
    majBarre();
    majDock();
    majEtat();
  }

  /* ══ Cadre de selection ════════════════════════════════════════════════ */

  function retirerCadre() {
    var c = ctx.racine().querySelector('.zts-atl-cadre');
    if (c) c.parentNode.removeChild(c);
  }

  function majCadre() {
    retirerCadre();
    var el = elementSelection();
    if (!el) return;
    var page = pageDe(el);
    if (!page) return;

    var rp = page.getBoundingClientRect();
    var re = el.getBoundingClientRect();
    var cadre = document.createElement('div');
    cadre.className = 'zts-atl-cadre';
    cadre.style.left = (re.left - rp.left) + 'px';
    cadre.style.top = (re.top - rp.top) + 'px';
    cadre.style.width = re.width + 'px';
    cadre.style.height = re.height + 'px';

    var poignee = document.createElement('div');
    poignee.className = 'zts-atl-poignee';
    poignee.title = 'Redimensionner';
    poignee.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      commencerRedimension(ev, el);
    });
    cadre.appendChild(poignee);
    page.appendChild(cadre);
  }

  /* ══ Deplacement et redimensionnement ══════════════════════════════════ */

  /** Geometrie courante de la selection, en unites de page. */
  function boite(el) {
    var page = pageDe(el);
    var rp = page.getBoundingClientRect();
    var re = el.getBoundingClientRect();
    return {
      page: page,
      x: re.left - rp.left, y: re.top - rp.top,
      w: re.width, h: re.height
    };
  }

  /**
   * Geometrie de la selection pour le dock.
   *
   * Une FORME donne toujours sa geometrie stockee, jamais sa mesure : une
   * forme tournee a une boite englobante plus grande que son rectangle, et
   * reafficher cette boite dans X/Y/L/H la ferait grandir a chaque
   * rotation. Un champ ou un cadre n'a pas de geometrie propre — lui, on le
   * mesure.
   *
   * `virtuelle` signale qu'aucun element n'est a l'ecran (forme masquee) :
   * sans ce repli, la selectionner depuis CALQUES donnerait un panneau vide,
   * donc aucun moyen de la reafficher de la.
   */
  function boiteSel() {
    if (sel && sel.genre === 'forme') {
      var sh = formeParId(sel.id);
      if (!sh) return null;
      return { page: null, virtuelle: !elementSelection(),
               x: sh.x || 0, y: sh.y || 0, w: sh.w || 0, h: sh.h || 0 };
    }
    var el = elementSelection();
    return el ? boite(el) : null;
  }

  function commencerDeplacement(ev, el) {
    var b = boite(el);
    var depart = { x: ev.clientX, y: ev.clientY };
    var forme = sel.genre === 'forme' ? formeParId(sel.id) : null;
    var cle = sel.cle;
    var lu = forme ? null : styleLu(cle);
    var dx0 = forme ? (forme.x || 0) : (lu.dx || 0);
    var dy0 = forme ? (forme.y || 0) : (lu.dy || 0);
    var cadre = ctx.racine().querySelector('.zts-atl-cadre');

    function bouger(e) {
      var dx = e.clientX - depart.x;
      var dy = e.clientY - depart.y;
      if (forme) {
        el.style.left = (dx0 + dx) + 'px';
        el.style.top = (dy0 + dy) + 'px';
      } else {
        el.style.transform = transformDe(lu, dx0 + dx, dy0 + dy);
      }
      if (cadre) {
        cadre.style.left = (b.x + dx) + 'px';
        cadre.style.top = (b.y + dy) + 'px';
      }
    }

    function finir(e) {
      document.removeEventListener('pointermove', bouger);
      document.removeEventListener('pointerup', finir);
      var dx = e.clientX - depart.x;
      var dy = e.clientY - depart.y;
      if (!dx && !dy) return;
      if (forme) { forme.x = Math.round(dx0 + dx); forme.y = Math.round(dy0 + dy); }
      else {
        var s = style(cle);
        s.dx = Math.round(dx0 + dx);
        s.dy = Math.round(dy0 + dy);
      }
      valider('Déplacement');
    }

    document.addEventListener('pointermove', bouger);
    document.addEventListener('pointerup', finir);
  }

  function commencerRedimension(ev, el) {
    var b = boite(el);
    var depart = { x: ev.clientX, y: ev.clientY };
    var forme = sel.genre === 'forme' ? formeParId(sel.id) : null;
    var cle = sel.cle;
    var cadre = ctx.racine().querySelector('.zts-atl-cadre');

    function bouger(e) {
      var w = Math.max(8, b.w + (e.clientX - depart.x));
      var h = Math.max(4, b.h + (e.clientY - depart.y));
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      if (cadre) { cadre.style.width = w + 'px'; cadre.style.height = h + 'px'; }
    }

    function finir(e) {
      document.removeEventListener('pointermove', bouger);
      document.removeEventListener('pointerup', finir);
      var w = Math.round(Math.max(8, b.w + (e.clientX - depart.x)));
      var h = Math.round(Math.max(4, b.h + (e.clientY - depart.y)));
      if (forme) { forme.w = w; forme.h = h; }
      else { var s = style(cle); s.w = w; s.hgt = h; }
      valider('Redimensionnement');
    }

    document.addEventListener('pointermove', bouger);
    document.addEventListener('pointerup', finir);
  }

  /** Miroir de la composition de transform faite par appliquerStyle(). */
  function transformDe(s, dx, dy) {
    var t = [];
    if (dx || dy) t.push('translate(' + dx + 'px,' + dy + 'px)');
    if (s.rot) t.push('rotate(' + s.rot + 'deg)');
    return t.join(' ');
  }

  /* ══ Pose de formes ════════════════════════════════════════════════════ */

  function choisirOutil(id) {
    outil = id || null;
    document.body.classList.toggle('zts-atelier-outil', !!outil);
    Object.keys(dom.outils).forEach(function (k) {
      dom.outils[k].classList.toggle('actif', k === (outil || ''));
    });
  }

  function poser(page, x, y) {
    var gab = null;
    OUTILS.forEach(function (o) { if (o.id === outil) gab = o; });
    if (!gab) return;

    var sh = {
      id: nouvelIdForme(),
      page: indexPage(page),
      type: gab.id,
      x: Math.round(x - gab.w / 2),
      y: Math.round(y - gab.h / 2),
      w: gab.w,
      h: gab.h
    };
    if (gab.text) sh.text = gab.text;
    formes().push(sh);
    choisirOutil(null);
    valider('Ajout : ' + gab.titre);
    selectionnerForme(sh.id);
  }

  /* ══ Actions sur la selection ══════════════════════════════════════════ */

  /**
   * Ecrit des proprietes sur la selection.
   * Une forme porte ses proprietes a plat ; un champ ou un bloc les porte
   * dans `styles[cle]`. Meme vocabulaire des deux cotes — c'est ce qui
   * permet aux rangees de la barre de servir aux deux.
   */
  function majSel(props, libelle) {
    if (!sel) return;
    var cible = sel.genre === 'forme' ? formeParId(sel.id) : style(sel.cle);
    if (!cible) return;
    Object.keys(props).forEach(function (k) { cible[k] = props[k]; });
    valider(libelle);
  }

  function ordonner(sens) {
    if (!sel) return;
    if (sel.genre !== 'forme') {
      // Un champ n'est pas dans le tableau des formes : son ordre de
      // peinture passe par z-index, pas par une permutation.
      var s = style(sel.cle);
      s.z = (s.z || 0) + sens;
      valider('Ordre');
      return;
    }
    var l = formes();
    var i = l.map(function (x) { return x.id; }).indexOf(sel.id);
    var j = i + sens;
    if (i < 0 || j < 0 || j >= l.length) return;
    var tmp = l[i]; l[i] = l[j]; l[j] = tmp;
    valider('Ordre');
  }

  function dupliquer() {
    if (!sel || sel.genre !== 'forme') return;
    var src = formeParId(sel.id);
    if (!src) return;
    var copie = JSON.parse(JSON.stringify(src));
    copie.id = nouvelIdForme();
    copie.x = (copie.x || 0) + 16;
    copie.y = (copie.y || 0) + 16;
    formes().push(copie);
    valider('Duplication');
    selectionnerForme(copie.id);
  }

  function basculerVisibilite() {
    if (!sel) return;
    if (sel.genre === 'forme') {
      var sh = formeParId(sel.id);
      if (sh) { sh.hiddenLayer = !sh.hiddenLayer; valider('Visibilité'); }
      return;
    }
    var s = style(sel.cle);
    s.hidden = !s.hidden;
    valider('Visibilité');
  }

  function supprimerSelection() {
    if (!sel) return;
    if (sel.genre === 'forme') {
      var l = formes();
      var i = l.map(function (x) { return x.id; }).indexOf(sel.id);
      if (i >= 0) l.splice(i, 1);
      sel = null;
      valider('Suppression');
      return;
    }
    // Un champ de la fiche ne se supprime pas — il se masque. L'effacer
    // laisserait un trou que le modele recreerait au prochain rendu.
    basculerVisibilite();
  }

  function aligner(ou) {
    if (!sel) return;
    var el = elementSelection();
    // Aligner suppose une page mesuree : rien a faire sur un objet masque.
    if (!el) { return; }
    var b = boite(el);
    var W = b.page.offsetWidth, H = b.page.offsetHeight;
    var x = b.x, y = b.y;
    if (ou === 'gauche') x = MARGE_X;
    if (ou === 'droite') x = W - MARGE_X - b.w;
    if (ou === 'centre-h') x = (W - b.w) / 2;
    if (ou === 'haut') y = MARGE_Y;
    if (ou === 'bas') y = H - MARGE_Y - b.h;
    if (ou === 'centre-v') y = (H - b.h) / 2;

    if (sel.genre === 'forme') {
      var sh = formeParId(sel.id);
      if (!sh) return;
      sh.x = Math.round(x); sh.y = Math.round(y);
    } else {
      var s = style(sel.cle);
      s.dx = Math.round((s.dx || 0) + x - b.x);
      s.dy = Math.round((s.dy || 0) + y - b.y);
    }
    valider('Alignement');
  }

  /** Commit : redessin complet, instantane, fiche marquee modifiee. */
  function valider(libelle) {
    ctx.change();
    ctx.redessiner();
    instantane(libelle);
  }

  /* ══ Ecriture de texte ═════════════════════════════════════════════════ */

  var enEcriture = null;

  function ecrire(el) {
    arreterEcriture();
    el.contentEditable = 'true';
    el.classList.add('zts-atl-ecrit');
    el.focus();
    enEcriture = el;
  }

  function arreterEcriture() {
    if (!enEcriture) return;
    enEcriture.contentEditable = 'false';
    enEcriture.classList.remove('zts-atl-ecrit');
    enEcriture.blur();
    enEcriture = null;
    instantane('Texte');
  }

  /* ══ Evenements dans les pages ═════════════════════════════════════════ */

  function auPointeur(ev) {
    if (!actif) return;
    var page = ev.target.closest ? ev.target.closest('[data-page]') : null;
    if (!page) return;

    if (outil) {
      var rp = page.getBoundingClientRect();
      poser(page, ev.clientX - rp.left, ev.clientY - rp.top);
      return;
    }

    if (enEcriture && enEcriture.contains(ev.target)) return;

    var forme = ev.target.closest('.zts-forme');
    if (forme && forme.getAttribute('data-forme')) {
      ev.preventDefault();
      selectionnerForme(forme.getAttribute('data-forme'));
      commencerDeplacement(ev, forme);
      return;
    }

    var ch = ev.target.closest('[data-champ]');
    var bl = ev.target.closest('[data-bloc]');
    // Le cadre l'emporte sur la case qu'il contient : c'est lui qui porte le
    // contour noir, donc lui qu'on veut deplacer.
    if (bl && (!ch || bl.contains(ch))) {
      ev.preventDefault();
      selectionnerCle('bloc', 'b:' + bl.getAttribute('data-bloc'));
      commencerDeplacement(ev, bl);
      return;
    }
    if (ch) {
      ev.preventDefault();
      selectionnerCle('champ', ch.getAttribute('data-champ'));
      commencerDeplacement(ev, ch);
      return;
    }
    deselectionner();
  }

  function auDoubleClic(ev) {
    if (!actif) return;
    var ch = ev.target.closest ? ev.target.closest('[data-champ]') : null;
    if (!ch || ch.tagName === 'IMAGE-SLOT') return;
    ev.preventDefault();
    selectionnerCle('champ', ch.getAttribute('data-champ'));
    ecrire(ch);
  }

  function auClavier(ev) {
    if (!actif) return;
    var dansUnChamp = /^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName);

    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
      if (dansUnChamp) return;
      ev.preventDefault();
      ev.shiftKey ? refaire() : annuler();
      return;
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'd') {
      if (dansUnChamp) return;
      ev.preventDefault();
      dupliquer();
      return;
    }
    if (ev.key === 'Escape') {
      if (enEcriture) { arreterEcriture(); return; }
      if (outil) { choisirOutil(null); return; }
      deselectionner();
      return;
    }
    if ((ev.key === 'Delete' || ev.key === 'Backspace') && !enEcriture && !dansUnChamp) {
      if (!sel) return;
      ev.preventDefault();
      supprimerSelection();
    }
  }

  /* ══ Mise a jour du chrome ═════════════════════════════════════════════ */

  function valeurSel(k) {
    if (!sel) return undefined;
    var o = sel.genre === 'forme' ? formeParId(sel.id) : styles()[sel.cle];
    return o ? o[k] : undefined;
  }

  function poserCouleur(input, v, defaut) {
    input.value = /^#[0-9a-f]{6}$/i.test(String(v)) ? v : defaut;
  }

  function poserNombre(input, v, defaut) {
    input.value = (v === undefined || v === null || v === '') ? defaut : v;
  }

  function majBarre() {
    dom.doc.textContent = (fiche() && fiche().titre) || 'Sans titre';
    dom.annuler.disabled = hist.pos <= 0;
    dom.refaire.disabled = hist.pos >= hist.pile.length - 1;
    var rien = !sel;
    dom.devant.disabled = rien;
    dom.derriere.disabled = rien;
    dom.dupliquer.disabled = !sel || sel.genre !== 'forme';
    dom.supprimer.disabled = rien;

    var estForme = sel && sel.genre === 'forme';
    var type = estForme ? valeurSel('type') : null;
    var texteux = !!sel && (!estForme ? sel.genre === 'champ'
                                      : (type === 'texte' || type === 'badge'));

    dom.rangeeObjet.style.display = sel ? '' : 'none';
    dom.grpForme.style.display = estForme ? '' : 'none';
    dom.rangeeTexte.style.display = texteux ? '' : 'none';
    dom.altBoite.style.display = (sel && sel.cle === 'titre') ? '' : 'none';

    if (estForme) {
      var fill = valeurSel('fill');
      poserCouleur(dom.fill, fill, '#FFF200');
      poserCouleur(dom.trait, valeurSel('strokeColor'), '#101010');
      poserNombre(dom.epaisseur, valeurSel('thickness'), type === 'ligne' ? 6 : 3);
      poserNombre(dom.ombre, valeurSel('shadow'), 3);
    }
    if (texteux) {
      dom.police.value = valeurSel('font') || (estForme ? '' : 'zts');
      poserNombre(dom.taille, valeurSel('size'), estForme ? 40 : '');
      poserCouleur(dom.couleur, valeurSel('color'), '#22ccf5');
      poserNombre(dom.contour, valeurSel('stroke'), '');
      poserCouleur(dom.contourCouleur, valeurSel('strokeColor'), '#101010');
      poserNombre(dom.ombreTexte, valeurSel('shadow'), '');
      poserNombre(dom.interligne, valeurSel('lh'), '');
      poserNombre(dom.lettres, valeurSel('ls'), '');
      poserNombre(dom.mots, valeurSel('word'), '');
      var al = valeurSel('align');
      Object.keys(dom.aligns).forEach(function (k) {
        dom.aligns[k].classList.toggle('actif', k === al);
      });
      if (sel.cle === 'titre') {
        poserCouleur(dom.altA, valeurSel('altA'), '#22ccf5');
        poserCouleur(dom.altB, valeurSel('altB'), '#FFF200');
      }
    }
    appliquerDecalages();
  }

  function majEtat() {
    if (!sel) { dom.etatSel.textContent = 'Aucune sélection'; return; }
    dom.etatSel.textContent = sel.genre === 'forme'
      ? 'Forme ' + sel.id + ' · ' + valeurSel('type')
      : (sel.genre === 'bloc' ? 'Cadre ' : 'Champ ') + (sel.cle || '').replace(/^b:/, '');
  }

  /* ── Dock ─────────────────────────────────────────────────────────────  */

  function majDock() {
    Object.keys(dom.onglets).forEach(function (k) {
      dom.onglets[k].classList.toggle('actif', k === onglet);
    });
    dom.panneau.innerHTML = '';
    if (onglet === 'transformer') dockTransformer();
    else if (onglet === 'calques') dockCalques();
    else dockHistorique();
  }

  function dockTransformer() {
    var b = boiteSel();
    if (!b) {
      dom.panneau.appendChild(msgVide('Sélectionne un objet dans une page.'));
      return;
    }
    var estForme = sel.genre === 'forme';
    if (b.virtuelle) {
      dom.panneau.appendChild(msgVide('Objet masqué — ses valeurs viennent de la fiche.'));
    }
    var g = document.createElement('div');
    g.className = 'grille2';

    var champs = [
      ['X', Math.round(b.x), function (v) { poserGeo('x', v, b); }],
      ['Y', Math.round(b.y), function (v) { poserGeo('y', v, b); }],
      ['L', Math.round(b.w), function (v) { poserGeo('w', v, b); }],
      ['H', Math.round(b.h), function (v) { poserGeo('h', v, b); }]
    ];
    champs.forEach(function (c) {
      var lab = document.createElement('span');
      lab.className = 'zts-atl-titre';
      lab.textContent = c[0];
      var i = champ('number', null, function () { c[2](+i.value); });
      i.value = c[1];
      g.appendChild(lab);
      g.appendChild(i);
    });
    dom.panneau.appendChild(g);

    var l1 = document.createElement('div');
    l1.className = 'ligne';
    var rot = champ('number', 'Rotation (°)', function () {
      majSel({ rot: +rot.value }, 'Rotation');
    }, { min: -180, max: 180, step: 1 });
    rot.value = valeurSel('rot') || 0;
    l1.appendChild(etiquette('Rotation', rot));
    dom.panneau.appendChild(l1);

    var l2 = document.createElement('div');
    l2.className = 'ligne';
    var masque = estForme ? valeurSel('hiddenLayer') : valeurSel('hidden');
    l2.appendChild(bouton(masque ? 'AFFICHER' : 'MASQUER', null, basculerVisibilite));
    if (estForme) l2.appendChild(bouton('SUPPRIMER', null, supprimerSelection));
    dom.panneau.appendChild(l2);
  }

  /**
   * Ecrit une geometrie saisie au clavier.
   * Pour un champ ou un cadre, X/Y sont des DECALAGES relatifs a la place
   * que le modele lui donne : on ecrit la difference, pas la valeur brute.
   */
  function poserGeo(quoi, v, b) {
    if (!sel) return;
    if (sel.genre === 'forme') {
      var m = { x: 'x', y: 'y', w: 'w', h: 'h' };
      var p = {};
      p[m[quoi]] = Math.round(v);
      majSel(p, 'Géométrie');
      return;
    }
    var s = style(sel.cle);
    if (quoi === 'x') s.dx = Math.round((s.dx || 0) + v - b.x);
    else if (quoi === 'y') s.dy = Math.round((s.dy || 0) + v - b.y);
    else if (quoi === 'w') s.w = Math.round(v);
    else s.hgt = Math.round(v);
    valider('Géométrie');
  }

  function msgVide(txt) {
    var p = document.createElement('p');
    p.className = 'vide';
    p.textContent = txt;
    return p;
  }

  function dockCalques() {
    var l = formes();
    if (!l.length) {
      dom.panneau.appendChild(msgVide('Aucune forme. Pose-en une avec le rail de gauche.'));
      return;
    }
    var pages = ctx.racine().querySelectorAll('[data-page]');
    var parPage = {};
    l.forEach(function (sh, i) {
      (parPage[sh.page] = parPage[sh.page] || []).push({ sh: sh, i: i });
    });

    Object.keys(parPage).sort(function (a, b) { return a - b; }).forEach(function (p) {
      var t = document.createElement('div');
      t.className = 'zts-atl-page-titre';
      t.textContent = 'Page ' + (+p + 1) + (pages[p] ? '' : ' (absente)');
      dom.panneau.appendChild(t);

      // Du dessus vers le dessous : l'ordre de peinture est l'ordre du
      // tableau, donc le dernier element est celui qui est devant.
      parPage[p].slice().reverse().forEach(function (e) {
        dom.panneau.appendChild(ligneCalque(e.sh));
      });
    });
  }

  function ligneCalque(sh) {
    var d = document.createElement('div');
    d.className = 'zts-atl-calque' +
      (sel && sel.id === sh.id ? ' sel' : '') +
      (sh.hiddenLayer ? ' masque' : '');

    var nom = document.createElement('span');
    nom.className = 'nom';
    nom.textContent = sh.type + (sh.text ? ' · ' + sh.text.slice(0, 14) : '') + ' · ' + sh.id;
    nom.addEventListener('click', function () { selectionnerForme(sh.id); });
    d.appendChild(nom);

    d.appendChild(bouton(sh.hiddenLayer ? '🚫' : '👁', 'Masquer / afficher', function () {
      sh.hiddenLayer = !sh.hiddenLayer;
      valider('Visibilité');
    }));
    d.appendChild(bouton('▲', 'Vers l’avant', function () {
      selectionnerForme(sh.id); ordonner(1);
    }));
    d.appendChild(bouton('▼', 'Vers l’arrière', function () {
      selectionnerForme(sh.id); ordonner(-1);
    }));
    d.appendChild(bouton('✕', 'Supprimer', function () {
      selectionnerForme(sh.id); supprimerSelection();
    }));
    return d;
  }

  function dockHistorique() {
    if (!hist.pile.length) {
      dom.panneau.appendChild(msgVide('Rien encore.'));
      return;
    }
    hist.pile.forEach(function (e, i) {
      var b = bouton((i + 1) + '. ' + e.libelle, null, function () { allerA(i); },
                     'zts-atl-hist' + (i === hist.pos ? ' courant' : ''));
      dom.panneau.appendChild(b);
    });
  }

  /* ══ Cycle de vie ══════════════════════════════════════════════════════ */

  function activer() {
    construire();
    actif = true;
    document.body.classList.add('zts-atelier-on');
    [dom.barre, dom.rail, dom.dock, dom.etat].forEach(function (n) { n.style.display = ''; });
    reinitialiserHistorique();
    rafraichir();
  }

  function desactiver() {
    arreterEcriture();
    choisirOutil(null);
    sel = null;
    retirerCadre();
    actif = false;
    document.body.classList.remove('zts-atelier-on');
    if (construit) {
      [dom.barre, dom.rail, dom.dock, dom.etat].forEach(function (n) { n.style.display = 'none'; });
    }
    appliquerDecalages();
  }

  /**
   * A rappeler apres chaque redessin de la zone de travail : les elements
   * de page sont recrees, donc le cadre de selection et les ecouteurs de
   * page aussi.
   */
  function rafraichir() {
    if (!actif) return;
    var racine = ctx.racine();
    if (!racine._ztsAtelier) {
      racine.addEventListener('pointerdown', auPointeur);
      racine.addEventListener('dblclick', auDoubleClic);
      racine._ztsAtelier = true;
    }
    majCadre();
    majBarre();
    majDock();
    majEtat();
    appliquerDecalages();
  }

  function configurer(c) { ctx = c; }

  global.ZTSAtelier = {
    configurer: configurer,
    activer: activer,
    desactiver: desactiver,
    rafraichir: rafraichir,
    instantane: instantane,
    estActif: function () { return actif; }
  };
})(window);
