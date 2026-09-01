/**
 * ZTS Lock Page — Cadenas dur sur pages individuelles (articles + apps)
 * Logique : si non-auth et slug pas dans la whitelist → pop-up plein ecran
 *
 * Charge avec defer. Depend de firebase-auth.js (ztsOnAuth) qui charge en
 * paralllele. zts-locked-fullscreen.js fournit window.ztsShowLockedFullscreen.
 */
(function () {
  'use strict';

  var WHITELIST_URL = '/locked-whitelist.json';
  var CACHE_KEY = 'zts_locked_whitelist_v1';
  var CACHE_TTL = 60 * 60 * 1000; // 1h

  function getSlug() {
    var p = window.location.pathname;
    // /articles/foo.html -> foo  |  /apps/foo/ -> foo  |  /apps/foo/index.html -> foo
    var m = p.match(/\/articles\/([^/]+?)(?:\.html)?$/);
    if (m) return { kind: 'article', slug: m[1] };
    m = p.match(/\/apps\/([^/]+)\/(?:index\.html)?$/);
    if (m) return { kind: 'resource', slug: m[1] };
    // /jeux/foo.html -> foo — ajoute le 2026-08-15 (LOT 1, vague B).
    // Sans cette ligne, poser ce script sur les 1440 fiches n'aurait RIEN fait :
    // getSlug() retombait sur `return null` et init() sortait immediatement.
    // `jeux/index.html` est exclu : c'est le hub de la banque, pas une fiche,
    // et il doit rester ouvert (il n'expose que des titres et des liens).
    m = p.match(/\/jeux\/([^/]+?)\.html$/);
    if (m && m[1] !== 'index') return { kind: 'jeu', slug: m[1] };
    return null;
  }

  function loadWhitelist() {
    try {
      var raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        var c = JSON.parse(raw);
        if (c && c.t && (Date.now() - c.t) < CACHE_TTL && c.d) return Promise.resolve(c.d);
      }
    } catch (e) {}
    return fetch(WHITELIST_URL, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d) {
          try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {}
        }
        return d || { freeResources: [], freeArticles: [] };
      })
      .catch(function () { return { freeResources: [], freeArticles: [] }; });
  }

  function isFree(info, wl) {
    if (!info || !wl) return false;
    if (info.kind === 'article') return (wl.freeArticles || []).indexOf(info.slug) !== -1;
    if (info.kind === 'resource') return (wl.freeResources || []).indexOf(info.slug) !== -1;
    // Les items vitrine vivent dans `freeItems`, indexe par famille — c'est le
    // champ que la vague C fera lire aux deux SPA (jeux et sae). Il est
    // introduit ici parce que les fiches statiques en ont besoin en premier :
    // `freeResources` ne sait nommer que des apps entieres, pas des items.
    if (info.kind === 'jeu') return (((wl.freeItems || {}).jeux) || []).indexOf(info.slug) !== -1;
    return false;
  }

  function showLock(info) {
    document.body.style.overflow = 'hidden';
    if (window.ztsShowLockedFullscreen) {
      window.ztsShowLockedFullscreen({
        source: info.kind,
        slug: info.slug,
        closable: false,
      });
      return;
    }
    // Fallback minimal si zts-locked-fullscreen.js pas encore charge
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#1e3a8a,#6d28d9);display:flex;align-items:center;justify-content:center;padding:20px;font-family:var(--ztsh-f-corps,"Quicksand",system-ui,sans-serif);color:#fff;text-align:center';
    var r = t();
    d.innerHTML = '<div style="max-width:500px"><h1 style="font-size:2rem;margin-bottom:1rem">' + r.replTitre + '</h1><p style="margin-bottom:1.5rem">' + r.replSous + '</p><button id="zts-lock-fallback-btn" style="background:#FFD700;border:3px solid #000;border-radius:14px;padding:12px 24px;font-family:inherit;font-size:1.2rem;cursor:pointer;box-shadow:4px 4px 0 #000">' + r.replBouton + '</button></div>';
    document.body.appendChild(d);
    var btn = d.querySelector('#zts-lock-fallback-btn');
    btn.addEventListener('click', function () { if (window.ztsShowSignup) window.ztsShowSignup(); });
  }

  // ===================== DEMI-APERÇU ARTICLES =====================
  // Articles : on montre ~50% du contenu, le reste masqué + CTA inscription.
  // Texte complet conservé dans le DOM (display:none) → SEO préservé.
  function injectHalfCss() {
    if (document.getElementById('zts-half-css')) return;
    var s = document.createElement('style');
    s.id = 'zts-half-css';
    s.textContent =
      '.zts-half-hidden{display:none!important;}' +
      '.zts-half-cta{position:relative;margin:10px 0 0;padding:30px 22px 26px;text-align:center;border-radius:28px;' +
      'border:3px solid #0F0F2E;background:linear-gradient(160deg,#E0F7FF,#CFF3FF);box-shadow:6px 6px 0 #0F0F2E;}' +
      '.zts-half-cta::before{content:"";position:absolute;left:0;right:0;top:-90px;height:90px;pointer-events:none;' +
      'background:linear-gradient(180deg,rgba(255,255,255,0),#fff);}' +
      '.zts-half-cta h3{font-family:var(--ztsh-f-titre,"Luckiest Guy",system-ui,sans-serif);font-size:clamp(22px,4vw,30px);color:#0F0F2E;margin:0 0 8px;line-height:1.1;}' +
      '.zts-half-cta p{font-family:var(--ztsh-f-corps,"Quicksand",system-ui,sans-serif);font-size:1.15rem;color:#0F0F2E;opacity:.85;margin:0 auto 18px;max-width:46ch;}' +
      '.zts-half-cta__btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}' +
      '.zts-half-cta__genia{font-family:var(--ztsh-f-corps,"Quicksand",system-ui,sans-serif);' +
      'font-size:.95rem;color:#0F0F2E;opacity:.9;margin:16px auto 0;max-width:46ch;}' +
      '.zts-half-cta__genia a{color:#0F0F2E;font-weight:bold;text-decoration:underline;}' +
      '.zts-half-cta button{cursor:pointer;font-family:var(--ztsh-f-titre,"Luckiest Guy",system-ui,sans-serif);font-size:1.1rem;padding:13px 26px;' +
      'border-radius:999px;border:3px solid #0F0F2E;box-shadow:4px 4px 0 #0F0F2E;}' +
      '.zts-half-cta .b1{background:#FFD700;color:#0F0F2E;}.zts-half-cta .b2{background:#fff;color:#0F0F2E;}' +
      '.zts-half-cta button:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #0F0F2E;}';
    document.head.appendChild(s);
  }

  // TOUS les conteneurs de contenu, pas seulement le plus rempli.
  //
  // Cette fonction ne retenait qu'un seul .article-body — celui qui avait le
  // plus d'enfants — et laissait les autres entierement visibles. Deux articles
  // en profitaient, mesures en anonyme le 24 aout 2026 :
  //
  //   50-jeunes-un-gymnase porte TROIS .article-body freres (2, 19 et 7
  //   enfants). Seul celui de 19 etait mure. Entre les deux derniers vit toute
  //   la section des 21 strategies, dans aucun conteneur : 93 % de l'article
  //   etait lisible sans compte.
  //
  //   un-jeu-trois-versions n'a AUCUN .article-body — son contenu vit dans un
  //   <div class="zts-inc">. La fonction rendait null, demiApercu() sortait
  //   sans rien faire : 100 % lisible.
  //
  // On retourne donc la LISTE des conteneurs, et applyHalf() coupe sur
  // l'ensemble concatene. Un article qui gagnera demain un troisieme squelette
  // sera couvert sans qu'on ait a y toucher.
  //
  // Le repli .zts-inc est deliberement etroit. Poser la classe .article-body
  // sur ce conteneur serait plus court et FAUX : cette classe porte le style
  // de la typographie d'article. Mesure sur un-jeu-trois-versions — les
  // citations passeraient de 17 a 31,2 px et les h3 changeraient de police.
  // C'est au verrou de connaitre les deux structures, pas aux articles de se
  // deguiser pour lui plaire.
  function contentContainers() {
    var trouves = document.querySelectorAll('.article-body');
    if (!trouves.length) trouves = document.querySelectorAll('article.zts-prose > .zts-inc');
    var out = [];
    for (var i = 0; i < trouves.length; i++) out.push(trouves[i]);
    // null et non [] : demiApercu() teste la valeur, et un tableau vide est
    // vrai en JavaScript — il passerait le garde et couperait dans le vide.
    return out.length ? out : null;
  }

  // Le texte du CTA parle de ce qui est masque : « l'article » sur un article,
  // les sections de la fiche sur un jeu. Un CTA qui promet « la suite de
  // l'article » sur une fiche de jeu se decredibilise tout seul.
  // ── La langue : UNE seule definition pour tout le tunnel ──
  // L'algorithme vit dans shared/zts.js (`ZTS.langue`) : ?lang= d'abord, puis
  // le choix memorise, puis la langue du navigateur. On l'appelle quand il est
  // la ; sinon on refait EXACTEMENT le meme calcul, parce que ce module peut
  // s'executer avant shared/zts.js selon l'ordre des balises de la page.
  //
  // Repondre « fr » par defaut serait plus court et FAUX : c'est precisement
  // ce qui faisait voir a un anglophone le cadenas dans une langue et le mur
  // dans l'autre, sur la meme page. Les trois versions divergentes de cette
  // fonction — localStorage seul, ZTS.getLang() seul, trois niveaux — sont
  // remplacees par ce bloc, identique dans chaque module.
  function lang() {
    try { if (window.ZTS && ZTS.langue) return ZTS.langue(); } catch (e) {}
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'en' || q === 'fr') return q;
    } catch (e) {}
    try {
      var saved = localStorage.getItem('zts_lang');
      if (saved === 'en' || saved === 'fr') return saved;
    } catch (e) {}
    return (navigator.language || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr';
  }

  var CTA_TEXTES = {
    fr: {
      article: {
        titre: '🔒 La suite est réservée aux membres',
        sous: 'Crée ton compte gratuit pour lire l’article au complet — et débloquer les 20+ outils. 100 % gratuit, pour toujours.',
        bouton: '🔓 Lire la suite gratuitement'
      },
      jeu: {
        titre: '🔒 La fiche complète est réservée aux membres',
        sous: 'Variantes, consignes de sécurité, adaptations pour l’inclusion, rôle de l’enseignant, retour au calme : crée ton compte gratuit pour tout voir — sur cette fiche et sur les 1 438 autres. 100 % gratuit, pour toujours.',
        bouton: '🔓 Voir la fiche complète'
      },
      dejaMembre: 'Déjà membre? Se connecter',
      // Nombre lu de window.ztsAnonLimit, jamais ecrit ici.
      genia: function (n) { return n + ' essais gratuits de l\'assistant IA, sans compte'; },
      geniaLien: 'Essayer →',
      replTitre: 'Cette page est réservée aux membres',
      replSous: 'Inscris-toi gratuitement et reçois 90 cours d\'ÉPS clé en main',
      replBouton: 'S\'inscrire'
    },
    en: {
      article: {
        titre: '🔒 The rest is for members',
        sous: 'Create your free account to read the full article — and unlock the 20+ tools. 100% free, forever.',
        bouton: '🔓 Read the rest, free'
      },
      jeu: {
        titre: '🔒 The full sheet is for members',
        sous: 'Variations, safety guidelines, inclusion adaptations, the teacher’s role, cool-down: create your free account to see it all — on this sheet and on the 1,438 others. 100% free, forever.',
        bouton: '🔓 See the full sheet'
      },
      dejaMembre: 'Already a member? Sign in',
      genia: function (n) { return n + ' free AI assistant tries, no account'; },
      geniaLien: 'Try it →',
      replTitre: 'This page is for members',
      replSous: 'Sign up free and get 90 ready-to-teach PE lessons',
      replBouton: 'Sign up'
    }
  };
  function t() { return CTA_TEXTES[lang()] || CTA_TEXTES.fr; }

  // Le plafond appartient a zts-anon-fingerprint.js (window.ztsAnonLimit).
  // Un seul lecteur ici, un seul repli.
  function plafondAnon() {
    return (typeof window.ztsAnonLimit === 'number' && window.ztsAnonLimit > 0) ? window.ztsAnonLimit : 3;
  }

  // Bascule FR/EN apres le rendu : on remplace le bloc en place.
  // Le demi-mur n'ecoutait pas `zts:langchange` — il etait donc bilingue au
  // CHARGEMENT seulement, et restait dans sa langue de depart si le visiteur
  // touchait le selecteur. Le mur plein ecran et la modale, eux, redessinent
  // depuis la vague B ; celui-ci manquait a l'appel.
  //
  // On ne reconstruit QUE le bloc, jamais le mur entier : buildCta n'emet
  // aucun evenement, donc rien n'est compte deux fois.
  var _dernierInfo = null;
  document.addEventListener('zts:langchange', function () {
    if (!_dernierInfo) return;
    var vieux = document.querySelector('.zts-half-cta');
    if (!vieux || !vieux.parentNode) return;
    vieux.parentNode.replaceChild(buildCta(_dernierInfo), vieux);
  });

  function buildCta(info) {
    _dernierInfo = info;
    var d0 = t();
    var tx = d0[info.kind] || d0.article;
    var d = document.createElement('div');
    d.className = 'zts-half-cta';
    d.innerHTML =
      '<h3>' + tx.titre + '</h3>' +
      '<p>' + tx.sous + '</p>' +
      '<div class="zts-half-cta__btns">' +
      '<button class="b1" data-act="signup">' + tx.bouton + '</button>' +
      '<button class="b2" data-act="login">' + d0.dejaMembre + '</button>' +
      '</div>' +
      '<p class="zts-half-cta__genia">' + d0.genia(plafondAnon()) +
        ' <a data-act="genia" href="/apps/generateur/">' + d0.geniaLien + '</a></p>';
    // UN SEUL locked_click_signup par intention : ce bouton-ci EST la demande
    // d'inscription. Aucun autre emetteur sur la page (la fiche n'a ni carte
    // verrouillee ni pop-up plein ecran).
    d.querySelector('[data-act=signup]').addEventListener('click', function () {
      if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_click_signup', { source: info.kind, slug: info.slug });
      // PROVENANCE DE L'INSCRIPTION — deux cles, deux roles, deux cardinalites.
      // Sans elles, fireSignupComplete() ne trouvait rien et ecrivait
      // `signup_source: 'direct'` : l'inscription etait comptee, son origine
      // perdue. Le defaut touchait les 27 articles autant que les 1440 fiches.
      //
      //   zts_signup_source : 'demi_mur_jeu' | 'demi_mur_article'  (2 valeurs)
      //     -> part vers GA4. Reste plat et snake_case comme les trois autres
      //        emetteurs ('locked_card', 'popup', 'newsletter_popup').
      //   zts_signup_slug   : le slug exact                        (cardinalite elevee)
      //     -> reste dans Firestore. NE PAS le concatener a la source : avec
      //        1440 fiches et 27 articles, GA4 plafonnerait la dimension et
      //        noierait le surplus dans (other).
      //
      // La consommation des deux cles appartient a fireSignupComplete()
      // (firebase-auth.js), pas ici : c'est lui l'unique point de verite, et
      // c'est lui qui sait ignorer un slug orphelin.
      try {
        sessionStorage.setItem('zts_signup_source', 'demi_mur_' + info.kind);
        sessionStorage.setItem('zts_signup_slug', info.slug || '');
      } catch (e) {}
      if (window.ztsShowSignup) window.ztsShowSignup();
    });
    // Le lien porte son href : on trace, on ne bloque pas la navigation.
    d.querySelector('[data-act=genia]').addEventListener('click', function () {
      if (window.ztsTrackFunnel) {
        window.ztsTrackFunnel('genia_click', { source: 'mur-genia', layer: info.kind, slug: info.slug });
      }
    });
    d.querySelector('[data-act=login]').addEventListener('click', function () {
      if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_click_login', { source: info.kind, slug: info.slug });
      if (window.ztsShowLogin) window.ztsShowLogin();
    });
    return d;
  }

  // La coupure se calcule sur les enfants de TOUS les conteneurs mis bout a
  // bout, pas conteneur par conteneur. Couper chacun en deux donnerait deux
  // moities et deux CTA : le lecteur verrait la premiere moitie de l'intro,
  // un mur, puis la premiere moitie de la conclusion. L'article se lit en
  // continu, il doit se couper en continu.
  // ⚠ ÉCHAPPATOIRE : `data-zts-toujours-visible`
  //
  // Un bloc portant cet attribut n'est jamais masqué par le demi-aperçu, ET il
  // ne compte pas dans le calcul de la coupure. Les deux vont ensemble : si un
  // bloc exempté restait compté, il achèterait du contenu gratuit au lecteur —
  // une promo toujours visible ferait grossir la moitié offerte.
  //
  // À QUOI ÇA SERT. Un article peut vouloir montrer une promo, un encadré
  // d'outil ou un appel à l'action à TOUS les visiteurs, y compris ceux qui ne
  // sont pas connectés — ce sont justement eux qu'on cherche à convertir. Sans
  // l'attribut, la moitié basse tombe derrière le mur et l'appât devient une
  // récompense réservée à ceux qui n'en ont plus besoin.
  //
  // COMMENT S'EN SERVIR. Poser l'attribut sur chaque ENFANT DIRECT d'un
  // conteneur de contenu qui compose le bloc — le titre, les paragraphes, les
  // encadrés, le CTA. Un enfant oublié sera masqué et coupera le bloc en deux.
  //
  //   <h2 id="…" data-zts-toujours-visible>…</h2>
  //   <figure class="…" data-zts-toujours-visible>…</figure>
  //   <aside class="zts-cta-inline" data-zts-toujours-visible>…</aside>
  //
  // Premier usage : la section « Zone Inventaire » de
  // articles/inventaire-materiel-sans-effort.html (23 août 2026).
  //
  // CE QU'IL NE FAUT PAS EN FAIRE. Exempter le corps de l'article viderait le
  // mur de son sens. L'échappatoire est faite pour de la promo, pas du contenu.
  //
  // L'exemption vit dans la boucle multi-conteneurs : elle s'applique donc
  // à tous les squelettes d'un même article, pas seulement au premier.
  function applyHalf(containers, info) {
    if (!containers || !containers.length) return;
    if (containers[0].getAttribute('data-zts-half') === '1') return;

    var kids = [];
    for (var c = 0; c < containers.length; c++) {
      var enfants = containers[c].children;
      for (var i = 0; i < enfants.length; i++) {
        if (enfants[i].classList.contains('zts-half-cta')) continue;
        if (enfants[i].hasAttribute('data-zts-toujours-visible')) continue;
        kids.push(enfants[i]);
      }
    }
    if (kids.length < 4) return;               // article trop court → laissé entier

    var cut = Math.ceil(kids.length / 2);
    for (var j = cut; j < kids.length; j++) kids[j].classList.add('zts-half-hidden');
    // Le CTA se pose dans le parent reel du premier enfant masque, pas dans
    // containers[0] : avec plusieurs squelettes, la coupure tombe souvent dans
    // le deuxieme ou le troisieme.
    kids[cut].parentNode.insertBefore(buildCta(info), kids[cut]);
    for (var k = 0; k < containers.length; k++) containers[k].setAttribute('data-zts-half', '1');
  }

  function revealAll(containers) {
    if (!containers || !containers.length) return;
    for (var c = 0; c < containers.length; c++) {
      var h = containers[c].querySelectorAll('.zts-half-hidden');
      for (var i = 0; i < h.length; i++) h[i].classList.remove('zts-half-hidden');
      var cta = containers[c].querySelector('.zts-half-cta');
      if (cta) cta.remove();
      containers[c].setAttribute('data-zts-half', '0');
    }
  }

  function initArticleHalf(info) {
    demiApercu(info, contentContainers, applyHalf);
  }

  // ===================== FICHE DE JEU TRONQUEE =====================
  // Meme patron que les articles, sur une structure differente. La fiche est :
  //   .fiche-wrap > .fiche-back, header.fiche-hero, nav.fiche-toc,
  //                 section#der, .fiche-cols > 12 autres .fiche-sec, a.fiche-cta
  // On garde visibles le heros (titre, categorie, but, chiffres cles) et les
  // DEUX premieres sections — Deroulement et Materiel — de quoi juger le jeu et
  // avoir envie du reste. Les onze suivantes passent en display:none, texte
  // conserve dans le DOM (decision du 15 aout : le SEO prime, la vraie
  // protection viendra du Worker a la vague D).
  var SEC_VISIBLES = 2;

  function ficheSections() {
    var secs = document.querySelectorAll('.fiche-wrap .fiche-sec');
    return secs.length ? secs : null;
  }

  function applyHalfFiche(_ignore, info) {
    var secs = ficheSections();
    if (!secs || secs.length <= SEC_VISIBLES) return;          // fiche trop courte
    var hote = secs[SEC_VISIBLES].parentNode;
    if (hote.getAttribute('data-zts-half') === '1') return;
    for (var i = SEC_VISIBLES; i < secs.length; i++) secs[i].classList.add('zts-half-hidden');
    // Le CTA se pose AVANT la premiere section masquee, dans son propre parent :
    // la 3e section vit dans .fiche-cols (grille 2 colonnes), pas dans
    // .fiche-wrap — inserer ailleurs le placerait hors du flux de lecture.
    hote.insertBefore(buildCta(info), secs[SEC_VISIBLES]);
    hote.setAttribute('data-zts-half', '1');
  }

  function revealAllFiche() {
    var caches = document.querySelectorAll('.fiche-wrap .zts-half-hidden');
    for (var i = 0; i < caches.length; i++) caches[i].classList.remove('zts-half-hidden');
    var cta = document.querySelector('.fiche-wrap .zts-half-cta');
    if (cta) cta.remove();
    var hote = document.querySelector('.fiche-wrap [data-zts-half="1"]');
    if (hote) hote.setAttribute('data-zts-half', '0');
  }

  // Tronc commun aux articles et aux fiches : couper tout de suite (pas de
  // flash de contenu pour un anonyme), puis reveler si l'auth arrive avec un
  // utilisateur. `locked_view` une seule fois, jamais pour un membre.
  function demiApercu(info, trouverConteneur, couper, reveler) {
    injectHalfCss();
    var c = trouverConteneur ? trouverConteneur() : null;
    if (trouverConteneur && !c) return;
    couper(c, info);
    var tracked = false;
    (function tick() {
      if (window.ztsOnAuth) {
        window.ztsOnAuth(function (user) {
          if (user) { (reveler || revealAll)(c); }
          else {
            couper(c, info);
            if (!tracked && window.ztsTrackFunnel) {
              tracked = true;
              window.ztsTrackFunnel('locked_view', { source: info.kind, slug: info.slug });
            }
          }
        });
        return;
      }
      setTimeout(tick, 200);
    })();
  }

  function initJeuHalf(info) {
    demiApercu(info, null, applyHalfFiche, revealAllFiche);
  }

  function init() {
    var info = getSlug();
    if (!info) return;

    // Articles → demi-aperçu, SAUF ceux de la liste blanche (freeArticles).
    //
    // Ce `return` tombait avant tout appel a loadWhitelist(). isFree() n'etait
    // donc jamais consulte pour un article, et freeArticles ne servait a rien :
    // les trois slugs choisis comme appats SEO etaient mures comme les autres.
    // Mesure du 24 aout 2026 sur faire-bouger-enfants, present dans la liste :
    // 4 815 mots visibles sur 9 010, soit 53 % — il devrait etre entier.
    // Les branches `jeu` et `resource`, elles, consultaient bien la liste.
    //
    // Meme ordre que la branche `jeu` juste dessous, et pour la meme raison :
    // on COUPE D'ABORD, on verifie ensuite. Au premier passage la liste vient
    // du reseau ; attendre sa reponse montrerait l'article entier a un anonyme
    // pendant tout l'aller-retour. Couper puis reveler une vitrine est le
    // moindre mal — on montre moins, puis plus, jamais l'inverse.
    if (info.kind === 'article') {
      injectHalfCss();
      var conteneurs = contentContainers();
      if (conteneurs) applyHalf(conteneurs, info);
      loadWhitelist().then(function (wl) {
        if (isFree(info, wl)) { revealAll(conteneurs); return; }   // vitrine : entier
        initArticleHalf(info);
      });
      return;
    }

    // Fiches de jeux → fiche tronquée, SAUF les trois vitrines (freeItems.jeux).
    // On COUPE D'ABORD, on verifie ensuite : au premier passage la liste blanche
    // vient du reseau, et attendre sa reponse montrerait la fiche entiere a un
    // anonyme pendant tout l'aller-retour. Couper puis reveler une vitrine est
    // le moindre mal — on montre moins, puis plus, jamais l'inverse.
    if (info.kind === 'jeu') {
      injectHalfCss();
      applyHalfFiche(null, info);
      loadWhitelist().then(function (wl) {
        if (isFree(info, wl)) { revealAllFiche(); return; }   // vitrine : entiere
        initJeuHalf(info);
      });
      return;
    }

    // Ressources (apps) → verrou plein écran existant, inchangé
    Promise.all([
      loadWhitelist(),
      new Promise(function (resolve) {
        function tick() {
          if (window.ztsOnAuth) {
            var done = false;
            window.ztsOnAuth(function (user) {
              if (done) return;
              done = true;
              resolve(user);
            });
            return;
          }
          setTimeout(tick, 200);
        }
        tick();
      }),
    ]).then(function (vals) {
      var wl = vals[0], user = vals[1];
      if (user) return;
      if (isFree(info, wl)) return;
      showLock(info);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
