/* ==========================================================================
   ZTSH-SHELL — habillage Zone Total Sport
   Expose window.ZTSShell. Compagnon de assets/ztsh-shell.css.
   --------------------------------------------------------------------------
   CE QUE CE FICHIER NE FAIT JAMAIS
     · il ne se monte pas tout seul — une page qui n'appelle pas
       ZTSShell.monter() se comporte exactement comme avant ;
     · il ne touche pas window.ZTS. Il l'APPELLE (ZTS.setMetier), il ne le
       remplace ni ne l'enrobe. shared/zts.js expose getLang, openModal,
       closeModal, applyI18n, setMetier, countUp — ~35 apps en dépendent ;
     · aucun écouteur clavier au niveau document ou window. Pas de touche
       unique, pas d'Escape, rien. tni capte d/e/f/g/m/s/z, studio-jeu capte
       c/p/Delete/Backspace/flèches, generateur et les playoffs +/-/0/= : le
       shell ne doit rien leur voler. Ses éléments sont atteignables au Tab et
       actionnables par Enter/Espace sur eux-mêmes ;
     · aucun écouteur en phase de capture ;
     · aucune écriture de stockage. Le métier n'est pas persisté en phase 1 ;
     · aucun appel réseau au chargement. La pause café tire d'un repli local ;
     · aucune écriture Firestore ;
     · il ne modifie ni ne renomme aucun id, classe ou data-* de l'app. Il
       ajoute des nœuds, il n'en déplace aucun. Tous ses propres id sont
       préfixés ztsh-.
   ========================================================================== */
