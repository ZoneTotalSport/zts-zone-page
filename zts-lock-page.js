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
    d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:linear-gradient(135deg,#1e3a8a,#6d28d9);display:flex;align-items:center;justify-content:center;padding:20px;font-family:"Patrick Hand",cursive;color:#fff;text-align:center';
    d.innerHTML = '<div style="max-width:500px"><h1 style="font-size:2rem;margin-bottom:1rem">Cette page est réservée aux membres</h1><p style="margin-bottom:1.5rem">Inscris-toi gratuitement et reçois 90 cours d\'ÉPS clé en main</p><button id="zts-lock-fallback-btn" style="background:#FFD700;border:3px solid #000;border-radius:14px;padding:12px 24px;font-family:inherit;font-size:1.2rem;cursor:pointer;box-shadow:4px 4px 0 #000">S\'inscrire</button></div>';
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
      '.zts-half-cta h3{font-family:"Luckiest Guy",cursive;font-size:clamp(22px,4vw,30px);color:#0F0F2E;margin:0 0 8px;line-height:1.1;}' +
      '.zts-half-cta p{font-family:"Comic Neue","Patrick Hand",cursive;font-size:1.15rem;color:#0F0F2E;opacity:.85;margin:0 auto 18px;max-width:46ch;}' +
      '.zts-half-cta__btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}' +
      '.zts-half-cta button{cursor:pointer;font-family:"Luckiest Guy",cursive;font-size:1.1rem;padding:13px 26px;' +
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

  function buildCta(info) {
    var d = document.createElement('div');
    d.className = 'zts-half-cta';
    d.innerHTML =
      '<h3>🔒 La suite est réservée aux membres</h3>' +
      '<p>Crée ton compte gratuit pour lire l’article au complet — et débloquer les 20+ outils. 100 % gratuit, pour toujours.</p>' +
      '<div class="zts-half-cta__btns">' +
      '<button class="b1" data-act="signup">🔓 Lire la suite gratuitement</button>' +
      '<button class="b2" data-act="login">Déjà membre? Se connecter</button>' +
      '</div>';
    d.querySelector('[data-act=signup]').addEventListener('click', function () {
      if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_click_signup', { source: 'article', slug: info.slug });
      if (window.ztsShowSignup) window.ztsShowSignup();
    });
    d.querySelector('[data-act=login]').addEventListener('click', function () {
      if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_click_login', { source: 'article', slug: info.slug });
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
    injectHalfCss();
    var c = contentContainer();
    if (!c) return;
    applyHalf(c, info);                          // optimiste : coupe tout de suite (pas de flash pour anonymes)
    var tracked = false;
    (function tick() {
      if (window.ztsOnAuth) {
        window.ztsOnAuth(function (user) {
          if (user) { revealAll(c); }
          else {
            applyHalf(c, info);
            if (!tracked && window.ztsTrackFunnel) { tracked = true; window.ztsTrackFunnel('locked_view', { source: 'article', slug: info.slug }); }
          }
        });
        return;
      }
      setTimeout(tick, 200);
    })();
  }

  function init() {
    var info = getSlug();
    if (!info) return;

    // Articles → demi-aperçu pour tous (plus de plein écran bloquant)
    if (info.kind === 'article') { initArticleHalf(info); return; }

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
