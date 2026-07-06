/**
 * tiroir-jeux.js — Tiroir Jeux du Planificateur (concept "tiroir", camps)
 *
 * Panneau qui s'ouvre PAR-DESSUS la vue journée (on ne quitte jamais le
 * calendrier) : backdrop semi-transparent, fermeture X / ESC / clic backdrop.
 * Données et écritures : PlanifData (dataStore.js) uniquement.
 * Boutons : .zts-action / .zts-action--camps (standard 2026-07 — pas de pilule).
 *
 * Script classique chargé avant app.js ; `state`, `render`, `esc` de app.js
 * sont résolus à l'appel.
 */

const TiroirJeux = (() => {

  const T = {
    open: false,
    mode: 'gap',            // 'gap' = insérer au créneau | 'fill' = remplir un bloc vide
    creneau: null,          // {debut, fin}
    blocCible: null,        // id du bloc à remplir (mode fill)
    items: null,            // banque chargée (null = pas encore)
    loading: false,
    error: null,
    filtres: { age: '', energie: '', lieu: '', sansMateriel: false, q: '' },
  };

  const MAX_AFFICHES = 80;

  function el() { return document.getElementById('tiroir-jeux'); }
  function hLabel(hm) { return (hm || '').replace(':', ' h '); }

  // ── Ouverture / fermeture ────────────────────────────────

  function openForCreneau(creneau) {
    T.mode = 'gap'; T.creneau = creneau; T.blocCible = null;
    ouvrir();
  }

  function openForBloc(blocIdCible, creneau) {
    T.mode = 'fill'; T.blocCible = blocIdCible; T.creneau = creneau;
    ouvrir();
  }

  function ouvrir() {
    T.open = true;
    const m = el();
    m.classList.add('open');
    m.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (!T.items && !T.loading) charger();
    paint();
  }

  function fermer() {
    T.open = false;
    const m = el();
    m.classList.remove('open');
    m.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function charger() {
    T.loading = true; T.error = null;
    PlanifData.loadBanqueCamp()
      .then(items => { T.items = items; })
      .catch(err => { T.error = err.message || String(err); })
      .finally(() => { T.loading = false; paint(); });
  }

  // ── Rendu ────────────────────────────────────────────────

  function paint() {
    const inner = el().querySelector('.tiroir__panel');
    if (!inner) return;
    inner.innerHTML = renderHeader() + renderCorps();
    const q = inner.querySelector('[data-tiroir-q]');
    if (q && document.activeElement !== q) { /* focus géré au besoin */ }
  }

  function renderHeader() {
    const ou = T.creneau ? `${hLabel(T.creneau.debut)} → ${hLabel(T.creneau.fin)}` : '';
    return `<div class="tiroir__head">
      <div class="tiroir__title">🎲 Choisir un jeu</div>
      ${ou ? `<div class="tiroir__slot">${T.mode === 'fill' ? 'Pour le bloc de' : 'Créneau'} ${ou}</div>` : ''}
      <button class="zts-action zts-action--neutre tiroir__close" data-tiroir="close" aria-label="Fermer">✕</button>
    </div>`;
  }

  function renderCorps() {
    if (T.loading) return `<div class="tiroir__msg">⏳ Chargement de la banque de jeux…</div>`;
    if (T.error) return `<div class="tiroir__msg">⚠️ Banque indisponible (${esc(T.error)}).
      <button class="zts-action zts-action--camps" data-tiroir="retry">Réessayer</button></div>`;
    if (!T.items) return '';
    const visibles = PlanifData.filterBanque(T.items, T.filtres);
    const rows = visibles.slice(0, MAX_AFFICHES).map(renderRow).join('');
    const plus = visibles.length > MAX_AFFICHES
      ? `<div class="tiroir__msg">…et ${visibles.length - MAX_AFFICHES} autres — précise les filtres.</div>` : '';
    return `<div class="tiroir__count">${visibles.length} jeu(x)</div>
      <div class="tiroir__list">${rows || '<div class="tiroir__msg">Aucun jeu ne correspond.</div>'}</div>${plus}`;
  }

  function renderRow(x) {
    const meta = [
      x.nbJoueurs ? `👥 ${x.nbJoueurs}` : '',
      `🎒 ${esc(x.materielCourt)}`,
      x.duree ? `⏱ ${esc(x.duree)}` : '',
    ].filter(Boolean).join(' · ');
    const heure = T.creneau ? hLabel(T.creneau.debut) : '';
    return `<div class="tiroir__row">
      <div class="tiroir__row-main">
        <div class="tiroir__row-titre">${x.icon} ${esc(x.titre)}</div>
        <div class="tiroir__row-meta">${meta}</div>
      </div>
      <button class="zts-action zts-action--camps tiroir__add" data-tiroir="add" data-ref="${esc(x.ref)}">
        AJOUTER ${heure ? '➜ ' + heure : ''}</button>
    </div>`;
  }

  // ── Ajout ────────────────────────────────────────────────

  async function ajouter(ref) {
    const jeu = (T.items || []).find(x => x.ref === ref);
    if (!jeu) return;
    let idInsere;
    if (T.mode === 'fill' && T.blocCible) idInsere = await PlanifData.remplirBloc(jeu, T.blocCible);
    else idInsere = await PlanifData.insererJeu(jeu, T.creneau || PlanifData.premierTrou(state.journeeBlocs));
    fermer();
    render();
    return idInsere;
  }

  // ── Événements (autonomes — le tiroir vit hors de #app-root) ──

  function wire() {
    const m = el(); if (!m) return;
    m.addEventListener('click', async (e) => {
      if (e.target === m) { fermer(); return; }                    // backdrop
      const b = e.target.closest('[data-tiroir]'); if (!b) return;
      const k = b.dataset.tiroir;
      if (k === 'close') fermer();
      else if (k === 'retry') charger();
      else if (k === 'add') { b.disabled = true; try { await ajouter(b.dataset.ref); } catch (err) { b.disabled = false; alert('Erreur : ' + (err.message || err)); } }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && T.open) { e.stopImmediatePropagation(); fermer(); }
    }, { capture: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  return { openForCreneau, openForBloc, fermer, _T: T, _paint: paint };
})();
