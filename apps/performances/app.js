/**
 * Performances élèves — filme, stocke (Drive de l'enseignant), classe (PFEQ).
 *
 * Architecture (décisions verrouillées du projet) :
 *  - Vidéos = JAMAIS sur nos serveurs ni dans Firestore : upload direct dans le
 *    Google Drive de l'enseignant (scope drive.file — l'app ne voit que ses fichiers).
 *  - Fiches (classe, date, année, critère PFEQ, observation) = Firestore
 *    collection `performances`, owner-only (uid).
 *  - Auth = /firebase-auth.js partagé (compat SDK). Le token Drive est obtenu par
 *    signInWithPopup(GoogleAuthProvider + scope drive.file) — même client OAuth
 *    que le login Google du site, aucun secret côté client.
 */

/* ── Firestore (même pattern que le planificateur) ── */
function waitForFirebase() {
  return new Promise((resolve) => {
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
  return _db;
}

/* ── Référentiel PFEQ (identique au Carnet ÉPS / planificateur) ── */
const PFEQ = [
  { key:'agir', label:'🏃 AGIR', items:[
    ['agir_execution',"Exécution d'actions motrices"],['agir_principes',"Application de principes liés à l'exécution"],['agir_efficacite','Efficacité des actions motrices'],['agir_planif','Planification de sa démarche'],['agir_evaluation','Évaluation de sa démarche'],['agir_equilibre','Équilibre et coordination'],['agir_locomotion','Locomotion (courir, sauter, ramper)'],['agir_manipulation',"Manipulation d'objets"],['agir_securite','Respect des règles de sécurité'],['agir_lancer','Lancer (précision, force, trajectoire)'],['agir_attraper','Attraper (réception, amortissement)'],['agir_frapper','Frapper (pied, main, raquette, bâton)'],['agir_dribbler','Dribbler (ballon, rondelle)'],['agir_sauter','Sauter (hauteur, longueur)'],['agir_rouler','Rouler (roulade avant, arrière)'],['agir_grimper','Grimper et suspension'],['agir_esquiver','Esquiver et feinter'],['agir_posture','Posture et alignement'],['agir_rythme','Rythme et tempo'],['agir_enchainement','Enchaînement de mouvements'],['agir_precision','Précision du geste technique'],['agir_puissance','Puissance et force'],['agir_souplesse','Souplesse et flexibilité'],['agir_endurance','Endurance cardiovasculaire'],['agir_vitesse',"Vitesse de réaction et d'exécution"],['agir_agilite','Agilité et changements de direction'],['agir_lateralite','Latéralité (dominant / non-dominant)'],
  ]},
  { key:'interagir', label:'🤝 INTERAGIR', items:[
    ['inter_coop','Coopération avec les partenaires'],['inter_opp','Opposition face aux adversaires'],['inter_comm','Communication motrice'],['inter_sync','Synchronisation des actions'],['inter_strat','Élaboration de stratégies'],['inter_roles','Application des rôles (attaque/défense)'],['inter_ethique','Éthique sportive et fair-play'],['inter_eval','Évaluation de la démarche collective'],['inter_passe','Qualité des passes (précision, timing)'],['inter_reception','Réception et contrôle du ballon'],['inter_demarquage',"Démarquage et occupation de l'espace"],['inter_marquage','Marquage et couverture défensive'],['inter_transition','Transition attaque-défense'],['inter_aide','Aide et entraide entre coéquipiers'],['inter_arbitrage',"Capacité d'arbitrage et jugement"],['inter_leadership',"Leadership positif dans l'équipe"],['inter_conflits','Gestion des conflits'],['inter_encouragement','Encouragement des pairs'],['inter_adaptation','Adaptation aux actions adverses'],['inter_lecture_jeu','Lecture du jeu et anticipation'],['inter_creation_jeu','Création de jeu (feintes, passes décisives)'],['inter_respect_regles','Respect des règles du jeu'],
  ]},
  { key:'sante', label:'❤️ SANTÉ', items:[
    ['sante_condition','Condition physique'],['sante_habitudes','Habitudes de vie saines'],['sante_hygiene','Hygiène et propreté'],['sante_stress','Gestion du stress'],['sante_alimentation','Saine alimentation et hydratation'],['sante_securite','Sécurité dans la pratique'],['sante_effort',"Persévérance et engagement dans l'effort"],['sante_bienetre','Bien-être physique et mental'],['sante_echauffement','Échauffement et retour au calme'],['sante_frequence_cardiaque','Connaissance de sa fréquence cardiaque'],['sante_sommeil','Importance du sommeil'],['sante_posture_quotidienne','Posture dans la vie quotidienne'],['sante_gestion_effort',"Gestion de l'intensité de l'effort"],['sante_relaxation','Techniques de relaxation'],['sante_image_corporelle','Image corporelle positive'],['sante_objectifs',"Fixation d'objectifs personnels"],['sante_autonomie','Autonomie dans la pratique'],['sante_responsabilite','Responsabilité face à sa santé'],
  ]},
];
const PFEQ_LABEL = {}; PFEQ.forEach(c => c.items.forEach(([k, l]) => { PFEQ_LABEL[k] = { label: l, comp: c.label, compKey: c.key }; }));

/* ── État ── */
const S = {
  user: null,
  driveToken: null,     // { token, exp } — sessionStorage, ~50 min
  videoFile: null,      // File choisi (filmé ou importé)
  fiches: [],           // toutes les fiches de l'utilisateur
  editId: null,
};
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function toast(msg, ms = 3200) {
  const t = $('pf-toast');
  t.textContent = msg; t.style.display = 'block';
  clearTimeout(t._t); t._t = setTimeout(() => { t.style.display = 'none'; }, ms);
}

function todayISO() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
// Année scolaire (bascule 1er juillet, comme le planificateur)
function anneeScolaire(d = new Date()) {
  const y = d.getFullYear();
  return d.getMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

/* ── Google Drive (scope drive.file — accès limité aux fichiers créés par l'app) ── */
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

function driveToken() {
  if (S.driveToken && S.driveToken.exp > Date.now()) return S.driveToken.token;
  try {
    const c = JSON.parse(sessionStorage.getItem('pf_drive') || 'null');
    if (c && c.exp > Date.now()) { S.driveToken = c; return c.token; }
  } catch (e) {}
  return null;
}

async function connectDrive() {
  await waitForFirebase();
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope(DRIVE_SCOPE);
  try {
    const result = await firebase.auth().signInWithPopup(provider);
    const token = result.credential && result.credential.accessToken;
    if (!token) { toast('⚠️ Google n\'a pas fourni d\'accès Drive. Réessaie.'); return; }
    S.driveToken = { token, exp: Date.now() + 50 * 60 * 1000 };
    sessionStorage.setItem('pf_drive', JSON.stringify(S.driveToken));
    refreshChips();
    toast('☁️ Drive connecté! Les vidéos se rangeront toutes seules.');
  } catch (e) {
    console.warn('[Perf] Drive connect', e);
    if (e.code !== 'auth/popup-closed-by-user') toast('⚠️ Connexion Drive impossible : ' + (e.message || e.code));
  }
}

async function driveFetch(url, opts = {}) {
  const token = driveToken();
  if (!token) throw new Error('drive-token-expired');
  opts.headers = Object.assign({ Authorization: 'Bearer ' + token }, opts.headers || {});
  const r = await fetch(url, opts);
  if (r.status === 401) { sessionStorage.removeItem('pf_drive'); S.driveToken = null; refreshChips(); throw new Error('drive-token-expired'); }
  if (!r.ok) throw new Error('drive-http-' + r.status + ' ' + (await r.text()).slice(0, 200));
  return r;
}

// Trouve ou crée un dossier (cache localStorage : les ids Drive sont stables)
async function driveFolder(name, parentId) {
  const ck = 'pf_folder_' + (parentId || 'root') + '_' + name;
  const cached = localStorage.getItem(ck);
  if (cached) return cached;
  const q = encodeURIComponent(`name='${name.replace(/'/g, "\\'")}' and mimeType='application/vnd.google-apps.folder' and trashed=false` + (parentId ? ` and '${parentId}' in parents` : ''));
  const found = await (await driveFetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)`)).json();
  let id = found.files && found.files[0] && found.files[0].id;
  if (!id) {
    const body = { name, mimeType: 'application/vnd.google-apps.folder' };
    if (parentId) body.parents = [parentId];
    id = (await (await driveFetch('https://www.googleapis.com/drive/v3/files?fields=id', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })).json()).id;
  }
  localStorage.setItem(ck, id);
  return id;
}

// Upload résumable avec progression → { id, link }
async function driveUpload(file, name, folderId, onProgress) {
  const init = await driveFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Upload-Content-Type': file.type || 'video/mp4' },
    body: JSON.stringify({ name, parents: [folderId] }),
  });
  const session = init.headers.get('Location');
  const id = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', session);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) { try { resolve(JSON.parse(xhr.responseText).id); } catch (e) { reject(e); } }
      else reject(new Error('upload-http-' + xhr.status));
    };
    xhr.onerror = () => reject(new Error('upload-network'));
    xhr.send(file);
  });
  return { id, link: 'https://drive.google.com/file/d/' + id + '/view' };
}

async function driveDelete(fileId) {
  await driveFetch('https://www.googleapis.com/drive/v3/files/' + fileId, { method: 'DELETE' });
}

/* ── Firestore CRUD ── */
const Perfs = {
  async list(uid) {
    const s = await (await getDb()).collection('performances').where('uid', '==', uid).get();
    return s.docs.map(d => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.tsMs || 0) - (a.tsMs || 0));
  },
  async create(d) {
    d.ts = firebase.firestore.FieldValue.serverTimestamp();
    d.tsMs = Date.now();
    return (await (await getDb()).collection('performances').add(d)).id;
  },
  async update(id, d) { await (await getDb()).collection('performances').doc(id).update(d); },
  async remove(id) { await (await getDb()).collection('performances').doc(id).delete(); },
};

/* ── UI : sélecteurs PFEQ + année ── */
function fillCompSelect(sel, val) {
  sel.innerHTML = PFEQ.map(c => `<option value="${c.key}" ${c.key === val ? 'selected' : ''}>${c.label}</option>`).join('');
}
function fillCritSelect(sel, compKey, val) {
  const c = PFEQ.find(x => x.key === compKey) || PFEQ[0];
  sel.innerHTML = c.items.map(([k, l]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${l}</option>`).join('');
}
function fillAnneeSelect(sel, val) {
  const cur = anneeScolaire();
  const [y] = cur.split('-').map(Number);
  const opts = [`${y - 2}-${y - 1}`, `${y - 1}-${y}`, cur, `${y + 1}-${y + 2}`];
  sel.innerHTML = opts.map(a => `<option value="${a}" ${a === (val || cur) ? 'selected' : ''}>${a}</option>`).join('');
}

/* ── Connexions (chips) ── */
function refreshChips() {
  const zts = $('chip-zts'), drv = $('chip-drive');
  if (S.user) {
    zts.className = 'pf-chip ok';
    zts.textContent = '✅ ZTS : ' + (S.user.displayName || S.user.email || 'connecté');
    $('btn-login').hidden = true;
  } else {
    zts.className = 'pf-chip ko'; zts.textContent = '🔒 Compte ZTS non connecté';
    $('btn-login').hidden = false;
  }
  if (driveToken()) {
    drv.className = 'pf-chip ok'; drv.textContent = '☁️ Drive connecté';
    $('btn-drive').hidden = true;
  } else {
    drv.className = 'pf-chip ko'; drv.textContent = '☁️ Cloud non connecté';
    $('btn-drive').hidden = !S.user;
  }
}

/* ── Nouvelle performance ── */
function setVideoFile(f) {
  S.videoFile = f || null;
  const info = $('f-video-info'), prev = $('f-preview');
  if (!f) { info.textContent = ''; prev.hidden = true; prev.removeAttribute('src'); return; }
  info.textContent = '🎬 ' + f.name + ' (' + (f.size / 1048576).toFixed(1) + ' Mo)';
  prev.src = URL.createObjectURL(f); prev.hidden = false;
  if (!driveToken()) toast('☁️ Connecte ton Drive (étape 1) pour que la vidéo se range automatiquement.', 4500);
}

async function savePerf() {
  if (!S.user) { toast('🔑 Connecte ton compte ZTS d\'abord (étape 1).'); return; }
  const classe = $('f-classe').value.trim();
  const eleve = $('f-eleve').value.trim();
  if (!classe || !eleve) { toast('⚠️ Numéro de classe et élève sont obligatoires.'); return; }
  if (S.videoFile && !driveToken()) {
    toast('☁️ Pour enregistrer une VIDÉO, connecte ton Drive (étape 1) — c\'est lui qui la stocke.', 5000);
    return;
  }
  const btn = $('btn-save'); btn.disabled = true;
  const date = $('f-date').value || todayISO();
  const annee = $('f-annee').value;
  const critereId = $('f-critere').value;
  const fiche = {
    uid: S.user.uid, classe, eleve, date, annee,
    compKey: $('f-comp').value, critereId,
    critereLabel: (PFEQ_LABEL[critereId] || {}).label || critereId,
    competence: (PFEQ_LABEL[critereId] || {}).comp || '',
    observation: $('f-obs').value.trim(),
    video: null,
  };
  try {
    if (S.videoFile) {
      const bar = $('f-progress'), lbl = $('f-progress-label');
      bar.style.display = 'block'; lbl.textContent = '☁️ Préparation des dossiers Drive…';
      const racine = await driveFolder('ZTS Performances');
      const dAnnee = await driveFolder(annee, racine);
      const dClasse = await driveFolder('Classe ' + classe, dAnnee);
      const extension = (S.videoFile.name.match(/\.\w{2,5}$/) || ['.mp4'])[0];
      const nom = `${classe}_${date}_${eleve}_${fiche.critereLabel}`.replace(/[^\wÀ-ÿ -]/g, '').replace(/\s+/g, '-') + extension;
      lbl.textContent = '⬆️ Téléversement de la vidéo…';
      const up = await driveUpload(S.videoFile, nom, dClasse, p => {
        bar.firstElementChild.style.width = Math.round(p * 100) + '%';
        lbl.textContent = '⬆️ Téléversement… ' + Math.round(p * 100) + ' %';
      });
      fiche.video = { driveId: up.id, link: up.link, name: nom };
      lbl.textContent = '✅ Vidéo rangée dans Drive → ZTS Performances / ' + annee + ' / Classe ' + classe;
    }
    await Perfs.create(fiche);
    toast('💾 Performance de ' + eleve + ' enregistrée et classée (classe ' + classe + ')!');
    // reset partiel : on garde classe/date/année pour enchaîner les élèves
    $('f-eleve').value = ''; $('f-obs').value = '';
    setVideoFile(null);
    $('f-progress').style.display = 'none'; $('f-progress').firstElementChild.style.width = '0%';
    $('f-progress-label').textContent = '';
    await loadFiches();
  } catch (e) {
    console.error('[Perf] save', e);
    toast(e.message === 'drive-token-expired'
      ? '☁️ Session Drive expirée — reconnecte ton Drive (étape 1) puis réessaie.'
      : '⚠️ Erreur à l\'enregistrement : ' + (e.message || e), 6000);
  }
  btn.disabled = false;
}

/* ── Classeur : filtres + rendu groupé par classe ── */
function fillFiltres() {
  const annees = [...new Set(S.fiches.map(f => f.annee))].sort().reverse();
  const classes = [...new Set(S.fiches.map(f => f.classe))].sort((a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true }));
  const keep = (sel, v) => { if ([...sel.options].some(o => o.value === v)) sel.value = v; };
  const a0 = $('fl-annee').value, c0 = $('fl-classe').value, k0 = $('fl-comp').value;
  $('fl-annee').innerHTML = '<option value="">Toutes les années</option>' + annees.map(a => `<option>${esc(a)}</option>`).join('');
  $('fl-classe').innerHTML = '<option value="">Toutes les classes</option>' + classes.map(c => `<option>${esc(c)}</option>`).join('');
  $('fl-comp').innerHTML = '<option value="">Toutes les compétences</option>' + PFEQ.map(c => `<option value="${c.key}">${c.label}</option>`).join('');
  keep($('fl-annee'), a0); keep($('fl-classe'), c0); keep($('fl-comp'), k0);
}

function renderFiches() {
  const root = $('pf-liste');
  if (!S.user) { root.innerHTML = '<div class="pf-empty">Connecte-toi pour voir tes fiches.</div>'; return; }
  const fa = $('fl-annee').value, fc = $('fl-classe').value, fk = $('fl-comp').value,
        fe = $('fl-eleve').value.trim().toLowerCase();
  const list = S.fiches.filter(f =>
    (!fa || f.annee === fa) && (!fc || f.classe === fc) &&
    (!fk || f.compKey === fk) && (!fe || (f.eleve || '').toLowerCase().includes(fe)));
  if (!list.length) { root.innerHTML = '<div class="pf-empty">Aucune fiche' + (S.fiches.length ? ' avec ces filtres.' : ' — enregistre ta première performance juste au-dessus! 🎥') + '</div>'; return; }
  // groupé par numéro de classe (le « document » de la classe)
  const parClasse = {};
  list.forEach(f => { (parClasse[f.classe] = parClasse[f.classe] || []).push(f); });
  root.innerHTML = Object.keys(parClasse)
    .sort((a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true }))
    .map(classe => `
    <div class="pf-classe">
      <h3>📂 CLASSE ${esc(classe)} <small style="font-size:12px">· ${parClasse[classe].length} fiche${parClasse[classe].length > 1 ? 's' : ''}</small></h3>
      ${parClasse[classe].map(f => `
        <div class="pf-item">
          <div class="meta">
            <div class="eleve">🧒 ${esc(f.eleve)}</div>
            <div class="tags">
              <span>📅 ${esc(f.date)}</span><span>🗓️ ${esc(f.annee)}</span>
              <span>${esc(f.competence)}</span><span>🎯 ${esc(f.critereLabel)}</span>
            </div>
            ${f.observation ? `<div class="obs">${esc(f.observation)}</div>` : ''}
          </div>
          <div class="acts">
            ${f.video ? `<a class="pf-btn cyan sm" href="${esc(f.video.link)}" target="_blank" rel="noopener">🎬 Vidéo</a>` : ''}
            <button class="pf-btn sm" data-edit="${f.id}">✏️</button>
            <button class="pf-btn ghost sm" data-del="${f.id}">🗑️</button>
          </div>
        </div>`).join('')}
    </div>`).join('');
}

