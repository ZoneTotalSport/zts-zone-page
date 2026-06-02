/* ============================================================
   ZONE TOTAL SPORT — UTILITAIRES PARTAGÉS  (zts.js)
   i18n FR/EN · injection header/footer · modales · thème métier
   · horloge · compteurs animés.
   Chargé par la home ET chaque app. API exposée : window.ZTS
   ============================================================ */
(function () {
  'use strict';

  // Racine relative vers /shared/ : déduite de la balise <script> courante.
  const SELF = document.currentScript;
  const SHARED = SELF ? SELF.src.replace(/zts\.js.*$/, '') : 'shared/';
  const ROOT = SHARED.replace(/shared\/$/, ''); // racine du repo

  const STORE_KEY = 'zts_lang';
  let dict = {};                 // dictionnaire de la langue active
  let lang = 'fr';

  /* ---------- LANGUE ---------- */
  function detectLang() {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
    return (navigator.language || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
  }

  async function loadDict(l) {
    try {
      const res = await fetch(`${SHARED}i18n/${l}.json`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(res.status);
      return await res.json();
    } catch (e) {
      console.warn('[ZTS] dico i18n manquant:', l, e);
      return {};
    }
  }

  function t(key, fallback) {
    return (key in dict) ? dict[key] : (fallback != null ? fallback : key);
  }

  // Applique les traductions à tout le DOM (data-i18n / data-i18n-attr).
  function applyI18n(root) {
    root = root || document;
    root.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (key in dict) el.textContent = dict[key];
    });
    // data-i18n-attr="placeholder:cle;title:cle2"
    root.querySelectorAll('[data-i18n-attr]').forEach(el => {
      el.getAttribute('data-i18n-attr').split(';').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (attr && key && key in dict) el.setAttribute(attr, dict[key]);
      });
    });
    document.documentElement.lang = (lang === 'en') ? 'en' : 'fr-CA';
    // Boutons du toggle
    document.querySelectorAll('.zts-lang button').forEach(b =>
      b.classList.toggle('active', b.dataset.lang === lang));
  }

  async function setLang(l) {
    lang = (l === 'en') ? 'en' : 'fr';
    localStorage.setItem(STORE_KEY, lang);
    dict = await loadDict(lang);
    applyI18n(document);
    document.dispatchEvent(new CustomEvent('zts:langchange', { detail: { lang } }));
  }

  /* ---------- INJECTION HEADER / FOOTER ---------- */
  async function injectPartial(selector, file) {
    const host = document.querySelector(selector);
    if (!host) return;
    try {
      const res = await fetch(`${SHARED}${file}`, { cache: 'no-cache' });
      const html = (await res.text()).split('{{ROOT}}').join(ROOT);
      host.innerHTML = html;
    } catch (e) { console.warn('[ZTS] partial manquant:', file, e); }
  }

  /* ---------- MODALES (ouverture/fermeture robustes) ---------- */
  function openModal(id) {
    const m = document.getElementById(id);
    if (m) { m.classList.add('open'); m.setAttribute('aria-hidden', 'false'); }
  }
  function closeModal(id) {
    const m = (typeof id === 'string') ? document.getElementById(id) : id;
    if (m) { m.classList.remove('open'); m.setAttribute('aria-hidden', 'true'); }
  }
  function wireModals() {
    // Clic sur l'overlay = ferme
    document.querySelectorAll('.zts-modal').forEach(m => {
      m.addEventListener('click', e => { if (e.target === m) closeModal(m); });
    });
    // Boutons ✕ : [data-close] ou .zts-modal__close
    document.querySelectorAll('[data-close],.zts-modal__close').forEach(b => {
      b.addEventListener('click', () => closeModal(b.closest('.zts-modal')));
    });
    // Échap ferme toutes les modales ouvertes
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape')
        document.querySelectorAll('.zts-modal.open').forEach(closeModal);
    });
  }

  /* ---------- THÈME MÉTIER ---------- */
  function setMetier(key) { // 'ep' | 'sdg' | 'camp' | null
    if (key) document.body.setAttribute('data-metier', key);
    else document.body.removeAttribute('data-metier');
  }

  /* ---------- HORLOGE ---------- */
  function startClock(sel) {
    const el = document.querySelector(sel || '[data-clock]');
    if (!el) return;
    const p = n => String(n).padStart(2, '0');
    const tick = () => {
      const d = new Date();
      el.textContent = `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
    };
    tick(); setInterval(tick, 1000);
  }

  /* ---------- COMPTEURS ANIMÉS (count-up au scroll) ---------- */
  function countUp() {
    const els = document.querySelectorAll('[data-count]');
    if (!els.length) return;
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        obs.unobserve(en.target);
        const node = en.target, target = +node.dataset.count, start = performance.now();
        (function step(now) {
          const p = Math.min((now - start) / 1200, 1);
          node.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target).toLocaleString('fr-CA');
          if (p < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: .4 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- OFFSET sous le header fixe (hauteur variable) ---------- */
  function adjustHeaderOffset() {
    const h = document.querySelector('.zts-header');
    if (!h) return;
    // La carte flotte (marge + ombre décalée) → on cale sur son bord bas réel.
    document.body.style.paddingTop = (h.getBoundingClientRect().bottom + 12) + 'px';
  }

  /* ---------- HEADER hide-on-scroll ---------- */
  function hideHeaderOnScroll() {
    const h = document.querySelector('.zts-header');
    if (!h) return;
    let last = 0;
    addEventListener('scroll', () => {
      const y = scrollY;
      h.classList.toggle('hidden', y > last && y > 120);
      last = y;
    }, { passive: true });
  }

  /* ---------- INIT ---------- */
  async function init() {
    lang = detectLang();
    // Injecte header/footer si des hôtes existent, puis traduit l'ensemble.
    await Promise.all([
      injectPartial('[data-zts-header]', 'header.html'),
      injectPartial('[data-zts-footer]', 'footer.html')
    ]);
    dict = await loadDict(lang);
    applyI18n(document);
    wireModals();
    startClock();
    countUp();
    hideHeaderOnScroll();
    adjustHeaderOffset();
    setTimeout(adjustHeaderOffset, 300); // après chargement des polices
    addEventListener('resize', adjustHeaderOffset, { passive: true });
    // Délègue le toggle langue (fonctionne même sur header injecté)
    document.addEventListener('click', e => {
      const b = e.target.closest('.zts-lang button');
      if (b) setLang(b.dataset.lang);
    });
    document.dispatchEvent(new CustomEvent('zts:ready', { detail: { lang } }));
  }

  // API publique
  window.ZTS = {
    t, setLang, getLang: () => lang, applyI18n,
    openModal, closeModal, setMetier, countUp,
    paths: { shared: SHARED, root: ROOT }
  };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
