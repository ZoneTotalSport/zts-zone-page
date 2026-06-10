/**
 * Planificateur Camp de jour — app.js
 * Flow : Calendrier → Journee (programme + presences) → retour
 * Sections secondaires : Mon groupe, Journee type, Historique
 */

// ══════════════════════════════════════════════════════════
//  FIREBASE INIT
// ══════════════════════════════════════════════════════════

function waitForFirebase() {
  return new Promise((resolve) => {
    if (typeof firebase !== 'undefined' && firebase.firestore) { resolve(); return; }
    const check = setInterval(() => {
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        clearInterval(check); resolve();
      }
    }, 100);
  });
}

async function loadFirestoreSDK() {
  if (typeof firebase !== 'undefined' && firebase.firestore) return;
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore-compat.js';
    s.onload = resolve;
    s.onerror = () => reject(new Error('Firestore SDK load failed'));
    document.head.appendChild(s);
  });
}

let _db = null;
async function getDb() {
  if (_db) return _db;
  await waitForFirebase();
  await loadFirestoreSDK();
  _db = firebase.firestore();
  try { await _db.enablePersistence({ synchronizeTabs: true }); }
  catch (e) { console.warn('[Planif] Persistence:', e.code); }
  return _db;
}

// ══════════════════════════════════════════════════════════
//  CRUD HELPERS
// ══════════════════════════════════════════════════════════

const Organisations = {
  async create(d) { return (await (await getDb()).collection('organisations').add({ nom:d.nom, coordoUid:d.coordoUid, dateDebut:d.dateDebut||'', dateFin:d.dateFin||'', semaines:d.semaines||[] })).id; },
  async get(id) { const s=await (await getDb()).collection('organisations').doc(id).get(); return s.exists?{id:s.id,...s.data()}:null; },
  async update(id,d) { (await getDb()).collection('organisations').doc(id).update(d); },
};

const Groupes = {
  async create(d) { return (await (await getDb()).collection('groupes').add({ nom:d.nom, orgId:d.orgId, animateurUid:d.animateurUid, theme:d.theme||'' })).id; },
  async get(id) { const s=await (await getDb()).collection('groupes').doc(id).get(); return s.exists?{id:s.id,...s.data()}:null; },
  async listByAnimateur(uid) { const s=await (await getDb()).collection('groupes').where('animateurUid','==',uid).get(); return s.docs.map(d=>({id:d.id,...d.data()})); },
  async update(id,d) { (await getDb()).collection('groupes').doc(id).update(d); },
};

const Enfants = {
  async create(d) { return (await (await getDb()).collection('enfants').add({ prenom:d.prenom, nom:d.nom, photoUrl:d.photoUrl||'', groupeId:d.groupeId, personnesAutorisees:d.personnesAutorisees||[] })).id; },
  async get(id) { const s=await (await getDb()).collection('enfants').doc(id).get(); return s.exists?{id:s.id,...s.data()}:null; },
  async listByGroupe(gid) { const s=await (await getDb()).collection('enfants').where('groupeId','==',gid).get(); return s.docs.map(d=>({id:d.id,...d.data()})); },
  async update(id,d) { (await getDb()).collection('enfants').doc(id).update(d); },
  async delete(id) { (await getDb()).collection('enfants').doc(id).delete(); },
};

const Journees = {
  async create(d) { return (await (await getDb()).collection('journees').add({ date:d.date, groupeId:d.groupeId, blocs:d.blocs||[] })).id; },
  async getByGroupeAndDate(gid, date) {
    const s = await (await getDb()).collection('journees').where('groupeId','==',gid).where('date','==',date).limit(1).get();
    if (s.empty) return null;
    const d = s.docs[0]; return { id:d.id, ...d.data() };
  },
  async get(id) { const s=await (await getDb()).collection('journees').doc(id).get(); return s.exists?{id:s.id,...s.data()}:null; },
  async update(id,d) { (await getDb()).collection('journees').doc(id).update(d); },
};

const Presences = {
  async create(d) {
    return (await (await getDb()).collection('presences').add({
      journeeId:d.journeeId, groupeId:d.groupeId, enfantId:d.enfantId, statut:d.statut,
      heureArrivee:d.heureArrivee||'', heureDepart:d.heureDepart||'',
      partiAvec:d.partiAvec||{nom:'',lien:''}, horsListe:d.horsListe||false,
      date:d.date||'', ts:firebase.firestore.FieldValue.serverTimestamp()
    })).id;
  },
  async listByJournee(jid,gid) { const s=await (await getDb()).collection('presences').where('journeeId','==',jid).where('groupeId','==',gid).orderBy('ts').get(); return s.docs.map(d=>({id:d.id,...d.data()})); },
  async listByEnfant(eid,gid) { const s=await (await getDb()).collection('presences').where('enfantId','==',eid).where('groupeId','==',gid).orderBy('ts').get(); return s.docs.map(d=>({id:d.id,...d.data()})); },
  async update(id,d) { (await getDb()).collection('presences').doc(id).update(d); },
  async delete(id) { (await getDb()).collection('presences').doc(id).delete(); },
};

const GrillesType = {
  async getByGroupe(gid) { const s=await (await getDb()).collection('grillesType').where('groupeId','==',gid).limit(1).get(); if(s.empty)return null; const d=s.docs[0]; return {id:d.id,...d.data()}; },
  async create(d) { return (await (await getDb()).collection('grillesType').add({ groupeId:d.groupeId, blocs:d.blocs||[] })).id; },
  async update(id,d) { (await getDb()).collection('grillesType').doc(id).update(d); },
};

// ══════════════════════════════════════════════════════════
//  CONSTANTS + STATE
// ══════════════════════════════════════════════════════════

const LS = { groupeId:'planif_groupeId', orgId:'planif_orgId' };
const LIENS = ['mere','pere','grand-mere','grand-pere','gardien(ne)','autre'];
const LIEN_LABELS = { mere:'Mere', pere:'Pere', 'grand-mere':'Grand-mere', 'grand-pere':'Grand-pere', 'gardien(ne)':'Gardien(ne)', autre:'Autre' };

const BLOC_TYPES = {
  garde:      { label:'Garde',      icon:'\u{1F6E1}\uFE0F', color:'#4caf50' },
  activite:   { label:'Activite',   icon:'\u{1F3AF}',       color:'#ff6b00' },
  sortie:     { label:'Sortie',     icon:'\u{1F68C}',       color:'#2196f3' },
  repas:      { label:'Repas',      icon:'\u{1F37D}\uFE0F', color:'#ffc107' },
  recre:      { label:'Recreation', icon:'\u{1F3C3}',       color:'#8bc34a' },
  transition: { label:'Transition', icon:'\u27A1\uFE0F',    color:'#9e9e9e' },
};

const BLOC_FONTS = [
  {id:'default',   label:'Standard',       css:'Fredoka, sans-serif'},
  {id:'luckiest',  label:'Luckiest Guy',   css:"'Luckiest Guy', cursive"},
  {id:'bangers',   label:'Bangers',        css:"'Bangers', cursive"},
  {id:'caveat',    label:'Caveat',         css:"'Caveat', cursive"},
  {id:'quicksand', label:'Quicksand',      css:"'Quicksand', sans-serif"},
];

const BLOC_COLORS = [
  {id:'default', label:'Auto',    hex:''},
  {id:'orange',  label:'Orange',  hex:'#ff6b00'},
  {id:'bleu',    label:'Bleu',    hex:'#2196f3'},
  {id:'vert',    label:'Vert',    hex:'#4caf50'},
  {id:'violet',  label:'Violet',  hex:'#9c27b0'},
  {id:'rose',    label:'Rose',    hex:'#e91e63'},
  {id:'jaune',   label:'Jaune',   hex:'#ffc107'},
  {id:'cyan',    label:'Cyan',    hex:'#00bcd4'},
  {id:'rouge',   label:'Rouge',   hex:'#f44336'},
  {id:'noir',    label:'Noir',    hex:'#212121'},
];

const state = {
  user: null, orgId: null, groupeId: null, groupe: null, org: null,
  enfants: [],
  // Navigation
  view: 'journee', // journee | semaine | calendrier | roster | gabarit | historique | live
  liveCompleted: new Set(),
  liveTimer: null,
  // Calendar
  calYear: new Date().getFullYear(),
  calMonth: new Date().getMonth(),
  // Semaine (lun-ven, lecture seule)
  weekStart: null, weekData: [],
  // Day
  currentDate: todayISO(),
  journeeId: null, journeeBlocs: [], presenceMap: {},
  // Modals state
  editingEnfant: null, departEnfant: null, departPresence: null,
  editingBloc: null, editingBlocContext: null,
  // History
  historyEnfantId: null, historyData: [],
  // Gabarit
  grilleType: null,
  // Calendar data
  calDatesWithBlocs: new Set(),
};

// ══════════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════════

