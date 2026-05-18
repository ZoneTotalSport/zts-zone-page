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
    d.innerHTML = '<div style="max-width:500px"><h1 style="font-size:2rem;margin-bottom:1rem">Cette page est reservee aux membres</h1><p style="margin-bottom:1.5rem">Inscris-toi gratuitement et recois 90 cours d\'EPS cle en main</p><button id="zts-lock-fallback-btn" style="background:#FFD700;border:3px solid #000;border-radius:14px;padding:12px 24px;font-family:inherit;font-size:1.2rem;cursor:pointer;box-shadow:4px 4px 0 #000">S\'inscrire</button></div>';
    document.body.appendChild(d);
    var btn = d.querySelector('#zts-lock-fallback-btn');
    btn.addEventListener('click', function () { if (window.ztsShowSignup) window.ztsShowSignup(); });
  }

  function init() {
    var info = getSlug();
    if (!info) return;

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
