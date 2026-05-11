/**
 * ZTS Lang Utility — Switcher + Auto-detection partages
 *
 * Pour les pages racine (blog, avis, repertoire, politique, promo, etc.) qui
 * ont leur propre HTML standalone et leur propre dict de traductions.
 *
 * Usage dans une page :
 *   1. Inclure ce script : <script src="/zts-lang.js" defer></script>
 *   2. Definir window.ztsPageDict = { fr: {...}, en: {...}, zh: {...}, es: {...} }
 *      OU appliquer ses propres traductions via window.addEventListener('zts-lang-change', e => { ... })
 *   3. Ajouter le switcher : <div id="zts-lang-switcher"></div>
 *   4. Marquer les elements traduisibles : <span data-i18n="key">Texte FR</span>
 *
 * Le script :
 *   - Lit ?lang= URL param (priorite haute, pour deep-links)
 *   - Sinon lit localStorage.zts-lang
 *   - Sinon detecte navigator.language au premier visit
 *   - Synchronise <html lang>, og:locale, switcher actif
 *   - Emet l'event 'zts-lang-change' pour custom hooks
 */
(function() {
  'use strict';

  var SUPPORTED = ['fr', 'en', 'zh', 'es'];
  var DEFAULT = 'fr';
  var STORAGE_KEY = 'zts-lang';

  // Mapping des codes pour <html lang>
  var LANG_ATTR = { fr: 'fr-CA', en: 'en', zh: 'zh-CN', es: 'es' };
  var OG_LOCALE = { fr: 'fr_CA', en: 'en_US', zh: 'zh_CN', es: 'es_ES' };

  // Labels du switcher
  var SWITCHER_LABELS = {
    fr: { code: 'FR', title: 'Français' },
    en: { code: 'EN', title: 'English' },
    zh: { code: '中', title: '中文' },
    es: { code: 'ES', title: 'Español' }
  };

  // ============ DETECTION DE LA LANGUE INITIALE ============
  function detectInitialLang() {
    try {
      // 1. URL ?lang= (priorite haute)
      var urlLang = new URLSearchParams(window.location.search).get('lang');
      if (urlLang && SUPPORTED.includes(urlLang)) return urlLang;

      // 2. localStorage (choix utilisateur memorise)
      var stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.includes(stored)) return stored;

      // 3. Navigator
      var nav = (navigator.language || navigator.userLanguage || DEFAULT).slice(0, 2).toLowerCase();
      if (SUPPORTED.includes(nav)) return nav;
    } catch(e) { /* fail silent */ }
    return DEFAULT;
  }

  // ============ APPLIQUER LA LANGUE ============
  function applyLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT;

    window.ztsCurrentLang = lang;
    window.currentLang = lang; // compatibilite avec scripts existants

    try { localStorage.setItem(STORAGE_KEY, lang); } catch(e) {}

    // <html lang>
    document.documentElement.lang = LANG_ATTR[lang] || LANG_ATTR.fr;

    // og:locale
    var og = document.querySelector('meta[property="og:locale"]');
    if (og) og.setAttribute('content', OG_LOCALE[lang] || OG_LOCALE.fr);

    // Appliquer le dict de la page si fourni
    var dict = window.ztsPageDict;
    if (dict && dict[lang]) {
      var t = dict[lang];
      document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.getAttribute('data-i18n');
        // Si l'attribut data-i18n n'a pas de valeur, ne pas toucher (utilise <span lang> ou enfants)
        if (!key) return;
        if (t[key] !== undefined) el.innerHTML = t[key];
      });
      // Attribut alt/title/placeholder via data-i18n-attr="alt:keyAlt;title:keyTitle"
      document.querySelectorAll('[data-i18n-attr]').forEach(function(el) {
        var spec = el.getAttribute('data-i18n-attr') || '';
        spec.split(';').forEach(function(pair) {
          var parts = pair.split(':');
          if (parts.length === 2 && t[parts[1]] !== undefined) {
            el.setAttribute(parts[0].trim(), t[parts[1]]);
          }
        });
      });
    }

    // ====== Pattern <span lang="X"> inline (utilise dans les articles) ======
    // Affiche le <span lang> correspondant a la langue active, cache les autres
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      // Cherche des enfants directs <span lang="..."> pour les toggler
      var spans = el.querySelectorAll(':scope > span[lang]');
      if (spans.length > 0) {
        spans.forEach(function(s) {
          var sLang = s.getAttribute('lang');
          s.hidden = (sLang !== lang);
        });
      }
    });
    // Sans wrapper data-i18n : toggler tous les <span lang> directs dans containers data-multilang
    document.querySelectorAll('[data-multilang]').forEach(function(el) {
      el.querySelectorAll(':scope > span[lang], :scope > p > span[lang], :scope > h2 > span[lang], :scope > h3 > span[lang]').forEach(function(s) {
        s.hidden = (s.getAttribute('lang') !== lang);
      });
    });

    // ====== Pattern data-fr / data-en / data-zh / data-es pour les inputs ======
    document.querySelectorAll('[data-' + lang + ']').forEach(function(el) {
      var val = el.getAttribute('data-' + lang);
      if (val === null) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        // placeholder pour les inputs
        if (el.hasAttribute('placeholder')) el.setAttribute('placeholder', val);
        // value pour les buttons type=submit/reset
        if (el.type === 'submit' || el.type === 'reset' || el.type === 'button') el.value = val;
      } else if (el.tagName === 'IMG') {
        if (el.hasAttribute('alt')) el.setAttribute('alt', val);
      }
    });

    // Mettre a jour boutons actifs
    document.querySelectorAll('.zts-lang-btn').forEach(function(b) {
      b.classList.toggle('zts-lang-active', b.getAttribute('data-lang') === lang);
    });

    // Emit event pour hooks personnalises
    window.dispatchEvent(new CustomEvent('zts-lang-change', { detail: { lang: lang } }));

    // Re-render icons lucide si present
    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }

  // ============ SWITCHER UI ============
  function buildSwitcher(targetId) {
    var container = document.getElementById(targetId || 'zts-lang-switcher');
    if (!container) return;

    var html = '<div class="zts-lang-switcher" role="group" aria-label="Language">';
    SUPPORTED.forEach(function(lang) {
      var l = SWITCHER_LABELS[lang];
      html += '<button type="button" class="zts-lang-btn" data-lang="' + lang + '" title="' + l.title + '" aria-label="' + l.title + '">' + l.code + '</button>';
    });
    html += '</div>';
    container.innerHTML = html;

    container.querySelectorAll('.zts-lang-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var lang = this.getAttribute('data-lang');
        // Met a jour l'URL sans recharger
        try {
          var url = new URL(window.location.href);
          if (lang === DEFAULT) {
            url.searchParams.delete('lang');
          } else {
            url.searchParams.set('lang', lang);
          }
          window.history.replaceState({}, '', url.toString());
        } catch(e) {}
        applyLang(lang);
      });
    });
  }

  // ============ STYLES DU SWITCHER ============
  function injectStyles() {
    if (document.getElementById('zts-lang-switcher-styles')) return;
    var css = document.createElement('style');
    css.id = 'zts-lang-switcher-styles';
    css.textContent = [
      '.zts-lang-switcher{display:inline-flex;gap:4px}',
      '.zts-lang-btn{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.85);',
      'border:1.5px solid rgba(255,255,255,0.3);border-radius:8px;padding:5px 10px;',
      'font-size:0.78rem;font-weight:700;cursor:pointer;transition:all .15s;font-family:inherit;line-height:1}',
      '.zts-lang-btn:hover{background:rgba(255,255,255,0.2);color:#fff;border-color:#fff}',
      '.zts-lang-btn.zts-lang-active{background:#FFD700;color:#18181b;border-color:#FFD700}',
      '.zts-lang-btn:focus{outline:2px solid #FFD700;outline-offset:2px}',
      // Pattern <span lang="X"> — CSS toggling base sur <html lang>
      'html[lang|="fr"] [lang|="en"]:not(html):not(body),',
      'html[lang|="fr"] [lang|="zh"]:not(html):not(body),',
      'html[lang|="fr"] [lang|="es"]:not(html):not(body){display:none!important}',
      'html[lang|="en"] [lang|="fr"]:not(html):not(body),',
      'html[lang|="en"] [lang|="zh"]:not(html):not(body),',
      'html[lang|="en"] [lang|="es"]:not(html):not(body){display:none!important}',
      'html[lang|="zh"] [lang|="fr"]:not(html):not(body),',
      'html[lang|="zh"] [lang|="en"]:not(html):not(body),',
      'html[lang|="zh"] [lang|="es"]:not(html):not(body){display:none!important}',
      'html[lang|="es"] [lang|="fr"]:not(html):not(body),',
      'html[lang|="es"] [lang|="en"]:not(html):not(body),',
      'html[lang|="es"] [lang|="zh"]:not(html):not(body){display:none!important}'
    ].join('');
    document.head.appendChild(css);
  }

  // ============ API PUBLIQUE ============
  window.ztsSetLang = applyLang;
  window.ztsGetLang = function() { return window.ztsCurrentLang || DEFAULT; };
  window.ztsBuildSwitcher = buildSwitcher;

  // ============ INIT ============
  function init() {
    injectStyles();
    buildSwitcher();
    applyLang(detectInitialLang());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
