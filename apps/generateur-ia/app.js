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
  const ANON_LIMIT = 3;

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

    // Gate anonyme côté client : à la 4e tentative, popup signup
    if (!getUid() && getAnonCount() >= ANON_LIMIT) {
      openSignupModal();
      return;
    }

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

      if (resp.status === 401 || json?.code === 'ANON_LIMIT') {
        openSignupModal();
        hideLoading();
        return;
      }
      if (resp.status === 429 || json?.code === 'QUOTA_EXCEEDED') {
        showError(json?.message || 'Quota mensuel atteint. Fais un don pour soutenir le projet : https://paypal.me/zonetotalsport');
        return;
      }
      if (!resp.ok || !json?.ok) {
        showError(json?.message || `Erreur ${resp.status}. Le bûcheron a glissé, réessaye.`);
        return;
      }

      state.lastResult = json;
      if (!getUid()) incAnonCount();
      updateQuotaHint(json.quota);
      await renderFicheTypewriter(json);
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
  // Rendu fiche avec effet machine à écrire
  // ──────────────────────────────────────────────────────────
  async function renderFicheTypewriter(json) {
    hideLoading();
    $errorState.hidden = true;
    $ficheCard.hidden = false;

    const data = json.data || {};
    const TYPE_LABEL = { jeu: 'JEU', sae: 'SAÉ', educatif: 'ÉDUCATIF' };
    const UNI_LABEL = { eps: 'ÉPS', camps: 'CAMP', sdg: 'SDG' };

    // 1. Badge + titre instant
    $('#ficheBadge').textContent = `${TYPE_LABEL[json.type]} · ${UNI_LABEL[json.univers]}`;
    $('#ficheTitle').textContent = data.titre || data.nom || data.name || 'Fiche générée';

    // 2. Méta — adaptée selon le type (JEU/SAE/EDUCATIF)
    const meta = [];
    const dureeStr = (data.duree_min && data.duree_max) ? `${data.duree_min}-${data.duree_max} min`
                   : (data.duree_totale) ? data.duree_totale
                   : (data.duree_par_palier) ? `${data.duree_par_palier} / palier`
                   : data.duree;
    if (dureeStr)                        meta.push(['⏱️ Durée', dureeStr]);
    if (data.nb_joueurs || data.joueurs) meta.push(['👥 Joueurs', data.nb_joueurs || data.joueurs]);
    if (data.espace || data.organisation_spatiale || data.lieu)
      meta.push(['📍 Espace', data.espace || data.organisation_spatiale || data.lieu]);
    const niveau = data.cycle || (Array.isArray(data.niveaux) ? data.niveaux.join(', ') : data.niveaux) || data.niveau;
    if (niveau)                          meta.push(['🎓 Niveau', niveau]);
    if (data.competence_pfeq)            meta.push(['🎯 PFEQ', data.competence_pfeq]);
    if (data.habilete_ciblee)            meta.push(['🎯 Habileté', data.habilete_ciblee]);
    if (data.moyen_action)               meta.push(['⚡ Moyen', data.moyen_action]);

    const $meta = $('#ficheMeta');
    $meta.innerHTML = '';
    for (const [label, val] of meta) {
      const item = document.createElement('div');
      item.className = 'zts-gen-fiche-meta-item';
      item.innerHTML = `<strong>${label}</strong>${escapeHtml(String(val))}`;
      $meta.appendChild(item);
      await sleep(100);
    }

    // 3. But / Intentions / Habileté — char par char
    const butText = data.but || data.intentions_pedagogiques || data.objectif || '';
    await typeText($('#ficheBut'), butText, 12);

    // 4. Matériel — item par item
    const $mat = $('#ficheMateriel');
    $mat.innerHTML = '';
    const mat = Array.isArray(data.materiel) ? data.materiel : (data.materiel ? [data.materiel] : []);
    for (const item of mat) {
      const li = document.createElement('li');
      li.textContent = typeof item === 'string' ? item : JSON.stringify(item);
      $mat.appendChild(li);
      await sleep(50);
    }

    // 5. Règles / Déroulement / Progression — texte formaté
    let reglesText = '';
    if (data.regles) {
      reglesText = String(data.regles);
    } else if (Array.isArray(data.deroulement)) {
      reglesText = data.deroulement
        .map(p => typeof p === 'string' ? p
              : `▸ ${p.phase || ''} (${p.duree || '?'})\n${p.description || ''}\n${p.organisation ? '   ↳ ' + p.organisation : ''}`)
        .join('\n\n');
    } else if (Array.isArray(data.progression)) {
      reglesText = data.progression
        .map(p => typeof p === 'string' ? p
              : `Palier ${p.palier || '?'} — ${p.consigne || ''}\n   ✓ Réussite : ${p.critere_reussite || '?'}`)
        .join('\n\n');
    } else if (data.deroulement || data.description) {
      reglesText = String(data.deroulement || data.description);
    }
    await typeText($('#ficheRegles'), reglesText, 8);

    // 6. Variantes / Savoirs / Erreurs courantes — item par item
    const $var = $('#ficheVariantes');
    $var.innerHTML = '';
    const altList = Array.isArray(data.variantes) ? data.variantes
                   : Array.isArray(data.savoirs_essentiels) ? data.savoirs_essentiels
                   : Array.isArray(data.erreurs_courantes) ? data.erreurs_courantes
                   : (data.variantes ? [data.variantes] : []);
    for (const v of altList) {
      const li = document.createElement('li');
      li.textContent = typeof v === 'string' ? v : (v.titre || v.nom || JSON.stringify(v));
      $var.appendChild(li);
      await sleep(80);
    }

    // 7. Sécurité / Différenciation / Évaluation — instant
    let secText = data.securite || data.conseils || data.notes;
    if (!secText && data.differenciation) secText = `Différenciation : ${data.differenciation}`;
    if (data.evaluation?.critere) {
      const ev = data.evaluation;
      secText = (secText ? secText + ' · ' : '') + `Évaluation : ${ev.critere}` +
        (Array.isArray(ev.echelle) ? ` (${ev.echelle.slice(0,4).join(', ')})` : '');
    }
    $('#ficheSecurite').textContent = secText || 'Vérifie l\'espace et le matériel avant de commencer.';

    // 8. Boutons d'action
    $('#ficheActions').hidden = false;
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

    // Si Firebase devient dispo plus tard, refresh
    if (window.firebase?.auth) {
      window.firebase.auth().onAuthStateChanged(() => {
        refreshAccountMenu();
        updateQuotaHint();
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
