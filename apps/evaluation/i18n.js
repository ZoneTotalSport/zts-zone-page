/* ============================================================
   i18n.js — Système de traduction pour les apps Zone Total Sport
   FR · EN · 中文 · ES
   Usage:
     1. Inclure <script src="i18n.js"></script> AVANT app.js
     2. Définir window.APP_TRANSLATIONS = { fr:{...}, en:{...}, zh:{...}, es:{...} }
     3. Appeler initI18n() au DOMContentLoaded
     4. Utiliser t('key') pour traduire
   ============================================================ */
'use strict';

var _currentLang = 'fr';
var _translations = {};

var LANG_OPTIONS = [
  { code: 'fr', label: '🇫🇷 Français', short: 'FR' },
  { code: 'en', label: '🇬🇧 English', short: 'EN' },
  { code: 'zh', label: '🇨🇳 中文', short: '中文' },
  { code: 'es', label: '🇪🇸 Español', short: 'ES' },
];

function t(key, fallback) {
  var lang = _translations[_currentLang];
  if (lang && lang[key] !== undefined) return lang[key];
  // Fallback to French
  var fr = _translations['fr'];
  if (fr && fr[key] !== undefined) return fr[key];
  return fallback || key;
}

function setLang(code) {
  _currentLang = code;
  localStorage.setItem('zts-lang', code);
  document.documentElement.lang = code === 'zh' ? 'zh-CN' : code;
  // Update all elements with data-t attribute
  document.querySelectorAll('[data-t]').forEach(function(el) {
    var key = el.getAttribute('data-t');
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = t(key);
    } else {
      el.textContent = t(key);
    }
  });
  // Update elements with data-t-placeholder
  document.querySelectorAll('[data-t-placeholder]').forEach(function(el) {
    el.placeholder = t(el.getAttribute('data-t-placeholder'));
  });
  // Update lang selector display
  var sel = document.getElementById('lang-select');
  if (sel) sel.value = code;
  // Trigger re-render if app has a renderAll/renderSAE function
  if (typeof renderAll === 'function') renderAll();
  else if (typeof renderSAE === 'function') { applyFilters(); }
  else if (typeof renderContent === 'function') renderContent();
}

function initI18n() {
  if (window.APP_TRANSLATIONS) _translations = window.APP_TRANSLATIONS;
  _currentLang = localStorage.getItem('zts-lang') || 'fr';
  // Inject language selector into header
  injectLangSelector();
  // Apply initial translations
  setLang(_currentLang);
}

function injectLangSelector() {
  // Find a place in the header to put the selector
  var target = document.querySelector('.header-right') ||
               document.querySelector('.header-center') ||
               document.querySelector('.top-header') ||
               document.querySelector('header');
  if (!target) return;

  var wrapper = document.createElement('span');
  wrapper.className = 'lang-selector';
  wrapper.innerHTML =
    '<select id="lang-select" class="lang-select" onchange="setLang(this.value)">' +
    LANG_OPTIONS.map(function(l) {
      return '<option value="' + l.code + '"' + (l.code === _currentLang ? ' selected' : '') + '>' + l.short + '</option>';
    }).join('') +
    '</select>';
  target.appendChild(wrapper);
}
