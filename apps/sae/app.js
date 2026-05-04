// ============================================
// APP SAE PFEQ — Zone Total Sport
// ============================================

'use strict';

const SAE_SOURCES = [
  { key: 'prescolaire', file: 'prescolaire.json', label: 'Prescolaire', cycle: 'Prescolaire' },
  { key: 'primaire', file: 'primaire.json', label: 'Primaire', cycle: 'Primaire' },
  { key: 'secondaire', file: 'secondaire.json', label: 'Secondaire', cycle: 'Secondaire' },
  { key: 'cooperation', file: 'cooperation.json', label: 'Cooperation', cycle: 'Primaire', arrayKey: 'saes' },
  { key: 'collectifs', file: 'collectifs.json', label: 'Sports Collectifs', cycle: 'Secondaire', arrayKey: 'saes' },
  { key: 'opposition', file: 'opposition.json', label: 'Opposition', cycle: 'Secondaire' },
  { key: 'dodgeball', file: 'dodgeball.json', label: 'Ballon Chasseur', cycle: 'Primaire/Secondaire' },
  { key: 'locomotion', file: 'locomotion.json', label: 'Locomotion', cycle: 'Primaire' },
  { key: 'mobilite', file: 'mobilite.json', label: 'Mobilite', cycle: 'Primaire/Secondaire' },
  { key: 'poursuite', file: 'poursuite.json', label: 'Jeux de poursuite', cycle: 'Maternelle → Sec 5' },
  { key: 'duel', file: 'duel.json', label: 'Duel / Opposition', cycle: 'Primaire/Secondaire' },
  { key: 'conditionnement', file: 'conditionnement.json', label: 'Conditionnement', cycle: 'Primaire/Secondaire' },
  { key: 'expression_corporelle', file: 'expression_corporelle.json', label: 'Expression corporelle', cycle: 'Mat → Sec 5' },
  { key: 'sports_collectifs_sae', file: 'sports_collectifs_sae.json', label: 'Sports collectifs', cycle: 'Primaire → Sec 5' },
  { key: 'manipulation_new', file: 'manipulation_new.json', label: "Manipulation d'objets", cycle: 'Mat → Sec 5' },
  { key: 'locomotion_new', file: 'locomotion_new.json', label: 'Locomotion', cycle: 'Mat → Sec 5' },
  { key: 'expression_artistique', file: 'expression_artistique.json', label: 'Expression artistique', cycle: 'Mat → Sec 5' },
  { key: 'adresse_individuel', file: 'adresse_individuel.json', label: 'Adresse et sports individuels', cycle: 'Mat → Sec 5' },
  { key: 'cooperation_new', file: 'cooperation_new.json', label: 'Cooperation (nouveaux)', cycle: 'Mat → Sec 5' },
  { key: 'cooperation_extra', file: 'cooperation_extra.json', label: 'Cooperation (extra)', cycle: 'Mat → Sec 5' },
  { key: 'individuelles_part8', file: 'individuelles_part8.json', label: 'Individuelles', cycle: 'Mat → Sec 5' },
  { key: 'nonloc_gainage', file: 'nonloc_gainage.json', label: 'Gainage et non-locomoteur', cycle: 'Mat → Sec 5' },
  { key: 'variees_extra', file: 'variees_extra.json', label: 'Variees (extra)', cycle: 'Mat → Sec 5' },
  { key: 'cooperation_gen', file: 'cooperation_gen.json', label: 'Cooperation (generation)', cycle: 'Mat → Sec 5' },
  { key: 'poursuite_gen', file: 'poursuite_gen.json', label: 'Poursuite (generation)', cycle: 'Mat → Sec 5' },
  { key: 'prescolaire_primaire_gen', file: 'prescolaire_primaire_gen.json', label: 'Prescolaire-Primaire (generation)', cycle: 'Mat → Sec 5' },
  { key: 'manipulation_bonus', file: 'manipulation_bonus.json', label: 'Manipulation (bonus)', cycle: 'Mat → Sec 5' },
  { key: 'locomotion_bonus', file: 'locomotion_bonus.json', label: 'Locomotion (bonus)', cycle: 'Mat → Sec 5' },
  { key: 'stabilisation_bonus', file: 'stabilisation_bonus.json', label: 'Stabilisation (bonus)', cycle: 'Mat → Sec 5' },
  { key: 'opposition_bonus', file: 'opposition_bonus.json', label: 'Opposition (bonus)', cycle: 'Mat → Sec 5' },
  { key: 'cooperation_bonus', file: 'cooperation_bonus.json', label: 'Coopération (bonus)', cycle: 'Mat → Sec 5' },
  { key: 'expression_bonus', file: 'expression_bonus.json', label: 'Expression (bonus)', cycle: 'Mat → Sec 5' },
];

// Detail cache: loaded on-demand when user opens a modal
const _detailCache = {};

const MOYENS_ACTION = [
  { key: 'manipulation', label: '🎯 Manipulation', emoji: '🎯', keywords: ['balle', 'ballon', 'raquette', 'baton', 'corde', 'cerceau', 'frisbee', 'cirque', 'foulard', 'manipulation', 'objet', 'jonglerie'] },
  { key: 'locomotion', label: '🏃 Locomotion', emoji: '🏃', keywords: ['courir', 'sauter', 'ramper', 'grimper', 'esquiver', 'locomotion', 'poursuite', 'courir', 'vitesse'] },
  { key: 'stabilisation', label: '⚖️ Stabilisation', emoji: '⚖️', keywords: ['equilibre', 'souplesse', 'gainage', 'coordination', 'mobilite', 'conditionnement', 'yoga', 'stretching', 'force', 'flexibilite'] },
  { key: 'opposition', label: '⚔️ Opposition', emoji: '⚔️', keywords: ['lutte', 'duel', 'territoire', 'opposition', 'dodgeball', 'chasseur', 'combat', 'confrontation'] },
  { key: 'cooperation', label: '🤝 Cooperation', emoji: '🤝', keywords: ['communication', 'strategie', 'construction', 'cooperation', 'collectif', 'equipe', 'entraide', 'basket', 'volleyball', 'handball'] },
  { key: 'expression', label: '💃 Expression', emoji: '💃', keywords: ['danse', 'mime', 'acrosport', 'expression', 'artistique', 'cirque', 'gymnaste', 'gymnastique', 'creation', 'rythme'] },
];

let allSAE = [];
let filtered = [];
let activeMoyen = null;
let favorisFilterActive = false;
let currentPage = 0;
const ITEMS_PER_PAGE = 30;

// Safety timer to hide loading if fetch hangs
const safetyTimer = setTimeout(hideLoading, 8000);

document.addEventListener('DOMContentLoaded', async () => {
  initCanvas();
  renderMoyensAction();
  await loadAllSAELight();
  setupFilters();
  renderSAE();
  hideLoading();
  animateCounters();
  updateCoursFab();
  checkDeepLink();
  checkCoursDeepLink();
});

// ===== CHARGEMENT DES DONNEES =====

async function loadAllSAELight() {
  try {
    const r = await fetch('data/sae-all-light.json');
    if (!r.ok) throw new Error('Failed to load light data');
    const allData = await r.json();

    SAE_SOURCES.forEach(source => {
      const key = source.file.replace('.json', '');
      const data = allData[key];
      if (!data) return;
      let saes = extractSAEs(data, source);
      saes = saes.filter(s => s && (s.titre || s.nom));
      saes = saes.map(s => ({ ...s, _source: source.key, _file: source.file, _cycle: source.cycle }));
      allSAE.push(...saes);
    });
  } catch (e) {
    console.error('Erreur chargement:', e);
  }

  console.log('✅ ' + allSAE.length + ' SAE chargees');
  filtered = [...allSAE];
  clearTimeout(safetyTimer);
}

// Load full detail for a SAÉ on-demand (when modal opens)
async function loadDetail(sae) {
  const file = sae._file;
  const idx = sae._idx;
  if (file == null || idx == null) return sae;

  if (!_detailCache[file]) {
    try {
      const r = await fetch('data/sae-detail/' + file);
      if (!r.ok) return sae;
      _detailCache[file] = await r.json();
    } catch (e) {
      console.warn('Detail load failed:', file, e);
      return sae;
    }
  }

  const detail = _detailCache[file][idx];
  if (detail) {
    Object.assign(sae, detail);
  }
  return sae;
}

function extractSAEs(data, source) {
  if (Array.isArray(data)) return data;
  if (source.arrayKey && data[source.arrayKey] && Array.isArray(data[source.arrayKey])) return data[source.arrayKey];
  if (data.saes && Array.isArray(data.saes)) return data.saes;
  if (data.items && Array.isArray(data.items)) return data.items;
  if (data.situations && Array.isArray(data.situations)) return data.situations;
  for (const key of Object.keys(data)) {
    if (Array.isArray(data[key]) && data[key].length > 0 && (data[key][0].titre || data[key][0].nom)) {
      return data[key];
    }
  }
  if (data.titre || data.nom) return [data];
  return [];
}

// ===== MOYENS D'ACTION BROWSER =====

function renderMoyensAction() {
  const grid = document.getElementById('moyens-grid');
  if (!grid) return;
  grid.innerHTML = MOYENS_ACTION.map(m => `
    <button class="moyen-btn" data-key="${m.key}" onclick="filterByMoyen('${m.key}')">
      <span class="moyen-emoji">${m.emoji}</span>
      <span class="moyen-label">${m.label.replace(m.emoji + ' ', '')}</span>
    </button>
  `).join('');
}

function filterByMoyen(key) {
  if (activeMoyen === key) {
    activeMoyen = null;
  } else {
    activeMoyen = key;
  }
  document.querySelectorAll('.moyen-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.key === activeMoyen);
  });
  // Reset composante and repopulate when moyen category changes
  const compSel = document.getElementById('sae-composante');
  if (compSel) compSel.value = '';
  populateComposantes();
  applyFilters();

  if (activeMoyen) {
    setTimeout(() => {
      document.getElementById('filtres')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}

// ===== FILTRES =====

function setupFilters() {
  ['sae-cycle', 'sae-competence', 'sae-clientele', 'sae-composante'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', applyFilters);
  });
  // Moyen d'action: also populate composante dropdown when changed
  const moyenEl = document.getElementById('sae-moyen');
  if (moyenEl) moyenEl.addEventListener('change', () => { populateComposantes(); applyFilters(); });
  const searchEl = document.getElementById('sae-search');
  if (searchEl) {
    searchEl.addEventListener('input', debounce(applyFilters, 250));
  }
  // Initial populate
  populateComposantes();
}

// Build composante dropdown from actual moyen_action values in data
function populateComposantes() {
  const sel = document.getElementById('sae-composante');
  if (!sel) return;
  const moyen = document.getElementById('sae-moyen')?.value || '';
  const moyenCat = activeMoyen || '';

  // Collect unique moyen_action values that match current moyen filter
  const vals = new Set();
  allSAE.forEach(s => {
    const ma = s.moyen_action || '';
    if (!ma) return;
    // If a moyen category filter is active, only include matching
    if (moyen || moyenCat) {
      const text = [ma, s.moyens_action, s._source, ...(s.tags || []), s.titre, s.nom].filter(Boolean).join(' ').toLowerCase();
      if (moyen && !text.includes(moyen.toLowerCase())) return;
      if (moyenCat) {
        const m = MOYENS_ACTION.find(x => x.key === moyenCat);
        if (m && !m.keywords.some(kw => text.includes(kw))) return;
      }
    }
    vals.add(ma);
  });

  // Sort and populate
  const sorted = [...vals].sort((a, b) => a.localeCompare(b, 'fr'));
  sel.innerHTML = '<option value="">Toutes les composantes</option>';
  sorted.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    // Shorten display if too long
    opt.textContent = v.length > 55 ? v.substring(0, 52) + '…' : v;
    sel.appendChild(opt);
  });
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function matchCycle(sae, cycleFilter) {
  const c = [sae.cycle, sae.niveau, sae._cycle].filter(Boolean).join(' ').toLowerCase();
  const cf = cycleFilter.toLowerCase();

  // Exact or substring match
  if (c.includes(cf)) return true;

  // Normalize common patterns
  if (cf === 'prescolaire' || cf === 'préscolaire') {
    return c.includes('presco') || c.includes('maternelle');
  }
  if (cf === 'cycle 1') {
    return c.includes('1er cycle') || c.includes('cycle 1');
  }
  if (cf === 'cycle 2') {
    return c.includes('2e cycle') || c.includes('cycle 2');
  }
  if (cf === 'cycle 3') {
    return c.includes('3e cycle') || c.includes('cycle 3');
  }
  // "Secondaire 1" should match "Secondaire 1", "Secondaire 1-2", "Secondaire 1-3", "1er cycle secondaire"
  const secMatch = cf.match(/secondaire (\d)/);
  if (secMatch) {
    const n = secMatch[1];
    // Match exact "secondaire N" or ranges like "secondaire 1-3" containing N
    if (c.includes('secondaire ' + n)) return true;
    if (c.includes('secondaire') || c.includes('sec')) {
      // Check ranges like "1-3", "2-4"
      const rangeMatch = c.match(/(\d)-(\d)/);
      if (rangeMatch) {
        const lo = parseInt(rangeMatch[1]), hi = parseInt(rangeMatch[2]);
        if (parseInt(n) >= lo && parseInt(n) <= hi) return true;
      }
    }
    // "1er cycle secondaire" = sec 1-2
    if (n <= 2 && c.includes('1er cycle sec')) return true;
    // "2e cycle secondaire" = sec 3-5
    if (n >= 3 && c.includes('2e cycle sec')) return true;
    return false;
  }
  if (cf === '1er cycle secondaire') {
    return c.includes('1er cycle sec') || c.includes('secondaire 1') || c.includes('secondaire 2') || c.includes('secondaire 1-2');
  }
  if (cf === '2e cycle secondaire') {
    return c.includes('2e cycle sec') || c.includes('secondaire 3') || c.includes('secondaire 4') || c.includes('secondaire 5') || /secondaire [3-5]/.test(c);
  }

  return false;
}

