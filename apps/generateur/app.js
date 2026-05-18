// ==========================================================================
// Générateur IA — app.js (Fusion #1, commit #4)
// UI selection + appel worker + effet machine à écrire + popup signup
// ==========================================================================

(function() {
  'use strict';

  const API_URL = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:8787/generate'
    : 'https://api.zonetotalsport.ca/generate';

  const ANON_COUNT_KEY = 'zts_gen_anon_count';
  const ANON_GENS_KEY = 'zts_anon_generations';
  const ANON_LIMIT = 3;
  const MAX_GENS_DISPLAY = 12;

  const API_BASE = API_URL.replace(/\/generate$/, '');

  // ──────────────────────────────────────────────────────────
  // State
  // ──────────────────────────────────────────────────────────
  const state = {
    type: 'jeu',
    univers: 'eps',
    modele: 'haiku',
    contexte: '',
    isGenerating: false,
    lastResult: null,
  };

  // ──────────────────────────────────────────────────────────
  // DOM
  // ──────────────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  const $context = $('#contextInput');
  const $charCount = $('#charCount');
  const $generateBtn = $('#generateBtn');
  const $quotaHint = $('#quotaHint');
  const $resultZone = $('#resultZone');
  const $loadingState = $('#loadingState');
  const $loadingMsg = $('#loadingMsg');
  const $ficheCard = $('#ficheCard');
  const $errorState = $('#errorState');
  const $errorMsg = $('#errorMsg');
  const $retryBtn = $('#retryBtn');
  const $signupModal = $('#signupModal');
  const $accountBtn = $('#accountBtn');
  const $accountMenu = $('#accountMenu');
  const $tooltipBtn = $('#tooltipBtn');
  const $tooltipBox = $('#tooltipBox');

  // ──────────────────────────────────────────────────────────
  // Placeholders dynamiques
  // ──────────────────────────────────────────────────────────
  const PLACEHOLDERS = {
    jeu: {
      eps:   "ex. 3e cycle, basketball, ballons mousse, 30 min",
      camps: "ex. thème pirates, 50 jeunes, plein air, après-midi",
      sdg:   "ex. local de 50m², 15 enfants 6-10 ans, retour calme",
    },
    sae: {
      eps:   "ex. 2e cycle, hockey-cosom, 4 périodes, compétence C1",
      camps: "ex. journée volley-plage, débutants, 60 jeunes",
      sdg:   "ex. semaine olympique, ateliers tournants, 5 jours",
    },
    educatif: {
      eps:   "ex. lancer par-dessus l'épaule, 1er cycle, ballons mousse",
      camps: "ex. initiation soccer, ateliers techniques 20 min",
      sdg:   "ex. équilibre sur un pied, jeu calme avant retour parents",
    },
  };

  const LOADING_MESSAGES = [
    "Le bûcheron réfléchit...",
    "Il taille la fiche...",
    "Il polit les variantes...",
    "Il vérifie le matériel...",
    "Il aiguise les règles...",
    "Presque prêt...",
  ];

  // ──────────────────────────────────────────────────────────
  // Sélecteurs (cartes XXL)
  // ──────────────────────────────────────────────────────────
  function setupSelectors(group) {
    const cards = $$(`.zts-gen-selector-grid[data-group="${group}"] .zts-gen-card`);
    cards.forEach((card) => {
      card.addEventListener('click', () => {
        cards.forEach((c) => c.classList.remove('is-active'));
        card.classList.add('is-active');
        state[group] = card.dataset.value;
        updatePlaceholder();
      });
    });
  }

  function updatePlaceholder() {
    const ph = PLACEHOLDERS[state.type]?.[state.univers];
    if (ph) $context.placeholder = ph;
  }

  // ──────────────────────────────────────────────────────────
  // Toggle modèle + tooltip
  // ──────────────────────────────────────────────────────────
  function setupModele() {
    $$('.zts-gen-toggle-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('.zts-gen-toggle-opt').forEach((b) => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        state.modele = btn.dataset.modele;
      });
    });
    $tooltipBtn.addEventListener('click', () => {
      $tooltipBox.hidden = !$tooltipBox.hidden;
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.zts-gen-modele-row')) $tooltipBox.hidden = true;
    });
  }

  // ──────────────────────────────────────────────────────────
  // Textarea compteur
  // ──────────────────────────────────────────────────────────
  function setupTextarea() {
    $context.addEventListener('input', () => {
      state.contexte = $context.value;
      $charCount.textContent = $context.value.length;
    });
  }

  // ──────────────────────────────────────────────────────────
  // Auth (Firebase optionnel — chargé par index principal si présent)
  // ──────────────────────────────────────────────────────────
  function getUid() {
    try {
      return window.firebase?.auth?.()?.currentUser?.uid || null;
    } catch { return null; }
  }

  // Récupère l'ID token Firebase courant (refresh auto si proche expiration).
  // Renvoie null si pas connecté. Utilisé pour Authorization: Bearer <token>.
  async function getIdToken() {
    try {
      const u = window.firebase?.auth?.()?.currentUser;
      if (!u) return null;
      return await u.getIdToken(false);
    } catch (e) {
      console.warn('[auth] getIdToken failed:', e?.message);
      return null;
    }
  }

  // Construit les headers pour un appel worker. Ajoute Authorization si user connecté.
  async function authHeaders(extra = {}) {
    const t = await getIdToken();
    return {
      ...extra,
      ...(t ? { 'Authorization': 'Bearer ' + t } : {}),
    };
  }

  function setupAccountMenu() {
    $accountBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      $accountMenu.hidden = !$accountMenu.hidden;
      refreshAccountMenu();
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.zts-gen-account')) $accountMenu.hidden = true;
    });
  }

  function refreshAccountMenu() {
    const uid = getUid();
    const signin = $accountMenu.querySelector('[data-action="signin"]');
    const profile = $accountMenu.querySelector('[data-action="profile"]');
    const signout = $accountMenu.querySelector('[data-action="signout"]');
    if (uid) { signin.hidden = true; profile.hidden = false; signout.hidden = false; }
    else     { signin.hidden = false; profile.hidden = true; signout.hidden = true; }
  }

  // ──────────────────────────────────────────────────────────
  // Quota anonyme local (compteur indicatif côté UI seulement —
  // la vraie source de vérité reste le worker)
  // ──────────────────────────────────────────────────────────
  function getAnonCount() {
    return parseInt(localStorage.getItem(ANON_COUNT_KEY) || '0', 10);
  }
  function incAnonCount() {
    localStorage.setItem(ANON_COUNT_KEY, String(getAnonCount() + 1));
  }

  function updateQuotaHint(quota) {
    const uid = getUid();
    if (quota) {
      const left = quota.max - quota.used;
      if (uid) {
        $quotaHint.textContent = `Crédits restants ce mois : ${left} / ${quota.max}`;
      } else {
        $quotaHint.textContent = `Tu peux générer ${left} fois sans inscription (${quota.used}/${quota.max} utilisés).`;
      }
      return;
    }
    if (uid) {
      $quotaHint.textContent = 'Connecté : 10 générations gratuites/mois.';
    } else {
      const remaining = Math.max(0, ANON_LIMIT - getAnonCount());
      $quotaHint.textContent = `Tu peux générer ${remaining} fois sans inscription.`;
    }
  }

  // ──────────────────────────────────────────────────────────
  // Génération
  // ──────────────────────────────────────────────────────────
  function setupGenerate() {
    $generateBtn.addEventListener('click', generate);
    $retryBtn.addEventListener('click', generate);
  }

  async function generate() {
    if (state.isGenerating) return;

    // Plus de gate client-side stricte — le worker est la source de vérité.
    // Le compteur local sert seulement à l'affichage indicatif du hint.

    state.isGenerating = true;
    $generateBtn.disabled = true;
    showLoading();
    rotateLoadingMessages();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 35000);

    try {
      const body = {
        type: state.type,
        univers: state.univers,
        contexte: state.contexte.slice(0, 1000),
        modele: state.modele,
        // uid retiré : le worker l'extrait du token Firebase si présent (sinon anon IP)
      };

      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: await authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const json = await resp.json().catch(() => null);

      // QUOTA_EXCEEDED : si anon → popup signup. Si user authentifié → message + don.
      if (resp.status === 429 || json?.code === 'QUOTA_EXCEEDED') {
        hideLoading();
        const scope = json?.quota?.scope;
        if (scope === 'anon' || !getUid()) {
          openSignupModal();
        } else {
          showError(json?.message || 'Quota mensuel atteint. Fais un don pour soutenir le projet : https://paypal.me/zonetotalsport');
        }
        return;
      }
      if (resp.status === 401 || json?.code === 'ANON_LIMIT') {
        hideLoading();
        openSignupModal();
        return;
      }
      if (!resp.ok || !json?.ok) {
        showError(json?.message || `Erreur ${resp.status}. Le bûcheron a glissé, réessaye.`);
        return;
      }

      state.lastResult = json;
      if (!getUid()) {
        incAnonCount();
        saveAnonGeneration(json);
      }
      updateQuotaHint(json.quota);
      await renderFicheTypewriter(json);
      await refreshGenerationsGrid();
    } catch (e) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        showError("Le bûcheron a tardé (>35s). Réessaie avec un contexte plus court.");
      } else {
        showError("Connexion au bûcheron impossible. Vérifie ta connexion puis réessaie.");
      }
    } finally {
      state.isGenerating = false;
      $generateBtn.disabled = false;
      stopLoadingMessages();
    }
  }

  // ──────────────────────────────────────────────────────────
  // États visuels
  // ──────────────────────────────────────────────────────────
  function showLoading() {
    $resultZone.hidden = false;
    $loadingState.hidden = false;
    $ficheCard.hidden = true;
    $errorState.hidden = true;
    $resultZone.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function hideLoading() { $loadingState.hidden = true; }

  function showError(msg) {
    hideLoading();
    $resultZone.hidden = false;
    $ficheCard.hidden = true;
    $errorState.hidden = false;
    $errorMsg.textContent = msg;
  }

  let loadingTimer = null;
  function rotateLoadingMessages() {
    let i = 0;
    $loadingMsg.textContent = LOADING_MESSAGES[0];
    loadingTimer = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      $loadingMsg.textContent = LOADING_MESSAGES[i];
    }, 2500);
  }
  function stopLoadingMessages() {
    if (loadingTimer) { clearInterval(loadingTimer); loadingTimer = null; }
  }

  // ──────────────────────────────────────────────────────────
  // Rendu fiche v2 (neubrutaliste shadowbox)
  // ──────────────────────────────────────────────────────────
  async function renderFicheTypewriter(json) {
    // L'effet typewriter a été remplacé par un rendu structuré v2 (shadowbox).
    return renderFiche2(json);
  }

  function splitTitle(title) {
    // Sépare un titre en main + accent (dernier mot ou les 2 derniers)
    if (!title) return ['', ''];
    const words = String(title).split(/\s+/).filter(Boolean);
    if (words.length <= 1) return [words[0] || '', ''];
    if (words.length === 2) return [words[0], words[1]];
    // 3+ mots : 2/3 main, 1/3 accent
    const splitIdx = Math.ceil(words.length * 0.6);
    return [words.slice(0, splitIdx).join(' '), words.slice(splitIdx).join(' ')];
  }

  function splitPlanSteps(data) {
    // Construit une liste d'étapes pour le "Plan de match"
    if (Array.isArray(data.deroulement)) {
      return data.deroulement.map(p => typeof p === 'string'
        ? { text: p }
        : { phase: p.phase, duree: p.duree, text: [p.description, p.organisation ? `↳ ${p.organisation}` : ''].filter(Boolean).join(' ') });
    }
    if (Array.isArray(data.progression)) {
      return data.progression.map(p => typeof p === 'string'
        ? { text: p }
        : { phase: `Palier ${p.palier || '?'}`, text: [p.consigne, p.critere_reussite ? `✓ Réussite : ${p.critere_reussite}` : ''].filter(Boolean).join(' ') });
    }
    if (data.regles) {
      // Split le paragraphe en phrases (au moins 3, max 6)
      const sentences = String(data.regles)
        .split(/(?<=[.!?])\s+(?=[A-ZÉÈÀ])/)
        .map(s => s.trim())
        .filter(s => s.length > 10);
      return sentences.slice(0, 6).map(s => ({ text: s }));
    }
    return [];
  }

  function listFromAny(...candidates) {
    for (const c of candidates) {
      if (Array.isArray(c) && c.length) return c.map(x => typeof x === 'string' ? x : (x.titre || x.nom || JSON.stringify(x)));
      if (typeof c === 'string' && c.trim()) return [c];
    }
    return [];
  }

  function renderFiche2(json) {
    hideLoading();
    $errorState.hidden = true;
    $ficheCard.hidden = false;

    const data = json.data || {};
    const type = json.type;

    // ── Badges sticker (cycle + durée)
    const cycleStr = data.cycle
      || (Array.isArray(data.niveaux) ? data.niveaux[0] : data.niveaux)
      || data.niveau
      || ({ eps: 'Primaire', camps: 'Camp', sdg: 'Service garde' }[json.univers] || '');
    const dureeStr = (data.duree_min && data.duree_max) ? `${data.duree_min}-${data.duree_max} min`
                   : (data.duree_totale) ? data.duree_totale
                   : (data.duree_par_palier) ? `${data.duree_par_palier}/palier`
                   : (data.duree || '—');
    $('#ficheCycleText').textContent = cycleStr;
    $('#ficheDureeText').textContent = dureeStr;

    // ── Titre split + tagline + subtitle
    const fullTitle = data.titre || data.nom || 'Fiche générée';
    const [titleMain, titleAccent] = splitTitle(fullTitle);
    const $titleMain = $('#ficheTitleMain');
    const $titleAccent = $('#ficheTitleAccent');
    $titleMain.textContent = titleMain;
    $titleAccent.textContent = titleAccent;
    $titleMain.setAttribute('data-editable', 'titre-main');
    $titleAccent.setAttribute('data-editable', 'titre-accent');
    const TAGLINES = {
      jeu: '🎮 Fiche de jeu officielle',
      sae: '📚 Situation d\'apprentissage',
      educatif: '🏋️ Éducatif progressif',
    };
    $('#ficheTagline').textContent = TAGLINES[type] || 'Fiche officielle';
    const subtitle = data.but
      || data.intentions_pedagogiques
      || (data.habilete_ciblee ? `Maîtriser : ${data.habilete_ciblee}` : '')
      || '';
    const $sub = $('#ficheSubtitle');
    $sub.textContent = subtitle.slice(0, 200);
    $sub.setAttribute('data-editable', 'subtitle');

    // ── Tuile MATÉRIEL
    const $mat = $('#ficheMateriel');
    $mat.innerHTML = '';
    const matList = listFromAny(data.materiel);
    if (matList.length === 0) matList.push('Aucun matériel spécifique');
    matList.slice(0, 6).forEach((item, i) => {
      const li = document.createElement('li');
      li.textContent = item;
      li.setAttribute('data-editable', `materiel-${i}`);
      $mat.appendChild(li);
    });

    // ── Tuile OBJECTIF
    const objectifLabel = type === 'sae' ? 'INTENTIONS'
                        : type === 'educatif' ? 'HABILETÉ' : 'OBJECTIF';
    $('#ficheObjectifLabel').textContent = objectifLabel;
    let objectifText = '';
    if (type === 'jeu') objectifText = data.but || '';
    else if (type === 'sae') objectifText = data.intentions_pedagogiques || '';
    else if (type === 'educatif') {
      objectifText = data.habilete_ciblee ? `🎯 ${data.habilete_ciblee}` : '';
      if (data.moyen_action) objectifText += `\n⚡ Moyen : ${data.moyen_action}`;
    }
    const $obj = $('#ficheObjectif');
    $obj.textContent = objectifText;
    $obj.setAttribute('data-editable', 'objectif');

    // ── Tuile ORGANISATION
    const $org = $('#ficheOrganisation');
    $org.innerHTML = '';
    const orgItems = [];
    if (data.nb_joueurs || data.joueurs) orgItems.push(`👥 ${data.nb_joueurs || data.joueurs}`);
    if (data.espace) orgItems.push(`📍 ${data.espace}`);
    if (data.organisation_spatiale) orgItems.push(`🗺️ ${data.organisation_spatiale}`);
    if (data.competence_pfeq) orgItems.push(`🎯 PFEQ : ${data.competence_pfeq}`);
    if (data.cycle && !cycleStr.includes(data.cycle)) orgItems.push(`🎓 ${data.cycle}`);
    if (orgItems.length === 0) orgItems.push('Organisation à adapter selon le contexte');
    orgItems.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
      $org.appendChild(li);
    });

    // ── PLAN DE MATCH
    const $plan = $('#fichePlan');
    $plan.innerHTML = '';
    const steps = splitPlanSteps(data);
    if (steps.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Plan de match à structurer.';
      $plan.appendChild(li);
    } else {
      steps.forEach((step, i) => {
        const li = document.createElement('li');
        const phaseStr = step.phase ? `${step.phase}${step.duree ? ` (${step.duree})` : ''}` : '';
        li.innerHTML = `${phaseStr ? `<span class="plan-phase-name">${escapeHtml(phaseStr)}</span>` : ''}<span data-editable="plan-${i}">${escapeHtml(step.text || '')}</span>`;
        $plan.appendChild(li);
      });
    }

    // ── VARIANTES (panel dépliant)
    const $var = $('#ficheVariantes');
    $var.innerHTML = '';
    let varList = [];
    if (Array.isArray(data.variantes)) varList = data.variantes;
    else if (Array.isArray(data.savoirs_essentiels)) varList = data.savoirs_essentiels;
    else if (Array.isArray(data.erreurs_courantes)) varList = data.erreurs_courantes;
    const variantesTitle = type === 'sae' ? 'Savoirs essentiels :'
                         : type === 'educatif' ? 'Erreurs courantes :'
                         : 'Pour complexifier :';
    $('#ficheVariantesTitle').textContent = variantesTitle;
    varList.forEach((v, i) => {
      const li = document.createElement('li');
      li.textContent = typeof v === 'string' ? v : (v.titre || v.nom || JSON.stringify(v));
      li.setAttribute('data-editable', `variante-${i}`);
      $var.appendChild(li);
    });
    if (varList.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'Aucune variante fournie.';
      $var.appendChild(li);
    }

    // ── SÉCURITÉ (panel dépliant)
    const $sec = $('#ficheSecuriteList');
    $sec.innerHTML = '';
    let secEntries = [];
    if (data.securite) {
      // Split en phrases pour faire une liste
      secEntries = String(data.securite).split(/(?<=[.!?])\s+/).filter(s => s.length > 5);
    }
    if (data.differenciation) secEntries.push(`Différenciation : ${data.differenciation}`);
    if (data.evaluation?.critere) secEntries.push(`Évaluation : ${data.evaluation.critere}`);
    if (secEntries.length === 0) secEntries.push('Vérifie l\'espace et le matériel avant de commencer.');
    secEntries.forEach((s, i) => {
      const li = document.createElement('li');
      li.textContent = s;
      li.setAttribute('data-editable', `securite-${i}`);
      $sec.appendChild(li);
    });

    // ── Cache les panels au démarrage
    document.getElementById('panelVariantes').hidden = true;
    document.getElementById('panelSecurite').hidden = true;

    // ── Boutons footer visible
    $('#ficheActions').hidden = false;

    // ── Badge "Édité" si la fiche a été modifiée
    const editedBadge = document.getElementById('ficheEditedBadge');
    if (editedBadge) editedBadge.hidden = !data._edited && !json.edited;

    // ── Sync icône favori sur la gen courante
    syncFavoriBtn(state.lastResult?.favori || data?.favori || false);

    // ── Setup once handlers (idempotent via dataset)
    setupFiche2Handlers();
  }

  function syncFavoriBtn(isFav) {
    const btn = document.getElementById('ficheBtnFavori');
    if (!btn) return;
    const ico = document.getElementById('ficheBtnFavoriIcon');
    const lbl = document.getElementById('ficheBtnFavoriLabel');
    btn.classList.toggle('is-fav', !!isFav);
    if (ico) ico.textContent = isFav ? '❤️' : '🤍';
    if (lbl) lbl.textContent = isFav ? 'FAVORI ✓' : 'FAVORI';
  }

  function setupFiche2Handlers() {
    if (document.body.dataset.fiche2HandlersReady) return;
    document.body.dataset.fiche2HandlersReady = '1';

    // Toggle variantes/sécurité
    document.addEventListener('click', (e) => {
      const trigger = e.target.closest('[data-toggle]');
      if (trigger) {
        const which = trigger.dataset.toggle;
        const panel = document.getElementById(which === 'variantes' ? 'panelVariantes' : 'panelSecurite');
        if (panel) panel.hidden = !panel.hidden;
        return;
      }
      const closer = e.target.closest('[data-close-panel]');
      if (closer) {
        const which = closer.dataset.closePanel;
        const panel = document.getElementById(which === 'variantes' ? 'panelVariantes' : 'panelSecurite');
        if (panel) panel.hidden = true;
      }
    });

    // Imprimer
    const btnPrint = document.getElementById('ficheBtnPrint');
    if (btnPrint) btnPrint.addEventListener('click', () => window.print());

    // Enregistrer (toast + print après 3.5s)
    const btnSave = document.getElementById('ficheBtnSave');
    if (btnSave) btnSave.addEventListener('click', () => {
      const toast = document.getElementById('ficheToast');
      if (toast) toast.hidden = false;
      setTimeout(() => {
        if (toast) toast.hidden = true;
        window.print();
      }, 3500);
    });

    // Éditer / Sauver (toggle inline edit)
    const btnEdit = document.getElementById('ficheBtnEdit');
    if (btnEdit) btnEdit.addEventListener('click', () => toggleEditMode(btnEdit));

    // Favori (toggle ❤️/🤍 sur gen courante)
    const btnFav = document.getElementById('ficheBtnFavori');
    if (btnFav) btnFav.addEventListener('click', toggleCurrentFavori);

    // PDF export
    const btnPdf = document.getElementById('ficheBtnPdf');
    if (btnPdf) btnPdf.addEventListener('click', exportCurrentPdf);

    // Régénérer (mini-confirmation toast)
    const btnRegen = document.getElementById('ficheBtnRegen');
    if (btnRegen) btnRegen.addEventListener('click', toggleRegenConfirm);
    document.addEventListener('click', handleRegenConfirmActions, true);
  }

  // ──────────────────────────────────────────────────────────
  // FAVORI (toggle sur la fiche courante)
  // ──────────────────────────────────────────────────────────
  async function toggleCurrentFavori() {
    if (!state.lastResult) return;
    const newFav = !state.lastResult.favori;
    state.lastResult.favori = newFav;
    if (state.lastResult.data) state.lastResult.data.favori = newFav;
    syncFavoriBtn(newFav);

    const uid = getUid();
    const genId = state.lastResult.generationId || state.lastResult.data?.id;
    if (uid && genId && !String(genId).startsWith('local-')) {
      try {
        await fetch(`${API_BASE}/generation/${encodeURIComponent(genId)}/favori`, {
          method: 'POST',
          headers: await authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ favori: newFav }),
        });
      } catch (e) { console.warn('favori PATCH failed', e); }
    } else if (genId) {
      updateAnonGeneration(genId, { favori: newFav });
    }
    await refreshGenerationsGrid();
  }

  // ──────────────────────────────────────────────────────────
  // PDF EXPORT (jsPDF, A4 portrait)
  // ──────────────────────────────────────────────────────────
  async function exportCurrentPdf() {
    if (!state.lastResult) return;
    if (!window.jspdf || !window.jspdf.jsPDF) {
      alert('jsPDF non chargé. Réessaye dans 1 seconde.');
      return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const data = state.lastResult.data || {};
    const type = state.lastResult.type;
    const univers = state.lastResult.univers;

    const PAGE_W = 210, PAGE_H = 297, M = 20;
    const CONTENT_W = PAGE_W - 2 * M;
    let y = M;

    // ── Header logo
    try {
      const img = await loadImageAsDataURL('/bucheron-generateur.png');
      if (img) doc.addImage(img, 'PNG', M, y, 18, 18);
    } catch {}
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(0, 74, 97);
    doc.text('ZONE TOTAL SPORT', M + 22, y + 8);
    doc.setFontSize(8); doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('zonetotalsport.ca · Fiche générée par IA', M + 22, y + 14);
    doc.setDrawColor(0, 196, 255); doc.setLineWidth(0.8);
    doc.line(M, y + 22, PAGE_W - M, y + 22);
    y += 30;

    // ── Tagline
    const TYPE_LABEL = { jeu: 'JEU', sae: 'SAÉ', educatif: 'ÉDUCATIF' };
    const UNI_LABEL = { eps: 'ÉPS PRIMAIRE', camps: 'CAMP DE JOUR', sdg: 'SERVICE DE GARDE' };
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    const tagText = `${TYPE_LABEL[type]} · ${UNI_LABEL[univers]}`;
    const tagW = doc.getTextWidth(tagText) + 8;
    doc.setFillColor(0, 74, 97);
    doc.roundedRect(M, y, tagW, 6, 1.5, 1.5, 'F');
    doc.text(tagText, M + 4, y + 4.2);
    y += 12;

    // ── Titre
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24); doc.setTextColor(0, 0, 0);
    const titre = data.titre || data.nom || 'Fiche';
    const titleLines = doc.splitTextToSize(titre, CONTENT_W);
    doc.text(titleLines, M, y);
    y += titleLines.length * 9 + 4;

    // ── Sous-titre / objectif court
    const subtitle = data.but || data.intentions_pedagogiques
      || (data.habilete_ciblee ? `Maîtriser : ${data.habilete_ciblee}` : '');
    if (subtitle) {
      doc.setFont('helvetica', 'italic'); doc.setFontSize(11); doc.setTextColor(60);
      const subLines = doc.splitTextToSize(subtitle, CONTENT_W);
      doc.text(subLines, M, y);
      y += subLines.length * 5 + 6;
    }

    // ── META boxes
    const metas = [];
    const dureeStr = (data.duree_min && data.duree_max) ? `${data.duree_min}-${data.duree_max} min`
                   : data.duree_totale || data.duree_par_palier || data.duree;
    if (dureeStr) metas.push(['DUREE', String(dureeStr)]);
    if (data.nb_joueurs || data.joueurs) metas.push(['JOUEURS', String(data.nb_joueurs || data.joueurs)]);
    if (data.espace || data.organisation_spatiale) metas.push(['ESPACE', String(data.espace || data.organisation_spatiale)]);
    if (data.cycle || data.niveaux) metas.push(['NIVEAU', String(data.cycle || (Array.isArray(data.niveaux) ? data.niveaux.join(', ') : data.niveaux))]);
    if (data.competence_pfeq) metas.push(['PFEQ', String(data.competence_pfeq)]);

    if (metas.length) {
      const colW = CONTENT_W / Math.min(metas.length, 4);
      let mx = M;
      metas.slice(0, 4).forEach(([label, val]) => {
        doc.setFillColor(255, 252, 0);
        doc.setDrawColor(0); doc.setLineWidth(0.4);
        doc.roundedRect(mx, y, colW - 2, 14, 1.5, 1.5, 'FD');
        doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(0, 74, 97);
        doc.text(label, mx + 2, y + 4);
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(0);
        const valLines = doc.splitTextToSize(String(val), colW - 6);
        doc.text(valLines.slice(0, 2), mx + 2, y + 9);
        mx += colW;
      });
      y += 18;
    }

    // ── Sections (différentes selon type)
    const sections = buildPdfSections(data, type);
    for (const sec of sections) {
      y = drawPdfSection(doc, sec, y, M, CONTENT_W, PAGE_H);
    }

    // ── Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(120);
      doc.text(`zonetotalsport.ca · ${new Date().toLocaleDateString('fr-CA')}`, M, PAGE_H - 8);
      doc.text(`${i} / ${pageCount}`, PAGE_W - M, PAGE_H - 8, { align: 'right' });
    }

    const slug = (titre || 'fiche').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'fiche';
    doc.save(`zts-${type}-${slug}.pdf`);
  }

  function buildPdfSections(data, type) {
    const sections = [];
    if (Array.isArray(data.materiel) && data.materiel.length) {
      sections.push({ title: '🎒 MATÉRIEL', items: data.materiel });
    }
    if (type === 'jeu') {
      if (data.but) sections.push({ title: '🎯 BUT DU JEU', text: data.but });
      if (data.regles) sections.push({ title: '📋 RÈGLES', text: data.regles });
      if (Array.isArray(data.variantes) && data.variantes.length)
        sections.push({ title: '🔀 VARIANTES', items: data.variantes });
      if (data.securite) sections.push({ title: '🛟 SÉCURITÉ', text: data.securite });
    } else if (type === 'sae') {
      if (data.intentions_pedagogiques) sections.push({ title: '🎯 INTENTIONS PÉDAGOGIQUES', text: data.intentions_pedagogiques });
      if (Array.isArray(data.deroulement) && data.deroulement.length) {
        sections.push({ title: '📋 DÉROULEMENT', items: data.deroulement.map(p =>
          typeof p === 'string' ? p : `${p.phase || ''}${p.duree ? ' ('+p.duree+')' : ''} — ${p.description || ''}${p.organisation ? ' · '+p.organisation : ''}`) });
      }
      if (data.evaluation) {
        const ev = data.evaluation;
        let evText = ev.critere || '';
        if (Array.isArray(ev.observables) && ev.observables.length) evText += '\nObservables : ' + ev.observables.join(', ');
        if (Array.isArray(ev.echelle) && ev.echelle.length) evText += '\nÉchelle : ' + ev.echelle.join(' / ');
        sections.push({ title: '📊 ÉVALUATION', text: evText });
      }
      if (Array.isArray(data.savoirs_essentiels) && data.savoirs_essentiels.length)
        sections.push({ title: '📚 SAVOIRS ESSENTIELS', items: data.savoirs_essentiels });
      if (data.differenciation) sections.push({ title: '♿ DIFFÉRENCIATION', text: data.differenciation });
    } else if (type === 'educatif') {
      if (data.habilete_ciblee) sections.push({ title: '🎯 HABILETÉ CIBLÉE', text: data.habilete_ciblee + (data.moyen_action ? `\nMoyen d'action : ${data.moyen_action}` : '') });
      if (Array.isArray(data.progression) && data.progression.length) {
        sections.push({ title: '📈 PROGRESSION', items: data.progression.map(p =>
          typeof p === 'string' ? p : `Palier ${p.palier || '?'} : ${p.consigne || ''}${p.critere_reussite ? ' (✓ ' + p.critere_reussite + ')' : ''}`) });
      }
      if (Array.isArray(data.erreurs_courantes) && data.erreurs_courantes.length)
        sections.push({ title: '⚠️ ERREURS COURANTES', items: data.erreurs_courantes });
      if (data.differenciation) sections.push({ title: '♿ DIFFÉRENCIATION', text: data.differenciation });
    }
    return sections;
  }

  function drawPdfSection(doc, sec, y, M, W, PAGE_H) {
    const PAGE_BREAK_AT = PAGE_H - 25;
    if (y > PAGE_BREAK_AT - 20) { doc.addPage(); y = M; }
    // Titre section
    doc.setFillColor(0, 196, 255);
    doc.rect(M, y, W, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
    doc.text(sec.title.replace(/[^\x00-\x7F]/g, '').trim() || 'SECTION', M + 3, y + 5);
    y += 11;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(20);
    if (sec.items) {
      for (const item of sec.items) {
        const text = typeof item === 'string' ? item : String(item);
        const lines = doc.splitTextToSize('• ' + text, W - 4);
        if (y + lines.length * 5 > PAGE_BREAK_AT) { doc.addPage(); y = M; }
        doc.text(lines, M + 2, y);
        y += lines.length * 5 + 1;
      }
    } else if (sec.text) {
      const lines = doc.splitTextToSize(sec.text, W);
      if (y + lines.length * 5 > PAGE_BREAK_AT) { doc.addPage(); y = M; }
      doc.text(lines, M, y);
      y += lines.length * 5;
    }
    y += 6;
    return y;
  }

  function loadImageAsDataURL(url) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const c = document.createElement('canvas');
          c.width = img.width; c.height = img.height;
          c.getContext('2d').drawImage(img, 0, 0);
          resolve(c.toDataURL('image/png'));
        } catch { resolve(null); }
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  }

  // ──────────────────────────────────────────────────────────
  // RÉGÉNÉRATION (mini-confirmation toast inline)
  // ──────────────────────────────────────────────────────────
  let regenConfirmTimer = null;
  function toggleRegenConfirm() {
    const box = document.getElementById('regenConfirm');
    if (!box) return;
    // Check quota d'abord
    const lastQuota = state.lastResult?.quota;
    if (lastQuota && lastQuota.used >= lastQuota.max) {
      showRegenQuotaExhausted(box);
    } else {
      showRegenNormalConfirm(box);
    }
    box.hidden = false;
    clearTimeout(regenConfirmTimer);
    regenConfirmTimer = setTimeout(() => { box.hidden = true; }, 5000);
  }
  function showRegenNormalConfirm(box) {
    box.innerHTML = `
      <p>🔄 Régénérer ? <span class="zts-fiche2-confirm-cost">(1 crédit)</span></p>
      <div class="zts-fiche2-confirm-actions">
        <button class="zts-fiche2-confirm-btn zts-fiche2-confirm-btn--cancel" data-regen="cancel">Annuler</button>
        <button class="zts-fiche2-confirm-btn zts-fiche2-confirm-btn--ok" data-regen="ok">✅ OK</button>
      </div>`;
  }
  function showRegenQuotaExhausted(box) {
    const isAnon = !getUid();
    box.innerHTML = `
      <p>Crédits épuisés ce mois.</p>
      <div class="zts-fiche2-confirm-actions">
        <a href="https://paypal.me/zonetotalsport" target="_blank" class="zts-fiche2-confirm-btn zts-fiche2-confirm-btn--don" data-regen="cancel">💝 Don +10</a>
        ${isAnon ? '<button class="zts-fiche2-confirm-btn zts-fiche2-confirm-btn--signup" data-regen="signup">🎁 Inscris-toi +10</button>' : ''}
      </div>`;
  }
  function handleRegenConfirmActions(e) {
    const btn = e.target.closest('[data-regen]');
    const box = document.getElementById('regenConfirm');
    if (!box || box.hidden) return;
    // Click hors confirmation → ferme
    if (!btn && !e.target.closest('#regenConfirm') && !e.target.closest('#ficheBtnRegen')) {
      box.hidden = true; return;
    }
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const action = btn.dataset.regen;
    clearTimeout(regenConfirmTimer);
    box.hidden = true;
    if (action === 'ok') doRegenerate();
    else if (action === 'signup') openSignupModal();
  }
  async function doRegenerate() {
    if (state.isGenerating) return;
    // Reset zone résultat à loading sans détruire l'historique localStorage
    state.lastResult = null;
    await generate();
  }

  let editMode = false;
  let editHint = null;
  function toggleEditMode(btn) {
    editMode = !editMode;
    const fiche = document.getElementById('ficheCard');
    const lbl = document.getElementById('ficheBtnEditLabel');
    const ico = document.getElementById('ficheBtnEditIcon');
    if (editMode) {
      fiche.classList.add('is-editing');
      btn.classList.add('is-saving');
      ico.textContent = '💾';
      lbl.textContent = 'SAUVER';
      fiche.querySelectorAll('[data-editable]').forEach(el => {
        el.setAttribute('contenteditable', 'plaintext-only');
      });
      editHint = document.createElement('div');
      editHint.className = 'zts-fiche2-edit-hint no-print';
      editHint.textContent = '✏️ Mode édition — clique sur les champs surlignés';
      document.body.appendChild(editHint);
    } else {
      // Sauver
      fiche.querySelectorAll('[data-editable]').forEach(el => {
        el.removeAttribute('contenteditable');
      });
      fiche.classList.remove('is-editing');
      btn.classList.remove('is-saving');
      ico.textContent = '✏️';
      lbl.textContent = 'ÉDITER';
      if (editHint) { editHint.remove(); editHint = null; }
      persistEdits();
    }
  }

  function readEdited(key) {
    const el = document.querySelector(`[data-editable="${key}"]`);
    return el ? el.textContent.trim() : null;
  }
  function readListEdits(prefix) {
    const out = [];
    let i = 0;
    while (true) {
      const v = readEdited(`${prefix}-${i}`);
      if (v === null) break;
      if (v) out.push(v);
      i++;
    }
    return out;
  }

  async function persistEdits() {
    if (!state.lastResult) return;
    const json = state.lastResult;
    const data = { ...(json.data || {}) };

    // Reconstitue titre depuis les 2 spans
    const main = readEdited('titre-main') || '';
    const accent = readEdited('titre-accent') || '';
    data.titre = (main + ' ' + accent).trim();

    // Subtitle → champ contextuel
    const sub = readEdited('subtitle');
    if (sub !== null) {
      if (json.type === 'sae') data.intentions_pedagogiques = sub;
      else if (json.type === 'educatif') data.habilete_ciblee = sub;
      else data.but = sub;
    }

    // Objectif tuile
    const obj = readEdited('objectif');
    if (obj !== null) {
      if (json.type === 'sae') data.intentions_pedagogiques = obj;
      else if (json.type === 'educatif') data.habilete_ciblee = obj;
      else data.but = obj;
    }

    // Matériel
    const newMat = readListEdits('materiel');
    if (newMat.length) data.materiel = newMat;

    // Plan steps → réinjecte selon le schéma
    const newPlan = readListEdits('plan');
    if (newPlan.length) {
      if (Array.isArray(data.deroulement)) {
        data.deroulement = data.deroulement.map((p, i) => typeof p === 'object'
          ? { ...p, description: newPlan[i] || p.description }
          : (newPlan[i] || p));
      } else if (Array.isArray(data.progression)) {
        data.progression = data.progression.map((p, i) => typeof p === 'object'
          ? { ...p, consigne: newPlan[i] || p.consigne }
          : (newPlan[i] || p));
      } else {
        data.regles = newPlan.join('\n\n');
      }
    }

    // Variantes / savoirs / erreurs
    const newVar = readListEdits('variante');
    if (newVar.length) {
      if (Array.isArray(data.variantes)) data.variantes = newVar;
      else if (Array.isArray(data.savoirs_essentiels)) data.savoirs_essentiels = newVar;
      else if (Array.isArray(data.erreurs_courantes)) data.erreurs_courantes = newVar;
      else data.variantes = newVar;
    }

    // Sécurité → join en string
    const newSec = readListEdits('securite');
    if (newSec.length) data.securite = newSec.join(' ');

    data._edited = true;
    json.data = data;
    json.edited = true;
    state.lastResult = json;

    // Badge "Édité" visible
    const editedBadge = document.getElementById('ficheEditedBadge');
    if (editedBadge) editedBadge.hidden = false;

    // Mise à jour titre dans hero si modifié
    const [tm, ta] = splitTitle(data.titre || '');
    const $tm = document.getElementById('ficheTitleMain');
    const $ta = document.getElementById('ficheTitleAccent');
    if ($tm) $tm.textContent = tm;
    if ($ta) $ta.textContent = ta;

    // Persistance
    const uid = getUid();
    const genId = json.generationId || json.data?.id;
    showEditToast('💾 Modifications enregistrées');

    if (uid && genId) {
      try {
        await fetch(`${API_BASE}/generation/${encodeURIComponent(genId)}`, {
          method: 'PATCH',
          headers: await authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ data }),
        });
      } catch (e) {
        console.warn('PATCH failed:', e);
      }
    } else {
      // Anon : retrouve par id dans localStorage et update
      const targetId = genId;
      if (targetId) {
        updateAnonGeneration(targetId, { data });
      }
    }
    await refreshGenerationsGrid();
  }

  function showEditToast(text) {
    const t = document.createElement('div');
    t.className = 'zts-fiche2-edit-hint no-print';
    t.style.background = '#22C55E';
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  }

  function typeText(el, text, speed) {
    return new Promise((resolve) => {
      el.textContent = '';
      el.classList.add('is-typing');
      let i = 0;
      const step = () => {
        if (i >= text.length) {
          el.classList.remove('is-typing');
          resolve();
          return;
        }
        el.textContent += text.charAt(i++);
        setTimeout(step, speed);
      };
      step();
    });
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // ──────────────────────────────────────────────────────────
  // Modal signup
  // ──────────────────────────────────────────────────────────
  function openSignupModal() {
    $signupModal.hidden = false;
    document.body.style.overflow = 'hidden';
  }
  function closeSignupModal() {
    $signupModal.hidden = true;
    document.body.style.overflow = '';
  }
  function setupSignupModal() {
    $signupModal.addEventListener('click', (e) => {
      if (e.target.matches('[data-close]') || e.target === $signupModal) closeSignupModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$signupModal.hidden) closeSignupModal();
    });
  }

  // ──────────────────────────────────────────────────────────
  // Sauvegarde générations (anon localStorage / auth Firestore-via-worker)
  // ──────────────────────────────────────────────────────────
  function loadAnonGenerations() {
    try {
      const arr = JSON.parse(localStorage.getItem(ANON_GENS_KEY) || '[]');
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }
  function saveAnonGenerationsArr(arr) {
    try { localStorage.setItem(ANON_GENS_KEY, JSON.stringify(arr.slice(0, MAX_GENS_DISPLAY))); }
    catch {}
  }
  function saveAnonGeneration(resp) {
    const list = loadAnonGenerations();
    const entry = {
      id: resp.data?.id || `local-${Date.now()}`,
      type: resp.type,
      univers: resp.univers,
      contexte: state.contexte || '',
      modele: state.modele,
      modele_utilise: resp.modele_utilise,
      data: resp.data,
      favori: false,
      date_generation: resp.data?.date_generation || new Date().toISOString(),
      _local: true,
    };
    list.unshift(entry);
    saveAnonGenerationsArr(list);
  }
  function updateAnonGeneration(id, patch) {
    const list = loadAnonGenerations();
    const i = list.findIndex(g => g.id === id);
    if (i >= 0) {
      list[i] = { ...list[i], ...patch };
      saveAnonGenerationsArr(list);
    }
  }

  async function fetchAuthGenerations(uid) {
    try {
      const r = await fetch(`${API_BASE}/generations?limit=${MAX_GENS_DISPLAY}`, {
        headers: await authHeaders(),
      });
      const j = await r.json();
      return j.ok ? j.generations : [];
    } catch { return []; }
  }

  async function refreshGenerationsGrid() {
    const uid = getUid();
    const list = uid ? await fetchAuthGenerations(uid) : loadAnonGenerations();
    renderGrid(list, !!uid);
  }

  // ──────────────────────────────────────────────────────────
  // Rendu grille "Mes générations"
  // ──────────────────────────────────────────────────────────
  const $mesSection = () => document.getElementById('mesGenerations');
  const $mesGrid = () => document.getElementById('mesGenGrid');
  const $mesSubtitle = () => document.getElementById('mesGenSubtitle');

  const EMOJI_TYPE = { jeu: '🎮', sae: '📚', educatif: '🏋️' };
  const LABEL_TYPE = { jeu: 'JEU', sae: 'SAÉ', educatif: 'ÉDUC.' };
  const LABEL_UNI = { eps: 'ÉPS', camps: 'CAMP', sdg: 'SDG' };

  function relativeDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const diff = (Date.now() - d.getTime()) / 1000;
    if (diff < 60)        return 'à l\'instant';
    if (diff < 3600)      return `il y a ${Math.round(diff / 60)} min`;
    if (diff < 86400)     return `il y a ${Math.round(diff / 3600)} h`;
    if (diff < 86400 * 2) return 'hier';
    if (diff < 86400 * 7) return `il y a ${Math.round(diff / 86400)} jours`;
    return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  }

  function renderGrid(list, isAuth) {
    const section = $mesSection();
    const grid = $mesGrid();
    if (!section || !grid) return;

    if (!list.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    $mesSubtitle().textContent = isAuth
      ? `${list.length} génération${list.length > 1 ? 's' : ''} sauvegardée${list.length > 1 ? 's' : ''} dans ton compte`
      : `${list.length} génération${list.length > 1 ? 's' : ''} sauvée${list.length > 1 ? 's' : ''} sur cet appareil — connecte-toi pour les conserver`;

    grid.innerHTML = '';
    for (const gen of list) {
      const titre = gen.data?.titre || gen.titre || gen.data?.nom || 'Sans titre';
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'zts-gen-mini-card' + (gen.migrated_from_anon ? ' zts-gen-mini-card-migrated' : '');
      card.dataset.id = gen.id;
      card.innerHTML = `
        <button type="button" class="zts-gen-mini-fav ${gen.favori ? 'is-fav' : ''}" data-fav data-id="${escapeHtml(gen.id)}" aria-label="Favori">
          ${gen.favori ? '❤️' : '🤍'}
        </button>
        <div class="zts-gen-mini-card-emoji">${EMOJI_TYPE[gen.type] || '📄'}</div>
        <div class="zts-gen-mini-card-title">${escapeHtml(String(titre).slice(0, 40))}${String(titre).length > 40 ? '…' : ''}</div>
        <div class="zts-gen-mini-card-meta">
          <span class="zts-gen-mini-badge zts-gen-mini-badge--type-${gen.type}">${LABEL_TYPE[gen.type] || gen.type}</span>
          <span class="zts-gen-mini-badge zts-gen-mini-badge--uni-${gen.univers}">${LABEL_UNI[gen.univers] || gen.univers}</span>
        </div>
        <div class="zts-gen-mini-card-date">${relativeDate(gen.date_generation)}</div>
      `;
      card.addEventListener('click', (e) => {
        if (e.target.closest('[data-fav]')) return;
        reopenGeneration(gen);
      });
      grid.appendChild(card);
    }
    // Délégation toggle favori
    grid.querySelectorAll('[data-fav]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        const isFav = btn.classList.contains('is-fav');
        await toggleFavori(id, !isFav, btn);
      });
    });
  }

  function reopenGeneration(gen) {
    // Réaffiche la fiche depuis les données stockées (pas de regen)
    const fakeResp = {
      ok: true,
      type: gen.type,
      univers: gen.univers,
      data: gen.data || gen,
    };
    state.lastResult = fakeResp;
    hideLoading();
    $errorState.hidden = true;
    $resultZone.hidden = false;
    $ficheCard.hidden = false;
    renderFicheInstant(fakeResp);
    $resultZone.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Variante "instant" du renderer (utilisée pour réouverture depuis Mes générations)
  function renderFicheInstant(json) { renderFiche2(json); }

  // ──────────────────────────────────────────────────────────
  // Favori (auth → worker / anon → localStorage)
  // ──────────────────────────────────────────────────────────
  async function toggleFavori(id, newFav, btn) {
    const uid = getUid();
    btn.classList.toggle('is-fav', newFav);
    btn.textContent = newFav ? '❤️' : '🤍';
    if (uid) {
      try {
        await fetch(`${API_BASE}/generation/${encodeURIComponent(id)}/favori`, {
          method: 'POST',
          headers: await authHeaders({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ favori: newFav }),
        });
      } catch (e) {
        console.warn('favori toggle failed', e);
        btn.classList.toggle('is-fav', !newFav);
        btn.textContent = !newFav ? '❤️' : '🤍';
      }
    } else {
      updateAnonGeneration(id, { favori: newFav });
    }
  }

  // ──────────────────────────────────────────────────────────
  // Migration anon → Firestore (déclenchée au login)
  // ──────────────────────────────────────────────────────────
  let migrationRunning = false;
  async function migrateAnonIfNeeded() {
    if (migrationRunning) return;
    const uid = getUid();
    if (!uid) return;
    const list = loadAnonGenerations();
    if (!list.length) return;

    migrationRunning = true;
    try {
      const resp = await fetch(`${API_BASE}/migrate-anon-generation`, {
        method: 'POST',
        headers: await authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ generations: list }),
      });
      const j = await resp.json();
      if (j.ok) {
        const failedIdx = new Set((j.failed || []).map(f => f.index));
        const remaining = list.filter((_, i) => failedIdx.has(i));
        saveAnonGenerationsArr(remaining);
      }
    } catch (e) {
      console.warn('migration failed:', e);
    } finally {
      migrationRunning = false;
      await refreshGenerationsGrid();
    }
  }

  // ──────────────────────────────────────────────────────────
  // Init
  // ──────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────
  // Zoom TBI (50% — 300%, persisté localStorage)
  // ──────────────────────────────────────────────────────────
  const ZOOM_KEY = 'zts_gen_zoom';
  const ZOOM_MIN = 50, ZOOM_MAX = 300, ZOOM_STEP = 10;

  function getZoom() {
    const v = parseInt(localStorage.getItem(ZOOM_KEY) || '100', 10);
    return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, isNaN(v) ? 100 : v));
  }
  function applyZoom(pct) {
    const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, pct));
    document.documentElement.style.zoom = clamped / 100;
    // Fallback Firefox (pas de support `zoom`) : transform-scale
    if (!CSS.supports('zoom', '1')) {
      document.body.style.transform = `scale(${clamped / 100})`;
      document.body.style.transformOrigin = 'top left';
      document.body.style.width = `${10000 / clamped}%`;
    }
    const lbl = document.getElementById('zoomLevel');
    if (lbl) lbl.textContent = `${clamped}%`;
    localStorage.setItem(ZOOM_KEY, String(clamped));
  }
  function setupZoom() {
    const inBtn = document.getElementById('zoomIn');
    const outBtn = document.getElementById('zoomOut');
    const resetBtn = document.getElementById('zoomReset');
    if (inBtn) inBtn.addEventListener('click', () => applyZoom(getZoom() + ZOOM_STEP));
    if (outBtn) outBtn.addEventListener('click', () => applyZoom(getZoom() - ZOOM_STEP));
    if (resetBtn) resetBtn.addEventListener('click', () => applyZoom(100));
    // Raccourcis clavier Ctrl/Cmd + / -
    document.addEventListener('keydown', (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === '+' || e.key === '=') { e.preventDefault(); applyZoom(getZoom() + ZOOM_STEP); }
      else if (e.key === '-') { e.preventDefault(); applyZoom(getZoom() - ZOOM_STEP); }
      else if (e.key === '0') { e.preventDefault(); applyZoom(100); }
    });
    applyZoom(getZoom());
  }

  function init() {
    setupSelectors('type');
    setupSelectors('univers');
    setupModele();
    setupTextarea();
    setupGenerate();
    setupAccountMenu();
    setupSignupModal();
    setupZoom();
    updatePlaceholder();
    updateQuotaHint();
    refreshGenerationsGrid();

    // Si Firebase devient dispo plus tard, refresh + migration anon→Firestore
    if (window.firebase?.auth) {
      window.firebase.auth().onAuthStateChanged(async () => {
        refreshAccountMenu();
        updateQuotaHint();
        if (getUid()) await migrateAnonIfNeeded();
        else refreshGenerationsGrid();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
