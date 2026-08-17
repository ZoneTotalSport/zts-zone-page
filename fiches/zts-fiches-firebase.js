/**
 * zts-fiches-firebase.js — acces Firestore (texte) et R2 (images).
 *
 * Reprend le SDK compat 10.14.0 et la config du projet `zone-total-sport`
 * deja utilises par firebase-auth.js : meme app, meme version, aucune
 * seconde initialisation. On ajoute seulement firestore-compat, que
 * firebase-auth.js ne charge pas.
 *
 * LES IMAGES NE SONT PAS DANS FIREBASE STORAGE (decision du 17 aout 2026).
 * Creer un bucket Firebase exige Blaze, ce qui bascule TOUT le projet en
 * facture a l'usage — Firestore compris, alors qu'il s'arrete aujourd'hui net
 * au quota Spark. Et le palier Always Free des buckets *.firebasestorage.app
 * ne couvre pas northamerica-northeast1, la region de la base. Les images
 * vivent donc dans R2 (bucket `zts-fiches`) derriere le Worker
 * `zts-fiches-img`, qui reproduit le modele pub/ prive/ de storage.rules —
 * ce fichier reste dans le depot comme documentation de ce modele.
 *
 * Les deux moities du mur doivent rester coherentes : Firestore scinde le
 * document (public / prive/contenu) pour le TEXTE, le Worker fait la meme
 * coupure pour les IMAGES.
 *
 * Expose window.ZTSFichesDB.
 */