function applyFilters() {
  const search = (document.getElementById('sae-search')?.value || '').toLowerCase().trim();
  const cycle = document.getElementById('sae-cycle')?.value || '';
  const moyen = document.getElementById('sae-moyen')?.value || '';
  const composante = document.getElementById('sae-composante')?.value || '';
  const competence = document.getElementById('sae-competence')?.value || '';
  const clientele = document.getElementById('sae-clientele')?.value || '';

  currentPage = 0;
  filtered = allSAE.filter(s => {

    if (favorisFilterActive) {
      if (!isFavori(s)) return false;
    }

    if (search) {
      const text = [
        s.titre, s.nom, s.description, s.contexte_apprentissage,
        s.tache_complexe, s.moyen_action, s._source,
        ...(s.tags || []), ...(s.competences || [])
      ].filter(Boolean).join(' ').toLowerCase();
      if (!text.includes(search)) return false;
    }

    if (cycle) {
      if (!matchCycle(s, cycle)) return false;
    }

    if (moyen) {
      const moyenStr = [
        s.moyen_action, s.moyens_action, s._source,
        ...(s.tags || []), s.titre, s.nom
      ].filter(Boolean).join(' ').toLowerCase();
      if (!moyenStr.includes(moyen.toLowerCase())) return false;
    }

    // Composante: exact match on moyen_action
    if (composante) {
      if ((s.moyen_action || '') !== composante) return false;
    }

    if (competence) {
      const comp = [s.competence_pfeq, ...(s.competences || [])].filter(Boolean).join(' ').toLowerCase();
      if (!comp.includes(competence.toLowerCase())) return false;
    }

    if (clientele) {
      const hdaaKeys = (s._hdaa || []).join(' ').toLowerCase();
      const hdaaFull = s.adaptation_hdaa ? JSON.stringify(s.adaptation_hdaa).toLowerCase() : '';
      const tags = (s.tags || []).join(' ').toLowerCase();
      const desc = (s.description || '').toLowerCase();
      if (!hdaaKeys.includes(clientele) && !hdaaFull.includes(clientele) && !tags.includes(clientele) && !desc.includes(clientele)) return false;
    }

    if (activeMoyen) {
      const m = MOYENS_ACTION.find(x => x.key === activeMoyen);
      if (m) {
        const text = [
          s.titre, s.nom, s.moyen_action, s.moyens_action, s._source,
          ...(s.tags || []), s.description
        ].filter(Boolean).join(' ').toLowerCase();
        if (!m.keywords.some(kw => text.includes(kw))) return false;
      }
    }

    return true;
  });

  renderSAE();
}

// ===== FAVORIS (localStorage) =====

function getSaeId(s) {
  return s.id || s.titre || s.nom || '';
}

function getFavoris() {
  try {
    return JSON.parse(localStorage.getItem('favoris-sae') || '[]');
  } catch { return []; }
}

function setFavoris(arr) {
  localStorage.setItem('favoris-sae', JSON.stringify(arr));
}

function isFavori(s) {
  return getFavoris().includes(getSaeId(s));
}

function toggleFavori(s) {
  const id = getSaeId(s);
  let favs = getFavoris();
  if (favs.includes(id)) {
    favs = favs.filter(f => f !== id);
  } else {
    favs.push(id);
  }
  setFavoris(favs);
  return favs.includes(id);
}

function toggleFavorisFilter() {
  favorisFilterActive = !favorisFilterActive;
  const btn = document.getElementById('favoris-filter');
  if (btn) {
    btn.classList.toggle('active', favorisFilterActive);
    btn.textContent = favorisFilterActive ? '★ Favoris' : '☆ Favoris';
  }
  applyFilters();
}

// ===== RENDU DES CARTES =====

function getCycleClass(s) {
  const c = [s.cycle, s.niveau, s._cycle].filter(Boolean).join(' ').toLowerCase();
  if (c.includes('prescolaire') || c.includes('maternelle') || c.includes('mat')) {
    return 'cycle-prescolaire';
  }
  if (c.includes('secondaire') || c.includes('sec')) {
    return 'cycle-secondaire';
  }
  return 'cycle-primaire';
}

function renderCard(s) {
  const titre = s.titre || s.nom || 'SAE sans titre';
  const cycle = s.cycle || s.niveau || '';
  const desc = s.description || s.contexte_apprentissage || '';
  const competence = s.competence_pfeq || (s.competences || [])[0] || '';
  const moyen = s.moyen_action || s.moyens_action || '';
  const duree = s.duree_periodes || s.duree || '';
  const hasHDAA = s._hdaa || (s.adaptation_hdaa && Object.keys(s.adaptation_hdaa).length > 0);

  const div = document.createElement('div');
  div.className = 'sae-card';
  div.setAttribute('role', 'button');
  div.setAttribute('tabindex', '0');
  div.setAttribute('aria-label', `Ouvrir la SAE: ${titre}`);

  const fav = isFavori(s);
  const inCours = isInCours(s);
  div.innerHTML = `
    <button class="fav-star ${fav ? 'active' : ''}" aria-label="Ajouter aux favoris" title="Favori">${fav ? '★' : '☆'}</button>
    <span class="pfeq-badge">PFEQ</span>
    ${cycle ? `<span class="cycle-badge ${getCycleClass(s)}">${escapeHtml(cycle)}</span>` : ''}
    <div class="card-title">${escapeHtml(titre)}</div>
    ${desc ? `<p class="card-desc">${escapeHtml(desc)}</p>` : ''}
    <div class="card-tags">
      ${competence ? `<span class="tag tag-competence">${escapeHtml(competence)}</span>` : ''}
      ${moyen ? `<span class="tag tag-moyen">${escapeHtml(moyen)}</span>` : ''}
      ${hasHDAA ? `<span class="tag tag-hdaa">♿ Adapte HDAA</span>` : ''}
    </div>
    ${duree ? `<div class="duree-badge">⏱ ${escapeHtml(String(duree))} periode${parseInt(duree) > 1 ? 's' : ''}</div>` : ''}
    <button class="sae-card-add-btn ${inCours ? 'added' : ''}" title="${inCours ? 'Retirer de ma SAE' : 'Ajouter a ma SAE'}">${inCours ? '✓' : '+'}</button>
  `;

  // Star click handler
  const starBtn = div.querySelector('.fav-star');
  starBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const nowFav = toggleFavori(s);
    starBtn.textContent = nowFav ? '★' : '☆';
    starBtn.classList.toggle('active', nowFav);
    if (favorisFilterActive) applyFilters();
  });

  // Add to cours button
  const addBtn = div.querySelector('.sae-card-add-btn');
  addBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleCoursItem(s, addBtn);
  });

  div.addEventListener('click', () => openModal(s));
  div.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(s); }
  });

  return div;
}