function todayISO() {
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function nowTime() {
  const d = new Date();
  return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0');
}
function formatDateFR(iso) {
  if (!iso) return '';
  const m = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
  const [y,mo,d] = iso.split('-').map(Number);
  return d+' '+m[mo-1]+' '+y;
}
function formatDateShort(iso) {
  if (!iso) return '';
  const jours = ['dim','lun','mar','mer','jeu','ven','sam'];
  const dt = new Date(iso+'T12:00:00');
  return jours[dt.getDay()]+' '+dt.getDate()+' '+['jan','fev','mar','avr','mai','juin','juil','aout','sep','oct','nov','dec'][dt.getMonth()];
}
function formatDateLong(iso) {
  if (!iso) return '';
  const jours = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  const mois = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
  const dt = new Date(iso+'T12:00:00');
  return jours[dt.getDay()]+' '+dt.getDate()+' '+mois[dt.getMonth()];
}
function shiftDate(iso, delta) {
  const d = new Date(iso+'T12:00:00');
  d.setDate(d.getDate()+delta);
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function esc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }
function initials(p,n) { return (p?.[0]||'?')+(n?.[0]||''); }
function blocId() { return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

function resizePhoto(file, maxSize=400) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        let w=img.width, h=img.height;
        if (w>h) { if(w>maxSize){h=h*maxSize/w;w=maxSize;} } else { if(h>maxSize){w=w*maxSize/h;h=maxSize;} }
        c.width=w; c.height=h;
        c.getContext('2d').drawImage(img,0,0,w,h);
        resolve(c.toDataURL('image/jpeg',0.7));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function avatarHTML(enfant, cls='') {
  const sm = cls.includes('sm');
  if (enfant.photoUrl) return `<img src="${esc(enfant.photoUrl)}" class="p-photo ${sm?'p-photo-sm':''} ${cls}" alt="${esc(enfant.prenom)}">`;
  return `<div class="p-initials ${sm?'p-initials-sm':''} ${cls}">${esc(initials(enfant.prenom,enfant.nom))}</div>`;
}

// ══════════════════════════════════════════════════════════
//  RENDERING
// ══════════════════════════════════════════════════════════

function renderNoAuth() {
  return `<div class="p-empty"><div class="p-empty-icon">\u{1F510}</div>
    <div class="p-empty-text">Connecte-toi pour acceder au planificateur.</div></div>`;
}

function renderSetup() {
  return `<div class="p-welcome">
    <h2>Bienvenue!</h2>
    <p>Cree ton premier groupe pour commencer.</p>
    <div class="p-card">
      <div class="p-field"><label class="p-label">Nom de l'organisation</label>
        <input class="p-input" id="setup-org" placeholder="Camp Soleil" required></div>
      <div class="p-field"><label class="p-label">Nom du groupe</label>
        <input class="p-input" id="setup-groupe" placeholder="Les Dauphins" required></div>
      <div class="p-field"><label class="p-label">Theme (optionnel)</label>
        <input class="p-input" id="setup-theme" placeholder="Aventure"></div>
      <button class="zts-btn zts-btn--primary" data-action="save-setup" style="width:100%;margin-top:var(--space-3)">Creer mon groupe</button>
    </div>
  </div>`;
}

// ── Group bar + secondary nav ──

function renderGroupBar() {
  const g = state.groupe;
  return `<div class="p-group-bar">
    <div>
      <span class="p-group-name">${esc(g.nom)}</span>
      ${g.theme ? `<span class="p-group-theme"> \u00B7 ${esc(g.theme)}</span>` : ''}
      <span class="p-group-theme"> \u00B7 ${state.enfants.length} enfant(s)</span>
    </div>
    <button class="zts-btn" data-action="edit-groupe" style="font-size:var(--fs-1)">\u2699</button>
  </div>
  <div class="p-nav">
    <button class="p-nav-btn ${state.view==='calendrier'?'active':''}" data-action="nav" data-to="calendrier">\u{1F4C5} Calendrier</button>
    <button class="p-nav-btn ${state.view==='roster'?'active':''}" data-action="nav" data-to="roster">\u{1F465} Mon groupe</button>
    <button class="p-nav-btn ${state.view==='gabarit'?'active':''}" data-action="nav" data-to="gabarit">\u{1F4D0} Journee type</button>
    <button class="p-nav-btn ${state.view==='historique'?'active':''}" data-action="nav" data-to="historique">\u{1F4CA} Historique</button>
  </div>`;
}

function renderMain() {
  let content = '';
  switch (state.view) {
    case 'calendrier': content = renderCalendrier(); break;
    case 'semaine':    content = renderSemaine(); break;
    case 'journee':    content = renderJournee(); break;
    case 'live':       return renderLive();
    case 'roster':     content = renderRoster(); break;
    case 'gabarit':    content = renderGabarit(); break;
    case 'historique': content = renderHistorique(); break;
  }
  // Toggle Jour/Semaine/Mois injecte ici uniquement (vue Jour/Calendrier intouchees)
  const calFamily = ['journee','semaine','calendrier'].includes(state.view);
  const toggle = calFamily ? renderCalToggle(state.view) : '';
  return renderGroupBar() + toggle + content;
}

// ══════════════════════════════════════════════════════════
//  CALENDRIER (vue par defaut)
// ══════════════════════════════════════════════════════════

function renderCalendrier() {
  const y = state.calYear, m = state.calMonth;
  const mNames = ['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'];
  const dNames = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
  const firstDow = new Date(y,m,1).getDay();
  const offset = firstDow;
  const days = new Date(y,m+1,0).getDate();
  const today = todayISO();

  let cells = dNames.map(d => `<div class="p-cal-header">${d}</div>`).join('');
  for (let i=0; i<offset; i++) cells += '<div class="p-cal-day p-cal-day--empty"></div>';
  for (let d=1; d<=days; d++) {
    const iso = y+'-'+String(m+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    const dow = new Date(y,m,d).getDay();
    const isWE = dow===0||dow===6;
    const isToday = iso===today;
    const hasBlocs = !isWE && !isToday && state.calDatesWithBlocs.has(iso);
    cells += `<div class="p-cal-day ${isToday?'p-cal-day--today':''} ${isWE?'p-cal-day--weekend':''} ${hasBlocs?'p-cal-day--has-blocs':''}"
      ${isWE?'':'data-action="select-date" data-date="'+iso+'"'}>${d}</div>`;
  }

  return `<div class="p-date-nav" style="margin-bottom:var(--space-4)">
    <button class="p-day-nav-btn" data-action="prev-month">\u25C0</button>
    <span class="p-day-title" style="text-align:center">${mNames[m]} ${y}</span>
    <button class="p-day-nav-btn" data-action="next-month">\u25B6</button>
  </div>
  <div class="p-cal-grid">${cells}</div>
  <div style="text-align:center">
    <button class="zts-btn zts-btn--primary" data-action="select-date" data-date="${today}">Aujourd'hui</button>
  </div>`;
}

// ══════════════════════════════════════════════════════════
//  CALENDRIER UNIFIE — Toggle Jour/Semaine/Mois + vue Semaine
//  (lecture seule : aucune ecriture Firestore ici)
// ══════════════════════════════════════════════════════════

function renderCalToggle(view) {
  const cur = view==='journee' ? 'jour' : view==='semaine' ? 'semaine' : 'mois';
  const tab = (mode,label) => `<button class="zts-vue-tab ${cur===mode?'zts-vue-tab--active':''}" data-action="cal-mode" data-mode="${mode}">${label}</button>`;
  return `<div class="zts-vue-toggle">
    ${tab('jour','\u{1F4C5} Jour')}
    ${tab('semaine','\u{1F5D3}️ Semaine')}
    ${tab('mois','\u{1F4C6} Mois')}
  </div>`;
}

function mondayOf(iso) {
  const d = new Date(iso+'T12:00:00');
  const wd = d.getDay();                 // 0=dim..6=sam
  d.setDate(d.getDate() + (wd===0 ? -6 : 1-wd));
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}

async function loadWeekData() {
  const start = state.weekStart || mondayOf(todayISO());
  state.weekStart = start;
  const dates = [0,1,2,3,4].map(i=>shiftDate(start,i)); // lun-ven
  const byDate = {};
  if (state.groupeId) {
    try {
      const db = await getDb();
      const snap = await db.collection('journees')
        .where('groupeId','==',state.groupeId)
        .where('date','>=',dates[0])
        .where('date','<=',dates[4])
        .get();
      snap.docs.forEach(d=>{const data=d.data(); byDate[data.date]=(data.blocs||[]).slice().sort((a,b)=>a.ordre-b.ordre);});
    } catch(e) { console.warn('[Planif] loadWeekData:', e.message); }
  }
  state.weekData = dates.map(dt=>({date:dt, blocs:byDate[dt]||[]}));
}

function renderSemaineMiniBloc(bloc, date) {
  const t = BLOC_TYPES[bloc.type] || BLOC_TYPES.activite;
  const blocColor = (bloc.customColor && bloc.customColor!=='default') ? (BLOC_COLORS.find(c=>c.id===bloc.customColor)?.hex||t.color) : t.color;
  const times = (bloc.debut||bloc.fin) ? `<span class="zts-vue-mini-times">${bloc.debut||'?'}–${bloc.fin||'?'}</span>` : '';
  return `<div class="zts-vue-mini-bloc" data-action="select-date" data-date="${date}" style="border-left-color:${blocColor}">
    <span class="zts-vue-mini-ic">${t.icon}</span>
    <span class="zts-vue-mini-titre">${esc(bloc.titre||t.label)}</span>
    ${times}
  </div>`;
}

function renderSemaine() {
  const days = state.weekData || [];
  const today = todayISO();
  const first = days[0]?.date, last = days[days.length-1]?.date;
  const label = (first&&last) ? `Semaine du ${formatDateFR(first)} au ${formatDateFR(last)}` : 'Semaine';
  const dowNames = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];

  let html = `<div class="p-date-nav" style="margin-bottom:var(--space-4)">
    <button class="p-day-nav-btn" data-action="prev-week">◀</button>
    <span class="p-day-title" style="text-align:center">${label}</span>
    <button class="p-day-nav-btn" data-action="next-week">▶</button>
  </div>
  <div class="zts-vue-week-grid">`;

  days.forEach(d => {
    const dt = new Date(d.date+'T12:00:00');
    const isToday = d.date===today;
    const blocs = d.blocs||[];
    html += `<div class="zts-vue-week-col ${isToday?'zts-vue-week-col--today':''}">
      <div class="zts-vue-week-head" data-action="select-date" data-date="${d.date}">
        <span class="zts-vue-week-dow">${dowNames[dt.getDay()]}</span>
        <span class="zts-vue-week-num">${dt.getDate()}</span>
      </div>`;
    html += blocs.length
      ? blocs.map(b=>renderSemaineMiniBloc(b,d.date)).join('')
      : `<div class="zts-vue-week-empty" data-action="select-date" data-date="${d.date}">+ Planifier</div>`;
    html += `</div>`;
  });

  html += `</div>`;
  return html;
}

// ══════════════════════════════════════════════════════════
//  JOURNEE (programme + presences sur une page)
// ══════════════════════════════════════════════════════════

function renderJournee() {
  const isToday = state.currentDate === todayISO();
  const dateLabel = isToday ? "Aujourd'hui" : formatDateLong(state.currentDate);
  const blocs = [...state.journeeBlocs].sort((a,b) => a.ordre - b.ordre);

  // Header centre
  let html = `<div class="p-day-header">
    <span class="p-day-back" data-action="nav" data-to="calendrier">\u2190 Calendrier</span>
    <div class="p-day-main-title" data-action="nav" data-to="calendrier">Planificateur quotidien</div>
    <div class="p-day-title-row">
      <button class="p-day-nav-btn" data-action="prev-date">\u25C0</button>
      <span class="p-day-title" data-action="nav" data-to="calendrier">${dateLabel}</span>
      <button class="p-day-nav-btn" data-action="next-date">\u25B6</button>
    </div>
  </div>`;

  // ── Section Programme ──
  html += `<div class="p-section-title">\u{1F4C5} Programme</div>`;
  if (blocs.length) {
    html += `<div class="p-timeline">${blocs.map((b,i) => renderBlocCard(b,'journee',i,blocs.length)).join('')}</div>`;
  } else {
    html += `<div style="text-align:center;padding:var(--space-3);opacity:.5;font-family:var(--font-fun)">Aucun bloc planifie pour cette journee.</div>`;
  }
  html += `<div class="p-bloc-add" style="gap:var(--space-2);display:flex;flex-wrap:wrap;justify-content:center">
    <button class="zts-btn" data-action="add-bloc" data-context="journee" style="font-size:var(--fs-1)">+ Ajouter un bloc</button>
    ${blocs.length?`<button class="zts-btn zts-btn--primary" data-action="start-live" style="font-size:var(--fs-1)">\u25B6 Planif en direct</button>`:''}
  </div>`;

  // ── Section Presences ──
  html += `<div class="p-section-title">\u{1F4CB} Presences</div>`;
  html += renderPresencesSection();

  return html;
}

// ══════════════════════════════════════════════════════════
//  MODE LIVE — Presentation de la journee
// ══════════════════════════════════════════════════════════

function playDoneSound() {
  try {
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 arpege
    notes.forEach((freq,i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + i*0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i*0.15 + 0.4);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i*0.15);
      osc.stop(ctx.currentTime + i*0.15 + 0.5);
    });
  } catch(e) {}
}

