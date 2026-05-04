/* ===================================================
   ÉDUCATIFS ÉPS — Zone Total Sport
   Application principale (v2 — données JSON externes)
   =================================================== */

'use strict';

// ─────────────────────────────────────────────────────
// TAXONOMIE — structure sans données
// ─────────────────────────────────────────────────────
const TAXONOMY = [
  {
    section: '🎯 Manipulation d\'objets',
    categories: [
      { key: 'balles_ballons', emoji: '🎾', name: 'Balles et ballons', desc: 'Jonglerie, lancer, attraper, frapper' },
      { key: 'batons_raquettes', emoji: '🏒', name: 'Bâtons et raquettes', desc: 'Hockey, badminton, tennis, ringuette' },
      { key: 'cordes_cerceaux', emoji: '🪢', name: 'Cordes et cerceaux', desc: 'Sauter, tourner, tisser' },
      { key: 'frisbee_disques', emoji: '🥏', name: 'Frisbee et disques', desc: 'Lancer, attraper, Ultimate' },
      { key: 'cirque', emoji: '🎪', name: 'Articles de cirque', desc: 'Jonglerie, équilibre, foulards' }
    ]
  },
  {
    section: '🏃 Locomotion',
    categories: [
      { key: 'courir', emoji: '🏃', name: 'Courir', desc: 'Sprint, endurance, relais' },
      { key: 'sauter', emoji: '🦘', name: 'Sauter', desc: 'Hauteur, longueur, corde' },
      { key: 'ramper_rouler', emoji: '🐍', name: 'Ramper et rouler', desc: 'Sol, parcours, roulades' },
      { key: 'grimper', emoji: '🧗', name: 'Grimper', desc: 'Espalier, escalade, agrès' },
      { key: 'esquiver', emoji: '💨', name: 'Esquiver', desc: 'Réaction, feinte, agilité' }
    ]
  },
  {
    section: '⚖️ Stabilisation et mobilité',
    categories: [
      { key: 'equilibre', emoji: '⚖️', name: 'Équilibre', desc: 'Statique, dynamique, proprioception' },
      { key: 'souplesse', emoji: '🤸', name: 'Souplesse', desc: 'Étirements, yoga, stretch' },
      { key: 'gainage', emoji: '💪', name: 'Gainage et force', desc: 'Core, planche, pompes' },
      { key: 'coordination', emoji: '🎯', name: 'Coordination', desc: 'Yeux-mains, rythmique, bilatérale' }
    ]
  },
  {
    section: '⚽ Sports collectifs',
    categories: [
      { key: 'soccer', emoji: '⚽', name: 'Soccer', desc: 'Technique, tactique, mini-jeux' },
      { key: 'basketball', emoji: '🏀', name: 'Basketball', desc: 'Dribble, tir, défense' },
      { key: 'volleyball', emoji: '🏐', name: 'Volleyball', desc: 'Service, manchette, smash' },
      { key: 'handball', emoji: '🤾', name: 'Handball', desc: 'Technique, jeu réduit, tir' }
    ]
  },
  {
    section: '💃 Arts corporels',
    categories: [
      { key: 'danse', emoji: '💃', name: 'Danse et rythme', desc: 'Créative, folklorique, hip-hop' },
      { key: 'acrosport', emoji: '🤸', name: 'Acrosport', desc: 'Pyramides, portés, équilibre duo' },
      { key: 'expression', emoji: '🎭', name: 'Expression corporelle', desc: 'Mime, théâtre corporel' }
    ]
  }
];

// ─────────────────────────────────────────────────────
// ÉTAT DE L'APPLICATION
// ─────────────────────────────────────────────────────
let educatifsData = {};  // key -> array of educatifs
let currentCategory = null;
let currentEducatifs = [];
let filtered = [];
let totalCount = 0;

// Pagination
let currentPage = 0;
const ITEMS_PER_PAGE = 30;

// Recherche globale
let searchDebounceTimer = null;
let isSearchActive = false;

// Favoris
let showFavorisOnly = false;

function getFavoris() {
  try {
    return JSON.parse(localStorage.getItem('favoris-educatifs') || '[]');
  } catch { return []; }
}

function setFavoris(arr) {
  localStorage.setItem('favoris-educatifs', JSON.stringify(arr));
}

function getEduId(edu) {
  return edu.titre;
}

function isFavori(edu) {
  return getFavoris().includes(getEduId(edu));
}

function toggleFavori(edu) {
  const id = getEduId(edu);
  let favs = getFavoris();
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }
  setFavoris(favs);
  return favs.includes(id);
}

// Toast notification
function showToast(message) {
  let toast = document.getElementById('toast-notification');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-notification';
    toast.className = 'toast-notification';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove('toast-hidden');
  toast.classList.add('toast-visible');
  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.classList.add('toast-hidden');
  }, 2000);
}

// ─────────────────────────────────────────────────────
// CHARGEMENT DES DONNÉES JSON
// ─────────────────────────────────────────────────────
async function loadAllData() {
  const allKeys = [];
  TAXONOMY.forEach(section => {
    section.categories.forEach(cat => allKeys.push(cat.key));
  });

  const results = await Promise.allSettled(
    allKeys.map(key =>
      fetch(`data/educatifs/${key}.json`)
        .then(r => {
          if (!r.ok) throw new Error(`404: ${key}`);
          return r.json();
        })
        .then(data => ({ key, data }))
        .catch(err => {
          console.warn(`Fichier manquant: ${key}.json`, err.message);
          throw err;
        })
    )
  );

  let loaded = 0;
  totalCount = 0;

  results.forEach(result => {
    if (result.status === 'fulfilled') {
      const { key, data } = result.value;
      educatifsData[key] = Array.isArray(data) ? data : [];
      totalCount += educatifsData[key].length;
      loaded++;
    }
  });

  // Injecter les compteurs dans la taxonomy
  TAXONOMY.forEach(section => {
    section.categories.forEach(cat => {
      cat.educatifs = educatifsData[cat.key] || [];
    });
  });

  console.log(`${loaded} fichiers chargés — ${totalCount} éducatifs au total`);
}

// ─────────────────────────────────────────────────────
// INITIALISATION
// ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  initCanvas();
  await loadAllData();
  renderTaxonomy();
  updateTotalCount();
  initGlobalSearch();
  updateCoursFab();
  hideLoading();
  checkDeepLink();
  checkCoursDeepLink();
});

function hideLoading() {
  const screen = document.getElementById('loading-screen');
  if (screen) screen.classList.add('hidden');
}

function updateTotalCount() {
  const el = document.getElementById('stat-total');
  if (el) el.textContent = totalCount + '+';
}

// ─────────────────────────────────────────────────────
// TAXONOMIE — RENDU
// ─────────────────────────────────────────────────────
function renderTaxonomy() {
  const container = document.getElementById('taxonomy-container');
  if (!container) return;

  container.innerHTML = '';

  TAXONOMY.forEach(section => {
    const sectionTitle = document.createElement('div');
    sectionTitle.className = 'taxonomy-section-title';
    sectionTitle.textContent = section.section;
    container.appendChild(sectionTitle);

    const grid = document.createElement('div');
    grid.className = 'taxonomy-grid';

    section.categories.forEach(cat => {
      const tile = createTaxonomyTile(cat);
      grid.appendChild(tile);
    });

    container.appendChild(grid);
  });
}

