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

  // LES CATEGORIES NE SONT PLUS FIGEES ICI (ajout C, 23 aout 2026). Elles
  // appartiennent a l'inventaire courant, l'usager les renomme, en ajoute et
  // en supprime, et elles portent un libelle FR et un libelle EN. La liste de
  // depart d'un inventaire neuf vit dans dataStore.js — un seul endroit.
  //
  // Une categorie vide ('') est un etat LEGITIME : « non classe ». C'est ce
  // que porte un objet dont la categorie a ete supprimee sans reassignation,
  // ou que l'IA n'a pas su ranger.

  const UNIVERS = ['ep', 'camp', 'sdg'];
  const ETATS   = ['neuf', 'bon', 'ok', 'remplacer'];

  // Colonnes de la feuille. `ed` dit COMMENT la cellule s'edite :
  //   'txt'  champ texte      'nb' entier      'prix' decimal
  //   'cat'  menu de categorie 'etat' menu d'etat
  // Une colonne sans `ed` ne s'edite pas — numero de rangee, photo, actions.
  const COLONNES = [
    { c: 'num',         tri: false },
    { c: 'photo',       tri: false },
    { c: 'nom',         tri: true,  ed: 'txt' },
    { c: 'marque',      tri: true,  ed: 'txt' },
    { c: 'description', tri: true,  ed: 'txt' },
    { c: 'categorie',   tri: true,  ed: 'cat' },
    { c: 'emplacement', tri: true,  ed: 'txt' },
    { c: 'date',        tri: true,  ed: 'date' },
    { c: 'qteMain',     tri: true,  ed: 'nb' },
    { c: 'qteAcheter',  tri: true,  ed: 'nb' },
    { c: 'etat',        tri: true,  ed: 'etat' },
    { c: 'prix',        tri: true,  ed: 'prix' },
    { c: 'notes',       tri: true,  ed: 'txt' },
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
      prendre: '📷 Prendre une photo', televerser: '🖼️ Choisir une image', ligneVide: '➕ Ligne vide',
      chercher: 'Rechercher…',
      toutesCat: 'Toutes les catégories', tousUniv: 'Tous les univers', tousEtats: 'Tous les états',
      reset: '↺ Réinitialiser',
      achats: '🛒 Liste d’achats', csv: '⬇️ Export CSV', imprimer: '🖨️ Imprimer',
      col: {
        num: '#',
        // Apostrophe DROITE, pas courbe : ce libelle est rendu en
        // ZoneTotalSport, qui n'a pas le U+2019.
        photo: '', nom: "Nom de l'objet", marque: 'Marque', description: 'Description',
        categorie: 'Catégorie', emplacement: 'Emplacement', date: 'Date',
        qteMain: 'Qté',
        qteAcheter: 'Achat', etat: 'État', prix: 'Prix', notes: 'Notes', actions: ''
      },
      colLong: { photo: 'Photo', date: 'Date d’achat ou de dernière vérification',
                 qteMain: 'Quantité en main', qteAcheter: 'Quantité à acheter',
                 prix: 'Prix unitaire ($)' },
      dateInv: 'Inventaire fait le', dateInvVide: 'Aucune date saisie',
      // Onglets d'annees
      ongPlus: '+ Année', ongPlusTitre: 'Ouvrir l’année suivante',
      ongConfirme: (a, n) => 'Ouvrir l’année ' + a + ' en reprenant les ' + n +
        ' objet' + (n > 1 ? 's' : '') + ' de cette feuille ?\n\nLes quantités en main, les photos, ' +
        'l’état et les notes sont repris. Les quantités À ACHETER repartent à zéro.',
      ongFaite: (a, n) => '✅ Année ' + a + ' ouverte — ' + n + ' objet(s) repris.',
      ongEnCours: '⏳ Ouverture de la nouvelle année…',
      nonClasse: '— Non classé —',
      // Feuille (refonte du 23 août)
      menu: 'Autres actions', ajoutPhoto: '📷 Ajouter par photo',
      tousLieux: 'Emplacement', chercher2: '🔍 Rechercher…',
      nouvelleLigne: '+ Clique ici pour ajouter un objet…',
      totObjets: (n) => n + ' objet' + (n > 1 ? 's' : ''),
      totQte: 'Σ qté', totAch: 'à acheter', totVal: 'valeur',
      videCell: '—',
      // Catégories (ajout C)
      gererCats: '🏷️ Gérer les catégories',
      catsTitre: '🏷️ Catégories de cet inventaire',
      catsNote: 'Renomme, ajoute, réordonne. Les objets suivent automatiquement : c’est l’identifiant qui les relie, pas le libellé. Si l’anglais est vide, le français s’affiche dans les deux langues.',
      catsFr: 'Français', catsEn: 'English',
      catsAjout: '+ Nouvelle catégorie', catsNeuve: 'Nouvelle catégorie',
      catsObjets: (n) => n + ' objet' + (n > 1 ? 's' : ''),
      catsMonter: 'Monter', catsDescendre: 'Descendre', catsSuppr: 'Supprimer',
      catsUneSeule: '⚠️ Il faut garder au moins une catégorie.',
      reTitre: '🗃️ Réassigner avant de supprimer',
      reTxt: (nom, n) => '« ' + nom + ' » contient ' + n + ' objet' + (n > 1 ? 's' : '') +
        '. Choisis où ' + (n > 1 ? 'les ' : 'l’') + 'envoyer avant de supprimer la catégorie.',
      reOk: 'Réassigner et supprimer', reAnnuler: 'Annuler',
      reFait: (n, nom) => '✅ ' + n + ' objet(s) déplacé(s) vers « ' + nom + ' ».',
      iaNouvelle: (x) => 'L’IA propose une catégorie qui n’existe pas encore : « ' + x + ' ».',
      iaAjouter: (x) => '➕ Ajouter « ' + x + ' » ?',
      // Codes QR (ajout D)
      qr: 'QR', qrTitre: '🔳 Code QR',
      qrImpr: '🖨️ Imprimer cette étiquette',
      qrScan: 'Scanne-le avec l’appareil photo du téléphone : il ouvre cette fiche.',
      planche: '🔳 Imprimer les QR',
      plTitre: '🔳 Planche d’étiquettes QR',
      plPortee: 'Quoi imprimer', plValeur: 'Lequel',
      plTous: 'Tous les objets', plCat: 'Une catégorie', plLoc: 'Un emplacement',
      plLocs: 'Les emplacements seuls',
      plImpr: '🖨️ Imprimer la planche',
      plCompte: (n) => n + ' étiquette' + (n > 1 ? 's' : ''),
      plVide: 'Rien à imprimer pour cette sélection.',
      plSansLoc: 'Aucun emplacement saisi dans cet inventaire.',
      // Arrivee par QR (ajout D)
      cibleItem: (n) => '🔳 Arrivé par code QR : « ' + n + ' ».',
      cibleLoc: (n) => '🔳 Arrivé par code QR : emplacement « ' + n + ' ».',
      cibleTout: '↺ Voir tout l’inventaire',
      cibleIntrouvable: '⚠️ Cet objet n’existe plus — il a été supprimé. Voici l’inventaire complet.',
      cibleInvIntrouvable: '⚠️ Cet inventaire n’existe plus ou ne t’appartient pas.',
      univ: { ep: 'Éducation physique', camp: 'Camp de jour', sdg: 'Service de garde' },
      etat: { neuf: 'Neuf', bon: 'Bon état', ok: 'OK', remplacer: 'À remplacer' },
      stat: { objets: 'objets', valeur: 'valeur', racheter: 'à racheter', photos: 'photos' },
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
      achatsNote: 'Généré depuis :',
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
      prendre: '📷 Take a photo', televerser: '🖼️ Choose an image', ligneVide: '➕ Blank row',
      chercher: 'Search…',
      toutesCat: 'All categories', tousUniv: 'All settings', tousEtats: 'All conditions',
      reset: '↺ Reset',
      achats: '🛒 Shopping list', csv: '⬇️ Export CSV', imprimer: '🖨️ Print',
      col: {
        num: '#',
        photo: '', nom: 'Item name', marque: 'Brand', description: 'Description',
        categorie: 'Category', emplacement: 'Location', date: 'Date',
        qteMain: 'Qty',
        qteAcheter: 'Buy', etat: 'Condition', prix: 'Price', notes: 'Notes', actions: ''
      },
      colLong: { photo: 'Photo', date: 'Purchase or last-check date',
                 qteMain: 'Quantity on hand', qteAcheter: 'Quantity to buy',
                 prix: 'Unit price ($)' },
      dateInv: 'Inventory taken on', dateInvVide: 'No date entered',
      ongPlus: '+ Year', ongPlusTitre: 'Open the next year',
      ongConfirme: (a, n) => 'Open year ' + a + ' carrying over the ' + n +
        ' item' + (n > 1 ? 's' : '') + ' of this sheet?\n\nQuantities on hand, photos, ' +
        'condition and notes are carried over. TO BUY quantities reset to zero.',
      ongFaite: (a, n) => '✅ Year ' + a + ' opened — ' + n + ' item(s) carried over.',
      ongEnCours: '⏳ Opening the new year…',
      nonClasse: '— Uncategorized —',
      menu: 'More actions', ajoutPhoto: '📷 Add by photo',
      tousLieux: 'Location', chercher2: '🔍 Search…',
      nouvelleLigne: '+ Click here to add an item…',
      totObjets: (n) => n + ' item' + (n > 1 ? 's' : ''),
      totQte: 'Σ qty', totAch: 'to buy', totVal: 'value',
      videCell: '—',
      gererCats: '🏷️ Manage categories',
      catsTitre: '🏷️ Categories in this inventory',
      catsNote: 'Rename, add, reorder. Items follow automatically: they are linked by id, not by label. If English is empty, the French label is shown in both languages.',
      catsFr: 'Français', catsEn: 'English',
      catsAjout: '+ New category', catsNeuve: 'New category',
      catsObjets: (n) => n + ' item' + (n > 1 ? 's' : ''),
      catsMonter: 'Move up', catsDescendre: 'Move down', catsSuppr: 'Delete',
      catsUneSeule: '⚠️ You must keep at least one category.',
      reTitre: '🗃️ Reassign before deleting',
      reTxt: (nom, n) => '"' + nom + '" holds ' + n + ' item' + (n > 1 ? 's' : '') +
        '. Choose where to move ' + (n > 1 ? 'them' : 'it') + ' before deleting the category.',
      reOk: 'Reassign and delete', reAnnuler: 'Cancel',
      reFait: (n, nom) => '✅ ' + n + ' item(s) moved to "' + nom + '".',
      iaNouvelle: (x) => 'The AI suggests a category that does not exist yet: "' + x + '".',
      iaAjouter: (x) => '➕ Add "' + x + '"?',
      qr: 'QR', qrTitre: '🔳 QR code',
      qrImpr: '🖨️ Print this label',
      qrScan: 'Scan it with the phone camera: it opens this record.',
      planche: '🔳 Print QR codes',
      plTitre: '🔳 QR label sheet',
      plPortee: 'What to print', plValeur: 'Which one',
      plTous: 'All items', plCat: 'One category', plLoc: 'One location',
      plLocs: 'Locations only',
      plImpr: '🖨️ Print the sheet',
      plCompte: (n) => n + ' label' + (n > 1 ? 's' : ''),
      plVide: 'Nothing to print for this selection.',
      plSansLoc: 'No location entered in this inventory.',
      cibleItem: (n) => '🔳 Arrived by QR code: "' + n + '".',
      cibleLoc: (n) => '🔳 Arrived by QR code: location "' + n + '".',
      cibleTout: '↺ Show the whole inventory',
      cibleIntrouvable: '⚠️ This item no longer exists — it was deleted. Here is the full inventory.',
      cibleInvIntrouvable: '⚠️ This inventory no longer exists, or is not yours.',
      univ: { ep: 'Physical education', camp: 'Day camp', sdg: 'After-school care' },
      etat: { neuf: 'New', bon: 'Good condition', ok: 'OK', remplacer: 'To replace' },
      stat: { objets: 'items', valeur: 'value', racheter: 'to buy', photos: 'photos' },
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
      achatsNote: 'Generated from:',
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
    f: { q: '', cat: '*', univ: '*', etat: '*', loc: '*' },
    edite: null,              // { id, champ } de la cellule ouverte
    horsLigne: false,
    photo: { itemId: null, index: 0 },
    // Ciblage par code QR : `item` fixe un objet unique, `loc` un
    // emplacement. Ce sont des filtres a part des filtres visibles, pour que
    // « Réinitialiser » ne les efface pas par surprise et que la banniere
    // reste le seul moyen de les lever.
    cible: { item: null, loc: null },
    cibleDemandee: null,      // parametres d'URL, en attente du chargement
    catsBrouillon: null,      // liste en cours d'edition dans la modale
    reassign: null,           // { index, nb } pendant la reassignation
    planche: { portee: 'tous', valeur: '' }
  };

  const $ = (id) => document.getElementById(id);
  const enAttente = new Map();   // id -> timer de sauvegarde differee

  // `action` ajoute un bouton a cote du message — c'est le « Ajouter "X" ? »
  // en un tap demande par l'ajout C. On passe par un vrai <button> cree en
  // JS plutot que par de l'HTML injecte : le libelle vient du modele, donc
  // d'un texte qu'on ne controle pas.
  function msg(txt, erreur, action) {
    const el = $('invMsg');
    el.textContent = txt || '';
    el.classList.toggle('inv-msg--erreur', !!erreur);
    if (action) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ztsh-btn ztsh-btn--sm inv-msg__act';
      b.textContent = action.texte;
      b.addEventListener('click', action.onclic);
      el.appendChild(b);
    }
  }

  function invCourant() { return S.inventaires.find((x) => x.id === S.invId) || null; }

  /** Categories de l'inventaire courant, dans leur ordre d'affichage. */
  function cats() {
    const iv = invCourant();
    return (iv && Array.isArray(iv.categories)) ? iv.categories : [];
  }

  /**
   * Libelle d'une categorie dans la langue courante.
   * L'anglais vide retombe sur le francais — c'est la regle demandee : on
   * n'oblige personne a traduire ses quinze categories pour utiliser l'app.
   */
  function libCat(c) {
    if (!c) return '';
    if (lang() === 'en') return c.en || c.fr || c.id;
    return c.fr || c.en || c.id;
  }

  /** Libelle a partir d'un identifiant. Vide ou inconnu => « non classe ». */
  function libCatId(id) {
    if (!id) return L().nonClasse;
    const c = cats().find((x) => x.id === id);
    return c ? libCat(c) : L().nonClasse;
  }

  /**
   * Options d'un <select> de categorie. L'entree « non classe » n'apparait
   * que si elle est REELLEMENT utilisee : la proposer partout inviterait a
   * declasser des objets, alors que c'est un etat de transition.
   */
  function optionsCats(choisie) {
    const liste = cats();
    const connue = liste.some((c) => c.id === choisie);
    let html = '';
    if (!connue) {
      html += '<option value=""' + (choisie ? '' : ' selected') + '>' +
        esc(L().nonClasse) + '</option>';
    }
    return html + liste.map((c) =>
      '<option value="' + esc(c.id) + '"' + (c.id === choisie ? ' selected' : '') + '>' +
      esc(libCat(c)) + '</option>').join('');
  }

  /** Nombre d'objets par identifiant de categorie, dans l'inventaire courant. */
  function compteCats() {
    const n = {};
    S.items.forEach((o) => { const k = o.categorie || ''; n[k] = (n[k] || 0) + 1; });
    return n;
  }

  /** Emplacements distincts saisis, tries. */
  function emplacements() {
    const vus = new Set();
    S.items.forEach((o) => { const e = (o.emplacement || '').trim(); if (e) vus.add(e); });
    return Array.from(vus).sort((a, b) => a.localeCompare(b, lang(), { numeric: true }));
  }
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
    $('invSearch').placeholder = l.chercher2;
    $('invPrendre').textContent = l.ajoutPhoto;
    $('invMenu').setAttribute('aria-label', l.menu);
    $('invCibleTout').textContent = l.cibleTout;
    // Menu ⋯ — les memes actions qu'avant, rangees au lieu d'etaler l'ecran.
    $('invTeleverser').textContent = l.televerser;
    $('invVide').textContent = l.ligneVide;
    $('invGererCats').textContent = l.gererCats;
    $('invAchats').textContent = l.achats;
    $('invPlanche').textContent = l.planche;
    $('invCsv').textContent = l.csv;
    $('invImprimer').textContent = l.imprimer;
    $('invNouveau').textContent = l.nouveau;
    $('invRenommer').textContent = l.renommer;
    $('invSupprInv').textContent = l.supprInv;
    $('invReset').textContent = l.reset;
    $('invFUnivLbl').textContent = l.tousUniv;
    $('invDateLbl').textContent = l.dateInv;
    const ivd = invCourant();
    $('invDateInv').value = (ivd && ivd.date) || '';
    // Modales — inchangees
    $('invCatsTitre').textContent = l.catsTitre;
    $('invCatsNote').textContent = l.catsNote;
    $('invCatsLblFr').textContent = l.catsFr;
    $('invCatsLblEn').textContent = l.catsEn;
    $('invCatsAjout').textContent = l.catsAjout;
    $('invReTitre').textContent = l.reTitre;
    $('invReOk').textContent = l.reOk;
    $('invReAnnuler').textContent = l.reAnnuler;
    $('invQRTitre').textContent = l.qrTitre;
    $('invQRImpr').textContent = l.qrImpr;
    $('invPlTitre').textContent = l.plTitre;
    $('invPlLblPortee').textContent = l.plPortee;
    $('invPlLblValeur').textContent = l.plValeur;
    $('invPlImpr').textContent = l.plImpr;
    $('invAchatsCsv').textContent = l.csv;
    $('invAchatsImpr').textContent = l.imprimer;
    $('invPhotoPrincipale').textContent = l.principale;
    $('invPhotoAjout').textContent = l.photoAjout;
    $('invPhotoSuppr').textContent = l.photoSuppr;
    document.documentElement.lang = lang() === 'en' ? 'en' : 'fr-CA';

    // Filtres
    $('invFCat').innerHTML = '<option value="*">' + esc(l.toutesCat) + '</option>' +
      cats().map((c) => '<option value="' + esc(c.id) + '">' + esc(libCat(c)) + '</option>').join('');
    if (S.f.cat !== '*' && !cats().some((c) => c.id === S.f.cat)) S.f.cat = '*';
    $('invFCat').value = S.f.cat;

    $('invFUniv').innerHTML = '<option value="*">' + esc(l.tousUniv) + '</option>' +
      optionsHtml(UNIVERS, l.univ, S.f.univ);
    $('invFUniv').value = S.f.univ;

    $('invFEtat').innerHTML = '<option value="*">' + esc(l.tousEtats) + '</option>' +
      optionsHtml(ETATS, l.etat, S.f.etat);
    $('invFEtat').value = S.f.etat;

    // Filtre par emplacement — nouveau, il remplace le ciblage cache que
    // seuls les codes QR savaient poser.
    const locs = emplacements();
    $('invFLoc').innerHTML = '<option value="*">' + esc(l.tousLieux) + '</option>' +
      locs.map((e) => '<option value="' + esc(e) + '">' + esc(e) + '</option>').join('');
    if (S.f.loc !== '*' && locs.indexOf(S.f.loc) < 0) S.f.loc = '*';
    $('invFLoc').value = S.f.loc;
  }

  /** Les annees d'un lieu, de la plus ancienne a la plus recente. */
  function anneesDe(nom) {
    return S.inventaires.filter((x) => x.nom === nom)
      .sort((a, b) => (a.annee || '').localeCompare(b.annee || ''));
  }

  /** Un inventaire par LIEU : celui de l'annee la plus recente. */
  function lieux() {
    const vus = new Map();
    S.inventaires.forEach((iv) => {
      const p = vus.get(iv.nom);
      if (!p || (iv.annee || '') > (p.annee || '')) vus.set(iv.nom, iv);
    });
    return Array.from(vus.values())
      .sort((a, b) => (a.nom || '').localeCompare(b.nom || '', 'fr'));
  }

  function peintInventaires() {
    const l = L();
    // Le selecteur du haut liste les LIEUX, pas les annees : le classeur, pas
    // les feuilles. Les annees sont en onglets au bas de l'ecran.
    const courant = invCourant();
    $('invSel').innerHTML = lieux().map((iv) =>
      '<option value="' + esc(iv.id) + '"' +
      (courant && iv.nom === courant.nom ? ' selected' : '') + '>' +
      esc(iv.nom) + ' — ' + esc(l.univ[iv.univers] || iv.univers) + '</option>').join('');
    peintOnglets();
    const iv = invCourant();
    $('invPrintTitre').textContent = iv ? iv.nom + ' — ' + (l.univ[iv.univers] || '') : '';
    // La date de l'inventaire l'emporte sur celle du jour : une feuille
    // imprimee trois jours apres le comptage doit porter la date du COMPTAGE.
    const iso = (iv && iv.date) || aujourdhui();
    const jour = new Date(iso + 'T12:00:00');
    $('invPrintDate').textContent = L().dateInv + ' ' + jour.toLocaleDateString(
      lang() === 'en' ? 'en-CA' : 'fr-CA', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Le filtre par univers porte sur l'INVENTAIRE, pas sur l'objet : un objet
  // appartient a un lieu, et c'est le lieu qui a un univers. Filtrer par
  // univers revient donc a masquer les objets quand l'inventaire courant n'est
  // pas de cet univers — le tableau se vide d'un coup, ce qui est le
  // comportement attendu et non un bug.
  function peintOnglets() {
    const l = L(), iv = invCourant();
    const hote = $('invOnglets');
    if (!iv) { hote.innerHTML = ''; return; }
    const annees = anneesDe(iv.nom);
    hote.innerHTML = annees.map((a) =>
      '<button class="inv-ong" type="button" role="tab" data-inv="' + esc(a.id) + '" ' +
      'aria-selected="' + (a.id === iv.id ? 'true' : 'false') + '">' + esc(a.annee) + '</button>'
    ).join('') +
      '<button class="inv-ong inv-ong--plus" type="button" id="invOngPlus" ' +
      'title="' + esc(l.ongPlusTitre) + '">' + esc(l.ongPlus) + '</button>';
  }

  /**
   * Ouvre l'annee suivante en reprenant les objets. On demande confirmation :
   * la copie peut porter sur des centaines d'objets et leurs photos, et c'est
   * la seule operation de l'app qui ecrit autant d'un coup.
   */
  async function ouvreAnneeSuivante() {
    if (bloqueSiHorsLigne()) return;
    const l = L(), iv = invCourant();
    if (!iv) return;
    const annees = anneesDe(iv.nom);
    const derniere = annees[annees.length - 1];
    const cible = InvData.anneeSuivante(derniere.annee);
    if (!confirm(l.ongConfirme(cible, S.items.length))) return;
    msg(l.ongEnCours);
    try {
      const r = await InvData.ouvrirAnnee(derniere.id, cible);
      S.inventaires.push(r.inv);
      InvData.cache.ecrireListe(S.inventaires);
      await changeInventaire(r.inv.id);
      msg(l.ongFaite(cible, r.copies));
    } catch (e) { msg(l.mErrSauve(e.message), true); }
  }

  function filtres() {
    const q = S.f.q.trim().toLowerCase();
    const iv = invCourant();
    if (S.f.univ !== '*' && (!iv || iv.univers !== S.f.univ)) return [];
    let out = S.items.filter((o) =>
      (!S.cible.item || o.id === S.cible.item) &&
      (!S.cible.loc || (o.emplacement || '').trim() === S.cible.loc) &&
      (S.f.loc === '*' || (o.emplacement || '').trim() === S.f.loc) &&
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
      if (c === 'categorie') { x = libCatId(x); y = libCatId(y); }
      return String(x || '').localeCompare(String(y || ''), lang(), { numeric: true }) * s;
    });
    return out;
  }

  // Deux formats, deux usages. Les pastilles et la rangee de totaux arrondissent
  // — personne ne lit la valeur d'un gymnase a la cenne pres — mais le prix
  // d'un objet, si : « 12,75 $ » affiche « 13 $ » donne l'impression que la
  // saisie a ete refusee.
  /** Date du jour en ISO, dans le fuseau LOCAL — toISOString() donnerait la
      veille pour tout ce qui se fait apres 20 h a Montreal. */
  function aujourdhui() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }

  function devise() {
    return new Intl.NumberFormat(lang() === 'en' ? 'en-CA' : 'fr-CA',
      { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 });
  }
  function deviseSou() {
    return new Intl.NumberFormat(lang() === 'en' ? 'en-CA' : 'fr-CA',
      { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** Compteurs de l'inventaire ENTIER, pas de la vue filtree. */
  function totaux() {
    const n = S.items.length;
    const qte = S.items.reduce((t, o) => t + (+o.qteMain || 0), 0);
    const ach = S.items.reduce((t, o) => t + (+o.qteAcheter || 0), 0);
    const val = S.items.reduce((t, o) =>
      t + ((o.prix == null ? 0 : +o.prix) * Math.max(1, +o.qteMain || 0)), 0);
    const racheter = S.items.filter((o) => (+o.qteAcheter || 0) > 0 || o.etat === 'remplacer').length;
    return { n, qte, ach, val, racheter };
  }

  function peintStats() {
    const l = L(), t = totaux(), dev = devise();
    $('invStats').innerHTML = [
      ['📦', t.n, l.stat.objets, ''],
      ['💰', dev.format(t.val), l.stat.valeur, ''],
      ['🛒', t.racheter, l.stat.racheter, t.racheter > 0 ? ' inv-pill--alerte' : '']
    ].map(([ico, nb, quoi, cls]) =>
      '<div class="inv-pill' + cls + '"><span class="inv-pill__nb">' + ico + ' ' + esc(nb) +
      '</span><span class="inv-pill__q">' + esc(quoi) + '</span></div>').join('');
  }

  function peintEntete() {
    const l = L();
    $('invThead').innerHTML = '<tr>' + COLONNES.map((k) => {
      const fleche = (S.tri.col === k.c && k.tri)
        ? ' <span class="inv-tri">' + (S.tri.sens > 0 ? '▲' : '▼') + '</span>' : '';
      const long = (l.colLong && l.colLong[k.c]) || l.col[k.c];
      return '<th class="inv-c-' + k.c + '" data-col="' + k.c + '" data-tri="' +
        (k.tri ? 'oui' : 'non') + '" scope="col" title="' + esc(long) + '">' +
        esc(l.col[k.c]) + fleche + '</th>';
    }).join('') + '</tr>';
  }

  /** Rangee de totaux figee au bas de la feuille. */
  function peintTotaux() {
    const l = L(), t = totaux(), dev = devise();
    const val = {
      num: 'Σ', nom: l.totObjets(t.n), qteMain: t.qte, qteAcheter: t.ach,
      prix: dev.format(t.val)
    };
    $('invTfoot').innerHTML = '<tr>' + COLONNES.map((k) =>
      '<td class="inv-c-' + k.c + '">' + esc(val[k.c] == null ? '' : val[k.c]) + '</td>').join('') + '</tr>';
    // Sur telephone, <tfoot> ne peut pas se figer (voir la feuille de style) :
    // cette barre-la porte les memes chiffres.
    $('invTotMob').innerHTML =
      '<span>' + esc(l.totObjets(t.n)) + '</span>' +
      '<span>' + esc(l.totQte) + ' ' + t.qte + '</span>' +
      '<span>' + esc(l.totAch) + ' ' + t.ach + '</span>' +
      '<span>' + esc(dev.format(t.val)) + '</span>';
  }

  /* ── Contenu d'une cellule, en LECTURE ────────────────────────────────
     La feuille affiche du TEXTE, pas des champs de saisie. Un tableau de
     douze colonnes de <input> pese lourd a l'affichage, se lit comme un
     formulaire et non comme une feuille, et le clavier y saute de champ en
     champ meme quand on ne veut rien changer. Le champ n'apparait qu'a
     l'endroit ou l'on clique — voir ouvreEdition(). ------------------- */
  function celluleHtml(o, k, l, rang) {
    const id = esc(o.id);
    const cls = 'inv-c-' + k.c;
    const edt = k.ed ? ' inv-ed' : '';
    const attr = k.ed ? ' data-id="' + id + '" data-champ="' + k.c + '"' : '';

    if (k.c === 'num') return '<td class="' + cls + '">' + rang + '</td>';

    if (k.c === 'photo') {
      const n = o.photos ? o.photos.length : 0;
      const vue = n
        ? '<img src="' + esc(o.photos[0]) + '" alt="' + esc(o.nom || l.objetSansNom) + '">'
        : '📷';
      const plus = n > 1 ? '<span class="inv-vg__plus">+' + (n - 1) + '</span>' : '';
      return '<td class="' + cls + '"><button class="inv-vg" type="button" data-act="voir" ' +
        'data-id="' + id + '" aria-label="' + esc(l.voirPhotos) + '">' + vue + plus + '</button></td>';
    }

    if (k.c === 'actions') {
      return '<td class="' + cls + '">' +
        '<button class="inv-ic" type="button" data-act="qr" data-id="' + id + '" ' +
        'title="' + esc(l.qr) + '">🔳</button>' +
        '<button class="inv-ic" type="button" data-act="suppr" data-id="' + id + '" ' +
        'title="' + esc(l.supprimer) + '">🗑️</button></td>';
    }

    if (k.c === 'etat') {
      return '<td class="' + cls + edt + '"' + attr + '><span class="inv-bd inv-bd--' +
        esc(o.etat) + '">' + esc(l.etat[o.etat] || o.etat) + '</span></td>';
    }

    if (k.c === 'categorie') {
      const t = libCatId(o.categorie);
      return '<td class="' + cls + edt + '"' + attr + '>' +
        (o.categorie ? esc(t) : '<span class="inv-vide-txt">' + esc(t) + '</span>') + '</td>';
    }

    if (k.c === 'date') {
      return '<td class="' + cls + edt + '"' + attr + '>' +
        (o.date ? esc(o.date) : '<span class="inv-vide-txt">' + esc(l.videCell) + '</span>') + '</td>';
    }

    if (k.c === 'prix') {
      return '<td class="' + cls + edt + '"' + attr + '>' +
        (o.prix == null ? '<span class="inv-vide-txt">' + esc(l.videCell) + '</span>'
                        : esc(deviseSou().format(+o.prix))) + '</td>';
    }

    if (k.c === 'qteMain' || k.c === 'qteAcheter') {
      return '<td class="' + cls + edt + '"' + attr + '>' + esc(o[k.c] == null ? 0 : o[k.c]) + '</td>';
    }

    const v = o[k.c] || '';
    return '<td class="' + cls + edt + '"' + attr + '>' +
      (v ? esc(v) : '<span class="inv-vide-txt">' + esc(l.videCell) + '</span>') + '</td>';
  }

  function peintTableau() {
    const l = L();
    const liste = filtres();
    peintEntete();
    peintTotaux();

    let html = liste.map((o, i) =>
      '<tr data-id="' + esc(o.id) + '"' + (S.cible.item === o.id ? ' data-vise="oui"' : '') + '>' +
      COLONNES.map((k) => celluleHtml(o, k, l, i + 1)).join('') + '</tr>').join('');

    // Rangee vide toujours prete, comme au bas d'une feuille de calcul.
    // Elle ne s'affiche pas sous un ciblage par code QR : la vue est alors
    // volontairement reduite a un objet, ajouter une rangee n'y a pas de sens.
    if (!S.cible.item && !S.cible.loc) {
      html += '<tr class="inv-neuve" data-neuve="oui">' + COLONNES.map((k) =>
        '<td class="inv-c-' + k.c + '">' +
        (k.c === 'num' ? (liste.length + 1) : (k.c === 'nom' ? esc(l.nouvelleLigne) : '')) +
        '</td>').join('') + '</tr>';
    }
    $('invTbody').innerHTML = html;

    const vide = liste.length === 0;
    $('invEmpty').hidden = !vide;
    $('invEmpty').textContent = S.items.length === 0 ? l.videInv : l.vide;
    dimensionne();
  }

  /* ── Hauteur de la feuille ────────────────────────────────────────────
     Elle se CALCULE, elle ne se code pas en dur. Un `calc(100vh - 250px)`
     suppose une barre d'outils d'une hauteur donnee — or elle se replie sur
     trois rangees a 375 px et sur une seule a 1440 px — et il suppose aussi
     que rien n'occupe le bas de l'ecran, alors que le ruban d'outils du shell
     y tient 149 px sur telephone. Les deux valeurs sont mesurees.
     ------------------------------------------------------------------- */
  function dimensionne() {
    const f = $('invFeuille');
    if (!f) return;
    const rail = document.querySelector('.ztsh-casier');
    const bas = rail
      ? Math.max(12, Math.round(window.innerHeight - rail.getBoundingClientRect().top + 8))
      : 12;
    document.documentElement.style.setProperty('--inv-bas', bas + 'px');
    // Hauteur de la barre de navigation fixe : c'est sous elle que la feuille
    // vient s'amarrer.
    const haut = document.querySelector('.zts-topbar');
    const hautPx = haut ? Math.round(haut.getBoundingClientRect().height) + 6 : 76;
    document.documentElement.style.setProperty('--inv-haut', hautPx + 'px');
    // Sous 900 px la feuille prend sa hauteur naturelle : c'est la page qui
    // defile, et lui imposer un plafond la reduirait a trois rangees.
    // De la place sous la feuille, pour que la page puisse defiler assez loin
    // pour l'amener s'amarrer — et pour que le ruban ne recouvre jamais la
    // derniere rangee.
    $('invWrap').style.paddingBottom = (bas + 24) + 'px';
    if (window.innerWidth < 900) {
      document.documentElement.style.setProperty('--inv-max', 'none');
      return;
    }
    // La hauteur vise l'ECRAN, pas la position de la feuille dans la page.
    //
    // Mesure du 23 aout, fenetre de 900 px : le header partage reserve 327 px
    // de padding sur <body>, la sous-navigation 62 et la barre d'outils 85 —
    // la feuille commencait a 521 px et il ne lui restait que 289 px, soit
    // quatre rangees sur un grand ecran.
    //
    // En la dimensionnant sur la fenetre, elle depasse d'abord sous la ligne
    // de flottaison ; un petit coup de molette suffit alors a l'amener en
    // place, le header du site se replie de lui-meme (hideHeaderOnScroll) et
    // la feuille occupe exactement l'ecran. On ne fait defiler la page a la
    // place de personne — ce serait le genre d'automatisme qui donne
    // l'impression que la page est cassee.
    // Une fois amarree, la feuille occupe de `haut` a `innerHeight - bas`.
    // Oublier `haut` dans ce calcul la faisait finir 49 px SOUS le ruban du
    // shell, qui recouvrait alors la rangee de totaux — celle qui doit
    // justement rester visible.
    // Les onglets d'annees vivent SOUS la feuille : leur hauteur se retire
    // aussi, sinon la derniere rangee du tableau passe dessous.
    const ong = $('invOnglets');
    const hOng = ong && ong.children.length ? Math.round(ong.getBoundingClientRect().height) + 6 : 0;
    const dispo = Math.max(300, Math.round(window.innerHeight - hautPx - bas - hOng - 8));
    document.documentElement.style.setProperty('--inv-max', dispo + 'px');
  }

  function peintTout() {
    peintTextes();
    peintInventaires();
    peintStats();
    peintTableau();
    peintCible();
    const ma = $('invModalAchats');
    if (ma && ma.classList.contains('open')) peintAchats();
    // Meme raison : ces modales sont du HTML fige. Sans ce rappel, une
    // bascule FR/EN les laisserait dans l'ancienne langue.
    if ($('invModalCats').classList.contains('open')) peintCats();
    if ($('invModalPlanche').classList.contains('open')) peintPlanche();
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

  /* ======================================================================
     5b. EDITION DANS LA CELLULE — comme un tableur
     ----------------------------------------------------------------------
     Un clic ouvre la cellule, Entree valide, Echap annule, Tab passe a la
     suivante. Aucune modale pour un champ simple.

     UNE SEULE cellule est ouverte a la fois. C'est ce qui permet a la feuille
     de rester du texte : douze colonnes de <input> par rangee, sur deux cents
     objets, c'est 2400 champs dans le document, et le clavier qui les
     traverse tous meme quand on ne veut rien changer.
     ====================================================================== */

  /** Valeur brute a mettre dans le champ, par type de colonne. */
  function valeurBrute(o, champ) {
    if (champ === 'prix') return o.prix == null ? '' : String(o.prix);
    if (champ === 'qteMain' || champ === 'qteAcheter') return String(o[champ] == null ? 0 : o[champ]);
    return o[champ] == null ? '' : String(o[champ]);
  }

  /** Ecrit la valeur saisie dans le modele local. Retourne true si ca change. */
  function poseValeur(o, champ, v) {
    const avant = valeurBrute(o, champ);
    if (champ === 'qteMain' || champ === 'qteAcheter') {
      o[champ] = Math.max(0, Math.round(+v || 0));
    } else if (champ === 'prix') {
      // La virgule decimale est la norme au Quebec : la refuser obligerait a
      // taper un point sur un clavier francais.
      const t = String(v).replace(',', '.').trim();
      o.prix = t === '' ? null : Math.max(0, +t || 0);
    } else if (champ === 'date') {
      o.date = InvData.dateIso(v);
    } else {
      o[champ] = String(v);
    }
    return valeurBrute(o, champ) !== avant;
  }

  /** Cellules editables de la feuille, dans l'ordre de lecture. */
  function cellulesEditables() {
    return Array.prototype.slice.call($('invTbody').querySelectorAll('td[data-champ]'));
  }

  /**
   * Ouvre une cellule en edition.
   * @param {HTMLElement} td
   * @param {boolean} [toutSelectionner] true au clic, false a l'arrivee par Tab
   */
  function ouvreEdition(td, toutSelectionner) {
    if (!td || td.classList.contains('inv-edit')) return;
    if (bloqueSiHorsLigne()) return;
    fermeEdition(true);

    const id = td.getAttribute('data-id');
    const champ = td.getAttribute('data-champ');
    const o = item(id);
    if (!o) return;

    const col = COLONNES.find((k) => k.c === champ);
    const type = col ? col.ed : 'txt';
    let ctrl;

    if (type === 'cat') {
      ctrl = document.createElement('select');
      ctrl.innerHTML = optionsCats(o.categorie);
      ctrl.value = o.categorie || '';
    } else if (type === 'etat') {
      ctrl = document.createElement('select');
      ctrl.innerHTML = optionsHtml(ETATS, L().etat, o.etat);
      ctrl.value = o.etat;
    } else if (type === 'date') {
      // Le selecteur natif du navigateur : sur iPhone c'est la roulette de
      // dates, sur ordinateur le petit calendrier. Rien a ecrire, et le
      // format rendu est toujours l'ISO attendu par dataStore.
      ctrl = document.createElement('input');
      ctrl.type = 'date';
      ctrl.value = o.date || '';
    } else {
      ctrl = document.createElement('input');
      ctrl.type = 'text';
      if (type === 'nb') { ctrl.inputMode = 'numeric'; }
      if (type === 'prix') { ctrl.inputMode = 'decimal'; }
      ctrl.value = valeurBrute(o, champ);
    }

    S.edite = { id: id, champ: champ };
    td.classList.add('inv-edit');
    td.textContent = '';
    td.appendChild(ctrl);
    ctrl.focus();
    if (ctrl.select && toutSelectionner !== false) { try { ctrl.select(); } catch (e) {} }

    // Un menu se valide des le choix : attendre Entree sur un <select> serait
    // une etape de plus pour rien.
    if (ctrl.tagName === 'SELECT') {
      ctrl.addEventListener('change', () => fermeEdition(true));
    }
    ctrl.addEventListener('blur', () => fermeEdition(true));
    ctrl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { e.preventDefault(); fermeEdition(true); }
      else if (e.key === 'Escape') { e.preventDefault(); fermeEdition(false); }
      else if (e.key === 'Tab') {
        e.preventDefault();
        const cible = voisineEditable(td, e.shiftKey ? -1 : 1);
        fermeEdition(true);
        if (cible) ouvreEdition(cible, true);
      }
    });
  }

  function voisineEditable(td, pas) {
    const liste = cellulesEditables();
    const i = liste.indexOf(td);
    if (i < 0) return null;
    return liste[i + pas] || null;
  }

  /**
   * Referme la cellule ouverte.
   * @param {boolean} valider true = Entree/Tab/perte de focus, false = Echap
   */
  function fermeEdition(valider) {
    const td = $('invTbody').querySelector('td.inv-edit');
    if (!td) { S.edite = null; return; }
    const ctrl = td.querySelector('input, select');
    const id = td.getAttribute('data-id');
    const champ = td.getAttribute('data-champ');
    const o = item(id);
    S.edite = null;
    td.classList.remove('inv-edit');

    if (o && valider && ctrl) {
      const change = poseValeur(o, champ, ctrl.value);
      if (change) {
        planifie(id);
        // Les colonnes qui alimentent les compteurs et les filtres refont
        // toute la feuille ; les autres ne repeignent que leur cellule, pour
        // que le curseur ne saute pas d'une rangee a l'autre au clavier.
        if (champ === 'qteMain' || champ === 'qteAcheter' || champ === 'prix' ||
            champ === 'etat' || champ === 'categorie' || champ === 'emplacement') {
          peintStats(); peintTextes(); peintTableau();
          return;
        }
      }
    }
    // Redessiner la seule cellule.
    const l = L(), col = COLONNES.find((k) => k.c === champ);
    if (o && col) {
      const tmp = document.createElement('tbody');
      tmp.innerHTML = '<tr>' + celluleHtml(o, col, l, 0) + '</tr>';
      td.parentNode.replaceChild(tmp.querySelector('td'), td);
    }
  }

  /** Clic dans la feuille : ouvrir une cellule, ou creer la rangee vide. */
  function surFeuille(e) {
    const b = e.target.closest('[data-act]');
    if (b) return;                                  // bouton : gere ailleurs
    const neuve = e.target.closest('tr[data-neuve]');
    if (neuve) { ligneVide(); return; }
    const td = e.target.closest('td[data-champ]');
    if (td) ouvreEdition(td, true);
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
    try { vu = await InvData.vision(prep.base64, prep.mediaType, lang(), cats()); }
    catch (e) { erreurIA = e.message || 'IA'; }

    // Le worker ne renvoie une categorie que si elle EXISTE dans la liste
    // envoyee. Sinon il propose un libelle dans `nouvelle` — et l'app ne cree
    // rien toute seule : elle demande, en un tap.
    const connue = vu && vu.categorie && cats().some((c) => c.id === vu.categorie);
    const brut = {
      photos: [prep.vignette],
      nom: (vu && vu.nom) || '',
      marque: (vu && vu.marque) || '',
      description: (vu && vu.description) || '',
      categorie: connue ? vu.categorie : '',
      emplacement: '', date: aujourdhui(), qteMain: 1, qteAcheter: 0,
      etat: 'bon', prix: null, notes: ''
    };
    try {
      const cree = await InvData.creerItem(S.invId, brut);
      S.items.unshift(cree);
      InvData.cache.ecrire(S.invId, S.items);
      peintStats(); peintTableau();
      if (erreurIA) { msg(l.mEchecIA(erreurIA), true); }
      else if (!connue && vu && vu.nouvelle) { proposeCategorie(vu.nouvelle, cree.id); }
      else { msg(l.mAjoute(cree.nom || l.objetSansNom)); }
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
      // La nouvelle rangee s'ouvre directement sur son nom : ajouter une
      // ligne et devoir ensuite la chercher pour la nommer serait une etape
      // de trop sur une feuille.
      const cel = document.querySelector('tr[data-id="' + cree.id + '"] td[data-champ="nom"]');
      if (cel) ouvreEdition(cel, true);
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
     7b. CATEGORIES (ajout C)
     ====================================================================== */

  /**
   * Proposition de l'IA pour une categorie qui n'existe pas. Rien n'est cree
   * tant que l'usager n'a pas touche le bouton.
   */
  function proposeCategorie(libelle, itemId) {
    const l = L();
    const propre = String(libelle || '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!propre) { msg(l.mAjoute(l.objetSansNom)); return; }
    msg(l.iaNouvelle(propre), false, {
      texte: l.iaAjouter(propre),
      onclic: async function () {
        if (bloqueSiHorsLigne()) return;
        const iv = invCourant();
        if (!iv) return;
        const neuve = { id: InvData.nouvelIdCategorie(), fr: propre, en: '' };
        try {
          iv.categories = await InvData.majCategories(iv.id, cats().concat([neuve]));
          InvData.cache.ecrireListe(S.inventaires);
          const o = item(itemId);
          if (o) {
            o.categorie = neuve.id;
            await InvData.majItem(itemId, { categorie: neuve.id }, o);
            InvData.cache.ecrire(S.invId, S.items);
          }
          peintTextes(); peintTableau();
          msg(l.mSauve);
        } catch (e) { msg(l.mErrSauve(e.message), true); }
      }
    });
  }

  /**
   * Liste editable. Le brouillon `S.catsBrouillon` vit dans l'etat le temps
   * de la modale : on n'ecrit pas dans Firestore a chaque frappe, et fermer
   * la modale sans rien changer n'ecrit rien du tout.
   */
  function peintCats() {
    const l = L(), n = compteCats(), liste = S.catsBrouillon || [];
    $('invCatsListe').innerHTML = liste.map((c, i) =>
      '<div class="inv-catl" data-i="' + i + '">' +
        '<div class="inv-catl__ordre">' +
          '<button class="inv-mini" type="button" data-cat="haut" data-i="' + i + '" ' +
            'aria-label="' + esc(l.catsMonter) + '"' + (i === 0 ? ' disabled' : '') + '>▲</button>' +
          '<button class="inv-mini" type="button" data-cat="bas" data-i="' + i + '" ' +
            'aria-label="' + esc(l.catsDescendre) + '"' +
            (i === liste.length - 1 ? ' disabled' : '') + '>▼</button>' +
        '</div>' +
        '<input class="inv-in inv-catl__champ" type="text" data-cat="fr" data-i="' + i +
          '" value="' + esc(c.fr) + '">' +
        '<input class="inv-in inv-catl__champ" type="text" data-cat="en" data-i="' + i +
          '" value="' + esc(c.en) + '">' +
        '<span class="inv-catl__nb">' + esc(l.catsObjets(n[c.id] || 0)) + '</span>' +
        '<button class="inv-mini inv-mini--suppr" type="button" data-cat="suppr" data-i="' + i +
          '">🗑️</button>' +
      '</div>').join('');
  }

  async function enregistreCats() {
    const iv = invCourant();
    if (!iv || !S.catsBrouillon) return;
    try {
      iv.categories = await InvData.majCategories(iv.id, S.catsBrouillon);
      S.catsBrouillon = iv.categories.map((c) => Object.assign({}, c));
      InvData.cache.ecrireListe(S.inventaires);
      peintTextes(); peintStats(); peintTableau(); peintCats();
      msg(L().mSauve);
    } catch (e) { msg(L().mErrSauve(e.message), true); }
  }

  function ouvreCats() {
    S.catsBrouillon = cats().map((c) => Object.assign({}, c));
    peintTextes(); peintCats();
    ZTS.openModal('invModalCats');
  }

  function surCats(e) {
    const el = e.target.closest('[data-cat]');
    if (!el) return;
    const quoi = el.getAttribute('data-cat');
    const i = +el.getAttribute('data-i');
    const liste = S.catsBrouillon;
    if (!liste || !liste[i]) return;

    if (quoi === 'fr' || quoi === 'en') {
      liste[i][quoi] = el.value.slice(0, 60);
      planifieCats();
      return;
    }
    if (bloqueSiHorsLigne()) return;
    if (quoi === 'haut' && i > 0) {
      liste.splice(i - 1, 0, liste.splice(i, 1)[0]);
      peintCats(); enregistreCats();
    } else if (quoi === 'bas' && i < liste.length - 1) {
      liste.splice(i + 1, 0, liste.splice(i, 1)[0]);
      peintCats(); enregistreCats();
    } else if (quoi === 'suppr') {
      supprimeCat(i);
    }
  }

  // Meme raison que pour le tableau : une frappe par caractere ne doit pas
  // faire une ecriture Firestore par caractere.
  let _tCats = null;
  function planifieCats() {
    if (bloqueSiHorsLigne()) return;
    clearTimeout(_tCats);
    _tCats = setTimeout(enregistreCats, 700);
  }

  function ajouteCat() {
    if (bloqueSiHorsLigne()) return;
    S.catsBrouillon.push({ id: InvData.nouvelIdCategorie(), fr: L().catsNeuve, en: '' });
    peintCats();
    enregistreCats();
    const champs = $('invCatsListe').querySelectorAll('[data-cat="fr"]');
    const dernier = champs[champs.length - 1];
    if (dernier) { dernier.focus(); dernier.select(); }
  }

  /**
   * Suppression. Une categorie VIDE part directement ; une categorie utilisee
   * passe par la modale de reassignation — on ne declasse jamais des objets
   * dans le dos de l'usager.
   */
  function supprimeCat(i) {
    const l = L(), liste = S.catsBrouillon;
    if (liste.length <= 1) { msg(l.catsUneSeule, true); return; }
    const cat = liste[i];
    const nb = compteCats()[cat.id] || 0;
    if (nb === 0) {
      liste.splice(i, 1);
      peintCats(); enregistreCats();
      return;
    }
    S.reassign = { index: i, nb: nb };
    $('invReTxt').textContent = l.reTxt(libCat(cat), nb);
    $('invReVers').innerHTML = liste
      .filter((c, k) => k !== i)
      .map((c) => '<option value="' + esc(c.id) + '">' + esc(libCat(c)) + '</option>').join('');
    ZTS.openModal('invModalReassign');
  }

  async function confirmeReassign() {
    if (bloqueSiHorsLigne()) return;
    const l = L(), r = S.reassign, liste = S.catsBrouillon;
    if (!r || !liste[r.index]) return;
    const de = liste[r.index].id;
    const vers = $('invReVers').value;
    const nomVers = libCatId(vers);
    try {
      const n = await InvData.reassignerCategorie(S.invId, de, vers);
      S.items.forEach((o) => { if ((o.categorie || '') === de) o.categorie = vers; });
      liste.splice(r.index, 1);
      S.reassign = null;
      ZTS.closeModal('invModalReassign');
      await enregistreCats();
      InvData.cache.ecrire(S.invId, S.items);
      msg(l.reFait(n, nomVers));
    } catch (e) { msg(l.mErrSauve(e.message), true); }
  }

  /* ======================================================================
     7c. CODES QR (ajout D)
     ====================================================================== */

  // L'URL pointe vers le SITE, pas vers un format maison : la camera native
  // de n'importe quel telephone ouvre un lien sans qu'on ait de lecteur a
  // ecrire. Le mur zts-gate fait ensuite son travail, et l'app rejoue les
  // parametres apres la connexion (voir `lisCible`).
  const BASE_QR = 'https://zonetotalsport.ca/apps/inventaire/';

  function urlItem(id) {
    return BASE_QR + '?inv=' + encodeURIComponent(S.invId) + '&item=' + encodeURIComponent(id);
  }
  function urlLoc(emplacement) {
    return BASE_QR + '?inv=' + encodeURIComponent(S.invId) + '&loc=' + encodeURIComponent(emplacement);
  }

  function ouvreQR(url, titre) {
    const l = L();
    $('invQRTitre').textContent = titre;
    // Niveau M : une etiquette collee sur un bac se salit et se corne.
    $('invQRImg').innerHTML = ZTSQR.svg(url, { taille: 260, niveau: 'M' });
    $('invQRUrl').textContent = l.qrScan;
    $('invQRImg').setAttribute('data-url', url);
    $('invQRImg').setAttribute('data-titre', titre);
    ZTS.openModal('invModalQR');
  }

  /**
   * Etiquettes a imprimer, selon la portee choisie.
   * @returns {Array<{url:string, titre:string, sous:string}>}
   */
  function etiquettes() {
    const iv = invCourant();
    const nomInv = iv ? iv.nom : '';
    const p = S.planche;
    if (p.portee === 'locs') {
      return emplacements().map((e) => ({ url: urlLoc(e), titre: e, sous: nomInv }));
    }
    let liste = S.items.slice();
    if (p.portee === 'cat') liste = liste.filter((o) => (o.categorie || '') === p.valeur);
    if (p.portee === 'loc') liste = liste.filter((o) => (o.emplacement || '').trim() === p.valeur);
    return liste.map((o) => ({
      url: urlItem(o.id),
      titre: o.nom || L().objetSansNom,
      sous: [o.emplacement, nomInv].filter(Boolean).join(' · ')
    }));
  }

  function peintPlanche() {
    const l = L(), p = S.planche;
    $('invPlPortee').innerHTML = [
      ['tous', l.plTous], ['cat', l.plCat], ['loc', l.plLoc], ['locs', l.plLocs]
    ].map(([v, t]) => '<option value="' + v + '"' + (v === p.portee ? ' selected' : '') + '>' +
      esc(t) + '</option>').join('');

    const sel = $('invPlValeur');
    if (p.portee === 'cat') {
      sel.hidden = false; $('invPlLblValeur').hidden = false;
      sel.innerHTML = cats().map((c) => '<option value="' + esc(c.id) + '">' + esc(libCat(c)) +
        '</option>').join('');
      if (!cats().some((c) => c.id === p.valeur)) p.valeur = cats().length ? cats()[0].id : '';
      sel.value = p.valeur;
    } else if (p.portee === 'loc') {
      const locs = emplacements();
      sel.hidden = false; $('invPlLblValeur').hidden = false;
      sel.innerHTML = locs.map((e) => '<option value="' + esc(e) + '">' + esc(e) + '</option>').join('');
      if (locs.indexOf(p.valeur) < 0) p.valeur = locs[0] || '';
      sel.value = p.valeur;
    } else {
      sel.hidden = true; $('invPlLblValeur').hidden = true;
    }

    const n = etiquettes().length;
    $('invPlCompte').textContent = n ? l.plCompte(n)
      : (p.portee === 'locs' ? l.plSansLoc : l.plVide);
    $('invPlImpr').disabled = n === 0;
  }

  /**
   * Planche d'etiquettes, dans une fenetre a elle.
   *
   * Meme choix que pour la liste d'achats, et pour la meme raison : masquer
   * toute la page derriere un @media print demanderait des selecteurs de type
   * nus sur le document entier, ce que la convention du depot interdit, et se
   * battrait avec le chrome du shell. Une page neuve n'a aucun de ces
   * problemes — et elle est ecrite en MILLIMETRES, ce qui est le seul moyen
   * d'obtenir vraiment 45 mm sur le papier.
   *
   * Les QR sont des SVG : un vecteur ne pixelise a aucune resolution
   * d'imprimante. C'est ce qui repond a « QR nets, pas flous ».
   */
  function imprimePlanche(liste, titrePage) {
    const l = L();
    const f = window.open('', '_blank');
    if (!f) return;   // bloqueur de fenetres : la modale reste lisible a l'ecran
    const cellules = liste.map((e) =>
      '<div class="et">' +
        ZTSQR.svg(e.url, { taille: 118, niveau: 'M' }) +
        '<div class="t">' + escHtml(e.titre) + '</div>' +
        '<div class="s">' + escHtml(e.sous) + '</div>' +
      '</div>').join('');
    f.document.write('<!DOCTYPE html><html lang="' + (lang() === 'en' ? 'en' : 'fr-CA') +
      '"><head><meta charset="UTF-8"><title>' + escHtml(titrePage) + '</title><style>' +
      '@page{size:letter;margin:8mm}' +
      'body{font-family:system-ui,-apple-system,"Helvetica Neue",sans-serif;margin:0;color:#000}' +
      '.g{display:grid;grid-template-columns:repeat(auto-fill,45mm);gap:3mm;justify-content:center}' +
      '.et{width:45mm;height:52mm;box-sizing:border-box;border:0.3mm dashed #999;border-radius:2mm;' +
      'padding:2mm;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;' +
      'break-inside:avoid;page-break-inside:avoid;overflow:hidden}' +
      '.et svg{width:31mm;height:31mm;display:block}' +
      '.t{font-size:8.5pt;font-weight:700;line-height:1.15;text-align:center;margin-top:1.5mm;' +
      'max-height:9mm;overflow:hidden}' +
      '.s{font-size:6.5pt;line-height:1.15;text-align:center;color:#444;margin-top:0.8mm;' +
      'max-height:6mm;overflow:hidden}' +
      'h1{font-size:12pt;margin:0 0 4mm}' +
      '@media print{h1{display:none}.et{border-color:#ccc}}' +
      '</style></head><body><h1>' + escHtml(titrePage) + ' — ' + liste.length + '</h1>' +
      '<div class="g">' + cellules + '</div></body></html>');
    f.document.close();
    f.focus();
    // Laisser le temps a la fenetre de poser sa mise en page avant d'ouvrir
    // le dialogue d'impression : sans ce delai, Safari imprime une page vide.
    setTimeout(() => f.print(), 300);
  }

  // esc() sert dans des attributs ; ici on ecrit dans du contenu. Meme jeu de
  // remplacements, nom distinct pour que l'intention reste lisible.
  function escHtml(x) { return esc(x); }

  /* ── Arrivee par code QR ──────────────────────────────────────────────
     Les parametres sont copies dans sessionStorage DES LE CHARGEMENT, avant
     que le mur d'inscription n'ait rendu quoi que ce soit. zts-gate.js ne
     navigue pas — il pose un calque — donc l'URL survit d'elle-meme au
     tunnel ; mais une connexion par redirection, ici ou plus tard, effacerait
     la barre d'adresse. La copie coute trois lignes et rend le parcours
     insensible a ce detail d'implementation du mur. -------------------- */

  const CLE_CIBLE = 'zts_inv_cible';

  function capteCible() {
    try {
      const q = new URLSearchParams(location.search);
      const c = {
        inv: q.get('inv') || '',
        item: q.get('item') || '',
        loc: q.get('loc') || ''
      };
      if (c.inv || c.item || c.loc) {
        sessionStorage.setItem(CLE_CIBLE, JSON.stringify(c));
        return c;
      }
      const garde = sessionStorage.getItem(CLE_CIBLE);
      return garde ? JSON.parse(garde) : null;
    } catch (e) { return null; }
  }

  function oublieCible() {
    try { sessionStorage.removeItem(CLE_CIBLE); } catch (e) {}
  }

  function peintCible() {
    const l = L(), b = $('invCible');
    if (S.cible.item) {
      const o = item(S.cible.item);
      b.hidden = false;
      $('invCibleTxt').textContent = l.cibleItem(o ? (o.nom || l.objetSansNom) : '');
    } else if (S.cible.loc) {
      b.hidden = false;
      $('invCibleTxt').textContent = l.cibleLoc(S.cible.loc);
    } else {
      b.hidden = true;
    }
  }

  function leveCible() {
    S.cible = { item: null, loc: null };
    oublieCible();
    peintCible(); peintTableau();
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
    // Les categories gardent l'ordre de l'inventaire ; les objets « non
    // classes », s'il y en a, ferment la liste.
    const ordre = cats().map((c) => c.id).filter((c) => parCat[c]);
    if (parCat['']) ordre.push('');
    const corps = ordre.map((c) =>
      '<h3 class="inv-achats__cat">' + esc(libCatId(c)) + '</h3>' +
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
      '<p class="inv-achats__l"><span>' + esc(l.achatsNote) + ' ' +
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
    const iv = invCourant();
    // Une ligne d'en-tete avant le tableau : sans elle, un CSV ouvert six mois
    // plus tard ne dit plus de quel lieu ni de quelle date il parle.
    const chapeau = [[(iv ? iv.nom : ''), l.dateInv, (iv && iv.date) || aujourdhui()], []];
    const lignes = chapeau.concat([entete]).concat(filtres().map((o) =>
      cols.map((k) => {
        if (k.c === 'categorie') return libCatId(o.categorie);
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
      x.o.nom || l.objetSansNom, x.o.marque, libCatId(x.o.categorie),
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
      // Le nom relie les annees entre elles : le changer sur une seule
      // detacherait cette annee de son classeur. On renomme donc TOUTES les
      // annees du lieu d'un coup.
      const soeurs = anneesDe(iv.nom);
      for (const s of soeurs) {
        await InvData.majInventaire(s.id, { nom: nom.trim(), univers: univers });
        s.nom = nom.trim(); s.univers = univers;
      }
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

  /**
   * Applique le ciblage venu d'un code QR, une fois les objets charges.
   *
   * Les deux cas limites du cahier des charges sont ici :
   *  · `?item=` sur un objet supprime -> message clair, et l'inventaire
   *    complet s'affiche. On ne laisse jamais un tableau vide sans
   *    explication : de l'exterieur, ca ressemble a une panne.
   *  · arrivee sans etre connecte -> rien a faire ici, `capteCible()` a mis
   *    les parametres de cote avant le mur, et cette fonction ne tourne
   *    qu'apres.
   */
  function appliqueCible() {
    const c = S.cibleDemandee;
    if (!c) return;
    S.cibleDemandee = null;
    oublieCible();
    const l = L();
    if (c.item) {
      const existe = S.items.some((o) => o.id === c.item);
      if (!existe) { S.cible = { item: null, loc: null }; msg(l.cibleIntrouvable, true); return; }
      S.cible = { item: c.item, loc: null };
    } else if (c.loc) {
      S.cible = { item: null, loc: c.loc };
    }
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
      appliqueCible();
      peintTout();
      if (!$('invMsg').textContent) msg('');
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
    tbody.addEventListener('click', surFeuille);
    tbody.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b) return;
      const id = b.getAttribute('data-id');
      const act = b.getAttribute('data-act');
      if (act === 'voir') ouvrePhotos(id);
      if (act === 'suppr') supprimeItem(id);
      if (act === 'qr') {
        const o = item(id);
        ouvreQR(urlItem(id), (o && o.nom) || L().objetSansNom);
      }
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

    // Menu ⋯ : ouverture, fermeture au clic ailleurs ou a Echap, et
    // fermeture apres chaque action — sinon il reste ouvert par-dessus la
    // feuille pendant qu'une modale s'affiche derriere.
    const menu = $('invMenuListe');
    function ouvreMenu(ouvrir) {
      menu.hidden = !ouvrir;
      $('invMenu').setAttribute('aria-expanded', ouvrir ? 'true' : 'false');
    }
    $('invMenu').addEventListener('click', (e) => { e.stopPropagation(); ouvreMenu(menu.hidden); });
    menu.addEventListener('click', (e) => {
      // Un clic sur le <select> du menu ne doit pas le refermer sous le doigt.
      if (e.target.closest('select, label')) return;
      ouvreMenu(false);
    });
    document.addEventListener('click', (e) => {
      if (!menu.hidden && !e.target.closest('.inv-menu')) ouvreMenu(false);
    });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') ouvreMenu(false); });

    $('invSel').addEventListener('change', (e) => changeInventaire(e.target.value));
    $('invOnglets').addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.id === 'invOngPlus') { ouvreAnneeSuivante(); return; }
      const id = b.getAttribute('data-inv');
      if (id && id !== S.invId) changeInventaire(id);
    });
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
    $('invFLoc').addEventListener('change', (e) => { S.f.loc = e.target.value; peintTableau(); });
    $('invDateInv').addEventListener('change', async (e) => {
      if (bloqueSiHorsLigne()) return;
      const iv = invCourant();
      if (!iv) return;
      const d = InvData.dateIso(e.target.value);
      try {
        await InvData.majInventaire(iv.id, { date: d });
        iv.date = d;
        InvData.cache.ecrireListe(S.inventaires);
        peintInventaires();
        msg(L().mSauve);
      } catch (err) { msg(L().mErrSauve(err.message), true); }
    });
    $('invReset').addEventListener('click', () => {
      S.f = { q: '', cat: '*', univ: '*', etat: '*', loc: '*' };
      $('invSearch').value = '';
      peintTextes(); peintTableau();
    });

    // ── Categories (ajout C) ──
    $('invGererCats').addEventListener('click', ouvreCats);
    $('invCatsAjout').addEventListener('click', ajouteCat);
    $('invCatsListe').addEventListener('input', surCats);
    $('invCatsListe').addEventListener('click', surCats);
    $('invReOk').addEventListener('click', confirmeReassign);
    $('invReAnnuler').addEventListener('click', () => {
      S.reassign = null; ZTS.closeModal('invModalReassign');
    });

    // ── Codes QR (ajout D) ──
    $('invPlanche').addEventListener('click', () => {
      S.planche.portee = 'tous';
      peintPlanche(); ZTS.openModal('invModalPlanche');
    });
    $('invPlPortee').addEventListener('change', (e) => {
      S.planche.portee = e.target.value; S.planche.valeur = ''; peintPlanche();
    });
    $('invPlValeur').addEventListener('change', (e) => {
      S.planche.valeur = e.target.value; peintPlanche();
    });
    $('invPlImpr').addEventListener('click', () => {
      const iv = invCourant();
      imprimePlanche(etiquettes(), (iv ? iv.nom : '') + ' — ' + L().plTitre.replace(/^\S+\s/, ''));
    });
    $('invQRImpr').addEventListener('click', () => {
      const z = $('invQRImg');
      imprimePlanche([{ url: z.getAttribute('data-url'), titre: z.getAttribute('data-titre'),
                        sous: (invCourant() || {}).nom || '' }], z.getAttribute('data-titre'));
    });
    $('invCibleTout').addEventListener('click', leveCible);

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

    // La hauteur de la feuille depend de la fenetre et de la position de la
    // barre d'outils : les deux bougent au redimensionnement et a la rotation.
    window.addEventListener('resize', dimensionne);
    window.addEventListener('orientationchange', () => setTimeout(dimensionne, 250));

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
    // AVANT le mur : les parametres d'URL sont mis de cote tout de suite, pour
    // qu'une connexion par redirection ne les emporte pas.
    const cible = capteCible();
    S.cibleDemandee = cible;

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

    // Un code QR designe SON inventaire : il l'emporte sur le dernier
    // inventaire consulte, sinon scanner une etiquette du gymnase depuis la
    // page du camp de jour n'afficherait rien.
    let vise = null;
    if (cible && cible.inv) {
      if (S.inventaires.some((x) => x.id === cible.inv)) {
        vise = cible.inv;
      } else {
        S.cibleDemandee = null;
        oublieCible();
        msg(L().cibleInvIntrouvable, true);
      }
    }
    if (!vise) {
      try { vise = localStorage.getItem('zts_inv_courant'); } catch (e) {}
      if (!S.inventaires.some((x) => x.id === vise)) vise = S.inventaires[0].id;
    }
    await changeInventaire(vise);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarre);
  else demarre();
})();