function getCurrentBlocIndex(blocs) {
  const now = nowTime();
  for (let i=0; i<blocs.length; i++) {
    if (state.liveCompleted.has(blocs[i].id)) continue;
    if (blocs[i].debut && blocs[i].fin) {
      if (now >= blocs[i].debut && now <= blocs[i].fin) return i;
    }
  }
  // Si aucun match par heure, retourner le premier non-complete
  for (let i=0; i<blocs.length; i++) {
    if (!state.liveCompleted.has(blocs[i].id)) return i;
  }
  return -1;
}

function checkBlocTimers(blocs) {
  const now = nowTime();
  blocs.forEach(b => {
    if (state.liveCompleted.has(b.id)) return;
    if (b.fin && now > b.fin && b.debut && now > b.debut) {
      state.liveCompleted.add(b.id);
      playDoneSound();
      render();
    }
  });
}

function renderLive() {
  const dateLabel = formatDateLong(state.currentDate);
  const blocs = [...state.journeeBlocs].sort((a,b) => a.ordre - b.ordre);
  const currentIdx = getCurrentBlocIndex(blocs);
  const now = nowTime();

  let html = `<div class="p-live">
    <div class="p-live-header">
      <button class="zts-btn" data-action="stop-live" style="font-size:var(--fs-1)">\u2190 Quitter</button>
      <div class="p-live-title">Planif en direct</div>
      <div class="p-live-date">${dateLabel}</div>
      <div class="p-live-clock" id="live-clock">${now}</div>
    </div>
    <div class="p-live-timeline">`;

  blocs.forEach((b,i) => {
    const t = BLOC_TYPES[b.type] || BLOC_TYPES.activite;
    const blocColor = (b.customColor && b.customColor!=='default') ? (BLOC_COLORS.find(c=>c.id===b.customColor)?.hex||t.color) : t.color;
    const fontCSS = (b.font && b.font!=='default') ? (BLOC_FONTS.find(f=>f.id===b.font)?.css||'') : '';
    const isDone = state.liveCompleted.has(b.id);
    const isCurrent = i === currentIdx;
    const cls = isDone ? 'p-live-bloc p-live-bloc--done' : (isCurrent ? 'p-live-bloc p-live-bloc--active' : 'p-live-bloc');

    // Attachments liens
    const attachLinks = (b.attachments&&b.attachments.length) ?
      `<div class="p-bloc-attachments">${b.attachments.map((a,ai)=>
        `<span class="p-bloc-attach" data-action="view-attachment" data-bloc-id="${b.id}" data-context="journee" data-idx="${ai}">${attachIcon(a.type)} ${esc(a.name)}</span>`
      ).join('')}</div>` : '';

    html += `<div class="${cls}" style="border-left:6px solid ${blocColor}">
      <div class="p-live-bloc-head">
        <span class="p-bloc-type" style="background:${blocColor}">${t.icon} ${t.label}</span>
        <span class="p-live-bloc-titre" ${fontCSS?'style="font-family:'+fontCSS+'"':''}>${esc(b.titre||'')}</span>
        ${isDone?'<span class="p-live-done-badge">\u2705</span>':'<button class="p-live-check" data-action="live-complete" data-bloc-id="'+b.id+'" title="Marquer termine">\u2714</button>'}
      </div>
      ${(b.debut||b.fin)?`<div class="p-live-bloc-time">${b.debut||'?'} \u2192 ${b.fin||'?'}</div>`:''}
      ${b.notes?`<div class="p-live-bloc-notes" ${fontCSS?'style="font-family:'+fontCSS+'"':''}>${esc(b.notes)}</div>`:''}
      ${b.type==='sortie'&&b.lieu?`<div class="p-live-bloc-notes">\u{1F4CD} ${esc(b.lieu)}</div>`:''}
      ${attachLinks}
    </div>`;
  });

  html += `</div></div>`;

  // Demarrer le timer si pas deja actif
  if (!state.liveTimer) {
    state.liveTimer = setInterval(() => {
      if (state.view !== 'live') { clearInterval(state.liveTimer); state.liveTimer=null; return; }
      const clockEl = document.getElementById('live-clock');
      if (clockEl) clockEl.textContent = nowTime();
      checkBlocTimers([...state.journeeBlocs].sort((a,b) => a.ordre - b.ordre));
    }, 5000);
  }

  return html;
}

function renderPresencesSection() {
  if (!state.enfants.length) {
    return `<div style="text-align:center;padding:var(--space-3);opacity:.5;font-family:var(--font-fun)">
      Ajoute des enfants dans <em>Mon groupe</em> d'abord.</div>`;
  }

  const counts = { attendu:0, present:0, parti:0, absent:0 };
  const cards = state.enfants.map(e => {
    const p = state.presenceMap[e.id];
    const s = p ? p.statut : 'attendu';
    counts[s]++;
    return renderPresenceCard(e, p, s);
  }).join('');

  return `<div class="p-summary">
      <span class="p-summary-item" style="background:var(--vert)">${counts.present} present(s)</span>
      <span class="p-summary-item">${counts.attendu} attendu(s)</span>
      <span class="p-summary-item" style="background:#e0e0e0">${counts.parti} parti(s)</span>
      ${counts.absent ? `<span class="p-summary-item" style="background:var(--rose);color:#fff">${counts.absent} absent(s)</span>` : ''}
    </div>
    <div style="text-align:center;margin-bottom:var(--space-2);font-family:var(--font-body);font-size:var(--fs-1);opacity:.5">
      Tap = present \u00B7 Appui long = absent
    </div>
    <div class="p-presence-grid">${cards}</div>`;
}

