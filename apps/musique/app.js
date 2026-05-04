// ============================================
// APP MUSIQUE — Zone Total Sport
// 100% YouTube Playlists
// ============================================

// ---- PLAYLISTS PAR MOOD ----
const PLAYLISTS = [
  {
    icon: '🏠',
    title: 'Future House',
    mood: 'ÉNERGIE MAXIMALE · 125–135 BPM',
    desc: 'Basses profondes et synthés brillants. Parfait pour circuits, jeux collectifs et ballon chasseur.',
    tags: ['Circuits', 'Jeux collectifs', 'Ballon chasseur'],
    playlistId: 'PLRBp0Fe2GpgnQfsrvd9ZQQOz4mneH_q8S',
    label: 'NCS — Top 50 Future House',
    accent: '#00E5FF'
  },
  {
    icon: '🎧',
    title: 'House / Deep House',
    mood: 'GROOVE CONSTANT · 120–128 BPM',
    desc: 'Groove régulier et enveloppant. Idéal pour échauffement, course légère et endurance.',
    tags: ['Échauffement', 'Course', 'Endurance'],
    playlistId: 'PLRBp0Fe2GpgmoBCN3MTdwg4EiJmgxYy6e',
    label: 'NCS — Top 50 House Songs',
    accent: '#FFD700'
  },
  {
    icon: '🔥',
    title: 'Best of House',
    mood: 'MIX COMPLET · 120–130 BPM',
    desc: 'La crème de la house music NCS. Mix varié pour garder l\'énergie pendant tout le cours.',
    tags: ['Polyvalent', 'Cours complet', 'Ambiance'],
    playlistId: 'PLRBp0Fe2GpgmsW46rJyudVFlY6IYjFBIK',
    label: 'NCS — The Best of House',
    accent: '#FF9800'
  },
  {
    icon: '💪',
    title: 'Workout / HIIT',
    mood: 'INTENSITÉ MAX · 130–160 BPM',
    desc: 'Musique explosive pour HIIT, circuits intensifs et musculation. Pousse tes élèves au max.',
    tags: ['HIIT', 'Musculation', 'Gainage'],
    playlistId: 'PLC1og_v3eb4jNFEE9iuFNdLCQmYhZRNvt',
    label: 'Workout Music — Trap Nation',
    accent: '#ff4444'
  },
  {
    icon: '🎤',
    title: 'Trap / Hip-Hop',
    mood: 'URBAN BEATS · 80–100 BPM',
    desc: 'Beats trap et hip-hop. Ambiance urbaine pour les jeux d\'opposition et expression libre.',
    tags: ['Expression', 'Jeux libres', 'Opposition'],
    playlistId: 'PLRBp0Fe2Gpgldp6wTkEHOmuk_l1_8OCgw',
    label: 'NCS — Top 50 Trap Songs',
    accent: '#4CAF50'
  },
  {
    icon: '⚡',
    title: 'EDM / Électro',
    mood: 'PARTY MODE · 128–140 BPM',
    desc: 'Les meilleurs hits EDM de tous les temps. Énergie festive pour les cours spéciaux et fêtes.',
    tags: ['Fête', 'Célébration', 'Énergie'],
    playlistId: 'PLw-VjHDlEOgs658kAHR_LAaILBXb-s6Q5',
    label: 'Best EDM Songs of All Time',
    accent: '#E040FB'
  },
  {
    icon: '🌅',
    title: 'Happy / Échauffement',
    mood: 'POSITIF & LÉGER · 100–120 BPM',
    desc: 'Musique joyeuse et légère pour démarrer le cours. Monte doucement en énergie.',
    tags: ['Échauffement', 'Début de cours', 'Bonne humeur'],
    playlistId: 'PLyDNc-mLpTPYZtyW55w4Zy7HJnAPnu8SR',
    label: 'Happy Music — Vlog No Copyright',
    accent: '#FFD700'
  },
  {
    icon: '💃',
    title: 'Dance & Électronique',
    mood: 'DANSE & EXPRESSION · 110–130 BPM',
    desc: 'Dance music pour les activités d\'expression corporelle et chorégraphie.',
    tags: ['Danse', 'Expression', 'Chorégraphie'],
    playlistId: 'PLyDNc-mLpTPYlda_wQd3tnP2joefEB_QF',
    label: 'Dance & Electronic — Vlog NoCopyright',
    accent: '#FF9800'
  },
  {
    icon: '🎵',
    title: 'Pop Hits',
    mood: 'POPULAIRE & FUN · 100–130 BPM',
    desc: 'Hits pop intemporels que les élèves connaissent. Parfait pour créer une ambiance fun.',
    tags: ['Ambiance', 'Fun', 'Populaire'],
    playlistId: 'PLMC9KNkIncKtPzgY-5rmhvj7fax8fdxoj',
    label: 'Pop Music — Timeless Pop Songs',
    accent: '#E040FB'
  },
  {
    icon: '🧘',
    title: 'Chill / Retour au calme',
    mood: 'RELAXATION · 60–90 BPM',
    desc: 'Lo-fi et chill pour le retour au calme, étirements et fin de cours.',
    tags: ['Retour au calme', 'Étirements', 'Relaxation'],
    playlistId: 'PLRBp0Fe2GpgnRZpKULnyDQv9e_q41M6St',
    label: 'NCS — Background Music for Study & Chill',
    accent: '#00E5FF'
  },
  {
    icon: '☕',
    title: 'Lo-fi Hip Hop',
    mood: 'CONCENTRATION · 70–90 BPM',
    desc: 'Beats lo-fi relaxants. Parfait pour yoga, pleine conscience et activités calmes.',
    tags: ['Yoga', 'Pleine conscience', 'Calme'],
    playlistId: 'PLOzDu-MXXLliO9fBNZOQTBDddoA3FzZUo',
    label: 'Lo-fi Hip Hop',
    accent: '#FF9800'
  },
  {
    icon: '🎻',
    title: 'Classique',
    mood: 'PRESTIGE · 60–120 BPM',
    desc: 'Les plus grandes pièces classiques. Idéal pour gymnastique, expression et retour au calme.',
    tags: ['Gymnastique', 'Expression', 'Culture'],
    playlistId: 'PLcGkkXtask_eI44NtdwwcJ2Zxh1miU9Qh',
    label: 'Classical Music — HalidonMusic',
    accent: '#FFD700'
  }
];

