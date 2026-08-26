/**
 * dataStore.js — couche donnees de Zone Rencontres.
 *
 * REGLE UNIQUE DE CE FICHIER : c'est le SEUL endroit du dossier qui parle a
 * Firestore et au Worker. app.js ne connait que RencData.* — meme discipline
 * que apps/inventaire/dataStore.js et apps/planificateur/dataStore.js, dont
 * ce module reprend le patron.
 *
 * MODELE DE DONNEES — deux collections plates, owner-only :
 *
 *   rencontres/{id}            { uid, titre, date, type, dossier, animateur,
 *                                secretaire, participants[], notesBrutes,
 *                                transcription, sortieIA, sortieMode,
 *                                actions[{quoi, qui, echeance, fait}],
 *                                presences{nom:bool},
 *                                ordreDuJour[{texte, fait, debut, fin}],
 *                                cree, maj }
 *   rencontresDossiers/{uid}   { uid, dossiers[], maj }
 *
 * POURQUOI PAS users/{uid}/rencontres/{id}, qui etait le chemin propose. La
 * regle `match /users/{uid}` de firestore.rules n'a pas de `{document=**}` :
 * les sous-collections tombent donc dans le `if false` final et chaque
 * enregistrement aurait renvoye permission-denied. Voir le commentaire du
 * bloc `rencontres` dans firestore.rules, et le §2B de PRESCAN-RENCONTRES.md.
 *
 * UN SEUL DOCUMENT PAR RENCONTRE. Contrairement a l'inventaire, il n'y a rien
 * a scinder : un verbatim de 90 minutes pese environ 80 Ko de texte, loin du
 * plafond de 1 048 576 octets, et l'AUDIO N'EST JAMAIS STOCKE — il est
 * transcrit puis jete. `verifiePoids` refuse quand meme l'ecriture avant que
 * Firestore ne le fasse, avec un message lisible plutot qu'une erreur de
 * quota.
 *
 * LE BROUILLON LOCAL N'EST PAS UN CACHE DE LECTURE. C'est la difference de
 * fond avec l'inventaire, dont le cache local ne sert qu'a afficher le
 * dernier etat connu. Ici le local est une SOURCE : quelqu'un prend des notes
 * pendant un comite, le navigateur meurt, et ces notes doivent revenir. Elles
 * sont donc ecrites toutes les 10 secondes en local, elles portent leur
 * horodatage, et `fusionne()` les fait gagner sur la copie serveur quand
 * elles sont plus recentes. Un brouillon n'est efface qu'apres une ecriture
 * Firestore reussie.
 *
 * Script classique, pas un module : charge AVANT app.js.
 */