function renderPresenceCard(enfant, presence, status) {
  let badge='', time='';
  if (status==='present') {
    badge=`<span class="p-pcard-badge p-badge-present">\u2713</span>`;
    time=`<div class="p-pcard-time" style="color:var(--vert)">\u2193 ${presence.heureArrivee}</div>`;
  } else if (status==='parti') {
    badge=`<span class="p-pcard-badge p-badge-parti">\u2191</span>`;
    time=`<div class="p-pcard-time">\u2191 ${presence.heureDepart}</div>`;
    if (presence.partiAvec?.nom) time+=`<div class="p-pcard-time" style="opacity:.7">${esc(presence.partiAvec.nom)}</div>`;
    if (presence.horsListe) badge=`<span class="p-pcard-badge p-badge-flag">\u26A0</span>`;
  } else if (status==='absent') {
    badge=`<span class="p-pcard-badge p-badge-absent">\u2717</span>`;
  }
  return `<div class="p-pcard p-pcard--${status}" data-action="tap-presence" data-id="${enfant.id}">
    ${badge}${avatarHTML(enfant)}
    <div class="p-enfant-name" style="font-size:var(--fs-1)">${esc(enfant.prenom)}</div>
    ${time}
  </div>`;
}

// ── Bloc card (shared journee + gabarit) ──

function renderBlocCard(bloc, context, index, total) {
  const t = BLOC_TYPES[bloc.type] || BLOC_TYPES.activite;
  const blocColor = (bloc.customColor && bloc.customColor!=='default') ? (BLOC_COLORS.find(c=>c.id===bloc.customColor)?.hex||t.color) : t.color;
  const fontCSS = (bloc.font && bloc.font!=='default') ? (BLOC_FONTS.find(f=>f.id===bloc.font)?.css||'') : '';
  let detail = '';
  if (bloc.type==='garde') {
    detail = `<div class="p-bloc-detail">Plage : ${bloc.plage==='matin'?'Matin':'Soir'}</div>`;
  } else if (bloc.type==='sortie' && bloc.lieu) {
    detail = `<div class="p-bloc-detail">\u{1F4CD} ${esc(bloc.lieu)}</div>`;
  }
  const notesHTML = bloc.notes ? `<div class="p-bloc-notes" ${fontCSS?'style="font-family:'+fontCSS+'"':''}>${esc(bloc.notes)}</div>` : '';
  const attachHTML = (bloc.attachments&&bloc.attachments.length) ?
    `<div class="p-bloc-attachments">${bloc.attachments.map((a,i)=>
      `<span class="p-bloc-attach" data-action="view-attachment" data-bloc-id="${bloc.id}" data-context="${context}" data-idx="${i}">${attachIcon(a.type)} ${esc(a.name)}</span>`
    ).join('')}</div>` : '';
  return `<div class="p-bloc" data-bloc-id="${bloc.id}" style="border-color:${blocColor}">
    <div class="p-bloc-color" style="background:${blocColor}"></div>
    <div class="p-bloc-body" ${fontCSS?'style="font-family:'+fontCSS+'"':''}>
      <div class="p-bloc-header">
        <span class="p-bloc-type" style="background:${blocColor}">${t.icon} ${t.label}</span>
        <span class="p-bloc-titre">${esc(bloc.titre||'')}</span>
      </div>
      ${(bloc.debut||bloc.fin)?`<div class="p-bloc-times">${bloc.debut||'?'} \u2192 ${bloc.fin||'?'}</div>`:''}
      ${detail}
      ${notesHTML}
      ${attachHTML}
    </div>
    <div class="p-bloc-actions">
      ${index>0?`<button class="p-bloc-btn" data-action="move-bloc-up" data-bloc-id="${bloc.id}" data-context="${context}">\u2191</button>`:'<div style="width:36px;height:36px"></div>'}
      <button class="p-bloc-btn" data-action="edit-bloc" data-bloc-id="${bloc.id}" data-context="${context}">\u270F\uFE0F</button>
      ${index<total-1?`<button class="p-bloc-btn" data-action="move-bloc-down" data-bloc-id="${bloc.id}" data-context="${context}">\u2193</button>`:'<div style="width:36px;height:36px"></div>'}
      <button class="p-bloc-btn p-bloc-btn--danger" data-action="delete-bloc" data-bloc-id="${bloc.id}" data-context="${context}">\u{1F5D1}</button>
    </div>
  </div>`;
}

// ══════════════════════════════════════════════════════════
//  ROSTER (Mon groupe)
// ══════════════════════════════════════════════════════════

function renderRoster() {
  if (!state.enfants.length) {
    return `<div class="p-empty"><div class="p-empty-icon">\u{1F466}</div>
      <div class="p-empty-text">Aucun enfant dans le groupe.</div></div>
      <div style="text-align:center;margin-top:var(--space-3)">
        <button class="zts-btn zts-btn--primary" data-action="add-enfant">+ Ajouter un enfant</button>
      </div>`;
  }
  return `<div class="p-enfants-grid">${state.enfants.map(e => `
    <div class="p-enfant-card" data-action="edit-enfant" data-id="${e.id}">
      ${avatarHTML(e)}
      <div class="p-enfant-name">${esc(e.prenom)} ${esc(e.nom)}</div>
      <div class="p-enfant-sub">${(e.personnesAutorisees||[]).length} autorise(s)</div>
    </div>`).join('')}</div>
    <div style="text-align:center">
      <button class="zts-btn zts-btn--primary" data-action="add-enfant">+ Ajouter un enfant</button>
    </div>`;
}

// ══════════════════════════════════════════════════════════
//  GABARIT (Journee type)
// ══════════════════════════════════════════════════════════

function renderGabarit() {
  const gt = state.grilleType;
  const blocs = gt ? [...gt.blocs].sort((a,b) => a.ordre-b.ordre) : [];

  let header = `<div class="p-gabarit-header">
    <div><span class="p-group-name">\u{1F4D0} Journee type</span>
      <span class="p-group-theme"> \u00B7 ${blocs.length} bloc(s)</span></div>
    ${blocs.length ? `<button class="zts-btn zts-btn--primary" data-action="appliquer-gabarit">Appliquer au calendrier</button>` : ''}
  </div>`;

  let content = '';
  if (blocs.length) {
    content = `<div class="p-timeline">${blocs.map((b,i) => renderBlocCard(b,'gabarit',i,blocs.length)).join('')}</div>`;
  } else {
    content = `<div style="text-align:center;padding:var(--space-4);opacity:.5;font-family:var(--font-fun)">Cree une journee type pour pouvoir l'appliquer a ton calendrier.</div>`;
  }

  return header + content + `<div class="p-bloc-add"><button class="zts-btn zts-btn--primary" data-action="add-bloc" data-context="gabarit">+ Ajouter un bloc</button></div>`;
}

// ══════════════════════════════════════════════════════════
//  HISTORIQUE
// ══════════════════════════════════════════════════════════

function renderHistorique() {
  const opts = state.enfants.map(e =>
    `<option value="${e.id}" ${state.historyEnfantId===e.id?'selected':''}>${esc(e.prenom)} ${esc(e.nom)}</option>`
  ).join('');

  let list = '';
  if (state.historyEnfantId && state.historyData.length) {
    list = state.historyData.map(p => {
      let detail = '';
      if (p.statut==='present') detail=`Present \u00B7 Arrivee ${p.heureArrivee||'\u2014'}`;
      else if (p.statut==='parti') {
        detail = `Parti a ${p.heureDepart||'\u2014'}`;
        if (p.partiAvec?.nom) detail+=` avec ${esc(p.partiAvec.nom)} (${p.partiAvec.lien||'\u2014'})`;
        if (p.horsListe) detail+=` <span class="p-history-flag">Hors liste</span>`;
      } else if (p.statut==='absent') detail='Absent';
      return `<div class="p-history-item">
        <div class="p-history-date">${formatDateFR(p.date||'')}</div>
        <div class="p-history-detail">${detail}</div>
      </div>`;
    }).join('');
  } else if (state.historyEnfantId) {
    list = `<div class="p-empty"><div class="p-empty-text">Aucune donnee.</div></div>`;
  }

  return `<div class="p-field">
    <label class="p-label">Choisir un enfant</label>
    <select class="p-input" data-action="select-history-enfant">
      <option value="">\u2014 Selectionner \u2014</option>${opts}
    </select>
  </div>
  <div id="history-list">${list}</div>`;
}

// ══════════════════════════════════════════════════════════
//  MODALS
// ══════════════════════════════════════════════════════════

function openModal(id) { const m=document.getElementById(id); if(m){m.classList.add('open');m.setAttribute('aria-hidden','false');} }
function closeModal(id) { const m=document.getElementById(id); if(m){m.classList.remove('open');m.setAttribute('aria-hidden','true');} }

// ── Enfant ──

let _enfantPhotoData = '';

