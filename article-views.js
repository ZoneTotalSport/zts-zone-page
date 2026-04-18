/**
 * ZTS Article View Counter — Firestore live
 * Utilisation:
 *   Sur article individuel: <script src="/article-views.js"></script>
 *                           <script>ztsCountView()</script>
 *   Sur blog.html: <script src="/article-views.js"></script>
 *                  <script>ztsSyncBlogViews()</script>
 */
(function(){
  'use strict';

  // Reutilise la meme config Firebase que firebase-auth.js
  var firebaseConfig = {
    apiKey: 'AIzaSyBoBxVP6g_ObKIJJ1jkviNFQ-wpJoWdjbA',
    authDomain: 'zone-total-sport.firebaseapp.com',
    projectId: 'zone-total-sport'
  };

  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src; s.async = true; s.onload = cb;
    document.head.appendChild(s);
  }

  function ensureFirestore(cb) {
    if (typeof firebase !== 'undefined' && firebase.firestore) return cb();
    if (typeof firebase === 'undefined') {
      loadScript('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js', function(){
        loadScript('https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore-compat.js', function(){
          if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
          cb();
        });
      });
    } else {
      loadScript('https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore-compat.js', function(){
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        cb();
      });
    }
  }

  // Extraire le slug depuis l'URL (nom de fichier sans .html)
  function getSlugFromUrl() {
    var path = window.location.pathname;
    var m = path.match(/\/([^\/]+?)(?:\.html)?$/);
    return m ? m[1] : null;
  }

  // Increment +1 pour l'article courant (ou slug fourni)
  // Anti-spam: 1 vue par article par session (sessionStorage)
  window.ztsCountView = function(slug) {
    slug = slug || getSlugFromUrl();
    if (!slug || slug === 'blog' || slug === 'index') return;

    var sessionKey = 'zts_view_' + slug;
    if (sessionStorage.getItem(sessionKey)) return; // deja compte cette session
    sessionStorage.setItem(sessionKey, '1');

    ensureFirestore(function() {
      var db = firebase.firestore();
      var ref = db.collection('article_views').doc(slug);
      ref.set({
        count: firebase.firestore.FieldValue.increment(1),
        last_view: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).catch(function(e){ console.warn('[ZTS Views]', e); });
    });
  };

  // Sur blog.html: synchronise tous les compteurs affiches avec Firestore
  // Recherche les elements [data-article-slug] ou extrait depuis les liens articles/XXX.html
  window.ztsSyncBlogViews = function() {
    ensureFirestore(function() {
      var db = firebase.firestore();
      db.collection('article_views').get().then(function(snap) {
        var viewsMap = {};
        snap.forEach(function(doc) { viewsMap[doc.id] = doc.data().count || 0; });

        // Strategie 1: elements avec [data-article-slug]
        document.querySelectorAll('[data-article-slug]').forEach(function(el) {
          var slug = el.getAttribute('data-article-slug');
          if (viewsMap[slug] != null) {
            var numEl = el.querySelector('[data-views-count]') || el;
            numEl.textContent = viewsMap[slug];
          }
        });

        // Strategie 2: retrouver slugs via href="articles/XXX.html"
        document.querySelectorAll('a[href*="articles/"]').forEach(function(a) {
          var m = a.getAttribute('href').match(/articles\/([^\/\.]+)\.html/);
          if (!m) return;
          var slug = m[1];
          if (viewsMap[slug] == null) return;
          // Chercher un compteur dans la meme card (parent card)
          var card = a.closest('article, .card, [class*="card"]') || a.parentElement;
          if (!card) return;
          var counter = card.querySelector('[data-views-count]');
          if (counter) counter.textContent = viewsMap[slug];
        });

        // MAJ total
        var total = Object.values(viewsMap).reduce(function(a,b){return a+b;}, 0);
        var totalEl = document.getElementById('totalViews');
        if (totalEl) totalEl.textContent = total.toLocaleString('fr-CA');
      }).catch(function(e){ console.warn('[ZTS Views sync]', e); });
    });
  };

})();
