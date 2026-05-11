/**
 * ZTS Lock System — Cadenas sur ressources et articles de blog
 * 2 premiers items libres, le reste verrouille jusqu'a connexion Firebase
 */
(function() {
  'use strict';

  var FREE_COUNT = 2;

  // ── CSS ──
  function injectLockStyles() {
    if (document.getElementById('zts-lock-styles')) return;
    var s = document.createElement('style');
    s.id = 'zts-lock-styles';
    s.textContent =
      '.zts-lock-overlay{position:absolute;inset:0;z-index:5;background:rgba(10,22,40,.72);display:flex;flex-direction:column;align-items:center;justify-content:center;border-radius:inherit;cursor:pointer;transition:background .25s}' +
      '.zts-lock-overlay:hover{background:rgba(10,22,40,.82)}' +
      '.zts-lock-overlay:hover .zts-lock-icon{transform:rotate(-8deg) scale(1.1)}' +
      '.zts-lock-overlay:hover .zts-lock-cta{transform:scale(1.05)}' +
      '.zts-lock-icon{width:56px;height:56px;background:linear-gradient(135deg,#FFD700,#FFA500);border:3px solid #000;border-radius:14px;box-shadow:4px 4px 0 #000;display:flex;align-items:center;justify-content:center;transition:transform .3s cubic-bezier(.34,1.56,.64,1);margin-bottom:10px}' +
      '.zts-lock-icon svg{width:28px;height:28px;stroke:#000;stroke-width:2.5;fill:none;stroke-linecap:round;stroke-linejoin:round}' +
      '.zts-lock-cta{font-family:"Luckiest Guy","Bangers",cursive;font-size:.85rem;color:#fff;background:rgba(0,196,255,.25);border:2px dashed rgba(0,196,255,.6);border-radius:10px;padding:6px 14px;letter-spacing:.5px;text-align:center;transition:transform .25s;text-shadow:1px 1px 0 rgba(0,0,0,.3)}' +
      '.zts-lock-card{position:relative;overflow:hidden}' +
      '.zts-lock-card>a,.zts-lock-card>div{pointer-events:none}' +
      '.zts-lock-card .zts-lock-overlay{pointer-events:auto}' +
      '@media(max-width:600px){.zts-lock-icon{width:42px;height:42px}.zts-lock-icon svg{width:22px;height:22px}.zts-lock-cta{font-size:.72rem;padding:5px 10px}}';
    document.head.appendChild(s);
  }

  var LOCK_SVG = '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

  function createOverlay() {
    var div = document.createElement('div');
    div.className = 'zts-lock-overlay';
    div.innerHTML = '<div class="zts-lock-icon">' + LOCK_SVG + '</div><div class="zts-lock-cta">Connecte-toi pour debloquer</div>';
    return div;
  }

  function isLoggedIn() {
    return (window.ztsGetUser && window.ztsGetUser())
        || (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser);
  }

  // ── Ressources popup (index.html #appsGrid) ──
  function lockResources() {
    var grid = document.getElementById('appsGrid');
    if (!grid) return;

    var cards = grid.querySelectorAll('.zts-res-card');
    cards.forEach(function(card, i) {
      if (i < FREE_COUNT) return;
      if (card.querySelector('.zts-lock-overlay')) return;

      card.style.position = 'relative';

      // Sauvegarder et retirer le onclick pour empecher ztsOpenApp
      if (!card._ztsOrigOnclick && card.getAttribute('onclick')) {
        card._ztsOrigOnclick = card.getAttribute('onclick');
        card.removeAttribute('onclick');
        card._ztsLocked = true;
      }

      var overlay = createOverlay();
      overlay.addEventListener('click', function(e) {
        e.stopPropagation();
        e.preventDefault();
        var urlMatch = (card._ztsOrigOnclick || '').match(/ztsOpenApp\(['"]([^'"]+)['"]\)/);
        if (urlMatch && window.ztsSetProtected) window.ztsSetProtected(urlMatch[1]);
        if (window.ztsShowSignup) window.ztsShowSignup();
      });

      card.appendChild(overlay);
    });
  }

  function unlockResources() {
    var grid = document.getElementById('appsGrid');
    if (!grid) return;
    grid.querySelectorAll('.zts-lock-overlay').forEach(function(ov) { ov.remove(); });
    grid.querySelectorAll('.zts-res-card').forEach(function(card) {
      if (card._ztsLocked && card._ztsOrigOnclick) {
        card.setAttribute('onclick', card._ztsOrigOnclick);
        card._ztsLocked = false;
      }
    });
  }

  // ── Blog (blog.html #grid) ──
  function applyBlogLocks() {
    if (isLoggedIn()) return;
    var grid = document.getElementById('grid');
    if (!grid) return;

    var cards = grid.querySelectorAll('article.card');
    // Hero = posts[0] rendu hors grid => 1 libre dans le grid (FREE_COUNT - 1)
    var freeInGrid = Math.max(0, FREE_COUNT - 1);

    cards.forEach(function(card, i) {
      if (card.querySelector('.zts-lock-overlay')) return;
      if (i < freeInGrid) return;

      card.classList.add('zts-lock-card');
      var link = card.querySelector('a');
      var href = link ? link.getAttribute('href') : '';

      var overlay = createOverlay();
      overlay.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (window.ztsSetProtected && href) window.ztsSetProtected(href);
        if (window.ztsShowSignup) window.ztsShowSignup();
      });
      card.appendChild(overlay);
    });
  }

  function unlockBlog() {
    var grid = document.getElementById('grid');
    if (!grid) return;
    grid.querySelectorAll('.zts-lock-overlay').forEach(function(ov) { ov.remove(); });
    grid.querySelectorAll('.zts-lock-card').forEach(function(card) {
      card.classList.remove('zts-lock-card');
    });
  }

  // ── Init ──
  function init() {
    injectLockStyles();

    function applyAll() {
      if (isLoggedIn()) {
        unlockResources();
        unlockBlog();
      } else {
        lockResources();
        applyBlogLocks();
      }
    }

    // Attendre ztsOnAuth (firebase-auth.js se charge en async)
    function waitForAuth() {
      if (window.ztsOnAuth) {
        window.ztsOnAuth(function(user) {
          if (user) { unlockResources(); unlockBlog(); }
          else { lockResources(); applyBlogLocks(); }
        });
      } else {
        setTimeout(waitForAuth, 200);
      }
    }
    waitForAuth();

    // Appliquer au DOM ready
    function onReady() {
      setTimeout(applyAll, 400);

      // Blog : observer le grid pour re-appliquer apres renderCards (filtre/recherche)
      var blogGrid = document.getElementById('grid');
      if (blogGrid) {
        new MutationObserver(function() {
          setTimeout(function() { if (!isLoggedIn()) applyBlogLocks(); }, 60);
        }).observe(blogGrid, { childList: true });
      }

      // Ressources : re-appliquer quand la modal s'ouvre
      var appsModal = document.getElementById('appsModal');
      if (appsModal) {
        new MutationObserver(function(muts) {
          muts.forEach(function(m) {
            if (m.attributeName === 'style' && appsModal.style.display === 'flex') {
              if (!isLoggedIn()) lockResources();
            }
          });
        }).observe(appsModal, { attributes: true, attributeFilter: ['style'] });
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', onReady);
    } else {
      onReady();
    }
  }

  init();
})();