function openEnfantModal(enfant) {
  state.editingEnfant = enfant||null;
  _enfantPhotoData = enfant?.photoUrl||'';
  const isEdit = !!enfant;
  const autorises = enfant?.personnesAutorisees||[{nom:'',lien:'mere'}];
  const inner = document.getElementById('modal-enfant-inner');
  inner.innerHTML = `
    <button class="zts-modal__close" data-action="close-enfant">\u2715</button>
    <h2 class="zts-modal__title">${isEdit?'Modifier':'Ajouter'} un enfant</h2>
    <div class="p-photo-upload">
      <div class="p-photo-preview" data-action="trigger-photo">${_enfantPhotoData?`<img src="${_enfantPhotoData}" alt="Photo">`:'\u{1F4F7}'}</div>
      <input type="file" accept="image/*" id="photo-file-input" hidden>
      <div style="font-family:var(--font-body);font-size:var(--fs-1);opacity:.6">Tap pour ajouter une photo</div>
    </div>
    <div class="p-field"><label class="p-label">Prenom</label>
      <input class="p-input" id="enf-prenom" value="${esc(enfant?.prenom||'')}" placeholder="Prenom" required></div>
    <div class="p-field"><label class="p-label">Nom</label>
      <input class="p-input" id="enf-nom" value="${esc(enfant?.nom||'')}" placeholder="Nom" required></div>
    <div class="p-field"><label class="p-label">Personnes autorisees</label>
      <div id="autorises-list">${autorises.map((a,i)=>autoriseRowHTML(a,i)).join('')}</div>
      <button class="zts-btn" data-action="add-autorise" style="font-size:var(--fs-1);margin-top:8px">+ Ajouter</button>
    </div>
    <div class="p-modal-actions">
      <button class="zts-btn zts-btn--primary" data-action="save-enfant" style="flex:1">Sauvegarder</button>
      ${isEdit?`<button class="zts-btn" data-action="delete-enfant" style="background:var(--rose);color:#fff">Supprimer</button>`:''}
    </div>`;
  const fi = document.getElementById('photo-file-input');
  inner.querySelector('[data-action="trigger-photo"]').addEventListener('click',()=>fi.click());
  fi.addEventListener('change',async(e)=>{const f=e.target.files[0];if(!f)return;_enfantPhotoData=await resizePhoto(f);inner.querySelector('.p-photo-preview').innerHTML=`<img src="${_enfantPhotoData}" alt="Photo">`;});
  openModal('modal-enfant');
}

function autoriseRowHTML(a,idx) {
  const opts = LIENS.map(l=>`<option value="${l}" ${a.lien===l?'selected':''}>${LIEN_LABELS[l]||l}</option>`).join('');
  return `<div class="p-autorise-row" data-idx="${idx}">
    <input class="p-input" placeholder="Nom" value="${esc(a.nom||'')}" data-field="autorise-nom">
    <select class="p-select" style="width:auto;min-width:100px" data-field="autorise-lien">${opts}</select>
    <button class="p-autorise-remove" data-action="remove-autorise" data-idx="${idx}">\u2715</button>
  </div>`;
}

function collectAutorises() {
  const r=[];
  document.querySelectorAll('#autorises-list .p-autorise-row').forEach(row=>{
    const nom=row.querySelector('[data-field="autorise-nom"]').value.trim();
    const lien=row.querySelector('[data-field="autorise-lien"]').value;
    if(nom)r.push({nom,lien});
  });
  return r;
}

async function handleSaveEnfant() {
  const prenom=document.getElementById('enf-prenom').value.trim();
  const nom=document.getElementById('enf-nom').value.trim();
  if(!prenom||!nom) return alert('Prenom et nom requis.');
  const data={prenom,nom,photoUrl:_enfantPhotoData,groupeId:state.groupeId,personnesAutorisees:collectAutorises()};
  if(state.editingEnfant) await Enfants.update(state.editingEnfant.id,data);
  else await Enfants.create(data);
  closeModal('modal-enfant');
  await loadGroupeData(); render();
}

async function handleDeleteEnfant() {
  if(!state.editingEnfant) return;
  if(!confirm(`Supprimer ${state.editingEnfant.prenom} ${state.editingEnfant.nom}?`)) return;
  await Enfants.delete(state.editingEnfant.id);
  closeModal('modal-enfant');
  await loadGroupeData(); render();
}

// ── Depart ──

let _departSelectedPerson=null, _departCustom='';

function openDepartModal(enfant,presence) {
  state.departEnfant=enfant; state.departPresence=presence;
  _departSelectedPerson=null; _departCustom='';
  const autorises=enfant.personnesAutorisees||[];
  const inner=document.getElementById('modal-depart-inner');
  inner.innerHTML = `
    <button class="zts-modal__close" data-action="close-depart">\u2715</button>
    <h2 class="zts-modal__title">Depart de ${esc(enfant.prenom)}</h2>
    <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4)">
      ${avatarHTML(enfant)}
      <div><div class="p-enfant-name">${esc(enfant.prenom)} ${esc(enfant.nom)}</div>
        <div class="p-enfant-sub">Arrivee: ${presence.heureArrivee||'\u2014'}</div></div>
    </div>
    <div class="p-field"><label class="p-label">Heure de depart</label>
      <input class="p-input" type="time" id="depart-heure" value="${nowTime()}"></div>
    <label class="p-label">Parti avec...</label>
    ${autorises.length?`<div class="p-depart-persons" id="depart-persons">
      ${autorises.map((a,i)=>`<button class="p-depart-person" data-action="select-person" data-idx="${i}" data-nom="${esc(a.nom)}" data-lien="${esc(a.lien)}">${esc(a.nom)} <span style="opacity:.5;font-size:var(--fs-1)">(${a.lien})</span></button>`).join('')}
    </div>`:'<div style="margin-bottom:var(--space-3);opacity:.6;font-family:var(--font-body)">Aucune personne autorisee.</div>'}
    <div class="p-field"><label class="p-label">Autre personne</label>
      <input class="p-input" id="depart-custom" placeholder="Nom de la personne"></div>
    <div class="p-warning" id="depart-warning">
      \u26A0 Cette personne n'est PAS dans la liste des personnes autorisees.
      <label style="display:block;margin-top:8px;cursor:pointer">
        <input type="checkbox" id="depart-confirm-hors"> Je confirme ce depart hors-liste
      </label>
    </div>
    <button class="zts-btn zts-btn--primary" data-action="confirm-depart" style="width:100%;margin-top:var(--space-3)">Confirmer le depart</button>`;
  const ci=document.getElementById('depart-custom');
  ci.addEventListener('input',()=>{_departCustom=ci.value.trim();_departSelectedPerson=null;document.querySelectorAll('#depart-persons .p-depart-person').forEach(b=>b.classList.remove('selected'));updateDepartWarning();});
  openModal('modal-depart');
}

function updateDepartWarning() {
  const w=document.getElementById('depart-warning'), e=state.departEnfant; if(!e)return;
  const a=(e.personnesAutorisees||[]).map(x=>x.nom.toLowerCase()), c=_departCustom.toLowerCase();
  if(_departSelectedPerson) w.classList.remove('show');
  else if(c&&!a.includes(c)) w.classList.add('show');
  else w.classList.remove('show');
}

async function handleConfirmDepart() {
  const h=document.getElementById('depart-heure').value;
  if(!h) return alert('Heure de depart requise.');
  let partiAvec={nom:'',lien:''}, horsListe=false;
  if(_departSelectedPerson) { partiAvec={..._departSelectedPerson}; }
  else if(_departCustom) {
    const e=state.departEnfant, a=(e.personnesAutorisees||[]).map(x=>x.nom.toLowerCase());
    if(!a.includes(_departCustom.toLowerCase())) { horsListe=true; const cb=document.getElementById('depart-confirm-hors'); if(!cb?.checked) return alert('Confirme le depart hors-liste.'); }
    const match=(e.personnesAutorisees||[]).find(x=>x.nom.toLowerCase()===_departCustom.toLowerCase());
    partiAvec={nom:_departCustom,lien:match?.lien||'autre'};
  } else return alert('Selectionne ou entre le nom de la personne.');
  await Presences.update(state.departPresence.id,{statut:'parti',heureDepart:h,partiAvec,horsListe,ts:firebase.firestore.FieldValue.serverTimestamp()});
  state.presenceMap[state.departEnfant.id]={...state.departPresence,statut:'parti',heureDepart:h,partiAvec,horsListe};
  closeModal('modal-depart'); render();
}

// ── Bloc ──

function openBlocModal(bloc,context) {
  state.editingBloc=bloc||null; state.editingBlocContext=context;
  const isEdit=!!bloc, sel=bloc?.type||'activite';
  const inner=document.getElementById('modal-bloc-inner');
  inner.innerHTML = `
    <button class="zts-modal__close" data-action="close-bloc">\u2715</button>
    <h2 class="zts-modal__title">${isEdit?'Modifier':'Ajouter'} un bloc</h2>
    <label class="p-label">Type</label>
    <div class="p-type-grid" id="bloc-type-grid">
      ${Object.entries(BLOC_TYPES).map(([k,t])=>`<div class="p-type-option ${sel===k?'selected':''}" data-action="select-bloc-type" data-type="${k}"><span class="p-type-icon">${t.icon}</span>${t.label}</div>`).join('')}
    </div>
    <div class="p-field"><label class="p-label">Titre</label>
      <input class="p-input" id="bloc-titre" value="${esc(bloc?.titre||'')}" placeholder="Titre du bloc"></div>
    <div style="display:flex;gap:var(--space-2)">
      <div class="p-field" style="flex:1"><label class="p-label">Debut</label>
        <input class="p-input" type="time" id="bloc-debut" value="${bloc?.debut||''}"></div>
      <div class="p-field" style="flex:1"><label class="p-label">Fin</label>
        <input class="p-input" type="time" id="bloc-fin" value="${bloc?.fin||''}"></div>
    </div>
    <div class="p-field"><label class="p-label">Notes</label>
      <textarea class="p-input p-textarea" id="bloc-notes" rows="3" placeholder="Instructions, details, materiel...">${esc(bloc?.notes||'')}</textarea></div>
    <div class="p-field"><label class="p-label">Police</label>
      <div class="p-font-grid" id="bloc-font-grid">
        ${BLOC_FONTS.map(f=>`<div class="p-font-option ${(bloc?.font||'default')===f.id?'selected':''}" data-action="select-bloc-font" data-font="${f.id}" style="font-family:${f.css}">${f.label}</div>`).join('')}
      </div></div>
    <div class="p-field"><label class="p-label">Couleur</label>
      <div class="p-color-grid" id="bloc-color-grid">
        ${BLOC_COLORS.map(c=>`<div class="p-color-option ${(bloc?.customColor||'default')===c.id?'selected':''}" data-action="select-bloc-color" data-color="${c.id}" style="${c.hex?'background:'+c.hex+';color:#fff':''}">${c.hex?'':'Auto'}</div>`).join('')}
      </div></div>
    <div id="bloc-extra-fields">${renderBlocExtraFields(sel,bloc)}</div>
    <div class="p-modal-actions">
      <button class="zts-btn zts-btn--primary" data-action="save-bloc" style="flex:1">Sauvegarder</button>
      ${isEdit?`<button class="zts-btn" data-action="delete-bloc-modal" style="background:var(--rose);color:#fff">Supprimer</button>`:''}
    </div>`;
  openModal('modal-bloc');
}

