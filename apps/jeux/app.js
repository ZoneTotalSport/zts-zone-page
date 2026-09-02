/**
 * RÉPERTOIRE JEUX EPS – Application principale v2.0
 * 449 jeux d'éducation physique alignés PFEQ
 * Style GIGA-JEUX / Comic / Gymnasium
 * FEATURES: Bilingual FR/EN, Timer, Random Game, Cycle Filter
 */

// ============================================================
// STATE
// ============================================================
const state = {
  games: typeof GAMES_DATA !== 'undefined' ? GAMES_DATA : [],
  filteredGames: [],
  favorites: JSON.parse(localStorage.getItem('eps-favorites') || '[]'),
  activeCategory: 'all',
  activeDuration: 'all',
  activePfeq: 'all',
  activeMaterial: 'all',
  activeCycle: 'all',
  // Vague 2 — les trois filtres croises ajoutes, plus la collection active.
  activeUnivers: 'all',
  activeAge: 'all',
  activeCollection: null,
  collections: [],
  searchQuery: '',
  sortBy: 'id',
  viewMode: 'grid',
  showFavorites: false,
  theme: localStorage.getItem('eps-theme') ||
         (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  lang: localStorage.getItem('eps-lang') || 'fr',
  // Timer state
  timerSeconds: 300,
  timerRemaining: 300,
  timerInterval: null,
  timerRunning: false,
};

// ============================================================
// I18N - Translation dictionary for dynamic content
// ============================================================
const i18n = {
  fr: {
    games: 'jeux',
    game: 'jeu',
    filters: 'Filtres',
    goalTitle: '🎯 But du jeu',
    pedagogyTitle: '📚 Intentions pédagogiques (PFEQ)',
    materialTitle: '🏐 Matériel',
    dispositionTitle: '📐 Disposition',
    durationTitle: '⏱️ Durée',
    stepsTitle: '📋 Déroulement',
    variantsTitle: '💡 Variantes',
    printBtn: 'Imprimer cette fiche',
    addFav: '☆ Ajouter',
    isFav: '⭐ Favori',
    removeFav: 'Retirer des favoris',
    addToFav: 'Ajouter aux favoris',
    minutes: 'minutes',
    randomTitle: '🎲 JEU ALÉATOIRE !',
    randomLocked: '🔒 Le déroulement de ce jeu est réservé aux membres — le compte est gratuit.',
    randomOpen: '📖 VOIR DÉTAILS',
    randomReroll: '🎲 AUTRE JEU',
    randomClose: '✖ FERMER',
    cycle1: 'Cycle 1',
    cycle2: 'Cycle 2',
    cycle3: 'Cycle 3',
    allCycles: 'Tous les cycles',
    printFooter: 'Répertoire de jeux EPS – PFEQ Primaire – 449 jeux',
    gameSheet: 'Fiche de jeu EPS',
    share: 'Partager ce jeu',
    shareCopied: 'Lien copié !',
    shareFailed: 'Copie impossible — voici le lien : ',
    seeSheet: '📄 Voir la fiche complète',
    collections: 'Collections',
    collectionsIntro: 'Des sélections prêtes à ouvrir, par moment et par métier.',
    backToAll: '← Tous les jeux',
    inCollection: 'Dans cette collection',
    wideCollection: 'Collection très large — les filtres sont ouverts pour t’aider à trancher.',
    gamesIn: 'jeux',
  },
  en: {
    games: 'games',
    game: 'game',
    filters: 'Filters',
    goalTitle: '🎯 Game objective',
    pedagogyTitle: '📚 Learning intentions (PFEQ)',
    materialTitle: '🏐 Equipment',
    dispositionTitle: '📐 Setup',
    durationTitle: '⏱️ Duration',
    stepsTitle: '📋 Steps',
    variantsTitle: '💡 Variations',
    printBtn: 'Print this sheet',
    addFav: '☆ Add',
    isFav: '⭐ Favorite',
    removeFav: 'Remove from favorites',
    addToFav: 'Add to favorites',
    minutes: 'minutes',
    randomTitle: '🎲 RANDOM GAME!',
    randomLocked: '🔒 This game’s instructions are for members — the account is free.',
    randomOpen: '📖 VIEW DETAILS',
    randomReroll: '🎲 ANOTHER GAME',
    randomClose: '✖ CLOSE',
    cycle1: 'Cycle 1',
    cycle2: 'Cycle 2',
    cycle3: 'Cycle 3',
    allCycles: 'All cycles',
    printFooter: 'PE Game Repertoire – Quebec Curriculum – 449 games',
    gameSheet: 'PE Game Sheet',
    share: 'Share this game',
    shareCopied: 'Link copied!',
    shareFailed: 'Could not copy — here is the link: ',
    seeSheet: '📄 See the full sheet',
    collections: 'Collections',
    collectionsIntro: 'Ready-made picks, by moment and by job.',
    backToAll: '← All games',
    inCollection: 'In this collection',
    wideCollection: 'Very wide collection — filters are open to help you narrow it down.',
    gamesIn: 'games',
  }
};

// ============================================================
// VAGUE 2 — COLLECTIONS, FILTRES CROISÉS, PARTAGE
// ============================================================

// Le MÊME slug que le Worker et que scripts/gen-jeux-fiches.js. Les trois
// doivent rester identiques : c'est lui qui fait correspondre un jeu de la
// SPA à sa fiche statique /jeux/<slug>.html. Vérifié sur les 1540.
function slugJeu(titre) {
  return String(titre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
}

function urlFiche(game) {
  return '/jeux/' + slugJeu(game && game.title) + '.html';
}

/* Au-delà de ce nombre de jeux, une collection s'ouvre AVEC les filtres
   croisés déjà déployés. Décision de Joey : une rangée de 448 jeux n'est pas
   une sélection, c'est un catalogue — autant donner tout de suite de quoi le
   trancher. Vaut pour Plan B météo et Jeux rapides, et pour toute collection
   qui franchira le seuil après l'enrichissement des étiquettes. */
const SEUIL_COLLECTION_LARGE = 200;

async function chargerCollections() {
  try {
    const r = await fetch('/assets/collections-jeux.json', { cache: 'no-cache' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    state.collections = Array.isArray(d.collections) ? d.collections : [];
  } catch (e) {
    // Une rangée absente n'empêche pas de chercher un jeu : on dégrade sans
    // page blanche, et on le dit dans la console plutôt que dans l'écran.
    console.warn('[jeux] collections indisponibles :', e.message);
    state.collections = [];
  }
  renderCollections();
}

function compteCollection(id) {
  return state.games.filter(g => Array.isArray(g.collections) && g.collections.includes(id)).length;
}

function renderCollections() {
  const hote = document.getElementById('ztsCollections');
  if (!hote) return;
  if (!state.collections.length) { hote.innerHTML = ''; return; }
  const lang = state.lang === 'en' ? 'en' : 'fr';

  hote.innerHTML =
    '<h2 class="zc-titre">' + t('collections') + '</h2>' +
    '<p class="zc-intro">' + t('collectionsIntro') + '</p>' +
    '<div class="zc-rangee">' +
    state.collections.map(c => {
      const n = compteCollection(c.id);
      if (!n) return '';   // une collection vide ne s'affiche pas
      const actif = state.activeCollection === c.id ? ' est-actif' : '';
      return '<button class="zc-carte' + actif + '" data-collection="' + c.id + '">' +
             '<span class="zc-icone">' + (c.icon || '🎯') + '</span>' +
             '<span class="zc-nom">' + escapeHtml(c.titre[lang] || c.titre.fr) + '</span>' +
             '<span class="zc-intro-carte">' + escapeHtml(c.intro[lang] || c.intro.fr) + '</span>' +
             '<span class="zc-compte">' + n + ' ' + t('gamesIn') + '</span>' +
             '</button>';
    }).join('') +
    '</div>';

  hote.querySelectorAll('[data-collection]').forEach(b => {
    b.addEventListener('click', () => choisirCollection(b.dataset.collection));
  });
}

function choisirCollection(id) {
  state.activeCollection = (state.activeCollection === id) ? null : id;
  const n = state.activeCollection ? compteCollection(state.activeCollection) : 0;

  // Collection très large : on ouvre les filtres au lieu de laisser
  // l'utilisateur devant 448 cartes sans prise.
  if (state.activeCollection && n > SEUIL_COLLECTION_LARGE) {
    const sb = document.getElementById('sidebar');
    if (sb) sb.classList.add('open');
    const av = document.getElementById('ztsAvisCollection');
    if (av) { av.textContent = t('wideCollection'); av.hidden = false; }
  } else {
    const av = document.getElementById('ztsAvisCollection');
    if (av) av.hidden = true;
  }

  renderCollections();
  applyFilters();
  const g = document.getElementById('gameGrid');
  if (g) g.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* Partage — Web Share API quand elle existe (c'est le geste natif sur
   téléphone, et le téléphone est le terrain réel), repli sur la copie du
   lien. Le repli du repli est un prompt : sur iOS hors HTTPS et dans
   certains navigateurs en vue intégrée, `clipboard` est refusé sans erreur
   utile, et un bouton qui ne fait RIEN est pire qu'un bouton qui montre le
   lien à copier à la main. */
async function partagerJeu(id) {
  const game = state.games.find(x => String(x.id) === String(id));
  if (!game) return;
  const url = location.origin + urlFiche(game);
  const titre = g(game, 'title') || 'Zone Total Sport';

  if (navigator.share) {
    try { await navigator.share({ title: titre, text: g(game, 'but') || titre, url: url }); return; }
    catch (e) { if (e && e.name === 'AbortError') return; }   // l'utilisateur a annulé
  }
  try {
    await navigator.clipboard.writeText(url);
    toastPartage(t('shareCopied'));
  } catch (e) {
    window.prompt(t('shareFailed'), url);
  }
}

function toastPartage(msg) {
  let el = document.getElementById('ztsToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'ztsToast';
    el.className = 'zts-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('visible');
  clearTimeout(toastPartage._t);
  toastPartage._t = setTimeout(() => el.classList.remove('visible'), 2200);
}

window.partagerJeu = partagerJeu;

function t(key) {
  return i18n[state.lang][key] || key;
}

// ============================================================
// CATEGORY CONFIG
// ============================================================
const CATEGORIES = {
  'ballons-chasseurs': { name: 'Ballons chasseurs', nameEn: 'Dodgeball', icon: '🎯', color: '#FF2D2D' },
  'poursuites': { name: 'Poursuites', nameEn: 'Chase', icon: '🏃', color: '#FF8C00' },
  'cooperatifs': { name: 'Coopératifs', nameEn: 'Cooperative', icon: '🤝', color: '#00D26A' },
  'collectifs': { name: 'Sports collectifs', nameEn: 'Team sports', icon: '⚽', color: '#0088FF' },
  'opposition': { name: 'Opposition', nameEn: 'Wrestling', icon: '⚔️', color: '#8B2FC9' },
  'duels': { name: 'Duels', nameEn: 'Duels', icon: '🥊', color: '#FFD000' },
  'ludiques': { name: 'Ludiques', nameEn: 'Fun games', icon: '🎮', color: '#10B981' },
  'sans-materiel': { name: 'Sans matériel', nameEn: 'No equipment', icon: '🙌', color: '#06B6D4' },
  'avec-materiel': { name: 'Avec matériel', nameEn: 'With equipment', icon: '🏸', color: '#0EA5E9' },
  'exterieur': { name: 'Extérieur', nameEn: 'Outdoor', icon: '🌿', color: '#84CC16' },
  'individuels': { name: 'Sports individuels', nameEn: 'Individual sports', icon: '🏋️', color: '#F97316' },
  'traditionnels': { name: 'Traditionnels du monde', nameEn: 'World traditional', icon: '🌍', color: '#EC4899' },
  'autochtones': { name: 'Autochtones', nameEn: 'Indigenous', icon: '🪶', color: '#A16207' },
  'olympiques': { name: 'Olympiques', nameEn: 'Olympic', icon: '🥇', color: '#FACC15' },
  'afrique-asie': { name: 'Afrique·Asie·Océanie', nameEn: 'Africa·Asia·Oceania', icon: '🌏', color: '#D946EF' },
  'ameriques-europe': { name: 'Amériques·Europe', nameEn: 'Americas·Europe', icon: '🌎', color: '#22D3EE' },
  'prescolaire': { name: 'Préscolaire', nameEn: 'Preschool', icon: '🌱', color: '#65A30D' },
  'secondaire': { name: 'Secondaire', nameEn: 'Secondary', icon: '🎓', color: '#7C3AED' },
};

function getCatName(cat) {
  const c = CATEGORIES[cat];
  if (!c) return cat;
  return state.lang === 'en' ? c.nameEn : c.name;
}

// ============================================================
// LOCALIZED FIELD GETTER
// ============================================================
function g(game, field) {
  // Returns the English version of a field if lang is 'en' and it exists
  if (state.lang === 'en') {
    const enField = field + 'En';
    if (game[enField] !== undefined && game[enField] !== '' && game[enField] !== null) {
      return game[enField];
    }
  }
  return game[field];
}

function gArr(game, field) {
  // Same as g() but for array fields
  if (state.lang === 'en') {
    const enField = field + 'En';
    if (game[enField] && Array.isArray(game[enField]) && game[enField].length > 0) {
      return game[enField];
    }
  }
  return game[field] || [];
}

// ============================================================
// CYCLE MAPPING - Determine which cycles a game fits
// ============================================================
function getGameCycles(game) {
  // All games are suitable for cycles 1-3 by default
  // But we can infer from category and complexity
  const cycles = [];
  const id = game.id;
  const cat = game.category;

  // Simpler games (lower ids within categories) tend to be for younger kids
  // This is a heuristic - all games can work for all cycles with adaptations
  cycles.push(1, 2, 3);

  return cycles;
}

// ============================================================
// DOM ELEMENTS
// ============================================================
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const dom = {
  searchInput: $('#searchInput'),
  searchClear: $('#searchClear'),
  gameGrid: $('#gameGrid'),
  emptyState: $('#emptyState'),
  resultsCount: $('#resultsCount'),
  activeFilters: $('#activeFilters'),
  sortSelect: $('#sortSelect'),
  menuToggle: $('#menuToggle'),
  sidebar: $('#sidebar'),
  sidebarOverlay: $('#sidebarOverlay'),
  modalOverlay: $('#modalOverlay'),
  modalBody: $('#modalBody'),
  modalClose: $('#modalClose'),
  themeToggle: $('#themeToggle'),
  favoritesBtn: $('#favoritesBtn'),
  favCount: $('#favCount'),
  favoritesView: $('#favoritesView'),
  favGrid: $('#favGrid'),
  favEmpty: $('#favEmpty'),
  backFromFav: $('#backFromFav'),
  statsBar: $('#statsBar'),
  resetFilters: $('#resetFilters'),
  // New elements
  langToggle: $('#langToggle'),
  langFlag: $('#langFlag'),
  langLabel: $('#langLabel'),
  randomBtn: $('#randomBtn'),
  timerBtn: $('#timerBtn'),
  timerOverlay: $('#timerOverlay'),
  timerDisplay: $('#timerDisplay'),
  timerClose: $('#timerClose'),
  timerStart: $('#timerStart'),
  timerPause: $('#timerPause'),
  timerReset: $('#timerReset'),
};

// ============================================================
// INITIALIZATION
// ============================================================
function init() {
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', state.theme);

  // Apply saved language
  document.documentElement.setAttribute('data-lang', state.lang);
  applyLanguage();

  // Initialize filtered games
  state.filteredGames = [...state.games];

  // Build sidebar categories dynamically from CATEGORIES
  buildSidebarCategories();

  // Render
  renderGameGrid();
  updateCounts();
  updateFavCount();

  // Event listeners
  setupEventListeners();

  // Create random overlay div
  createRandomOverlay();

  // Vague 2 — la rangee de collections. Asynchrone et non bloquante : la
  // grille est deja rendue quand elle arrive.
  chargerCollections();

  console.log(`✅ Répertoire EPS v2.0 chargé : ${state.games.length} jeux | Lang: ${state.lang}`);
}

// Rebuild #categoryList with all CATEGORIES + counts
function buildSidebarCategories() {
  const list = document.getElementById('categoryList');
  if (!list) return;
  const counts = {};
  state.games.forEach(g => { counts[g.category] = (counts[g.category]||0)+1; });
  const isEn = state.lang === 'en';
  let html = `<button class="category-btn active" data-category="all">
    <span class="cat-icon">📋</span>
    <span class="cat-name" data-fr="Toutes les catégories" data-en="All categories">${isEn?'All categories':'Toutes les catégories'}</span>
    <span class="cat-count" id="countAll">${state.games.length}</span>
  </button>`;
  Object.entries(CATEGORIES).forEach(([key, c]) => {
    if (!counts[key]) return;
    html += `<button class="category-btn" data-category="${key}">
      <span class="cat-icon">${c.icon}</span>
      <span class="cat-name" data-fr="${c.name}" data-en="${c.nameEn}">${isEn?c.nameEn:c.name}</span>
      <span class="cat-count">${counts[key]}</span>
    </button>`;
  });
  list.innerHTML = html;
}

// ============================================================
// EVENT LISTENERS
// ============================================================
function setupEventListeners() {
  // Search
  dom.searchInput.addEventListener('input', debounce(handleSearch, 200));
  dom.searchClear.addEventListener('click', clearSearch);

  // Categories
  $$('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => handleCategoryClick(btn));
  });

  // Duration filter
  $$('#durationFilter .chip').forEach(chip => {
    chip.addEventListener('click', () => handleFilterClick(chip, 'duration'));
  });

  // PFEQ filter
  $$('#pfeqFilter .chip').forEach(chip => {
    chip.addEventListener('click', () => handleFilterClick(chip, 'pfeq'));
  });

  // Material filter
  $$('#materialFilter .chip').forEach(chip => {
    chip.addEventListener('click', () => handleFilterClick(chip, 'material'));
  });

  // Cycle filter
  $$('#cycleFilter .chip').forEach(chip => {
    chip.addEventListener('click', () => handleFilterClick(chip, 'cycle'));
  });

  // Vague 2 — univers et age. `#cycleFilter` n'existe plus dans le HTML :
  // la boucle ci-dessus ne trouve rien et ne casse rien, elle est laissee
  // le temps que le retrait du filtre mort soit valide en prod.
  $$('#universFilter .chip').forEach(chip => {
    chip.addEventListener('click', () => handleFilterClick(chip, 'univers'));
  });
  $$('#ageFilter .chip').forEach(chip => {
    chip.addEventListener('click', () => handleFilterClick(chip, 'age'));
  });

  // Sort
  dom.sortSelect.addEventListener('change', handleSort);

  // View toggle
  $$('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => handleViewToggle(btn));
  });

  // Mobile menu
  dom.menuToggle.addEventListener('click', toggleSidebar);
  dom.sidebarOverlay.addEventListener('click', closeSidebar);

  // Modal
  dom.modalOverlay.addEventListener('click', (e) => {
    if (e.target === dom.modalOverlay) closeModal();
  });
  dom.modalClose.addEventListener('click', closeModal);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeTimer();
      closeRandom();
    }
  });

  // Theme
  dom.themeToggle.addEventListener('click', toggleTheme);

  // Favorites
  dom.favoritesBtn.addEventListener('click', showFavorites);
  dom.backFromFav.addEventListener('click', hideFavorites);

  // Reset
  dom.resetFilters.addEventListener('click', resetAll);

  // Language toggle
  if (dom.langToggle) {
    dom.langToggle.addEventListener('click', toggleLanguage);
  }

  // Random game
  if (dom.randomBtn) {
    dom.randomBtn.addEventListener('click', showRandomGame);
  }

  // Timer
  if (dom.timerBtn) {
    dom.timerBtn.addEventListener('click', openTimer);
  }
  if (dom.timerClose) {
    dom.timerClose.addEventListener('click', closeTimer);
  }
  if (dom.timerStart) {
    dom.timerStart.addEventListener('click', startTimer);
  }
  if (dom.timerPause) {
    dom.timerPause.addEventListener('click', pauseTimer);
  }
  if (dom.timerReset) {
    dom.timerReset.addEventListener('click', resetTimer);
  }
  // Timer presets
  $$('.timer-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.timer-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.timerSeconds = parseInt(btn.dataset.time);
      state.timerRemaining = state.timerSeconds;
      updateTimerDisplay();
      // Reset if running
      if (state.timerRunning) {
        pauseTimer();
      }
    });
  });
  // Timer overlay click to close
  if (dom.timerOverlay) {
    dom.timerOverlay.addEventListener('click', (e) => {
      if (e.target === dom.timerOverlay) closeTimer();
    });
  }
}