(function () {
  'use strict';

  var VERSION = '2.0.0';
  var PREFIXE_STOCKAGE = 'zts:';       // réservé ; aucune écriture en phase 1
  var METIERS = ['ep', 'sdg', 'camp'];

  /* Catalogue par défaut du rail. Tous ces chemins existent en production.
     Libellés Bangers, pas d'emoji : la place est réservée pour les futures
     icônes Pop Art. Une page peut fournir sa propre liste via `outils`. */
  var OUTILS_DEFAUT = [
    { cle: 'JEUX', info: 'Banque de jeux',        href: '/apps/jeux/',          vedette: true },
    { cle: 'SAÉ',  info: 'Banque de SAÉ PFEQ',    href: '/apps/sae/' },
    // suitMetier : le planificateur EXIGE ?metier=ep|camp|sdg. Sans le
    // paramètre il retombe sur « camp » et un prof d'ÉPS atterrit dans une
    // interface de camp de jour. Voir resoudreHref().
    { cle: 'PLAN', info: 'Planificateur',         href: '/apps/planificateur/', suitMetier: true },
    { cle: 'CHRO', info: 'Transitions et chrono', href: '/apps/transitions/' },
    { cle: 'ÉQUI', info: 'Former les équipes',    href: '/apps/omnigroupe/' },
    { cle: 'TNI',  info: 'Tableau numérique',     href: '/apps/tni/' },
    { cle: 'MUSI', info: 'Musique',               href: '/apps/musique/' },
    { cle: 'IA',   info: 'Générateur IA',         href: '/apps/generateur/' }
  ];

  /* Un métier = un libellé, une image, un cri. Chemins racine, jamais l'URL
     du domaine : le site est servi sur zonetotalsport.ca et sur des
     sous-domaines, un chemin absolu de domaine casserait l'un des deux. */
  var PROFILS = {
    // img = repli PNG, webp = servi en premier. Les deux font 264 px de large,
    // soit le double des 132 px d'affichage : au-delà on sert des pixels que
    // personne ne voit. Les sources 500 et 857 px pesaient 209 à 250 Ko.
    ep:   { nom: 'ÉDUCATION PHYSIQUE', sous: 'Gymnase · PFEQ · SAÉ',
            webp: '/shared/img/perso/perso-ep-264.webp',   img: '/shared/img/perso/perso-ep-264.png',   cri: 'ON Y VA!' },
    sdg:  { nom: 'SERVICE DE GARDE',   sous: 'Routines · jeux calmes',
            webp: '/shared/img/perso/perso-sdg-264.webp',  img: '/shared/img/perso/perso-sdg-264.png',  cri: 'ON EMBARQUE!' },
    camp: { nom: 'CAMP DE JOUR',       sous: 'Grands jeux · plein air',
            webp: '/shared/img/perso/perso-camp-264.webp', img: '/shared/img/perso/perso-camp-264.png', cri: 'DEHORS!' }
  };

  /* Repli local de la pause café. Aucun réseau. */
  var CAFE_REPLI = [
    { g: 'CITATION',     t: '« Sois fort quand tu es faible, brave quand tu as peur, humble quand tu es fier. »', s: 'Proverbe' },
    { g: 'QUESTION',     t: 'Si tu ne pouvais garder qu\'un seul jeu de ta banque pour toute l\'année, lequel?', s: 'À se demander' },
    { g: 'MICRO-DÉFI',   t: 'Cette semaine : commence un cours en silence complet. Juste des gestes. Observe ce qui change.', s: 'À tester' },
    { g: 'LE SAVAIS-TU', t: 'Un enfant du primaire a besoin de 60 minutes d\'activité modérée à intense par jour. Ton cours en fournit souvent la moitié.', s: 'Repère' },
    { g: 'PERSPECTIVE',  t: 'Les transitions représentent jusqu\'à 20 % du temps d\'un cours d\'ÉP. Gagner 2 minutes par transition, c\'est 12 heures par année.', s: 'Calcul rapide' },
    { g: 'CITATION',     t: '« On ne cesse pas de jouer parce qu\'on vieillit; on vieillit parce qu\'on cesse de jouer. »', s: 'George Bernard Shaw' },
    { g: 'MICRO-DÉFI',   t: 'Demande à un groupe d\'inventer la règle de fin d\'un jeu. Applique-la telle quelle.', s: 'À tester' },
    { g: 'QUESTION',     t: 'Quel élève t\'a surpris cette semaine? Est-ce que tu le lui as dit?', s: 'À se demander' },
    { g: 'PERSPECTIVE',  t: 'Tu prends environ 1 500 microdécisions par cours. Aucune application ne fait ça.', s: 'Repère' },
    { g: 'PAUSE',        t: 'Trente secondes : quatre respirations lentes, épaules relâchées. Le gymnase peut attendre.', s: 'Maintenant' }
  ];

  var etat = null;

  /* ------------------------------------------------------------ utilitaires */
  function el(tag, classe, attrs) {
    var n = document.createElement(tag);
    if (classe) n.className = classe;
    if (attrs) for (var k in attrs) if (attrs[k] != null) n.setAttribute(k, attrs[k]);
    return n;
  }
  function metierCourant() {
    var v = document.body ? document.body.getAttribute('data-metier') : null;
    return METIERS.indexOf(v) !== -1 ? v : null;
  }
  function mouvementReduit() {
    return !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function baseAssets() {
    var s = document.currentScript;
    if (!s) {
      var tous = document.getElementsByTagName('script');
      for (var i = tous.length - 1; i >= 0; i--) {
        if (/ztsh-shell\.js/.test(tous[i].src || '')) { s = tous[i]; break; }
      }
    }
    return s && s.src ? s.src.replace(/[^/]*$/, '') : '/assets/';
  }
  var BASE = baseAssets();

  /* --------------------------------------------------------- configuration */
  var DEFAUTS = {
    // Accueil, atterrissage. Ombres dures colorées, contours 3,5px, titres au
    // maximum.
    // encourageur PASSE A false le 2 aout, sur decision de Joey : le
    // personnage flottant est retire du site. Mr. Root reste la mascotte —
    // heros, images de marque, maquette — mais plus de bulle qui suit le
    // lecteur. Les trois densites sont donc a false ; l'option existe encore
    // pour qui la demande explicitement, personne ne la demande.
    vitrine:    { rail: true,  metierSelecteur: 'auto', encourageur: false, pauseCafe: true,  fond: true },
    // Planificateur, banque, grilles, présences. Même identité, volume
    // réduit : ombres noires 4px, contours 2px, titres d'un cran plus bas,
    // animations coupées sauf survol.
    // encourageur REMIS A false le 29 juillet : sur sae, le bouton flottant de
    // l'app (.cours-fab, 54x54, z-index 1000) recouvre un quart du personnage.
    // Mesure en production : 2916 px2 sur 11815. Le prescan avait signale la
    // collision ; la garde n'etait pas ecrite. On ne generalise pas avant.
    travail:    { rail: true,  metierSelecteur: 'auto', encourageur: false, pauseCafe: false, fond: true },
    // tni, studio-jeu, playoffs. Tokens seulement, l'app garde son plein cadre.
    // Le personnage est là aussi, silencieux. Le fond marine reste OFF en
    // projection tant que le banc sur tni n'a pas été fait (décision du
    // 29 juillet) — tni pose un #gymBg fixe à 15 % d'opacité par-dessus.
    projection: { rail: false, metierSelecteur: false,  encourageur: false, pauseCafe: false, fond: false }
  };

  function normaliser(opts) {
    opts = opts || {};
    var densite = DEFAUTS[opts.densite] ? opts.densite : 'travail';   // défaut le plus sûr
    var base = DEFAUTS[densite];
    function opt(nom) { return opts[nom] !== undefined ? !!opts[nom] : base[nom]; }

    var cfg = {
      densite:     densite,
      rail:        opt('rail'),
      encourageur: opt('encourageur'),
      pauseCafe:   opt('pauseCafe'),
      fond:        opt('fond'),
      // Repli pour les apps qui imposent leur fond en !important (D23) : le
      // marine passe de <html> a l'enveloppe .ztsh-page, enfant de <body>,
      // donc peinte APRES le fond de body. Reserve, jamais automatique.
      fondSurEnveloppe: opts.fondSurEnveloppe !== undefined ? !!opts.fondSurEnveloppe : false,
      metierSelecteur: opts.metierSelecteur !== undefined ? opts.metierSelecteur : base.metierSelecteur,
      // Réservé. Le shell ne filtre jamais les données d'une app de lui-même :
      // une app ne réagit que si elle a explicitement souscrit à
      // zts:metier-change, app par app, après un GO.
      metierFiltre: !!opts.metierFiltre,
      outils: Array.isArray(opts.outils) ? opts.outils : OUTILS_DEFAUT
    };

    // 'auto' : présent seulement si la page porte déjà un métier. Les 20 apps
    // transversales (jeux, sae, educatifs, generateur…) servent les trois.
    if (cfg.metierSelecteur === 'auto') cfg.metierSelecteur = !!metierCourant();
    cfg.metierSelecteur = !!cfg.metierSelecteur;

    if (densite === 'projection') {
      cfg.rail = false; cfg.pauseCafe = false;
      cfg.metierSelecteur = false; cfg.fond = false; cfg.fondSurEnveloppe = false;
      // encourageur conservé : présent partout, silencieux hors vitrine.
    }
    return cfg;
  }

  /* ============================================================== MÉTIER
     Relais vers ZTS.setMetier, émission de zts:metier-change, bascule des
     personnages. Ne filtre rien. */
  function construireMetiers() {
    var actuel = metierCourant();
    if (!actuel) return null;

    var zone = el('div', 'ztsh-metiers', { role: 'group', 'aria-label': 'Choisir le métier' });
    METIERS.forEach(function (cle) {
      var p = PROFILS[cle];
      var b = el('button', 'ztsh-metier ztsh-metier--' + cle, {
        type: 'button',
        'data-ztsh-metier': cle,
        'aria-pressed': String(cle === actuel)
      });
      var txt = el('span');
      var nom = el('b', 'ztsh-metier__nom');   nom.textContent = p.nom;
      var sous = el('small', 'ztsh-metier__sous'); sous.textContent = p.sous;
      txt.appendChild(nom); txt.appendChild(sous);
      b.appendChild(txt);
      b.addEventListener('click', function () { choisirMetier(cle); });   // jamais sur document
      zone.appendChild(b);
    });
    return zone;
  }

  function choisirMetier(cle) {
    if (METIERS.indexOf(cle) === -1) return;
    var avant = metierCourant();
    if (cle === avant) return;

    // Relais vers l'API existante, jamais de réimplémentation.
    if (window.ZTS && typeof window.ZTS.setMetier === 'function') {
      window.ZTS.setMetier(cle);
    } else if (document.body) {
      // acrosport, evaluation et studio-jeu ne chargent pas shared/zts.js.
      document.body.setAttribute('data-metier', cle);
    }

    if (etat && etat.metiers) {
      var b = etat.metiers.querySelectorAll('[data-ztsh-metier]');
      for (var i = 0; i < b.length; i++) {
        b[i].setAttribute('aria-pressed', String(b[i].getAttribute('data-ztsh-metier') === cle));
      }
    }
    appliquerPersonnage(cle);
    rafraichirLiensMetier();

    // Signal seulement. Aucune app n'y réagit tant qu'elle n'a pas souscrit.
    document.dispatchEvent(new CustomEvent('zts:metier-change', {
      detail: { metier: cle, precedent: avant, source: 'ztsh-shell' }
    }));
  }

  /* Bascule l'image et le cri partout où un personnage est présent. */
  function appliquerPersonnage(cle) {
    var p = PROFILS[cle] || PROFILS.ep;
    var imgs = document.querySelectorAll('.ztsh-perso__img, .ztsh-vedette__img');
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].getAttribute('src') !== p.img) imgs[i].src = p.img;
      // <picture> : la source webp doit suivre, sinon le navigateur garde
      // l'ancienne — elle a la priorité sur le src de l'<img>.
      var pic = imgs[i].parentNode;
      if (pic && pic.tagName === 'PICTURE') {
        var src = pic.querySelector('source');
        if (src && src.getAttribute('srcset') !== p.webp) src.setAttribute('srcset', p.webp);
      }
    }
    var cris = document.querySelectorAll('.ztsh-perso__cri, .ztsh-vedette__cri');
    for (var j = 0; j < cris.length; j++) cris[j].textContent = p.cri;
  }

  /* ================================================================= RAIL */
  /* Un outil marqué `suitMetier` reçoit le métier de la page quand elle en
     porte un (`body[data-metier]`). Page sans métier — l'accueil, par exemple,
     où metierCourant() renvoie toujours null — le lien reste nu et l'app garde
     son repli. On n'invente pas un métier qu'on ne connaît pas. */
  function avecMetier(href, m) {
    if (!m) return href;
    return href + (href.indexOf('?') === -1 ? '?' : '&') + 'metier=' + m;
  }

  function resoudreHref(o) {
    var href = o.href || '#';
    if (!o.suitMetier) return href;
    return avecMetier(href, metierCourant());
  }

  /* Le rail est construit une fois, au montage ; le sélecteur de métier peut
     changer le métier ensuite. Sans ce rafraîchissement, un lien `suitMetier`
     resterait figé sur le métier du chargement — le défaut réapparaîtrait une
     interaction plus tard. La base est gardée en attribut, jamais relue depuis
     l'href courant : deux changements de suite l'empileraient. */
  function rafraichirLiensMetier() {
    if (!etat || !etat.racine) return;
    var m = metierCourant();
    var liens = etat.racine.querySelectorAll('[data-ztsh-base]');
    for (var i = 0; i < liens.length; i++) {
      liens[i].setAttribute('href', avecMetier(liens[i].getAttribute('data-ztsh-base'), m));
    }
  }

  function construireRail(cfg) {
    if (!cfg.outils.length) return null;
    var casier = el('nav', 'ztsh-casier', { 'aria-label': 'Outils Zone Total Sport' });
    var cle = el('div', 'ztsh-casier__cle', { 'aria-hidden': 'true' });
    cle.textContent = 'OUTILS';
    casier.appendChild(cle);

    cfg.outils.forEach(function (o) {
      if (!o || !o.cle) return;
      // <a> et non <button> : ce sont des liens. Tab et Enter fonctionnent
      // nativement, aucun écouteur clavier n'est nécessaire.
      var a = el('a', 'ztsh-outil' + (o.vedette ? ' ztsh-outil--vedette' : ''), {
        href: resoudreHref(o), title: o.info || o.cle
      });
      if (o.suitMetier) a.setAttribute('data-ztsh-base', o.href || '#');
      a.appendChild(document.createTextNode(o.cle));
      if (o.info) {
        var info = el('span', 'ztsh-outil__info', { 'aria-hidden': 'true' });
        info.textContent = o.info;
        a.appendChild(info);
      }
      casier.appendChild(a);
    });
    return casier;
  }

  /* ========================================================== ENCOURAGEUR
     Les 100 messages pèsent 8 Ko : fichier séparé, chargé seulement quand
     l'encourageur est demandé. Les apps de travail et de projection ne le
     téléchargent jamais. */
  /* ---- Placement du personnage face à ce que l'app pose déjà -------------
     Le 29 juillet, .cours-fab (sae, educatifs) a recouvert un quart du
     personnage en production. Coder la liste des quatre boutons connus
     n'aurait rien réglé : le cinquième mordrait à la vague suivante, en
     silence. La détection est donc générique — on regarde ce qui occupe
     réellement le coin, pas comment il s'appelle.

     Règle, dans cet ordre :
       1. assez de place en décalant  → on décale ;
       2. pas assez                   → LE SHELL S'EFFACE.

     Le shell cède toujours. C'est le contrat depuis le début : l'app a
     raison, le shell s'adapte. Mieux vaut aucun personnage qu'un personnage
     à moitié caché.

     Mesuré au montage, puis UNE fois après le chargement complet — certains
     boutons flottants arrivent tard. Pas d'observateur permanent : sur
     46 apps, ça se paierait en continu pour un cas qui ne bouge plus. */
  var DEPLACEMENT_MAX = 260;   // au-delà, le personnage n'est plus dans son coin

  function bloqueurs(rect) {
    var res = [], tous = document.querySelectorAll('body *');
    var aireVue = window.innerWidth * window.innerHeight;
    for (var i = 0; i < tous.length; i++) {
      var e = tous[i];
      if (e.closest && e.closest('.ztsh-shell')) continue;      // le shell lui-même
      var cs = getComputedStyle(e);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') continue;
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue;
      var b = e.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      // Les voiles et fonds plein cadre couvrent tout par nature : les compter
      // ferait s'effacer le personnage sur toute app qui a un écran de
      // chargement. On ne retient que ce qui occupe un coin.
      if (b.width * b.height > aireVue * 0.6) continue;
      if (b.right < rect.left || b.left > rect.right ||
          b.bottom < rect.top || b.top > rect.bottom) continue;
      res.push(b);
    }
    return res;
  }

  function placerPersonnage(zone) {
    if (!zone || !zone.parentNode) return;
    var base = zone.getBoundingClientRect();
    if (!base.width) return;
    var gene = bloqueurs(base);
    if (!gene.length) return;                     // coin libre, rien à faire

    // De combien faut-il s'écarter pour dégager tout le monde ?
    var versLaGauche = 0, versLeHaut = 0;
    for (var i = 0; i < gene.length; i++) {
      versLaGauche = Math.max(versLaGauche, base.right - gene[i].left + 12);
      versLeHaut   = Math.max(versLeHaut,   base.bottom - gene[i].top + 12);
    }
    // On prend le plus petit des deux déplacements possibles.
    var horizontal = versLaGauche <= versLeHaut;
    var d = horizontal ? versLaGauche : versLeHaut;

    if (d > DEPLACEMENT_MAX) {                    // 2. pas assez de place
      zone.parentNode.removeChild(zone);
      if (etat) etat.encourageur = null;
      return;
    }

    // 1. on décale, puis on revérifie : le déplacement peut heurter autre chose.
    var propr = horizontal ? '--ztsh-perso-garde-droite' : '--ztsh-perso-garde-bas';
    var avant = document.documentElement.style.getPropertyValue(propr);
    document.documentElement.style.setProperty(propr, Math.ceil(d) + 'px');
    if (bloqueurs(zone.getBoundingClientRect()).length) {
      document.documentElement.style.setProperty(propr, avant);   // on remet
      zone.parentNode.removeChild(zone);
      if (etat) etat.encourageur = null;
    }
  }

  /* Personnages déjà posés par les apps. Là où l'un existe, le shell s'efface :
     deux personnages dans le même coin, ce n'est pas un défaut de style, c'est
     une image confuse. Recensé le 29 juillet — planificateur et agenda. */
  var PERSO_DE_L_APP = '.p-perso, .cal-mascot-float, [data-zts-perso]';

  function construireEncourageur(cfg) {
    if (document.querySelector(PERSO_DE_L_APP)) return null;
    var cle = metierCourant() || 'ep';
    var p = PROFILS[cle];
    var zone = el('div', 'ztsh-encourageur');

    var bulle = el('div', 'ztsh-bulle', { id: 'ztsh-bulle', role: 'status', 'aria-live': 'polite' });
    var txt = el('p', 'ztsh-bulle__txt', { id: 'ztsh-bulle-txt' });
    var encore = el('span', 'ztsh-bulle__encore', { 'aria-hidden': 'true' });
    encore.textContent = 'Clique-moi encore →';
    bulle.appendChild(txt); bulle.appendChild(encore);

    var perso = el('button', 'ztsh-perso', {
      type: 'button', id: 'ztsh-perso',
      'aria-label': 'Un nouveau message d\'encouragement'
    });
    var pic = el('picture', '');
    var srcWebp = document.createElement('source');
    srcWebp.type = 'image/webp';
    srcWebp.setAttribute('srcset', p.webp);
    var img = el('img', 'ztsh-perso__img', {
      src: p.img, alt: '', width: '264', height: '338', loading: 'lazy', decoding: 'async'
    });
    // Dégradation : image absente → on retire l'encourageur, sans bruit.
    img.addEventListener('error', function () {
      if (zone.parentNode) zone.parentNode.removeChild(zone);
    });
    pic.appendChild(srcWebp); pic.appendChild(img);
    var cri = el('span', 'ztsh-perso__cri', { 'aria-hidden': 'true' });
    cri.textContent = p.cri;
    perso.appendChild(pic); perso.appendChild(cri);

    var restants = [], phrases = null;
    function prochain() {
      if (!phrases || !phrases.length) return;
      if (!restants.length) {
        restants = phrases.slice();
        for (var i = restants.length - 1; i > 0; i--) {
          var j = Math.floor(Math.random() * (i + 1));
          var t = restants[i]; restants[i] = restants[j]; restants[j] = t;
        }
      }
      txt.textContent = restants.pop();
      bulle.classList.add('is-on');
    }
    /* Le personnage est présent partout, mais il ne parle pas partout.
       En travail et en projection il est SILENCIEUX : aucun message au
       chargement, aucune bulle tant qu'on ne l'a pas cliqué. Il est là, il
       n'interrompt pas un cours. En vitrine il garde son accueil.

       Conséquence heureuse : la banque de 8 Ko n'a plus à être téléchargée au
       montage. Elle arrive au premier clic, et seulement s'il y a un clic. */
    var bavard = (cfg.densite === 'vitrine');
    var demande = null;   // promesse de chargement, une seule fois

    function chargerBanque() {
      if (demande) return demande;
      demande = new Promise(function (resoudre) {
        var s = document.createElement('script');
        s.src = BASE + 'ztsh-encouragements.js';
        s.async = true;
        s.addEventListener('load', function () {
          phrases = (window.ZTSH_ENCOURAGEMENTS || []).slice();
          resoudre(phrases.length > 0);
        });
        s.addEventListener('error', function () { resoudre(false); });
        document.head.appendChild(s);
        zone._ztshScript = s;
      });
      return demande;
    }

    perso.addEventListener('click', function () {
      chargerBanque().then(function (ok) { if (ok) prochain(); });
    });

    if (bavard) {
      chargerBanque().then(function (ok) {
        // Banque absente ou vide : l'encourageur se retire, sans bruit.
        if (ok) prochain();
        else if (zone.parentNode) zone.parentNode.removeChild(zone);
      });
    }

    zone.appendChild(bulle);
    zone.appendChild(perso);
    // _ztshScript est posé par chargerBanque(), au moment où le script existe.
    return zone;
  }

  /* =========================================================== PAUSE CAFÉ */
  function construireCafe() {
    var zone = el('div', 'ztsh-cafe');

    var plateau = el('div', 'ztsh-plateau', { id: 'ztsh-plateau', role: 'status', 'aria-live': 'polite' });
    var genre = el('span', 'ztsh-plateau__genre');
    var txt   = el('p', 'ztsh-plateau__txt');
    var src   = el('span', 'ztsh-plateau__src');
    plateau.appendChild(genre); plateau.appendChild(txt); plateau.appendChild(src);

    var btn = el('button', 'ztsh-declencheur', { type: 'button', id: 'ztsh-cafe-btn' });
    // Marque Bangers, pas d'emoji — place réservée pour l'icône Pop Art.
    var marque = el('span', 'ztsh-declencheur__marque', { 'aria-hidden': 'true' });
    marque.textContent = '★';
    btn.appendChild(marque);
    btn.appendChild(document.createTextNode('PAUSE CAFÉ'));

    var dejaVus = [];
    btn.addEventListener('click', function () {
      var dispo = CAFE_REPLI.filter(function (o) { return dejaVus.indexOf(o.t) === -1; });
      var pool = dispo.length ? dispo : CAFE_REPLI;
      var o = pool[Math.floor(Math.random() * pool.length)];
      dejaVus.push(o.t);
      if (dejaVus.length > 8) dejaVus.shift();
      genre.textContent = o.g || 'PAUSE';
      txt.textContent = o.t;
      src.textContent = o.s || '';
      plateau.classList.add('is-on');
    });

    zone.appendChild(plateau);
    zone.appendChild(btn);
    return zone;
  }

  /* ============================================================= COMPTEUR
     Comptage animé au PREMIER affichage seulement. Implémenté ici et non
     délégué à ZTS.countUp : acrosport, evaluation et studio-jeu ne chargent
     pas shared/zts.js, et countUp cible [data-count], pas nos éléments. */
  function animerCompteurs(racine) {
    var els = (racine || document).querySelectorAll('[data-ztsh-cible]');
    if (!els.length) return;
    var reduit = mouvementReduit();

    for (var i = 0; i < els.length; i++) (function (n) {
      var fin = parseInt(n.getAttribute('data-ztsh-cible'), 10);
      if (isNaN(fin)) return;
      if (reduit || typeof IntersectionObserver !== 'function') {
        n.textContent = fin.toLocaleString('fr-CA');
        return;
      }
      var io = new IntersectionObserver(function (entrees) {
        for (var k = 0; k < entrees.length; k++) {
          if (!entrees[k].isIntersecting) continue;
          io.disconnect();
          var t0 = performance.now(), duree = 1150;
          (function pas(t) {
            var p = Math.min((t - t0) / duree, 1);
            var e = 1 - Math.pow(1 - p, 3);
            n.textContent = Math.round(fin * e).toLocaleString('fr-CA');
            if (p < 1) requestAnimationFrame(pas);
          })(performance.now());
        }
      }, { threshold: .4 });
      io.observe(n);
      n._ztshIO = io;
    })(els[i]);
  }

  /* ================================================================ MONTER */
  /* Le montage ne doit JAMAIS échouer en silence.

     Trouvé le 29 juillet : une variable disparue dans construireEncourageur()
     faisait échouer monter() en entier — la page gardait ses classes, perdait
     tout le chrome, et la console restait vide. Sur 46 apps, c'est
     indétectable. Même classe de panne que D18, l'ordre de chargement : ça ne
     casse rien de visible, ça éteint le shell.

     monter() intercepte donc ses propres erreurs, écrit UNE ligne explicite,
     et remet la page dans son état d'avant. Mieux vaut une app sans habillage
     qu'une app à moitié habillée. */
  function monter(opts) {
    try {
      return monterVraiment(opts);
    } catch (e) {
      try { demonter(); } catch (e2) { /* le démontage lui-même a échoué */ }
      if (window.console && console.error) {
        console.error('[ZTSH] montage échoué : ' + (e && e.message ? e.message : e));
      }
      return null;
    }
  }

  function monterVraiment(opts) {
    if (!document.body) return null;      // appelé trop tôt : on ne casse rien
    if (etat) demonter();                 // idempotent

    var cfg = normaliser(opts);
    var racine = el('div', 'ztsh-shell', {
      'data-ztsh-densite': cfg.densite,
      'data-ztsh-version': VERSION
    });
    etat = { racine: racine, config: cfg, metiers: null, encourageur: null, cafe: null, rayons: null };

    // Marqueur d'opt-in. Le fond marine et le restylage de .zts-header vivent
    // dans shared/zts.css sous cette classe : une app qui n'appelle pas
    // monter() garde exactement son apparence actuelle.
    // La classe sur <html> porte le fond marine (ztsh-shell.css §5, posé là
    // pour ne pas masquer les z-index négatifs de la page). En densité
    // projection l'app garde son plein cadre : pas de fond imposé.
    if (cfg.fond) document.documentElement.classList.add('ztsh-on');
    document.body.classList.add('ztsh-on');
    document.body.setAttribute('data-ztsh-densite', cfg.densite);

    // Portillon présent → le personnage se relève au-dessus de .ztg-out.
    // Détection par le script plutôt que par le nœud : zts-gate.js injecte son
    // bouton après coup, et monter() peut passer avant lui.
    if (document.querySelector('script[src*="zts-gate"]')) {
      document.documentElement.style.setProperty('--ztsh-perso-garde-bas', '58px');
    }

    // Fond sur l'enveloppe : le marine et les rayons quittent <html> pour
    // .ztsh-page, qui est peinte apres le fond de body et repasse donc par
    // dessus un background !important. L'enveloppe s'isole (isolation:isolate)
    // pour que les z-index negatifs de l'app restent AU-DESSUS de ce fond.
    etat.enveloppe = null;
    if (cfg.fond && cfg.fondSurEnveloppe) {
      var env = document.querySelector('.ztsh-page');
      if (env) { env.classList.add('ztsh-fond'); etat.enveloppe = env; }
    }

    // Rayons : nœud dédié, body n'a que deux pseudo-éléments (fond, halftone).
    // Avec fondSurEnveloppe, ils sont dessines par .ztsh-page::before, dans le
    // contexte d'empilement de l'enveloppe — un noeud fixe a z-index negatif
    // passerait sous elle.
    if (cfg.fond && !etat.enveloppe) {
      etat.rayons = el('div', 'ztsh-rayons', { 'aria-hidden': 'true' });
      racine.appendChild(etat.rayons);
    }

    // Le sélecteur vit dans le flux, en haut du contenu, juste après l'hôte
    // du header partagé. Ajout de nœud, jamais déplacement.
    if (cfg.metierSelecteur) {
      var metiers = construireMetiers();
      if (metiers) {
        etat.metiers = metiers;
        var hote = document.querySelector('[data-zts-header]');
        if (hote && hote.parentNode) hote.parentNode.insertBefore(metiers, hote.nextSibling);
        else document.body.insertBefore(metiers, document.body.firstChild);
      }
    }

    if (cfg.rail) {
      var rail = construireRail(cfg);
      if (rail) racine.appendChild(rail);
    }
    if (cfg.encourageur) {
      etat.encourageur = construireEncourageur(cfg);
      if (etat.encourageur) racine.appendChild(etat.encourageur);
    }
    if (cfg.pauseCafe)   { etat.cafe        = construireCafe();        racine.appendChild(etat.cafe); }

    document.body.appendChild(racine);

    // Placement du personnage : une fois maintenant, une fois quand la page a
    // fini de charger. Les boutons flottants d'app arrivent souvent après.
    if (etat.encourageur) {
      placerPersonnage(etat.encourageur);
      var tard = function () {
        if (etat && etat.encourageur) placerPersonnage(etat.encourageur);
      };
      if (document.readyState === 'complete') setTimeout(tard, 400);
      else window.addEventListener('load', function () { setTimeout(tard, 400); }, { once: true });
    }

    // Personnages et compteurs déjà présents dans le HTML de la page.
    appliquerPersonnage(metierCourant() || 'ep');
    animerCompteurs(document);

    return racine;
  }

  /* ============================================================== DÉMONTER
     Rollback complet : le DOM revient à son état d'avant monter(). */
  function demonter() {
    if (!etat) return;
    if (etat.encourageur && etat.encourageur._ztshScript && etat.encourageur._ztshScript.parentNode) {
      etat.encourageur._ztshScript.parentNode.removeChild(etat.encourageur._ztshScript);
    }
    if (etat.enveloppe) etat.enveloppe.classList.remove('ztsh-fond');
    if (etat.metiers && etat.metiers.parentNode) etat.metiers.parentNode.removeChild(etat.metiers);
    if (etat.racine && etat.racine.parentNode) etat.racine.parentNode.removeChild(etat.racine);
    var n = document.querySelectorAll('[data-ztsh-cible]');
    for (var i = 0; i < n.length; i++) if (n[i]._ztshIO) { n[i]._ztshIO.disconnect(); delete n[i]._ztshIO; }
    // Les gardes sont posées par placerPersonnage() ; sans remise à zéro
    // elles s'accumulent d'un montage au suivant et faussent la mesure.
    document.documentElement.style.removeProperty('--ztsh-perso-garde-droite');
    document.documentElement.style.removeProperty('--ztsh-perso-garde-bas');
    document.documentElement.classList.remove('ztsh-on');
    if (document.body) {
      document.body.classList.remove('ztsh-on');
      document.body.removeAttribute('data-ztsh-densite');
    }
    etat = null;
  }

  /* ================================================================== API */
  window.ZTSShell = {
    version: VERSION,
    monter: monter,
    demonter: demonter,
    estMonte: function () { return !!etat; },
    config: function () { return etat ? JSON.parse(JSON.stringify(etat.config)) : null; },
    choisirMetier: choisirMetier,
    animerCompteurs: animerCompteurs,
    prefixeStockage: PREFIXE_STOCKAGE
  };

  // Aucun montage automatique. C'est délibéré, et c'est le cœur du contrat.
})();
