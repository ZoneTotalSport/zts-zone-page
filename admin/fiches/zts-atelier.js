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

  var TOLERANCE = 7;       // px d'accrochage, comme la maquette
  var CLE_VUE = 'zts-atelier-vue';

  var ctx = null;          // fourni par zts-editeur.js
  var actif = false;
  var construit = false;

  var sel = null;          // { genre:'forme'|'champ'|'bloc', id, cle, el }
  var outil = null;        // id d'outil de pose, ou null
  var onglet = 'transformer';
  var hist = { pile: [], pos: -1, gele: false };
  var plume = null;        // trace en cours de saisie
  var ancres = false;      // affichage des points d'ancrage

  /* Reglages d'ATELIER, pas de document : la grille et les regles disent
   * comment Joey travaille, elles ne font pas partie de la fiche. Elles
   * vivent donc dans localStorage, la ou les reperes vivent dans la fiche. */
  var vue = { grille: false, pas: 50, sous: 5, regles: false, magnetisme: false, aimant: true };

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
   * Reperes de la fiche : { p0: {v:[x…], h:[y…]}, … }.
   * Ils voyagent AVEC le document — c'est le point de la section 9 de la
   * maquette : Joey doit retrouver ses guides en rouvrant sa fiche. Les
   * pages publiques ne les lisent jamais.
   */
  function reperes() {
    var f = fiche();
    if (!f.reperes) f.reperes = {};
    return f.reperes;
  }

  /**
   * Un index negatif signifie que la page visee n'existe plus (un
   * gestionnaire pose avant un redessin). Mieux vaut ecrire dans la page 0
   * que creer une cle « p-1 » que rien ne relira jamais.
   */
  function reperesPage(i) {
    var r = reperes();
    var c = 'p' + (i >= 0 ? i : 0);
    if (!r[c]) r[c] = { v: [], h: [] };
    if (!r[c].v) r[c].v = [];
    if (!r[c].h) r[c].h = [];
    return r[c];
  }

  /** Lecture seule — ne cree rien (meme raison que styleLu). */
  function reperesLus(i) {
    var f = fiche();
    var r = (f && f.reperes && f.reperes['p' + i]) || {};
    return { v: r.v || [], h: r.h || [] };
  }

  function chargerVue() {
    try {
      var v = JSON.parse(localStorage.getItem(CLE_VUE) || 'null');
      if (v) Object.keys(vue).forEach(function (k) {
        if (v[k] !== undefined) vue[k] = v[k];
      });
    } catch (e) { /* reglages illisibles : on garde les defauts */ }
  }

  function sauverVue() {
    try { localStorage.setItem(CLE_VUE, JSON.stringify(vue)); } catch (e) {}
  }

  /* ══ Traces ════════════════════════════════════════════════════════════
   *
   * Un trace n'a ni x/y ni w/h : ses points sont en unites de page, en
   * absolu. Tout ce qui deplace, redimensionne ou aligne doit donc passer
   * par ces trois fonctions plutot que par les champs de geometrie.
   */

  function estTrace(sh) { return !!sh && sh.type === 'trace'; }

  /** Boite englobante d'un trace, en unites de page. */
  function boiteTrace(sh) {
    var p = sh.points || [];
    if (!p.length) return { x: 0, y: 0, w: 0, h: 0 };
    var x1 = p[0][0], y1 = p[0][1], x2 = x1, y2 = y1;
    p.forEach(function (q) {
      if (q[0] < x1) x1 = q[0];
      if (q[0] > x2) x2 = q[0];
      if (q[1] < y1) y1 = q[1];
      if (q[1] > y2) y2 = q[1];
    });
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }

  function deplacerTrace(sh, dx, dy) {
    sh.points = (sh.points || []).map(function (q) {
      return [Math.round(q[0] + dx), Math.round(q[1] + dy)];
    });
  }

  /** Mise a l'echelle depuis le coin haut-gauche de la boite englobante. */
  function echelonnerTrace(sh, w, h) {
    var b = boiteTrace(sh);
    var kx = b.w ? w / b.w : 1;
    var ky = b.h ? h / b.h : 1;
    sh.points = (sh.points || []).map(function (q) {
      return [Math.round(b.x + (q[0] - b.x) * kx),
              Math.round(b.y + (q[1] - b.y) * ky)];
    });
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
    var avant = sel;
    hist.pos = pos;
    hist.gele = true;
    try {
      ctx.remplacer(JSON.parse(hist.pile[pos].data));
    } finally {
      hist.gele = false;
    }
    // On garde la selection si son objet a survecu a l'instantane : annuler
    // un redimensionnement ne devrait pas obliger a re-cliquer la forme.
    // Elle tombe si l'objet n'existe plus (annuler une creation).
    sel = null;
    if (avant) {
      if (avant.genre === 'forme' && formeParId(avant.id)) sel = avant;
      else if (avant.cle && ZTSFormes.elementDeCle(ctx.racine(), avant.cle)) sel = avant;
    }
    apresSelection();
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
     dom.dupliquer, dom.supprimer, sep()].forEach(function (e) { r1.appendChild(e); });

    // ── Vue : grille, regles, aimantation ──────────────────────────────
    dom.vGrille = bouton('⊞', 'Grille', function () {
      vue.grille = !vue.grille; sauverVue(); rafraichir();
    });
    dom.vRegles = bouton('⊟', 'Règles graduées', function () {
      vue.regles = !vue.regles; sauverVue(); rafraichir();
    });
    dom.vAimant = bouton('🧲', 'Aimantation (Alt la neutralise)', function () {
      vue.aimant = !vue.aimant; sauverVue(); majBarre();
    });
    dom.vMagnet = bouton('#', 'Ajouter la grille aux cibles d’accrochage', function () {
      vue.magnetisme = !vue.magnetisme; sauverVue(); majBarre();
    });
    dom.vPas = champ('number', 'Pas de la grille (px)', function () {
      vue.pas = Math.max(2, +dom.vPas.value || 50); sauverVue(); rafraichir();
    }, { min: 2, max: 400, step: 1 });
    dom.vSous = champ('number', 'Sous-divisions', function () {
      vue.sous = Math.max(1, +dom.vSous.value || 1); sauverVue(); rafraichir();
    }, { min: 1, max: 20, step: 1 });
    [dom.vGrille, dom.vRegles, dom.vAimant, dom.vMagnet,
     etiquette('Pas', dom.vPas), etiquette('÷', dom.vSous), sep()]
      .forEach(function (e) { r1.appendChild(e); });

    // ── Reperes ────────────────────────────────────────────────────────
    r1.appendChild(titre('Repères'));
    r1.appendChild(bouton('⇕', 'Ajouter un repère horizontal', function () { ajouterRepere('h'); }));
    r1.appendChild(bouton('⇔', 'Ajouter un repère vertical', function () { ajouterRepere('v'); }));
    r1.appendChild(bouton('∅', 'Vider les repères', viderReperes));
    r1.appendChild(sep());

    // ── Fichier ────────────────────────────────────────────────────────
    r1.appendChild(bouton('↧', 'Exporter le document (JSON)', exporterJSON));
    dom.fichier = document.createElement('input');
    dom.fichier.type = 'file';
    dom.fichier.accept = 'application/json,.json';
    dom.fichier.style.display = 'none';
    dom.fichier.addEventListener('change', function () {
      if (dom.fichier.files && dom.fichier.files[0]) importerJSON(dom.fichier.files[0]);
      dom.fichier.value = '';
    });
    r1.appendChild(dom.fichier);
    r1.appendChild(bouton('↥', 'Importer un document (JSON)', function () {
      dom.fichier.click();
    }));

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

    // Propre aux traces : ouvert/ferme et angles/courbes. Les points ne
    // bougent pas — seule la generation du chemin change.
    dom.grpTrace = document.createElement('span');
    dom.grpTrace.style.cssText = 'display:inline-flex;align-items:center;gap:6px;';
    dom.tFerme = bouton('⭕', 'Tracé fermé', function () {
      majSel({ closed: !valeurSel('closed') }, 'Tracé fermé');
    });
    dom.tLisse = bouton('〜', 'Courbes plutôt qu’angles', function () {
      majSel({ smooth: !valeurSel('smooth') }, 'Courbes');
    });
    [titre('Tracé'), dom.tFerme, dom.tLisse, sep()]
      .forEach(function (e) { dom.grpTrace.appendChild(e); });
    r.appendChild(dom.grpTrace);

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

    var b = bouton('↖', 'Sélection (Échap)', function () {
      choisirOutil(null);
      arreterPlume();
    });
    dom.outils[''] = b;
    rail.appendChild(b);

    dom.bPlume = bouton('✒', 'Plume — clic : point · double-clic ou Entrée : terminer · Échap : annuler',
      function () { plumeActive() ? arreterPlume() : commencerPlume(); });
    rail.appendChild(dom.bPlume);
    dom.bAncres = bouton('⁘', 'Points d’ancrage du tracé sélectionné', basculerAncres);
    rail.appendChild(dom.bAncres);

    OUTILS.forEach(function (o) {
      var t = bouton(o.icone, o.titre + ' — clique ensuite dans une page', function () {
        arreterPlume();
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
    injecterAncres();
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

    // `boite()` et non getBoundingClientRect() : le SVG d'un trace couvre la
    // page entiere, le mesurer donnerait un cadre de 850x1100.
    var b = boite(el);
    var cadre = document.createElement('div');
    cadre.className = 'zts-atl-cadre';
    cadre.style.left = b.x + 'px';
    cadre.style.top = b.y + 'px';
    cadre.style.width = b.w + 'px';
    cadre.style.height = b.h + 'px';

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

  /* ══ Aimantation ═══════════════════════════════════════════════════════
   *
   * Cibles d'accrochage, dans l'ordre de la maquette : bords, centres et
   * marges de la page ; bords et centres des AUTRES formes ; reperes de la
   * page ; lignes de grille quand le magnetisme est allume.
   *
   * Alt neutralise l'accrochage le temps d'un deplacement — c'est le geste
   * standard, et sans lui il n'y a aucun moyen de poser quelque chose a
   * 3 px d'un bord.
   */

  function ciblesAccrochage(page, idxPage, exclureId) {
    var W = page.offsetWidth, H = page.offsetHeight;
    var xs = [0, W, W / 2, MARGE_X, W - MARGE_X];
    var ys = [0, H, H / 2, MARGE_Y, H - MARGE_Y];

    formes().forEach(function (sh) {
      if (sh.page !== idxPage || sh.id === exclureId || sh.hiddenLayer) return;
      var b = estTrace(sh)
        ? boiteTrace(sh)
        : { x: sh.x || 0, y: sh.y || 0, w: sh.w || 0, h: sh.h || 0 };
      xs.push(b.x, b.x + b.w, b.x + b.w / 2);
      ys.push(b.y, b.y + b.h, b.y + b.h / 2);
    });

    var r = reperesLus(idxPage);
    xs = xs.concat(r.v);
    ys = ys.concat(r.h);

    if (vue.magnetisme && vue.pas > 0) {
      for (var x = 0; x <= W; x += vue.pas) xs.push(x);
      for (var y = 0; y <= H; y += vue.pas) ys.push(y);
    }
    return { xs: xs, ys: ys };
  }

  /**
   * Accroche une boite sur un axe.
   * Les TROIS aretes comptent (debut, milieu, fin) : sans le milieu, on ne
   * peut pas centrer une forme sur un repere, ce qui est justement l'usage
   * le plus courant.
   */
  function accrocher(v, taille, cibles) {
    var meilleur = null;
    [0, taille / 2, taille].forEach(function (offset) {
      cibles.forEach(function (c) {
        var d = c - (v + offset);
        if (Math.abs(d) > TOLERANCE) return;
        if (!meilleur || Math.abs(d) < Math.abs(meilleur.d)) {
          meilleur = { d: d, ligne: c };
        }
      });
    });
    return meilleur;
  }

  function retirerGuides(page) {
    Array.prototype.forEach.call(page.querySelectorAll('.zts-atl-guide'),
      function (g) { g.parentNode.removeChild(g); });
  }

  function montrerGuide(page, sens, v) {
    var g = document.createElement('div');
    g.className = 'zts-atl-guide zts-atl-guide--' + sens + ' zts-ui';
    if (sens === 'v') g.style.left = v + 'px'; else g.style.top = v + 'px';
    page.appendChild(g);
  }

  /* ══ Deplacement et redimensionnement ══════════════════════════════════ */

  /**
   * Geometrie courante d'un element, en unites de page.
   *
   * Un TRACE fait exception : son SVG couvre la page entiere (c'est ce qui
   * lui permet de deborder sans etre rogne), donc le mesurer donnerait
   * 850x1100 a chaque fois. Sa boite, c'est celle de ses points.
   */
  function boite(el) {
    var page = pageDe(el);
    var rp = page.getBoundingClientRect();
    var idForme = el.getAttribute && el.getAttribute('data-forme');
    var sh = idForme ? formeParId(idForme) : null;
    if (estTrace(sh)) {
      var bt = boiteTrace(sh);
      return { page: page, x: bt.x, y: bt.y, w: bt.w, h: bt.h };
    }
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
      var g = estTrace(sh) ? boiteTrace(sh)
                           : { x: sh.x || 0, y: sh.y || 0, w: sh.w || 0, h: sh.h || 0 };
      return { page: null, virtuelle: !elementSelection(),
               x: g.x, y: g.y, w: g.w, h: g.h };
    }
    var el = elementSelection();
    return el ? boite(el) : null;
  }

  function commencerDeplacement(ev, el) {
    var b = boite(el);
    var page = b.page;
    var idxPage = indexPage(page);
    var depart = { x: ev.clientX, y: ev.clientY };
    var forme = sel.genre === 'forme' ? formeParId(sel.id) : null;
    var trace = estTrace(forme);
    var cle = sel.cle;
    var lu = forme ? null : styleLu(cle);
    // Un trace n'a pas d'origine propre : sa boite englobante en tient lieu.
    var b0 = trace ? boiteTrace(forme) : null;
    var dx0 = trace ? 0 : (forme ? (forme.x || 0) : (lu.dx || 0));
    var dy0 = trace ? 0 : (forme ? (forme.y || 0) : (lu.dy || 0));
    var cadre = ctx.racine().querySelector('.zts-atl-cadre');
    var cibles = ciblesAccrochage(page, idxPage, forme && forme.id);
    var dernier = { dx: 0, dy: 0 };

    function ajuste(e) {
      var dx = e.clientX - depart.x;
      var dy = e.clientY - depart.y;
      retirerGuides(page);
      if (e.altKey || !vue.aimant) return { dx: dx, dy: dy };

      var ax = accrocher(b.x + dx, b.w, cibles.xs);
      var ay = accrocher(b.y + dy, b.h, cibles.ys);
      if (ax) { dx += ax.d; montrerGuide(page, 'v', ax.ligne); }
      if (ay) { dy += ay.d; montrerGuide(page, 'h', ay.ligne); }
      return { dx: dx, dy: dy };
    }

    function bouger(e) {
      dernier = ajuste(e);
      if (trace) {
        el.style.transform = 'translate(' + dernier.dx + 'px,' + dernier.dy + 'px)';
      } else if (forme) {
        el.style.left = (dx0 + dernier.dx) + 'px';
        el.style.top = (dy0 + dernier.dy) + 'px';
      } else {
        el.style.transform = transformDe(lu, dx0 + dernier.dx, dy0 + dernier.dy);
      }
      if (cadre) {
        cadre.style.left = (b.x + dernier.dx) + 'px';
        cadre.style.top = (b.y + dernier.dy) + 'px';
      }
    }

    function finir(e) {
      document.removeEventListener('pointermove', bouger);
      document.removeEventListener('pointerup', finir);
      retirerGuides(page);
      var d = dernier;
      if (!d.dx && !d.dy) return;
      if (trace) {
        // Le decalage est calcule sur la boite mesuree ; on le reporte sur
        // les points, qui sont la seule verite du trace.
        deplacerTrace(forme, b0.x + d.dx - boiteTrace(forme).x,
                             b0.y + d.dy - boiteTrace(forme).y);
      } else if (forme) {
        forme.x = Math.round(dx0 + d.dx);
        forme.y = Math.round(dy0 + d.dy);
      } else {
        var s = style(cle);
        s.dx = Math.round(dx0 + d.dx);
        s.dy = Math.round(dy0 + d.dy);
      }
      valider('Déplacement');
    }

    document.addEventListener('pointermove', bouger);
    document.addEventListener('pointerup', finir);
  }

  function commencerRedimension(ev, el) {
    var b = boite(el);
    var page = b.page;
    var depart = { x: ev.clientX, y: ev.clientY };
    var forme = sel.genre === 'forme' ? formeParId(sel.id) : null;
    var trace = estTrace(forme);
    var cle = sel.cle;
    var cadre = ctx.racine().querySelector('.zts-atl-cadre');
    var cibles = ciblesAccrochage(page, indexPage(page), forme && forme.id);
    var dernier = { w: b.w, h: b.h };

    function ajuste(e) {
      var w = Math.max(8, b.w + (e.clientX - depart.x));
      var h = Math.max(4, b.h + (e.clientY - depart.y));
      retirerGuides(page);
      if (e.altKey || !vue.aimant) return { w: w, h: h };
      // Seul le bord qu'on tire s'accroche : le coin oppose ne bouge pas.
      var ax = accrocher(b.x + w, 0, cibles.xs);
      var ay = accrocher(b.y + h, 0, cibles.ys);
      if (ax) { w += ax.d; montrerGuide(page, 'v', ax.ligne); }
      if (ay) { h += ay.d; montrerGuide(page, 'h', ay.ligne); }
      return { w: Math.max(8, w), h: Math.max(4, h) };
    }

    function bouger(e) {
      dernier = ajuste(e);
      if (!trace) {
        el.style.width = dernier.w + 'px';
        el.style.height = dernier.h + 'px';
      }
      if (cadre) {
        cadre.style.width = dernier.w + 'px';
        cadre.style.height = dernier.h + 'px';
      }
    }

    function finir() {
      document.removeEventListener('pointermove', bouger);
      document.removeEventListener('pointerup', finir);
      retirerGuides(page);
      var w = Math.round(dernier.w), h = Math.round(dernier.h);
      if (trace) echelonnerTrace(forme, w, h);
      else if (forme) { forme.w = w; forme.h = h; }
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

  /* ══ Plume vectorielle ═════════════════════════════════════════════════
   *
   * Clic = pose un point · double-clic ou Entree = termine · Echap = annule.
   * Le trace est un vrai <path> SVG ; les points sont serialises tels quels,
   * en unites de page, donc directement reutilisables par le rendu public.
   */

  var NS = 'http://www.w3.org/2000/svg';

  function commencerPlume() {
    plume = null;
    choisirOutil(null);
    document.body.classList.add('zts-atelier-plume');
    deselectionner();
    majBarre();
  }

  function arreterPlume() {
    if (plume && plume.svg && plume.svg.parentNode) {
      plume.svg.parentNode.removeChild(plume.svg);
    }
    plume = null;
    document.body.classList.remove('zts-atelier-plume');
    majBarre();
  }

  function plumeActive() { return document.body.classList.contains('zts-atelier-plume'); }

  /** Apercu du trace en cours, redessine a chaque point pose. */
  function dessinerApercu() {
    if (!plume) return;
    plume.path.setAttribute('d', ZTSFormes.cheminTrace(plume.points, false, false));
    Array.prototype.forEach.call(plume.svg.querySelectorAll('circle'),
      function (c) { c.parentNode.removeChild(c); });
    plume.points.forEach(function (p, i) {
      var c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', p[0]);
      c.setAttribute('cy', p[1]);
      c.setAttribute('r', 4);
      c.setAttribute('fill', i === 0 ? '#FFF200' : '#fff');
      c.setAttribute('stroke', '#22ccf5');
      c.setAttribute('stroke-width', 2);
      plume.svg.appendChild(c);
    });
  }

  function plumePoint(page, x, y) {
    if (!plume || plume.page !== page) {
      if (plume) arreterPlume();
      document.body.classList.add('zts-atelier-plume');
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'zts-atl-plume zts-ui');
      svg.setAttribute('width', page.offsetWidth);
      svg.setAttribute('height', page.offsetHeight);
      svg.style.overflow = 'visible';
      var path = document.createElementNS(NS, 'path');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#22ccf5');
      path.setAttribute('stroke-width', 2);
      path.setAttribute('stroke-dasharray', '5 4');
      svg.appendChild(path);
      page.appendChild(svg);
      plume = { page: page, idx: indexPage(page), points: [], svg: svg, path: path };
    }
    plume.points.push([Math.round(x), Math.round(y)]);
    dessinerApercu();
  }

  /**
   * Termine le trace. Moins de deux points ne fait pas une ligne : on jette
   * plutot que de laisser un point invisible dans la fiche.
   */
  function plumeTerminer(ferme) {
    if (!plume || plume.points.length < 2) { arreterPlume(); return; }
    var sh = {
      id: nouvelIdForme(),
      page: plume.idx,
      type: 'trace',
      points: plume.points.slice(),
      closed: !!ferme,
      smooth: false,
      thickness: 6,
      strokeColor: '#101010',
      fill: 'transparent'
    };
    arreterPlume();
    formes().push(sh);
    valider('Tracé');
    selectionnerForme(sh.id);
  }

  /* ══ Points d'ancrage ══════════════════════════════════════════════════ */

  function basculerAncres() {
    ancres = !ancres;
    rafraichir();
  }

  function retirerAncres() {
    Array.prototype.forEach.call(ctx.racine().querySelectorAll('.zts-atl-ancre'),
      function (a) { a.parentNode.removeChild(a); });
  }

  /**
   * Poignees des points du trace selectionne.
   * Uniquement sur la selection : les afficher pour tous les traces d'une
   * page couvrirait le dessin de pastilles des qu'il y en a deux ou trois.
   */
  function injecterAncres() {
    retirerAncres();
    if (!ancres || !sel || sel.genre !== 'forme') return;
    var sh = formeParId(sel.id);
    if (!estTrace(sh)) return;
    var el = elementSelection();
    var page = el && pageDe(el);
    if (!page) return;

    (sh.points || []).forEach(function (p, i) {
      var a = document.createElement('div');
      a.className = 'zts-atl-ancre zts-ui' + (i === 0 ? ' premier' : '');
      a.style.left = p[0] + 'px';
      a.style.top = p[1] + 'px';
      a.title = 'Point ' + (i + 1) + ' — glisse pour déplacer, double-clic pour retirer';
      a.addEventListener('pointerdown', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        glisserAncre(ev, sh, i, page, a);
      });
      a.addEventListener('dblclick', function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        // Sous deux points il ne reste plus de trace : on retire la forme.
        if (sh.points.length <= 2) { selectionnerForme(sh.id); supprimerSelection(); return; }
        sh.points.splice(i, 1);
        valider('Point retiré');
      });
      page.appendChild(a);
    });
  }

  function glisserAncre(ev, sh, i, page, poignee) {
    var rp = page.getBoundingClientRect();
    var cibles = ciblesAccrochage(page, indexPage(page), sh.id);
    var pos = sh.points[i].slice();

    function bouger(e) {
      var x = e.clientX - rp.left;
      var y = e.clientY - rp.top;
      retirerGuides(page);
      if (!e.altKey && vue.aimant) {
        var ax = accrocher(x, 0, cibles.xs);
        var ay = accrocher(y, 0, cibles.ys);
        if (ax) { x += ax.d; montrerGuide(page, 'v', ax.ligne); }
        if (ay) { y += ay.d; montrerGuide(page, 'h', ay.ligne); }
      }
      pos = [Math.round(x), Math.round(y)];
      poignee.style.left = pos[0] + 'px';
      poignee.style.top = pos[1] + 'px';
    }

    function finir() {
      document.removeEventListener('pointermove', bouger);
      document.removeEventListener('pointerup', finir);
      retirerGuides(page);
      sh.points[i] = pos;
      valider('Point déplacé');
    }

    document.addEventListener('pointermove', bouger);
    document.addEventListener('pointerup', finir);
  }

  /* ══ Grille, regles et reperes ═════════════════════════════════════════
   *
   * Mobilier d'atelier : jamais imprime (tout est en .zts-ui), jamais lu par
   * les pages publiques. La grille et les regles sont des reglages de poste
   * de travail (localStorage) ; les reperes appartiennent a la fiche.
   */

  function retirerMobilier() {
    var racine = ctx.racine();
    ['.zts-atl-grille', '.zts-atl-regle', '.zts-atl-repere', '.zts-atl-guide']
      .forEach(function (s) {
        Array.prototype.forEach.call(racine.querySelectorAll(s),
          function (n) { n.parentNode.removeChild(n); });
      });
  }

  function fondGrille() {
    var pas = Math.max(2, vue.pas);
    var sous = Math.max(1, vue.sous);
    var petit = pas / sous;
    var l = 'rgba(255,255,255,.13)';
    var L = 'rgba(255,255,255,.30)';
    return {
      backgroundImage:
        'linear-gradient(to right,' + L + ' 1px,transparent 1px),' +
        'linear-gradient(to bottom,' + L + ' 1px,transparent 1px),' +
        'linear-gradient(to right,' + l + ' 1px,transparent 1px),' +
        'linear-gradient(to bottom,' + l + ' 1px,transparent 1px)',
      backgroundSize:
        pas + 'px ' + pas + 'px,' + pas + 'px ' + pas + 'px,' +
        petit + 'px ' + petit + 'px,' + petit + 'px ' + petit + 'px'
    };
  }

  /**
   * Regle graduee le long d'un bord de page.
   *
   * Elle est posee dans le `.zts-page-wrap`, PAS dans la page : la page est
   * en overflow:hidden, une regle a -18 px y serait purement et simplement
   * rognee. Le wrap passe donc en position:relative et la regle se cale sur
   * la position de la page a l'interieur.
   */
  function injecterRegle(wrap, page, idxPage, sens) {
    var r = document.createElement('div');
    r.className = 'zts-atl-regle zts-atl-regle--' + sens + ' zts-ui';
    r.title = 'Clique pour poser un repère';

    if (sens === 'h') {
      r.style.left = page.offsetLeft + 'px';
      r.style.right = 'auto';
      r.style.width = page.offsetWidth + 'px';
      r.style.top = (page.offsetTop - 18) + 'px';
    } else {
      r.style.top = page.offsetTop + 'px';
      r.style.bottom = 'auto';
      r.style.height = page.offsetHeight + 'px';
      r.style.left = (page.offsetLeft - 18) + 'px';
    }

    var taille = sens === 'h' ? page.offsetWidth : page.offsetHeight;
    var pas = Math.max(10, vue.pas);
    for (var v = 0; v <= taille; v += pas) {
      var t = document.createElement('i');
      t.style[sens === 'h' ? 'left' : 'top'] = v + 'px';
      r.appendChild(t);
      var lab = document.createElement('span');
      lab.textContent = v;
      lab.style[sens === 'h' ? 'left' : 'top'] = v + 'px';
      r.appendChild(lab);
    }

    r.addEventListener('click', function (ev) {
      var rr = r.getBoundingClientRect();
      var p = Math.round(sens === 'h' ? ev.clientX - rr.left : ev.clientY - rr.top);
      var rp = reperesPage(idxPage);
      (sens === 'h' ? rp.v : rp.h).push(p);
      valider('Repère');
    });
    wrap.appendChild(r);
  }

  function injecterRepere(page, idxPage, sens, v, i) {
    var d = document.createElement('div');
    d.className = 'zts-atl-repere zts-atl-repere--' + sens + ' zts-ui';
    d.style[sens === 'v' ? 'left' : 'top'] = v + 'px';
    d.title = 'Glisse pour déplacer · double-clic pour effacer';

    d.addEventListener('pointerdown', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      var rp = page.getBoundingClientRect();
      var pos = v;
      function bouger(e) {
        pos = Math.round(sens === 'v' ? e.clientX - rp.left : e.clientY - rp.top);
        d.style[sens === 'v' ? 'left' : 'top'] = pos + 'px';
      }
      function finir() {
        document.removeEventListener('pointermove', bouger);
        document.removeEventListener('pointerup', finir);
        var liste = reperesPage(idxPage)[sens === 'v' ? 'v' : 'h'];
        liste[i] = pos;
        valider('Repère déplacé');
      }
      document.addEventListener('pointermove', bouger);
      document.addEventListener('pointerup', finir);
    });

    d.addEventListener('dblclick', function (ev) {
      ev.preventDefault();
      ev.stopPropagation();
      reperesPage(idxPage)[sens === 'v' ? 'v' : 'h'].splice(i, 1);
      valider('Repère effacé');
    });
    page.appendChild(d);
  }

  function injecterMobilier() {
    retirerMobilier();
    var pages = ctx.racine().querySelectorAll('[data-page]');
    Array.prototype.forEach.call(pages, function (page, i) {
      if (vue.grille) {
        var g = document.createElement('div');
        g.className = 'zts-atl-grille zts-ui';
        var f = fondGrille();
        g.style.backgroundImage = f.backgroundImage;
        g.style.backgroundSize = f.backgroundSize;
        // Sous le contenu, au-dessus du fond de page.
        page.insertBefore(g, page.firstChild);
      }
      if (vue.regles) {
        var wrap = page.closest('.zts-page-wrap');
        if (wrap) {
          wrap.style.position = 'relative';
          injecterRegle(wrap, page, i, 'h');
          injecterRegle(wrap, page, i, 'v');
        }
      }
      var r = reperesLus(i);
      r.v.forEach(function (v, k) { injecterRepere(page, i, 'v', v, k); });
      r.h.forEach(function (v, k) { injecterRepere(page, i, 'h', v, k); });
    });
  }

  function viderReperes() {
    fiche().reperes = {};
    valider('Repères vidés');
  }

  /** Repere au milieu de la premiere page — le bouton « + REPÈRE ». */
  function ajouterRepere(sens) {
    var pages = ctx.racine().querySelectorAll('[data-page]');
    var i = 0;
    if (sel) {
      var el = elementSelection();
      var p = el && pageDe(el);
      if (p) i = indexPage(p);
    }
    var page = pages[i];
    if (!page) return;
    var rp = reperesPage(i);
    if (sens === 'v') rp.v.push(Math.round(page.offsetWidth / 2));
    else rp.h.push(Math.round(page.offsetHeight / 2));
    valider('Repère');
  }

  /* ══ Fichier ═══════════════════════════════════════════════════════════ */

  /* Le document d'echange, c'est la fiche SANS ses identifiants : `id` et
   * `slug` appartiennent a Firestore, pas au contenu. Reimporter un fichier
   * dans une autre fiche ne doit pas en voler l'adresse. */
  var CHAMPS_ECHANGE = ['titre', 'sousTitre', 'badges', 'butDuJeu', 'sections',
                        'imagePrincipale', 'imagePage2', 'styles', 'formes',
                        'reperes', 'univers', 'category'];

  function exporterJSON() {
    var f = fiche();
    var out = {};
    CHAMPS_ECHANGE.forEach(function (k) { if (f[k] !== undefined) out[k] = f[k]; });
    var blob = new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (global.ZTSFichesDB && global.ZTSFichesDB.slugifier
      ? global.ZTSFichesDB.slugifier(f.titre) : 'fiche') || 'fiche';
    a.download += '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 0);
  }

  function importerJSON(file) {
    var lecteur = new FileReader();
    lecteur.onload = function () {
      var obj;
      try { obj = JSON.parse(lecteur.result); }
      catch (e) { global.alert('Fichier illisible : ce n’est pas du JSON.'); return; }
      if (!obj || typeof obj !== 'object' || !obj.sections) {
        global.alert('Ce fichier ne ressemble pas à une fiche.');
        return;
      }
      // On PART de la fiche courante et on ecrase champ par champ : les
      // champs absents du fichier (un vieil export, par exemple) gardent
      // leur valeur au lieu de disparaitre.
      var f = JSON.parse(JSON.stringify(fiche()));
      CHAMPS_ECHANGE.forEach(function (k) { if (obj[k] !== undefined) f[k] = obj[k]; });
      ctx.remplacer(f);
      instantane('Import');
    };
    lecteur.readAsText(file);
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
    if (estTrace(copie)) deplacerTrace(copie, 16, 16);
    else { copie.x = (copie.x || 0) + 16; copie.y = (copie.y || 0) + 16; }
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
      if (estTrace(sh)) deplacerTrace(sh, x - b.x, y - b.y);
      else { sh.x = Math.round(x); sh.y = Math.round(y); }
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

    if (plumeActive()) {
      var rq = page.getBoundingClientRect();
      ev.preventDefault();
      plumePoint(page, ev.clientX - rq.left, ev.clientY - rq.top);
      return;
    }

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
    if (plumeActive()) {
      ev.preventDefault();
      // Le double-clic a deja pose un point via ses deux pointerdown : on
      // retire le doublon avant de fermer, sinon le trace finit sur deux
      // points superposes.
      if (plume && plume.points.length > 1) plume.points.pop();
      plumeTerminer(false);
      return;
    }
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
    if (ev.key === 'Enter' && plumeActive() && !dansUnChamp) {
      ev.preventDefault();
      plumeTerminer(ev.shiftKey);   // Maj+Entrée ferme le tracé
      return;
    }
    if (ev.key === 'Escape') {
      if (plumeActive()) { arreterPlume(); return; }
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
    dom.grpTrace.style.display = (type === 'trace') ? '' : 'none';
    dom.rangeeTexte.style.display = texteux ? '' : 'none';
    dom.altBoite.style.display = (sel && sel.cle === 'titre') ? '' : 'none';

    // Etat des reglages d'atelier.
    dom.vGrille.classList.toggle('actif', vue.grille);
    dom.vRegles.classList.toggle('actif', vue.regles);
    dom.vAimant.classList.toggle('actif', vue.aimant);
    dom.vMagnet.classList.toggle('actif', vue.magnetisme);
    dom.vPas.value = vue.pas;
    dom.vSous.value = vue.sous;
    dom.bPlume.classList.toggle('actif', plumeActive());
    dom.bAncres.classList.toggle('actif', ancres);

    if (estForme) {
      poserCouleur(dom.fill, valeurSel('fill'), '#FFF200');
      poserCouleur(dom.trait, valeurSel('strokeColor'), '#101010');
      poserNombre(dom.epaisseur, valeurSel('thickness'),
                  type === 'ligne' || type === 'trace' ? 6 : 3);
      poserNombre(dom.ombre, valeurSel('shadow'), 3);
      if (type === 'trace') {
        dom.tFerme.classList.toggle('actif', !!valeurSel('closed'));
        dom.tLisse.classList.toggle('actif', !!valeurSel('smooth'));
      }
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
      var sh = formeParId(sel.id);
      if (estTrace(sh)) {
        if (quoi === 'x') deplacerTrace(sh, v - b.x, 0);
        else if (quoi === 'y') deplacerTrace(sh, 0, v - b.y);
        else if (quoi === 'w') echelonnerTrace(sh, Math.max(1, v), b.h);
        else echelonnerTrace(sh, b.w, Math.max(1, v));
        valider('Géométrie');
        return;
      }
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
    chargerVue();
    construire();
    actif = true;
    document.body.classList.add('zts-atelier-on');
    [dom.barre, dom.rail, dom.dock, dom.etat].forEach(function (n) { n.style.display = ''; });
    reinitialiserHistorique();
    rafraichir();
  }

  function desactiver() {
    arreterEcriture();
    arreterPlume();
    choisirOutil(null);
    sel = null;
    ancres = false;
    retirerCadre();
    retirerAncres();
    retirerMobilier();
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
    // Le mobilier vit DANS les pages : un redessin l'emporte avec le reste.
    injecterMobilier();
    majCadre();
    injecterAncres();
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