function renderBlocExtraFields(type,bloc) {
  let html='';
  if(type==='garde') { const p=bloc?.plage||'matin'; html+=`<div class="p-field"><label class="p-label">Plage</label><select class="p-select" id="bloc-plage"><option value="matin" ${p==='matin'?'selected':''}>Matin</option><option value="soir" ${p==='soir'?'selected':''}>Soir</option></select></div>`; }
  if(type==='sortie') html+=`<div class="p-field"><label class="p-label">Lieu</label><input class="p-input" id="bloc-lieu" value="${esc(bloc?.lieu||'')}" placeholder="Parc, piscine..."></div>`;
  // Pieces jointes
  const attachments=bloc?.attachments||[];
  html+=`<div class="p-field"><label class="p-label">Pieces jointes</label>
    <div id="bloc-attachments">${attachments.map((a,i)=>`<div class="p-bloc-attach" style="margin-bottom:4px">${attachIcon(a.type)} ${esc(a.name)} <span data-action="remove-attachment" data-idx="${i}" style="cursor:pointer;color:var(--rose);font-weight:900">&times;</span></div>`).join('')}</div>
    <input type="file" id="bloc-file-input" accept="image/png,image/jpeg,video/mp4,audio/mpeg,audio/mp3,application/pdf" multiple style="margin-top:6px">
  </div>`;
  return html;
}

function attachIcon(mime) {
  if(mime.startsWith('image/')) return '\u{1F5BC}';
  if(mime.startsWith('video/')) return '\u{1F3AC}';
  if(mime.startsWith('audio/')) return '\u{1F3B5}';
  if(mime==='application/pdf') return '\u{1F4C4}';
  return '\u{1F4CE}';
}

function readFileAsDataURL(file) {
  return new Promise((resolve)=>{
    const r=new FileReader();
    r.onload=()=>resolve({name:file.name,type:file.type,data:r.result});
    r.readAsDataURL(file);
  });
}

function getNextOrdre(ctx) {
  const b=ctx==='journee'?state.journeeBlocs:(state.grilleType?.blocs||[]);
  return b.length?Math.max(...b.map(x=>x.ordre))+1:0;
}

async function handleSaveBloc() {
  const type=document.querySelector('#bloc-type-grid .p-type-option.selected')?.dataset.type||'activite';
  const titre=document.getElementById('bloc-titre').value.trim();
  const debut=document.getElementById('bloc-debut').value;
  const fin=document.getElementById('bloc-fin').value;
  const ctx=state.editingBlocContext;
  // Recuperer pieces jointes existantes + nouvelles
  let attachments=[...(state.editingBloc?.attachments||[])];
  // Retirer les suppressions (indices deja filtres via remove-attachment)
  const existingEls=document.querySelectorAll('#bloc-attachments .p-bloc-attach');
  const keepNames=new Set();
  existingEls.forEach(el=>{const spans=el.querySelectorAll('span'); if(spans.length) keepNames.add(el.textContent.replace(/\s*×\s*$/,'').trim());});
  attachments=attachments.filter(a=>{const label=attachIcon(a.type)+' '+a.name; return keepNames.has(label.trim());});
  // Ajouter les nouveaux fichiers
  const fileInput=document.getElementById('bloc-file-input');
  if(fileInput&&fileInput.files.length){
    for(const f of fileInput.files){
      if(f.size>2*1024*1024){alert(f.name+' depasse 2 Mo. Reduis la taille.'); continue;}
      attachments.push(await readFileAsDataURL(f));
    }
  }
  const notes=document.getElementById('bloc-notes')?.value?.trim()||'';
  const font=document.querySelector('#bloc-font-grid .p-font-option.selected')?.dataset.font||'default';
  const customColor=document.querySelector('#bloc-color-grid .p-color-option.selected')?.dataset.color||'default';
  const bloc={id:state.editingBloc?.id||blocId(),type,titre,debut,fin,notes,font,customColor,
    ordre:state.editingBloc?.ordre??getNextOrdre(ctx),ref:state.editingBloc?.ref||null,
    plage:type==='garde'?(document.getElementById('bloc-plage')?.value||''):'',
    lieu:type==='sortie'?(document.getElementById('bloc-lieu')?.value?.trim()||''):'',
    attachments};
  if(ctx==='journee'){
    const blocs=[...state.journeeBlocs]; const i=blocs.findIndex(b=>b.id===bloc.id);
    if(i>=0)blocs[i]=bloc; else blocs.push(bloc);
    await Journees.update(state.journeeId,{blocs}); state.journeeBlocs=blocs;
  } else {
    if(!state.grilleType){
      const gtId=await GrillesType.create({groupeId:state.groupeId,blocs:[bloc]});
      state.grilleType={id:gtId,groupeId:state.groupeId,blocs:[bloc]};
    } else {
      const blocs=[...state.grilleType.blocs]; const i=blocs.findIndex(b=>b.id===bloc.id);
      if(i>=0)blocs[i]=bloc; else blocs.push(bloc);
      await GrillesType.update(state.grilleType.id,{blocs}); state.grilleType.blocs=blocs;
    }
  }
  closeModal('modal-bloc'); render();
}

async function handleDeleteBlocAction(id,ctx) {
  if(ctx==='journee'){
    const b=state.journeeBlocs.filter(x=>x.id!==id);
    await Journees.update(state.journeeId,{blocs:b}); state.journeeBlocs=b;
  } else if(state.grilleType){
    const b=state.grilleType.blocs.filter(x=>x.id!==id);
    await GrillesType.update(state.grilleType.id,{blocs:b}); state.grilleType.blocs=b;
  }
  render();
}

async function handleMoveBloc(id,ctx,dir) {
  let blocs=ctx==='journee'?[...state.journeeBlocs]:[...(state.grilleType?.blocs||[])];
  blocs.sort((a,b)=>a.ordre-b.ordre);
  const i=blocs.findIndex(b=>b.id===id); if(i<0)return;
  const j=dir==='up'?i-1:i+1; if(j<0||j>=blocs.length)return;
  const tmp=blocs[i].ordre; blocs[i]={...blocs[i],ordre:blocs[j].ordre}; blocs[j]={...blocs[j],ordre:tmp};
  if(ctx==='journee'){await Journees.update(state.journeeId,{blocs});state.journeeBlocs=blocs;}
  else{await GrillesType.update(state.grilleType.id,{blocs});state.grilleType.blocs=blocs;}
  render();
}

// ── Appliquer gabarit ──

function openAppliquerModal() {
  if(!state.grilleType||!state.grilleType.blocs.length) return alert('Aucun gabarit a appliquer.');
  const inner=document.getElementById('modal-appliquer-inner');
  inner.innerHTML = `
    <button class="zts-modal__close" data-action="close-appliquer">\u2715</button>
    <h2 class="zts-modal__title">Appliquer la journee type</h2>
    <div class="p-apply-section">
      <h3 class="p-label">A une date</h3>
      <div style="display:flex;gap:var(--space-2);align-items:end">
        <div class="p-field" style="flex:1;margin-bottom:0">
          <input class="p-input" type="date" id="apply-single-date" value="${state.currentDate}"></div>
        <button class="zts-btn zts-btn--primary" data-action="apply-single">Appliquer</button>
      </div>
    </div>
    <hr style="border:none;border-top:2px dashed #ccc;margin:var(--space-4) 0">
    <div class="p-apply-section">
      <h3 class="p-label">A une plage de dates (lun-ven)</h3>
      <div style="display:flex;gap:var(--space-2);flex-wrap:wrap;margin-bottom:var(--space-3)">
        <div class="p-field" style="flex:1;min-width:140px;margin-bottom:0">
          <label class="p-label" style="font-size:var(--fs-1)">Du</label>
          <input class="p-input" type="date" id="apply-date-start" value="${state.org?.dateDebut||state.currentDate}"></div>
        <div class="p-field" style="flex:1;min-width:140px;margin-bottom:0">
          <label class="p-label" style="font-size:var(--fs-1)">Au</label>
          <input class="p-input" type="date" id="apply-date-end" value="${state.org?.dateFin||shiftDate(state.currentDate,4)}"></div>
      </div>
      <div class="p-field"><label class="p-label">Si une journee a deja des blocs</label>
        <select class="p-select" id="apply-conflict">
          <option value="sauter">Sauter (garder l'existant)</option>
          <option value="remplacer">Remplacer (ecraser)</option>
          <option value="fusionner">Fusionner (ajouter apres)</option>
        </select></div>
      <button class="zts-btn zts-btn--primary" data-action="apply-batch" style="width:100%">Appliquer en lot</button>
      <div id="apply-progress" style="display:none;margin-top:var(--space-3)">
        <div class="p-label">Progression...</div>
        <div id="apply-progress-text" class="p-enfant-sub"></div>
      </div>
    </div>`;
  openModal('modal-appliquer');
}

