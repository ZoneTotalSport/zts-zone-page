/* ============================================================
   i18n.js — Pont de traduction pour app-educatifs
   Branché sur le toggle FR/EN du header partagé (shared/zts.js).
   - Les chaînes vivent dans lang/translations.js (window.APP_TRANSLATIONS).
   - La langue active suit ZTS.getLang() ('fr' | 'en').
   - t('cle') retourne la chaîne traduite (fallback FR).
   - Les éléments [data-t] / [data-t-placeholder] sont mis à jour
     automatiquement ; le contenu dynamique se re-rend via les
     écouteurs zts:ready / zts:langchange (voir app.js).
   ============================================================ */
'use strict';

var _currentLang = 'fr';
var _translations = {};

function t(key, fallback) {
  var lang = _translations[_currentLang];
  if (lang && lang[key] !== undefined) return lang[key];
  var fr = _translations['fr'];
  if (fr && fr[key] !== undefined) return fr[key];
  return fallback || key;
}

// Détecte la langue courante : ZTS si dispo, sinon ?lang= / localStorage.
function detectLang() {
  if (window.ZTS && typeof window.ZTS.getLang === 'function') {
    return window.ZTS.getLang();
  }
  try {
    var p = new URLSearchParams(location.search).get('lang');
    if (p === 'en' || p === 'fr') return p;
  } catch (e) {}
  var stored = localStorage.getItem('zts-lang');
  return (stored === 'en') ? 'en' : 'fr';
}

// Applique les traductions sur tous les [data-t] / [data-t-placeholder].
function applyStaticI18n() {
  document.querySelectorAll('[data-t]').forEach(function (el) {
    var key = el.getAttribute('data-t');
    var val = t(key);
    if (el.hasAttribute('data-t-html')) el.innerHTML = val;
    else el.textContent = val;
  });
  document.querySelectorAll('[data-t-placeholder]').forEach(function (el) {
    el.placeholder = t(el.getAttribute('data-t-placeholder'));
  });
  document.querySelectorAll('[data-t-title]').forEach(function (el) {
    el.title = t(el.getAttribute('data-t-title'));
  });
}

// Synchronise la langue + ré-applique le statique. Le re-render du
// contenu dynamique est déclenché par app.js (rerenderDynamic()).
function syncI18n() {
  if (window.APP_TRANSLATIONS) _translations = window.APP_TRANSLATIONS;
  _currentLang = detectLang();
  document.documentElement.lang = (_currentLang === 'en') ? 'en' : 'fr-CA';
  applyStaticI18n();
}

// Init précoce (avant ZTS) pour éviter un flash FR si ?lang=en.
if (window.APP_TRANSLATIONS) _translations = window.APP_TRANSLATIONS;
_currentLang = detectLang();
