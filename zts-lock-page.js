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

  function contentContainer() {
    // Le vrai contenu est le .article-body le plus rempli (le 1er est souvent vide).
    var bodies = document.querySelectorAll('.article-body'), best = null, max = -1;
    for (var i = 0; i < bodies.length; i++) {
      var n = bodies[i].children.length;
      if (n > max) { max = n; best = bodies[i]; }
    }
    return best;
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

  function applyHalf(container, info) {
    if (!container || container.getAttribute('data-zts-half') === '1') return;
    var kids = [];
    for (var i = 0; i < container.children.length; i++) {
      var el = container.children[i];
      if (!el.classList.contains('zts-half-cta')) kids.push(el);
    }
    if (kids.length < 4) return;               // article trop court → laissé entier
    var cut = Math.ceil(kids.length / 2);
    for (var j = cut; j < kids.length; j++) kids[j].classList.add('zts-half-hidden');
    container.insertBefore(buildCta(info), kids[cut]);
    container.setAttribute('data-zts-half', '1');
  }

  function revealAll(container) {
    if (!container) return;
    var h = container.querySelectorAll('.zts-half-hidden');
    for (var i = 0; i < h.length; i++) h[i].classList.remove('zts-half-hidden');
    var cta = container.querySelector('.zts-half-cta');
    if (cta) cta.remove();
    container.setAttribute('data-zts-half', '0');
  }

  function initArticleHalf(info) {
    demiApercu(info, contentContainer, applyHalf);
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

    // Articles → demi-aperçu pour tous (plus de plein écran bloquant)
    if (info.kind === 'article') { initArticleHalf(info); return; }

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
