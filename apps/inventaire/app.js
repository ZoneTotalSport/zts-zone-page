/**
 * app.js — Zone Inventaire. Interface, i18n, photos, tableau.
 *
 * Ne parle JAMAIS a Firestore ni au Worker en direct : tout passe par
 * InvData (dataStore.js). Voir l'entete de ce fichier-la pour le modele.
 *
 * Bilingue FR/EN via ZTS.getLang() et l'evenement zts:langchange, comme les
 * autres apps du gabarit. FR par defaut.
 */
(function () {
  'use strict';

  /* ======================================================================
     1. REFERENTIELS
     ====================================================================== */

  // ⚠ MIROIR DU WORKER. La meme liste de cles vit dans
  // cf-worker/generateur/src/generateur-worker.js (handleInventaireVision) :
  // c'est elle que l'IA a le droit de retourner. Ajouter une categorie ici
  // sans l'ajouter la-bas donne une categorie que l'IA ne choisira jamais ;
  // l'inverse donne une cle que le <select> ne sait pas afficher.
  const CATEGORIES = [
    'ballons', 'manipulation', 'cones-dossards', 'sport-collectif',
    'gymnastique', 'jeux-societe', 'bricolage', 'eau', 'plein-air',
    'premiers-soins', 'audio-techno', 'mobilier', 'rangement', 'livres', 'autre'
  ];

  const UNIVERS = ['ep', 'camp', 'sdg'];
  const ETATS   = ['neuf', 'bon', 'ok', 'remplacer'];

  // Colonnes du tableau, dans l'ordre exige par le cahier des charges.
  // tri:false = colonne non triable (photo, actions).
  const COLONNES = [
    { c: 'photo',       tri: false },
    { c: 'nom',         tri: true, type: 'txt' },
    { c: 'marque',      tri: true, type: 'txt' },
    { c: 'description', tri: true, type: 'zone' },
    { c: 'categorie',   tri: true, type: 'cat' },
    { c: 'emplacement', tri: true, type: 'txt' },
    { c: 'qteMain',     tri: true, type: 'nb' },
    { c: 'qteAcheter',  tri: true, type: 'nb' },
    { c: 'etat',        tri: true, type: 'etat' },
    { c: 'prix',        tri: true, type: 'prix' },
    { c: 'notes',       tri: true, type: 'zone' },
    { c: 'actions',     tri: false }
  ];

  const T = {
    fr: {
      pill: 'Inventaire du matériel',
      titre: 'INVENTAIRE DU MATÉRIEL',
      intro: 'Photographie un objet : l’IA lit le nom, la marque et la catégorie, et la ligne s’ajoute au tableau. Corrige ce que tu veux, ça se sauvegarde tout seul. Un inventaire par lieu — gymnase, camp, service de garde.',
      selLbl: 'Inventaire',
      nouveau: '+ Nouvel inventaire', renommer: '✏️ Renommer', supprInv: '🗑️ Supprimer',
      capTitre: '📷 Ajouter un objet',
      capNote: 'Prends la photo de l’objet. Elle est réduite sur ton appareil avant l’envoi : rien de lourd ne quitte le téléphone.',
      prendre: '📷 Prendre une photo', televerser: '🖼️ Choisir une image', vide: '➕ Ligne vide',
      chercher: 'Rechercher…',
      toutesCat: 'Toutes les catégories', tousUniv: 'Tous les univers', tousEtats: 'Tous les états',
      reset: '↺ Réinitialiser',
      achats: '🛒 Liste d’achats', csv: '⬇️ Export CSV', imprimer: '🖨️ Imprimer',
      col: {
        photo: 'Photo', nom: 'Nom de l’objet', marque: 'Marque', description: 'Description',
        categorie: 'Catégorie', emplacement: 'Emplacement', qteMain: 'Qté en main',
        qteAcheter: 'Qté à acheter', etat: 'État', prix: 'Prix ($)', notes: 'Notes', actions: ''
      },
      cat: {
        ballons: 'Ballons', manipulation: 'Matériel de manipulation',
        'cones-dossards': 'Cônes et dossards', 'sport-collectif': 'Sports collectifs',
        gymnastique: 'Gymnastique', 'jeux-societe': 'Jeux de société', bricolage: 'Bricolage',
        eau: 'Matériel d’eau', 'plein-air': 'Plein air', 'premiers-soins': 'Premiers soins',
        'audio-techno': 'Audio et techno', mobilier: 'Mobilier', rangement: 'Rangement',
        livres: 'Livres et albums', autre: 'Autre'
      },
      univ: { ep: 'Éducation physique', camp: 'Camp de jour', sdg: 'Service de garde' },
      etat: { neuf: 'Neuf', bon: 'Bon état', ok: 'OK', remplacer: 'À remplacer' },
      stat: { objets: 'objets', valeur: 'valeur du parc', racheter: 'à racheter', photos: 'photos' },
      vide: 'Aucun objet ne correspond. Prends une photo pour commencer.',
      videInv: 'Cet inventaire est vide. Prends une photo pour ajouter ton premier objet.',
      // Messages
      mAnalyse: '🔎 Analyse de la photo par l’IA…',
      mAjoute: (n) => '✅ « ' + n + ' » ajouté.',
      mEchecIA: (m) => '⚠️ Identification impossible (' + m + '). La ligne est créée, remplis-la à la main.',
      mHorsLigne: '📴 Hors ligne : lecture seule. Tes objets sont affichés depuis le cache local ; aucune modification ne sera enregistrée.',
      mLecture: '⏳ Chargement…',
      mSauve: '💾 Enregistré.',
      mErrSauve: (m) => '⚠️ Enregistrement refusé : ' + m,
      mMaxPhotos: (n) => '⚠️ Maximum ' + n + ' photos par objet. Supprime-en une avant d’en ajouter.',
      mTropLourd: (ko, max) => '⚠️ Cet objet pèserait ' + ko + ' Ko, au-delà de la limite de ' + max + ' Ko par fiche. Supprime une photo avant d’en ajouter une autre.',
      mImageIllisible: '⚠️ Image illisible. Essaie une autre photo.',
      // Modales
      photos: 'Photos', photoDe: (i, n) => 'Photo ' + i + ' sur ' + n,
      photoAucune: 'Aucune photo pour cet objet.',
      principale: '⭐ Photo principale', estPrincipale: '⭐ Déjà principale',
      photoAjout: '➕ Ajouter une vue', photoSuppr: '🗑️ Supprimer cette photo',
      achatsTitre: 'Liste d’achats', achatsVide: 'Rien à acheter : aucune quantité à acheter et aucun objet à remplacer.',
      achatsRaison: { qte: 'à acheter', etat: 'à remplacer' },
      achatsTotal: (n, v) => n + ' article(s) — total estimé ' + v,
      achatsNote: 'Généré depuis',
      // Invites
      pNom: 'Nom de l’inventaire (ex. : Gymnase école Saint-Jean)',
      pUniv: 'Univers — tape 1 pour Éducation physique, 2 pour Camp de jour, 3 pour Service de garde',
      pSupprInv: (n) => 'Supprimer l’inventaire « ' + n + ' » et TOUS ses objets ? Cette action est définitive.',
      pSupprItem: (n) => 'Supprimer « ' + n + ' » ?',
      objetSansNom: 'Objet sans nom',
      premier: 'Mon premier inventaire',
      ajouterPhoto: '+ photo', voirPhotos: 'Photos', supprimer: 'Supprimer'
    },
    en: {
      pill: 'Equipment inventory',
      titre: 'EQUIPMENT INVENTORY',
      intro: 'Photograph an item: the AI reads its name, brand and category, and the row is added to the table. Fix anything you like — it saves itself. One inventory per place — gym, camp, after-school care.',
      selLbl: 'Inventory',
      nouveau: '+ New inventory', renommer: '✏️ Rename', supprInv: '🗑️ Delete',
      capTitre: '📷 Add an item',
      capNote: 'Take a photo of the item. It is resized on your device before upload: nothing heavy leaves the phone.',
      prendre: '📷 Take a photo', televerser: '🖼️ Choose an image', vide: '➕ Blank row',
      chercher: 'Search…',
      toutesCat: 'All categories', tousUniv: 'All settings', tousEtats: 'All conditions',
      reset: '↺ Reset',
      achats: '🛒 Shopping list', csv: '⬇️ Export CSV', imprimer: '🖨️ Print',
      col: {
        photo: 'Photo', nom: 'Item name', marque: 'Brand', description: 'Description',
        categorie: 'Category', emplacement: 'Location', qteMain: 'Qty on hand',
        qteAcheter: 'Qty to buy', etat: 'Condition', prix: 'Price ($)', notes: 'Notes', actions: ''
      },
      cat: {
        ballons: 'Balls', manipulation: 'Manipulative equipment',
        'cones-dossards': 'Cones and pinnies', 'sport-collectif': 'Team sports',
        gymnastique: 'Gymnastics', 'jeux-societe': 'Board games', bricolage: 'Craft supplies',
        eau: 'Water equipment', 'plein-air': 'Outdoors', 'premiers-soins': 'First aid',
        'audio-techno': 'Audio and tech', mobilier: 'Furniture', rangement: 'Storage',
        livres: 'Books', autre: 'Other'
      },
      univ: { ep: 'Physical education', camp: 'Day camp', sdg: 'After-school care' },
      etat: { neuf: 'New', bon: 'Good condition', ok: 'OK', remplacer: 'To replace' },
      stat: { objets: 'items', valeur: 'inventory value', racheter: 'to buy', photos: 'photos' },
      vide: 'No item matches. Take a photo to get started.',
      videInv: 'This inventory is empty. Take a photo to add your first item.',
      mAnalyse: '🔎 AI is reading the photo…',
      mAjoute: (n) => '✅ "' + n + '" added.',
      mEchecIA: (m) => '⚠️ Identification failed (' + m + '). The row was created — fill it in by hand.',
      mHorsLigne: '📴 Offline: read only. Your items come from the local cache; no change will be saved.',
      mLecture: '⏳ Loading…',
      mSauve: '💾 Saved.',
      mErrSauve: (m) => '⚠️ Save refused: ' + m,
      mMaxPhotos: (n) => '⚠️ Maximum ' + n + ' photos per item. Delete one before adding another.',
      mTropLourd: (ko, max) => '⚠️ This item would weigh ' + ko + ' KB, over the ' + max + ' KB limit per record. Delete a photo before adding another.',
      mImageIllisible: '⚠️ Unreadable image. Try another photo.',
      photos: 'Photos', photoDe: (i, n) => 'Photo ' + i + ' of ' + n,
      photoAucune: 'No photo for this item.',
      principale: '⭐ Set as main photo', estPrincipale: '⭐ Already the main photo',
      photoAjout: '➕ Add a view', photoSuppr: '🗑️ Delete this photo',
      achatsTitre: 'Shopping list', achatsVide: 'Nothing to buy: no quantity to buy and no item to replace.',
      achatsRaison: { qte: 'to buy', etat: 'to replace' },
      achatsTotal: (n, v) => n + ' item(s) — estimated total ' + v,
      achatsNote: 'Generated from',
      pNom: 'Inventory name (e.g. Saint-Jean School gym)',
      pUniv: 'Setting — type 1 for Physical education, 2 for Day camp, 3 for After-school care',
      pSupprInv: (n) => 'Delete inventory "' + n + '" and ALL its items? This cannot be undone.',
      pSupprItem: (n) => 'Delete "' + n + '"?',
      objetSansNom: 'Unnamed item',
      premier: 'My first inventory',
      ajouterPhoto: '+ photo', voirPhotos: 'Photos', supprimer: 'Delete'
    }
  };

  function L() { return T[(window.ZTS && ZTS.getLang && ZTS.getLang()) === 'en' ? 'en' : 'fr']; }
  function lang() { return (window.ZTS && ZTS.getLang && ZTS.getLang()) === 'en' ? 'en' : 'fr'; }

  /* ======================================================================
     2. ETAT
     ====================================================================== */

  const S = {
    inventaires: [],
    invId: null,
    items: [],
    tri: { col: 'nom', sens: 1 },
    f: { q: '', cat: '*', univ: '*', etat: '*' },
    horsLigne: false,
    photo: { itemId: null, index: 0 }
  };

  const $ = (id) => document.getElementById(id);
  const enAttente = new Map();   // id -> timer de sauvegarde differee

  function msg(txt, erreur) {
    const el = $('invMsg');
    el.textContent = txt || '';
    el.classList.toggle('inv-msg--erreur', !!erreur);
  }

  function invCourant() { return S.inventaires.find((x) => x.id === S.invId) || null; }
  function item(id) { return S.items.find((x) => x.id === id) || null; }

  /* ======================================================================
     3. PHOTOS — compression cote client
     ----------------------------------------------------------------------
     Deux sorties d'un seul fichier :
       · GRANDE   max 1200 px, JPEG q .72 — envoyee a l'IA, jamais stockee.
       · VIGNETTE max  320 px, WebP q .72 — stockee en data-URI dans le doc.
     Le cahier des charges ne conserve pas la pleine resolution en v1 : le
     clic « agrandir » montre donc la vignette agrandie.
     ====================================================================== */

  function dessine(file, maxPx, mime, qualite) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w >= h && w > maxPx) { h = Math.round(h * maxPx / w); w = maxPx; }
        else if (h > w && h > maxPx) { w = Math.round(w * maxPx / h); h = maxPx; }
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        // Fond blanc : le JPEG n'a pas de canal alpha, un PNG transparent
        // deviendrait noir sans ca.
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        try {
          let out = cv.toDataURL(mime, qualite);
          // Safari < 14 et quelques Android ignorent le WebP et renvoient du
          // PNG, bien plus lourd. On retombe alors sur le JPEG, qui est
          // universel depuis toujours.
          if (mime === 'image/webp' && out.indexOf('data:image/webp') !== 0) {
            out = cv.toDataURL('image/jpeg', qualite);
          }
          resolve(out);
        } catch (e) { reject(new Error('canvas')); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')); };
      img.src = url;
    });
  }

  async function prepare(file) {
    const grande   = await dessine(file, 1200, 'image/jpeg', 0.72);
    const vignette = await dessine(file, 320, 'image/webp', 0.72);
    return {
      base64: grande.split(',')[1],
      mediaType: 'image/jpeg',
      vignette: vignette
    };
  }

  /* ======================================================================
     4. RENDU
     ====================================================================== */

  function optionsHtml(cles, libelles, choisie) {
    return cles.map((k) =>
      '<option value="' + k + '"' + (k === choisie ? ' selected' : '') + '>' +
      esc(libelles[k] || k) + '</option>').join('');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function peintTextes() {
    const l = L();
    $('invPill').textContent = l.pill;
    $('invTitre').textContent = l.titre;
    $('invIntro').textContent = l.intro;
    $('invSelLbl').textContent = l.selLbl;
    $('invNouveau').textContent = l.nouveau;
    $('invRenommer').textContent = l.renommer;
    $('invSupprInv').textContent = l.supprInv;
    $('invCapTitre').textContent = l.capTitre;
    $('invCapNote').textContent = l.capNote;
    $('invPrendre').textContent = l.prendre;
    $('invTeleverser').textContent = l.televerser;
    $('invVide').textContent = l.vide;
    $('invSearch').placeholder = l.chercher;
    $('invReset').textContent = l.reset;
    $('invAchats').textContent = l.achats;
    $('invCsv').textContent = l.csv;
    $('invImprimer').textContent = l.imprimer;
    $('invAchatsCsv').textContent = l.csv;
    $('invAchatsImpr').textContent = l.imprimer;
    $('invPhotoPrincipale').textContent = l.principale;
    $('invPhotoAjout').textContent = l.photoAjout;
    $('invPhotoSuppr').textContent = l.photoSuppr;
    document.documentElement.lang = lang() === 'en' ? 'en' : 'fr-CA';

    // Filtres
    $('invFCat').innerHTML = '<option value="*">' + esc(l.toutesCat) + '</option>' +
      optionsHtml(CATEGORIES, l.cat, S.f.cat);
    $('invFCat').value = S.f.cat;
    $('invFUniv').innerHTML = '<option value="*">' + esc(l.tousUniv) + '</option>' +
      optionsHtml(UNIVERS, l.univ, S.f.univ);
    $('invFUniv').value = S.f.univ;
    $('invFEtat').innerHTML = '<option value="*">' + esc(l.tousEtats) + '</option>' +
      optionsHtml(ETATS, l.etat, S.f.etat);
    $('invFEtat').value = S.f.etat;
  }

  function peintInventaires() {
    const l = L();
    $('invSel').innerHTML = S.inventaires.map((iv) =>
      '<option value="' + esc(iv.id) + '"' + (iv.id === S.invId ? ' selected' : '') + '>' +
      esc(iv.nom) + ' — ' + esc(l.univ[iv.univers] || iv.univers) + '</option>').join('');
    const iv = invCourant();
    $('invPrintTitre').textContent = iv ? iv.nom + ' — ' + (l.univ[iv.univers] || '') : '';
  }

  // Le filtre par univers porte sur l'INVENTAIRE, pas sur l'objet : un objet
  // appartient a un lieu, et c'est le lieu qui a un univers. Filtrer par
  // univers revient donc a masquer les objets quand l'inventaire courant n'est
  // pas de cet univers — le tableau se vide d'un coup, ce qui est le
  // comportement attendu et non un bug.
  function filtres() {
    const q = S.f.q.trim().toLowerCase();
    const iv = invCourant();
    if (S.f.univ !== '*' && (!iv || iv.univers !== S.f.univ)) return [];
    let out = S.items.filter((o) =>
      (S.f.cat === '*' || o.categorie === S.f.cat) &&
      (S.f.etat === '*' || o.etat === S.f.etat) &&
      (!q || [o.nom, o.marque, o.description, o.emplacement, o.notes]
        .join(' ').toLowerCase().indexOf(q) >= 0));
    const c = S.tri.col, s = S.tri.sens;
    out.sort((a, b) => {
      let x = a[c], y = b[c];
      if (c === 'qteMain' || c === 'qteAcheter' || c === 'prix') {
        x = x == null ? -1 : +x; y = y == null ? -1 : +y;
        return (x - y) * s;
      }
      if (c === 'etat')      { return (ETATS.indexOf(x) - ETATS.indexOf(y)) * s; }
      if (c === 'categorie') { x = L().cat[x] || x; y = L().cat[y] || y; }
      return String(x || '').localeCompare(String(y || ''), lang(), { numeric: true }) * s;
    });
    return out;
  }

  function peintStats() {
    const l = L();
    const n = S.items.length;
    const valeur = S.items.reduce((t, o) =>
      t + ((o.prix == null ? 0 : +o.prix) * Math.max(1, +o.qteMain || 0)), 0);
    const racheter = S.items.filter((o) => (+o.qteAcheter || 0) > 0 || o.etat === 'remplacer').length;
    const photos = S.items.reduce((t, o) => t + (o.photos ? o.photos.length : 0), 0);
    const dev = new Intl.NumberFormat(lang() === 'en' ? 'en-CA' : 'fr-CA',
      { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
    $('invStats').innerHTML = [
      ['📦', n, l.stat.objets, ''],
      ['💰', dev.format(valeur), l.stat.valeur, ''],
      ['🛒', racheter, l.stat.racheter, racheter > 0 ? ' inv-stat--alerte' : ''],
      ['📷', photos, l.stat.photos, '']
    ].map(([ico, nb, quoi, cls]) =>
      '<div class="inv-stat' + cls + '"><span class="inv-stat__nb">' + ico + ' ' + esc(nb) +
      '</span><span class="inv-stat__quoi">' + esc(quoi) + '</span></div>').join('');
  }

  function peintEntete() {
    const l = L();
    $('invThead').innerHTML = '<tr>' + COLONNES.map((k) => {
      const fleche = (S.tri.col === k.c && k.tri) ? ' <span class="inv-tri">' + (S.tri.sens > 0 ? '▲' : '▼') + '</span>' : '';
      return '<th data-col="' + k.c + '" data-tri="' + (k.tri ? 'oui' : 'non') + '" scope="col">' +
        esc(l.col[k.c]) + fleche + '</th>';
    }).join('') + '</tr>';
  }

  function celluleHtml(o, k, l) {
    const id = esc(o.id);
    const lbl = ' data-col="' + k.c + '" data-lbl="' + esc(l.col[k.c]) + '"';
    if (k.c === 'photo') {
      const n = o.photos ? o.photos.length : 0;
      const vue = n
        ? '<img src="' + esc(o.photos[0]) + '" alt="' + esc(o.nom || l.objetSansNom) + '">'
        : '<span class="inv-vignette__vide">📷</span>';
      const plus = n > 1 ? '<span class="inv-vignette__plus">+' + (n - 1) + '</span>' : '';
      return '<td' + lbl + '><div class="inv-photocell">' +
        '<button class="inv-vignette" type="button" data-act="voir" data-id="' + id + '" ' +
        'aria-label="' + esc(l.voirPhotos) + '">' + vue + plus + '</button>' +
        '<button class="inv-mini" type="button" data-act="addphoto" data-id="' + id + '">' +
        esc(l.ajouterPhoto) + '</button></div></td>';
    }
    if (k.c === 'actions') {
      return '<td' + lbl + '><button class="inv-mini inv-mini--suppr" type="button" ' +
        'data-act="suppr" data-id="' + id + '">🗑️ ' + esc(l.supprimer) + '</button></td>';
    }
    if (k.type === 'zone') {
      return '<td' + lbl + '><textarea class="inv-ta" rows="1" data-id="' + id + '" data-champ="' +
        k.c + '">' + esc(o[k.c] || '') + '</textarea></td>';
    }
    if (k.type === 'cat') {
      return '<td' + lbl + '><select class="inv-sel" data-id="' + id + '" data-champ="categorie">' +
        optionsHtml(CATEGORIES, l.cat, o.categorie) + '</select></td>';
    }
    if (k.type === 'etat') {
      return '<td' + lbl + '><select class="inv-sel inv-sel--etat" data-etat="' + esc(o.etat) +
        '" data-id="' + id + '" data-champ="etat">' + optionsHtml(ETATS, l.etat, o.etat) +
        '</select></td>';
    }
    if (k.type === 'nb') {
      return '<td' + lbl + '><input class="inv-in inv-in--nb" type="number" min="0" step="1" ' +
        'inputmode="numeric" data-id="' + id + '" data-champ="' + k.c + '" value="' +
        esc(o[k.c] == null ? 0 : o[k.c]) + '"></td>';
    }
    if (k.type === 'prix') {
      return '<td' + lbl + '><input class="inv-in inv-in--nb" type="number" min="0" step="0.01" ' +
        'inputmode="decimal" data-id="' + id + '" data-champ="prix" value="' +
        esc(o.prix == null ? '' : o.prix) + '"></td>';
    }
    return '<td' + lbl + '><input class="inv-in' + (k.c === 'nom' ? ' inv-in--nom' : '') +
      '" type="text" data-id="' + id + '" data-champ="' + k.c + '" value="' +
      esc(o[k.c] || '') + '"></td>';
  }

  function peintTableau() {
    const l = L();
    const liste = filtres();
    peintEntete();
    $('invTbody').innerHTML = liste.map((o) =>
      '<tr data-id="' + esc(o.id) + '">' +
      COLONNES.map((k) => celluleHtml(o, k, l)).join('') + '</tr>').join('');
    const vide = liste.length === 0;
    $('invEmpty').hidden = !vide;
    $('invEmpty').textContent = S.items.length === 0 ? l.videInv : l.vide;
    $('invTable').hidden = vide;
  }

  function peintTout() {
    peintTextes();
    peintInventaires();
    peintStats();
    peintTableau();
  }

  /* ======================================================================
     5. ECRITURES
     ====================================================================== */

  function bloqueSiHorsLigne() {
    if (S.horsLigne || !navigator.onLine) {
      S.horsLigne = true;
      msg(L().mHorsLigne, true);
      return true;
    }
    return false;
  }

  // Une frappe par caractere = une ecriture Firestore par caractere. On
  // regroupe : 700 ms apres la derniere touche, un seul appel part avec le
  // dernier etat de l'objet. Le modele local, lui, est a jour tout de suite —
  // les compteurs suivent la frappe.
  function planifie(id) {
    if (enAttente.has(id)) clearTimeout(enAttente.get(id));
    enAttente.set(id, setTimeout(() => {
      enAttente.delete(id);
      const o = item(id);
      if (!o) return;
      const patch = InvData.normalise(o);
      InvData.majItem(id, patch, Object.assign({}, o, patch))
        .then(() => { msg(L().mSauve); InvData.cache.ecrire(S.invId, S.items); })
        .catch((e) => msg(L().mErrSauve(e.message), true));
    }, 700));
  }

  function surChamp(e) {
    const el = e.target;
    const id = el.getAttribute('data-id');
    const champ = el.getAttribute('data-champ');
    if (!id || !champ) return;
    const o = item(id);
    if (!o) return;
    if (bloqueSiHorsLigne()) return;

    if (champ === 'qteMain' || champ === 'qteAcheter') {
      o[champ] = Math.max(0, Math.round(+el.value || 0));
    } else if (champ === 'prix') {
      o.prix = el.value === '' ? null : Math.max(0, +el.value || 0);
    } else {
      o[champ] = el.value;
    }
    if (champ === 'etat') el.setAttribute('data-etat', o.etat);
    // Les compteurs dependent de qte, prix et etat : ils se remettent a jour
    // a la frappe, sans attendre l'ecriture differee.
    if (champ === 'qteMain' || champ === 'qteAcheter' || champ === 'prix' || champ === 'etat') peintStats();
    planifie(id);
  }

  /* ======================================================================
     6. AJOUT D'OBJET PAR PHOTO
     ====================================================================== */

  async function ajouteDepuisFichier(file) {
    if (!file) return;
    if (bloqueSiHorsLigne()) return;
    const l = L();
    let prep;
    try { prep = await prepare(file); }
    catch (e) { msg(l.mImageIllisible, true); return; }

    msg(l.mAnalyse);
    let vu = null, erreurIA = '';
    try { vu = await InvData.vision(prep.base64, prep.mediaType, lang()); }
    catch (e) { erreurIA = e.message || 'IA'; }

    const brut = {
      photos: [prep.vignette],
      nom: (vu && vu.nom) || '',
      marque: (vu && vu.marque) || '',
      description: (vu && vu.description) || '',
      categorie: (vu && CATEGORIES.indexOf(vu.categorie) >= 0) ? vu.categorie : 'autre',
      emplacement: '', qteMain: 1, qteAcheter: 0, etat: 'bon', prix: null, notes: ''
    };
    try {
      const cree = await InvData.creerItem(S.invId, brut);
      S.items.unshift(cree);
      InvData.cache.ecrire(S.invId, S.items);
      peintStats(); peintTableau();
      msg(erreurIA ? l.mEchecIA(erreurIA) : l.mAjoute(cree.nom || l.objetSansNom), !!erreurIA);
    } catch (e) {
      if (e.message === 'DOC_TROP_LOURD') {
        msg(l.mTropLourd(Math.round(e.info.poids / 1024), Math.round(e.info.max / 1024)), true);
      } else { msg(l.mErrSauve(e.message), true); }
    }
  }

  async function ligneVide() {
    if (bloqueSiHorsLigne()) return;
    const l = L();
    try {
      const cree = await InvData.creerItem(S.invId, {
        photos: [], nom: '', marque: '', description: '', categorie: 'autre',
        emplacement: '', qteMain: 1, qteAcheter: 0, etat: 'bon', prix: null, notes: ''
      });
      S.items.unshift(cree);
      InvData.cache.ecrire(S.invId, S.items);
      peintStats(); peintTableau();
      msg('');
      const champ = document.querySelector('tr[data-id="' + cree.id + '"] .inv-in--nom');
      if (champ) champ.focus();
    } catch (e) { msg(l.mErrSauve(e.message), true); }
  }

  /* ======================================================================
     7. PHOTOS SUPPLEMENTAIRES ET MODALE
     ====================================================================== */

  async function ajoutePhotoA(itemId, file) {
    if (!file) return;
    if (bloqueSiHorsLigne()) return;
    const l = L();
    const o = item(itemId);
    if (!o) return;
    o.photos = o.photos || [];
    if (o.photos.length >= InvData.MAX_PHOTOS) { msg(l.mMaxPhotos(InvData.MAX_PHOTOS), true); return; }

    let vignette;
    try { vignette = await dessine(file, 320, 'image/webp', 0.72); }
    catch (e) { msg(l.mImageIllisible, true); return; }

    const futur = Object.assign({}, o, { photos: o.photos.concat([vignette]) });
    const v = InvData.verifiePoids(futur);
    if (!v.ok) { msg(l.mTropLourd(Math.round(v.poids / 1024), Math.round(v.max / 1024)), true); return; }

    try {
      await InvData.majItem(itemId, { photos: futur.photos }, futur);
      o.photos = futur.photos;
      InvData.cache.ecrire(S.invId, S.items);
      peintStats(); peintTableau();
      msg(l.mSauve);
      if (S.photo.itemId === itemId) { S.photo.index = o.photos.length - 1; peintModalePhoto(); }
    } catch (e) { msg(l.mErrSauve(e.message), true); }
  }

  function peintModalePhoto() {
    const l = L();
    const o = item(S.photo.itemId);
    const photos = (o && o.photos) || [];
    const n = photos.length;
    $('invPhotoTitre').textContent = (o && o.nom) || l.objetSansNom;
    if (!n) {
      $('invPhotoImg').removeAttribute('src');
      $('invPhotoImg').alt = '';
      $('invPhotoCompte').textContent = l.photoAucune;
      $('invPhotoPrec').hidden = true;
      $('invPhotoSuiv').hidden = true;
      $('invPhotoPrincipale').disabled = true;
      $('invPhotoSuppr').disabled = true;
      return;
    }
    if (S.photo.index >= n) S.photo.index = n - 1;
    if (S.photo.index < 0) S.photo.index = 0;
    $('invPhotoImg').src = photos[S.photo.index];
    $('invPhotoImg').alt = ((o && o.nom) || l.objetSansNom) + ' — ' + l.photoDe(S.photo.index + 1, n);
    $('invPhotoCompte').textContent = l.photoDe(S.photo.index + 1, n);
    $('invPhotoPrec').hidden = n < 2;
    $('invPhotoSuiv').hidden = n < 2;
    $('invPhotoPrincipale').disabled = S.photo.index === 0;
    $('invPhotoPrincipale').textContent = S.photo.index === 0 ? l.estPrincipale : l.principale;
    $('invPhotoSuppr').disabled = false;
  }

  function ouvrePhotos(itemId) {
    S.photo.itemId = itemId;
    S.photo.index = 0;
    peintModalePhoto();
    ZTS.openModal('invModalPhoto');
  }

  function navigue(pas) {
    const o = item(S.photo.itemId);
    const n = (o && o.photos) ? o.photos.length : 0;
    if (n < 2) return;
    S.photo.index = (S.photo.index + pas + n) % n;
    peintModalePhoto();
  }

  async function ecritPhotos(o, photos) {
    const futur = Object.assign({}, o, { photos: photos });
    try {
      await InvData.majItem(o.id, { photos: photos }, futur);
      o.photos = photos;
      InvData.cache.ecrire(S.invId, S.items);
      peintStats(); peintTableau(); peintModalePhoto();
      msg(L().mSauve);
    } catch (e) { msg(L().mErrSauve(e.message), true); }
  }

  function definitPrincipale() {
    if (bloqueSiHorsLigne()) return;
    const o = item(S.photo.itemId);
    if (!o || !o.photos || S.photo.index === 0) return;
    const p = o.photos.slice();
    const [choisie] = p.splice(S.photo.index, 1);
    p.unshift(choisie);
    S.photo.index = 0;
    ecritPhotos(o, p);
  }

  function supprimePhoto() {
    if (bloqueSiHorsLigne()) return;
    const o = item(S.photo.itemId);
    if (!o || !o.photos || !o.photos.length) return;
    const p = o.photos.slice();
    p.splice(S.photo.index, 1);
    if (S.photo.index >= p.length) S.photo.index = Math.max(0, p.length - 1);
    ecritPhotos(o, p);
  }

  /* ======================================================================
     8. LISTE D'ACHATS, CSV, IMPRESSION
     ====================================================================== */

  function aAcheter() {
    return S.items
      .filter((o) => (+o.qteAcheter || 0) > 0 || o.etat === 'remplacer')
      .map((o) => ({
        o: o,
        // Un objet « a remplacer » sans quantite saisie compte pour 1 : c'est
        // le minimum pour le remplacer, et zero dans une liste d'achats
        // n'aurait aucun sens.
        qte: (+o.qteAcheter || 0) > 0 ? (+o.qteAcheter || 0) : 1,
        raison: (+o.qteAcheter || 0) > 0 ? 'qte' : 'etat'
      }));
  }

  function peintAchats() {
    const l = L();
    const liste = aAcheter();
    const iv = invCourant();
    const dev = new Intl.NumberFormat(lang() === 'en' ? 'en-CA' : 'fr-CA',
      { style: 'currency', currency: 'CAD' });
    if (!liste.length) {
      $('invAchatsBody').innerHTML =
        '<h2 class="zts-modal__title inv-modal__titre">🛒 ' + esc(l.achatsTitre) + '</h2>' +
        '<p class="inv-achats__l">' + esc(l.achatsVide) + '</p>';
      return { html: '', vide: true };
    }
    const parCat = {};
    liste.forEach((x) => { (parCat[x.o.categorie] = parCat[x.o.categorie] || []).push(x); });
    let total = 0;
    const corps = CATEGORIES.filter((c) => parCat[c]).map((c) =>
      '<h3 class="inv-achats__cat">' + esc(l.cat[c]) + '</h3>' +
      parCat[c].map((x) => {
        const sousTotal = (x.o.prix == null ? 0 : +x.o.prix) * x.qte;
        total += sousTotal;
        return '<div class="inv-achats__l"><span>' +
          esc(x.o.nom || l.objetSansNom) +
          (x.o.marque ? ' — ' + esc(x.o.marque) : '') +
          (x.o.emplacement ? ' <em>(' + esc(x.o.emplacement) + ')</em>' : '') +
          ' · ' + esc(l.achatsRaison[x.raison]) +
          '</span><span class="inv-achats__q">×' + x.qte +
          (x.o.prix == null ? '' : ' · ' + dev.format(sousTotal)) + '</span></div>';
      }).join('')).join('');
    const total_ = liste.reduce((t, x) => t + x.qte, 0);
    const html =
      '<h2 class="zts-modal__title inv-modal__titre">🛒 ' + esc(l.achatsTitre) + '</h2>' +
      '<p class="inv-achats__l"><span>' + esc(l.achatsNote) + ' : ' +
      esc(iv ? iv.nom : '') + '</span></p>' + corps +
      '<div class="inv-achats__tot">' + esc(l.achatsTotal(total_, dev.format(total))) + '</div>';
    $('invAchatsBody').innerHTML = html;
    return { html: html, vide: false };
  }

  function csvChamp(v) {
    const s = String(v == null ? '' : v);
    return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // Separateur point-virgule : Excel en francais lit une virgule comme un
  // separateur decimal et met toute la ligne dans une seule colonne. Le BOM
  // UTF-8 en tete est ce qui rend les accents lisibles dans Excel.
  function telechargeCsv(lignes, nomFichier) {
    const txt = '\uFEFF' + lignes.map((r) => r.map(csvChamp).join(';')).join('\r\n');
    const blob = new Blob([txt], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nomFichier;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function nomFichier(suffixe) {
    const iv = invCourant();
    const base = (iv ? iv.nom : 'inventaire').replace(/[^\wÀ-ſ -]/g, '').trim() || 'inventaire';
    const d = new Date();
    const iso = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
    return base + '-' + suffixe + '-' + iso + '.csv';
  }

  function exportCsv() {
    const l = L();
    const cols = COLONNES.filter((k) => k.c !== 'photo' && k.c !== 'actions');
    const entete = cols.map((k) => l.col[k.c]).concat([l.photos]);
    const lignes = [entete].concat(filtres().map((o) =>
      cols.map((k) => {
        if (k.c === 'categorie') return l.cat[o.categorie] || o.categorie;
        if (k.c === 'etat') return l.etat[o.etat] || o.etat;
        if (k.c === 'prix') return o.prix == null ? '' : String(o.prix).replace('.', ',');
        return o[k.c];
      }).concat([(o.photos || []).length])));
    telechargeCsv(lignes, nomFichier('inventaire'));
  }

  function exportCsvAchats() {
    const l = L();
    const lignes = [[l.col.nom, l.col.marque, l.col.categorie, l.col.emplacement,
      l.col.qteAcheter, l.col.prix, l.col.etat]];
    aAcheter().forEach((x) => lignes.push([
      x.o.nom || l.objetSansNom, x.o.marque, l.cat[x.o.categorie] || x.o.categorie,
      x.o.emplacement, x.qte, x.o.prix == null ? '' : String(x.o.prix).replace('.', ','),
      l.etat[x.o.etat] || x.o.etat
    ]));
    telechargeCsv(lignes, nomFichier('achats'));
  }

  // La liste d'achats s'imprime dans une fenetre a elle. L'alternative — une
  // regle @media print qui masque tout sauf la modale — demanderait des
  // selecteurs de type nus sur le document entier, ce que la convention du
  // depot interdit, et se battrait avec le chrome du shell. Une page neuve
  // n'a aucun de ces problemes.
  function imprimeAchats() {
    const l = L();
    const r = peintAchats();
    const iv = invCourant();
    const f = window.open('', '_blank');
    if (!f) return;   // bloqueur de fenetres : la modale reste lisible a l'ecran
    f.document.write('<!DOCTYPE html><html lang="' + (lang() === 'en' ? 'en' : 'fr-CA') +
      '"><head><meta charset="UTF-8"><title>' + esc(l.achatsTitre) + ' — ' +
      esc(iv ? iv.nom : '') + '</title><style>' +
      'body{font-family:system-ui,-apple-system,"Helvetica Neue",sans-serif;color:#000;padding:24px;max-width:800px;margin:0 auto}' +
      'h2{font-size:22px;margin:0 0 4px}h3{font-size:16px;margin:18px 0 4px;border-bottom:2px solid #000;padding-bottom:3px}' +
      '.inv-achats__l{display:flex;justify-content:space-between;gap:16px;padding:5px 0;border-bottom:1px dashed #999;font-size:14px}' +
      '.inv-achats__q{font-weight:700;white-space:nowrap}' +
      '.inv-achats__tot{margin-top:14px;padding-top:8px;border-top:2px solid #000;font-size:16px;font-weight:700}' +
      '</style></head><body>' + (r.vide ? '<h2>' + esc(l.achatsTitre) + '</h2><p>' + esc(l.achatsVide) + '</p>' : r.html) +
      '</body></html>');
    f.document.close();
    f.focus();
    setTimeout(() => f.print(), 250);
  }

  /* ======================================================================
     9. INVENTAIRES
     ====================================================================== */

  function demandeUnivers(actuel) {
    const l = L();
    const rep = prompt(l.pUniv, String(UNIVERS.indexOf(actuel || 'ep') + 1));
    if (rep == null) return null;
    const i = parseInt(rep, 10);
    return UNIVERS[i - 1] || actuel || 'ep';
  }

  async function nouvelInventaire() {
    if (bloqueSiHorsLigne()) return;
    const l = L();
    const nom = prompt(l.pNom, '');
    if (nom == null || !nom.trim()) return;
    const univers = demandeUnivers('ep');
    if (univers == null) return;
    try {
      const iv = await InvData.creerInventaire(nom.trim(), univers);
      S.inventaires.push(iv);
      S.inventaires.sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));
      InvData.cache.ecrireListe(S.inventaires);
      await changeInventaire(iv.id);
    } catch (e) { msg(l.mErrSauve(e.message), true); }
  }

  async function renommeInventaire() {
    if (bloqueSiHorsLigne()) return;
    const l = L(); const iv = invCourant();
    if (!iv) return;
    const nom = prompt(l.pNom, iv.nom);
    if (nom == null || !nom.trim()) return;
    const univers = demandeUnivers(iv.univers);
    if (univers == null) return;
    try {
      await InvData.majInventaire(iv.id, { nom: nom.trim(), univers: univers });
      iv.nom = nom.trim(); iv.univers = univers;
      S.inventaires.sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));
      InvData.cache.ecrireListe(S.inventaires);
      peintInventaires();
      msg(l.mSauve);
    } catch (e) { msg(l.mErrSauve(e.message), true); }
  }

  async function supprimeInventaire() {
    if (bloqueSiHorsLigne()) return;
    const l = L(); const iv = invCourant();
    if (!iv) return;
    if (!confirm(l.pSupprInv(iv.nom))) return;
    try {
      await InvData.supprimerInventaire(iv.id);
      S.inventaires = S.inventaires.filter((x) => x.id !== iv.id);
      InvData.cache.ecrireListe(S.inventaires);
      if (!S.inventaires.length) {
        const neuf = await InvData.creerInventaire(l.premier, 'ep');
        S.inventaires = [neuf];
        InvData.cache.ecrireListe(S.inventaires);
      }
      await changeInventaire(S.inventaires[0].id);
    } catch (e) { msg(l.mErrSauve(e.message), true); }
  }

  async function supprimeItem(id) {
    if (bloqueSiHorsLigne()) return;
    const l = L(); const o = item(id);
    if (!o) return;
    if (!confirm(l.pSupprItem(o.nom || l.objetSansNom))) return;
    try {
      await InvData.supprimerItem(id);
      S.items = S.items.filter((x) => x.id !== id);
      InvData.cache.ecrire(S.invId, S.items);
      peintStats(); peintTableau();
      msg(l.mSauve);
    } catch (e) { msg(l.mErrSauve(e.message), true); }
  }

  async function changeInventaire(id) {
    S.invId = id;
    try { localStorage.setItem('zts_inv_courant', id); } catch (e) {}
    const cache = InvData.cache.lire(id);
    if (cache) { S.items = cache; peintTout(); }
    else { msg(L().mLecture); }
    try {
      S.items = await InvData.listeItems(id);
      S.horsLigne = false;
      peintTout();
      msg('');
    } catch (e) {
      S.horsLigne = true;
      if (!cache) { S.items = []; peintTout(); }
      msg(L().mHorsLigne, true);
    }
  }

  /* ======================================================================
     10. CABLAGE
     ====================================================================== */

  function cable() {
    const tbody = $('invTbody');
    tbody.addEventListener('input', surChamp);
    tbody.addEventListener('change', surChamp);
    tbody.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const id = b.getAttribute('data-id');
      const act = b.getAttribute('data-act');
      if (act === 'voir') ouvrePhotos(id);
      if (act === 'suppr') supprimeItem(id);
      if (act === 'addphoto') {
        S.photo.itemId = id;
        $('invFileAjoutCam').click();   // camera arriere
      }
    });

    $('invThead').addEventListener('click', (e) => {
      const th = e.target.closest('th');
      if (!th || th.getAttribute('data-tri') !== 'oui') return;
      const c = th.getAttribute('data-col');
      S.tri.sens = (S.tri.col === c) ? -S.tri.sens : 1;
      S.tri.col = c;
      peintTableau();
    });

    $('invSel').addEventListener('change', (e) => changeInventaire(e.target.value));
    $('invNouveau').addEventListener('click', nouvelInventaire);
    $('invRenommer').addEventListener('click', renommeInventaire);
    $('invSupprInv').addEventListener('click', supprimeInventaire);

    $('invPrendre').addEventListener('click', () => $('invFileCam').click());
    $('invTeleverser').addEventListener('click', () => $('invFileLib').click());
    $('invVide').addEventListener('click', ligneVide);
    // La valeur est remise a vide apres coup : sans ca, reprendre DEUX FOIS la
    // meme photo ne declenche pas `change` la seconde fois.
    ['invFileCam', 'invFileLib'].forEach((k) => {
      $(k).addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        e.target.value = '';
        ajouteDepuisFichier(f);
      });
    });
    ['invFileAjout', 'invFileAjoutCam'].forEach((k) => {
      $(k).addEventListener('change', (e) => {
        const f = e.target.files && e.target.files[0];
        e.target.value = '';
        ajoutePhotoA(S.photo.itemId, f);
      });
    });

    $('invSearch').addEventListener('input', (e) => { S.f.q = e.target.value; peintTableau(); });
    $('invFCat').addEventListener('change', (e) => { S.f.cat = e.target.value; peintTableau(); });
    $('invFUniv').addEventListener('change', (e) => { S.f.univ = e.target.value; peintTableau(); });
    $('invFEtat').addEventListener('change', (e) => { S.f.etat = e.target.value; peintTableau(); });
    $('invReset').addEventListener('click', () => {
      S.f = { q: '', cat: '*', univ: '*', etat: '*' };
      $('invSearch').value = '';
      peintTextes(); peintTableau();
    });

    $('invAchats').addEventListener('click', () => { peintAchats(); ZTS.openModal('invModalAchats'); });
    $('invAchatsCsv').addEventListener('click', exportCsvAchats);
    $('invAchatsImpr').addEventListener('click', imprimeAchats);
    $('invCsv').addEventListener('click', exportCsv);
    $('invImprimer').addEventListener('click', () => window.print());

    $('invPhotoPrec').addEventListener('click', () => navigue(-1));
    $('invPhotoSuiv').addEventListener('click', () => navigue(1));
    $('invPhotoPrincipale').addEventListener('click', definitPrincipale);
    $('invPhotoSuppr').addEventListener('click', supprimePhoto);
    // Depuis la modale on pioche dans la phototheque : les vues d'appoint
    // (etiquette, numero de serie) sont souvent deja dans le telephone.
    $('invPhotoAjout').addEventListener('click', () => $('invFileAjout').click());

    // Balayage horizontal dans la visionneuse. 45 px de course minimum, et le
    // geste doit etre plus horizontal que vertical : sinon un simple defilement
    // de la page changerait de photo.
    let x0 = null, y0 = null;
    const visio = document.querySelector('.inv-visio');
    visio.addEventListener('touchstart', (e) => {
      x0 = e.changedTouches[0].clientX; y0 = e.changedTouches[0].clientY;
    }, { passive: true });
    visio.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) navigue(dx < 0 ? 1 : -1);
    }, { passive: true });

    document.addEventListener('keydown', (e) => {
      const m = $('invModalPhoto');
      if (m.getAttribute('aria-hidden') === 'false' || m.classList.contains('open')) {
        if (e.key === 'ArrowLeft') navigue(-1);
        if (e.key === 'ArrowRight') navigue(1);
      }
    });

    window.addEventListener('online', () => {
      S.horsLigne = false;
      msg('');
      if (S.invId) changeInventaire(S.invId);
    });
    window.addEventListener('offline', () => { S.horsLigne = true; msg(L().mHorsLigne, true); });

    document.addEventListener('zts:langchange', peintTout);
  }

  /* ======================================================================
     11. DEMARRAGE
     ====================================================================== */

  async function demarre() {
    peintTextes();
    cable();
    await InvData.pret();          // zts-gate.js a laisse passer un utilisateur
    const l = L();
    try {
      S.inventaires = await InvData.listeInventaires();
      if (!S.inventaires.length) {
        S.inventaires = [await InvData.creerInventaire(l.premier, 'ep')];
        InvData.cache.ecrireListe(S.inventaires);
      }
    } catch (e) {
      S.horsLigne = true;
      S.inventaires = InvData.cache.lireListe() || [];
      msg(l.mHorsLigne, true);
    }
    if (!S.inventaires.length) { peintTout(); return; }
    let vise = null;
    try { vise = localStorage.getItem('zts_inv_courant'); } catch (e) {}
    const existe = S.inventaires.some((x) => x.id === vise);
    await changeInventaire(existe ? vise : S.inventaires[0].id);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarre);
  else demarre();
})();