(function (global) {
  'use strict';

  var SDK = 'https://www.gstatic.com/firebasejs/10.14.0/';
  // Plus de firebase-storage-compat : les images passent par R2 et le Worker
  // zts-fiches-img, pas par Firebase Storage. Le garder aurait telecharge du
  // SDK pour rien a chaque ouverture de fiche.
  var MODULES = ['firebase-app-compat.js', 'firebase-auth-compat.js',
                 'firebase-firestore-compat.js'];

  /* Worker des images, sur un domaine PERSONNALISE et pas sur workers.dev.
   *
   * Cloudflare decrit son sous-domaine workers.dev comme destine aux projets
   * personnels non critiques et le traite comme un « Free website ». Ce Worker
   * sert chaque illustration de chaque fiche, a des enseignants derriere des
   * filtres de reseau scolaire — et workers.dev est une zone distincte de
   * zonetotalsport.ca, donc hors des regles de cache du site.
   *
   * Firestore stocke un CHEMIN et jamais une URL complete : c'est ce qui rend
   * ce changement de domaine gratuit, ici et pour le prochain. */
  var IMG_BASE = 'https://img.zonetotalsport.ca';

  // Identique a firebase-auth.js — meme projet, meme app.
  var CONFIG = {
    apiKey: 'AIzaSyBoBxVP6g_ObKIJJ1jkviNFQ-wpJoWdjbA',
    authDomain: 'zone-total-sport.firebaseapp.com',
    databaseURL: 'https://zone-total-sport-default-rtdb.firebaseio.com',
    projectId: 'zone-total-sport',
    storageBucket: 'zone-total-sport.firebasestorage.app',
    messagingSenderId: '681359040455',
    appId: '1:681359040455:web:80c9f584583824cc8cc3e2',
    measurementId: 'G-09S9R1HJ94'
  };

  // Repli tant que le custom claim n'est pas pose (voir _scripts/zts-admin-claim.js).
  // Doit rester identique a la liste de firestore.rules et storage.rules.
  var COURRIELS_ADMIN = ['zts@hotmail.ca'];

  var _pret = null;
  var _user = null;
  var _admin = false;

  function charger(src) {
    return new Promise(function (res, rej) {
      var d = document.querySelector('script[src="' + src + '"]');
      if (d) { d.dataset.ztsPret ? res() : d.addEventListener('load', function () { res(); }); return; }
      var s = document.createElement('script');
      s.src = src;
      s.onload = function () { s.dataset.ztsPret = '1'; res(); };
      s.onerror = function () { rej(new Error('SDK Firebase injoignable : ' + src)); };
      document.head.appendChild(s);
    });
  }

  /** Charge le SDK, initialise l'app, attend le premier etat d'auth. */
  function pret() {
    if (_pret) return _pret;
    _pret = MODULES.reduce(function (p, m) {
      return p.then(function () { return charger(SDK + m); });
    }, Promise.resolve()).then(function () {
      if (!global.firebase.apps.length) global.firebase.initializeApp(CONFIG);
      return new Promise(function (res) {
        var off = global.firebase.auth().onAuthStateChanged(function (u) {
          off();
          _user = u;
          if (!u) { _admin = false; res(); return; }
          u.getIdTokenResult().then(function (t) {
            _admin = t.claims.admin === true ||
                     COURRIELS_ADMIN.indexOf(String(u.email || '').toLowerCase()) !== -1;
            res();
          }).catch(function () { _admin = false; res(); });
        });
      });
    });
    return _pret;
  }

  function db() { return global.firebase.firestore(); }

  function horodatage() { return global.firebase.firestore.FieldValue.serverTimestamp(); }

  /* ── Slug ───────────────────────────────────────────────────────────── */

  /**
   * Slug ASCII sans accents. Un slug vide (titre en emoji, par ex.) doit
   * rester invalide plutot que de produire une URL vide : on renvoie ''.
   */
  function slugifier(texte) {
    return String(texte || '')
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/['’]/g, '-')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
  }

  /** Verifie qu'aucune AUTRE fiche ne porte ce slug. */
  function slugLibre(slug, idCourant) {
    return db().collection('fiches').where('slug', '==', slug).limit(2).get()
      .then(function (snap) {
        return snap.docs.every(function (d) { return d.id === idCourant; });
      });
  }

  /** Ajoute -2, -3… jusqu'a trouver un slug libre. */
  function slugUnique(base, idCourant, n) {
    var essai = n ? base + '-' + n : base;
    return slugLibre(essai, idCourant).then(function (libre) {
      return libre ? essai : slugUnique(base, idCourant, (n || 1) + 1);
    });
  }

  /* ── Lecture ────────────────────────────────────────────────────────── */

  function normaliser(doc) {
    var d = doc.data() || {};
    d.id = doc.id;
    return d;
  }

  function parId(id) {
    return db().collection('fiches').doc(id).get().then(function (d) {
      return d.exists ? normaliser(d) : null;
    });
  }

  function parSlug(slug) {
    return db().collection('fiches').where('slug', '==', slug).limit(1).get()
      .then(function (s) { return s.empty ? null : normaliser(s.docs[0]); });
  }

  /** Fiches publiees, pour l'index public. */
  function listerPubliees(filtre) {
    var q = db().collection('fiches').where('statut', '==', 'publie');
    if (filtre && filtre.univers) q = q.where('univers', '==', filtre.univers);
    if (filtre && filtre.category) q = q.where('category', '==', filtre.category);
    return q.get().then(function (s) { return s.docs.map(normaliser); });
  }

  /** Toutes les fiches, brouillons compris — admin seulement. */
  function listerToutes() {
    return db().collection('fiches').orderBy('updatedAt', 'desc').limit(200).get()
      .then(function (s) { return s.docs.map(normaliser); });
  }

  /**
   * Sections de publication, avec repli sur un fichier servi avec le site.
   *
   * Firestore a la priorite : c'est la qu'on renomme, recolore ou reordonne
   * une section sans redeployer. Mais exiger une cle de compte de service
   * juste pour pouvoir choisir « Sports collectifs » dans un menu bloquait
   * toute la publication ; `fiches/sections.json` leve cette dependance.
   *
   * Les deux sources sortent du meme endroit — la taxonomie de
   * apps/jeux/data/jeux-merged.json — donc elles ne peuvent pas se
   * contredire au depart. Si elles divergent un jour, c'est que quelqu'un a
   * edite Firestore : c'est voulu, et Firestore gagne.
   */
  function sections() {
    return db().collection('sections').orderBy('ordre').get()
      .then(function (s) {
        if (s.empty) throw new Error('collection vide');
        return s.docs.map(normaliser);
      })
      .catch(function () {
        return fetch('/fiches/sections.json', { cache: 'no-cache' })
          .then(function (r) {
            if (!r.ok) throw new Error('sections.json introuvable');
            return r.json();
          })
          .then(function (d) { return d.sections || []; });
      });
  }

  /* ── Ecriture ───────────────────────────────────────────────────────── */

  /* Le document est SCINDE EN DEUX, et c'est ce qui fait tenir le mur
   * d'inscription. Une regle « lecture publique si statut == publie » sur un
   * document unique laisse n'importe qui lire le deroulement complet par un
   * simple appel a l'API REST : le masquage cote navigateur ne protege rien.
   *
   *   fiches/{id}              partie publique  — vignette et page 1
   *   fiches/{id}/prive/contenu partie membre   — but, sections, image p.2
   *
   * `statut` est recopie dans le document prive pour que sa regle de lecture
   * n'ait pas besoin d'un get() sur le parent (une lecture facturee de moins
   * a chaque affichage de fiche).
   */
  var CHAMPS_PUBLICS = ['slug', 'titre', 'sousTitre', 'badges',
                        'imagePrincipale', 'univers', 'category', 'statut'];
  /* `styles`, `formes` et `reperes` viennent de l'editeur visuel.
   *
   *  styles  { <chemin de champ>: {font,size,stroke,word,shadow,color,
   *            strokeColor,align,lh,ls,rot,z,hidden,dx,dy,w,hgt,altA,altB} }
   *          Indexe par data-champ, PAS par chemin DOM : l'editeur produit
   *          des cles positionnelles (p0-b2.1.0) que l'adaptateur traduit a
   *          la sauvegarde. Une cle positionnelle se reattache au mauvais
   *          element des qu'un div bouge dans le balisage.
   *
   *  formes  [ {id,page,type,x,y,w,h,thickness,fill,strokeColor,color,size,
   *            stroke,shadow,rot,text,hiddenLayer, points[],closed,smooth} ]
   *          `points` est serialise tel quel, en unites de page.
   *
   *  reperes { p0: {v:[x...], h:[y...]} } — mobilier d'atelier. Stocke pour
   *          que Joey retrouve ses guides, jamais lu par les pages publiques.
   */
  var CHAMPS_PRIVES = ['butDuJeu', 'sections', 'imagePage2',
                       'styles', 'formes', 'reperes'];

  /**
   * Sauve une fiche. Cree le document si `fiche.id` est absent, pour que le
   * televersement d'images ait un ficheId stable AVANT la premiere frappe.
   */
  function sauver(fiche) {
    var pub = {};
    CHAMPS_PUBLICS.forEach(function (k) { if (fiche[k] !== undefined) pub[k] = fiche[k]; });
    pub.updatedAt = horodatage();

    var prive = { statut: fiche.statut || 'brouillon', updatedAt: horodatage() };
    CHAMPS_PRIVES.forEach(function (k) { if (fiche[k] !== undefined) prive[k] = fiche[k]; });

    var ref = fiche.id ? db().collection('fiches').doc(fiche.id)
                       : db().collection('fiches').doc();
    if (!fiche.id) pub.createdAt = horodatage();

    var lot = db().batch();
    lot.set(ref, pub, { merge: true });
    lot.set(ref.collection('prive').doc('contenu'), prive, { merge: true });
    return lot.commit().then(function () {
      fiche.id = ref.id;
      return ref.id;
    });
  }

  /**
   * Charge la partie membre. Renvoie null si la lecture est refusee — c'est
   * le cas normal pour un visiteur non connecte, pas une erreur a signaler.
   */
  function chargerPrive(id) {
    return db().collection('fiches').doc(id).collection('prive').doc('contenu').get()
      .then(function (d) { return d.exists ? d.data() : null; })
      .catch(function () { return null; });
  }

  /** Fiche complete : partie publique + partie membre si elle est lisible. */
  function complete(fichePublique) {
    if (!fichePublique) return Promise.resolve(null);
    return chargerPrive(fichePublique.id).then(function (p) {
      if (p) {
        CHAMPS_PRIVES.forEach(function (k) {
          if (p[k] !== undefined) fichePublique[k] = p[k];
        });
        fichePublique._complete = true;
      }
      return fichePublique;
    });
  }

  /** Reserve un identifiant sans rien ecrire — sert au chemin Storage. */
  function nouvelId() { return db().collection('fiches').doc().id; }

  /** Supprime la fiche ET sa sous-collection privee (Firestore ne cascade pas). */
  function supprimer(id) {
    var ref = db().collection('fiches').doc(id);
    return ref.collection('prive').doc('contenu').delete()
      .catch(function () { /* absente : rien a faire */ })
      .then(function () { return ref.delete(); });
  }

  /* ── Storage ────────────────────────────────────────────────────────── */

  /* Le chemin garde exactement la forme qu'il avait sous Firebase Storage —
   * `fiches/{ficheId}/{zone}/{fichier}` — et c'est aussi la cle R2. Le Worker
   * reconstruit la cle a partir de la route, donc les deux ne peuvent pas
   * diverger. */
  var RE_CHEMIN = /^fiches\/([^/]+)\/(pub|prive)\/([^/]+)$/;

  function jeton() {
    var u = global.firebase && global.firebase.auth().currentUser;
    return u ? u.getIdToken() : Promise.resolve(null);
  }

  /* Cache des URL d'objet, POUR LE PRIVE SEULEMENT.
   *
   * Le public n'en a pas besoin : c'est une concatenation pure, et le
   * navigateur cache la reponse. Le prive, lui, coute un fetch authentifie et
   * un blob par image — sans cache, chaque redessin de l'editeur retelechargait
   * toutes les illustrations de la fiche. */
  var _cacheUrl = {};

  /**
   * URL affichable pour un chemin d'image.
   *
   * PUBLIC  -> concatenation, servie telle quelle dans un <img src>.
   * PRIVE   -> fetch authentifie puis blob: URL.
   *
   * Pourquoi cette asymetrie : un `<img src>` n'envoie AUCUN en-tete, donc
   * jamais l'Authorization. Une URL nue vers /prive/ recevrait 401 a chaque
   * illustration de membre. Firebase Storage reglait ca en glissant un jeton
   * dans la query string de getDownloadURL() ; ici on recupere les octets avec
   * le jeton et on les donne au navigateur sous forme de blob.
   *
   * Un chemin illisible renvoie '' plutot que de lever : la case affiche alors
   * son placeholder, ce qui est le bon comportement pour un visiteur non
   * connecte devant une image de membre.
   */
  function urlDe(path) {
    if (!path) return Promise.resolve('');
    var m = RE_CHEMIN.exec(path);
    if (!m) return Promise.resolve('');

    var url = IMG_BASE + '/img/' + encodeURIComponent(m[1]) + '/' + m[2] +
              '/' + encodeURIComponent(m[3]);

    if (m[2] === 'pub') return Promise.resolve(url);

    if (_cacheUrl[path]) return _cacheUrl[path];
    _cacheUrl[path] = jeton().then(function (t) {
      if (!t) return '';
      return fetch(url, { headers: { Authorization: 'Bearer ' + t } })
        .then(function (r) {
          if (!r.ok) throw new Error('image ' + r.status);
          return r.blob();
        })
        .then(function (b) { return URL.createObjectURL(b); });
    }).catch(function () {
      delete _cacheUrl[path];
      return '';
    });
    return _cacheUrl[path];
  }

  /** Libere les blob: URL d'une fiche. A appeler avant d'en charger une autre. */
  function oublierImages() {
    Object.keys(_cacheUrl).forEach(function (k) {
      var p = _cacheUrl[k];
      if (p && p.then) p.then(function (u) {
        if (u && u.indexOf('blob:') === 0) URL.revokeObjectURL(u);
      }).catch(function () {});
      delete _cacheUrl[k];
    });
  }

  // Seule l'illustration de la page 1 est publique : c'est elle qui sert de
  // vignette dans l'index et d'image og:. Tout le reste est derriere le mur.
  var CHAMPS_IMAGE_PUBLICS = ['imagePrincipale'];

  /**
   * Televerse une image. `slotId` derive du chemin de champ pour rester
   * stable : re-deposer une image ecrase l'ancienne au lieu d'empiler des
   * orphelins dans le bucket.
   *
   * Le prefixe pub/ ou prive/ decide de la regle de lecture du Worker. Sans
   * ca, le mur ne tiendrait pas : l'identifiant de la fiche est public et les
   * noms de fichiers sont derives du champ, donc devinables.
   */
  function televerser(blob, ficheId, champ, onProgres) {
    var slotId = String(champ || 'image').replace(/[^a-zA-Z0-9]+/g, '-');
    var zone = CHAMPS_IMAGE_PUBLICS.indexOf(champ) !== -1 ? 'pub' : 'prive';

    // Le type vient du blob, pas d'une constante : zts-image-slot.js sort du
    // PNG quand l'image est detouree (rendu DAZ pose sur le decor) et du JPEG
    // sinon. Coder .jpg en dur aplatissait le personnage sur un fond blanc.
    var png = blob.type === 'image/png';
    var type = png ? 'image/png' : 'image/jpeg';
    var base = 'fiches/' + ficheId + '/' + zone + '/' + slotId;
    var path = base + (png ? '.png' : '.jpg');
    var autre = base + (png ? '.jpg' : '.png');

    var urlDeChemin = function (p) {
      var m = RE_CHEMIN.exec(p);
      return IMG_BASE + '/img/' + encodeURIComponent(m[1]) + '/' + m[2] +
             '/' + encodeURIComponent(m[3]);
    };

    return jeton().then(function (t) {
      if (!t) throw new Error('Connexion requise pour téléverser.');

      // `fetch` ne rapporte pas la progression d'un envoi — seul XHR le fait,
      // et seulement via upload.onprogress. On garde donc XHR ici : la barre
      // de progression de <image-slot> existe et un rendu DAZ pese assez pour
      // qu'elle serve.
      return new Promise(function (res, rej) {
        var xhr = new XMLHttpRequest();
        xhr.open('PUT', urlDeChemin(path), true);
        xhr.setRequestHeader('Content-Type', type);
        xhr.setRequestHeader('Authorization', 'Bearer ' + t);
        if (onProgres) {
          xhr.upload.onprogress = function (e) {
            if (e.lengthComputable && e.total) onProgres((e.loaded / e.total) * 100);
          };
        }
        xhr.onload = function () {
          if (xhr.status < 200 || xhr.status >= 300) {
            rej(new Error('Téléversement refusé (' + xhr.status + ')'));
            return;
          }
          delete _cacheUrl[path];
          delete _cacheUrl[autre];
          // Remplacer une photo par un detourage change l'extension : sans ce
          // menage, l'ancien fichier resterait orphelin dans le bucket. Son
          // absence est le cas normal — on ignore l'echec.
          fetch(urlDeChemin(autre), {
            method: 'DELETE',
            headers: { Authorization: 'Bearer ' + t }
          }).catch(function () {});
          res(path);
        };
        xhr.onerror = function () { rej(new Error('Téléversement injoignable.')); };
        xhr.send(blob);
      });
    });
  }

  /* ── Auth ───────────────────────────────────────────────────────────── */

  function utilisateur() { return _user; }
  function estAdmin() { return _admin; }
  function estConnecte() { return !!_user; }

  function connexion(courriel, motDePasse) {
    return global.firebase.auth().signInWithEmailAndPassword(courriel, motDePasse)
      .then(function (c) {
        _user = c.user;
        return c.user.getIdTokenResult(true);
      })
      .then(function (t) {
        _admin = t.claims.admin === true ||
                 COURRIELS_ADMIN.indexOf(String(_user.email || '').toLowerCase()) !== -1;
        return _admin;
      });
  }

  function deconnexion() {
    return global.firebase.auth().signOut().then(function () { _user = null; _admin = false; });
  }

  global.ZTSFichesDB = {
    pret: pret,
    parId: parId, parSlug: parSlug,
    listerPubliees: listerPubliees, listerToutes: listerToutes,
    sections: sections,
    sauver: sauver, supprimer: supprimer, nouvelId: nouvelId,
    chargerPrive: chargerPrive, complete: complete,
    slugifier: slugifier, slugUnique: slugUnique,
    urlDe: urlDe, televerser: televerser, oublierImages: oublierImages,
    utilisateur: utilisateur, estAdmin: estAdmin, estConnecte: estConnecte,
    connexion: connexion, deconnexion: deconnexion,
    COURRIELS_ADMIN: COURRIELS_ADMIN
  };
})(window);