// ---- RECHERCHES RAPIDES (vrais IDs YouTube) ----
const QUICK_PLAYS = [
  { icon: '🎧', label: 'Miss Monique — Yearmix Miami', videoId: '7MbyTJs3SAo' },
  { icon: '🎧', label: 'DJ Kallisto — Progressive House Vol. 15', videoId: 'z2e_VKgTbZM' },
  { icon: '🎧', label: 'Best of Tchami — Mixed by Royalce', videoId: 'JZ1CUIR0C4U' },
  { icon: '🎧', label: 'Oliver Heldens — Heldeep Radio', videoId: 'RRvSxkaIJp4' },
  { icon: '🏠', label: 'Future House — NCS', videoId: 'wpH46hSjxkU' },
  { icon: '🌊', label: 'Deep House — 2h Underground Mix', videoId: 'RVHLyLIAbyU' },
  { icon: '💪', label: 'Workout Music 2025 — EDM Fitness', videoId: 'neAGV0RMFV8' },
  { icon: '🏃', label: 'Running Mix 160 BPM', videoId: 'lg8Iu16nV7c' },
  { icon: '💃', label: 'Kids Dance Party — The Wiggles', videoId: '3EpyRFfwM4c' },
  { icon: '🧘', label: 'Yoga & Relaxation — 1 heure', videoId: 'WKK84yEBZoo' },
  { icon: '🎤', label: 'Hip-Hop Clean Workout', videoId: 'WJa6ve7vvjI' },
  { icon: '⚡', label: 'EDM Party Club Mix 2025', videoId: 'LoY_vHm2otA' },
  { icon: '🎆', label: 'Tiësto Live @ EDC Las Vegas', videoId: 'wFl_ttYwixk' },
  { icon: '🎻', label: 'Classique Épique — Workout', videoId: 'sl9OmHy6c6o' },
  { icon: '🥁', label: 'Drum & Bass Workout Mix', videoId: 'SYrjZ6voFCY' },
  { icon: '🌍', label: 'Afrobeats Naija Mix', videoId: 'GZOV93NoXSI' },
  { icon: '🔥', label: 'Hardwell — Tomorrowland 2025', videoId: 'b3esC6cJ7RQ' },
  { icon: '⚡', label: 'Martin Garrix — Ultra Miami 2025', videoId: '3-ELBiUkUWc' },
  { icon: '🎵', label: 'David Guetta — Tomorrowland 2025', videoId: 'cus3nFOjXb0' },
  { icon: '🎧', label: 'Skrillex — Ultra Festival 2025', videoId: 'ni2pGkTPLDo' }
];

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initI18n === 'function') initI18n();
  renderPlaylists();
  renderQuickPlays();
  loadMyPlaylist();

  // Enter key sur les inputs
  document.getElementById('url-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadCustomURL();
  });
  document.getElementById('add-url')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') addToMyPlaylist();
  });
});