async function loadFiches() {
  if (!S.user) { renderFiches(); return; }
  try {
    S.fiches = await Perfs.list(S.user.uid);
    fillFiltres(); renderFiches();
  } catch (e) {
    console.error('[Perf] list', e);
    $('pf-liste').innerHTML = '<div class="pf-empty">⚠️ Impossible de charger les fiches (' + esc(e.message || e) + ')</div>';
  }
}

/* ── Édition (tout est éditable) ── */
function openEdit(id) {
  const f = S.fiches.find(x => x.id === id); if (!f) return;
  S.editId = id;
  $('pf-modal-form').innerHTML = `
    <div class="pf-field"><label>Numéro de classe</label><input id="m-classe" value="${esc(f.classe)}" maxlength="12"></div>
    <div class="pf-field"><label>Élève</label><input id="m-eleve" value="${esc(f.eleve)}" maxlength="40"></div>
    <div class="pf-field"><label>Date</label><input id="m-date" type="date" value="${esc(f.date)}"></div>
    <div class="pf-field"><label>Année scolaire</label><select id="m-annee"></select></div>
    <div class="pf-field"><label>Compétence PFEQ</label><select id="m-comp"></select></div>
    <div class="pf-field"><label>Critère observé</label><select id="m-critere"></select></div>
    <div class="pf-field full"><label>Observation</label><textarea id="m-obs">${esc(f.observation)}</textarea></div>
    ${f.video ? `<div class="pf-field full"><label>Vidéo liée</label>
      <div style="font-size:14px">🎬 <a href="${esc(f.video.link)}" target="_blank" rel="noopener">${esc(f.video.name)}</a> (dans ton Drive)</div></div>` : ''}`;
  fillAnneeSelect($('m-annee'), f.annee);
  fillCompSelect($('m-comp'), f.compKey);
  fillCritSelect($('m-critere'), f.compKey, f.critereId);
  $('m-comp').onchange = () => fillCritSelect($('m-critere'), $('m-comp').value);
  $('pf-modal').classList.add('open');
}

