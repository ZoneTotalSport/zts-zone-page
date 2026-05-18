/**
 * ZTS Anon Fingerprint — Tracking anonyme des essais generateur via Firestore
 *
 * Fingerprint stable : SHA-256(userAgent + screen + timezone + lang).
 * Cache localStorage. Compteur dans Firestore collection `anonGenCount`.
 *
 * API :
 *   await window.ztsAnonGetCount()    -> number
 *   await window.ztsAnonIncrement()   -> { count, blocked }
 *   await window.ztsAnonCheckBlocked() -> bool   (count >= LIMIT)
 *
 * Depend de firebase-auth.js (charge le SDK Firebase compat avec
 * firestore-compat NON inclus par defaut — on l'ajoute ici).
 */
(function () {
  'use strict';

  var LIMIT = 2;
  var FP_KEY = 'zts_anon_fp_v1';
  var COUNT_CACHE_KEY = 'zts_anon_count_v1';
  var FIRESTORE_CDN = 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore-compat.js';

  function sha256(str) {
    var enc = new TextEncoder().encode(str);
    return crypto.subtle.digest('SHA-256', enc).then(function (buf) {
      var arr = new Uint8Array(buf);
      var hex = '';
      for (var i = 0; i < arr.length; i++) hex += ('00' + arr[i].toString(16)).slice(-2);
      return hex;
    });
  }

  function getFingerprint() {
    try {
      var cached = localStorage.getItem(FP_KEY);
      if (cached && /^[a-f0-9]{64}$/.test(cached)) return Promise.resolve(cached);
    } catch (e) {}
    var parts = [
      navigator.userAgent || '',
      navigator.language || '',
      String(screen.width) + 'x' + String(screen.height),
      String(screen.colorDepth || 24),
      (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'UTC',
      String(navigator.hardwareConcurrency || 0),
    ];
    return sha256(parts.join('|')).then(function (h) {
      try { localStorage.setItem(FP_KEY, h); } catch (e) {}
      return h;
    });
  }

  function loadFirestoreSdk() {
    if (typeof firebase !== 'undefined' && firebase.firestore) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = FIRESTORE_CDN;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function waitFirebase() {
    return new Promise(function (resolve) {
      (function tick() {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
          loadFirestoreSdk().then(resolve, resolve);
          return;
        }
        setTimeout(tick, 200);
      })();
    });
  }

  function getDb() {
    return waitFirebase().then(function () {
      if (!firebase.firestore) throw new Error('firestore-not-loaded');
      return firebase.firestore();
    });
  }

  function getCount() {
    return Promise.all([getFingerprint(), getDb()]).then(function (vals) {
      var fp = vals[0], db = vals[1];
      return db.collection('anonGenCount').doc(fp).get().then(function (snap) {
        if (!snap.exists) return 0;
        var d = snap.data() || {};
        var c = typeof d.count === 'number' ? d.count : 0;
        try { localStorage.setItem(COUNT_CACHE_KEY, String(c)); } catch (e) {}
        return c;
      });
    }).catch(function () {
      // Fallback localStorage si Firestore indisponible
      try { return parseInt(localStorage.getItem(COUNT_CACHE_KEY) || '0', 10); } catch (e) { return 0; }
    });
  }

  function increment() {
    return Promise.all([getFingerprint(), getDb()]).then(function (vals) {
      var fp = vals[0], db = vals[1];
      var ref = db.collection('anonGenCount').doc(fp);
      return db.runTransaction(function (tx) {
        return tx.get(ref).then(function (snap) {
          var now = firebase.firestore.FieldValue.serverTimestamp();
          if (!snap.exists) {
            tx.set(ref, { count: 1, fingerprint: fp, firstSeen: now, lastSeen: now });
            return 1;
          }
          var cur = (snap.data() && typeof snap.data().count === 'number') ? snap.data().count : 0;
          var next = Math.min(999, cur + 1);
          tx.update(ref, { count: next, lastSeen: now });
          return next;
        });
      }).then(function (next) {
        try { localStorage.setItem(COUNT_CACHE_KEY, String(next)); } catch (e) {}
        return { count: next, blocked: next > LIMIT };
      });
    }).catch(function () {
      // Fallback : incremente localStorage seulement
      var cur = 0;
      try { cur = parseInt(localStorage.getItem(COUNT_CACHE_KEY) || '0', 10); } catch (e) {}
      var next = cur + 1;
      try { localStorage.setItem(COUNT_CACHE_KEY, String(next)); } catch (e) {}
      return { count: next, blocked: next > LIMIT };
    });
  }

  function checkBlocked() {
    return getCount().then(function (c) { return c >= LIMIT; });
  }

  window.ztsAnonGetCount = getCount;
  window.ztsAnonIncrement = increment;
  window.ztsAnonCheckBlocked = checkBlocked;
  window.ztsAnonLimit = LIMIT;
})();
