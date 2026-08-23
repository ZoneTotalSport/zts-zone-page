/**
 * dataStore.js — couche donnees de Zone Inventaire.
 *
 * REGLE UNIQUE DE CE FICHIER : c'est le SEUL endroit du dossier qui parle a
 * Firestore et au Worker. app.js ne connait que InvData.* — meme discipline
 * que apps/planificateur/dataStore.js, dont ce module reprend le patron.
 *
 * MODELE DE DONNEES — deux collections plates, owner-only par `uid`, sur le
 * modele de `performances` et `plans` (firestore.rules) :
 *
 *   inventaires/{id}      { uid, nom, univers, annee, date, categories[], cree, maj }
 *   inventaireItems/{id}  { uid, invId, photos[], nom, marque, description,
 *                           categorie, emplacement, date, qteMain, qteAcheter,
 *                           etat, prix, notes, cree, maj }
 *
 * POURQUOI DEUX COLLECTIONS et pas un tableau d'objets dans le doc
 * d'inventaire : un document Firestore plafonne a 1 048 576 octets. Les
 * photos sont stockees en data-URI DANS le document de l'objet (decision du
 * 23 aout 2026 : pas de R2 en v1, pas de Firebase Storage qui imposerait
 * Blaze au projet entier). A 5 vignettes d'environ 45 Ko, un objet pese
 * jusqu'a ~300 Ko : un seul document pour tout un gymnase serait refuse par
 * Firestore des le douzieme objet. Un document PAR OBJET tient, et la garde
 * `verifiePoids` refuse l'ajout avant que Firestore ne le fasse — avec un
 * message lisible plutot qu'une erreur de quota.
 *
 * UN INVENTAIRE = UN LIEU ET UNE ANNEE (23 aout 2026). Le classeur, c'est le
 * LIEU — « Gymnase Saint-Jean » ; les feuilles, ce sont les ANNEES, en onglets
 * au bas de l'ecran, comme dans un tableur. Deux documents qui portent le meme
 * `nom` sont deux annees du meme lieu.
 *
 * Le lien se fait donc par le NOM et non par un identifiant de lieu. C'est le
 * choix le moins couteux : pas de deuxieme collection, pas de jointure, et
 * renommer un lieu se fait deja en une operation puisque le renommage
 * s'applique a toutes ses annees d'un coup (voir renommeInventaire).
 * Contrepartie assumee : deux lieux ne peuvent pas porter exactement le meme
 * nom — ils deviendraient un seul classeur.
 *
 * LES CATEGORIES VIVENT DANS LE DOCUMENT D'INVENTAIRE, pas dans une
 * collection a part (23 aout 2026, ajout C). Chaque lieu a les siennes, elles
 * se lisent avec l'inventaire — donc sans deuxieme aller-retour reseau au
 * chargement — et quinze categories a deux libelles pesent environ 1 Ko, tres
 * loin du plafond du document. Une collection separee aurait ajoute une
 * requete, un index et des regles pour aucun gain.
 *
 * Script classique, pas un module : charge AVANT app.js.
 */