function createTaxonomyTile(cat) {
  const tile = document.createElement('div');
  tile.className = 'taxonomy-tile';
  tile.setAttribute('data-key', cat.key);
  tile.innerHTML = `
    <div class="tile-emoji">${cat.emoji}</div>
    <div class="tile-name">${cat.name}</div>
    <div class="tile-desc">${cat.desc}</div>
    <div class="tile-count">${cat.educatifs.length} éducatifs</div>
  `;
  tile.addEventListener('click', () => selectCategory(cat.key));
  return tile;
}

// ─────────────────────────────────────────────────────
// SÉLECTION DE CATÉGORIE
// ─────────────────────────────────────────────────────
function selectCategory(key) {
  let foundCat = null;
  for (const section of TAXONOMY) {
    for (const cat of section.categories) {
      if (cat.key === key) {
        foundCat = cat;
        break;
      }
    }
    if (foundCat) break;
  }
  if (!foundCat) return;

  // Clear search state
  isSearchActive = false;
  const searchInput = document.getElementById('global-search-input');
  const clearBtn = document.getElementById('global-search-clear');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');

  currentCategory = foundCat;
  currentEducatifs = foundCat.educatifs;
  filtered = [...currentEducatifs];
  currentPage = 0;

  document.getElementById('taxonomy-container').classList.add('hidden');
  document.getElementById('controls-bar').classList.remove('hidden');
  document.getElementById('edu-section').classList.remove('hidden');

  renderCategoryHeader(foundCat);

  document.getElementById('filter-niveau').value = '';
  document.getElementById('filter-diff').value = '';

  renderEducatifs(filtered);
  updateFilterCount();

  setTimeout(() => {
    document.getElementById('taxonomy-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 50);
}

function renderCategoryHeader(cat) {
  const header = document.getElementById('category-header');
  header.innerHTML = `
    <div class="cat-header-emoji">${cat.emoji}</div>
    <div class="cat-header-info">
      <h2>${cat.name}</h2>
      <p>${cat.desc} · ${cat.educatifs.length} éducatifs disponibles</p>
    </div>
  `;
}

// ─────────────────────────────────────────────────────
// RETOUR À LA TAXONOMIE
// ─────────────────────────────────────────────────────
function goBack() {
  isSearchActive = false;
  currentCategory = null;
  currentEducatifs = [];
  filtered = [];
  currentPage = 0;

  const searchInput = document.getElementById('global-search-input');
  const clearBtn = document.getElementById('global-search-clear');
  if (searchInput) searchInput.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');

  document.getElementById('edu-section').classList.add('hidden');
  document.getElementById('controls-bar').classList.add('hidden');
  document.getElementById('taxonomy-container').classList.remove('hidden');
  document.getElementById('edu-grid').innerHTML = '';
  document.getElementById('category-header').innerHTML = '';
  renderPagination(0);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─────────────────────────────────────────────────────
// FILTRES
// ─────────────────────────────────────────────────────
function applyFilters() {
  const niveau = document.getElementById('filter-niveau').value.toLowerCase();
  const diff = document.getElementById('filter-diff').value.toLowerCase();
  const favs = getFavoris();

  filtered = currentEducatifs.filter(edu => {
    const matchNiveau = !niveau || edu.niveau.toLowerCase().includes(niveau);
    const matchDiff = !diff || edu.difficulte === diff;
    const matchFav = !showFavorisOnly || favs.includes(getEduId(edu));
    return matchNiveau && matchDiff && matchFav;
  });

  currentPage = 0;
  renderEducatifs(filtered);
  updateFilterCount();
}

function updateFilterCount() {
  const el = document.getElementById('filter-count');
  if (el) {
    el.innerHTML = `<strong>${filtered.length}</strong> éducatif${filtered.length > 1 ? 's' : ''}`;
  }
}

// ─────────────────────────────────────────────────────
// RENDU DES ÉDUCATIFS
// ─────────────────────────────────────────────────────
function renderEducatifs(list) {
  const grid = document.getElementById('edu-grid');
  grid.innerHTML = '';

  if (list.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <p>Aucun éducatif ne correspond aux filtres sélectionnés.</p>
      </div>
    `;
    renderPagination(0);
    return;
  }

  const totalPages = Math.ceil(list.length / ITEMS_PER_PAGE);
  if (currentPage >= totalPages) currentPage = totalPages - 1;
  if (currentPage < 0) currentPage = 0;

  const start = currentPage * ITEMS_PER_PAGE;
  const end = Math.min(start + ITEMS_PER_PAGE, list.length);
  const page = list.slice(start, end);

  page.forEach((edu, index) => {
    const card = createEducatifCard(edu, index);
    grid.appendChild(card);
  });

  renderPagination(totalPages);
}

// ─────────────────────────────────────────────────────
// PAGINATION
// ─────────────────────────────────────────────────────
function renderPagination(totalPages) {
  const pag = document.getElementById('pagination');
  if (!pag) return;

  if (totalPages <= 1) {
    pag.classList.add('hidden');
    pag.innerHTML = '';
    return;
  }

  pag.classList.remove('hidden');
  pag.innerHTML = '';

  // Prev button
  const prevBtn = document.createElement('button');
  prevBtn.className = 'pag-btn' + (currentPage === 0 ? ' disabled' : '');
  prevBtn.textContent = '←';
  prevBtn.disabled = currentPage === 0;
  prevBtn.addEventListener('click', () => { if (currentPage > 0) goToPage(currentPage - 1); });
  pag.appendChild(prevBtn);

  // Page buttons with ellipsis logic
  const maxVisible = 7;
  const pages = buildPageNumbers(currentPage, totalPages, maxVisible);

  pages.forEach(p => {
    if (p === '...') {
      const ell = document.createElement('span');
      ell.className = 'pag-ellipsis';
      ell.textContent = '...';
      pag.appendChild(ell);
    } else {
      const btn = document.createElement('button');
      btn.className = 'pag-btn' + (p === currentPage ? ' active' : '');
      btn.textContent = p + 1;
      btn.addEventListener('click', () => goToPage(p));
      pag.appendChild(btn);
    }
  });

  // Next button
  const nextBtn = document.createElement('button');
  nextBtn.className = 'pag-btn' + (currentPage >= totalPages - 1 ? ' disabled' : '');
  nextBtn.textContent = '→';
  nextBtn.disabled = currentPage >= totalPages - 1;
  nextBtn.addEventListener('click', () => { if (currentPage < totalPages - 1) goToPage(currentPage + 1); });
  pag.appendChild(nextBtn);

  // Info
  const info = document.createElement('span');
  info.className = 'pag-info';
  const activeList = isSearchActive ? filtered : filtered;
  const start = currentPage * ITEMS_PER_PAGE + 1;
  const end = Math.min((currentPage + 1) * ITEMS_PER_PAGE, filtered.length);
  info.textContent = `${start}-${end} sur ${filtered.length}`;
  pag.appendChild(info);
}

function buildPageNumbers(current, total, maxVisible) {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i);
  }
  const pages = [];
  pages.push(0);
  let start = Math.max(1, current - 1);
  let end = Math.min(total - 2, current + 1);
  if (current <= 2) { start = 1; end = Math.min(total - 2, 3); }
  if (current >= total - 3) { start = Math.max(1, total - 4); end = total - 2; }
  if (start > 1) pages.push('...');
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < total - 2) pages.push('...');
  pages.push(total - 1);
  return pages;
}

function goToPage(page) {
  currentPage = page;
  renderEducatifs(filtered);
  document.getElementById('taxonomy-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createEducatifCard(edu, index) {
  const card = document.createElement('div');
  card.className = 'edu-card';
  card.style.animationDelay = `${index * 0.04}s`;

  const diffLabel = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
  const diffEmoji = { debutant: '🟢', intermediaire: '🟠', avance: '🔴' };

  const catBadge = (isSearchActive && edu._catEmoji && edu._catName)
    ? `<span class="badge badge-category">${edu._catEmoji} ${escapeHtml(edu._catName)}</span>`
    : '';

  const fav = isFavori(edu);
  card.innerHTML = `
    <button class="fav-btn ${fav ? 'fav-active' : ''}" title="Ajouter aux favoris" aria-label="Favori">${fav ? '\u2605' : '\u2606'}</button>
    <div class="edu-card-header">
      <div class="edu-card-title">${escapeHtml(edu.titre)}</div>
    </div>
    ${catBadge ? `<div class="edu-card-cat">${catBadge}</div>` : ''}
    <p class="edu-card-desc">${escapeHtml(edu.desc)}</p>
    <div class="edu-card-meta">
      <span class="badge badge-${edu.difficulte}">${diffEmoji[edu.difficulte]} ${diffLabel[edu.difficulte]}</span>
      <span class="badge badge-niveau">${escapeHtml(edu.niveau)}</span>
    </div>
    <div class="edu-card-footer">
      <span class="footer-duration">⏱ ${edu.duree} min</span>
      <span class="footer-competence">${escapeHtml(edu.competence)}</span>
      <span class="footer-arrow">→</span>
    </div>
    <button class="edu-card-add-btn ${isInCours(edu) ? 'added' : ''}" title="${isInCours(edu) ? 'Retirer du cours' : 'Ajouter au cours'}">${isInCours(edu) ? '✓' : '+'}</button>
  `;

  // Add to cours button
  const addBtn = card.querySelector('.edu-card-add-btn');
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCoursItem(edu, addBtn);
  });

  // Fav button click (stop propagation so card click doesn't fire)
  const favBtn = card.querySelector('.fav-btn');
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const nowFav = toggleFavori(edu);
    favBtn.textContent = nowFav ? '\u2605' : '\u2606';
    favBtn.classList.toggle('fav-active', nowFav);
    // If we're in favoris-only mode and just unfavorited, re-filter
    if (showFavorisOnly && !nowFav) {
      applyFilters();
    }
  });

  card.addEventListener('click', () => openModal(edu));
  return card;
}

// ─────────────────────────────────────────────────────
// RECHERCHE GLOBALE
// ─────────────────────────────────────────────────────
function initGlobalSearch() {
  const input = document.getElementById('global-search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      performGlobalSearch(input.value.trim());
    }, 250);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      clearGlobalSearch();
    }
  });
}

function performGlobalSearch(query) {
  const clearBtn = document.getElementById('global-search-clear');

  if (!query || query.length < 2) {
    if (isSearchActive) clearGlobalSearch();
    if (clearBtn) clearBtn.classList.add('hidden');
    return;
  }

  if (clearBtn) clearBtn.classList.remove('hidden');

  const terms = query.toLowerCase().split(/\s+/);

  // Build a category lookup for display
  const catLookup = {};
  TAXONOMY.forEach(section => {
    section.categories.forEach(cat => {
      catLookup[cat.key] = { emoji: cat.emoji, name: cat.name };
    });
  });

  const results = [];
  for (const [key, edus] of Object.entries(educatifsData)) {
    const catInfo = catLookup[key] || { emoji: '', name: key };
    for (const edu of edus) {
      const searchable = [
        edu.titre || '',
        edu.desc || '',
        edu.competence || '',
        edu.niveau || '',
        (edu.tags || []).join(' ')
      ].join(' ').toLowerCase();

      const match = terms.every(t => searchable.includes(t));
      if (match) {
        results.push({ ...edu, _catKey: key, _catEmoji: catInfo.emoji, _catName: catInfo.name });
      }
    }
  }

  isSearchActive = true;
  currentCategory = null;
  currentEducatifs = results;
  filtered = results;
  currentPage = 0;

  // Show results in edu-grid
  document.getElementById('taxonomy-container').classList.add('hidden');
  document.getElementById('controls-bar').classList.add('hidden');
  document.getElementById('edu-section').classList.remove('hidden');
  document.getElementById('global-search-bar').classList.remove('hidden');

  const header = document.getElementById('category-header');
  header.innerHTML = `
    <div class="cat-header-emoji">🔍</div>
    <div class="cat-header-info">
      <h2>Résultats de recherche</h2>
      <p>${results.length} éducatif${results.length > 1 ? 's' : ''} trouvé${results.length > 1 ? 's' : ''} pour « ${escapeHtml(query)} »</p>
    </div>
  `;

  renderEducatifs(filtered);
}

function clearGlobalSearch() {
  const input = document.getElementById('global-search-input');
  const clearBtn = document.getElementById('global-search-clear');
  if (input) input.value = '';
  if (clearBtn) clearBtn.classList.add('hidden');

  isSearchActive = false;
  currentCategory = null;
  currentEducatifs = [];
  filtered = [];
  currentPage = 0;

  document.getElementById('edu-section').classList.add('hidden');
  document.getElementById('controls-bar').classList.add('hidden');
  document.getElementById('taxonomy-container').classList.remove('hidden');
  document.getElementById('edu-grid').innerHTML = '';
  document.getElementById('category-header').innerHTML = '';
  renderPagination(0);
}

// ─────────────────────────────────────────────────────
// MASCOTS — alternance dans le modal
// ─────────────────────────────────────────────────────
const MASCOT_POSES = [
  'img/mascots/pose01.png','img/mascots/pose02.png','img/mascots/pose03.png',
  'img/mascots/pose04.png','img/mascots/pose05.png','img/mascots/pose06.png',
  'img/mascots/pose07.png','img/mascots/pose08.png','img/mascots/pose09.png',
  'img/mascots/pose10.png','img/mascots/pose11.png','img/mascots/pose12.png',
  'img/mascots/pose13.png','img/mascots/pose14.png'
];
let mascotIndex = 0;

// ─────────────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────────────
function openModal(edu) {
  const overlay = document.getElementById('modal-overlay');
  const content = document.getElementById('modal-content');

  const diffLabel = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
  const diffEmoji = { debutant: '🟢', intermediaire: '🟠', avance: '🔴' };

  const materielHtml = edu.materiel
    ? edu.materiel.map(m => `<span class="material-tag">${escapeHtml(m)}</span>`).join('')
    : '';

  const tagsHtml = edu.tags
    ? edu.tags.map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join('')
    : '';

  const modalFav = isFavori(edu);
  const eduId = encodeURIComponent(getEduId(edu));
  const mascotSrc = MASCOT_POSES[mascotIndex % MASCOT_POSES.length];
  mascotIndex++;

  content.innerHTML = `
    <div class="modal-header">
      <img src="${mascotSrc}" alt="Mr Root" class="modal-mascot" />
      <div class="modal-header-text">
        <h2 class="modal-title">${escapeHtml(edu.titre)}</h2>
        <div class="modal-badges">
          <span class="badge badge-${edu.difficulte}">${diffEmoji[edu.difficulte]} ${diffLabel[edu.difficulte]}</span>
          <span class="badge badge-niveau">${escapeHtml(edu.niveau)}</span>
        </div>
      </div>
    </div>

    <div class="modal-actions">
      <button class="modal-action-btn modal-fav-btn ${modalFav ? 'fav-active' : ''}" title="Favori">${modalFav ? '\u2605' : '\u2606'} Favori</button>
      <button class="modal-action-btn modal-print-btn" title="Imprimer">🖨️ Imprimer</button>
      <button class="modal-action-btn modal-pdf-btn" title="Sauvegarder PDF">📄 Sauvegarder PDF</button>
      <button class="modal-action-btn modal-share-btn" title="Partager">🔗 Partager</button>
      <button class="modal-action-btn modal-cours-btn ${isInCours(edu) ? 'fav-active' : ''}" title="Ajouter au cours">${isInCours(edu) ? '✓ Dans mon cours' : '📋 Ajouter au cours'}</button>
    </div>

    <div class="modal-meta-grid">
      <div class="meta-item">
        <div class="meta-item-label">Durée</div>
        <div class="meta-item-value">⏱ ${edu.duree} minutes</div>
      </div>
      <div class="meta-item">
        <div class="meta-item-label">Compétence</div>
        <div class="meta-item-value">${escapeHtml(edu.competence)}</div>
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-label">Description pédagogique</div>
      <p class="modal-desc">${escapeHtml(edu.desc)}</p>
    </div>

    ${edu.materiel && edu.materiel.length > 0 ? `
    <div class="modal-section">
      <div class="modal-section-label">Matériel requis</div>
      <div class="modal-material">${materielHtml}</div>
    </div>
    ` : ''}

    ${edu.variantes ? `
    <div class="modal-section">
      <div class="modal-section-label">Variantes et progressions</div>
      <p class="modal-desc">${escapeHtml(edu.variantes)}</p>
    </div>
    ` : ''}

    ${edu.adaptation ? `
    <div class="modal-section">
      <div class="modal-section-label">Adaptations et différenciation</div>
      <p class="modal-desc">${escapeHtml(edu.adaptation)}</p>
    </div>
    ` : ''}

    ${edu.progression ? `
    <div class="modal-section">
      <div class="modal-section-label">📈 Progression par niveau</div>
      <div class="progression-levels">
        ${['niveau1','niveau2','niveau3'].map(nk => {
          const p = edu.progression[nk];
          if (!p) return '';
          const emoji = nk === 'niveau1' ? '🟢' : nk === 'niveau2' ? '🟠' : '🔴';
          const color = nk === 'niveau1' ? '#4CAF50' : nk === 'niveau2' ? '#FF9800' : '#f44336';
          return `
          <div class="progression-card" style="border-left: 4px solid ${color};">
            <div class="progression-title">${emoji} ${escapeHtml(p.titre)}</div>
            <p class="progression-desc">${escapeHtml(p.description)}</p>
            <div class="progression-sub">📋 Consignes :</div>
            <ul class="progression-list">${p.consignes.map(c => '<li>' + escapeHtml(c) + '</li>').join('')}</ul>
            <div class="progression-sub">✅ Critères de réussite :</div>
            <ul class="progression-list">${p.criteres_reussite.map(c => '<li>' + escapeHtml(c) + '</li>').join('')}</ul>
          </div>`;
        }).join('')}
      </div>
    </div>
    ` : ''}

    ${tagsHtml ? `
    <div class="modal-divider"></div>
    <div class="modal-section">
      <div class="modal-tags">${tagsHtml}</div>
    </div>
    ` : ''}

    <div class="modal-footer-logo">
      <a href="https://zonetotalsport.ca" target="_blank">
        <img src="img/logo-zonetotalsport.png" alt="ZoneTotalSport.ca" />
      </a>
    </div>
  `;

  // Modal fav button
  const modalFavBtn = content.querySelector('.modal-fav-btn');
  modalFavBtn.addEventListener('click', () => {
    const nowFav = toggleFavori(edu);
    modalFavBtn.textContent = (nowFav ? '\u2605' : '\u2606') + ' Favori';
    modalFavBtn.classList.toggle('fav-active', nowFav);
    // Update card star if visible
    refreshCardFavState(edu);
  });

  // Print button
  content.querySelector('.modal-print-btn').addEventListener('click', () => {
    window.print();
  });

  // PDF button
  content.querySelector('.modal-pdf-btn').addEventListener('click', () => {
    const card = document.getElementById('modal-card');
    const printWin = window.open('', '_blank');
    printWin.document.write(`<!DOCTYPE html>
<html><head><title>${escapeHtml(edu.titre)} — Zone Total Sport</title>
<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Bangers&family=Schoolbell&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Schoolbell', cursive; margin: 40px; color: #222; }
  h1 { font-family: 'Luckiest Guy', cursive; font-size: 2.5rem; color: #0077CC; letter-spacing: 2px; margin-bottom: 8px; }
  .badges span { display: inline-block; padding: 4px 14px; border-radius: 20px; font-family: 'Bangers', cursive; font-size: 0.9rem; font-weight: 700; margin-right: 8px; }
  .badge-green { background: #E8F5E9; color: #2E7D32; border: 2px solid #66BB6A; }
  .badge-orange { background: #FFF3E0; color: #E65100; border: 2px solid #FF9800; }
  .badge-red { background: #FFEBEE; color: #C62828; border: 2px solid #EF5350; }
  .badge-blue { background: #E3F2FD; color: #0D47A1; border: 2px solid #42A5F5; }
  .meta { display: flex; gap: 30px; margin: 20px 0; font-family: 'Luckiest Guy', cursive; font-size: 1.1rem; color: #555; }
  h2 { font-family: 'Luckiest Guy', cursive; font-size: 1.3rem; color: #E91E63; letter-spacing: 1px; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #E91E63; padding-bottom: 4px; }
  p { font-size: 1.2rem; line-height: 1.8; }
  .materiel span { display: inline-block; background: #FFF8E1; border: 1px solid #FFB74D; padding: 4px 12px; border-radius: 8px; margin: 3px; font-size: 1rem; }
  .footer { margin-top: 40px; text-align: center; color: #999; font-size: 0.9rem; font-family: 'Bangers', cursive; }
  .prog-card { border-left: 4px solid #ccc; padding: 10px 14px; margin: 8px 0; background: #fafafa; border-radius: 8px; }
  .prog-card h3 { font-family: 'Luckiest Guy', cursive; font-size: 1.1rem; margin: 0 0 4px; }
  .prog-card ul { margin: 4px 0; padding-left: 20px; font-size: 0.95rem; }
  .prog-card .sub { font-weight: 700; font-size: 0.9rem; margin-top: 8px; }
</style></head><body>
<h1>${escapeHtml(edu.titre)}</h1>
<div class="badges">
  <span class="${edu.difficulte === 'debutant' ? 'badge-green' : edu.difficulte === 'intermediaire' ? 'badge-orange' : 'badge-red'}">${diffLabel[edu.difficulte]}</span>
  <span class="badge-blue">${escapeHtml(edu.niveau)}</span>
</div>
<div class="meta"><span>⏱ ${edu.duree} minutes</span><span>🎯 ${escapeHtml(edu.competence)}</span></div>
<h2>📋 Description</h2>
<p>${escapeHtml(edu.desc)}</p>
${edu.materiel ? '<h2>🎒 Matériel</h2><div class="materiel">' + edu.materiel.map(m => '<span>' + escapeHtml(m) + '</span>').join('') + '</div>' : ''}
${edu.variantes ? '<h2>🔄 Variantes</h2><p>' + escapeHtml(edu.variantes) + '</p>' : ''}
${edu.adaptation ? '<h2>♿ Adaptations</h2><p>' + escapeHtml(edu.adaptation) + '</p>' : ''}
${edu.progression ? (() => {
  let h = '<h2>📈 Progression par niveau</h2>';
  ['niveau1','niveau2','niveau3'].forEach(nk => {
    const p = edu.progression[nk]; if(!p) return;
    const clr = nk==='niveau1'?'#4CAF50':nk==='niveau2'?'#FF9800':'#f44336';
    const em = nk==='niveau1'?'🟢':nk==='niveau2'?'🟠':'🔴';
    h += '<div class="prog-card" style="border-left-color:'+clr+'">';
    h += '<h3>'+em+' '+escapeHtml(p.titre)+'</h3>';
    h += '<p style="font-size:0.95rem;color:#555;">'+escapeHtml(p.description)+'</p>';
    h += '<div class="sub">📋 Consignes :</div><ul>'+p.consignes.map(c=>'<li>'+escapeHtml(c)+'</li>').join('')+'</ul>';
    h += '<div class="sub">✅ Critères de réussite :</div><ul>'+p.criteres_reussite.map(c=>'<li>'+escapeHtml(c)+'</li>').join('')+'</ul>';
    h += '</div>';
  });
  return h;
})() : ''}
<div class="footer"><a href="https://zonetotalsport.ca" target="_blank" style="display:inline-block; background:#fff; border-radius:12px; padding:10px 20px;"><img src="${window.location.origin + '/img/logo-zonetotalsport.png'}" alt="ZoneTotalSport.ca" style="max-width:260px; height:auto; display:block;" /></a><br><a href="https://zonetotalsport.ca" target="_blank">zonetotalsport.ca</a> — Éducatifs ÉPS</div>
</body></html>`);
    printWin.document.close();
    setTimeout(() => { printWin.print(); }, 500);
  });

  // Share button
  content.querySelector('.modal-share-btn').addEventListener('click', () => {
    const url = `https://educatifs.zonetotalsport.ca/?id=${eduId}`;
    navigator.clipboard.writeText(url).then(() => {
      showToast('Lien copié !');
    }).catch(() => {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('Lien copié !');
    });
  });

  // Add to cours button in modal
  const modalCoursBtn = content.querySelector('.modal-cours-btn');
  modalCoursBtn.addEventListener('click', () => {
    if (isInCours(edu)) {
      removeFromCours(edu.titre);
      modalCoursBtn.textContent = '📋 Ajouter au cours';
      modalCoursBtn.classList.remove('fav-active');
      showToast('Retiré du cours');
    } else {
      addToCours(edu);
      modalCoursBtn.textContent = '✓ Dans mon cours';
      modalCoursBtn.classList.add('fav-active');
      showToast('Ajouté au cours !');
    }
    // Refresh card + button states in grid
    refreshCardCoursState(edu);
  });

  overlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function refreshCardCoursState(edu) {
  const cards = document.querySelectorAll('.edu-card');
  cards.forEach(card => {
    const titleEl = card.querySelector('.edu-card-title');
    if (titleEl && titleEl.textContent === edu.titre) {
      const addBtn = card.querySelector('.edu-card-add-btn');
      if (addBtn) {
        const inCours = isInCours(edu);
        addBtn.classList.toggle('added', inCours);
        addBtn.textContent = inCours ? '✓' : '+';
        addBtn.title = inCours ? 'Retirer du cours' : 'Ajouter au cours';
      }
    }
  });
}

function closeModal(event) {
  if (event && event.target !== document.getElementById('modal-overlay') && event.type === 'click') {
    if (event.target.closest('#modal-card')) return;
  }
  document.getElementById('modal-overlay').classList.add('hidden');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Refresh card fav star after toggling in modal
function refreshCardFavState(edu) {
  const cards = document.querySelectorAll('.edu-card');
  const id = getEduId(edu);
  cards.forEach(card => {
    const titleEl = card.querySelector('.edu-card-title');
    if (titleEl && titleEl.textContent === edu.titre) {
      const btn = card.querySelector('.fav-btn');
      if (btn) {
        const nowFav = isFavori(edu);
        btn.textContent = nowFav ? '\u2605' : '\u2606';
        btn.classList.toggle('fav-active', nowFav);
      }
    }
  });
}

// Toggle favoris filter
function toggleFavorisFilter() {
  showFavorisOnly = !showFavorisOnly;
  const btn = document.getElementById('favoris-filter-btn');
  if (btn) {
    btn.classList.toggle('filter-active', showFavorisOnly);
  }

  if (showFavorisOnly && !currentCategory && !isSearchActive) {
    // Show all favorited educatifs across all categories
    const favs = getFavoris();
    const catLookup = {};
    TAXONOMY.forEach(section => {
      section.categories.forEach(cat => {
        catLookup[cat.key] = { emoji: cat.emoji, name: cat.name };
      });
    });

    const results = [];
    for (const [key, edus] of Object.entries(educatifsData)) {
      const catInfo = catLookup[key] || { emoji: '', name: key };
      for (const edu of edus) {
        if (favs.includes(getEduId(edu))) {
          results.push({ ...edu, _catKey: key, _catEmoji: catInfo.emoji, _catName: catInfo.name });
        }
      }
    }

    isSearchActive = true;
    currentEducatifs = results;
    filtered = results;
    currentPage = 0;

    document.getElementById('taxonomy-container').classList.add('hidden');
    document.getElementById('controls-bar').classList.add('hidden');
    document.getElementById('edu-section').classList.remove('hidden');

    const header = document.getElementById('category-header');
    header.innerHTML = `
      <div class="cat-header-emoji">\u2b50</div>
      <div class="cat-header-info">
        <h2>Mes favoris</h2>
        <p>${results.length} \u00e9ducatif${results.length > 1 ? 's' : ''} favori${results.length > 1 ? 's' : ''}</p>
      </div>
    `;

    renderEducatifs(filtered);
  } else if (!showFavorisOnly && !currentCategory) {
    // Return to taxonomy view
    isSearchActive = false;
    currentEducatifs = [];
    filtered = [];
    currentPage = 0;
    document.getElementById('edu-section').classList.add('hidden');
    document.getElementById('controls-bar').classList.add('hidden');
    document.getElementById('taxonomy-container').classList.remove('hidden');
    document.getElementById('edu-grid').innerHTML = '';
    document.getElementById('category-header').innerHTML = '';
    renderPagination(0);
  } else {
    applyFilters();
  }
}

// Deep link: check for ?id= on page load
function checkDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  const decodedId = decodeURIComponent(id);
  // Search across all data
  for (const [key, edus] of Object.entries(educatifsData)) {
    for (const edu of edus) {
      if (edu.titre === decodedId) {
        openModal(edu);
        return;
      }
    }
  }
}

// ─────────────────────────────────────────────────────
// CONCEPTION DE MON COURS
// ─────────────────────────────────────────────────────

function getMonCours() {
  try {
    return JSON.parse(localStorage.getItem('mon-cours-educatifs') || '[]');
  } catch { return []; }
}

function setMonCours(arr) {
  localStorage.setItem('mon-cours-educatifs', JSON.stringify(arr));
  updateCoursFab();
}

function getCoursConfig() {
  try {
    return JSON.parse(localStorage.getItem('mon-cours-config') || '{}');
  } catch { return {}; }
}

function setCoursConfig(config) {
  localStorage.setItem('mon-cours-config', JSON.stringify(config));
}

function isInCours(edu) {
  return getMonCours().some(e => e.titre === edu.titre);
}

function addToCours(edu) {
  const cours = getMonCours();
  if (cours.some(e => e.titre === edu.titre)) return false;
  // Store essential fields + category info
  const catInfo = findCatForEdu(edu);
  cours.push({
    titre: edu.titre,
    desc: edu.desc,
    niveau: edu.niveau,
    difficulte: edu.difficulte,
    duree: edu.duree,
    competence: edu.competence,
    materiel: edu.materiel,
    variantes: edu.variantes,
    adaptation: edu.adaptation,
    tags: edu.tags,
    _catEmoji: edu._catEmoji || (catInfo ? catInfo.emoji : ''),
    _catName: edu._catName || (catInfo ? catInfo.name : ''),
    _note: ''
  });
  setMonCours(cours);
  return true;
}

function removeFromCours(titre) {
  const cours = getMonCours().filter(e => e.titre !== titre);
  setMonCours(cours);
}

function findCatForEdu(edu) {
  for (const section of TAXONOMY) {
    for (const cat of section.categories) {
      if (cat.educatifs && cat.educatifs.some(e => e.titre === edu.titre)) {
        return cat;
      }
    }
  }
  return null;
}

function updateCoursFab() {
  const count = getMonCours().length;
  const badge = document.getElementById('cours-fab-count');
  if (badge) {
    badge.textContent = count;
    badge.classList.toggle('hidden', count === 0);
  }
}

function toggleCoursItem(edu, btn) {
  if (isInCours(edu)) {
    removeFromCours(edu.titre);
    if (btn) {
      btn.classList.remove('added');
      btn.textContent = '+';
      btn.title = 'Ajouter au cours';
    }
    showToast('Retiré du cours');
  } else {
    addToCours(edu);
    if (btn) {
      btn.classList.add('added');
      btn.textContent = '✓';
      btn.title = 'Retirer du cours';
    }
    showToast('Ajouté au cours !');
  }
}

function openCours() {
  // Hide main content
  const hero = document.querySelector('.hero');
  const taxo = document.getElementById('taxonomy-section');
  const statsBar = document.querySelector('.stats-bar');
  const fab = document.getElementById('cours-fab');
  if (hero) hero.classList.add('hidden');
  if (taxo) taxo.classList.add('hidden');
  if (statsBar) statsBar.classList.add('hidden');
  if (fab) fab.classList.add('hidden');

  // Show cours section
  const section = document.getElementById('cours-section');
  if (!section) { console.error('cours-section not found'); return; }
  section.classList.remove('hidden');

  // Load config
  const config = getCoursConfig();
  const titreInput = document.getElementById('cours-titre');
  const niveauSelect = document.getElementById('cours-niveau');
  const dureeInput = document.getElementById('cours-duree');
  const notesArea = document.getElementById('cours-notes');
  if (titreInput) titreInput.value = config.titre || '';
  if (niveauSelect) niveauSelect.value = config.niveau || '';
  if (dureeInput) dureeInput.value = config.duree || '';
  if (notesArea) notesArea.value = config.notes || '';

  // Auto-save config on change
  [titreInput, niveauSelect, dureeInput, notesArea].forEach(el => {
    if (el) {
      el.removeEventListener('input', saveCoursConfigFromUI);
      el.addEventListener('input', saveCoursConfigFromUI);
    }
  });

  // Refresh browser when niveau changes
  if (niveauSelect) {
    niveauSelect.removeEventListener('change', updateCoursBrowser);
    niveauSelect.addEventListener('change', updateCoursBrowser);
  }

  populateCoursCatSelect();
  renderCoursList();
  updateCoursBrowser();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveCoursConfigFromUI() {
  setCoursConfig({
    titre: document.getElementById('cours-titre')?.value || '',
    niveau: document.getElementById('cours-niveau')?.value || '',
    duree: document.getElementById('cours-duree')?.value || '',
    notes: document.getElementById('cours-notes')?.value || ''
  });
}

function closeCours() {
  saveCoursConfigFromUI();
  const section = document.getElementById('cours-section');
  const hero = document.querySelector('.hero');
  const taxo = document.getElementById('taxonomy-section');
  const statsBar = document.querySelector('.stats-bar');
  const fab = document.getElementById('cours-fab');
  if (section) section.classList.add('hidden');
  if (hero) hero.classList.remove('hidden');
  if (taxo) taxo.classList.remove('hidden');
  if (statsBar) statsBar.classList.remove('hidden');
  if (fab) fab.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderCoursList() {
  const list = document.getElementById('cours-list');
  const cours = getMonCours();
  const countEl = document.getElementById('cours-count');
  const actionsEl = document.getElementById('cours-actions');
  const totalMinEl = document.getElementById('cours-total-min');

  if (countEl) countEl.textContent = cours.length;

  if (cours.length === 0) {
    list.innerHTML = `
      <div class="cours-empty">
        <div class="cours-empty-icon">📭</div>
        <p>Aucun éducatif ajouté. Retourne à la banque et clique sur le <strong>+</strong> des cartes pour ajouter des éducatifs à ton cours.</p>
      </div>
    `;
    if (actionsEl) actionsEl.classList.add('hidden');
    return;
  }

  if (actionsEl) actionsEl.classList.remove('hidden');

  let totalMin = 0;
  list.innerHTML = '';

  cours.forEach((edu, index) => {
    totalMin += edu.duree || 0;
    const diffLabel = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
    const diffEmoji = { debutant: '🟢', intermediaire: '🟠', avance: '🔴' };

    const item = document.createElement('div');
    item.className = 'cours-item';
    item.innerHTML = `
      <div class="cours-item-num">${index + 1}</div>
      <div class="cours-item-body">
        <div class="cours-item-title">${escapeHtml(edu.titre)}</div>
        <div class="cours-item-meta">
          <span>${edu._catEmoji || ''} ${escapeHtml(edu._catName || '')}</span>
          <span>⏱ ${edu.duree} min</span>
          <span>${diffEmoji[edu.difficulte] || ''} ${diffLabel[edu.difficulte] || ''}</span>
          <span>${escapeHtml(edu.niveau)}</span>
        </div>
        <div class="cours-item-note">
          <input type="text" placeholder="Ajouter une note pour cet éducatif..." value="${escapeHtml(edu._note || '')}" data-index="${index}" />
        </div>
      </div>
      <div class="cours-item-actions">
        <button title="Monter" class="cours-up-btn" ${index === 0 ? 'disabled' : ''}>▲</button>
        <button title="Descendre" class="cours-down-btn" ${index === cours.length - 1 ? 'disabled' : ''}>▼</button>
        <button title="Retirer" class="cours-remove-btn">✕</button>
      </div>
    `;

    // Click title to view educatif details
    const titleEl = item.querySelector('.cours-item-title');
    titleEl.style.cursor = 'pointer';
    titleEl.addEventListener('click', () => {
      // Find the full edu object from data
      for (const [key, edus] of Object.entries(educatifsData)) {
        const found = edus.find(e => e.titre === edu.titre);
        if (found) { openModal(found); return; }
      }
      openModal(edu);
    });

    // Note input
    const noteInput = item.querySelector('.cours-item-note input');
    noteInput.addEventListener('input', () => {
      const c = getMonCours();
      if (c[index]) {
        c[index]._note = noteInput.value;
        setMonCours(c);
      }
    });

    // Move up
    item.querySelector('.cours-up-btn').addEventListener('click', () => {
      if (index > 0) {
        const c = getMonCours();
        [c[index - 1], c[index]] = [c[index], c[index - 1]];
        setMonCours(c);
        renderCoursList();
      }
    });

    // Move down
    item.querySelector('.cours-down-btn').addEventListener('click', () => {
      if (index < cours.length - 1) {
        const c = getMonCours();
        [c[index], c[index + 1]] = [c[index + 1], c[index]];
        setMonCours(c);
        renderCoursList();
      }
    });

    // Remove
    item.querySelector('.cours-remove-btn').addEventListener('click', () => {
      removeFromCours(edu.titre);
      renderCoursList();
      updateCoursBrowser();
      showToast('Éducatif retiré du cours');
    });

    list.appendChild(item);
  });

  if (totalMinEl) totalMinEl.textContent = totalMin;
}

function clearCours() {
  if (getMonCours().length === 0) return;
  setMonCours([]);
  renderCoursList();
  updateCoursBrowser();
  showToast('Cours vidé');
}

function buildCoursHTML() {
  const cours = getMonCours();
  const config = getCoursConfig();
  const diffLabel = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };

  let totalMin = 0;
  cours.forEach(e => totalMin += e.duree || 0);

  let edusHTML = '';
  cours.forEach((edu, i) => {
    edusHTML += `
      <div style="border:1px solid #ddd; border-radius:12px; padding:16px; margin-bottom:12px; page-break-inside:avoid; background:#fafafa;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px;">
          <div style="width:36px; height:36px; border-radius:50%; background:#0077CC; color:#fff; display:flex; align-items:center; justify-content:center; font-family:'Bangers',cursive; font-weight:700; font-size:1.1rem; flex-shrink:0;">${i + 1}</div>
          <div>
            <div style="font-family:'Luckiest Guy',cursive; font-size:1.2rem; letter-spacing:1px; color:#222;">${escapeHtml(edu.titre)}</div>
            <div style="font-size:0.85rem; color:#666; font-family:Schoolbell,cursive;">
              ${edu._catEmoji || ''} ${escapeHtml(edu._catName || '')} · ⏱ ${edu.duree} min · ${escapeHtml(diffLabel[edu.difficulte] || '')} · ${escapeHtml(edu.niveau)}
            </div>
          </div>
        </div>
        <p style="font-size:0.95rem; line-height:1.6; color:#333; font-family:Schoolbell,cursive; margin:8px 0;">${escapeHtml(edu.desc)}</p>
        ${edu.materiel && edu.materiel.length > 0 && edu.materiel[0] !== 'Aucun' ? '<div style="font-size:0.85rem; color:#555; margin-top:6px;"><strong>Matériel :</strong> ' + edu.materiel.map(m => escapeHtml(m)).join(', ') + '</div>' : ''}
        ${edu._note ? '<div style="font-size:0.85rem; color:#0077CC; margin-top:6px; font-style:italic;">📝 Note : ' + escapeHtml(edu._note) + '</div>' : ''}
      </div>
    `;
  });

  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8">
<title>${escapeHtml(config.titre || 'Mon cours')} — Zone Total Sport</title>
<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Bangers&family=Schoolbell&display=swap" rel="stylesheet">
<style>
  @page { margin: 20mm 15mm 25mm 15mm; }
  body { font-family: 'Schoolbell', cursive; margin: 0; padding: 30px; color: #222; }
  .header { text-align: center; margin-bottom: 24px; border-bottom: 3px solid #0077CC; padding-bottom: 16px; }
  .header h1 { font-family: 'Luckiest Guy', cursive; font-size: 2.2rem; color: #0077CC; letter-spacing: 2px; margin: 0 0 6px; }
  .header .info { font-size: 0.95rem; color: #555; }
  .header .info strong { color: #333; }
  .notes { background: #f0f7ff; border: 1px solid #b3d4fc; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; font-size: 0.95rem; line-height: 1.6; }
  .notes-label { font-family: 'Bangers', cursive; font-weight: 700; color: #0077CC; margin-bottom: 4px; }
  .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-family: 'Bangers', cursive; font-size: 0.8rem; color: #999; padding: 10px; border-top: 1px solid #ddd; background: #fff; }
  .footer a { color: #0077CC; text-decoration: none; }
  @media print { .footer { position: fixed; bottom: 0; } }
</style></head><body>
<div class="header">
  <h1>📋 ${escapeHtml(config.titre || 'Mon cours d\'éducatifs')}</h1>
  <div class="info">
    ${config.niveau ? '<strong>Niveau :</strong> ' + escapeHtml(config.niveau) + ' · ' : ''}
    ${config.duree ? '<strong>Durée :</strong> ' + escapeHtml(config.duree) + ' · ' : ''}
    <strong>${cours.length}</strong> éducatif${cours.length > 1 ? 's' : ''} · Durée estimée : <strong>${totalMin} min</strong>
  </div>
</div>
${config.notes ? '<div class="notes"><div class="notes-label">📝 Notes</div>' + escapeHtml(config.notes) + '</div>' : ''}
${edusHTML}
<div class="footer">
  <a href="https://zonetotalsport.ca" target="_blank" style="display:inline-block; background:#fff; border-radius:12px; padding:10px 20px;"><img src="${window.location.origin + '/img/logo-zonetotalsport.png'}" alt="ZoneTotalSport.ca" style="max-width:280px; height:auto; display:block;" /></a><br>
  Créé avec <a href="https://zonetotalsport.ca" target="_blank">zonetotalsport.ca</a> — Éducatifs ÉPS
</div>
</body></html>`;
}

function printCours() {
  saveCoursConfigFromUI();
  const html = buildCoursHTML();
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

function exportCoursPDF() {
  saveCoursConfigFromUI();
  const html = buildCoursHTML();
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}

function shareCours() {
  saveCoursConfigFromUI();
  const cours = getMonCours();
  const config = getCoursConfig();

  // Build a compact share data
  const shareData = {
    t: config.titre || '',
    n: config.niveau || '',
    d: config.duree || '',
    no: config.notes || '',
    e: cours.map(e => ({
      t: e.titre,
      nt: e._note || ''
    }))
  };

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
  const url = `https://educatifs.zonetotalsport.ca/?cours=${encoded}`;

  navigator.clipboard.writeText(url).then(() => {
    showToast('Lien du cours copié !');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Lien du cours copié !');
  });
}

function checkCoursDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const coursParam = params.get('cours');
  if (!coursParam) return;

  try {
    const data = JSON.parse(decodeURIComponent(escape(atob(coursParam))));
    // Restore config
    setCoursConfig({
      titre: data.t || '',
      niveau: data.n || '',
      duree: data.d || '',
      notes: data.no || ''
    });

    // Find and add educatifs by titre
    const titres = (data.e || []).map(e => ({ titre: e.t, note: e.nt || '' }));
    const cours = [];
    for (const item of titres) {
      for (const [key, edus] of Object.entries(educatifsData)) {
        const found = edus.find(e => e.titre === item.titre);
        if (found) {
          const catInfo = findCatForEdu(found);
          cours.push({
            ...found,
            _catEmoji: catInfo ? catInfo.emoji : '',
            _catName: catInfo ? catInfo.name : '',
            _note: item.note
          });
          break;
        }
      }
    }
    setMonCours(cours);
    openCours();
  } catch (err) {
    console.warn('Cours deep link invalide', err);
  }
}

// ─────────────────────────────────────────────────────
// BROWSER D'ÉDUCATIFS DANS LA PAGE COURS
// ─────────────────────────────────────────────────────

function populateCoursCatSelect() {
  const select = document.getElementById('cours-cat-select');
  if (!select) return;
  // Keep the first default option, clear the rest
  select.innerHTML = '<option value="">— Choisir un moyen d\'action —</option>';
  TAXONOMY.forEach(section => {
    const group = document.createElement('optgroup');
    group.label = section.section;
    section.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.key;
      opt.textContent = `${cat.emoji} ${cat.name} (${(educatifsData[cat.key] || []).length})`;
      group.appendChild(opt);
    });
    select.appendChild(group);
  });
}

function updateCoursBrowser() {
  const container = document.getElementById('cours-browser-results');
  if (!container) return;

  const catKey = document.getElementById('cours-cat-select')?.value;
  const niveau = document.getElementById('cours-niveau')?.value?.toLowerCase() || '';
  const search = (document.getElementById('cours-browser-search')?.value || '').toLowerCase().trim();

  if (!catKey) {
    container.innerHTML = '<p class="cours-browser-hint">Sélectionne un moyen d\'action pour voir les éducatifs disponibles.</p>';
    return;
  }

  const allEdus = educatifsData[catKey] || [];

  // Filter by niveau if selected
  let results = allEdus.filter(edu => {
    const matchNiveau = !niveau || edu.niveau.toLowerCase().includes(niveau) || edu.niveau.toLowerCase() === 'tous cycles';
    const matchSearch = !search || edu.titre.toLowerCase().includes(search) || edu.desc.toLowerCase().includes(search) || (edu.tags || []).join(' ').toLowerCase().includes(search);
    return matchNiveau && matchSearch;
  });

  // Find cat info for display
  let catInfo = null;
  for (const section of TAXONOMY) {
    for (const cat of section.categories) {
      if (cat.key === catKey) { catInfo = cat; break; }
    }
    if (catInfo) break;
  }

  const diffLabel = { debutant: 'Débutant', intermediaire: 'Intermédiaire', avance: 'Avancé' };
  const diffEmoji = { debutant: '🟢', intermediaire: '🟠', avance: '🔴' };

  container.innerHTML = '';

  // Count display
  const countDiv = document.createElement('div');
  countDiv.className = 'cours-browser-count';
  countDiv.innerHTML = `<strong>${results.length}</strong> éducatif${results.length > 1 ? 's' : ''} disponible${results.length > 1 ? 's' : ''}${niveau ? ' pour ce niveau' : ''}`;
  container.appendChild(countDiv);

  if (results.length === 0) {
    const hint = document.createElement('p');
    hint.className = 'cours-browser-hint';
    hint.textContent = 'Aucun éducatif trouvé avec ces critères.';
    container.appendChild(hint);
    return;
  }

  results.forEach(edu => {
    const inCours = isInCours(edu);
    const item = document.createElement('div');
    item.className = 'cours-browse-item';
    item.innerHTML = `
      <div class="cours-browse-item-info">
        <div class="cours-browse-item-title">${escapeHtml(edu.titre)}</div>
        <div class="cours-browse-item-meta">
          <span>${diffEmoji[edu.difficulte] || ''} ${diffLabel[edu.difficulte] || ''}</span>
          <span>${escapeHtml(edu.niveau)}</span>
          <span>⏱ ${edu.duree} min</span>
        </div>
      </div>
      <button class="cours-browse-add-btn ${inCours ? 'already-added' : ''}">${inCours ? '✓ Ajouté' : '+ Ajouter'}</button>
    `;

    // Click on info to open modal
    const info = item.querySelector('.cours-browse-item-info');
    info.style.cursor = 'pointer';
    info.addEventListener('click', () => {
      openModal(edu);
    });

    const btn = item.querySelector('.cours-browse-add-btn');
    btn.addEventListener('click', () => {
      if (isInCours(edu)) return;
      // Enrich with cat info
      edu._catEmoji = catInfo ? catInfo.emoji : '';
      edu._catName = catInfo ? catInfo.name : '';
      addToCours(edu);
      btn.textContent = '✓ Ajouté';
      btn.classList.add('already-added');
      renderCoursList();
      showToast('Ajouté au cours !');
    });

    container.appendChild(item);
  });
}

// ─────────────────────────────────────────────────────
// CANVAS — PARTICULES DE FEU
// ─────────────────────────────────────────────────────
function initCanvas() {
  const canvas = document.getElementById('fire-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * canvas.width;
      this.y = canvas.height + Math.random() * 40;
      this.size = Math.random() * 2.5 + 0.5;
      this.speedY = -(Math.random() * 0.6 + 0.2);
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.life = 0;
      this.maxLife = Math.random() * 200 + 100;
      this.hue = Math.random() * 30 + 10;
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.life++;
      if (this.life >= this.maxLife) this.reset();
    }

    draw() {
      const alpha = Math.sin((this.life / this.maxLife) * Math.PI) * 0.4;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${this.hue}, 100%, 65%, ${alpha})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 60; i++) {
    const p = new Particle();
    p.life = Math.random() * p.maxLife;
    particles.push(p);
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.update();
      p.draw();
    });
    requestAnimationFrame(animate);
  }

  animate();
}
