/**
 * ZTS Lock System — Cadenas sur ressources et articles de blog
 *
 * V2 (Sprint Cadenas) : la liste des items libres vient de
 * /locked-whitelist.json (source de verite unique). Les autres items
 * sont visibles (titre + image + extrait) mais le clic ouvre le pop-up
 * cadenas plein ecran qui promet l'acces complet + 90 cours offerts.
 */
(function() {
  'use strict';

  var WHITELIST_URL = '/locked-whitelist.json';
  var CACHE_KEY = 'zts_locked_whitelist_v1';
  var CACHE_TTL = 60 * 60 * 1000; // 1h
  var _locked = false;
  var _whitelist = { freeResources: [], freeArticles: [] };

  // ── CSS ──
  var CSS =
    '.zts-lock-overlay{position:absolute;inset:0;z-index:5;background:rgba(10,22,40,.72);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:inherit;cursor:pointer;transition:background .25s}' +
    '.zts-lock-overlay:hover{background:rgba(10,22,40,.82)}' +
    '.zts-lock-overlay:hover .zts-lock-icon{transform:rotate(-8deg) scale(1.1)}' +
    '.zts-lock-overlay:hover .zts-lock-cta{transform:scale(1.05)}' +
    '.zts-lock-icon{width:56px;height:56px;background:linear-gradient(135deg,#FFD700,#FFA500);border:3px solid #000;border-radius:14px;box-shadow:4px 4px 0 #000;display:flex;align-items:center;justify-content:center;transition:transform .3s cubic-bezier(.34,1.56,.64,1);margin-bottom:10px}' +
    '.zts-lock-icon svg{width:28px;height:28px;stroke:#000;stroke-width:2.5;fill:none;stroke-linecap:round;stroke-linejoin:round}' +
    '.zts-lock-cta{font-family:"Patrick Hand","Luckiest Guy",cursive;font-size:.9rem;color:#fff;background:rgba(0,196,255,.25);border:2px dashed rgba(255,215,0,.8);border-radius:10px;padding:6px 14px;letter-spacing:.5px;text-align:center;transition:transform .25s;text-shadow:1px 1px 0 rgba(0,0,0,.3);max-width:90%;line-height:1.2}' +
    '.zts-lock-cta small{display:block;font-size:.7rem;opacity:.9;margin-top:3px;letter-spacing:0}' +
    '.zts-lock-card{position:relative;overflow:hidden}' +
    '.zts-lock-card>a,.zts-lock-card>div:not(.zts-lock-overlay){pointer-events:none}' +
    '.zts-lock-card .zts-lock-overlay{pointer-events:auto}' +
    '.zts-res-card[data-locked="1"]{pointer-events:none}' +
    '.zts-res-card[data-locked="1"] .zts-lock-overlay{pointer-events:auto}' +
    '@media(max-width:600px){.zts-lock-icon{width:42px;height:42px}.zts-lock-icon svg{width:22px;height:22px}.zts-lock-cta{font-size:.75rem;padding:5px 10px}}';

  var LOCK_SVG = '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  function injectStyles() {
    if (document.getElementById('zts-lock-css')) return;
    var s = document.createElement('style');
    s.id = 'zts-lock-css';
    s.textContent = CSS;
    document.head.appendChild(s);
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
      .then(function(r) { return r.ok ? r.json() : null; })
      .then(function(d) {
        if (d) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
        return d || { freeResources: [], freeArticles: [] };
      })
      .catch(function() { return { freeResources: [], freeArticles: [] }; });
  }

  function makeOverlay(opts) {
    var kind = opts.kind, slug = opts.slug, url = opts.url;
    var div = document.createElement('div');
    div.className = 'zts-lock-overlay';
    div.innerHTML =
      '<div class="zts-lock-icon">' + LOCK_SVG + '</div>' +
      '<div class="zts-lock-cta">Inscris-toi pour débloquer<small>+ 90 cours d\'ÉPS offerts</small></div>';
    div.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_click_signup', { source: kind || 'grid', slug: slug });
      if (window.ztsShowLockedFullscreen) {
        window.ztsShowLockedFullscreen({ source: kind || 'grid', slug: slug, targetUrl: url, closable: true });
        return;
      }
      if (url && window.ztsSetProtected) window.ztsSetProtected(url);
      if (window.ztsShowSignup) window.ztsShowSignup();
    });
    return div;
  }

  // ── Ressources (index.html — #appsGrid) ──
  function lockResources() {
    var grid = document.getElementById('appsGrid');
    if (!grid) return;
    var free = _whitelist.freeResources || [];
    var cards = grid.querySelectorAll('.zts-res-card');
    cards.forEach(function(card) {
      if (card.getAttribute('data-locked') === '1') return;
      var onc = card.getAttribute('onclick') || '';
      var m = onc.match(/ztsOpenApp\(['"]([^'"]+)['"]\)/);
      var url = m ? m[1] : '';
      var slug = '';
      if (url) {
        // 1) /apps/SLUG/  (ex: /apps/planificateur/)
        var ms = url.match(/\/apps\/([^/]+)/);
        if (ms) {
          slug = ms[1];
        } else {
          // 2) SLUG.zonetotalsport.ca  (ex: jeux.zonetotalsport.ca, sae.zonetotalsport.ca)
          ms = url.match(/\/\/([^.]+)\.zonetotalsport\.ca/);
          if (ms && ms[1] !== 'www' && ms[1] !== 'zonetotalsport') {
            slug = ms[1];
          } else {
            slug = url.replace(/\W+/g, '');
          }
        }
      }
      if (slug && free.indexOf(slug) !== -1) return;

      card.setAttribute('data-locked', '1');
      card.style.position = 'relative';
      card.appendChild(makeOverlay({ kind: 'resource', slug: slug, url: url }));
      if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_view', { source: 'resource', slug: slug });
    });
  }

  function unlockResources() {
    var grid = document.getElementById('appsGrid');
    if (!grid) return;
    grid.querySelectorAll('.zts-lock-overlay').forEach(function(o) { o.remove(); });
    grid.querySelectorAll('[data-locked="1"]').forEach(function(c) { c.removeAttribute('data-locked'); });
  }

  // ── Blog (blog.html — #grid) ──
  function lockBlog() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    var free = _whitelist.freeArticles || [];
    var cards = grid.querySelectorAll('article.card');
    cards.forEach(function(card) {
      if (card.querySelector('.zts-lock-overlay')) return;
      var link = card.querySelector('a');
      var href = link ? link.getAttribute('href') : '';
      var slug = '';
      var ms = href.match(/\/articles\/([^/.?#]+)/);
      if (ms) slug = ms[1];
      if (slug && free.indexOf(slug) !== -1) return;

      card.classList.add('zts-lock-card');
      card.appendChild(makeOverlay({ kind: 'article', slug: slug, url: href }));
      if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_view', { source: 'article', slug: slug });
    });
  }

  function unlockBlog() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    grid.querySelectorAll('.zts-lock-overlay').forEach(function(o) { o.remove(); });
    grid.querySelectorAll('.zts-lock-card').forEach(function(c) { c.classList.remove('zts-lock-card'); });
  }

  function applyLocks() {
    _locked = true;
    lockResources();
    lockBlog();
  }

  function removeLocks() {
    _locked = false;
    unlockResources();
    unlockBlog();
  }

  function init() {
    injectStyles();

    document.addEventListener('click', function(e) {
      var card = e.target.closest('.zts-res-card[data-locked="1"]');
      if (card && !e.target.closest('.zts-lock-overlay')) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    loadWhitelist().then(function(wl) {
      _whitelist = wl;
      function waitAndBind() {
        if (window.ztsOnAuth) {
          window.ztsOnAuth(function(user) {
            if (user) removeLocks();
            else applyLocks();
          });
          return;
        }
        setTimeout(waitAndBind, 300);
      }
      waitAndBind();
    });

    function observeBlog() {
      var grid = document.getElementById('grid');
      if (!grid) return;
      var debounce = null;
      new MutationObserver(function() {
        clearTimeout(debounce);
        debounce = setTimeout(function() { if (_locked) lockBlog(); }, 80);
      }).observe(grid, { childList: true });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observeBlog);
    } else {
      observeBlog();
    }
  }

  init();
})();
