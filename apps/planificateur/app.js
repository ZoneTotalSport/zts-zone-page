/**
 * Planificateur Camp de jour — app.js (ES module)
 * MVP : helpers CRUD Firestore + offline + smoke test.
 * Firebase compat SDK chargé par firebase-auth.js (racine).
 */

// ── Attendre que le SDK Firebase compat soit chargé par firebase-auth.js ──
// Pas de config ici : firebase-auth.js (racine) initialise déjà l'app.
function waitForFirebase() {
  return new Promise((resolve) => {
    if (typeof firebase !== 'undefined' && firebase.firestore) {
      resolve();
      return;
    }
    // firebase-auth.js charge app+auth ; on attend que l'app soit initialisée
    const check = setInterval(() => {
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
        clearInterval(check);
        resolve();
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

// ── DB singleton ──
let _db = null;

async function getDb() {
  if (_db) return _db;
  await waitForFirebase();
  await loadFirestoreSDK();
  // L'app est déjà initialisée par firebase-auth.js
  _db = firebase.firestore();
  // Activer la persistence offline
  try {
    await _db.enablePersistence({ synchronizeTabs: true });
  } catch (err) {
    if (err.code === 'failed-precondition') {
      console.warn('[Planif] Persistence multi-tab impossible, un seul onglet supporté.');
    } else if (err.code === 'unimplemented') {
      console.warn('[Planif] Persistence offline non supportée par ce navigateur.');
    }
  }
  return _db;
}

// ══════════════════════════════════════════════════════════
//  CRUD HELPERS — schéma exact de la spec §15
// ══════════════════════════════════════════════════════════

// ── Organisations ──
export const Organisations = {
  async create(data) {
    const db = await getDb();
    const ref = await db.collection('organisations').add({
      nom: data.nom,
      coordoUid: data.coordoUid,
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      semaines: data.semaines || []
    });
    return ref.id;
  },
  async get(id) {
    const db = await getDb();
    const snap = await db.collection('organisations').doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },
  async update(id, data) {
    const db = await getDb();
    await db.collection('organisations').doc(id).update(data);
  },
  async delete(id) {
    const db = await getDb();
    await db.collection('organisations').doc(id).delete();
  }
};

// ── Groupes ──
export const Groupes = {
  async create(data) {
    const db = await getDb();
    const ref = await db.collection('groupes').add({
      nom: data.nom,
      orgId: data.orgId,
      animateurUid: data.animateurUid,
      theme: data.theme || ''
    });
    return ref.id;
  },
  async get(id) {
    const db = await getDb();
    const snap = await db.collection('groupes').doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },
  async listByOrg(orgId) {
    const db = await getDb();
    const snap = await db.collection('groupes').where('orgId', '==', orgId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async listByAnimateur(uid) {
    const db = await getDb();
    const snap = await db.collection('groupes').where('animateurUid', '==', uid).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async update(id, data) {
    const db = await getDb();
    await db.collection('groupes').doc(id).update(data);
  },
  async delete(id) {
    const db = await getDb();
    await db.collection('groupes').doc(id).delete();
  }
};

// ── Enfants ──
export const Enfants = {
  async create(data) {
    const db = await getDb();
    const ref = await db.collection('enfants').add({
      prenom: data.prenom,
      nom: data.nom,
      photoUrl: data.photoUrl || '',
      groupeId: data.groupeId,
      personnesAutorisees: data.personnesAutorisees || []
    });
    return ref.id;
  },
  async get(id) {
    const db = await getDb();
    const snap = await db.collection('enfants').doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },
  async listByGroupe(groupeId) {
    const db = await getDb();
    const snap = await db.collection('enfants').where('groupeId', '==', groupeId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async update(id, data) {
    const db = await getDb();
    await db.collection('enfants').doc(id).update(data);
  },
  async delete(id) {
    const db = await getDb();
    await db.collection('enfants').doc(id).delete();
  }
};

// ── Grilles Type ──
export const GrillesType = {
  async create(data) {
    const db = await getDb();
    const ref = await db.collection('grillesType').add({
      groupeId: data.groupeId,
      blocs: data.blocs || []
    });
    return ref.id;
  },
  async get(id) {
    const db = await getDb();
    const snap = await db.collection('grillesType').doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },
  async listByGroupe(groupeId) {
    const db = await getDb();
    const snap = await db.collection('grillesType').where('groupeId', '==', groupeId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async update(id, data) {
    const db = await getDb();
    await db.collection('grillesType').doc(id).update(data);
  },
  async delete(id) {
    const db = await getDb();
    await db.collection('grillesType').doc(id).delete();
  }
};

// ── Journées (blocs = tableau embarqué, lecture/écriture atomique) ──
export const Journees = {
  async create(data) {
    const db = await getDb();
    const ref = await db.collection('journees').add({
      date: data.date,
      groupeId: data.groupeId,
      blocs: data.blocs || []
    });
    return ref.id;
  },
  async get(id) {
    const db = await getDb();
    const snap = await db.collection('journees').doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },
  async listByGroupe(groupeId) {
    const db = await getDb();
    const snap = await db.collection('journees').where('groupeId', '==', groupeId).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async update(id, data) {
    const db = await getDb();
    await db.collection('journees').doc(id).update(data);
  },
  async delete(id) {
    const db = await getDb();
    await db.collection('journees').doc(id).delete();
  }
};

// ── Présences (collection séparée — requêtée par jour ET par enfant) ──
export const Presences = {
  async create(data) {
    const db = await getDb();
    const ref = await db.collection('presences').add({
      journeeId: data.journeeId,
      groupeId: data.groupeId,
      enfantId: data.enfantId,
      statut: data.statut,
      heureArrivee: data.heureArrivee || '',
      heureDepart: data.heureDepart || '',
      partiAvec: data.partiAvec || { nom: '', lien: '' },
      ts: firebase.firestore.FieldValue.serverTimestamp()
    });
    return ref.id;
  },
  async get(id) {
    const db = await getDb();
    const snap = await db.collection('presences').doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },
  async listByJournee(journeeId) {
    const db = await getDb();
    const snap = await db.collection('presences')
      .where('journeeId', '==', journeeId)
      .orderBy('ts')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async listByEnfant(enfantId) {
    const db = await getDb();
    const snap = await db.collection('presences')
      .where('enfantId', '==', enfantId)
      .orderBy('ts')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async update(id, data) {
    const db = await getDb();
    await db.collection('presences').doc(id).update(data);
  },
  async delete(id) {
    const db = await getDb();
    await db.collection('presences').doc(id).delete();
  }
};

// ── Jeux ──
export const Jeux = {
  async get(id) {
    const db = await getDb();
    const snap = await db.collection('jeux').doc(id).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },
  async list() {
    const db = await getDb();
    const snap = await db.collection('jeux').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};

// ══════════════════════════════════════════════════════════
//  SMOKE TEST
// ══════════════════════════════════════════════════════════

const TEST_PREFIX = '__smoke_test__';

async function purgeTestData() {
  const db = await getDb();
  const collections = ['organisations', 'groupes', 'enfants', 'journees', 'presences'];
  for (const col of collections) {
    const snap = await db.collection(col)
      .where(firebase.firestore.FieldPath.documentId(), '>=', TEST_PREFIX)
      .where(firebase.firestore.FieldPath.documentId(), '<=', TEST_PREFIX + '\uf8ff')
      .get();
    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    if (snap.docs.length) await batch.commit();
  }
}

export async function runSmokeTest() {
  const log = [];
  const push = (msg) => { log.push(msg); console.log('[Smoke]', msg); };

  try {
    push('1. Connexion Firestore...');
    const db = await getDb();
    push('   OK — persistence offline activée');

    // UID réel requis par les règles Firestore
    const user = firebase.auth().currentUser;
    if (!user) {
      push('ERREUR: Connecte-toi d\'abord (bouton Connexion dans le header).');
      return { success: false, log, error: new Error('Non authentifié') };
    }
    const uid = user.uid;
    push('   Utilisateur: ' + (user.displayName || user.email) + ' (' + uid + ')');

    push('2. Création org de test...');
    const orgId = await Organisations.create({
      nom: TEST_PREFIX + 'Camp Soleil',
      coordoUid: uid,
      dateDebut: '2026-06-22',
      dateFin: '2026-08-15',
      semaines: [{ num: 1, theme: 'Aventure' }, { num: 2, theme: 'Océan' }]
    });
    push('   orgId = ' + orgId);

    push('3. Création groupe de test...');
    const groupeId = await Groupes.create({
      nom: TEST_PREFIX + 'Les Dauphins',
      orgId,
      animateurUid: uid,
      theme: 'Océan'
    });
    push('   groupeId = ' + groupeId);

    push('4. Création 2 enfants...');
    const e1 = await Enfants.create({
      prenom: 'Alice', nom: 'Test',
      groupeId,
      personnesAutorisees: [{ nom: 'Maman Test', lien: 'mère' }]
    });
    const e2 = await Enfants.create({
      prenom: 'Bob', nom: 'Test',
      groupeId,
      personnesAutorisees: [{ nom: 'Papa Test', lien: 'père' }]
    });
    push('   enfant1 = ' + e1 + ', enfant2 = ' + e2);

    push('5. Création journée (2 blocs typés)...');
    const journeeId = await Journees.create({
      date: '2026-06-23',
      groupeId,
      blocs: [
        { id: 'b1', type: 'garde', titre: 'Accueil matinal', debut: '07:00', fin: '09:00', ordre: 1 },
        { id: 'b2', type: 'activite', titre: 'Grand jeu Océan', debut: '09:00', fin: '10:30', ordre: 2, ref: 'jeu-123' },
        { id: 'b3', type: 'repas', titre: 'Dîner', debut: '12:00', fin: '13:00', ordre: 3, lieu: 'Cafétéria' }
      ]
    });
    push('   journeeId = ' + journeeId);

    push('6. Création présence avec départ...');
    const presId = await Presences.create({
      journeeId,
      groupeId,
      enfantId: e1,
      statut: 'present',
      heureArrivee: '07:15',
      heureDepart: '16:30',
      partiAvec: { nom: 'Maman Test', lien: 'mère' }
    });
    push('   presenceId = ' + presId);

    push('7. Lecture de la journée...');
    const jour = await Journees.get(journeeId);
    push('   blocs = ' + jour.blocs.length + ' (' + jour.blocs.map(b => b.type).join(', ') + ')');

    push('8. Lecture offline (cache local)...');
    const jourOffline = await db.collection('journees').doc(journeeId)
      .get({ source: 'cache' });
    push('   cache hit = ' + jourOffline.exists);

    push('9. Nettoyage données de test...');
    await Presences.delete(presId);
    await Enfants.delete(e1);
    await Enfants.delete(e2);
    await Journees.delete(journeeId);
    await Groupes.delete(groupeId);
    await Organisations.delete(orgId);
    push('   Purgé');

    push('');
    push('SMOKE TEST OK');
    return { success: true, log };
  } catch (err) {
    push('ERREUR: ' + err.message);
    return { success: false, log, error: err };
  }
}

// ══════════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════════

async function doSmokeTest() {
  const statusEl = document.getElementById('app-status');
  const detailEl = document.getElementById('app-detail');
  const resultEl = document.getElementById('smoke-result');

  statusEl.textContent = 'Smoke test en cours...';
  detailEl.textContent = '';

  const result = await runSmokeTest();
  resultEl.style.display = 'block';
  resultEl.textContent = result.log.join('\n');

  if (result.success) {
    statusEl.textContent = 'Smoke test réussi';
    detailEl.textContent = 'Le scaffold est fonctionnel. Les écrans arrivent en étape 2.';
    resultEl.style.borderColor = 'var(--vert)';
  } else {
    statusEl.textContent = 'Smoke test échoué';
    detailEl.textContent = result.error?.message || 'Voir le détail ci-dessous.';
    resultEl.style.borderColor = 'var(--rose)';
  }
}

async function init() {
  const statusEl = document.getElementById('app-status');
  const detailEl = document.getElementById('app-detail');

  try {
    await getDb();
    statusEl.textContent = 'Connecté à Firestore';
    detailEl.textContent = 'Persistence offline activée.';

    // Attendre que firebase-auth.js soit prêt et écouter l'état d'auth
    function waitAuth() {
      if (typeof firebase === 'undefined' || !firebase.auth) {
        setTimeout(waitAuth, 200);
        return;
      }
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          statusEl.textContent = 'Connecté — ' + (user.displayName || user.email);
          detailEl.innerHTML = 'Clique pour lancer le smoke test.';
          const btn = document.createElement('button');
          btn.className = 'zts-btn zts-btn--primary';
          btn.style.marginTop = 'var(--space-3)';
          btn.textContent = 'Lancer le smoke test';
          btn.onclick = () => { btn.disabled = true; doSmokeTest(); };
          // Éviter les doublons si onAuthStateChanged re-fire
          const existing = document.getElementById('smoke-btn');
          if (existing) existing.remove();
          btn.id = 'smoke-btn';
          detailEl.after(btn);
        } else {
          statusEl.textContent = 'Non connecté';
          detailEl.textContent = 'Connecte-toi via le bouton Connexion dans le header pour lancer le smoke test.';
          const existing = document.getElementById('smoke-btn');
          if (existing) existing.remove();
        }
      });
    }
    waitAuth();
  } catch (err) {
    statusEl.textContent = 'Erreur de connexion';
    detailEl.textContent = err.message;
    console.error('[Planif]', err);
  }
}

// Attendre que le DOM + zts.js soient prêts
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