async function saveEdit() {
  const f = S.fiches.find(x => x.id === S.editId); if (!f) return;
  const critereId = $('m-critere').value;
  const patch = {
    classe: $('m-classe').value.trim() || f.classe,
    eleve: $('m-eleve').value.trim() || f.eleve,
    date: $('m-date').value || f.date,
    annee: $('m-annee').value,
    compKey: $('m-comp').value, critereId,
    critereLabel: (PFEQ_LABEL[critereId] || {}).label || critereId,
    competence: (PFEQ_LABEL[critereId] || {}).comp || '',
    observation: $('m-obs').value.trim(),
  };
  try {
    await Perfs.update(S.editId, patch);
    $('pf-modal').classList.remove('open');
    toast('✏️ Fiche mise à jour!');
    await loadFiches();
  } catch (e) { toast('⚠️ Sauvegarde impossible : ' + (e.message || e)); }
}

async function delPerf(id) {
  const f = S.fiches.find(x => x.id === id); if (!f) return;
  if (!confirm('Supprimer la fiche de ' + f.eleve + ' (' + f.date + ')?')) return;
  if (f.video && driveToken() && confirm('Supprimer AUSSI la vidéo dans ton Drive?\n(Annuler = la vidéo reste dans Drive.)')) {
    try { await driveDelete(f.video.driveId); } catch (e) { console.warn('[Perf] driveDelete', e); }
  }
  try {
    await Perfs.remove(id);
    toast('🗑️ Fiche supprimée.');
    await loadFiches();
  } catch (e) { toast('⚠️ Suppression impossible : ' + (e.message || e)); }
}