async function applyGabaritToDate(dateISO,mode) {
  const gb=state.grilleType.blocs.map(b=>({...b,id:blocId()}));
  let j=await Journees.getByGroupeAndDate(state.groupeId,dateISO);
  if(!j){ await Journees.create({date:dateISO,groupeId:state.groupeId,blocs:gb}); return {applied:true}; }
  const ex=j.blocs||[];
  if(!ex.length){ await Journees.update(j.id,{blocs:gb}); return {applied:true}; }
  if(mode==='sauter') return {applied:false};
  if(mode==='remplacer'){ await Journees.update(j.id,{blocs:gb}); return {applied:true}; }
  if(mode==='fusionner'){
    const mx=Math.max(0,...ex.map(b=>b.ordre));
    await Journees.update(j.id,{blocs:[...ex,...gb.map((b,i)=>({...b,ordre:mx+1+i}))]});
    return {applied:true};
  }
  return {applied:false};
}

async function handleApplySingle() {
  const date=document.getElementById('apply-single-date').value;
  if(!date) return alert('Choisis une date.');
  const ex=await Journees.getByGroupeAndDate(state.groupeId,date);
  let mode='remplacer';
  if(ex&&ex.blocs&&ex.blocs.length){
    const c=prompt(`Cette journee a deja ${ex.blocs.length} bloc(s).\n\nR = Remplacer\nF = Fusionner\nS = Annuler`,'R');
    if(!c||c.toUpperCase()==='S') return;
    mode=c.toUpperCase()==='F'?'fusionner':'remplacer';
  }
  await applyGabaritToDate(date,mode);
  closeModal('modal-appliquer');
  state.currentDate=date; state.view='journee';
  await loadJourneeData(); render();
}

async function handleApplyBatch() {
  const s=document.getElementById('apply-date-start').value, e=document.getElementById('apply-date-end').value;
  const conflict=document.getElementById('apply-conflict').value;
  if(!s||!e) return alert('Choisis les dates.');
  if(s>e) return alert('La date de debut doit etre avant la fin.');
  const dates=[]; let c=s;
  while(c<=e){ const dow=new Date(c+'T12:00:00').getDay(); if(dow>=1&&dow<=5)dates.push(c); c=shiftDate(c,1); }
  if(!dates.length) return alert('Aucun jour de semaine.');
  if(!confirm(`Appliquer la journee type sur ${dates.length} jour(s)?`)) return;
  const prog=document.getElementById('apply-progress'), pt=document.getElementById('apply-progress-text');
  prog.style.display='block';
  let ok=0,skip=0,err=0;
  for(const d of dates){ try{ pt.textContent=formatDateFR(d)+'...'; const r=await applyGabaritToDate(d,conflict); if(r.applied)ok++;else skip++; }catch(x){console.error('[Planif]',d,x);err++;} }
  closeModal('modal-appliquer');
  await loadJourneeData(); render();
  alert(`Termine! ${ok} applique(s), ${skip} saute(s)${err?`, ${err} erreur(s)`:''}.`);
}

// ══════════════════════════════════════════════════════════
//  ACTIONS
// ══════════════════════════════════════════════════════════

async function handleAction(action, ds) {
  switch(action) {
    // ── Setup ──
    case 'save-setup': {
      const orgNom=document.getElementById('setup-org').value.trim();
      const grpNom=document.getElementById('setup-groupe').value.trim();
      const theme=document.getElementById('setup-theme').value.trim();
      if(!orgNom||!grpNom) return alert('Nom requis.');
      const orgId=await Organisations.create({nom:orgNom,coordoUid:state.user.uid,dateDebut:'',dateFin:'',semaines:[]});
      const groupeId=await Groupes.create({nom:grpNom,orgId,animateurUid:state.user.uid,theme});
      localStorage.setItem(LS.orgId,orgId); localStorage.setItem(LS.groupeId,groupeId);
      state.orgId=orgId; state.groupeId=groupeId;
      await loadGroupeData(); render();
      break;
    }

    // ── Navigation ──
    case 'nav': {
      state.view=ds.to;
      if(ds.to==='calendrier') await loadCalendarData();
      if(ds.to==='gabarit') await loadGrilleType();
      if(ds.to==='historique'){state.historyEnfantId=null;state.historyData=[];}
      render(); break;
    }
    case 'cal-mode':
      if(ds.mode==='jour'){ if(!state.currentDate)state.currentDate=todayISO(); state.view='journee'; await loadJourneeData(); }
      else if(ds.mode==='semaine'){ state.weekStart=mondayOf(state.currentDate||todayISO()); state.view='semaine'; await loadWeekData(); }
      else { state.view='calendrier'; await loadCalendarData(); }
      render(); break;
    case 'prev-week':
      state.weekStart=shiftDate(state.weekStart,-7); await loadWeekData(); render(); break;
    case 'next-week':
      state.weekStart=shiftDate(state.weekStart,7); await loadWeekData(); render(); break;
    case 'start-live':
      state.liveCompleted=new Set(); state.view='live'; render(); break;
    case 'stop-live':
      if(state.liveTimer){clearInterval(state.liveTimer);state.liveTimer=null;}
      state.view='journee'; render(); break;
    case 'live-complete':
      state.liveCompleted.add(ds.blocId); playDoneSound(); render(); break;
    case 'select-date':
      state.currentDate=ds.date; state.view='journee';
      await loadJourneeData(); render(); break;
    case 'prev-date':
      state.currentDate=shiftDate(state.currentDate,-1);
      await loadJourneeData(); render(); break;
    case 'next-date':
      state.currentDate=shiftDate(state.currentDate,1);
      await loadJourneeData(); render(); break;
    case 'prev-month':
      state.calMonth--; if(state.calMonth<0){state.calMonth=11;state.calYear--;} await loadCalendarData(); render(); break;
    case 'next-month':
      state.calMonth++; if(state.calMonth>11){state.calMonth=0;state.calYear++;} await loadCalendarData(); render(); break;

    // ── Enfants ──
    case 'add-enfant': openEnfantModal(null); break;
    case 'edit-enfant': { const e=state.enfants.find(x=>x.id===ds.id); if(e)openEnfantModal(e); break; }
    case 'save-enfant': await handleSaveEnfant(); break;
    case 'delete-enfant': await handleDeleteEnfant(); break;
    case 'add-autorise': { const l=document.getElementById('autorises-list'); l.insertAdjacentHTML('beforeend',autoriseRowHTML({nom:'',lien:'mere'},l.children.length)); break; }
    case 'remove-autorise': { const r=document.querySelector(`.p-autorise-row[data-idx="${ds.idx}"]`); if(r)r.remove(); break; }
    case 'close-enfant': closeModal('modal-enfant'); break;

    // ── Depart ──
    case 'close-depart': closeModal('modal-depart'); break;
    case 'tap-presence': await handlePresenceTap(ds.id); break;
    case 'select-person':
      _departSelectedPerson={nom:ds.nom,lien:ds.lien}; _departCustom='';
      const ci2=document.getElementById('depart-custom'); if(ci2)ci2.value='';
      document.querySelectorAll('#depart-persons .p-depart-person').forEach(b=>b.classList.remove('selected'));
      document.querySelector(`[data-action="select-person"][data-idx="${ds.idx}"]`)?.classList.add('selected');
      updateDepartWarning(); break;
    case 'confirm-depart': await handleConfirmDepart(); break;
    case 'select-history-enfant': break;
    case 'trigger-photo': break;

    // ── Groupe ──
    case 'edit-groupe': {
      const nn=prompt('Nom du groupe:',state.groupe.nom); if(nn===null)return;
      const nt=prompt('Theme:',state.groupe.theme||'');
      await Groupes.update(state.groupeId,{nom:nn.trim()||state.groupe.nom,theme:(nt||'').trim()});
      await loadGroupeData(); render(); break;
    }

    // ── Blocs ──
    case 'add-bloc': openBlocModal(null,ds.context); break;
    case 'edit-bloc': {
      const blocs=ds.context==='journee'?state.journeeBlocs:(state.grilleType?.blocs||[]);
      const b=blocs.find(x=>x.id===ds.blocId); if(b)openBlocModal(b,ds.context); break;
    }
    case 'save-bloc': await handleSaveBloc(); break;
    case 'delete-bloc-modal':
      if(state.editingBloc&&confirm('Supprimer ce bloc?')){await handleDeleteBlocAction(state.editingBloc.id,state.editingBlocContext);closeModal('modal-bloc');} break;
    case 'delete-bloc': if(confirm('Supprimer ce bloc?'))await handleDeleteBlocAction(ds.blocId,ds.context); break;
    case 'move-bloc-up': await handleMoveBloc(ds.blocId,ds.context,'up'); break;
    case 'move-bloc-down': await handleMoveBloc(ds.blocId,ds.context,'down'); break;
    case 'close-bloc': closeModal('modal-bloc'); break;
    case 'remove-attachment': {
      const el=document.querySelector(`[data-action="remove-attachment"][data-idx="${ds.idx}"]`);
      if(el)el.parentElement.remove(); break;
    }
    case 'view-attachment': {
      const a=(ds.context==='journee'?state.journeeBlocs:(state.grilleType?.blocs||[])).find(b=>b.id===ds.blocId)?.attachments?.[ds.idx];
      if(a) window.open(a.data,'_blank');
      break;
    }
    case 'select-bloc-type':
      document.querySelectorAll('#bloc-type-grid .p-type-option').forEach(o=>o.classList.remove('selected'));
      document.querySelector(`[data-action="select-bloc-type"][data-type="${ds.type}"]`)?.classList.add('selected');
      document.getElementById('bloc-extra-fields').innerHTML=renderBlocExtraFields(ds.type,state.editingBloc?.type===ds.type?state.editingBloc:null);
      break;
    case 'select-bloc-font':
      document.querySelectorAll('#bloc-font-grid .p-font-option').forEach(o=>o.classList.remove('selected'));
      document.querySelector(`[data-action="select-bloc-font"][data-font="${ds.font}"]`)?.classList.add('selected');
      break;
    case 'select-bloc-color':
      document.querySelectorAll('#bloc-color-grid .p-color-option').forEach(o=>o.classList.remove('selected'));
      document.querySelector(`[data-action="select-bloc-color"][data-color="${ds.color}"]`)?.classList.add('selected');
      break;

    // ── Gabarit application ──
    case 'appliquer-gabarit': openAppliquerModal(); break;
    case 'apply-single': await handleApplySingle(); break;
    case 'apply-batch': await handleApplyBatch(); break;
    case 'close-appliquer': closeModal('modal-appliquer'); break;
  }
}

