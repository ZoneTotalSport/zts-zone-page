/**
 * ZTS Funnel — Tracking conversion (locked → signup)
 *
 * API : window.ztsTrackFunnel(event, extra)
 *   event : 'locked_view' | 'locked_click_signup' | 'locked_click_login' | 'signup_complete'
 *
 * Ecrit dans Firestore collection conversionFunnel (append-only).
 * Throttle in-memory pour eviter doublons (memes event+source dans 10s).
 */
(function () {
  'use strict';

  var FIRESTORE_CDN = 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore-compat.js';
  var _lastFired = {};
  var THROTTLE_MS = 10000;

  function loadFirestoreSdk() {
    if (typeof firebase !== 'undefined' && firebase.firestore) return Promise.resolve();
    return new Promise(function (resolve) {
      var s = document.createElement('script');
      s.src = FIRESTORE_CDN;
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }

  function waitFb() {
    return new Promise(function (resolve) {
      (function tick() {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
          loadFirestoreSdk().then(resolve);
          return;
        }
        setTimeout(tick, 200);
      })();
    });
  }

  function uid() {
    try {
      return (firebase.auth && firebase.auth().currentUser && firebase.auth().currentUser.uid) || null;
    } catch (e) { return null; }
  }

  window.ztsTrackFunnel = function (event, extra) {
    if (!event) return;
    extra = extra || {};
    var key = event + '|' + (extra.source || '') + '|' + (extra.slug || '');
    var now = Date.now();
    if (_lastFired[key] && (now - _lastFired[key]) < THROTTLE_MS) return;
    _lastFired[key] = now;

    waitFb().then(function () {
      try {
        var db = firebase.firestore();
        db.collection('conversionFunnel').add({
          event: String(event),
          source: String(extra.source || 'unknown'),
          slug: extra.slug ? String(extra.slug) : null,
          layer: extra.layer ? String(extra.layer) : null,
          provider: extra.provider ? String(extra.provider) : null,
          uid: uid(),
          path: window.location.pathname,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) { /* swallow */ }
    });

    // GA4 piggyback si gtag dispo
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', event, {
          source: extra.source || 'unknown',
          slug: extra.slug || null,
        });
      }
    } catch (e) {}
  };

  // Auto-hook signup_complete via ztsOnAuth
  (function () {
    var fired = false;
    var seen = false;
    function tick() {
      if (window.ztsOnAuth) {
        window.ztsOnAuth(function (user) {
          if (!user) { seen = false; fired = false; return; }
          // Premier appel : on enregistre l'etat connecte mais pas un evenement signup.
          // Si on passe de null -> user dans la meme session, on fire signup_complete.
          if (!seen) { seen = true; return; }
          if (fired) return;
          fired = true;
          window.ztsTrackFunnel('signup_complete', { source: 'auth' });
        });
        return;
      }
      setTimeout(tick, 300);
    }
    tick();
  })();
})();