/* ── Bootstrap ── */
function wire() {
  $('f-date').value = todayISO();
  fillAnneeSelect($('f-annee'));
  fillCompSelect($('f-comp'));
  fillCritSelect($('f-critere'), 'agir');
  $('f-comp').addEventListener('change', () => fillCritSelect($('f-critere'), $('f-comp').value));

  $('btn-filmer').addEventListener('click', () => $('f-video').click());
  $('btn-importer').addEventListener('click', () => $('f-video-import').click());
  $('f-video').addEventListener('change', e => setVideoFile(e.target.files[0]));
  $('f-video-import').addEventListener('change', e => setVideoFile(e.target.files[0]));
  $('btn-save').addEventListener('click', savePerf);
  $('btn-drive').addEventListener('click', connectDrive);
  $('btn-login').addEventListener('click', () => {
    if (window.ztsShowLogin) window.ztsShowLogin();
    else location.href = '/login.html?next=' + encodeURIComponent(location.pathname);
  });

  ['fl-annee', 'fl-classe', 'fl-comp'].forEach(id => $(id).addEventListener('change', renderFiches));
  $('fl-eleve').addEventListener('input', renderFiches);

  $('pf-liste').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]'); if (ed) { openEdit(ed.dataset.edit); return; }
    const de = e.target.closest('[data-del]'); if (de) { delPerf(de.dataset.del); }
  });
  $('m-save').addEventListener('click', saveEdit);
  $('m-cancel').addEventListener('click', () => $('pf-modal').classList.remove('open'));
  $('pf-modal').addEventListener('click', (e) => { if (e.target === $('pf-modal')) $('pf-modal').classList.remove('open'); });

  waitForFirebase().then(() => {
    firebase.auth().onAuthStateChanged(async (user) => {
      S.user = user;
      refreshChips();
      await loadFiches();
    });
  });
  refreshChips();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire); else wire();
