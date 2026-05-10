/**
 * ZTS Cookie Consent — RGPD / Loi 25 / Google Consent Mode v2
 * Self-contained: injecte banniere + CSS + logique consent
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'zts-cookie-consent';
  var EXPIRY_MS = 365 * 24 * 60 * 60 * 1000; // 12 mois

  // ============ TRADUCTIONS ============
  var texts = {
    fr: {
      title: '\u{1F36A} Cookies',
      body: 'Nous utilisons des cookies pour mesurer la fr\u00e9quentation et permettre l\u2019inscription. Tu peux accepter ou refuser.',
      accept: 'Tout accepter',
      decline: 'Refuser',
      privacy: 'Politique de confidentialit\u00e9'
    },
    en: {
      title: '\u{1F36A} Cookies',
      body: 'We use cookies to measure traffic and enable sign-up. You can accept or decline.',
      accept: 'Accept all',
      decline: 'Decline',
      privacy: 'Privacy policy'
    },
    zh: {
      title: '\u{1F36A} Cookie',
      body: '\u6211\u4EEC\u4F7F\u7528 Cookie \u6765\u8861\u91CF\u8BBF\u95EE\u91CF\u5E76\u652F\u6301\u6CE8\u518C\u3002\u60A8\u53EF\u4EE5\u63A5\u53D7\u6216\u62D2\u7EDD\u3002',
      accept: '\u5168\u90E8\u63A5\u53D7',
      decline: '\u62D2\u7EDD',
      privacy: '\u9690\u79C1\u653F\u7B56'
    }
  };

  // ============ DETECTER LANGUE ============
  function getLang() {
    // Respecter le choix du site (localStorage ou window.currentLang)
    var lang = window.currentLang || localStorage.getItem('zts-lang') || 'fr';
    if (texts[lang]) return lang;
    return 'fr';
  }

  // ============ VERIFIER CONSENTEMENT EXISTANT ============
  function getStoredConsent() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (data && data.ts && (Date.now() - data.ts) < EXPIRY_MS) return data;
      // Expire -> supprimer
      localStorage.removeItem(STORAGE_KEY);
      return null;
    } catch(e) { return null; }
  }

  // ============ MICROSOFT CLARITY (conditionnel) ============
  var CLARITY_ID = 'we8zk6ghu0';
  var clarityLoaded = false;

  function loadClarity() {
    if (clarityLoaded) return;
    clarityLoaded = true;
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }

  // ============ APPLIQUER CONSENT MODE ============
  function applyConsent(status) {
    if (typeof gtag !== 'function') return;
    if (status === 'granted') {
      gtag('consent', 'update', {
        'ad_storage': 'granted',
        'ad_user_data': 'granted',
        'ad_personalization': 'granted',
        'analytics_storage': 'granted'
      });
      // Charger Clarity seulement si consent granted
      loadClarity();
    }
    // Si denied, on ne fait rien — le default est deja denied dans analytics.js, Clarity non charge
  }

  // ============ ACTIONS UTILISATEUR ============
  function acceptAll() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ status: 'granted', ts: Date.now() }));
    applyConsent('granted');
    hideBanner();
    trackConsent('cookie_consent_granted');
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ status: 'denied', ts: Date.now() }));
    hideBanner();
    trackConsent('cookie_consent_denied');
  }

  function trackConsent(eventName) {
    if (window.ztsTrack) {
      window.ztsTrack(eventName, {});
    } else if (typeof gtag === 'function') {
      gtag('event', eventName, {});
    }
  }

  // ============ BANNIERE DOM ============
  function hideBanner() {
    var el = document.getElementById('ztsCookieBanner');
    if (el) {
      el.style.transform = 'translateY(100%)';
      setTimeout(function() { el.remove(); }, 400);
    }
  }

  function showBanner() {
    var lang = getLang();
    var t = texts[lang];

    // CSS inline
    var css = document.createElement('style');
    css.textContent = [
      '#ztsCookieBanner{position:fixed;bottom:0;left:0;right:0;z-index:99990;',
      'background:#1a1a2e;border-top:3px solid #00E5FF;padding:16px 20px;',
      'font-family:Inter,system-ui,sans-serif;color:#fff;',
      'display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;',
      'box-shadow:0 -4px 20px rgba(0,0,0,0.3);transform:translateY(100%);',
      'transition:transform .4s cubic-bezier(.4,0,.2,1)}',
      '#ztsCookieBanner.show{transform:translateY(0)}',
      '#ztsCookieBanner .cb-text{flex:1;min-width:240px;font-size:0.9rem;line-height:1.4}',
      '#ztsCookieBanner .cb-title{font-weight:700;font-size:1rem;margin-bottom:2px}',
      '#ztsCookieBanner .cb-actions{display:flex;gap:10px;align-items:center;flex-wrap:wrap}',
      '#ztsCookieBanner .cb-btn{border:none;border-radius:10px;padding:10px 20px;',
      'font-size:0.9rem;font-weight:700;cursor:pointer;transition:transform .15s,box-shadow .15s}',
      '#ztsCookieBanner .cb-btn:hover{transform:scale(1.04)}',
      '#ztsCookieBanner .cb-btn:focus{outline:3px solid #00E5FF;outline-offset:2px}',
      '#ztsCookieBanner .cb-accept{background:#00E5FF;color:#1a1a2e;box-shadow:0 4px 12px rgba(0,229,255,0.3)}',
      '#ztsCookieBanner .cb-decline{background:#444;color:#ccc}',
      '#ztsCookieBanner .cb-link{color:#00E5FF;text-decoration:underline;font-size:0.8rem;opacity:0.8}',
      '#ztsCookieBanner .cb-link:hover{opacity:1}',
      '@media(max-width:600px){#ztsCookieBanner{flex-direction:column;text-align:center;padding:14px 16px}',
      '#ztsCookieBanner .cb-actions{justify-content:center}}'
    ].join('');
    document.head.appendChild(css);

    // HTML
    var banner = document.createElement('div');
    banner.id = 'ztsCookieBanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', t.title);
    banner.innerHTML = [
      '<div class="cb-text">',
      '  <div class="cb-title">' + t.title + '</div>',
      '  <div>' + t.body + '</div>',
      '</div>',
      '<div class="cb-actions">',
      '  <button class="cb-btn cb-accept" id="ztsCbAccept">' + t.accept + '</button>',
      '  <button class="cb-btn cb-decline" id="ztsCbDecline">' + t.decline + '</button>',
      '  <a class="cb-link" href="/politique.html">' + t.privacy + '</a>',
      '</div>'
    ].join('');

    document.body.appendChild(banner);

    // Animer l'entree
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { banner.classList.add('show'); });
    });

    // Event listeners
    document.getElementById('ztsCbAccept').addEventListener('click', acceptAll);
    document.getElementById('ztsCbDecline').addEventListener('click', decline);

    // Clavier: Escape = decline
    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape' && document.getElementById('ztsCookieBanner')) {
        decline();
        document.removeEventListener('keydown', onKey);
      }
    });

    // Track banner shown
    trackConsent('cookie_banner_shown');
  }

  // ============ REACTUALISER SI LANGUE CHANGE ============
  // Ecouter les changements de langue du site
  var _origSetLang = window.setLang;
  if (typeof _origSetLang === 'function') {
    window.setLang = function(lang) {
      _origSetLang.call(this, lang);
      // Mettre a jour texte banniere si visible
      var banner = document.getElementById('ztsCookieBanner');
      if (banner && texts[lang]) {
        var t = texts[lang];
        banner.querySelector('.cb-title').textContent = t.title;
        banner.querySelector('.cb-text > div:last-child').textContent = t.body;
        document.getElementById('ztsCbAccept').textContent = t.accept;
        document.getElementById('ztsCbDecline').textContent = t.decline;
        banner.querySelector('.cb-link').textContent = t.privacy;
      }
    };
  }

  // ============ INIT ============
  function init() {
    var consent = getStoredConsent();
    if (consent) {
      // Consentement valide — appliquer silencieusement
      applyConsent(consent.status);
    } else {
      // Pas de consentement ou expire — afficher banniere
      showBanner();
    }
  }

  // Attendre le DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Export pour tests
  window.ztsCookieConsent = { acceptAll: acceptAll, decline: decline, getStoredConsent: getStoredConsent };
})();