// ============================================================
// LANGUAGE
// ============================================================
function toggleLanguage() {
  state.lang = state.lang === 'fr' ? 'en' : 'fr';
  localStorage.setItem('eps-lang', state.lang);
  document.documentElement.setAttribute('data-lang', state.lang);
  document.documentElement.setAttribute('lang', state.lang);
  applyLanguage();
  // Re-render to update dynamic content
  applyFilters();
  updateFavCount();
  if (state.showFavorites) renderFavorites();
}

function applyLanguage() {
  const lang = state.lang;

  // Update flag and label
  if (dom.langFlag) dom.langFlag.textContent = lang === 'fr' ? '🇫🇷' : '🇬🇧';
  if (dom.langLabel) dom.langLabel.textContent = lang === 'fr' ? 'FR' : 'EN';

  // Update all elements with data-fr / data-en attributes
  document.querySelectorAll('[data-fr][data-en]').forEach(el => {
    const text = el.getAttribute('data-' + lang);
    if (text) {
      if (el.tagName === 'OPTION') {
        el.textContent = text;
      } else {
        el.innerHTML = text;
      }
    }
  });

  // Update search placeholder
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    const ph = searchInput.getAttribute('data-placeholder-' + lang);
    if (ph) searchInput.placeholder = ph;
  }

  // Update page title
  document.title = lang === 'fr'
    ? 'Répertoire de Jeux EPS | 1540 Jeux - Banque mondiale'
    : 'PE Game Library | 1540 Games - World Library';
}