const RencData = (() => {

  const COL_RENC = 'rencontres';
  const COL_DOSS = 'rencontresDossiers';

  // Le worker `zts-generateur` sert api.zonetotalsport.ca. C'est LUI qui parle
  // a Workers AI ; le navigateur ne transporte qu'un jeton Firebase. Aucune
  // cle cote client, jamais.
  const API_TRANS = 'https://api.zonetotalsport.ca/rencontres-transcription';
  const API_IA    = 'https://api.zonetotalsport.ca/rencontres-ia';

  // Plafond Firestore : 1 048 576 octets. On s'arrete a 900 000 pour laisser
  // la place aux index et a l'encodage UTF-8 des accents.
  const MAX_DOC = 900000;

  const BROUILLON = 'zts_renc_brouillon_';
  // Identifiant du brouillon d'une rencontre pas encore ecrite au serveur.
  const NEUVE = '__neuve__';

  const TYPES = ['comite', 'statutaire', 'autre'];

  /* Les deux dossiers du cahier. Point de DEPART, pas une liste fermee :
     l'usager en ajoute, en renomme et en supprime. Les identifiants sont
     stables et ne changent JAMAIS quand un libelle change — c'est `id` que
     les rencontres portent, et renommer « Comites » en « Comites d'ecole » ne
     doit toucher aucune rencontre. */
  const DOSSIERS_DEFAUT = [
    { id: 'comites',     fr: 'Comités',     en: 'Committees' },
    { id: 'statutaires', fr: 'Statutaires', en: 'Staff meetings' }
  ];

  function dossiersDefaut() {
    return DOSSIERS_DEFAUT.map((d) => Object.assign({}, d));
  }

  // Identifiant d'un dossier cree par l'usager. Prefixe `d-` pour qu'on voie
  // d'un coup d'oeil ce qui vient de la liste de depart. Le compteur exclut
  // toute collision au sein d'une meme session, que l'horloge seule ne
  // garantit pas quand on cree deux dossiers dans la meme milliseconde.
  let _seqDoss = 0;
  function nouvelIdDossier() {
    return 'd-' + Date.now().toString(36) + '-' + (++_seqDoss).toString(36);
  }

  function normaliseDossiers(liste) {
    if (!Array.isArray(liste) || !liste.length) return dossiersDefaut();
    const vus = new Set();
    const out = [];
    liste.forEach((d) => {
      if (!d || typeof d !== 'object') return;
      const id = String(d.id || '').slice(0, 60);
      if (!id || vus.has(id)) return;
      vus.add(id);
      out.push({
        id: id,
        fr: String(d.fr || '').slice(0, 60),
        en: String(d.en || '').slice(0, 60)
      });
    });
    return out.length ? out : dossiersDefaut();
  }

  let _db = null;
  let _user = null;
  let _pretResolve = null;
  const _pret = new Promise((r) => { _pretResolve = r; });

  /* ── Firebase : meme patron que apps/inventaire ────────────────────────
     Le SDK Firestore n'est charge qu'a la demande : le mur d'inscription
     n'a besoin que de firebase-app et firebase-auth, et une page qui reste
     devant le mur n'a aucune raison de tirer 300 Ko de plus. -------------- */

  function attendFirebase() {
    return new Promise((resolve) => {
      if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) return resolve();
      const t = setInterval(() => {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
          clearInterval(t); resolve();
        }
      }, 100);
    });
  }

  function chargeFirestoreSDK() {
    if (typeof firebase !== 'undefined' && firebase.firestore) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore-compat.js';
      s.onload = resolve;
      s.onerror = () => reject(new Error('Firestore SDK indisponible'));
      document.head.appendChild(s);
    });
  }

  async function db() {
    if (_db) return _db;
    await attendFirebase();
    await chargeFirestoreSDK();
    _db = firebase.firestore();
    return _db;
  }

  // zts-gate.js emet `zts:auth` une fois le mur franchi.
  document.addEventListener('zts:auth', (e) => {
    _user = (e.detail && e.detail.user) || null;
    if (_user) _pretResolve(_user);
  });

  function uid() { return _user ? _user.uid : null; }

  /**
   * Le garde-fou des ecritures. Sans lui, une session expiree fait remonter le
   * message BRUT du SDK jusqu'a l'ecran — vu au navigateur le 24 aout :
   * « Function CollectionReference.doc() cannot be called with an empty path ».
   * C'est du charabia pour un enseignant, et ca ne dit pas quoi faire.
   *
   * Le mur d'inscription rend ce cas rare, pas impossible : un jeton expire
   * pendant qu'une rencontre est ouverte, et la premiere ecriture tombe ici.
   */
  function exigeUid() {
    const u = uid();
    // Le texte vient du dictionnaire de l'app : ce message atteint l'ecran.
    // « session » est aussi un mot technique — il ne dit rien a personne.
    if (!u) throw new Error(RencI18n.t('etat.reconnecte'));
    return u;
  }
  function pret() { return _pret; }
  function connecte() { return !!_user; }
  function enLigne() { return navigator.onLine !== false; }

  /* ══════════════════════════════════════════════════════════════════════
     BROUILLON LOCAL
     ══════════════════════════════════════════════════════════════════════ */

  const brouillon = {
    cle(id) { return BROUILLON + (id || NEUVE); },

    lire(id) {
      try { return JSON.parse(localStorage.getItem(this.cle(id)) || 'null'); }
      catch (e) { return null; }
    },

    /**
     * Ecrit le brouillon. Retourne false si le stockage refuse — l'appelant
     * doit alors le DIRE, pas l'avaler : un brouillon qu'on croit ecrit et
     * qui ne l'est pas, c'est exactement la panne qu'on cherche a eviter.
     */
    ecrire(id, data) {
      try {
        localStorage.setItem(this.cle(id), JSON.stringify(
          Object.assign({}, data, { _local: Date.now() })));
        return true;
      } catch (e) {
        // Quota plein : on purge les brouillons des rencontres DEJA ecrites
        // au serveur (elles sont recuperables) et on retente une fois. Le
        // brouillon courant, lui, n'est jamais sacrifie.
        try {
          const courante = this.cle(id);
          Object.keys(localStorage)
            .filter((k) => k.indexOf(BROUILLON) === 0 && k !== courante)
            .forEach((k) => localStorage.removeItem(k));
          localStorage.setItem(this.cle(id), JSON.stringify(
            Object.assign({}, data, { _local: Date.now() })));
          return true;
        } catch (e2) { return false; }
      }
    },

    oublier(id) {
      try { localStorage.removeItem(this.cle(id)); } catch (e) {}
    },

    /** Les identifiants de toutes les rencontres qui ont un brouillon en attente. */
    enAttente() {
      try {
        return Object.keys(localStorage)
          .filter((k) => k.indexOf(BROUILLON) === 0)
          .map((k) => k.slice(BROUILLON.length));
      } catch (e) { return []; }
    }
  };

  /**
   * Reconcilie la copie serveur et le brouillon local d'une meme rencontre.
   *
   * LE PLUS RECENT GAGNE, ET C'EST LE LOCAL QUI PORTE L'HORODATAGE LE PLUS
   * FIABLE : il est ecrit au moment ou l'usager tape, alors que `maj` cote
   * serveur date de la derniere ecriture reussie. Un brouillon posterieur a
   * `maj` est donc, par construction, du travail que le serveur n'a jamais
   * vu — un plantage, un onglet ferme, un reseau tombe.
   *
   * @returns {{doc:Object, restaure:boolean}}
   */
  function fusionne(serveur, local) {
    if (!local) return { doc: serveur, restaure: false };
    if (!serveur) return { doc: local, restaure: true };
    const t = Number(local._local || 0);
    if (t > Number(serveur.maj || 0)) {
      // On garde l'identite du document serveur : un brouillon ne doit
      // jamais pouvoir reecrire `uid`, `id` ni `cree`.
      return {
        doc: Object.assign({}, local, {
          id: serveur.id, uid: serveur.uid, cree: serveur.cree, maj: serveur.maj
        }),
        restaure: true
      };
    }
    return { doc: serveur, restaure: false };
  }

  /* ══════════════════════════════════════════════════════════════════════
     NORMALISATION
     ══════════════════════════════════════════════════════════════════════ */

  /**
   * Ramene n'importe quelle entree a « AAAA-MM-JJ » ou a la chaine vide.
   * Une date invalide devient vide plutot que d'etre conservee telle quelle :
   * une valeur a moitie juste dans un champ de date est pire que pas de date.
   */
  function dateIso(v) {
    const t = String(v == null ? '' : v).trim().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) return '';
    const d = new Date(t + 'T12:00:00');
    if (isNaN(d.getTime())) return '';
    // Rejette le 31 fevrier, que la seule expression reguliere laisserait passer.
    return d.toISOString().slice(0, 10) === t ? t : '';
  }

  /** La date du jour en ISO court, en heure LOCALE.
      `toISOString()` seul renverrait la veille apres 20 h a Montreal : il
      travaille en UTC. */
  function aujourdhui() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
      .toISOString().slice(0, 10);
  }

  function texte(v, n) {
    return (typeof v === 'string' ? v : '').slice(0, n);
  }

  /**
   * Une action a faire. `qui` et `echeance` sont facultatifs — l'IA ne les
   * trouve pas toujours, et une action sans responsable vaut mieux qu'une
   * action perdue.
   */
  function normaliseAction(a) {
    if (!a || typeof a !== 'object') return null;
    // `quoi`, et pas `texte` : c'est le nom fixe par le §1 du cahier v2, et
    // c'est celui que la vue « Mes actions » de la vague H attendra. Renommer
    // un champ apres qu'il soit en production coute une migration ; le faire
    // maintenant ne coute rien. On accepte `texte` en lecture pour ne pas
    // perdre les rencontres ecrites avant ce correctif.
    const q = texte(a.quoi || a.texte, 400).trim();
    if (!q) return null;
    return {
      quoi: q,
      qui: texte(a.qui, 80),
      echeance: dateIso(a.echeance),
      fait: !!a.fait
    };
  }

  function normalise(o) {
    o = o || {};
    return {
      titre:       texte(o.titre, 140),
      date:        dateIso(o.date) || aujourdhui(),
      type:        TYPES.indexOf(o.type) >= 0 ? o.type : 'comite',
      // Chaine vide LEGITIME : c'est « non classee », l'etat d'une rencontre
      // dont le dossier a ete supprime.
      dossier:     texte(o.dossier, 60),
      animateur:   texte(o.animateur, 80),
      secretaire:  texte(o.secretaire, 80),
      // Les participants sont saisis en une ligne separee par des virgules.
      // On les range en TABLEAU des l'ecriture : la liste de presences
      // cochable de la vague H les reprendra telle quelle, sans migration.
      participants: (Array.isArray(o.participants)
        ? o.participants
        : String(o.participants || '').split(','))
        .map((p) => String(p).trim())
        .filter(Boolean)
        .slice(0, 60)
        .map((p) => p.slice(0, 80)),
      // Les notes prises a la main. HTML restreint (titres, listes, gras,
      // cases a cocher) — l'assainissement vit dans app.js, au plus pres de
      // l'editeur qui le produit.
      notesBrutes:   texte(o.notesBrutes, 400000),
      // Le texte venu du micro ou du fichier importe. Jamais ecrase par
      // l'IA : c'est l'onglet « Original ».
      transcription: texte(o.transcription, 400000),
      // Le compte rendu, modifiable a la main apres coup.
      sortieIA:      texte(o.sortieIA, 400000),
      sortieMode:    (o.sortieMode === 'verbatim' || o.sortieMode === 'structure')
                       ? o.sortieMode : '',
      actions:     (Array.isArray(o.actions) ? o.actions : [])
                     .map(normaliseAction).filter(Boolean).slice(0, 200),
      /* L'ORDRE DU JOUR, ET SES HORODATAGES.
         Chaque point porte `debut` et `fin` en SECONDES depuis le debut de
         l'enregistrement — pas en heure d'horloge. C'est ce qui permet de
         decouper l'audio dessus : une heure d'horloge serait inutilisable, il
         faudrait connaitre l'instant exact ou l'enregistrement a commence, et
         une pause de dix minutes fausserait tout. Les secondes enregistrees,
         elles, correspondent exactement a la position dans le fichier. */
      ordreDuJour: (Array.isArray(o.ordreDuJour) ? o.ordreDuJour : [])
        .map((x) => {
          if (!x || typeof x !== 'object') return null;
          const t = String(x.texte || '').trim().slice(0, 300);
          if (!t) return null;
          const num = (v) => (Number.isFinite(+v) && +v >= 0) ? Math.round(+v) : null;
          return { texte: t, fait: !!x.fait, debut: num(x.debut), fin: num(x.fin) };
        })
        .filter(Boolean).slice(0, 60),
      // Presences : un objet { « nom » : true|false }, et non un tableau de
      // presents. La difference compte — un tableau ne distingue pas « absent »
      // de « pas encore pointe », et une liste de presences qui ne dit pas qui
      // manquait ne sert a rien.
      presences:   (function (v) {
        if (!v || typeof v !== 'object' || Array.isArray(v)) return {};
        const out = {};
        Object.keys(v).slice(0, 60).forEach((k) => {
          const nom = String(k).trim().slice(0, 80);
          if (nom) out[nom] = !!v[k];
        });
        return out;
      })(o.presences)
    };
  }

  // Poids reel du document, en octets UTF-8. `Blob` mesure exactement ce que
  // `length` sur une chaine JS sous-estime : un accent compte 2 octets, un
  // emoji 4. Sur un compte rendu francais la difference se chiffre en
  // kilo-octets.
  function poids(doc) {
    try { return new Blob([JSON.stringify(doc)]).size; }
    catch (e) { return JSON.stringify(doc).length * 2; }
  }

  /** @returns {{ok:boolean, poids:number, max:number}} */
  function verifiePoids(doc) {
    const p = poids(doc);
    return { ok: p <= MAX_DOC, poids: p, max: MAX_DOC };
  }

  /* ══════════════════════════════════════════════════════════════════════
     DOSSIERS
     ══════════════════════════════════════════════════════════════════════ */

  async function lireDossiers() {
    const d = await db();
    const s = await d.collection(COL_DOSS).doc(exigeUid()).get();
    return normaliseDossiers(s.exists ? s.data().dossiers : null);
  }

  async function majDossiers(liste) {
    const propre = normaliseDossiers(liste);
    const d = await db();
    await d.collection(COL_DOSS).doc(exigeUid()).set({
      uid: exigeUid(), dossiers: propre, maj: Date.now()
    });
    return propre;
  }

  /* ══════════════════════════════════════════════════════════════════════
     RENCONTRES
     ══════════════════════════════════════════════════════════════════════ */

  async function listeRencontres() {
    const d = await db();
    const s = await d.collection(COL_RENC).where('uid', '==', exigeUid()).get();
    const out = s.docs.map((x) => Object.assign({ id: x.id }, x.data()));
    // Tri par date decroissante, puis par derniere modification : la
    // rencontre d'aujourd'hui est en haut, et deux rencontres du meme jour se
    // classent par ce qui a bouge en dernier.
    out.sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))
                       || (b.maj || 0) - (a.maj || 0));
    return out;
  }

  async function creerRencontre(data) {
    const d = await db();
    const doc = Object.assign(normalise(data), {
      uid: exigeUid(), cree: Date.now(), maj: Date.now()
    });
    const v = verifiePoids(doc);
    if (!v.ok) { const e = new Error('DOC_TROP_LOURD'); e.info = v; throw e; }
    const ref = await d.collection(COL_RENC).add(doc);
    return Object.assign({ id: ref.id }, doc);
  }

  /**
   * Ecrit la rencontre complete. `set` avec fusion plutot qu'`update` : la
   * vague E reecrit `sortieIA` et `actions` ensemble, et un `update` sur un
   * document efface entre-temps par un autre onglet echouerait au lieu de le
   * recreer.
   */
  async function majRencontre(id, data) {
    const doc = Object.assign(normalise(data), { uid: exigeUid(), maj: Date.now() });
    const v = verifiePoids(doc);
    if (!v.ok) { const e = new Error('DOC_TROP_LOURD'); e.info = v; throw e; }
    const d = await db();
    await d.collection(COL_RENC).doc(id).set(doc, { merge: true });
    return Object.assign({ id: id }, doc);
  }

  async function supprimerRencontre(id) {
    const d = await db();
    await d.collection(COL_RENC).doc(id).delete();
    brouillon.oublier(id);
  }

  /**
   * Deplace toutes les rencontres d'un dossier vers un autre. `vers` peut
   * etre la chaine vide : elles deviennent « non classees ».
   *
   * SUPPRIMER UN DOSSIER NE SUPPRIME JAMAIS SON CONTENU — exigence du cahier.
   * Par lots de 400, le plafond d'un batch Firestore etant de 500 operations.
   * @returns {Promise<number>} nombre de rencontres deplacees
   */
  async function reassignerDossier(de, vers) {
    const d = await db();
    const s = await d.collection(COL_RENC).where('uid', '==', exigeUid()).get();
    const touchees = s.docs.filter((x) => (x.data().dossier || '') === de);
    const restantes = touchees.slice();
    while (restantes.length) {
      const lot = d.batch();
      restantes.splice(0, 400).forEach((x) =>
        lot.update(x.ref, { dossier: vers || '', maj: Date.now() }));
      await lot.commit();
    }
    return touchees.length;
  }

  /* ══════════════════════════════════════════════════════════════════════
     TRANSCRIPTION — le reseau, et rien que le reseau

     Le decodage, le reechantillonnage et le decoupage vivent dans
     transcription.js : ce sont des calculs, ils ne regardent pas cette
     couche. Ce qui est ici, c'est ce qui SORT de la machine — et c'est
     precisement ce que ce fichier a pour regle de centraliser.
     ══════════════════════════════════════════════════════════════════════ */

  async function jeton() {
    if (!_user) throw new Error('NON_CONNECTE');
    return await _user.getIdToken();
  }

  async function lisErreur(res) {
    let m = 'HTTP ' + res.status;
    let code = '';
    try { const j = await res.json(); m = j.message || j.error || m; code = j.code || ''; }
    catch (e) {}
    const err = new Error(m);
    err.statut = res.status;
    err.code = code;
    return err;
  }

  /**
   * Ce que la transcription coutera, et ce qu'il reste au compteur du jour.
   * Appele AVANT de lancer quoi que ce soit : l'usager voit la duree detectee
   * et l'etat de son quota avant d'appuyer.
   * @returns {Promise<{secondes,minutesDemandees,minutesRestantes,plafondJour,suffisant,longue}>}
   */
  async function devisTranscription(secondes) {
    const res = await fetch(API_TRANS + '?action=devis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (await jeton()) },
      body: JSON.stringify({ secondes: secondes })
    });
    if (!res.ok) throw await lisErreur(res);
    return await res.json();
  }

  /**
   * Envoie UN segment et rend son texte.
   *
   * Le corps est le WAV BRUT, pas du JSON : un segment de 5 minutes pese
   * 9,6 Mo, et l'encoder en base64 en ajouterait 3,2 — sur un worker borne a
   * 128 Mo de memoire, ce n'est pas cosmetique. Les metadonnees passent donc
   * par la query string.
   *
   * @param {ArrayBuffer} wav  WAV 16 kHz mono 16 bits
   */
  async function transcrisSegment(wav, secondes, index, lang) {
    const q = '?action=segment&secondes=' + encodeURIComponent(Math.round(secondes))
            + '&index=' + encodeURIComponent(index)
            + '&lang=' + (lang === 'en' ? 'en' : 'fr');
    const res = await fetch(API_TRANS + q, {
      method: 'POST',
      headers: { 'Content-Type': 'audio/wav', 'Authorization': 'Bearer ' + (await jeton()) },
      body: wav
    });
    if (!res.ok) throw await lisErreur(res);
    return await res.json();
  }

  /**
   * Traitement IA d'un compte rendu.
   *
   * @param {'verbatim'|'structure'|'passage'} mode
   * @param {string} texte   pour `verbatim`, UN BLOC — voir RencIA.blocs()
   * @param {'haiku'|'sonnet'} modele
   * @param {string} lang
   * @param {string} dateRencontre  AAAA-MM-JJ — ancre les echeances relatives
   * @returns {Promise<Object>} `{texte}` pour verbatim et passage,
   *                            `{sortie:{resume,points,decisions,actions,reportes}}`
   *                            pour structure
   */
  async function traiteIA(mode, texte, modele, lang, dateRencontre, points) {
    const res = await fetch(API_IA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + (await jeton()) },
      body: JSON.stringify({
        mode: mode, texte: texte,
        modele: modele === 'sonnet' ? 'sonnet' : 'haiku',
        lang: lang === 'en' ? 'en' : 'fr',
        // La date ancre les echeances relatives : « avant le 30 septembre »
        // n'a de sens que rapporte au jour de la rencontre.
        dateRencontre: dateIso(dateRencontre),
        // Les intitules de l'ordre du jour, quand il y en a un. Le worker
        // rend alors un compte rendu SECTIONNE par point plutot qu'a plat —
        // et c'est toujours UN SEUL appel.
        points: Array.isArray(points)
          ? points.map((p) => String(p || '').trim().slice(0, 300)).filter(Boolean).slice(0, 60)
          : undefined
      })
    });
    if (!res.ok) throw await lisErreur(res);
    return await res.json();
  }

  return {
    pret, uid, connecte, enLigne, jeton,
    devisTranscription, transcrisSegment, traiteIA,
    MAX_DOC, TYPES, NEUVE,
    brouillon, fusionne,
    dossiersDefaut, nouvelIdDossier, normaliseDossiers,
    lireDossiers, majDossiers,
    listeRencontres, creerRencontre, majRencontre, supprimerRencontre,
    reassignerDossier,
    normalise, normaliseAction, verifiePoids, poids, dateIso, aujourdhui
  };
})();