function renderSAE() {
  const grid = document.getElementById('sae-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div style="font-size:3rem;margin-bottom:16px">🔍</div>
        <p style="font-size:1.1rem;color:var(--text-muted)">Aucune SAE trouvee</p>
        <p style="font-size:0.85rem;color:var(--text-faint);margin-top:8px">Essayez de modifier les filtres ou la recherche</p>
      </div>`;
    renderPagination();
    updateStats();
    return;
  }

  const start = currentPage * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, end);

  const fragment = document.createDocumentFragment();
  pageItems.forEach(s => fragment.appendChild(renderCard(s)));
  grid.appendChild(fragment);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('animate-in');
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

  grid.querySelectorAll('.sae-card').forEach(c => observer.observe(c));
  renderPagination();
  updateStats();
}

function renderPagination() {
  const container = document.getElementById('pagination');
  if (!container) return;
  container.innerHTML = '';

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  if (totalPages <= 1) return;

  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn page-prev' + (currentPage === 0 ? ' disabled' : '');
  prevBtn.textContent = '\u2190 Precedent';
  prevBtn.disabled = currentPage === 0;
  prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
  container.appendChild(prevBtn);

  const pagesDiv = document.createElement('div');
  pagesDiv.className = 'page-numbers';

  const maxVisible = 7;
  let pages = [];

  if (totalPages <= maxVisible) {
    for (let i = 0; i < totalPages; i++) pages.push(i);
  } else {
    pages.push(0);
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages - 2, currentPage + 2);
    if (currentPage <= 3) { start = 1; end = 4; }
    if (currentPage >= totalPages - 4) { start = totalPages - 5; end = totalPages - 2; }
    if (start > 1) pages.push(-1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 2) pages.push(-1);
    pages.push(totalPages - 1);
  }

  pages.forEach(p => {
    if (p === -1) {
      const dots = document.createElement('span');
      dots.className = 'page-dots';
      dots.textContent = '\u2026';
      pagesDiv.appendChild(dots);
    } else {
      const btn = document.createElement('button');
      btn.className = 'page-btn page-num' + (p === currentPage ? ' active' : '');
      btn.textContent = p + 1;
      btn.addEventListener('click', () => goToPage(p));
      pagesDiv.appendChild(btn);
    }
  });

  container.appendChild(pagesDiv);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn page-next' + (currentPage >= totalPages - 1 ? ' disabled' : '');
  nextBtn.textContent = 'Suivant \u2192';
  nextBtn.disabled = currentPage >= totalPages - 1;
  nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
  container.appendChild(nextBtn);

  const info = document.createElement('div');
  info.className = 'page-info';
  const s = currentPage * ITEMS_PER_PAGE + 1;
  const e = Math.min((currentPage + 1) * ITEMS_PER_PAGE, filtered.length);
  info.textContent = `${s}\u2013${e} sur ${filtered.length} SAE`;
  container.appendChild(info);
}

function goToPage(page) {
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  if (page < 0 || page >= totalPages) return;
  currentPage = page;
  renderSAE();
  const grid = document.getElementById('sae-grid');
  if (grid) {
    grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function updateStats() {
  const countEl = document.getElementById('sae-count');
  if (countEl) countEl.textContent = `${filtered.length} SAE`;

  const totalEl = document.getElementById('hstat-sae');
  if (totalEl) totalEl.innerHTML = `${allSAE.length}<span>SAE</span>`;

  const counterEl = document.getElementById('counter-sae');
  if (counterEl) counterEl.textContent = allSAE.length;
}

// ===== MODAL =====

async function openModal(s) {
  const modal = document.getElementById('modal');
  const body = document.getElementById('modal-body');
  if (!modal || !body) return;

  // Show modal immediately with loading state
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  body.innerHTML = '<div style="text-align:center;padding:40px;color:#999"><div style="font-size:2rem;margin-bottom:12px">⏳</div>Chargement...</div>';

  // Load full detail data on-demand
  await loadDetail(s);

  const titre = s.titre || s.nom || 'SAE';

  function renderPhase(phase, label, cssClass) {
    if (!phase) return '';
    if (typeof phase === 'string') {
      return '<div class="modal-cours-phase ' + cssClass + '"><span class="phase-label">' + escapeHtml(label) + '</span><p>' + escapeHtml(phase) + '</p></div>';
    }
    var html = '<div class="modal-cours-phase ' + cssClass + '"><span class="phase-label">' + escapeHtml(label);
    if (phase.duree_min) html += ' <small>(' + phase.duree_min + ' min)</small>';
    html += '</span>';
    if (phase.description) html += '<p>' + escapeHtml(phase.description) + '</p>';
    if (phase.organisation) html += '<p style="font-style:italic;color:#b0b0b0;margin-top:4px"><strong>Organisation :</strong> ' + escapeHtml(phase.organisation) + '</p>';
    if (phase.consignes_cles) html += '<p style="color:#FFD700;margin-top:4px"><strong>Consignes :</strong> ' + escapeHtml(phase.consignes_cles) + '</p>';
    if (phase.exercices && Array.isArray(phase.exercices)) {
      html += '<ul style="margin:6px 0 0 16px;padding:0">';
      phase.exercices.forEach(function(ex) { html += '<li style="margin:2px 0">' + escapeHtml(ex) + '</li>'; });
      html += '</ul>';
    }
    html += '</div>';
    return html;
  }

  function renderEducatifs(educatifs) {
    if (!educatifs || !Array.isArray(educatifs) || educatifs.length === 0) return '';
    var html = '<div class="modal-cours-phase phase-educatifs"><span class="phase-label">Éducatifs (' + educatifs.length + ')</span>';
    html += '<div style="display:flex;flex-direction:column;gap:8px;margin-top:6px">';
    educatifs.forEach(function(ed, i) {
      if (typeof ed === 'string') { html += '<p>' + escapeHtml(ed) + '</p>'; return; }
      html += '<div style="background:rgba(255,255,255,0.05);border-radius:8px;padding:8px 10px;border-left:3px solid #4FC3F7">';
      html += '<strong style="color:#4FC3F7">' + escapeHtml(ed.nom || ('Éducatif ' + (i+1))) + '</strong>';
      if (ed.duree_min) html += ' <small style="color:#999">(' + ed.duree_min + ' min)</small>';
      if (ed.description) html += '<p style="margin:4px 0">' + escapeHtml(ed.description) + '</p>';
      if (ed.consignes) html += '<p style="margin:2px 0;color:#81C784"><strong>Consignes :</strong> ' + escapeHtml(ed.consignes) + '</p>';
      if (ed.variante) html += '<p style="margin:2px 0;color:#FFB74D"><strong>Variante :</strong> ' + escapeHtml(ed.variante) + '</p>';
      html += '</div>';
    });
    html += '</div></div>';
    return html;
  }

  function renderProgressions(progressions) {
    if (!progressions || !Array.isArray(progressions) || progressions.length === 0) return '';
    var html = '<div class="modal-cours-phase" style="border-left-color:#AB47BC"><span class="phase-label" style="background:#AB47BC">Progressions</span>';
    html += '<ol style="margin:6px 0 0 20px;padding:0">';
    progressions.forEach(function(p) { html += '<li style="margin:3px 0">' + escapeHtml(typeof p === 'string' ? p : JSON.stringify(p)) + '</li>'; });
    html += '</ol></div>';
    return html;
  }

  function renderGrille(grille) {
    if (!grille || !grille.criteres) return '';
    var html = '<div class="modal-cours-phase" style="border-left-color:#FF7043"><span class="phase-label" style="background:#FF7043">Grille d\'observation</span>';
    html += '<table style="width:100%;border-collapse:collapse;margin-top:6px;font-size:0.85em">';
    html += '<thead><tr><th style="text-align:left;padding:4px;border-bottom:1px solid #555;color:#FF7043">Critère</th></tr></thead><tbody>';
    grille.criteres.forEach(function(cr) { html += '<tr><td style="padding:3px 4px;border-bottom:1px solid #333">' + escapeHtml(cr) + '</td></tr>'; });
    html += '</tbody></table>';
    if (grille.echelle) {
      html += '<div style="margin-top:6px;display:flex;gap:8px;flex-wrap:wrap">';
      Object.entries(grille.echelle).forEach(function(e) {
        var colors = {A:'#4CAF50',B:'#8BC34A',C:'#FFC107',D:'#F44336'};
        html += '<span style="background:' + (colors[e[0]] || '#666') + ';color:#fff;padding:2px 8px;border-radius:10px;font-size:0.8em"><strong>' + e[0] + '</strong> ' + escapeHtml(e[1]) + '</span>';
      });
      html += '</div>';
    }
    html += '</div>';
    return html;
  }

  const sections = [
    s.description && `
      <div class="modal-section">
        <h3>📋 Description</h3>
        <p>${escapeHtml(s.description)}</p>
      </div>`,
    s.contexte_apprentissage && `
      <div class="modal-section">
        <h3>🏫 Contexte d'apprentissage</h3>
        <p>${escapeHtml(s.contexte_apprentissage)}</p>
      </div>`,
    s.tache_complexe && `
      <div class="modal-section">
        <h3>🎯 Tache complexe</h3>
        <div>${smartRender(s.tache_complexe)}</div>
      </div>`,
    s.objectifs && `
      <div class="modal-section">
        <h3>🎓 Objectifs</h3>
        ${smartRender(Array.isArray(s.objectifs) ? s.objectifs : [s.objectifs])}
      </div>`,
    s.materiel && `
      <div class="modal-section">
        <h3>🎒 Materiel requis</h3>
        ${smartRender(Array.isArray(s.materiel) ? s.materiel : [s.materiel])}
      </div>`,
    s.deroulement && `
      <div class="modal-section">
        <h3>📝 Deroulement</h3>
        ${typeof s.deroulement === 'string'
          ? `<p>${escapeHtml(s.deroulement)}</p>`
          : (function() {
              if (Array.isArray(s.deroulement)) return smartRender(s.deroulement);
              return Object.entries(s.deroulement).map(function([k, v]) {
                var label = k.replace(/_/g, ' ').replace(/\b\w/g, function(c) { return c.toUpperCase(); });
                return '<div style="margin:8px 0;padding:8px 12px;background:rgba(255,255,255,0.05);border-radius:8px;border-left:3px solid #4FC3F7">' +
                  '<strong style="color:#4FC3F7">' + escapeHtml(label) + '</strong>' +
                  (typeof v === 'string' ? '<p style="margin:4px 0">' + escapeHtml(v) + '</p>'
                    : (v && v.duree ? '<small style="color:#999"> (' + escapeHtml(v.duree || v.duree_min + ' min') + ')</small>' : '') +
                      (v && v.description ? '<p style="margin:4px 0">' + escapeHtml(v.description) + '</p>' : '') +
                      (v && !v.description && typeof v === 'object' ? smartRender(v) : '')) +
                  '</div>';
              }).join('');
            })()
        }
      </div>`,
    s.cours && Array.isArray(s.cours) && s.cours.length > 0 && `
      <div class="modal-section modal-cours-section">
        <h3>📅 Planification cours par cours (${s.cours.length} cours${s.duree_par_cours ? ' — ' + escapeHtml(s.duree_par_cours) + ' chacun' : ''})</h3>
        <div class="modal-cours-timeline">
          ${s.cours.map(function(c) {
            return '<div class="modal-cours-item">' +
              '<div class="modal-cours-num">' + c.numero + '</div>' +
              '<div class="modal-cours-body">' +
                '<h4 class="modal-cours-titre">' + escapeHtml(c.titre) + '</h4>' +
                '<p class="modal-cours-objectif"><strong>Objectif :</strong> ' + escapeHtml(c.objectif) + '</p>' +
                '<div class="modal-cours-phases">' +
                  renderPhase(c.echauffement, 'Échauffement', 'phase-echauf') +
                  renderEducatifs(c.educatifs) +
                  renderPhase(c.activite_principale, 'Activité principale', 'phase-principal') +
                  renderProgressions(c.progressions) +
                  renderPhase(c.retour_au_calme, 'Retour au calme', 'phase-retour') +
                  renderGrille(c.grille_observation) +
                '</div>' +
              '</div>' +
            '</div>';
          }).join('')}
        </div>
      </div>`,
    s.criteres_evaluation && `
      <div class="modal-section">
        <h3>📊 Criteres d'evaluation</h3>
        ${smartRender(Array.isArray(s.criteres_evaluation) ? s.criteres_evaluation : [s.criteres_evaluation])}
      </div>`,
    s.grille_evaluation && `
      <div class="modal-section">
        <h3>📋 Grille d'evaluation</h3>
        ${smartRender(s.grille_evaluation)}
      </div>`,
    s.progression && `
      <div class="modal-section">
        <h3>📈 Progression</h3>
        <div>${smartRender(s.progression)}</div>
      </div>`,
    s.variantes && `
      <div class="modal-section">
        <h3>🔄 Variantes et differenciation</h3>
        <div>${smartRender(s.variantes)}</div>
      </div>`,
    s.adaptations && `
      <div class="modal-section">
        <h3>🔧 Adaptations</h3>
        ${smartRender(s.adaptations)}
      </div>`,
    s.adaptation_hdaa && Object.keys(s.adaptation_hdaa).length > 0 && `
      <div class="modal-section">
        <h3>♿ Adaptations HDAA</h3>
        ${Object.entries(s.adaptation_hdaa)
          .map(([k, v]) => `<p><strong style="color:#FFD700">${escapeHtml(k)} :</strong> ${typeof v === 'string' ? escapeHtml(v) : smartRender(v)}</p>`)
          .join('')}
      </div>`,
    s.origine_mondiale && `
      <div class="modal-section">
        <h3>🌍 Origine mondiale</h3>
        ${smartRender(s.origine_mondiale)}
      </div>`,
    (s.notes || s.remarques || s.notes_enseignant) && `
      <div class="modal-section">
        <h3>💡 Notes pedagogiques</h3>
        <p>${escapeHtml(s.notes || s.remarques || s.notes_enseignant)}</p>
      </div>`,
  ].filter(Boolean).join('');

  const modalFav = isFavori(s);
  const saeId = getSaeId(s);
  const inCours = isInCours(s);

  body.innerHTML = `
    <div class="modal-header">
      <h2 class="modal-title" id="modal-title">📚 ${escapeHtml(titre)}</h2>
      <button class="modal-close" onclick="closeModal()" aria-label="Fermer">✕</button>
    </div>
    <div class="modal-meta">
      ${s.cycle || s.niveau ? `<span class="modal-badge cycle-badge ${getCycleClass(s)}">${escapeHtml(s.cycle || s.niveau)}</span>` : ''}
      ${s.competence_pfeq ? `<span class="modal-badge">${escapeHtml(s.competence_pfeq)}</span>` : ''}
      ${s.moyen_action ? `<span class="modal-badge">${escapeHtml(s.moyen_action)}</span>` : ''}
      ${s.duree_periodes ? `<span class="modal-badge">⏱ ${escapeHtml(String(s.duree_periodes))} periode${parseInt(s.duree_periodes) > 1 ? 's' : ''}</span>` : ''}
      ${s.espace ? `<span class="modal-badge">📍 ${escapeHtml(s.espace)}</span>` : ''}
      ${s.nb_eleves ? `<span class="modal-badge">👥 ${escapeHtml(String(s.nb_eleves))}</span>` : ''}
    </div>
    <div class="modal-actions">
      <button class="modal-action-btn ${modalFav ? 'fav-active' : ''}" id="modal-fav-btn" onclick="handleModalFavori()">
        ${modalFav ? '★' : '☆'} Favori
      </button>
      <button class="modal-action-btn ${inCours ? 'fav-active' : ''}" id="modal-cours-btn" onclick="handleModalCours()">
        ${inCours ? '✓ Dans ma SAE' : '📋 Ajouter a ma SAE'}
      </button>
      <button class="modal-action-btn" onclick="handlePrint()">🖨️ Imprimer</button>
      <button class="modal-action-btn" onclick="handlePDF()">📄 PDF</button>
      <button class="modal-action-btn" onclick="handleShare('${escapeHtml(saeId).replace(/'/g, "\\'")}')">🔗 Partager</button>
    </div>
    ${sections || '<p style="color:rgba(255,255,255,0.6);text-align:center;padding:24px">Aucun detail supplementaire disponible.</p>'}
    <div class="modal-footer-logo">
      <a href="https://zonetotalsport.ca" target="_blank">
        <img src="img/logo-zonetotalsport.png" alt="ZoneTotalSport.ca" />
      </a>
    </div>
  `;

  window._currentModalSAE = s;

  setTimeout(() => {
    body.querySelector('.modal-close')?.focus();
  }, 50);
}

function closeModal() {
  const modal = document.getElementById('modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
}

// ===== LOADING =====

function hideLoading() {
  clearTimeout(safetyTimer);
  const loading = document.getElementById('loading');
  const app = document.getElementById('app');
  if (loading) {
    loading.style.opacity = '0';
    setTimeout(() => { loading.style.display = 'none'; }, 400);
  }
  if (app) app.classList.remove('hidden');
}

// ===== COUNTERS ANIMES =====

function animateCounters() {
  const counterEl = document.getElementById('counter-sae');
  if (counterEl) {
    const target = allSAE.length;
    let count = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const interval = setInterval(() => {
      count = Math.min(count + step, target);
      counterEl.textContent = count;
      if (count >= target) clearInterval(interval);
    }, 16);
  }

  document.querySelectorAll('[data-count]').forEach(el => {
    const target = parseInt(el.dataset.count);
    if (isNaN(target)) return;
    let count = 0;
    const step = Math.max(1, Math.ceil(target / 60));
    const interval = setInterval(() => {
      count = Math.min(count + step, target);
      el.textContent = count;
      if (count >= target) clearInterval(interval);
    }, 16);
  });
}

// ===== CANVAS ANIME =====

function initCanvas() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  // Skip canvas animation on mobile for performance
  if (window.innerWidth < 768) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d');
  let particles = [];
  let _canvasRunning = true;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();

  class Particle {
    constructor() { this.reset(); }
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

  for (let i = 0; i < 25; i++) {
    const p = new Particle();
    p.life = Math.random() * p.maxLife;
    particles.push(p);
  }

  let lastFrame = 0;
  function animate(ts) {
    if (!_canvasRunning) return;
    // Throttle to ~20fps instead of 60fps
    if (ts - lastFrame < 50) { requestAnimationFrame(animate); return; }
    lastFrame = ts;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }

  // Pause canvas when tab not visible
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { _canvasRunning = false; }
    else { _canvasRunning = true; requestAnimationFrame(animate); }
  });

  animate(0);
  window.addEventListener('resize', resize);
}

// ===== UTILITAIRES =====

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Convert any value to readable HTML (no more [object Object])
function smartRender(val) {
  if (val == null) return '';
  if (typeof val === 'string') return escapeHtml(val);
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) {
    return '<ul>' + val.map(v => '<li>' + smartRender(v) + '</li>').join('') + '</ul>';
  }
  // Object: render as labeled list
  return Object.entries(val)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => {
      const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if (typeof v === 'string') return '<p><strong>' + escapeHtml(label) + ' :</strong> ' + escapeHtml(v) + '</p>';
      if (typeof v === 'number') return '<p><strong>' + escapeHtml(label) + ' :</strong> ' + v + '</p>';
      return '<div style="margin:4px 0"><strong>' + escapeHtml(label) + ' :</strong> ' + smartRender(v) + '</div>';
    }).join('');
}

// ===== MODAL ACTIONS =====

function handleModalFavori() {
  const s = window._currentModalSAE;
  if (!s) return;
  const nowFav = toggleFavori(s);
  const btn = document.getElementById('modal-fav-btn');
  if (btn) {
    btn.classList.toggle('fav-active', nowFav);
    btn.innerHTML = `${nowFav ? '★' : '☆'} Favori`;
  }
  renderSAE();
}

function handleModalCours() {
  showToast('Ouvre "Planifier ma SAE" pour ajouter des activites aux cours');
}

function handlePrint() {
  window.print();
}

function handlePDF() {
  const s = window._currentModalSAE;
  if (!s) return;
  const titre = s.titre || s.nom || 'SAE';
  const printWin = window.open('', '_blank');
  printWin.document.write(`<!DOCTYPE html>
<html><head><title>${escapeHtml(titre)} — Zone Total Sport</title>
<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Bangers&family=Schoolbell&display=swap" rel="stylesheet">
<style>
  body { font-family: 'Schoolbell', cursive; margin: 40px; color: #222; }
  h1 { font-family: 'Bangers', cursive; font-size: 2rem; color: #0077CC; margin-bottom: 8px; }
  .badges span { display: inline-block; padding: 4px 14px; border-radius: 20px; font-family: 'Bangers', cursive; font-size: 0.9rem; font-weight: 700; margin-right: 8px; }
  .badge-blue { background: #E3F2FD; color: #0D47A1; border: 2px solid #42A5F5; }
  .badge-orange { background: #FFF3E0; color: #E65100; border: 2px solid #FF9800; }
  h2 { font-family: 'Bangers', cursive; font-size: 1.2rem; color: #E91E63; margin-top: 24px; margin-bottom: 8px; border-bottom: 2px solid #E91E63; padding-bottom: 4px; }
  p { font-size: 1rem; line-height: 1.8; }
  ul { padding-left: 20px; }
  li { margin-bottom: 6px; }
  .footer { margin-top: 40px; text-align: center; color: #999; font-size: 0.9rem; font-family: 'Bangers', cursive; }
</style></head><body>
<h1>📚 ${escapeHtml(titre)}</h1>
<div class="badges">
  ${s.cycle || s.niveau ? `<span class="badge-blue">${escapeHtml(s.cycle || s.niveau)}</span>` : ''}
  ${s.competence_pfeq ? `<span class="badge-orange">${escapeHtml(s.competence_pfeq)}</span>` : ''}
  ${s.duree_periodes ? `<span class="badge-blue">⏱ ${s.duree_periodes} periode(s)</span>` : ''}
</div>
${s.description ? '<h2>📋 Description</h2><p>' + escapeHtml(s.description) + '</p>' : ''}
${s.contexte_apprentissage ? '<h2>🏫 Contexte</h2><p>' + escapeHtml(s.contexte_apprentissage) + '</p>' : ''}
${s.objectifs ? '<h2>🎓 Objectifs</h2>' + smartRender(Array.isArray(s.objectifs) ? s.objectifs : [s.objectifs]) : ''}
${s.materiel ? '<h2>🎒 Materiel</h2>' + smartRender(Array.isArray(s.materiel) ? s.materiel : [s.materiel]) : ''}
${s.deroulement ? '<h2>📝 Deroulement</h2>' + smartRender(s.deroulement) : ''}
${s.variantes ? '<h2>🔄 Variantes</h2>' + smartRender(s.variantes) : ''}
${s.adaptations ? '<h2>🔧 Adaptations</h2>' + smartRender(s.adaptations) : ''}
${s.adaptation_hdaa && Object.keys(s.adaptation_hdaa).length > 0 ? '<h2>♿ Adaptations HDAA</h2>' + smartRender(s.adaptation_hdaa) : ''}
<div class="footer"><a href="https://zonetotalsport.ca" target="_blank" style="display:inline-block; background:#fff; border-radius:12px; padding:10px 20px;"><img src="${window.location.origin + '/img/logo-zonetotalsport.png'}" alt="ZoneTotalSport.ca" style="max-width:260px; height:auto; display:block;" /></a><br><a href="https://zonetotalsport.ca" target="_blank">zonetotalsport.ca</a> — SAE PFEQ</div>
</body></html>`);
  printWin.document.close();
  setTimeout(() => { printWin.print(); }, 500);
}

function handleShare(saeId) {
  const url = `https://sae.zonetotalsport.ca/?id=${encodeURIComponent(saeId)}`;
  navigator.clipboard.writeText(url).then(() => {
    showToast('Lien copie !');
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Lien copie !');
  });
}

function showToast(message) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.remove('hidden');
  void toast.offsetWidth;
  toast.classList.add('visible');
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 2000);
}

// ===== DEEP LINK (partage) =====

function checkDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;
  const sae = allSAE.find(s => getSaeId(s) === id);
  if (sae) {
    setTimeout(() => openModal(sae), 300);
  }
}

// ===== EVENEMENTS GLOBAUX =====

document.addEventListener('click', e => {
  if (e.target.id === 'modal-backdrop') closeModal();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

// =============================================
// CONCEPTION DE MA SAE — V2 (cours par slots)
// =============================================

// Intentions pedagogiques PFEQ primaire par cycle
const INTENTIONS_PFEQ = {
  'Prescolaire': [
    'Developper sa motricite globale par des actions locomotrices variees',
    'Explorer differentes facons de manipuler des objets',
    'Prendre conscience de son corps et de ses possibilites motrices',
    'Participer a des jeux cooperatifs simples',
    'Developper son equilibre statique et dynamique',
    'Explorer des actions non locomotrices (pousser, tirer, tourner)',
    'Decouvrir des activites rythmiques et expressives'
  ],
  '1er cycle': [
    'Executer des actions de locomotion variees (courir, sauter, grimper, ramper)',
    'Manipuler differents objets (lancer, attraper, frapper, dribler)',
    'Realiser des enchainements de mouvements simples',
    'Adopter un comportement securitaire lors de la pratique d\'activites',
    'Reconnaitre les effets de l\'activite physique sur son corps',
    'Cooperer avec un partenaire dans une tache motrice',
    'Executer des actions de stabilisation (equilibre, rotations)',
    'S\'orienter dans l\'espace de jeu',
    'Respecter les regles de fonctionnement et de securite',
    'Identifier les principales parties du corps sollicitees'
  ],
  '2e cycle': [
    'Enchainer des actions motrices de locomotion et de manipulation',
    'Adapter ses actions motrices en fonction d\'obstacles ou de contraintes',
    'Appliquer des strategies cooperatives simples',
    'Developper sa coordination et sa dissociation segmentaire',
    'Elaborer et executer un plan d\'action moteur',
    'Evaluer sa demarche et ses resultats',
    'Reconnaitre des principes d\'equilibre et de coordination',
    'Participer a des activites d\'opposition avec respect de l\'adversaire',
    'Identifier les determinants de la condition physique',
    'Appliquer des regles d\'ethique sportive',
    'Utiliser des strategies offensives et defensives de base'
  ],
  '3e cycle': [
    'Planifier et executer des sequences d\'actions motrices complexes',
    'Appliquer des principes tactiques en situation de jeu',
    'Analyser et ajuster ses actions pour ameliorer sa performance',
    'Cooperer a l\'elaboration d\'un plan d\'action collectif',
    'Demontrer des habiletes de manipulation avec precision et controle',
    'Evaluer sa condition physique et etablir des objectifs personnels',
    'Integrer des concepts de biomecanique dans ses mouvements',
    'Respecter et valoriser les differences individuelles dans le groupe',
    'Appliquer des strategies d\'attaque et de defense en sports collectifs',
    'Developper sa perseverance et son engagement dans l\'effort',
    'Pratiquer des activites favorisant un mode de vie sain et actif',
    'Demontrer un esprit sportif et une ethique de jeu exemplaire'
  ],
  'Secondaire 1-2': [
    'Planifier une demarche d\'apprentissage en activite physique',
    'Executer des habiletes motrices complexes dans divers contextes',
    'Adopter des strategies collectives et individuelles en situation de jeu',
    'Evaluer et ajuster sa performance motrice',
    'Appliquer un programme de conditionnement physique personnel',
    'Connaitre les determinants de la condition physique et les principes d\'entrainement',
    'Gerer les risques lies a la pratique d\'activites physiques',
    'Developper sa capacite d\'analyse critique en situation de jeu'
  ],
  'Secondaire 3-5': [
    'Concevoir et mettre en oeuvre un programme d\'activites physiques personnalise',
    'Analyser et reguler sa pratique d\'activites physiques de facon autonome',
    'Integrer des principes tactiques avances en contexte de competition',
    'Developper un mode de vie sain et physiquement actif durable',
    'Evaluer les impacts de ses choix sur sa sante et son bien-etre',
    'Exercer un leadership positif dans les activites physiques de groupe',
    'Appliquer des strategies d\'arbitrage et de gestion de conflits'
  ]
};

// Echelles par defaut
const SCALES = {
  ABCDE: [
    { label: 'A', desc: 'Excellent — Depasse les attentes' },
    { label: 'B', desc: 'Tres bien — Repond pleinement aux attentes' },
    { label: 'C', desc: 'Bien — Repond aux attentes avec quelques lacunes' },
    { label: 'D', desc: 'En developpement — Repond partiellement aux attentes' },
    { label: 'E', desc: 'Debutant — Ne repond pas encore aux attentes' }
  ],
  '12345': [
    { label: '5', desc: 'Excellent — Depasse les attentes' },
    { label: '4', desc: 'Tres bien — Repond pleinement aux attentes' },
    { label: '3', desc: 'Bien — Repond aux attentes avec quelques lacunes' },
    { label: '2', desc: 'En developpement — Repond partiellement aux attentes' },
    { label: '1', desc: 'Debutant — Ne repond pas encore aux attentes' }
  ]
};

let _activeSlotIndex = -1;
let _planMode = 'educatifs'; // 'educatifs' or 'sae'
let _educatifsCache = {}; // key -> array of educatifs

const EDUCATIFS_CATS = [
  { section: 'Manipulation d\'objets', cats: [
    { key: 'balles_ballons', emoji: '🎾', name: 'Balles et ballons' },
    { key: 'batons_raquettes', emoji: '🏒', name: 'Batons et raquettes' },
    { key: 'cordes_cerceaux', emoji: '🪢', name: 'Cordes et cerceaux' },
    { key: 'frisbee_disques', emoji: '🥏', name: 'Frisbee et disques' },
    { key: 'cirque', emoji: '🎪', name: 'Articles de cirque' }
  ]},
  { section: 'Locomotion', cats: [
    { key: 'courir', emoji: '🏃', name: 'Courir' },
    { key: 'sauter', emoji: '🦘', name: 'Sauter' },
    { key: 'ramper_rouler', emoji: '🐍', name: 'Ramper et rouler' },
    { key: 'grimper', emoji: '🧗', name: 'Grimper' },
    { key: 'esquiver', emoji: '💨', name: 'Esquiver' }
  ]},
  { section: 'Stabilisation et mobilite', cats: [
    { key: 'equilibre', emoji: '⚖️', name: 'Equilibre' },
    { key: 'souplesse', emoji: '🤸', name: 'Souplesse' },
    { key: 'gainage', emoji: '💪', name: 'Gainage et force' },
    { key: 'coordination', emoji: '🎯', name: 'Coordination' }
  ]},
  { section: 'Sports collectifs', cats: [
    { key: 'soccer', emoji: '⚽', name: 'Soccer' },
    { key: 'basketball', emoji: '🏀', name: 'Basketball' },
    { key: 'volleyball', emoji: '🏐', name: 'Volleyball' },
    { key: 'handball', emoji: '🤾', name: 'Handball' }
  ]},
  { section: 'Arts corporels', cats: [
    { key: 'danse', emoji: '💃', name: 'Danse et rythme' },
    { key: 'acrosport', emoji: '🤸', name: 'Acrosport' },
    { key: 'expression', emoji: '🎭', name: 'Expression corporelle' }
  ]}
];

function setCoursMode(mode) {
  _planMode = mode;
  document.getElementById('mode-btn-educatifs')?.classList.toggle('active', mode === 'educatifs');
  document.getElementById('mode-btn-sae')?.classList.toggle('active', mode === 'sae');
  // Save mode in config
  var config = getCoursConfig();
  config.mode = mode;
  setCoursConfig(config);

  // Show/hide mode-specific sections
  var slotsSection = document.getElementById('cours-slots-section');
  var slotBrowser = document.getElementById('slot-browser');
  var saeCompletSection = document.getElementById('sae-complet-section');
  var coursConfig = document.querySelector('.cours-config');
  var evalSection = document.getElementById('eval-section');

  if (mode === 'sae') {
    // SAE complet mode: hide slots/browser, show SAE complet browser
    if (slotsSection) slotsSection.classList.add('hidden');
    if (slotBrowser) slotBrowser.classList.add('hidden');
    if (saeCompletSection) saeCompletSection.classList.remove('hidden');
    if (coursConfig) coursConfig.classList.add('hidden');
    if (evalSection) evalSection.classList.add('hidden');
    populateSaeCompletMoyenSelect();
  } else {
    // Educatifs mode: show config + slots, hide SAE complet
    if (saeCompletSection) saeCompletSection.classList.add('hidden');
    if (coursConfig) coursConfig.classList.remove('hidden');
    populateCoursCatSelect();
    renderSlots();
  }
}

// Sous-categories par moyen d'action
var SOUS_CATEGORIES = {
  manipulation: [
    'Lancer', 'Attraper', 'Dribble main', 'Dribble pied', 'Frapper', 'Jongler',
    'Botter', 'Rouler', 'Pousser', 'Tirer', 'Passe', 'Réception',
    'Ballon', 'Balle', 'Raquette', 'Bâton', 'Frisbee', 'Corde', 'Cerceau', 'Foulard', 'Sac de sable'
  ],
  locomotion: [
    'Courir', 'Sauter', 'Galoper', 'Ramper', 'Glisser', 'Esquiver',
    'Grimper', 'Rouler', 'Se déplacer', 'Sprint', 'Endurance', 'Poursuite',
    'Course à relais', 'Parcours', 'Pas chassés'
  ],
  stabilisation: [
    'Équilibre statique', 'Équilibre dynamique', 'Gainage', 'Souplesse',
    'Coordination', 'Yoga', 'Force', 'Flexibilité', 'Posture',
    'Conditionnement', 'Rotation', 'Appui'
  ],
  opposition: [
    'Duel', 'Territoire', 'Lutte', 'Dodgeball', 'Ballon chasseur',
    'Feinte', 'Défense', 'Attaque', 'Combat', 'Confrontation',
    'Esquive', 'Stratégie défensive'
  ],
  cooperation: [
    'Basketball', 'Volleyball', 'Handball', 'Soccer', 'Flag-football',
    'Spikeball', 'Ultimate', 'Kin-Ball', 'Tchoukball',
    'Jeux coopératifs', 'Construction', 'Communication', 'Stratégie d\'équipe',
    'Parachute', 'Relais coopératif'
  ],
  expression: [
    'Danse', 'Mime', 'Acrosport', 'Gymnastique', 'Cirque',
    'Création', 'Rythme', 'Chorégraphie', 'Expression corporelle',
    'Mouvement expressif', 'Enchaînement'
  ]
};

function populateSaeCompletMoyenSelect() {
  var select = document.getElementById('sae-complet-moyen');
  if (!select) return;
  select.innerHTML = '<option value="">Tous les moyens</option>';
  MOYENS_ACTION.forEach(function(m) {
    var opt = document.createElement('option');
    opt.value = m.key;
    opt.textContent = m.emoji + ' ' + m.label.replace(m.emoji + ' ', '');
    select.appendChild(opt);
  });
}

function onSaeCompletMoyenChange() {
  populateSaeCompletSousSelect();
  filterSaeComplet();
}

function populateSaeCompletSousSelect() {
  var select = document.getElementById('sae-complet-sous');
  if (!select) return;
  var moyenKey = document.getElementById('sae-complet-moyen')?.value || '';
  select.innerHTML = '<option value="">Toutes les sous-catégories</option>';

  if (moyenKey && SOUS_CATEGORIES[moyenKey]) {
    SOUS_CATEGORIES[moyenKey].forEach(function(sc) {
      var opt = document.createElement('option');
      opt.value = sc.toLowerCase();
      opt.textContent = sc;
      select.appendChild(opt);
    });
  }
}

function filterSaeComplet() {
  var container = document.getElementById('sae-complet-results');
  if (!container) return;

  var cycleVal = document.getElementById('sae-complet-cycle')?.value || '';
  var duree = parseInt(document.getElementById('sae-complet-duree')?.value || '0');
  var moyenKey = document.getElementById('sae-complet-moyen')?.value || '';
  var sousVal = document.getElementById('sae-complet-sous')?.value || '';

  // Need at least cycle or duree or moyen selected
  if (!duree && !cycleVal && !moyenKey) {
    container.innerHTML = '<p class="cours-browser-hint">Sélectionne un cycle, un nombre de cours ou un moyen d\'action pour voir les SAÉ.</p>';
    return;
  }

  var results = allSAE.slice();

  // Filter by cycle
  if (cycleVal) {
    results = results.filter(function(s) {
      return matchCycle(s, cycleVal);
    });
  }

  // Filter by duree
  if (duree) {
    results = results.filter(function(s) {
      return s.duree_periodes === duree;
    });
  }

  // Filter by moyen d'action category
  if (moyenKey) {
    var m = MOYENS_ACTION.find(function(x) { return x.key === moyenKey; });
    if (m) {
      results = results.filter(function(s) {
        var text = [
          s.titre, s.nom, s.moyen_action, s.moyens_action, s._source,
          ...(s.tags || []), s.description
        ].filter(Boolean).join(' ').toLowerCase();
        return m.keywords.some(function(kw) { return text.includes(kw); });
      });
    }
  }

  // Filter by sous-categorie
  if (sousVal) {
    results = results.filter(function(s) {
      var text = [
        s.titre, s.nom, s.moyen_action, s.moyens_action, s.description,
        ...(s.tags || [])
      ].filter(Boolean).join(' ').toLowerCase();
      return text.includes(sousVal);
    });
  }

  container.innerHTML = '';

  if (results.length === 0) {
    container.innerHTML = '<p class="cours-browser-hint">Aucune SAÉ trouvée avec ces critères.</p>';
    return;
  }

  var countDiv = document.createElement('div');
  countDiv.className = 'sae-complet-count';
  countDiv.innerHTML = '<strong>' + results.length + '</strong> SAÉ disponible' + (results.length > 1 ? 's' : '');
  container.appendChild(countDiv);

  var grid = document.createElement('div');
  grid.className = 'sae-complet-grid';

  results.forEach(function(s) {
    var card = document.createElement('div');
    card.className = 'sae-complet-card';
    var cycleLabel = s.cycle || s.niveau || '';
    card.innerHTML =
      '<div class="sae-complet-card-title">' + escapeHtml(s.titre || s.nom || '') + '</div>' +
      '<div class="sae-complet-card-moyen">' + escapeHtml(s.moyen_action || s.moyens_action || '') + '</div>' +
      (cycleLabel ? '<div class="sae-complet-card-cycle">' + escapeHtml(cycleLabel) + '</div>' : '');
    card.addEventListener('click', function() { openModal(s); });
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function fetchEducatifs(catKey) {
  return new Promise(function(resolve) {
    if (_educatifsCache[catKey]) {
      resolve(_educatifsCache[catKey]);
      return;
    }
    var url = 'https://educatifs.zonetotalsport.ca/data/educatifs/' + catKey + '.json';
    fetch(url).then(function(r) { return r.json(); }).then(function(data) {
      var items = Array.isArray(data) ? data : (data.educatifs || data.items || []);
      // Tag each item with source info
      items.forEach(function(item) {
        item._source = catKey;
        item._isEducatif = true;
      });
      _educatifsCache[catKey] = items;
      resolve(items);
    }).catch(function() {
      resolve([]);
    });
  });
}

function getMonCours() {
  try {
    return JSON.parse(localStorage.getItem('mon-cours-sae') || '[]');
  } catch { return []; }
}

function setMonCours(arr) {
  localStorage.setItem('mon-cours-sae', JSON.stringify(arr));
  updateCoursFab();
}

function getCoursConfig() {
  try {
    return JSON.parse(localStorage.getItem('mon-cours-sae-config') || '{}');
  } catch { return {}; }
}

function setCoursConfig(config) {
  localStorage.setItem('mon-cours-sae-config', JSON.stringify(config));
}

function getEvalConfig() {
  try {
    return JSON.parse(localStorage.getItem('mon-cours-sae-eval') || '{}');
  } catch { return {}; }
}

function setEvalConfig(config) {
  localStorage.setItem('mon-cours-sae-eval', JSON.stringify(config));
}

function isInCours(s) {
  const titre = s.titre || s.nom;
  const cours = getMonCours();
  return cours.some(function(slot) {
    if (!Array.isArray(slot)) return false;
    return slot.some(function(e) { return e && e.titre === titre; });
  });
}

function updateCoursFab() {
  const cours = getMonCours();
  let total = 0;
  cours.forEach(function(slot) {
    if (Array.isArray(slot)) total += slot.length;
  });
  const badge = document.getElementById('cours-fab-count');
  if (badge) {
    badge.textContent = total;
    badge.classList.toggle('hidden', total === 0);
  }
}

function toggleCoursItem(s, btn) {
  // Not used in multi-SAE mode — card + button has no effect without knowing which slot
  showToast('Ouvre "Planifier ma SAE" pour ajouter des activites aux cours');
}

function refreshCardCoursState(s) {
  document.querySelectorAll('.sae-card').forEach(card => {
    const titleEl = card.querySelector('.card-title');
    if (titleEl && titleEl.textContent === (s.titre || s.nom)) {
      const addBtn = card.querySelector('.sae-card-add-btn');
      if (addBtn) {
        const inC = isInCours(s);
        addBtn.classList.toggle('added', inC);
        addBtn.textContent = inC ? '\u2713' : '+';
        addBtn.title = inC ? 'Retirer de ma SAE' : 'Ajouter a ma SAE';
      }
    }
  });
}

function buildSlotData(s) {
  var isEdu = s._isEducatif;
  return {
    titre: s.titre || s.nom || '',
    description: isEdu ? (s.desc || '') : (s.description || s.contexte_apprentissage || ''),
    cycle: s.cycle || s.niveau || '',
    competence_pfeq: isEdu ? (s.competence || '') : (s.competence_pfeq || ''),
    moyen_action: s.moyen_action || s.moyens_action || '',
    duree_periodes: isEdu ? (s.duree ? s.duree + ' min' : '') : (s.duree_periodes || s.duree || ''),
    criteres_evaluation: s.criteres_evaluation || [],
    intentions_pedagogiques: s.intentions_pedagogiques || '',
    _source: s._source || '',
    _isEducatif: isEdu || false,
    _note: ''
  };
}

// ===== OPEN / CLOSE COURS =====

function openCours() {
  const app = document.getElementById('app');
  const fab = document.getElementById('cours-fab');
  if (app) app.classList.add('hidden');
  if (fab) fab.classList.add('hidden');

  const section = document.getElementById('cours-section');
  if (!section) return;
  section.classList.remove('hidden');

  const config = getCoursConfig();
  const titreInput = document.getElementById('cours-titre');
  const niveauSelect = document.getElementById('cours-niveau');
  const nbSelect = document.getElementById('cours-nb');
  const notesArea = document.getElementById('cours-notes');
  if (titreInput) titreInput.value = config.titre || '';
  if (niveauSelect) niveauSelect.value = config.niveau || '';
  if (nbSelect) nbSelect.value = config.nbCours || '0';
  if (notesArea) notesArea.value = config.notes || '';

  [titreInput, niveauSelect, nbSelect, notesArea].forEach(el => {
    if (el) {
      el.removeEventListener('input', saveCoursConfigFromUI);
      el.removeEventListener('change', saveCoursConfigFromUI);
      el.addEventListener('input', saveCoursConfigFromUI);
      el.addEventListener('change', saveCoursConfigFromUI);
    }
  });

  // Restore mode
  _planMode = config.mode || 'educatifs';
  setCoursMode(_planMode);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function saveCoursConfigFromUI() {
  setCoursConfig({
    titre: document.getElementById('cours-titre')?.value || '',
    niveau: document.getElementById('cours-niveau')?.value || '',
    nbCours: document.getElementById('cours-nb')?.value || '0',
    notes: document.getElementById('cours-notes')?.value || '',
    mode: _planMode
  });
}

function closeCours() {
  saveCoursConfigFromUI();
  saveEvalFromUI();
  const section = document.getElementById('cours-section');
  const app = document.getElementById('app');
  const fab = document.getElementById('cours-fab');
  if (section) section.classList.add('hidden');
  if (app) app.classList.remove('hidden');
  if (fab) fab.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== NOMBRE DE COURS =====

function onNbCoursChange() {
  saveCoursConfigFromUI();
  const nb = parseInt(document.getElementById('cours-nb')?.value || '0');
  const cours = getMonCours();

  if (nb > cours.length) {
    while (cours.length < nb) cours.push([]);
  } else if (nb < cours.length) {
    cours.length = nb;
  }
  // Migrate old format (single object) to array
  for (var i = 0; i < cours.length; i++) {
    if (!Array.isArray(cours[i])) {
      cours[i] = cours[i] && cours[i].titre ? [cours[i]] : [];
    }
  }
  setMonCours(cours);
  renderSlots();
}

// ===== RENDER SLOTS =====

function renderSlots() {
  var config = getCoursConfig();
  var nb = parseInt(config.nbCours || '0');
  var slotsSection = document.getElementById('cours-slots-section');
  var slotsContainer = document.getElementById('cours-slots');
  var actionsEl = document.getElementById('cours-actions');
  var totalCountEl = document.getElementById('cours-total-count');

  if (nb === 0) {
    if (slotsSection) slotsSection.classList.add('hidden');
    if (actionsEl) actionsEl.classList.add('hidden');
    hideEvalSection();
    return;
  }

  if (slotsSection) slotsSection.classList.remove('hidden');

  var cours = getMonCours();
  while (cours.length < nb) cours.push([]);
  if (cours.length > nb) cours.length = nb;
  // Migrate old format
  for (var m = 0; m < cours.length; m++) {
    if (!Array.isArray(cours[m])) {
      cours[m] = cours[m] && cours[m].titre ? [cours[m]] : [];
    }
  }
  setMonCours(cours);

  slotsContainer.innerHTML = '';

  var filledCount = 0;

  cours.forEach(function(slotSaes, index) {
    var slot = document.createElement('div');
    var hasSaes = slotSaes.length > 0;
    slot.className = 'cours-slot' + (hasSaes ? ' filled' : '');

    var numBadge = '<div class="cours-slot-num">Cours ' + (index + 1) + '</div>';

    if (hasSaes) {
      filledCount++;

      // Build list of SAE titles with duration
      var saesListHTML = '';
      slotSaes.forEach(function(sae, saeIdx) {
        var duree = sae.duree_periodes ? ' <span class="cours-slot-duree">(' + sae.duree_periodes + ' per.)</span>' : '';
        saesListHTML +=
          '<div class="cours-slot-sae-row" data-slot="' + index + '" data-sae="' + saeIdx + '">' +
            '<span class="cours-slot-sae-title">' + escapeHtml(sae.titre) + duree + '</span>' +
            '<button class="cours-slot-sae-remove" title="Retirer">\u2715</button>' +
          '</div>';
      });

      slot.innerHTML = numBadge + saesListHTML +
        '<button class="cours-slot-add-more" data-idx="' + index + '">+ Ajouter</button>';

      // Click title to open modal/preview
      slot.querySelectorAll('.cours-slot-sae-title').forEach(function(titleEl, saeIdx) {
        titleEl.style.cursor = 'pointer';
        titleEl.addEventListener('click', function(e) {
          e.stopPropagation();
          var saeData = slotSaes[saeIdx];
          if (saeData._isEducatif) {
            // Try to find from cache
            var eduFound = null;
            Object.values(_educatifsCache).forEach(function(arr) {
              if (!eduFound) {
                eduFound = arr.find(function(ed) { return ed.titre === saeData.titre; });
              }
            });
            if (eduFound) {
              openEducatifPreview(eduFound);
            } else {
              // Fetch the source category and find it
              if (saeData._source) {
                fetchEducatifs(saeData._source).then(function(edus) {
                  var found = edus.find(function(ed) { return ed.titre === saeData.titre; });
                  if (found) openEducatifPreview(found);
                });
              }
            }
          } else {
            var found = allSAE.find(function(ss) { return (ss.titre || ss.nom) === saeData.titre; });
            if (found) openModal(found);
          }
        });
      });

      // Remove individual SAE
      slot.querySelectorAll('.cours-slot-sae-remove').forEach(function(removeBtn, saeIdx) {
        removeBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          var c = getMonCours();
          if (Array.isArray(c[index])) {
            c[index].splice(saeIdx, 1);
          }
          setMonCours(c);
          renderSlots();
          showToast('SAE retiree du cours ' + (index + 1));
        });
      });

      // Add more button
      slot.querySelector('.cours-slot-add-more').addEventListener('click', function(e) {
        e.stopPropagation();
        openSlotBrowser(index);
      });

    } else {
      slot.innerHTML = numBadge +
        '<div class="cours-slot-empty-icon">\u2795</div>' +
        '<div class="cours-slot-empty">Cliquer pour ajouter des activites</div>';
      slot.addEventListener('click', function() { openSlotBrowser(index); });
    }

    slotsContainer.appendChild(slot);
  });

  if (totalCountEl) totalCountEl.textContent = filledCount;
  if (actionsEl) actionsEl.classList.toggle('hidden', filledCount === 0);

  // Show eval when at least 1 slot has SAEs
  if (filledCount > 0) {
    showEvalSection();
  } else {
    hideEvalSection();
  }
}

// ===== SLOT BROWSER =====

function openSlotBrowser(index) {
  _activeSlotIndex = index;
  var browser = document.getElementById('slot-browser');
  var label = document.getElementById('slot-browser-label');
  if (browser) browser.classList.remove('hidden');
  if (label) label.textContent = 'Cours ' + (index + 1);

  var searchInput = document.getElementById('cours-browser-search');
  if (searchInput) searchInput.value = '';

  updateCoursBrowser();
  if (browser) browser.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeSlotBrowser() {
  _activeSlotIndex = -1;
  var browser = document.getElementById('slot-browser');
  if (browser) browser.classList.add('hidden');
}

function populateCoursCatSelect() {
  var select = document.getElementById('cours-cat-select');
  if (!select) return;

  if (_planMode === 'educatifs') {
    select.innerHTML = '<option value="">— Choisir une categorie —</option>';
    EDUCATIFS_CATS.forEach(function(section) {
      var group = document.createElement('optgroup');
      group.label = section.section;
      section.cats.forEach(function(c) {
        var opt = document.createElement('option');
        opt.value = 'edu:' + c.key;
        opt.textContent = c.emoji + ' ' + c.name;
        group.appendChild(opt);
      });
      select.appendChild(group);
    });
  } else {
    select.innerHTML = '<option value="">— Choisir un moyen d\'action —</option>';
    MOYENS_ACTION.forEach(function(m) {
      var opt = document.createElement('option');
      opt.value = m.key;
      opt.textContent = m.emoji + ' ' + m.label.replace(m.emoji + ' ', '');
      select.appendChild(opt);
    });
  }
}

function updateCoursBrowser() {
  var container = document.getElementById('cours-browser-results');
  if (!container) return;

  var catKey = document.getElementById('cours-cat-select')?.value;
  var search = (document.getElementById('cours-browser-search')?.value || '').toLowerCase().trim();

  if (!catKey) {
    container.innerHTML = '<p class="cours-browser-hint">Selectionne une categorie pour voir les activites disponibles.</p>';
    return;
  }

  // Educatifs mode: fetch from educatifs.zonetotalsport.ca
  if (catKey.startsWith('edu:')) {
    var eduKey = catKey.replace('edu:', '');
    container.innerHTML = '<p class="cours-browser-hint">Chargement des educatifs...</p>';
    fetchEducatifs(eduKey).then(function(educatifs) {
      var results = educatifs;
      if (search) {
        results = results.filter(function(e) {
          var text = [e.titre, e.desc, e.competence].filter(Boolean).join(' ').toLowerCase();
          return text.includes(search);
        });
      }
      renderBrowserResults(container, results, 'educatif');
    });
    return;
  }

  // SAE mode (existing)
  var m = MOYENS_ACTION.find(function(x) { return x.key === catKey; });
  if (!m) return;

  var results = allSAE.filter(function(s) {
    var text = [
      s.titre, s.nom, s.moyen_action, s.moyens_action, s._source,
      ...(s.tags || []), s.description
    ].filter(Boolean).join(' ').toLowerCase();
    return m.keywords.some(function(kw) { return text.includes(kw); });
  });

  if (search) {
    results = results.filter(function(s) {
      var text = [s.titre, s.nom, s.description, s.contexte_apprentissage].filter(Boolean).join(' ').toLowerCase();
      return text.includes(search);
    });
  }

  renderBrowserResults(container, results, 'sae');
}

function renderBrowserResults(container, results, type) {
  var isEdu = type === 'educatif';
  var label = isEdu ? 'educatif' : 'SAE';

  container.innerHTML = '';

  var countDiv = document.createElement('div');
  countDiv.className = 'cours-browser-count';
  countDiv.innerHTML = '<strong>' + results.length + '</strong> ' + label + (results.length > 1 ? 's' : '') + ' disponible' + (results.length > 1 ? 's' : '');
  container.appendChild(countDiv);

  if (results.length === 0) {
    var hint = document.createElement('p');
    hint.className = 'cours-browser-hint';
    hint.textContent = 'Aucun ' + label + ' trouve avec ces criteres.';
    container.appendChild(hint);
    return;
  }

  results.slice(0, 50).forEach(function(s) {
    var item = document.createElement('div');
    item.className = 'cours-browse-item';

    if (isEdu) {
      item.innerHTML =
        '<div class="cours-browse-item-info">' +
          '<div class="cours-browse-item-title">' + escapeHtml(s.titre || '') + '</div>' +
          '<div class="cours-browse-item-meta">' +
            '<span>' + escapeHtml(s.niveau || '') + '</span>' +
            '<span>' + escapeHtml(s.competence || '') + '</span>' +
            (s.duree ? '<span>\u23F1 ' + s.duree + ' min</span>' : '') +
          '</div>' +
        '</div>' +
        '<button class="cours-browse-add-btn">+ Choisir</button>';
    } else {
      item.innerHTML =
        '<div class="cours-browse-item-info">' +
          '<div class="cours-browse-item-title">' + escapeHtml(s.titre || s.nom || '') + '</div>' +
          '<div class="cours-browse-item-meta">' +
            '<span>' + escapeHtml(s.cycle || s.niveau || '') + '</span>' +
            '<span>' + escapeHtml(s.competence_pfeq || '') + '</span>' +
            (s.duree_periodes ? '<span>\u23F1 ' + s.duree_periodes + ' per.</span>' : '') +
          '</div>' +
        '</div>' +
        '<button class="cours-browse-add-btn">+ Choisir</button>';
    }

    var info = item.querySelector('.cours-browse-item-info');
    info.style.cursor = 'pointer';
    info.addEventListener('click', function() {
      if (isEdu) {
        openEducatifPreview(s);
      } else {
        openModal(s);
      }
    });

    var btn = item.querySelector('.cours-browse-add-btn');
    btn.addEventListener('click', function() {
      if (_activeSlotIndex < 0) return;
      var cours = getMonCours();
      if (!Array.isArray(cours[_activeSlotIndex])) cours[_activeSlotIndex] = [];
      var titre = s.titre || s.nom || '';
      var already = cours[_activeSlotIndex].some(function(e) { return e.titre === titre; });
      if (already) {
        showToast('Deja dans ce cours !');
        return;
      }
      // Load detail if needed for criteres_evaluation
      loadDetail(s).then(function() {
        cours[_activeSlotIndex].push(buildSlotData(s));
        setMonCours(cours);
        btn.textContent = '\u2713 Ajoute';
        btn.classList.add('already-added');
        renderSlots();
        showToast((isEdu ? 'Educatif' : 'SAE') + ' ajoute au Cours ' + (_activeSlotIndex + 1) + ' !');
      });
    });

    container.appendChild(item);
  });
}

function openEducatifPreview(edu) {
  // Open a simple modal-like preview for an educatif
  var modal = document.getElementById('modal');
  var body = document.getElementById('modal-body');
  if (!modal || !body) return;

  var materielHTML = '';
  if (edu.materiel && edu.materiel.length) {
    materielHTML = '<div style="margin-top:12px;"><strong>Materiel :</strong><ul style="margin:4px 0 0 18px;">' +
      edu.materiel.map(function(m) { return '<li>' + escapeHtml(m) + '</li>'; }).join('') + '</ul></div>';
  }

  body.innerHTML =
    '<div class="modal-content" style="max-width:700px; margin:0 auto; padding:30px;">' +
      '<button class="modal-close" onclick="closeModal()">\u2715</button>' +
      '<div style="text-align:center; margin-bottom:16px;">' +
        '<span style="font-size:2rem;">🏃</span>' +
      '</div>' +
      '<h2 style="font-family:\'Bangers\',cursive; font-size:1.5rem; color:var(--primary); text-align:center; margin-bottom:4px;">' + escapeHtml(edu.titre) + '</h2>' +
      '<div style="text-align:center; margin-bottom:16px;">' +
        '<span class="badge" style="background:var(--primary); color:#fff; padding:3px 10px; border-radius:20px; font-size:0.8rem; margin:0 4px;">' + escapeHtml(edu.niveau || '') + '</span>' +
        '<span class="badge" style="background:var(--secondary); color:#fff; padding:3px 10px; border-radius:20px; font-size:0.8rem; margin:0 4px;">' + escapeHtml(edu.competence || '') + '</span>' +
        (edu.duree ? '<span class="badge" style="background:var(--green); color:#fff; padding:3px 10px; border-radius:20px; font-size:0.8rem; margin:0 4px;">\u23F1 ' + edu.duree + ' min</span>' : '') +
      '</div>' +
      '<div style="font-family:\'Schoolbell\',cursive; font-size:0.95rem; line-height:1.7; color:var(--text);">' +
        '<p>' + escapeHtml(edu.desc || '') + '</p>' +
        materielHTML +
        (edu.variantes ? '<div style="margin-top:12px;"><strong>Variantes :</strong> ' + escapeHtml(edu.variantes) + '</div>' : '') +
        (edu.adaptation ? '<div style="margin-top:8px;"><strong>Adaptation :</strong> ' + escapeHtml(edu.adaptation) + '</div>' : '') +
      '</div>' +
      '<div style="text-align:center; margin-top:20px;">' +
        '<a href="https://zonetotalsport.ca" target="_blank"><img src="img/logo-zonetotalsport.png" alt="ZoneTotalSport.ca" style="max-width:200px; height:auto;" /></a>' +
      '</div>' +
    '</div>';

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

// ===== EVALUATION =====

function showEvalSection() {
  var section = document.getElementById('eval-section');
  if (!section) return;
  section.classList.remove('hidden');
  renderEvalObservables();
  renderEvalIntentions();
  renderEvalScale();
}

function hideEvalSection() {
  var section = document.getElementById('eval-section');
  if (section) section.classList.add('hidden');
}

function renderEvalObservables() {
  var list = document.getElementById('eval-observables-list');
  if (!list) return;

  var cours = getMonCours();
  var evalConfig = getEvalConfig();
  var checkedObs = evalConfig.checkedObservables || [];
  var customObs = evalConfig.customObservables || [];

  var allCriteres = [];
  var seen = new Set();

  cours.forEach(function(slotSaes, idx) {
    if (!Array.isArray(slotSaes)) return;
    slotSaes.forEach(function(sae) {
      if (!sae || !sae.titre) return;
      var criteres = sae.criteres_evaluation || [];
      (Array.isArray(criteres) ? criteres : [criteres]).forEach(function(c) {
        if (typeof c === 'string' && c.trim() && !seen.has(c)) {
          seen.add(c);
          allCriteres.push({ text: c, source: 'Cours ' + (idx + 1) });
        }
      });
    });
  });

  list.innerHTML = '';

  if (allCriteres.length === 0 && customObs.length === 0) {
    list.innerHTML = '<p class="cours-browser-hint">Aucun critere d\'evaluation trouve dans les SAE selectionnees. Ajoute des observables personnalises ci-dessous.</p>';
  }

  allCriteres.forEach(function(crit) {
    var isChecked = checkedObs.includes(crit.text);
    var item = document.createElement('div');
    item.className = 'eval-observable-item';
    item.innerHTML =
      '<input type="checkbox" ' + (isChecked ? 'checked' : '') + ' />' +
      '<span class="eval-observable-text">' + escapeHtml(crit.text) + '</span>' +
      '<span class="eval-observable-source">' + escapeHtml(crit.source) + '</span>';
    item.querySelector('input').addEventListener('change', function() { saveEvalFromUI(); });
    list.appendChild(item);
  });

  customObs.forEach(function(text, idx) {
    var isChecked = checkedObs.includes('custom:' + text);
    var item = document.createElement('div');
    item.className = 'eval-observable-item custom';
    item.innerHTML =
      '<input type="checkbox" ' + (isChecked ? 'checked' : '') + ' />' +
      '<span class="eval-observable-text">' + escapeHtml(text) + '</span>' +
      '<button class="cours-slot-remove" title="Supprimer" style="position:static;">\u2715</button>';
    item.querySelector('input').addEventListener('change', function() { saveEvalFromUI(); });
    item.querySelector('.cours-slot-remove').addEventListener('click', function() {
      var ec = getEvalConfig();
      ec.customObservables = (ec.customObservables || []).filter(function(_, i) { return i !== idx; });
      setEvalConfig(ec);
      renderEvalObservables();
    });
    list.appendChild(item);
  });
}

function addCustomObservable() {
  var input = document.getElementById('eval-custom-input');
  if (!input || !input.value.trim()) return;
  var ec = getEvalConfig();
  if (!ec.customObservables) ec.customObservables = [];
  ec.customObservables.push(input.value.trim());
  if (!ec.checkedObservables) ec.checkedObservables = [];
  ec.checkedObservables.push('custom:' + input.value.trim());
  setEvalConfig(ec);
  input.value = '';
  renderEvalObservables();
}

function renderEvalIntentions() {
  var intentionsDiv = document.getElementById('eval-intentions-div');
  var evalSection = document.getElementById('eval-section');
  var scaleDiv = evalSection?.querySelector('.eval-scale');

  if (!intentionsDiv) {
    intentionsDiv = document.createElement('div');
    intentionsDiv.id = 'eval-intentions-div';
    intentionsDiv.className = 'eval-intentions';
    if (scaleDiv) {
      scaleDiv.parentNode.insertBefore(intentionsDiv, scaleDiv);
    } else if (evalSection) {
      evalSection.appendChild(intentionsDiv);
    }
  }

  var config = getCoursConfig();
  var niveau = config.niveau || '';
  var intentions = INTENTIONS_PFEQ[niveau] || [];
  var evalCfg = getEvalConfig();
  var checkedIntentions = evalCfg.checkedIntentions || [];

  if (intentions.length === 0) {
    intentionsDiv.innerHTML =
      '<h4 class="eval-sub-title">\uD83C\uDFAF Intentions pedagogiques PFEQ</h4>' +
      '<p class="cours-browser-hint">Selectionne un niveau scolaire dans la configuration pour voir les intentions pedagogiques du PFEQ.</p>';
    return;
  }

  intentionsDiv.innerHTML =
    '<h4 class="eval-sub-title">\uD83C\uDFAF Intentions pedagogiques PFEQ — ' + escapeHtml(niveau) + '</h4>' +
    '<div class="eval-intentions-list" id="eval-intentions-list"></div>';

  var listEl = intentionsDiv.querySelector('#eval-intentions-list');

  intentions.forEach(function(intent) {
    var isChecked = checkedIntentions.includes(intent);
    var item = document.createElement('div');
    item.className = 'eval-intention-item';
    item.innerHTML =
      '<input type="checkbox" ' + (isChecked ? 'checked' : '') + ' />' +
      '<span class="eval-intention-text">' + escapeHtml(intent) + '</span>';
    item.querySelector('input').addEventListener('change', function() { saveEvalFromUI(); });
    listEl.appendChild(item);
  });
}

function renderEvalScale() {
  var container = document.getElementById('eval-scale-descriptions');
  if (!container) return;

  var evalCfg = getEvalConfig();
  var scaleType = evalCfg.scaleType || 'ABCDE';
  var customDescs = evalCfg.scaleDescs || {};

  document.querySelectorAll('input[name="eval-scale"]').forEach(function(r) {
    r.checked = r.value === scaleType;
  });

  var scale = SCALES[scaleType] || SCALES.ABCDE;

  container.innerHTML = '';
  scale.forEach(function(item) {
    var customDesc = customDescs[item.label] || item.desc;
    var row = document.createElement('div');
    row.className = 'eval-scale-row';
    row.innerHTML =
      '<div class="eval-scale-label">' + item.label + '</div>' +
      '<input type="text" class="eval-scale-desc" value="' + escapeHtml(customDesc) + '" data-label="' + item.label + '" />';
    row.querySelector('input').addEventListener('input', function() { saveEvalFromUI(); });
    container.appendChild(row);
  });
}

function onScaleChange() {
  var scaleType = document.querySelector('input[name="eval-scale"]:checked')?.value || 'ABCDE';
  var ec = getEvalConfig();
  ec.scaleType = scaleType;
  ec.scaleDescs = {};
  setEvalConfig(ec);
  renderEvalScale();
}

function saveEvalFromUI() {
  var ec = getEvalConfig();

  var obsItems = document.querySelectorAll('#eval-observables-list .eval-observable-item');
  ec.checkedObservables = [];
  obsItems.forEach(function(item) {
    var cb = item.querySelector('input[type="checkbox"]');
    var text = item.querySelector('.eval-observable-text')?.textContent || '';
    var isCustom = item.classList.contains('custom');
    if (cb?.checked) {
      ec.checkedObservables.push(isCustom ? 'custom:' + text : text);
    }
  });

  var intentItems = document.querySelectorAll('#eval-intentions-list .eval-intention-item');
  ec.checkedIntentions = [];
  intentItems.forEach(function(item) {
    var cb = item.querySelector('input[type="checkbox"]');
    var text = item.querySelector('.eval-intention-text')?.textContent || '';
    if (cb?.checked) {
      ec.checkedIntentions.push(text);
    }
  });

  ec.scaleType = document.querySelector('input[name="eval-scale"]:checked')?.value || 'ABCDE';
  ec.scaleDescs = {};
  document.querySelectorAll('.eval-scale-desc').forEach(function(input) {
    ec.scaleDescs[input.dataset.label] = input.value;
  });

  setEvalConfig(ec);
}

// ===== EXPORT COURS V2 =====

function buildCoursHTML() {
  var cours = getMonCours();
  var config = getCoursConfig();
  var evalCfg = getEvalConfig();

  var coursHTML = '';
  cours.forEach(function(slotSaes, i) {
    if (!Array.isArray(slotSaes) || slotSaes.length === 0) return;
    var saesLinksHTML = '';
    slotSaes.forEach(function(sae) {
      var saeUrl = sae._isEducatif
        ? 'https://educatifs.zonetotalsport.ca/?id=' + encodeURIComponent(sae.titre)
        : 'https://sae.zonetotalsport.ca/?id=' + encodeURIComponent(sae.titre);
      var dureeStr = sae.duree_periodes ? ' <span style="font-weight:400; color:#666; font-size:0.9rem;">(' + sae.duree_periodes + ')</span>' : '';
      saesLinksHTML +=
        '<div style="padding:3px 0;">' +
          '<a href="' + saeUrl + '" target="_blank" style="font-family:\'Bangers\',cursive; font-size:1rem; font-weight:700; color:#0077CC; text-decoration:none; border-bottom:1px dashed #0077CC;">' + escapeHtml(sae.titre) + '</a>' +
          dureeStr +
        '</div>';
    });
    coursHTML +=
      '<div style="display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid #eee;">' +
        '<div style="width:32px; height:32px; border-radius:50%; background:#0077CC; color:#fff; display:flex; align-items:center; justify-content:center; font-family:\'Bangers\',cursive; font-weight:700; font-size:0.95rem; flex-shrink:0; margin-top:2px;">' + (i + 1) + '</div>' +
        '<div>' + saesLinksHTML + '</div>' +
      '</div>';
  });

  // Intentions
  var intentionsHTML = '';
  var checkedIntentions = evalCfg.checkedIntentions || [];
  if (checkedIntentions.length > 0) {
    intentionsHTML =
      '<div style="page-break-inside:avoid; margin-top:20px;">' +
        '<h2 style="font-family:\'Bangers\',cursive; font-size:1.4rem; color:#E91E63; margin-bottom:10px; border-bottom:2px solid #E91E63; padding-bottom:6px;">\uD83C\uDFAF Intentions pedagogiques</h2>' +
        '<ul style="padding-left:20px; font-family:\'Schoolbell\',cursive; font-size:0.95rem; line-height:1.8;">' +
          checkedIntentions.map(function(i) { return '<li>' + escapeHtml(i) + '</li>'; }).join('') +
        '</ul>' +
      '</div>';
  }

  // Evaluation grid
  var evalHTML = '';
  var checkedObs = (evalCfg.checkedObservables || []).map(function(o) { return o.startsWith('custom:') ? o.slice(7) : o; });
  if (checkedObs.length > 0) {
    var scaleType = evalCfg.scaleType || 'ABCDE';
    var scaleItems = SCALES[scaleType] || SCALES.ABCDE;
    var customDescs = evalCfg.scaleDescs || {};

    var legendHTML = '<div style="margin-bottom:14px; font-family:\'Schoolbell\',cursive; font-size:0.85rem; color:#555;">';
    scaleItems.forEach(function(s) {
      var desc = customDescs[s.label] || s.desc;
      legendHTML += '<strong>' + s.label + '</strong> = ' + escapeHtml(desc) + ' &nbsp;|&nbsp; ';
    });
    legendHTML = legendHTML.replace(/&nbsp;\|&nbsp; $/, '') + '</div>';

    var filledCours = cours.filter(function(s) { return s && s.titre; });
    var colHeaders = filledCours.map(function(_, i) {
      return '<th style="padding:8px 6px; font-family:\'Bangers\',cursive; font-size:0.8rem; color:#0077CC; min-width:50px; text-align:center;">El. ' + (i + 1) + '</th>';
    }).join('');

    var rows = '';
    checkedObs.forEach(function(obs) {
      var emptyCols = filledCours.map(function() { return '<td style="border:1px solid #ddd; padding:6px; text-align:center; min-width:50px;"></td>'; }).join('');
      rows += '<tr><td style="border:1px solid #ddd; padding:8px 12px; font-family:\'Schoolbell\',cursive; font-size:0.85rem; color:#333;">' + escapeHtml(obs) + '</td>' + emptyCols + '</tr>';
    });

    evalHTML =
      '<div style="page-break-before:always; margin-top:24px;">' +
        '<h2 style="font-family:\'Bangers\',cursive; font-size:1.4rem; color:#2E7D32; margin-bottom:10px; border-bottom:2px solid #2E7D32; padding-bottom:6px;">\uD83D\uDCCA Grille d\'evaluation</h2>' +
        legendHTML +
        '<table style="width:100%; border-collapse:collapse; font-size:0.9rem;">' +
          '<thead>' +
            '<tr style="background:#f0f7ff;">' +
              '<th style="padding:10px 12px; text-align:left; font-family:\'Bangers\',cursive; font-size:0.9rem; color:#222; border:1px solid #ddd;">Observable</th>' +
              colHeaders +
            '</tr>' +
          '</thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>';
  }

  var filledCount = cours.filter(function(s) { return Array.isArray(s) && s.length > 0; }).length;

  return '<!DOCTYPE html>' +
'<html lang="fr"><head><meta charset="UTF-8">' +
'<title>' + escapeHtml(config.titre || 'Ma SAE') + ' \u2014 Zone Total Sport</title>' +
'<link href="https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Bangers&family=Schoolbell&display=swap" rel="stylesheet">' +
'<style>' +
'  @page { margin: 15mm 12mm 20mm 12mm; }' +
'  body { font-family: \'Schoolbell\', cursive; margin: 0; padding: 24px; color: #222; }' +
'  .header { text-align: center; margin-bottom: 20px; border-bottom: 3px solid #0077CC; padding-bottom: 14px; }' +
'  .header h1 { font-family: \'Bangers\', cursive; font-size: 2rem; color: #0077CC; margin: 0 0 6px; }' +
'  .header .info { font-size: 0.9rem; color: #555; }' +
'  .header .info strong { color: #333; }' +
'  .notes { background: #f0f7ff; border: 1px solid #b3d4fc; border-radius: 10px; padding: 12px 16px; margin-bottom: 16px; font-size: 0.9rem; line-height: 1.6; }' +
'  .notes-label { font-family: \'Bangers\', cursive; font-weight: 700; color: #0077CC; margin-bottom: 4px; }' +
'  .footer { position: fixed; bottom: 0; left: 0; right: 0; text-align: center; font-family: \'Bangers\', cursive; font-size: 0.8rem; color: #999; padding: 8px; border-top: 1px solid #ddd; background: #fff; }' +
'  .footer a { color: #0077CC; text-decoration: none; }' +
'  @media print { .footer { position: fixed; bottom: 0; } }' +
'</style></head><body>' +
'<div class="header">' +
'  <h1>\uD83D\uDCCB ' + escapeHtml(config.titre || 'Planification de ma SAE') + '</h1>' +
'  <div class="info">' +
    (config.niveau ? '<strong>Niveau :</strong> ' + escapeHtml(config.niveau) + ' \u00B7 ' : '') +
    '<strong>' + filledCount + '</strong> cours planifies' +
'  </div>' +
'</div>' +
(config.notes ? '<div class="notes"><div class="notes-label">\uD83D\uDCDD Notes</div>' + escapeHtml(config.notes) + '</div>' : '') +
coursHTML +
intentionsHTML +
evalHTML +
'<div class="footer">' +
'  <a href="https://zonetotalsport.ca" target="_blank" style="display:inline-block; background:#fff; border-radius:12px; padding:8px 16px;"><img src="' + window.location.origin + '/img/logo-zonetotalsport.png" alt="ZoneTotalSport.ca" style="max-width:260px; height:auto; display:block;" /></a><br>' +
'  Cree avec <a href="https://zonetotalsport.ca" target="_blank">zonetotalsport.ca</a> \u2014 SAE PFEQ' +
'</div>' +
'</body></html>';
}

function printCours() {
  saveCoursConfigFromUI();
  saveEvalFromUI();
  var html = buildCoursHTML();
  var w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(function() { w.print(); }, 500);
}

function exportCoursPDF() {
  saveCoursConfigFromUI();
  saveEvalFromUI();
  var html = buildCoursHTML();
  var w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  setTimeout(function() { w.print(); }, 500);
}

function shareCours() {
  saveCoursConfigFromUI();
  saveEvalFromUI();
  var cours = getMonCours();
  var config = getCoursConfig();

  var shareData = {
    t: config.titre || '',
    n: config.niveau || '',
    nb: config.nbCours || '0',
    no: config.notes || '',
    e: cours.map(function(slot) {
      if (!Array.isArray(slot) || slot.length === 0) return [];
      return slot.map(function(sae) { return { t: sae.titre }; });
    })
  };

  var encoded = btoa(unescape(encodeURIComponent(JSON.stringify(shareData))));
  var url = 'https://sae.zonetotalsport.ca/?cours=' + encoded;

  navigator.clipboard.writeText(url).then(function() {
    showToast('Lien de la SAE copie !');
  }).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = url;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Lien de la SAE copie !');
  });
}

function checkCoursDeepLink() {
  var params = new URLSearchParams(window.location.search);
  var coursParam = params.get('cours');
  if (!coursParam) return;

  try {
    var data = JSON.parse(decodeURIComponent(escape(atob(coursParam))));
    setCoursConfig({
      titre: data.t || '',
      niveau: data.n || '',
      nbCours: data.nb || String((data.e || []).length),
      notes: data.no || ''
    });

    var entries = data.e || [];
    var cours = entries.map(function(slotItems) {
      if (!Array.isArray(slotItems)) {
        // Legacy single item format
        if (slotItems && slotItems.t) {
          var f = allSAE.find(function(s) { return (s.titre || s.nom) === slotItems.t; });
          return f ? [buildSlotData(f)] : [];
        }
        return [];
      }
      return slotItems.map(function(item) {
        var found = allSAE.find(function(s) { return (s.titre || s.nom) === item.t; });
        return found ? buildSlotData(found) : null;
      }).filter(Boolean);
    });
    setMonCours(cours);
    openCours();
  } catch (err) {
    console.warn('Cours deep link invalide', err);
  }
}

// Update intentions when niveau changes
document.addEventListener('DOMContentLoaded', function() {
  var niveauEl = document.getElementById('cours-niveau');
  if (niveauEl) {
    niveauEl.addEventListener('change', function() {
      saveCoursConfigFromUI();
      var evalSection = document.getElementById('eval-section');
      if (evalSection && !evalSection.classList.contains('hidden')) {
        renderEvalIntentions();
      }
    });
  }
});