// ============================================================
// SEARCH
// ============================================================
function handleSearch() {
  state.searchQuery = dom.searchInput.value.trim().toLowerCase();
  dom.searchClear.classList.toggle('visible', state.searchQuery.length > 0);
  applyFilters();
}

function clearSearch() {
  dom.searchInput.value = '';
  state.searchQuery = '';
  dom.searchClear.classList.remove('visible');
  applyFilters();
}

// ============================================================
// FILTERS
// ============================================================
function handleCategoryClick(btn) {
  $$('.category-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.activeCategory = btn.dataset.category;
  applyFilters();
  closeSidebar();
}

function handleFilterClick(chip, filterType) {
  const parent = chip.parentElement;
  parent.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');

  switch (filterType) {
    case 'duration':
      state.activeDuration = chip.dataset.duration;
      break;
    case 'pfeq':
      state.activePfeq = chip.dataset.pfeq;
      break;
    case 'material':
      state.activeMaterial = chip.dataset.material;
      break;
    case 'cycle':
      state.activeCycle = chip.dataset.cycle;
      break;
    case 'univers':
      state.activeUnivers = chip.dataset.univers;
      break;
    case 'age':
      state.activeAge = chip.dataset.age;
      break;
  }

  applyFilters();
}

function applyFilters() {
  let filtered = [...state.games];

  // Category filter
  if (state.activeCategory !== 'all') {
    filtered = filtered.filter(g => g.category === state.activeCategory);
  }

  // Collection active (vague 2) — l'etiquette posee par PR A.
  if (state.activeCollection) {
    filtered = filtered.filter(g =>
      Array.isArray(g.collections) && g.collections.includes(state.activeCollection));
  }

  // Univers (vague 2) — eps / camps / sdg. Un jeu sans univers passe : meme
  // regle que l'age, un champ absent ne cache jamais un jeu.
  if (state.activeUnivers !== 'all') {
    filtered = filtered.filter(g =>
      !Array.isArray(g.univers) || !g.univers.length || g.univers.includes(state.activeUnivers));
  }

  /* Duree — bornes REECRITES. Les anciennes se chevauchaient (« ≤ 15 min »
     rendait aussi 15-20) et, comme 1165 jeux sur 1540 sont a exactement
     15 min, le premier bouton rendait presque tout le catalogue. Bornes
     disjointes, et un jeu sans duree passe toujours. */
  if (state.activeDuration !== 'all') {
    const dur = parseInt(state.activeDuration, 10);
    filtered = filtered.filter(g => {
      const d = g.dureeMin;
      if (!Number.isFinite(d) || d <= 0) return true;   // non renseigne = passe
      if (dur === 10) return d < 15;
      if (dur === 15) return d >= 15 && d < 20;
      if (dur === 20) return d >= 20 && d < 30;
      if (dur === 30) return d >= 30;
      return true;
    });
  }

  /* AGE — la regle signee par Joey : un age NON RENSEIGNE passe toujours le
     filtre. 721 des 1540 jeux n'ont pas d'age ; sans cette regle, filtrer par
     age escamoterait la moitie du catalogue en silence, et l'ecran dirait
     « il n'y a rien » au lieu de « on ne sait pas ». */
  if (state.activeAge !== 'all') {
    const cible = parseInt(state.activeAge, 10);
    filtered = filtered.filter(g => {
      const min = parseInt(g.ageMin, 10), max = parseInt(g.ageMax, 10);
      if (!Number.isFinite(min) && !Number.isFinite(max)) return true;   // absent = passe
      const bas = Number.isFinite(min) ? min : 0;
      const haut = Number.isFinite(max) ? max : 99;
      return cible >= bas && cible <= haut;
    });
  }

  // PFEQ filter
  if (state.activePfeq !== 'all') {
    if (state.activePfeq === 'C1') {
      filtered = filtered.filter(g => g.intentionsC1);
    } else if (state.activePfeq === 'C2') {
      filtered = filtered.filter(g => g.intentionsC2);
    } else if (state.activePfeq === 'C3') {
      filtered = filtered.filter(g => g.intentionsC3);
    }
  }

  /* MATERIEL — sur `materielCat`, le champ derive pose par PR A, et plus sur
     une recherche de sous-chaine dans le texte libre. L'ancienne version
     cherchait « cône » dans la phrase de materiel : elle ratait « cones »
     sans accent, et matchait a l'interieur d'autres mots. Dix categories
     fermees, un jeu sans materiel renseigne passe toujours. */
  if (state.activeMaterial !== 'all') {
    filtered = filtered.filter(g => !g.materielCat || g.materielCat === state.activeMaterial);
  }

  /* Le filtre « cycle scolaire » a ete RETIRE de l'interface, pas desactive
     ici : son code ne filtrait rien (« Keep all games ») tout en affichant
     quatre boutons qui se cochaient. Un filtre qui ment est pire qu'un
     filtre absent. Le filtre AGE le remplace, avec de vraies bornes. */

  // Search (bilingual – searches both FR and EN fields)
  if (state.searchQuery) {
    const q = state.searchQuery;
    filtered = filtered.filter(gm => {
      const fields = [
        gm.title, gm.titleEn,
        gm.but, gm.butEn,
        gm.intentionsC1, gm.intentionsC1En,
        gm.intentionsC2, gm.intentionsC2En,
        gm.intentionsC3 || '', gm.intentionsC3En || '',
        Array.isArray(gm.materiel) ? gm.materiel.join(' ') : gm.materiel,
        Array.isArray(gm.materielEn) ? gm.materielEn.join(' ') : (gm.materielEn || ''),
        gm.disposition, gm.dispositionEn || '',
        Array.isArray(gm.deroulement) ? gm.deroulement.join(' ') : '',
        Array.isArray(gm.deroulementEn) ? gm.deroulementEn.join(' ') : '',
        Array.isArray(gm.variantes) ? gm.variantes.join(' ') : '',
        Array.isArray(gm.variantesEn) ? gm.variantesEn.join(' ') : '',
        Array.isArray(gm.transversales) ? gm.transversales.join(' ') : '',
        Array.isArray(gm.transversalesEn) ? gm.transversalesEn.join(' ') : '',
      ].join(' ').toLowerCase();
      return fields.includes(q);
    });
  }

  // Sort
  filtered = sortGames(filtered);

  state.filteredGames = filtered;
  renderGameGrid();
  updateResultsCount();
}

// ============================================================
// SORTING
// ============================================================
function handleSort() {
  state.sortBy = dom.sortSelect.value;
  applyFilters();
}

function sortGames(games) {
  const sorted = [...games];
  switch (state.sortBy) {
    case 'id':
      sorted.sort((a, b) => a.id - b.id);
      break;
    case 'title':
      sorted.sort((a, b) => g(a, 'title').localeCompare(g(b, 'title'), state.lang === 'fr' ? 'fr' : 'en'));
      break;
    case 'duration':
      sorted.sort((a, b) => a.dureeMin - b.dureeMin);
      break;
    case 'category':
      sorted.sort((a, b) => a.category.localeCompare(b.category));
      break;
  }
  return sorted;
}

// ============================================================
// VIEW
// ============================================================
function handleViewToggle(btn) {
  $$('.view-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.viewMode = btn.dataset.view;
  dom.gameGrid.classList.toggle('list-view', state.viewMode === 'list');
}

// ============================================================
// RENDER GAME GRID
// ============================================================
function renderGameGrid() {
  const games = state.filteredGames;

  if (games.length === 0) {
    dom.gameGrid.style.display = 'none';
    dom.emptyState.style.display = 'block';
    return;
  }

  dom.gameGrid.style.display = '';
  dom.emptyState.style.display = 'none';

  const fragment = document.createDocumentFragment();

  games.forEach((game, index) => {
    const card = createGameCard(game, index);
    fragment.appendChild(card);
  });

  dom.gameGrid.innerHTML = '';
  dom.gameGrid.appendChild(fragment);

  dom.gameGrid.classList.toggle('list-view', state.viewMode === 'list');
}

/**
 * L'ENCRE LISIBLE SUR UNE COULEUR DE CATEGORIE.
 *
 * La carte est peinte avec la couleur de sa categorie et le texte etait
 * BLANC EN DUR. Sur les 18 couleurs, 15 ne portent pas le blanc : le jaune
 * `#FFD000` tombait a 1,47:1, le cyan `#22D3EE` a 1,81:1, le vert des
 * cooperatifs a 2,01:1 — la ou il en faut 4,5. C'est le defaut signale.
 *
 * On choisit donc l'encre d'apres la couleur, au lieu de la supposer. Noir ou
 * blanc, celui des deux qui contraste le plus : c'est le calcul du WCAG, et
 * il donne toujours au moins 4,5:1 face a une couleur de cette palette.
 * Une couleur ajoutee demain sera traitee sans qu'on y revienne.
 */
function encreLisible(couleur) {
  const m = String(couleur || '').trim().replace('#', '');
  const hex = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  if (!/^[0-9a-f]{6}$/i.test(hex)) return { encre: '#FFFFFF', voile: 'rgba(0,0,0,.30)' };
  const lin = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = 0.2126 * lin(parseInt(hex.slice(0, 2), 16))
          + 0.7152 * lin(parseInt(hex.slice(2, 4), 16))
          + 0.0722 * lin(parseInt(hex.slice(4, 6), 16));
  const surBlanc = (1.05) / (L + 0.05);        // contraste du BLANC sur la couleur
  const surNoir  = (L + 0.05) / 0.05;          // contraste du NOIR  sur la couleur
  return surNoir > surBlanc
    // Couleur CLAIRE : encre foncee. L'ombre portee du titre disparait —
    // une ombre sombre sous une encre sombre ne fait qu'empater le texte.
    ? { encre: '#0C1720', voile: 'rgba(255,255,255,.55)', ombre: 'none' }
    // Couleur FONCEE : encre blanche, et l'ombre BD du style ZTS reste.
    : { encre: '#FFFFFF', voile: 'rgba(0,0,0,.30)', ombre: '2px 2px 0 rgba(0,0,0,.2)' };
}

function createGameCard(game, index) {
  const card = document.createElement('div');
  card.className = 'game-card';
  card.style.animationDelay = `${Math.min(index * 0.03, 0.3)}s`;
  const catCfg = CATEGORIES[game.category] || {};
  if (catCfg.color) {
    card.style.setProperty('--cat', catCfg.color);
    // Le CSS lit ces deux-la : voir `.game-card` dans index.html.
    const lis = encreLisible(catCfg.color);
    card.style.setProperty('--cat-encre', lis.encre);
    card.style.setProperty('--cat-voile', lis.voile);
    card.style.setProperty('--cat-ombre', lis.ombre);
  }
  card.onclick = () => openGameDetail(game);

  const isFav = state.favorites.includes(game.id);
  const catName = getCatName(game.category);

  const title = g(game, 'title');
  const but = g(game, 'but');

  card.innerHTML = `
    <div class="card-top">
      <div class="card-category-bar ${game.category}"></div>
      <div class="card-number">${game.id}</div>
      <div class="card-title">${escapeHtml(title)}</div>
      <div class="card-but">${escapeHtml(but)}</div>
    </div>
    <div class="card-bottom">
      <div class="card-tags">
        <span class="card-tag category ${game.category}">${catName}</span>
        <span class="card-tag duration">${game.duree || game.dureeMin + ' min'}</span>
      </div>
      <button class="card-fav ${isFav ? 'is-fav' : ''}" onclick="event.stopPropagation(); toggleFavorite('${game.id}')" title="${isFav ? t('removeFav') : t('addToFav')}">
        ${isFav ? '⭐' : '☆'}
      </button>
      <button class="card-partage" onclick="event.stopPropagation(); partagerJeu('${game.id}')" title="${t('share')}" aria-label="${t('share')}">🔗</button>
    </div>
  `;

  return card;
}

// ============================================================
// GAME DETAIL MODAL
// ============================================================
// LOT 1 vague C — la liste reste ouverte, la FICHE se ferme.
// Un anonyme recoit `/jeux/public.json` : les champs de liste pour les 1439,
// et le jeu entier pour les trois vitrines. Ouvrir la fiche d'un jeu non
// vitrine afficherait donc des sections vides — « il n'y a rien » plutot que
// « il faut un compte ». On montre le mur a la place.
const CHAMPS_CONTENU_JEU = ['but', 'deroulement', 'materiel', 'disposition'];

function openGameDetail(game) {
  if (window.ZTSBanques &&
      window.ZTSBanques.estVerrouille(game, CHAMPS_CONTENU_JEU)) {
    closeModal();                       // au cas ou une fiche etait ouverte
    window.ZTSBanques.murItem(game, 'jeux');
    return;
  }

  const isFav = state.favorites.includes(game.id);
  const catName = getCatName(game.category);

  const title = g(game, 'title');
  const but = g(game, 'but');
  const disposition = g(game, 'disposition');
  const intentionsC1 = g(game, 'intentionsC1');
  const intentionsC2 = g(game, 'intentionsC2');
  const intentionsC3 = g(game, 'intentionsC3');
  const transversales = gArr(game, 'transversales');
  const materiel = gArr(game, 'materiel');
  const deroulement = gArr(game, 'deroulement');
  const variantes = gArr(game, 'variantes');

  let html = `
    <div class="detail-category-bar ${game.category}"></div>
    <div class="detail-header">
      <div class="detail-meta">
        <div class="detail-number">${game.id}</div>
        <span class="detail-cat-badge ${game.category}">${game.categoryIcon || ''} ${catName}</span>
        <button class="detail-fav-btn ${isFav ? 'is-fav' : ''}" onclick="toggleFavorite('${game.id}'); refreshModal('${game.id}');">
          ${isFav ? t('isFav') : t('addFav')}
        </button>
      </div>
      <h2 class="detail-title">${escapeHtml(title)}</h2>
    </div>
    <div class="detail-sections">
      <!-- But -->
      <div class="detail-section section-full" data-section="but">
        <div class="detail-section-title">${t('goalTitle')}</div>
        <p>${escapeHtml(but)}</p>
      </div>

      <!-- Intentions pédagogiques -->
      <div class="detail-section section-full" data-section="pedagogy">
        <div class="detail-section-title">${t('pedagogyTitle')}</div>
        <div class="competency-grid">
          ${intentionsC1 ? `<div class="comp-item"><span class="comp-badge c1">C1</span> ${escapeHtml(intentionsC1)}</div>` : ''}
          ${intentionsC2 ? `<div class="comp-item"><span class="comp-badge c2">C2</span> ${escapeHtml(intentionsC2)}</div>` : ''}
          ${intentionsC3 ? `<div class="comp-item"><span class="comp-badge c3">C3</span> ${escapeHtml(intentionsC3)}</div>` : ''}
          ${transversales && transversales.length > 0 ? `<div class="comp-item"><span class="comp-badge ct">CT</span> ${escapeHtml(transversales.join(', '))}</div>` : ''}
        </div>
      </div>

      <!-- Disposition -->
      <div class="detail-section section-third" data-section="disposition">
        <div class="detail-section-title">${t('dispositionTitle')}</div>
        <p>${escapeHtml(disposition)}</p>
      </div>

      <!-- Matériel -->
      <div class="detail-section section-third" data-section="material">
        <div class="detail-section-title">${t('materialTitle')}</div>
        <div class="material-tags">
          ${(Array.isArray(materiel) ? materiel : [materiel]).map(m =>
            `<span class="material-tag">${escapeHtml(m)}</span>`
          ).join('')}
        </div>
      </div>

      <!-- Durée -->
      <div class="detail-section section-third" data-section="duration">
        <div class="detail-section-title">${t('durationTitle')}</div>
        <p>${escapeHtml(game.duree || game.dureeMin + ' ' + t('minutes'))}</p>
      </div>

      <!-- Déroulement -->
      <div class="detail-section section-full" data-section="steps">
        <div class="detail-section-title">${t('stepsTitle')}</div>
        <ol>
          ${deroulement.map(step =>
            `<li>${escapeHtml(step)}</li>`
          ).join('')}
        </ol>
      </div>

      <!-- Variantes -->
      ${variantes && variantes.length > 0 ? `
      <div class="detail-section section-full" data-section="variants">
        <div class="detail-section-title">${t('variantsTitle')}</div>
        ${variantes.map(v => `<div class="variante-item">${escapeHtml(v)}</div>`).join('')}
      </div>
      ` : ''}

      <!-- Print button -->
      <button class="detail-print-btn" onclick="printGame('${game.id}')">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        ${t('printBtn')}
      </button>

      <!-- Vague 2 — la fiche statique. C'est l'URL propre et partageable du
           jeu : /jeux/<slug>.html, une page par jeu, indexée. Les 1540 en ont
           une (scripts/gen-jeux-fiches.js). Le mur ne bouge pas : la fiche
           applique le même verrou d'item que la modale. -->
      <a class="detail-fiche-lien" href="${urlFiche(game)}">${t('seeSheet')}</a>
      <button class="detail-fiche-lien" style="background:#FFF000;margin-left:8px;border:3px solid #111;cursor:pointer"
              onclick="partagerJeu('${game.id}')">🔗 ${t('share')}</button>
    </div>
  `;

  dom.modalBody.innerHTML = html;
  /* La fiche porte les MEMES quatre variables que la carte : son numero et son
     badge de categorie sont peints avec `--cat`, et leur texte etait blanc en
     dur — 3,71:1 sur le rouge, moins encore sur le jaune. */
  const catFiche = CATEGORIES[game.category] || {};
  if (catFiche.color) {
    const lisF = encreLisible(catFiche.color);
    dom.modalBody.style.setProperty('--cat', catFiche.color);
    dom.modalBody.style.setProperty('--cat-encre', lisF.encre);
    dom.modalBody.style.setProperty('--cat-voile', lisF.voile);
    dom.modalBody.style.setProperty('--cat-ombre', lisF.ombre);
  }
  dom.modalOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function refreshModal(gameId) {
  const game = state.games.find(g => g.id === gameId);
  if (game) {
    openGameDetail(game);
  }
}

function closeModal() {
  dom.modalOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

// ============================================================
// RANDOM GAME
// ============================================================
let currentRandomGame = null;

function createRandomOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'random-overlay';
  overlay.id = 'randomOverlay';
  overlay.innerHTML = `
    <div class="random-modal">
      <div class="random-title" id="randomTitle"></div>
      <div class="random-game-name" id="randomGameName"></div>
      <div class="random-game-but" id="randomGameBut"></div>
      <div class="random-buttons">
        <button class="random-btn open-detail" id="randomOpenDetail"></button>
        <button class="random-btn reroll" id="randomReroll"></button>
        <button class="random-btn close" id="randomCloseBtn"></button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Event listeners
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeRandom();
  });
  document.getElementById('randomOpenDetail').addEventListener('click', () => {
    closeRandom();
    if (currentRandomGame) openGameDetail(currentRandomGame);
  });
  document.getElementById('randomReroll').addEventListener('click', showRandomGame);
  document.getElementById('randomCloseBtn').addEventListener('click', closeRandom);
}

function showRandomGame() {
  const games = state.filteredGames.length > 0 ? state.filteredGames : state.games;
  const randomIndex = Math.floor(Math.random() * games.length);
  currentRandomGame = games[randomIndex];

  document.getElementById('randomTitle').textContent = t('randomTitle');
  document.getElementById('randomGameName').textContent = g(currentRandomGame, 'title');
  // Vague C : sans compte, `but` est absent pour 1436 des 1439 jeux. Une ligne
  // vide donnerait l'impression d'une fiche cassee — on dit ce qui se passe.
  // Le bouton « Voir la fiche » ouvre le mur, comme partout ailleurs.
  document.getElementById('randomGameBut').textContent =
    (window.ZTSBanques && window.ZTSBanques.estVerrouille(currentRandomGame, CHAMPS_CONTENU_JEU))
      ? t('randomLocked')
      : g(currentRandomGame, 'but');
  document.getElementById('randomOpenDetail').textContent = t('randomOpen');
  document.getElementById('randomReroll').textContent = t('randomReroll');
  document.getElementById('randomCloseBtn').textContent = t('randomClose');

  document.getElementById('randomOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeRandom() {
  const overlay = document.getElementById('randomOverlay');
  if (overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ============================================================
// TIMER
// ============================================================
function openTimer() {
  dom.timerOverlay.classList.add('open');
  document.body.style.overflow = 'hidden';
  updateTimerDisplay();
}

function closeTimer() {
  dom.timerOverlay.classList.remove('open');
  document.body.style.overflow = '';
}

function startTimer() {
  if (state.timerRunning) return;
  state.timerRunning = true;
  dom.timerStart.style.display = 'none';
  dom.timerPause.style.display = '';

  state.timerInterval = setInterval(() => {
    state.timerRemaining--;
    updateTimerDisplay();

    if (state.timerRemaining <= 0) {
      clearInterval(state.timerInterval);
      state.timerRunning = false;
      dom.timerStart.style.display = '';
      dom.timerPause.style.display = 'none';
      // Play sound or visual alert
      dom.timerDisplay.classList.add('danger');
      // Flash the display
      let flashes = 0;
      const flashInterval = setInterval(() => {
        dom.timerDisplay.style.opacity = dom.timerDisplay.style.opacity === '0.3' ? '1' : '0.3';
        flashes++;
        if (flashes > 10) {
          clearInterval(flashInterval);
          dom.timerDisplay.style.opacity = '1';
        }
      }, 300);
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  dom.timerStart.style.display = '';
  dom.timerPause.style.display = 'none';
}

function resetTimer() {
  clearInterval(state.timerInterval);
  state.timerRunning = false;
  state.timerRemaining = state.timerSeconds;
  dom.timerStart.style.display = '';
  dom.timerPause.style.display = 'none';
  dom.timerDisplay.classList.remove('danger', 'warning');
  updateTimerDisplay();
}

function updateTimerDisplay() {
  const mins = Math.floor(state.timerRemaining / 60);
  const secs = state.timerRemaining % 60;
  dom.timerDisplay.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  // Color changes
  dom.timerDisplay.classList.remove('danger', 'warning');
  if (state.timerRemaining <= 10) {
    dom.timerDisplay.classList.add('danger');
  } else if (state.timerRemaining <= 30) {
    dom.timerDisplay.classList.add('warning');
  }
}

// ============================================================
// FAVORITES
// ============================================================
function toggleFavorite(gameId) {
  const idx = state.favorites.indexOf(gameId);
  if (idx > -1) {
    state.favorites.splice(idx, 1);
  } else {
    state.favorites.push(gameId);
  }
  localStorage.setItem('eps-favorites', JSON.stringify(state.favorites));
  updateFavCount();
  renderGameGrid();
  if (state.showFavorites) {
    renderFavorites();
  }
}

function updateFavCount() {
  dom.favCount.textContent = state.favorites.length;
  dom.favCount.setAttribute('data-count', state.favorites.length);
}

function showFavorites() {
  state.showFavorites = true;
  dom.gameGrid.style.display = 'none';
  dom.emptyState.style.display = 'none';
  dom.statsBar.style.display = 'none';
  dom.favoritesView.style.display = 'block';
  renderFavorites();
}

function hideFavorites() {
  state.showFavorites = false;
  dom.favoritesView.style.display = 'none';
  dom.statsBar.style.display = '';
  applyFilters();
}

function renderFavorites() {
  const favGames = state.games.filter(g => state.favorites.includes(g.id));

  if (favGames.length === 0) {
    dom.favGrid.style.display = 'none';
    dom.favEmpty.style.display = 'block';
    return;
  }

  dom.favGrid.style.display = '';
  dom.favEmpty.style.display = 'none';

  const fragment = document.createDocumentFragment();
  favGames.forEach((game, index) => {
    fragment.appendChild(createGameCard(game, index));
  });

  dom.favGrid.innerHTML = '';
  dom.favGrid.appendChild(fragment);
}

// ============================================================
// THEME
// ============================================================
function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('eps-theme', state.theme);
}

// ============================================================
// SIDEBAR (MOBILE)
// ============================================================
function toggleSidebar() {
  dom.sidebar.classList.toggle('open');
}

function closeSidebar() {
  dom.sidebar.classList.remove('open');
}

// ============================================================
// PRINT
// ============================================================
function printGame(gameId) {
  const game = state.games.find(g => g.id === gameId);
  if (!game) return;

  const catConfig = CATEGORIES[game.category] || {};
  const catName = getCatName(game.category);

  const printWindow = window.open('', '_blank');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="${state.lang}">
    <head>
      <meta charset="UTF-8">
      <title>${g(game, 'title')} – ${t('gameSheet')}</title>
      <link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Gloria+Hallelujah&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Gloria Hallelujah', cursive; max-width: 750px; margin: 0 auto; padding: 30px; color: #1A1A2E; }
        h1 { font-family: 'Luckiest Guy', cursive; font-size: 2rem; letter-spacing: 1px; text-transform: uppercase; border-bottom: 4px solid ${catConfig.color || '#333'}; padding-bottom: 10px; margin-bottom: 6px; color: #0f172a; }
        .meta { font-family: 'Gloria Hallelujah', cursive; font-size: 1rem; color: #555; margin-bottom: 18px; }
        .badge { display: inline-block; padding: 4px 14px; border-radius: 999px; font-family: 'Luckiest Guy', cursive; font-size: 0.95rem; color: white; background: ${catConfig.color || '#333'}; letter-spacing: 1px; }
        h2 { font-family: 'Luckiest Guy', cursive; font-size: 1.25rem; letter-spacing: 1.5px; text-transform: uppercase; color: ${catConfig.color || '#333'}; margin: 18px 0 8px; border-bottom: 2px dashed #ccc; padding-bottom: 4px; }
        p, li { font-family: 'Gloria Hallelujah', cursive; font-size: 1rem; line-height: 1.65; }
        ul, ol { padding-left: 22px; }
        li { margin-bottom: 4px; }
        .variante { padding-left: 16px; margin-bottom: 6px; font-family: 'Gloria Hallelujah', cursive; font-size: 1rem; }
        .variante::before { content: "💡 "; }
        .footer { margin-top: 28px; padding-top: 12px; border-top: 2px solid #333; font-size: 0.85rem; color: #888; text-align: center; font-family: 'Luckiest Guy', cursive; letter-spacing: 1px; }
        .material-tag { display: inline-block; padding: 4px 12px; margin: 3px; border: 2px solid ${catConfig.color || '#333'}; border-radius: 999px; font-family: 'Luckiest Guy', cursive; font-size: 0.9rem; color: ${catConfig.color || '#333'}; letter-spacing: 0.5px; }
        @media print { body { padding: 10px; } }
      </style>
    </head>
    <body>
      <h1>${state.lang === 'fr' ? 'Jeu' : 'Game'} #${game.id} : ${escapeHtml(g(game, 'title'))}</h1>
      <div class="meta"><span class="badge">${game.categoryIcon || ''} ${catName}</span> &nbsp; ⏱️ ${game.duree || game.dureeMin + ' min'}</div>

      <h2>${t('goalTitle')}</h2>
      <p>${escapeHtml(g(game, 'but'))}</p>

      <h2>${t('pedagogyTitle')}</h2>
      <ul>
        ${g(game, 'intentionsC1') ? `<li><strong>C1 :</strong> ${escapeHtml(g(game, 'intentionsC1'))}</li>` : ''}
        ${g(game, 'intentionsC2') ? `<li><strong>C2 :</strong> ${escapeHtml(g(game, 'intentionsC2'))}</li>` : ''}
        ${g(game, 'intentionsC3') ? `<li><strong>C3 :</strong> ${escapeHtml(g(game, 'intentionsC3'))}</li>` : ''}
        ${gArr(game, 'transversales').length ? `<li><strong>CT :</strong> ${escapeHtml(gArr(game, 'transversales').join(', '))}</li>` : ''}
      </ul>

      <h2>${t('materialTitle')}</h2>
      <p>${(Array.isArray(gArr(game, 'materiel')) ? gArr(game, 'materiel') : [gArr(game, 'materiel')]).map(m => `<span class="material-tag">${escapeHtml(m)}</span>`).join(' ')}</p>

      <h2>${t('dispositionTitle')}</h2>
      <p>${escapeHtml(g(game, 'disposition'))}</p>

      <h2>${t('stepsTitle')}</h2>
      <ol>
        ${gArr(game, 'deroulement').map(s => `<li>${escapeHtml(s)}</li>`).join('')}
      </ol>

      ${gArr(game, 'variantes').length ? `
        <h2>${t('variantsTitle')}</h2>
        ${gArr(game, 'variantes').map(v => `<div class="variante">${escapeHtml(v)}</div>`).join('')}
      ` : ''}

      <div class="footer">${t('printFooter')}</div>
    </body>
    </html>
  `);

  printWindow.document.close();
  setTimeout(() => printWindow.print(), 500);
}

// ============================================================
// UPDATE UI
// ============================================================
function updateResultsCount() {
  const count = state.filteredGames.length;
  const word = count > 1 ? t('games') : t('game');
  dom.resultsCount.textContent = `${count} ${word}`;

  const filters = [];
  if (state.activeCategory !== 'all') {
    filters.push(getCatName(state.activeCategory));
  }
  if (state.activeDuration !== 'all') {
    const labels = { '10': '≤ 15 min', '15': '15-20 min', '20': '20-30 min', '30': '30+ min' };
    filters.push(labels[state.activeDuration] || '');
  }
  if (state.activePfeq !== 'all') {
    filters.push(state.activePfeq);
  }
  if (state.activeMaterial !== 'all') {
    filters.push(state.activeMaterial);
  }
  if (state.activeCycle !== 'all') {
    filters.push(`Cycle ${state.activeCycle}`);
  }
  if (state.searchQuery) {
    filters.push(`"${state.searchQuery}"`);
  }

  dom.activeFilters.textContent = filters.length > 0 ? `${t('filters')} : ${filters.join(' • ')}` : '';
}

function updateCounts() {
  const countByCategory = {};
  state.games.forEach(g => {
    countByCategory[g.category] = (countByCategory[g.category] || 0) + 1;
  });

  const countEl = (id, cat) => {
    const el = document.getElementById(id);
    if (el) el.textContent = countByCategory[cat] || 0;
  };

  const allEl = document.getElementById('countAll');
  if (allEl) allEl.textContent = state.games.length;

  countEl('countBallons', 'ballons-chasseurs');
  countEl('countPoursuites', 'poursuites');
  countEl('countLudiques', 'ludiques');
  countEl('countCollectifs', 'collectifs');
  countEl('countOpposition', 'opposition');
  countEl('countDuels', 'duels');
}

// ============================================================
// RESET
// ============================================================
function resetAll() {
  state.activeCategory = 'all';
  state.activeDuration = 'all';
  state.activePfeq = 'all';
  state.activeMaterial = 'all';
  state.activeCycle = 'all';
  state.activeUnivers = 'all';
  state.activeAge = 'all';
  state.activeCollection = null;
  state.searchQuery = '';
  state.sortBy = 'id';

  dom.searchInput.value = '';
  dom.searchClear.classList.remove('visible');
  dom.sortSelect.value = 'id';

  $$('.category-btn').forEach((b, i) => b.classList.toggle('active', i === 0));
  $$('#durationFilter .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  $$('#pfeqFilter .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  $$('#materialFilter .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  $$('#cycleFilter .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  $$('#universFilter .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  $$('#ageFilter .chip').forEach((c, i) => c.classList.toggle('active', i === 0));
  const avis = document.getElementById('ztsAvisCollection');
  if (avis) avis.hidden = true;
  renderCollections();

  if (state.showFavorites) hideFavorites();

  applyFilters();
}

// ============================================================
// UTILITIES
// ============================================================
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ============================================================
// LAUNCH
// ============================================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
