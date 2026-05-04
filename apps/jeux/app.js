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
    randomOpen: '📖 VOIR DÉTAILS',
    randomReroll: '🎲 AUTRE JEU',
    randomClose: '✖ FERMER',
    cycle1: 'Cycle 1',
    cycle2: 'Cycle 2',
    cycle3: 'Cycle 3',
    allCycles: 'Tous les cycles',
    printFooter: 'Répertoire de jeux EPS – PFEQ Primaire – 449 jeux',
    gameSheet: 'Fiche de jeu EPS',
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
    randomOpen: '📖 VIEW DETAILS',
    randomReroll: '🎲 ANOTHER GAME',
    randomClose: '✖ CLOSE',
    cycle1: 'Cycle 1',
    cycle2: 'Cycle 2',
    cycle3: 'Cycle 3',
    allCycles: 'All cycles',
    printFooter: 'PE Game Repertoire – Quebec Curriculum – 449 games',
    gameSheet: 'PE Game Sheet',
  }
};

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
    ? 'Répertoire de Jeux EPS | 1439 Jeux - Banque mondiale'
    : 'PE Game Library | 1439 Games - World Library';
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
  }

  applyFilters();
}

function applyFilters() {
  let filtered = [...state.games];

  // Category filter
  if (state.activeCategory !== 'all') {
    filtered = filtered.filter(g => g.category === state.activeCategory);
  }

  // Duration filter
  if (state.activeDuration !== 'all') {
    const dur = parseInt(state.activeDuration);
    if (dur === 10) {
      filtered = filtered.filter(g => g.dureeMin <= 15);
    } else if (dur === 15) {
      filtered = filtered.filter(g => g.dureeMin >= 15 && g.dureeMin <= 20);
    } else if (dur === 20) {
      filtered = filtered.filter(g => g.dureeMin >= 20 && g.dureeMin <= 30);
    } else if (dur === 30) {
      filtered = filtered.filter(g => g.dureeMin >= 30);
    }
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

  // Material filter
  if (state.activeMaterial !== 'all') {
    const mat = state.activeMaterial.toLowerCase();
    filtered = filtered.filter(g => {
      const materielStr = (Array.isArray(g.materiel) ? g.materiel.join(' ') : g.materiel).toLowerCase();
      return materielStr.includes(mat);
    });
  }

  // Cycle filter (heuristic based on game complexity)
  if (state.activeCycle !== 'all') {
    // All games work for all cycles, but we filter subtly
    // Cycle 1 (6-8): simpler games, cycle 3 (10-12): more complex
    const cycle = parseInt(state.activeCycle);
    // Keep all games but we could add game.cycles property later
    // For now, show all as all games are adaptable
  }

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

function createGameCard(game, index) {
  const card = document.createElement('div');
  card.className = 'game-card';
  card.style.animationDelay = `${Math.min(index * 0.03, 0.3)}s`;
  const catCfg = CATEGORIES[game.category] || {};
  if (catCfg.color) card.style.setProperty('--cat', catCfg.color);
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
      <button class="card-fav ${isFav ? 'is-fav' : ''}" onclick="event.stopPropagation(); toggleFavorite(${game.id})" title="${isFav ? t('removeFav') : t('addToFav')}">
        ${isFav ? '⭐' : '☆'}
      </button>
    </div>
  `;

  return card;
}

// ============================================================
// GAME DETAIL MODAL
// ============================================================
function openGameDetail(game) {
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
        <button class="detail-fav-btn ${isFav ? 'is-fav' : ''}" onclick="toggleFavorite(${game.id}); refreshModal(${game.id});">
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
      <button class="detail-print-btn" onclick="printGame(${game.id})">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        ${t('printBtn')}
      </button>
    </div>
  `;

  dom.modalBody.innerHTML = html;
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
  document.getElementById('randomGameBut').textContent = g(currentRandomGame, 'but');
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
