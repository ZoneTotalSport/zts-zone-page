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
        uid: getUid(),
      };

      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    $('#ficheTitleMain').textContent = titleMain;
    $('#ficheTitleAccent').textContent = titleAccent;
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
    $('#ficheSubtitle').textContent = subtitle.slice(0, 200);

    // ── Tuile MATÉRIEL
    const $mat = $('#ficheMateriel');
    $mat.innerHTML = '';
    const matList = listFromAny(data.materiel);
    if (matList.length === 0) matList.push('Aucun matériel spécifique');
    matList.slice(0, 6).forEach(item => {
      const li = document.createElement('li');
      li.textContent = item;
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
    $('#ficheObjectif').textContent = objectifText;

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
      steps.forEach(step => {
        const li = document.createElement('li');
        const phaseStr = step.phase ? `${step.phase}${step.duree ? ` (${step.duree})` : ''}` : '';
        li.innerHTML = `${phaseStr ? `<span class="plan-phase-name">${escapeHtml(phaseStr)}</span>` : ''}<span>${escapeHtml(step.text || '')}</span>`;
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
    varList.forEach(v => {
      const li = document.createElement('li');
      li.textContent = typeof v === 'string' ? v : (v.titre || v.nom || JSON.stringify(v));
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
    secEntries.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s;
      $sec.appendChild(li);
    });

    // ── Cache les panels au démarrage
    document.getElementById('panelVariantes').hidden = true;
    document.getElementById('panelSecurite').hidden = true;

    // ── Boutons footer visible
    $('#ficheActions').hidden = false;

    // ── Setup once handlers (idempotent via dataset)
    setupFiche2Handlers();
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
      const r = await fetch(`${API_BASE}/generations?uid=${encodeURIComponent(uid)}&limit=${MAX_GENS_DISPLAY}`);
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
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uid, favori: newFav }),
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, generations: list }),
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
  function init() {
    setupSelectors('type');
    setupSelectors('univers');
    setupModele();
    setupTextarea();
    setupGenerate();
    setupAccountMenu();
    setupSignupModal();
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
