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

    // GA4 piggyback si gtag dispo — forwarde tous les params fournis (a plat)
    try {
      if (typeof window.gtag === 'function') {
        var ga = { source: extra.source || 'unknown' };
        for (var k in extra) {
          if (Object.prototype.hasOwnProperty.call(extra, k) && extra[k] != null) {
            ga[k] = extra[k];
          }
        }
        window.gtag('event', event, ga);
      }
    } catch (e) {}
  };

  // signup_complete n'est PAS auto-declenche ici : un null->user couvre aussi
  // les logins. firebase-auth.js le fire explicitement, uniquement sur une
  // creation reelle de compte (garde isNewUser).

  // ── signup_complete differe : consomme le flag pose par firebase-auth.js ──
  // firebase-auth.js pose un flag sessionStorage SYNCHRONE juste avant de
  // rediriger vers /bienvenue.html. L'ancien appel direct etait tue par cette
  // navigation (l'ecriture Firestore async n'avait pas le temps de partir).
  // Ici, a l'arrivee sur la page de destination, aucune navigation ne suit :
  // l'ecriture peut se terminer tranquillement.
  (function consumePendingSignup() {
    var raw;
    try { raw = sessionStorage.getItem('zts_signup_pending'); } catch (e) { return; }
    if (!raw) return;
    // Consomme le flag immediatement (une seule tentative, evite les doublons
    // si plusieurs onglets/pages chargent le script).
    try { sessionStorage.removeItem('zts_signup_pending'); } catch (e) {}

    var data;
    try { data = JSON.parse(raw); } catch (e) { return; }
    if (!data || !data.ts) return;
    // Garde-fou : ignore un flag plus vieux que 10 min (onglet laisse ouvert,
    // navigation manuelle tardive, etc.).
    if (Date.now() - data.ts > 10 * 60 * 1000) return;

    // GA4 tout de suite (sendBeacon survit meme a une navigation).
    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'signup_complete', {
          source: 'auth',
          method: data.method || 'unknown',
          signup_source: data.signup_source || 'direct',
        });
      }
    } catch (e) {}

    // Ecriture Firestore (meme format que locked_view + method/signup_source).
    // Pas de navigation sur cette page -> l'ecriture async se termine.
    waitFb().then(function () {
      try {
        var db = firebase.firestore();
        return db.collection('conversionFunnel').add({
          event: 'signup_complete',
          source: 'auth',
          slug: null,
          layer: null,
          provider: null,
          method: data.method ? String(data.method) : null,
          signup_source: data.signup_source ? String(data.signup_source) : 'direct',
          uid: uid(),
          path: window.location.pathname,
          timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
      } catch (e) { /* swallow */ }
    });
  })();
})();
