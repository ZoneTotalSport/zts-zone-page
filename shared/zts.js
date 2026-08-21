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

  /* ---------- NOTIFICATIONS VISITE ----------
     Charge telegram-notify.js (notif Telegram via Worker) sur toutes les pages,
     y compris l'accueil. Garde anti-double-chargement pour les pages qui
     l'incluent déjà (blog, articles). */
  if (!document.querySelector('script[src*="telegram-notify"]')) {
    var _ztsNotif = document.createElement('script');
    _ztsNotif.src = ROOT + 'telegram-notify.js';
    _ztsNotif.defer = true;
    document.head.appendChild(_ztsNotif);
  }

  /* ---------- ANALYTICS GA4 (site-wide) ----------
     analytics.js n'était chargé que sur ~52 pages (blog/articles) : ni la home
     ni les 1440 fiches de jeux → GA4 aveugle sur l'essentiel du trafic. On le
     charge partout via zts.js. Le Consent Mode v2 (default deny, opt-in RGPD)
     est géré dans analytics.js + cookie-consent.js, donc aucun cookie n'est
     posé sans consentement.
     Injection différée à DOMContentLoaded : sur les 52 pages qui incluent déjà
     analytics.js en dur, la garde anti-double-chargement ne peut le détecter de
     façon fiable qu'une fois le DOM parsé (sinon race → GA4 chargé 2×).

     ⚠ LES DEUX FICHIERS VONT ENSEMBLE — corrigé le 2026-08-16.
     analytics.js pose `analytics_storage: denied` par DÉFAUT (Consent Mode v2,
     opt-in RGPD) ; seul cookie-consent.js peut lever ce refus, et seulement si
     le visiteur accepte la bannière. Injecter le premier sans le second donne
     une page qui mesure avec le consentement refusé ET aucun moyen de
     l'accorder : `gcs=G100` à perpétuité.
     C'est ce qui est arrivé entre le 13 et le 16 août : la home, les 3 hubs et
     les 1440 fiches ont reçu GA4 par ce chemin, sans bannière — donc sans
     donnée exploitable. Mesuré en prod (`gcs=G100`, cookie-consent.js absent
     du DOM de la page d'accueil).
     Le refus par défaut, lui, reste tel quel : c'est le comportement RGPD
     voulu, pas un défaut. Conséquence assumée — GA4 ne compte que les
     visiteurs consentants, `conversionFunnel` (Firestore) les compte tous.
     Les deux chiffres ne seront jamais égaux ; c'est Firestore qui fait foi
     pour le tunnel. */
  function injectScript(fichier, garde) {
    if (document.querySelector('script[src*="' + garde + '"]')) return;
    var s = document.createElement('script');
    s.src = ROOT + fichier;
    s.defer = true;
    document.head.appendChild(s);
  }
  function injectAnalytics() {
    injectScript('analytics.js', 'analytics.js');
    injectScript('cookie-consent.js', 'cookie-consent.js');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', injectAnalytics);
  else injectAnalytics();

  const STORE_KEY = 'zts_lang';
  let dict = {};                 // dictionnaire de la langue active
  let lang = 'fr';

  /* ---------- LANGUE ----------
     SEULE definition de « quelle langue voit ce visiteur ». Trois modules du
     tunnel en avaient chacun la leur, et elles ne repondaient pas pareil :
     zts-gate.js lisait localStorage seul, zts-unlock.js ZTS.getLang() seul,
     zts-cadenas.js avait trois niveaux. Un anglophone qui n'avait jamais
     touche au selecteur voyait donc le cadenas en anglais et le mur des apps
     en francais, sur la meme page.

     `langue()` est exposee en `ZTS.langue`. Les modules l'appellent quand elle
     existe ; ils portent le MEME corps en repli, parce qu'ils peuvent
     s'executer avant shared/zts.js selon l'ordre des balises de leur page
     (apps/generateur/index.html charge firebase-auth.js 90 lignes avant
     shared/zts.js). Un repli qui renverrait « fr » par defaut recreerait la
     divergence qu'on vient de retirer, au pire moment : au premier rendu. */
  function langue() {
    // 1) Paramètre d'URL ?lang= (priorité : liens hreflang, partages, Googlebot).
    try {
      const q = new URLSearchParams(location.search).get('lang');
      if (q === 'fr' || q === 'en') { localStorage.setItem(STORE_KEY, q); return q; }
    } catch (e) { /* URLSearchParams indispo : on ignore */ }
    // 2) Choix mémorisé.
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved === 'fr' || saved === 'en') return saved;
    } catch (e) { /* localStorage bloque (navigation privee stricte) */ }
    // 3) Langue du navigateur.
    return (navigator.language || 'fr').toLowerCase().startsWith('en') ? 'en' : 'fr';
  }
  const detectLang = langue;

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

  /* ---------- MENU DE NAVIGATION (déroulants + tiroir mobile) ----------
     Le header est injecté via innerHTML : un <script> inline dedans ne
     s'exécuterait pas. On charge donc le module à part, après l'injection. */
  function loadMenu() {
    if (!document.querySelector('.zts-header__nav')) return Promise.resolve();

    if (!document.getElementById('zts-menu-css')) {
      const css = document.createElement('link');
      css.id = 'zts-menu-css';
      css.rel = 'stylesheet';
      css.href = SHARED + 'zts-menu.css';
      document.head.appendChild(css);
    }
    if (window.ZTSMenu) { window.ZTSMenu.init(); return Promise.resolve(); }

    return new Promise(resolve => {
      const s = document.createElement('script');
      s.id = 'zts-menu-js';
      s.src = SHARED + 'zts-menu.js';
      s.onload = s.onerror = () => resolve();   // le header reste utilisable si ça échoue
      document.head.appendChild(s);
    });
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

  /* ---------- PERSONNAGE PAR MÉTIER (opt-in : body.has-perso + [data-metier]) ----------
     L'image est mappée en CSS via body[data-metier] .zts-perso (image-set webp+png).
     Posé une seule fois au load ; aucun MutationObserver (les landings ne changent
     pas de métier sur place). Décoratif : pointer-events:none + aria-hidden. */
  function injectPerso() {
    const b = document.body;
    if (!b.classList.contains('has-perso')) return;   // opt-in strict
    if (!b.getAttribute('data-metier')) return;        // besoin d'un métier actif
    if (document.querySelector('.zts-perso')) return;  // idempotent
    const d = document.createElement('div');
    d.className = 'zts-perso';
    d.setAttribute('aria-hidden', 'true');
    b.appendChild(d);
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
    // Header visible UNIQUEMENT en haut de page ; caché dès qu'on descend.
    const apply = () => h.classList.toggle('hidden', scrollY > 80);
    addEventListener('scroll', apply, { passive: true });
    apply();
  }

  /* ---------- INIT ---------- */
  async function init() {
    lang = detectLang();
    // Injecte header/footer si des hôtes existent, puis traduit l'ensemble.
    await Promise.all([
      injectPartial('[data-zts-header]', 'header.html'),
      injectPartial('[data-zts-footer]', 'footer.html')
    ]);
    await loadMenu();            // avant applyI18n : les libellés du menu sont traduits aussi
    dict = await loadDict(lang);
    applyI18n(document);
    wireModals();
    startClock();
    countUp();
    injectPerso();
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

    // Partage — chargé ICI, après l'injection du chrome ET le chargement du
    // dictionnaire : le module lit ses chaînes par ZTS.t(), il ne peut donc
    // pas se monter avant. Il se monte tout seul sur `zts:ready`, émis juste
    // au-dessus, et sur tout `[data-zts-partage]` — le pied de page en porte
    // un, /bienvenue.html aussi.
    if (!document.getElementById('zts-partage-loader')) {
      const pt = document.createElement('script');
      pt.id = 'zts-partage-loader';
      pt.src = SHARED + 'zts-partage.js';
      pt.defer = true;
      document.body.appendChild(pt);
    }

    // Carte du générateur — même raison d'être ici que le partage : elle lit
    // ses chaînes par ZTS.t(), donc après le dictionnaire.
    if (!document.getElementById('zts-genia-loader')) {
      const gi = document.createElement('script');
      gi.id = 'zts-genia-loader';
      gi.src = SHARED + 'zts-genia.js';
      gi.defer = true;
      document.body.appendChild(gi);
    }

    // Capture courriel site-wide (le script s'auto-exclut des /apps/*)
    if (!document.getElementById('zts-nl-loader')) {
      var nl = document.createElement('script');
      nl.id = 'zts-nl-loader';
      nl.src = ROOT + 'zts-newsletter.js';
      nl.defer = true;
      document.body.appendChild(nl);
    }

    // Pastilles « compte gratuit requis » sur le menu et le pied de page.
    // Chargé ICI, après l'injection du chrome partagé, parce que c'est lui
    // qu'il annote — 24 des 27 liens /apps/ du site vivent dans ces deux
    // fragments, pas dans les pages. Il n'est PAS exclu des /apps/* : le menu
    // y est aussi, et un visiteur déjà derrière un mur gagne à voir lesquelles
    // des autres portes sont ouvertes.
    if (!document.getElementById('zts-cad-loader')) {
      var cad = document.createElement('script');
      cad.id = 'zts-cad-loader';
      cad.src = ROOT + 'zts-cadenas.js';
      cad.defer = true;
      document.body.appendChild(cad);
    }
  }

  // API publique
  window.ZTS = {
    t, setLang, getLang: () => lang, langue, applyI18n,
    openModal, closeModal, setMetier, countUp,
    paths: { shared: SHARED, root: ROOT }
  };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', init);
  else init();
})();
