/**
 * ZTS Unlock — verrou freemium sur les HUBS métier (cartes #gridActive).
 * Règle : 1re app de #gridActive gratuite, le reste 🔒 tant que non-connecté.
 * Le clic sur une carte verrouillée ouvre l'inscription UNIFIÉE (firebase-auth.js).
 *
 * AUTH UNIFIÉE : ce module ne fait PLUS d'init Firebase ni de modale propre.
 * Il dépend de firebase-auth.js (window.ztsOnAuth / ztsShowSignup) et,
 * optionnellement, de zts-funnel.js (window.ztsTrackFunnel).
 * Charger APRÈS firebase-auth.js. Le blog est géré par zts-lock-page.js.
 *
 * SEO : les liens des cartes restent dans le DOM (overlay CSS) → crawlables.
 */
(function () {
  'use strict';

  var FREE_PER_GRID = 1;     // nb d'apps gratuites par grille #gridActive
  var authed = false;

  var T = {
    fr: { lock: 'Inscris-toi pour débloquer' },
    en: { lock: 'Sign up to unlock' }
  };
  function lang() { return (window.ZTS && ZTS.getLang && ZTS.getLang() === 'en') ? 'en' : 'fr'; }
  function t() { return T[lang()]; }
  function hubSlug() { var m = location.pathname.match(/\/([^\/]+)\.html$/); return m ? m[1] : 'home'; }

  /* ---------- STYLES (overlay cadenas uniquement) ---------- */
  function injectStyles() {
    if (document.getElementById('zts-unlock-css')) return;
    var s = document.createElement('style');
    s.id = 'zts-unlock-css';
    s.textContent = [
      '.zts-app-card.zts-locked>*:not(.zts-lock-overlay){filter:saturate(.5) brightness(.9);}',
      '.zts-lock-overlay{position:absolute!important;inset:0!important;z-index:5;border-radius:inherit;',
      'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;',
      'pointer-events:none;text-align:center;padding:10px;box-sizing:border-box;',
      'background:linear-gradient(160deg,rgba(26,26,46,.30),rgba(26,26,46,.62));}',
      '.zts-lock-overlay .ico{font-size:42px;line-height:1;filter:drop-shadow(2px 2px 0 rgba(0,0,0,.6));}',
      '.zts-lock-overlay .lab{font-family:var(--font-impact,system-ui);font-size:13px;color:#fff;line-height:1.1;',
      'background:var(--rose,#FF2D87);border:2px solid var(--zts-noir,#1a1a1a);border-radius:999px;',
      'padding:5px 13px;box-shadow:2px 2px 0 var(--zts-noir,#1a1a1a);}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---------- VERROUS CARTES ---------- */
  function lockCard(card) {
    if (card.classList.contains('zts-locked')) return;
    card.classList.add('zts-locked');
    if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
    var ov = document.createElement('span');
    ov.className = 'zts-lock-overlay';
    ov.innerHTML = '<span class="ico">🔒</span><span class="lab">' + t().lock + '</span>';
    card.appendChild(ov);
  }
  function unlockCard(card) {
    if (!card.classList.contains('zts-locked')) return;
    card.classList.remove('zts-locked');
    var ov = card.querySelector('.zts-lock-overlay');
    if (ov) ov.remove();
  }
  function refreshLabels() {
    document.querySelectorAll('.zts-lock-overlay .lab').forEach(function (l) { l.textContent = t().lock; });
  }
  function applyAppLocks() {
    document.querySelectorAll('#gridActive').forEach(function (grid) {
      var cards = grid.querySelectorAll('.zts-app-card:not(.is-soon)');
      cards.forEach(function (card, i) {
        if (authed || i < FREE_PER_GRID) unlockCard(card);
        else lockCard(card);
      });
    });
  }

  var observer = null, applying = false;
  function observeGrid() {
    if (!observer) return;
    var host = document.getElementById('gridActive');
    if (host) observer.observe(host, { childList: true });
  }
  function applyAll() {
    if (applying) return;
    applying = true;
    if (observer) observer.disconnect();
    try { applyAppLocks(); refreshLabels(); }
    finally { observeGrid(); applying = false; }
  }

  /* ---------- BOOT ---------- */
  function boot() {
    injectStyles();

    // Clic sur une carte verrouillée → inscription unifiée
    document.addEventListener('click', function (e) {
      var c = e.target.closest && e.target.closest('.zts-app-card.zts-locked');
      if (!c) return;
      e.preventDefault(); e.stopPropagation();
      if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_click_signup', { source: 'hub', slug: hubSlug() });
      if (window.ztsShowSignup) window.ztsShowSignup();
    }, true);

    applyAll();                 // anon par défaut (verrous visibles tout de suite)
    observer = new MutationObserver(function () { applyAll(); });
    observeGrid();
    document.addEventListener('zts:langchange', applyAll);
    document.addEventListener('zts:ready', applyAll);

    // Auth UNIFIÉE : abonnement à firebase-auth.js
    var tracked = false;
    (function tick() {
      if (window.ztsOnAuth) {
        window.ztsOnAuth(function (user) {
          authed = !!user;
          document.body.classList.toggle('zts-authed', authed);
          applyAll();
          if (!authed && !tracked && window.ztsTrackFunnel && document.querySelector('#gridActive .zts-app-card.zts-locked')) {
            tracked = true; window.ztsTrackFunnel('locked_view', { source: 'hub', slug: hubSlug() });
          }
        });
        return;
      }
      setTimeout(tick, 200);
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ZTS_UNLOCK = { refresh: applyAll };
})();