const InvData = (() => {

  const COL_INV   = 'inventaires';
  const COL_ITEM  = 'inventaireItems';
  const API       = 'https://api.zonetotalsport.ca/inventaire-vision';

  const MAX_PHOTOS   = 5;
  // Plafond Firestore : 1 048 576 octets. On s'arrete a 900 000 pour laisser
  // la place aux champs texte, aux index et a l'encodage UTF-8 des accents.
  const MAX_DOC      = 900000;
  const CACHE_PREFIX = 'zts_inv_cache_';
  const CACHE_LISTE  = 'zts_inv_liste';

  // Point de DEPART, pas une liste fermee : l'usager renomme, ajoute et
  // supprime a sa guise (ajout C). Ces quinze-la sont seulement ce qu'un
  // inventaire tout neuf contient a sa creation, choisies pour couvrir les
  // trois univers du site.
  //
  // Les identifiants sont stables et ne changent JAMAIS quand un libelle
  // change : c'est `id` que les objets portent, et renommer « Ballons » en
  // « Ballons et balles » ne doit toucher aucun objet.
  const CATEGORIES_DEFAUT = [
    { id: 'ballons',         fr: 'Ballons',                  en: 'Balls' },
    { id: 'manipulation',    fr: 'Matériel de manipulation', en: 'Manipulative equipment' },
    { id: 'cones-dossards',  fr: 'Cônes et dossards',        en: 'Cones and pinnies' },
    { id: 'sport-collectif', fr: 'Sports collectifs',        en: 'Team sports' },
    { id: 'gymnastique',     fr: 'Gymnastique',              en: 'Gymnastics' },
    { id: 'jeux-societe',    fr: 'Jeux de société',          en: 'Board games' },
    { id: 'bricolage',       fr: 'Bricolage',                en: 'Craft supplies' },
    { id: 'eau',             fr: "Matériel d'eau",           en: 'Water equipment' },
    { id: 'plein-air',       fr: 'Plein air',                en: 'Outdoors' },
    { id: 'premiers-soins',  fr: 'Premiers soins',           en: 'First aid' },
    { id: 'audio-techno',    fr: 'Audio et techno',          en: 'Audio and tech' },
    { id: 'mobilier',        fr: 'Mobilier',                 en: 'Furniture' },
    { id: 'rangement',       fr: 'Rangement',                en: 'Storage' },
    { id: 'livres',          fr: 'Livres et albums',         en: 'Books' },
    { id: 'autre',           fr: 'Autre',                    en: 'Other' }
  ];

  /**
   * Annee SCOLAIRE courante, « 2026-2027 ».
   * Le decoupage tombe au 1er juillet et non au 1er janvier : un inventaire
   * de gymnase se fait a la rentree ou a la fin des classes, et personne au
   * Quebec n'appelle « 2026 » l'annee qui commence en septembre 2026.
   * @param {number} [decalage] 0 = courante, 1 = la suivante
   */
  function anneeScolaire(decalage) {
    const d = new Date();
    let debut = d.getFullYear();
    if (d.getMonth() < 6) debut -= 1;          // janvier a juin : annee entamee
    debut += (decalage || 0);
    return debut + '-' + (debut + 1);
  }

  /** L'annee scolaire qui suit « 2026-2027 » -> « 2027-2028 ». */
  function anneeSuivante(a) {
    const m = /^(\d{4})-(\d{4})$/.exec(String(a || ''));
    if (!m) return anneeScolaire(1);
    return (+m[1] + 1) + '-' + (+m[2] + 1);
  }

  function categoriesDefaut() {
    return CATEGORIES_DEFAUT.map((c) => Object.assign({}, c));
  }

  // Identifiant d'une categorie creee par l'usager. Prefixe `c-` pour qu'on
  // voie d'un coup d'oeil ce qui vient de la liste de depart et ce qui a ete
  // ajoute. Le compteur exclut toute collision au sein d'une meme session,
  // que l'horloge seule ne garantit pas quand on ajoute deux categories dans
  // la meme milliseconde.
  let _seqCat = 0;
  function nouvelIdCategorie() {
    return 'c-' + Date.now().toString(36) + '-' + (++_seqCat).toString(36);
  }

  // Un inventaire cree avant l'ajout C n'a pas de champ `categories`. Plutot
  // que d'ecrire une migration, on rend la liste de depart a la lecture : le
  // document se met a jour de lui-meme a la premiere modification.
  function normaliseCategories(liste) {
    if (!Array.isArray(liste) || !liste.length) return categoriesDefaut();
    const vues = new Set();
    const out = [];
    liste.forEach((c) => {
      if (!c || typeof c !== 'object') return;
      const id = String(c.id || '').slice(0, 60);
      if (!id || vues.has(id)) return;
      vues.add(id);
      out.push({
        id: id,
        fr: String(c.fr || '').slice(0, 60),
        en: String(c.en || '').slice(0, 60)
      });
    });
    return out.length ? out : categoriesDefaut();
  }

  let _db = null;
  let _user = null;
  let _pretResolve = null;
  const _pret = new Promise((r) => { _pretResolve = r; });

  /* ── Firebase : meme patron que apps/performances/app.js ──────────────── */

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
  function pret() { return _pret; }
  function connecte() { return !!_user; }

  /* ── Cache local : LECTURE hors-ligne seulement ───────────────────────
     Une ecriture hors-ligne serait perdue au prochain chargement, qui
     rafraichit depuis Firestore. On ne fait donc PAS semblant : app.js
     bloque l'ecriture quand le reseau est absent, et ce cache ne sert qu'a
     afficher le dernier etat connu. ------------------------------------- */

  const cache = {
    lireListe() {
      try { return JSON.parse(localStorage.getItem(CACHE_LISTE) || 'null'); }
      catch (e) { return null; }
    },
    ecrireListe(liste) {
      try { localStorage.setItem(CACHE_LISTE, JSON.stringify(liste)); } catch (e) {}
    },
    lire(invId) {
      try { return JSON.parse(localStorage.getItem(CACHE_PREFIX + invId) || 'null'); }
      catch (e) { return null; }
    },
    ecrire(invId, items) {
      // Le quota localStorage (~5 Mo) est atteignable : 40 objets a 5 photos
      // depassent. En cas de refus on vide les caches des AUTRES inventaires
      // et on retente une fois ; si ca echoue encore, on abandonne le cache
      // sans casser l'app — le mode hors-ligne est un bonus, pas un contrat.
      const payload = JSON.stringify(items);
      try { localStorage.setItem(CACHE_PREFIX + invId, payload); return true; }
      catch (e) {
        try {
          Object.keys(localStorage)
            .filter((k) => k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE_PREFIX + invId)
            .forEach((k) => localStorage.removeItem(k));
          localStorage.setItem(CACHE_PREFIX + invId, payload);
          return true;
        } catch (e2) { return false; }
      }
    },
    oublier(invId) {
      try { localStorage.removeItem(CACHE_PREFIX + invId); } catch (e) {}
    }
  };

  /* ── Inventaires ──────────────────────────────────────────────────────── */

  async function listeInventaires() {
    const d = await db();
    const s = await d.collection(COL_INV).where('uid', '==', uid()).get();
    const out = s.docs.map((x) => {
      const d = Object.assign({ id: x.id }, x.data());
      d.categories = normaliseCategories(d.categories);
      d.date = dateIso(d.date);
      d.annee = String(d.annee || '').slice(0, 12) || anneeScolaire();
      return d;
    });
    // Trie par lieu, puis par annee : c'est l'ordre des onglets.
    out.sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr') ||
                       (a.annee || '').localeCompare(b.annee || ''));
    cache.ecrireListe(out);
    return out;
  }

  async function creerInventaire(nom, univers) {
    const d = await db();
    const doc = {
      uid: uid(),
      nom: String(nom || '').slice(0, 120),
      univers: univers || 'ep',
      annee: anneeScolaire(),
      // Date de l'inventaire : vide a la creation. Tant qu'elle l'est,
      // l'impression retombe sur la date du jour — mais c'est bien la date
      // SAISIE qui fait foi des qu'il y en a une.
      date: '',
      categories: categoriesDefaut(),
      cree: Date.now(),
      maj: Date.now()
    };
    const ref = await d.collection(COL_INV).add(doc);
    return Object.assign({ id: ref.id }, doc);
  }

  async function majInventaire(id, patch) {
    const d = await db();
    await d.collection(COL_INV).doc(id).update(Object.assign({ maj: Date.now() }, patch));
  }

  // Firestore ne supprime pas en cascade : les objets partiraient en orphelins,
  // invisibles et facturables. On les efface explicitement, par lots de 400
  // (le plafond d'un batch est de 500 operations).
  async function supprimerInventaire(id) {
    const d = await db();
    const s = await d.collection(COL_ITEM).where('uid', '==', uid()).where('invId', '==', id).get();
    const docs = s.docs.slice();
    while (docs.length) {
      const lot = d.batch();
      docs.splice(0, 400).forEach((x) => lot.delete(x.ref));
      await lot.commit();
    }
    await d.collection(COL_INV).doc(id).delete();
    cache.oublier(id);
  }

  /**
   * Remplace la liste de categories d'un inventaire.
   * @param {string} id
   * @param {Array<{id:string,fr:string,en:string}>} cats
   */
  async function majCategories(id, cats) {
    const propre = normaliseCategories(cats);
    const d = await db();
    await d.collection(COL_INV).doc(id).update({ categories: propre, maj: Date.now() });
    return propre;
  }

  /**
   * Deplace tous les objets d'une categorie vers une autre. `vers` peut etre
   * la chaine vide : les objets deviennent « non classes ».
   *
   * Par lots de 400 — le plafond d'un batch Firestore est de 500 operations,
   * et une categorie d'un gros gymnase peut compter plus d'objets que ca.
   * @returns {Promise<number>} nombre d'objets deplaces
   */
  async function reassignerCategorie(invId, de, vers) {
    const d = await db();
    const s = await d.collection(COL_ITEM)
      .where('uid', '==', uid()).where('invId', '==', invId).get();
    const touches = s.docs.filter((x) => (x.data().categorie || '') === de);
    const restants = touches.slice();
    while (restants.length) {
      const lot = d.batch();
      restants.splice(0, 400).forEach((x) =>
        lot.update(x.ref, { categorie: vers || '', maj: Date.now() }));
      await lot.commit();
    }
    return touches.length;
  }

  /**
   * Ouvre une NOUVELLE ANNEE a partir d'une annee existante : meme lieu, memes
   * categories, et une copie de tous les objets.
   *
   * CE QUI EST REPRIS, ET CE QUI NE L'EST PAS. On recopie les objets, leurs
   * photos, leurs quantites en main, leur etat et leurs notes : c'est le meme
   * gymnase, le meme materiel, et repartir d'une feuille vide chaque annee
   * viderait la fonction de son sens. En revanche `qteAcheter` repart a ZERO —
   * la liste d'achats de l'an dernier a ete passee, la retrainer d'annee en
   * annee ferait racheter deux fois. La date de chaque objet est conservee :
   * c'est sa date d'achat, elle ne change pas parce qu'on tourne la page.
   *
   * Copie par lots de 400, plafond d'un batch Firestore etant de 500.
   * @returns {Promise<{inv:Object, copies:number}>}
   */
  async function ouvrirAnnee(invId, annee) {
    const source = (await listeInventaires()).find((x) => x.id === invId);
    if (!source) throw new Error('INVENTAIRE_INTROUVABLE');
    const d = await db();
    const doc = {
      uid: uid(),
      nom: source.nom,
      univers: source.univers,
      annee: String(annee || anneeSuivante(source.annee)).slice(0, 12),
      date: '',
      categories: normaliseCategories(source.categories),
      cree: Date.now(),
      maj: Date.now()
    };
    const ref = await d.collection(COL_INV).add(doc);
    const neuf = Object.assign({ id: ref.id }, doc);

    const s = await d.collection(COL_ITEM)
      .where('uid', '==', uid()).where('invId', '==', invId).get();
    const objets = s.docs.map((x) => x.data());
    const restants = objets.slice();
    while (restants.length) {
      const lot = d.batch();
      restants.splice(0, 400).forEach((o) => {
        const copie = Object.assign(normalise(o), {
          uid: uid(), invId: ref.id, qteAcheter: 0, cree: o.cree || Date.now(), maj: Date.now()
        });
        lot.set(d.collection(COL_ITEM).doc(), copie);
      });
      await lot.commit();
    }
    return { inv: neuf, copies: objets.length };
  }

  /* ── Objets ───────────────────────────────────────────────────────────── */

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

  function normalise(o) {
    return {
      photos:      Array.isArray(o.photos) ? o.photos.slice(0, MAX_PHOTOS) : [],
      nom:         String(o.nom || ''),
      marque:      String(o.marque || ''),
      description: String(o.description || ''),
      // Aucune validation contre une liste ici : depuis l'ajout C, les
      // categories appartiennent a l'inventaire et changent. Une chaine vide
      // est LEGITIME — c'est « non classe », l'etat d'un objet dont la
      // categorie a ete supprimee ou que l'IA n'a pas su ranger.
      categorie:   String(o.categorie || '').slice(0, 60),
      emplacement: String(o.emplacement || ''),
      // Date en ISO court, ou chaine vide. Le format ISO n'est pas un detail :
      // c'est le seul qui se trie comme du texte, qui alimente <input
      // type="date"> sans conversion, et qui ne se lit pas 03/04 a Montreal et
      // 04/03 ailleurs. L'affichage, lui, se localise a la lecture.
      date:        dateIso(o.date),
      qteMain:     Number.isFinite(+o.qteMain) ? Math.max(0, Math.round(+o.qteMain)) : 0,
      qteAcheter:  Number.isFinite(+o.qteAcheter) ? Math.max(0, Math.round(+o.qteAcheter)) : 0,
      etat:        ['neuf', 'bon', 'ok', 'remplacer'].indexOf(o.etat) >= 0 ? o.etat : 'bon',
      prix:        (o.prix === '' || o.prix == null || !Number.isFinite(+o.prix)) ? null : +o.prix,
      notes:       String(o.notes || '')
    };
  }

  // Poids reel du document, en octets UTF-8. `Blob` mesure exactement ce que
  // `length` sur une chaine JS sous-estime : un accent compte 2 octets, un
  // emoji 4. Sur des champs francais la difference se chiffre en kilo-octets.
  function poids(doc) {
    try { return new Blob([JSON.stringify(doc)]).size; }
    catch (e) { return JSON.stringify(doc).length * 2; }
  }

  /**
   * Verifie qu'un objet tient dans un document Firestore.
   * @returns {{ok:boolean, poids:number, max:number}}
   */
  function verifiePoids(item) {
    const p = poids(item);
    return { ok: p <= MAX_DOC, poids: p, max: MAX_DOC };
  }

  async function listeItems(invId) {
    const d = await db();
    const s = await d.collection(COL_ITEM).where('uid', '==', uid()).where('invId', '==', invId).get();
    const out = s.docs.map((x) => Object.assign({ id: x.id }, x.data()));
    out.sort((a, b) => (b.cree || 0) - (a.cree || 0));
    cache.ecrire(invId, out);
    return out;
  }

  async function creerItem(invId, data) {
    const d = await db();
    const doc = Object.assign(normalise(data || {}), {
      uid: uid(), invId: invId, cree: Date.now(), maj: Date.now()
    });
    const v = verifiePoids(doc);
    if (!v.ok) { const e = new Error('DOC_TROP_LOURD'); e.info = v; throw e; }
    const ref = await d.collection(COL_ITEM).add(doc);
    return Object.assign({ id: ref.id }, doc);
  }

  /**
   * Ecrit un correctif partiel. `complet` est l'objet tel qu'il sera APRES le
   * correctif : il sert uniquement a peser le document avant l'envoi, pour
   * que le refus vienne de nous, avec un message, et non de Firestore.
   */
  async function majItem(id, patch, complet) {
    if (complet) {
      const v = verifiePoids(complet);
      if (!v.ok) { const e = new Error('DOC_TROP_LOURD'); e.info = v; throw e; }
    }
    const d = await db();
    await d.collection(COL_ITEM).doc(id).update(Object.assign({ maj: Date.now() }, patch));
  }

  async function supprimerItem(id) {
    const d = await db();
    await d.collection(COL_ITEM).doc(id).delete();
  }

  /* ── IA vision ────────────────────────────────────────────────────────
     Le Worker `zts-generateur` porte la cle Anthropic ; le navigateur ne
     transporte qu'un jeton Firebase. Aucune cle cote client, jamais. ---- */

  /**
   * @param {string} base64     image SANS le prefixe data:
   * @param {string} mediaType  image/jpeg | image/png | image/webp
   * @param {string} lang       'fr' | 'en' — la langue des champs retournes
   * @param {Array} cats        categories de CET inventaire, envoyees au
   *                            modele pour qu'il choisisse parmi celles-la.
   *
   * DEPUIS L'AJOUT C, LA LISTE VIENT DU CLIENT. Elle ne peut plus etre figee
   * dans le worker : chaque inventaire a la sienne, et l'usager la modifie.
   * Le worker borne ce qu'il accepte (nombre, longueur, jeu de caracteres) et
   * n'attribue jamais une categorie hors de la liste recue — voir
   * handleInventaireVision.
   *
   * Le modele ne CREE jamais de categorie : s'il n'en trouve aucune qui
   * convienne, il propose un libelle dans `nouvelle`, et c'est l'usager qui
   * decide, en un tap.
   * @returns {Promise<{nom,marque,description,categorie,nouvelle}|null>}
   */
  async function vision(base64, mediaType, lang, cats) {
    if (!_user) throw new Error('NON_CONNECTE');
    const jeton = await _user.getIdToken();
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + jeton },
      body: JSON.stringify({
        image: base64,
        mediaType: mediaType,
        lang: lang === 'en' ? 'en' : 'fr',
        categories: (Array.isArray(cats) ? cats : []).slice(0, 40).map((c) => ({
          id: String(c.id || '').slice(0, 60),
          nom: String((lang === 'en' ? c.en : c.fr) || c.fr || c.id || '').slice(0, 60)
        }))
      })
    });
    if (!res.ok) {
      let m = 'HTTP ' + res.status;
      try { const j = await res.json(); m = j.message || j.error || m; } catch (e) {}
      const err = new Error(m); err.statut = res.status; throw err;
    }
    const j = await res.json();
    return j.objet || null;
  }

  return {
    pret, uid, connecte, cache,
    MAX_PHOTOS, MAX_DOC,
    listeInventaires, creerInventaire, majInventaire, supprimerInventaire,
    categoriesDefaut, nouvelIdCategorie, normaliseCategories,
    anneeScolaire, anneeSuivante, ouvrirAnnee,
    majCategories, reassignerCategorie,
    listeItems, creerItem, majItem, supprimerItem,
    normalise, verifiePoids, poids, dateIso,
    vision
  };
})();