// ---- YOUTUBE PLAYER ----
function extractYouTubeId(url) {
  let m = url.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (m) return { type: 'video', id: m[1] };
  m = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (m) return { type: 'video', id: m[1] };
  m = url.match(/embed\/([a-zA-Z0-9_-]{11})/);
  if (m) return { type: 'video', id: m[1] };
  m = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  if (m) return { type: 'playlist', id: m[1] };
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return { type: 'video', id: url };
  return null;
}

function playPlaylist(playlistId, label) {
  const iframe = document.getElementById('yt-iframe');
  const labelEl = document.getElementById('now-playing');
  if (iframe) {
    iframe.src = `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1&rel=0&modestbranding=1`;
  }
  if (labelEl) labelEl.textContent = `${typeof t==='function'?t('player_now_playing'):'\u25b6'} ${label}`;
  document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function playVideo(videoId, label) {
  const iframe = document.getElementById('yt-iframe');
  const labelEl = document.getElementById('now-playing');
  if (iframe) {
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  }
  if (labelEl) labelEl.textContent = `${typeof t==='function'?t('player_now_playing'):'\u25b6'} ${label || (typeof t==='function'?t('player_playing'):'Lecture en cours')}`;
  document.getElementById('player-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function loadCustomURL() {
  const input = document.getElementById('url-input');
  if (!input || !input.value.trim()) return;

  const result = extractYouTubeId(input.value.trim());
  if (!result) {
    input.style.borderColor = '#ff8a80';
    input.placeholder = typeof t==='function'?t('url_invalid'):'\u26a0\ufe0f URL invalide';
    setTimeout(() => {
      input.style.borderColor = '';
      input.placeholder = typeof t==='function'?t('url_placeholder'):'https://youtube.com/watch?v=...';
    }, 2000);
    return;
  }

  if (result.type === 'playlist') {
    playPlaylist(result.id, typeof t==='function'?t('player_custom_playlist'):'Playlist personnalisée');
  } else {
    playVideo(result.id, typeof t==='function'?t('player_custom_video'):'Lecture personnalisée');
  }
  input.value = '';
}

// ---- RENDER PLAYLISTS ----
function renderPlaylists() {
  const grid = document.getElementById('playlists-grid');
  if (!grid) return;

  grid.innerHTML = PLAYLISTS.map(p => `
    <div class="playlist-card" style="--card-accent:${p.accent}" onclick="playPlaylist('${p.playlistId}', '${escapeAttr(p.label)}')">
      <div class="playlist-card-play">▶</div>
      <div class="playlist-card-icon">${p.icon}</div>
      <div class="playlist-card-title">${p.title}</div>
      <div class="playlist-card-mood">${p.mood}</div>
      <div class="playlist-card-desc">${p.desc}</div>
      <div class="playlist-card-tags">
        ${p.tags.map(t => `<span class="playlist-tag">${t}</span>`).join('')}
      </div>
    </div>
  `).join('');
}

// ---- RENDER QUICK PLAYS ----
function renderQuickPlays() {
  const container = document.getElementById('search-links');
  if (!container) return;

  container.innerHTML = QUICK_PLAYS.map((s, i) => `
    <button class="search-link" onclick="playQuick(${i})">
      <span>${s.icon}</span> ${s.label}
    </button>
  `).join('');
}

function playQuick(idx) {
  const s = QUICK_PLAYS[idx];
  if (!s) return;
  playVideo(s.videoId, s.label);
}

function showToast(msg) {
  let toast = document.getElementById('yt-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'yt-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(0,229,255,0.95);color:#111;padding:14px 28px;border-radius:12px;font-family:Bangers,cursive;font-weight:700;font-size:0.95rem;z-index:9999;opacity:0;transition:opacity 0.3s;max-width:90vw;text-align:center;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.style.opacity = '0', 5000);
}

// ---- MA PLAYLIST ----
let myPlaylist = [];

function loadMyPlaylist() {
  try {
    myPlaylist = JSON.parse(localStorage.getItem('zts_my_playlist')) || [];
  } catch { myPlaylist = []; }
  renderMyPlaylist();
}

function saveMyPlaylist() {
  localStorage.setItem('zts_my_playlist', JSON.stringify(myPlaylist));
}

function addToMyPlaylist() {
  const urlInput = document.getElementById('add-url');
  const titleInput = document.getElementById('add-title');
  if (!urlInput?.value.trim()) return;

  const result = extractYouTubeId(urlInput.value.trim());
  if (!result) {
    urlInput.style.borderColor = '#ff8a80';
    setTimeout(() => urlInput.style.borderColor = '', 2000);
    return;
  }

  myPlaylist.push({
    id: result.id,
    type: result.type,
    title: titleInput?.value.trim() || `${typeof t==='function'?t('my_playlist_track'):'Piste'} ${myPlaylist.length + 1}`,
    url: urlInput.value.trim()
  });

  saveMyPlaylist();
  renderMyPlaylist();
  if (urlInput) urlInput.value = '';
  if (titleInput) titleInput.value = '';
}

function removeFromPlaylist(idx) {
  myPlaylist.splice(idx, 1);
  saveMyPlaylist();
  renderMyPlaylist();
}

function playFromMyPlaylist(idx) {
  const track = myPlaylist[idx];
  if (!track) return;
  if (track.type === 'playlist') {
    playPlaylist(track.id, track.title);
  } else {
    playVideo(track.id, track.title);
  }
}

function renderMyPlaylist() {
  const container = document.getElementById('my-playlist');
  if (!container) return;

  if (myPlaylist.length === 0) {
    container.innerHTML = `<p style="color:var(--text-muted);font-size:0.85rem;">${typeof t==='function'?t('my_playlist_empty'):'Aucune piste sauvegardée. Ajoute des URLs YouTube ci-dessus.'}</p>`;
    return;
  }

  container.innerHTML = myPlaylist.map((t, i) => `
    <div class="my-track">
      <span style="font-size:1.1rem;">${t.type === 'playlist' ? '📋' : '🎵'}</span>
      <div class="my-track-title">${escapeHtml(t.title)}</div>
      <button class="my-track-btn" onclick="playFromMyPlaylist(${i})">${typeof t==='function'?t('my_playlist_play'):'\u25b6 Jouer'}</button>
      <button class="my-track-btn delete" onclick="removeFromPlaylist(${i})">✕</button>
    </div>
  `).join('');
}

// ---- UTILS ----
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
