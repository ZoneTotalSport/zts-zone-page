/**
 * ZTS Lock System — Cadenas sur ressources et articles de blog
 * 2 premiers items libres, le reste verrouille jusqu'a connexion Firebase
 */
(function() {
  'use strict';

  var FREE_COUNT = 2;
  var _locked = false;

  // ── CSS ──
  var CSS =
    '.zts-lock-overlay{position:absolute;inset:0;z-index:5;background:rgba(10,22,40,.72);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:inherit;cursor:pointer;transition:background .25s}' +
    '.zts-lock-overlay:hover{background:rgba(10,22,40,.82)}' +
    '.zts-lock-overlay:hover .zts-lock-icon{transform:rotate(-8deg) scale(1.1)}' +
    '.zts-lock-overlay:hover .zts-lock-cta{transform:scale(1.05)}' +
    '.zts-lock-icon{width:56px;height:56px;background:linear-gradient(135deg,#FFD700,#FFA500);border:3px solid #000;border-radius:14px;box-shadow:4px 4px 0 #000;display:flex;align-items:center;justify-content:center;transition:transform .3s cubic-bezier(.34,1.56,.64,1);margin-bottom:10px}' +
    '.zts-lock-icon svg{width:28px;height:28px;stroke:#000;stroke-width:2.5;fill:none;stroke-linecap:round;stroke-linejoin:round}' +
    '.zts-lock-cta{font-family:"Luckiest Guy","Bangers",cursive;font-size:.85rem;color:#fff;background:rgba(0,196,255,.25);border:2px dashed rgba(0,196,255,.6);border-radius:10px;padding:6px 14px;letter-spacing:.5px;text-align:center;transition:transform .25s;text-shadow:1px 1px 0 rgba(0,0,0,.3)}' +
    '.zts-lock-card{position:relative;overflow:hidden}' +
    '.zts-lock-card>a,.zts-lock-card>div:not(.zts-lock-overlay){pointer-events:none}' +
    '.zts-lock-card .zts-lock-overlay{pointer-events:auto}' +
    '.zts-res-card[data-locked="1"]{pointer-events:none}' +
    '.zts-res-card[data-locked="1"] .zts-lock-overlay{pointer-events:auto}' +
    '@media(max-width:600px){.zts-lock-icon{width:42px;height:42px}.zts-lock-icon svg{width:22px;height:22px}.zts-lock-cta{font-size:.72rem;padding:5px 10px}}';

  var LOCK_SVG = '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  function injectStyles() {
    if (document.getElementById('zts-lock-css')) return;
    var s = document.createElement('style');
    s.id = 'zts-lock-css';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function makeOverlay(targetUrl) {
    var div = document.createElement('div');
    div.className = 'zts-lock-overlay';
    div.innerHTML = '<div class="zts-lock-icon">' + LOCK_SVG + '</div><div class="zts-lock-cta">Connecte-toi pour debloquer</div>';
    div.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      if (targetUrl && window.ztsSetProtected) window.ztsSetProtected(targetUrl);
      if (window.ztsShowSignup) window.ztsShowSignup();
    });
    return div;
  }

  // ── Ressources (index.html — #appsGrid) ──
  function lockResources() {
    var grid = document.getElementById('appsGrid');
    if (!grid) return;
    var cards = grid.querySelectorAll('.zts-res-card');
    cards.forEach(function(card, i) {
      if (i < FREE_COUNT) return;
      if (card.getAttribute('data-locked') === '1') return;

      // Extraire URL du onclick
      var onc = card.getAttribute('onclick') || '';
      var m = onc.match(/ztsOpenApp\(['"]([^'"]+)['"]\)/);
      var url = m ? m[1] : '';

      // Bloquer le onclick natif via CSS pointer-events + data attr
      card.setAttribute('data-locked', '1');
      card.style.position = 'relative';
      card.appendChild(makeOverlay(url));
    });
  }

  function unlockResources() {
    var grid = document.getElementById('appsGrid');
    if (!grid) return;
    grid.querySelectorAll('.zts-lock-overlay').forEach(function(o) { o.remove(); });
    grid.querySelectorAll('[data-locked="1"]').forEach(function(c) {
      c.removeAttribute('data-locked');
    });
  }

  // ── Blog (blog.html — #grid) ──
  function lockBlog() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    var cards = grid.querySelectorAll('article.card');
    // Hero (posts[0]) est hors du grid, donc 1 libre dans le grid
    var freeInGrid = Math.max(0, FREE_COUNT - 1);
    cards.forEach(function(card, i) {
      if (i < freeInGrid) return;
      if (card.querySelector('.zts-lock-overlay')) return;

      var link = card.querySelector('a');
      var href = link ? link.getAttribute('href') : '';
      card.classList.add('zts-lock-card');
      card.appendChild(makeOverlay(href));
    });
  }

  function unlockBlog() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    grid.querySelectorAll('.zts-lock-overlay').forEach(function(o) { o.remove(); });
    grid.querySelectorAll('.zts-lock-card').forEach(function(c) { c.classList.remove('zts-lock-card'); });
  }

  // ── Orchestration ──
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

    // Intercepter clics sur cartes verrouillees (delegation au lieu de retirer onclick)
    document.addEventListener('click', function(e) {
      var card = e.target.closest('.zts-res-card[data-locked="1"]');
      if (card && !e.target.closest('.zts-lock-overlay')) {
        e.stopPropagation();
        e.preventDefault();
      }
    }, true);

    // Attendre firebase-auth.js → ztsOnAuth
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

    // Blog : re-appliquer apres renderCards (filtre/recherche) via observer
    function observeBlog() {
      var grid = document.getElementById('grid');
      if (!grid) return;
      var debounce = null;
      new MutationObserver(function() {
        clearTimeout(debounce);
        debounce = setTimeout(function() {
          if (_locked) lockBlog();
        }, 80);
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
