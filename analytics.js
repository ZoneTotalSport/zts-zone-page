/**
 * ZTS Zone — Google Analytics 4 + Events Custom
 * ID: G-C2L5PD388L
 * Events: sign_up, login, app_click, popup_shown, popup_converted, resource_access
 */
(function() {
  'use strict';

  var GA_ID = 'G-C2L5PD388L';

  // ============ CHARGER GA4 ============
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function() { dataLayer.push(arguments); };
  gtag('js', new Date());
  gtag('config', GA_ID, {
    page_title: document.title,
    page_location: window.location.href,
    anonymize_ip: true
  });

  // ============ HELPER GLOBAL ============
  window.ztsTrack = function(event, params) {
    try {
      gtag('event', event, params || {});
      console.log('[ZTS GA]', event, params || {});
    } catch(e) { /* silent */ }
  };

  // ============ AUTO-TRACK: clics sur apps / ressources ============
  document.addEventListener('click', function(e) {
    var target = e.target.closest('[onclick*="ztsOpenApp"], [data-protected="true"], .app-card, .news-btn');
    if (!target) return;
    // Essaie d'extraire l'URL cible
    var url = '';
    var onclickAttr = target.getAttribute('onclick') || '';
    var m = onclickAttr.match(/ztsOpenApp\(['"]([^'"]+)['"]/);
    if (m) url = m[1];
    else if (target.href) url = target.href;
    var name = (target.textContent || '').trim().slice(0, 40);
    window.ztsTrack('app_click', {
      app_url: url,
      app_name: name,
      logged_in: !!(window.ztsGetUser && window.ztsGetUser())
    });
  }, { passive: true });

  // ============ AUTO-TRACK: scroll depth (25/50/75/100) ============
  var scrollMarks = { 25: false, 50: false, 75: false, 100: false };
  window.addEventListener('scroll', function() {
    var pct = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
    [25, 50, 75, 100].forEach(function(m) {
      if (!scrollMarks[m] && pct >= m) {
        scrollMarks[m] = true;
        window.ztsTrack('scroll_depth', { percent: m });
      }
    });
  }, { passive: true });

  // ============ AUTO-TRACK: temps passe (engagement) ============
  var engagement30 = false, engagement60 = false, engagement120 = false;
  setTimeout(function() { if (!engagement30) { engagement30 = true; window.ztsTrack('engagement', { seconds: 30 }); } }, 30000);
  setTimeout(function() { if (!engagement60) { engagement60 = true; window.ztsTrack('engagement', { seconds: 60 }); } }, 60000);
  setTimeout(function() { if (!engagement120) { engagement120 = true; window.ztsTrack('engagement', { seconds: 120 }); } }, 120000);

  // ============ HOOKS PUBLICS (a appeler depuis le code metier) ============
  // Appele par firebase-auth.js sur signup
  window.ztsTrackSignup = function(method, userId) {
    window.ztsTrack('sign_up', { method: method || 'unknown' });
    if (userId) gtag('set', 'user_id', userId);
  };
  // Appele par firebase-auth.js sur login
  window.ztsTrackLogin = function(method, userId) {
    window.ztsTrack('login', { method: method || 'unknown' });
    if (userId) gtag('set', 'user_id', userId);
  };
  // Appele quand une popup d'inscription est montree
  window.ztsTrackPopupShown = function(popupName) {
    window.ztsTrack('popup_shown', { popup_name: popupName || 'unknown' });
  };
  // Appele quand user clique s'inscrire dans une popup
  window.ztsTrackPopupConverted = function(popupName) {
    window.ztsTrack('popup_converted', { popup_name: popupName || 'unknown' });
  };
})();