// ── Presence flow ──

async function handlePresenceTap(enfantId) {
  const enfant=state.enfants.find(e=>e.id===enfantId); if(!enfant)return;
  const p=state.presenceMap[enfantId];
  if(!p){
    const id=await Presences.create({journeeId:state.journeeId,groupeId:state.groupeId,enfantId,statut:'present',heureArrivee:nowTime(),date:state.currentDate});
    state.presenceMap[enfantId]={id,journeeId:state.journeeId,groupeId:state.groupeId,enfantId,statut:'present',heureArrivee:nowTime(),heureDepart:'',partiAvec:{nom:'',lien:''},horsListe:false,date:state.currentDate};
    render(); return;
  }
  if(p.statut==='present') openDepartModal(enfant,p);
  else if(p.statut==='absent'){await Presences.delete(p.id);delete state.presenceMap[enfantId];render();}
}

async function handleMarkAbsent(enfantId) {
  const p=state.presenceMap[enfantId];
  if(p){await Presences.update(p.id,{statut:'absent',ts:firebase.firestore.FieldValue.serverTimestamp()});state.presenceMap[enfantId]={...p,statut:'absent'};}
  else{const id=await Presences.create({journeeId:state.journeeId,groupeId:state.groupeId,enfantId,statut:'absent',date:state.currentDate});state.presenceMap[enfantId]={id,journeeId:state.journeeId,groupeId:state.groupeId,enfantId,statut:'absent',heureArrivee:'',heureDepart:'',partiAvec:{nom:'',lien:''},horsListe:false,date:state.currentDate};}
  render();
}

// ══════════════════════════════════════════════════════════
//  DATA LOADING
// ══════════════════════════════════════════════════════════

async function loadGroupeData() {
  state.groupe=await Groupes.get(state.groupeId);
  state.enfants=await Enfants.listByGroupe(state.groupeId);
  state.enfants.sort((a,b)=>a.prenom.localeCompare(b.prenom));
  if(state.orgId) state.org=await Organisations.get(state.orgId);
}

async function loadJourneeData() {
  let j=await Journees.getByGroupeAndDate(state.groupeId,state.currentDate);
  if(!j){const id=await Journees.create({date:state.currentDate,groupeId:state.groupeId,blocs:[]});j={id,date:state.currentDate,groupeId:state.groupeId,blocs:[]};}
  state.journeeId=j.id; state.journeeBlocs=j.blocs||[];
  const presences=await Presences.listByJournee(j.id,state.groupeId);
  state.presenceMap={}; presences.forEach(p=>{state.presenceMap[p.enfantId]=p;});
}

async function loadHistoryData(enfantId) {
  state.historyEnfantId=enfantId;
  if(!enfantId){state.historyData=[];return;}
  state.historyData=(await Presences.listByEnfant(enfantId,state.groupeId)).reverse();
}

async function loadGrilleType() {
  state.grilleType=await GrillesType.getByGroupe(state.groupeId);
}

async function loadCalendarData() {
  if(!state.groupeId){state.calDatesWithBlocs=new Set();return;}
  const y=state.calYear, m=state.calMonth;
  const start=y+'-'+String(m+1).padStart(2,'0')+'-01';
  const end=y+'-'+String(m+1).padStart(2,'0')+'-'+String(new Date(y,m+1,0).getDate()).padStart(2,'0');
  try {
    const db=await getDb();
    const snap=await db.collection('journees')
      .where('groupeId','==',state.groupeId)
      .where('date','>=',start)
      .where('date','<=',end)
      .get();
    state.calDatesWithBlocs=new Set();
    snap.docs.forEach(d=>{const data=d.data(); if(data.blocs&&data.blocs.length) state.calDatesWithBlocs.add(data.date);});
  } catch(e) {
    console.warn('[Planif] loadCalendarData:', e.message);
    state.calDatesWithBlocs=new Set();
  }
}

// ══════════════════════════════════════════════════════════
//  OFFLINE
// ══════════════════════════════════════════════════════════

function initOffline() {
  const bar=document.getElementById('sync-bar');
  function update(){
    if(!navigator.onLine){bar.textContent='\u{1F4E1} Hors ligne \u2014 sync au retour';bar.className='p-sync p-sync--offline';}
    else bar.className='p-sync';
  }
  window.addEventListener('online',()=>{bar.textContent='\u2713 Reconnecte...';bar.className='p-sync p-sync--syncing';setTimeout(()=>{bar.className='p-sync';},2500);});
  window.addEventListener('offline',update); update();
}

// ══════════════════════════════════════════════════════════
//  RENDER + WIRE
// ══════════════════════════════════════════════════════════

function render() {
  const root=document.getElementById('app-root');
  if(!state.user){root.innerHTML=renderNoAuth();return;}
  if(!state.groupeId){root.innerHTML=renderSetup();return;}
  root.innerHTML=renderMain();
}

function wireEvents() {
  const root=document.getElementById('app-root');

  root.addEventListener('click',(e)=>{
    if(longPressTriggered){longPressTriggered=false;return;}
    const el=e.target.closest('[data-action]'); if(el)handleAction(el.dataset.action,el.dataset);
  });

  root.addEventListener('change',async(e)=>{
    if(e.target.matches('[data-action="select-history-enfant"]')){await loadHistoryData(e.target.value);render();}
  });

  let longPressTimer=null, longPressId=null, longPressTriggered=false;
  root.addEventListener('pointerdown',(e)=>{
    const card=e.target.closest('[data-action="tap-presence"]'); if(!card)return;
    longPressId=card.dataset.id; longPressTriggered=false;
    longPressTimer=setTimeout(()=>{longPressTriggered=true;handleMarkAbsent(longPressId);longPressTimer=null;longPressId=null;},600);
  });
  const clearLP=()=>{if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}};
  root.addEventListener('pointerup',clearLP);
  root.addEventListener('pointercancel',clearLP);
  root.addEventListener('contextmenu',(e)=>{if(e.target.closest('[data-action="tap-presence"]'))e.preventDefault();});

  ['modal-enfant','modal-depart','modal-bloc','modal-appliquer'].forEach(id=>{
    const modal=document.getElementById(id);
    modal.addEventListener('click',(e)=>{
      if(e.target===modal){closeModal(id);return;}
      if(e.target.closest('[data-action^="close-"]')){closeModal(id);return;}
      const a=e.target.closest('[data-action]'); if(a)handleAction(a.dataset.action,a.dataset);
    });
  });

  document.addEventListener('keydown',(e)=>{
    if(e.key==='Escape'){closeModal('modal-enfant');closeModal('modal-depart');closeModal('modal-bloc');closeModal('modal-appliquer');}
  });
}

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════

async function init() {
  console.log('[Planif] init start');
  try {
    wireEvents(); initOffline();
    console.log('[Planif] waiting for db...');
    await getDb();
    console.log('[Planif] db ready');
  } catch(e) { console.error('[Planif] init error:', e); }
  function waitAuth() {
    if(typeof firebase==='undefined'||!firebase.auth){setTimeout(waitAuth,200);return;}
    console.log('[Planif] auth ready, listening...');
    firebase.auth().onAuthStateChanged(async(user)=>{
      console.log('[Planif] auth state:', user?.email||'none');
      state.user=user; if(!user){render();return;}
      state.groupeId=localStorage.getItem(LS.groupeId)||null;
      state.orgId=localStorage.getItem(LS.orgId)||null;
      if(!state.groupeId){
        const g=await Groupes.listByAnimateur(user.uid);
        if(g.length){state.groupeId=g[0].id;state.orgId=g[0].orgId;localStorage.setItem(LS.groupeId,state.groupeId);localStorage.setItem(LS.orgId,state.orgId);}
      }
      console.log('[Planif] groupeId:', state.groupeId);
      if(state.groupeId) { await loadGroupeData(); state.currentDate=todayISO(); state.view='journee'; await loadJourneeData(); }
      console.log('[Planif] render');
      render();
    });
  }
  waitAuth();
}

if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
else init();
