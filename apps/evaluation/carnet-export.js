/* ============================================================
   CARNET EPS — EXPORT / IMPORT COMPLET  (carnet-export.js)

   POURQUOI CE FICHIER EXISTE
   ──────────────────────────────────────────────────────────
   L'export livre avec l'app (bouton « Telecharger .json ») ne sauvegarde
   PAS les photos d'eleves : elles vivent dans IndexedDB, et sa fonction de
   backup ne lit que localStorage. Un enseignant qui exporte, reinstalle et
   restaure perd tout son trombinoscope sans le moindre avertissement.
   Il oublie aussi cinq cles que la version React ecrit activement
   (profile, schedule, games, etape-dates, landed).

   Ce fichier ne corrige pas l'export existant — la source Vite du Carnet est
   perdue, le bundle est minifie, on n'y touche pas. Il ajoute un second
   chemin, complet, a cote. L'ancien bouton continue de fonctionner.

   CE FICHIER EST AUSSI LE PONT DE MIGRATION
   ──────────────────────────────────────────────────────────
   Le JSON produit ici est le FORMAT D'ENTREE de l'importeur du futur onglet
   EVALUATION du Planificateur (fusion #3). C'est un contrat, pas une sortie
   de debogage : en-tete explicite, version, et schema documente dans
   AUDIT-CARNET-EPS-2026-08.md. Ne pas changer la forme sans monter `version`.

   PRINCIPE DIRECTEUR : ON NE PERD RIEN
   ──────────────────────────────────────────────────────────
   L'export ne travaille PAS sur une liste de cles ecrite en dur. Il balaye
   tout localStorage et prend TOUTE cle prefixee `carneteps-`. La table
   REGISTRE ci-dessous sert uniquement a CLASSER ce qu'on a trouve — jamais a
   filtrer. Consequence : une cle inconnue, oubliee, ou ajoutee demain part
   quand meme dans le fichier, rangee sous `unknown`. Un exporteur qui filtre
   sur une liste est un exporteur qui perdra des donnees le jour ou la liste
   prendra du retard. Celui-ci ne peut pas.
   ============================================================ */
(function () {
  'use strict';

  var PREFIXE   = 'carneteps-';
  var IDB_NOM   = 'carneteps-photos-db';
  var IDB_STORE = 'photos';
  var VERSION   = 2;

  /* ==================== REGISTRE DES CLES ====================
     statut :
       'active' — lue/ecrite par la version React en production
       'legacy' — declaree dans sa table de backup mais JAMAIS lue par elle.
                  Ce sont des cles de la V1 vanilla (apps/evaluation/app.js),
                  qui les ecrit toutes activement. Un enseignant venu de la V1
                  a donc de vraies donnees dedans. On les EXPORTE — les jeter
                  serait exactement la perte de donnees qu'on repare ici — mais
                  rangees a part, pour que l'importeur du Planificateur sache
                  qu'elles ne refletent pas l'app actuelle.
     ========================================================== */
  var REGISTRE = {
    // ---- Actives : le coeur des donnees ----
    'carneteps-groups':        { statut: 'active', forme: 'Array<{id,name,level,color,students:[{id,name}]}>' },
    'carneteps-data':          { statut: 'active', forme: '{groupId:{date:{studentId:{critereKey:valeur}}}}' },
    'carneteps-attendance':    { statut: 'active', forme: "{groupId:{date:{studentId:'present'|'absent'|'retard'}}}" },
    'carneteps-custom':        { statut: 'active', forme: 'Array — criteres crees par l\'enseignant' },
    'carneteps-evallabels':    { statut: 'active', forme: 'Object — libelles d\'echelle personnalises' },
    // ---- Actives : preferences et contexte ----
    'carneteps-lang':          { statut: 'active', forme: "String — 'fr'|'en'|'es'|'ru'|'zh'" },
    'carneteps-zoom':          { statut: 'active', forme: 'String — facteur de zoom' },
    'carneteps-profile':       { statut: 'active', forme: '{nom, ecole} — ABSENTE de l\'export livre' },
    'carneteps-schedule':      { statut: 'active', forme: 'Object — grille horaire — ABSENTE de l\'export livre' },
    'carneteps-games':         { statut: 'active', forme: 'Array — banque de jeux perso — ABSENTE de l\'export livre' },
    'carneteps-etape-dates':   { statut: 'active', forme: 'Object — dates des etapes — ABSENTE de l\'export livre' },
    'carneteps-landed':        { statut: 'active', forme: "'1' — landing deja vue — ABSENTE de l'export livre" },
    // ---- Inertes en React, vivantes en V1 vanilla ----
    'carneteps-photos':        { statut: 'legacy', forme: 'Object — photos avant migration vers IndexedDB, ou repli si IndexedDB indisponible' },
    'carneteps-voice':         { statut: 'legacy', forme: 'Object — reglages de synthese vocale' },
    'carneteps-toggles':       { statut: 'legacy', forme: 'Object — interrupteurs d\'affichage' },
    'carneteps-pfeq':          { statut: 'legacy', forme: 'Object — selection PFEQ' },
    'carneteps-evalcolors':    { statut: 'legacy', forme: 'Object — couleurs d\'evaluation' },
    'carneteps-colormeanings': { statut: 'legacy', forme: 'Object — significations des couleurs (orthographe LUE par le code V1)' },
    'carneteps-color-meanings':{ statut: 'legacy', forme: 'Object — MEME donnee, orthographe utilisee par l\'export/effacement de la V1. Bug latent : la V1 lit `colormeanings` et exporte `color-meanings`, donc elle n\'a jamais sauvegarde ses propres significations. Les deux sont prises ici.' },
    'carneteps-stt':           { statut: 'legacy', forme: 'Object — reconnaissance vocale' },
    'carneteps-title':         { statut: 'legacy', forme: 'String — titre personnalise' },
    'carneteps-lastgroup':     { statut: 'legacy', forme: 'String — dernier groupe ouvert' },
    'carneteps-mode':          { statut: 'legacy', forme: 'String — mode d\'affichage V1' }
  };

  // `carneteps-conflicts-<groupId>` : prefixe dynamique, un doc par groupe
  // (banc de retrait / regulation). Ecrit par la V1 ; la version React ne le
  // lit plus. Traite comme 'legacy' sans etre nomme dans le REGISTRE.
  function classer(cle) {
    if (REGISTRE[cle]) return REGISTRE[cle].statut;
    if (cle.indexOf('carneteps-conflicts-') === 0) return 'legacy';
    return 'unknown';
  }

  /* ======================= IndexedDB ======================= */

  function ouvrirIDB() {
    return new Promise(function (ok, ko) {
      if (!window.indexedDB) return ok(null);          // navigateur sans IDB : pas une erreur
      var req = indexedDB.open(IDB_NOM, 1);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) db.createObjectStore(IDB_STORE);
      };
      req.onsuccess = function () { ok(req.result); };
      req.onerror   = function () { ko(req.error); };
    });
  }

  // Lit TOUT le magasin de photos : cles ET valeurs. openCursor plutot que
  // get(cle) par cle — on ne connait pas d'avance la liste des studentId, et
  // une photo orpheline (eleve supprime) doit partir dans l'export elle aussi.
  function lirePhotos() {
    return ouvrirIDB().then(function (db) {
      if (!db) return {};
      if (!db.objectStoreNames.contains(IDB_STORE)) { db.close(); return {}; }
      return new Promise(function (ok, ko) {
        var out = {};
        var cur = db.transaction(IDB_STORE, 'readonly').objectStore(IDB_STORE).openCursor();
        cur.onsuccess = function (e) {
          var c = e.target.result;
          if (!c) { db.close(); return ok(out); }
          out[c.key] = c.value;
          c.continue();
        };
        cur.onerror = function () { db.close(); ko(cur.error); };
      });
    });
  }

  function ecrirePhotos(photos) {
    var cles = Object.keys(photos || {});
    if (!cles.length) return Promise.resolve(0);
    return ouvrirIDB().then(function (db) {
      if (!db) throw new Error('IndexedDB indisponible : les photos ne peuvent pas etre restaurees.');
      return new Promise(function (ok, ko) {
        var tx = db.transaction(IDB_STORE, 'readwrite');
        var st = tx.objectStore(IDB_STORE);
        cles.forEach(function (k) { st.put(photos[k], k); });
        tx.oncomplete = function () { db.close(); ok(cles.length); };
        tx.onerror    = function () { db.close(); ko(tx.error); };
      });
    });
  }

  /* ========================= EXPORT ========================= */

  function construire() {
    // Balayage : tout ce qui porte le prefixe, sans exception.
    var actif = {}, legacy = {}, inconnu = {};
    var nb = { active: 0, legacy: 0, unknown: 0 };
    for (var i = 0; i < localStorage.length; i++) {
      var cle = localStorage.key(i);
      if (!cle || cle.indexOf(PREFIXE) !== 0) continue;
      var val = localStorage.getItem(cle);
      var st  = classer(cle);
      (st === 'active' ? actif : st === 'legacy' ? legacy : inconnu)[cle] = val;
      nb[st]++;
    }

    return lirePhotos().then(function (photos) {
      var nbPhotos = Object.keys(photos).length;
      return {
        // ---- En-tete : le contrat. Un lecteur doit pouvoir identifier ce
        //      fichier sans deviner, meme des mois plus tard. ----
        format:      'zts-carnet-eps-export',
        version:     VERSION,
        source:      'carnet-eps',
        appVersion:  bundleId(),        // quelle generation de bundle a produit ce fichier
        exportedAt:  new Date().toISOString(),
        origin:      location.origin + location.pathname,
        counts: {
          active:  nb.active,
          legacy:  nb.legacy,
          unknown: nb.unknown,
          photos:  nbPhotos
        },
        // ---- Donnees. Valeurs BRUTES (chaines telles quelles), jamais
        //      re-parsees : re-serialiser, c'est risquer de changer la donnee. ----
        localStorage: { active: actif, legacy: legacy, unknown: inconnu },
        // ---- IndexedDB : {studentId: dataURL}. C'est le trou de l'export livre. ----
        photos: photos
      };
    });
  }

  /* Quatre generations de bundle ont ete publiees sans qu'aucune source ne
     soit versionnee. Savoir laquelle a produit un fichier evitera de la
     retro-ingenierie le jour ou un import se comportera bizarrement. */
  function bundleId() {
    var s = document.querySelector('script[src*="assets/index-"]');
    if (!s) return null;
    var m = /index-([A-Za-z0-9_-]+)\.js/.exec(s.getAttribute('src') || '');
    return m ? m[1] : null;
  }

  function exporter() {
    return construire().then(function (paquet) {
      var txt = JSON.stringify(paquet, null, 2);
      var url = URL.createObjectURL(new Blob([txt], { type: 'application/json' }));
      var a   = document.createElement('a');
      a.href = url;
      a.download = 'carnet-eps-complet-' + paquet.exportedAt.slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
      return paquet;
    });
  }

  /* ========================= IMPORT ========================= */

  /* Restaure les DEUX magasins. Ecrit par-dessus l'existant sans effacer ce
     qui n'est pas dans le fichier : un import est une restauration, pas une
     remise a zero. Pour repartir propre, effacer d'abord — c'est le geste de
     la recette, et il doit rester explicite. */
  function importer(texte) {
    var p;
    try { p = JSON.parse(texte); }
    catch (e) { throw new Error('Fichier illisible : ce n\'est pas du JSON valide.'); }

    if (!p || typeof p !== 'object') throw new Error('Fichier vide ou invalide.');

    // Accepte aussi l'ancien format (objet plat de cles carneteps-*), pour ne
    // pas rejeter les sauvegardes deja faites par le bouton livre avec l'app.
    if (!p.format) {
      var plates = Object.keys(p).filter(function (k) { return k.indexOf(PREFIXE) === 0; });
      if (!plates.length) throw new Error('Format non reconnu : ni export complet, ni sauvegarde du Carnet.');
      plates.forEach(function (k) { if (p[k] !== null) localStorage.setItem(k, p[k]); });
      return Promise.resolve({ cles: plates.length, photos: 0, ancienFormat: true });
    }

    if (p.format !== 'zts-carnet-eps-export') throw new Error('Ce fichier ne vient pas du Carnet EPS.');
    if (p.version > VERSION) throw new Error('Fichier en version ' + p.version + ', cette page ne lit que la ' + VERSION + '.');

    var ls = p.localStorage || {};
    var n = 0;
    ['active', 'legacy', 'unknown'].forEach(function (bloc) {
      var o = ls[bloc] || {};
      Object.keys(o).forEach(function (k) {
        if (o[k] !== null && o[k] !== undefined) { localStorage.setItem(k, o[k]); n++; }
      });
    });

    return ecrirePhotos(p.photos).then(function (nbP) {
      return { cles: n, photos: nbP, ancienFormat: false };
    });
  }

  /* ====================== Interface ======================
     Le bundle React possede #root : on n'y touche pas. Un bouton flottant,
     discret, qui ouvre un petit panneau. */

  function el(tag, css, txt) {
    var n = document.createElement(tag);
    if (css) n.style.cssText = css;
    if (txt != null) n.textContent = txt;
    return n;
  }

  var BTN = 'position:fixed;right:14px;bottom:14px;z-index:2147483000;' +
    'background:#4F46E5;color:#fff;border:none;border-radius:999px;' +
    'padding:11px 17px;font:600 14px/1 system-ui,sans-serif;cursor:pointer;' +
    'box-shadow:0 4px 14px rgba(0,0,0,.28)';

  var PANNEAU = 'position:fixed;right:14px;bottom:64px;z-index:2147483000;' +
    'background:#fff;color:#0f172a;border-radius:14px;padding:16px;width:290px;' +
    'font:14px/1.45 system-ui,sans-serif;box-shadow:0 10px 34px rgba(0,0,0,.3)';

  var ACTION = 'display:block;width:100%;margin-top:8px;padding:10px;' +
    'border:none;border-radius:9px;font:600 14px/1 system-ui,sans-serif;cursor:pointer';

  /* Y a-t-il seulement quelque chose a sauvegarder ?
     ──────────────────────────────────────────────────────────────────
     La page est muree : un visiteur non connecte voit d'abord un bloc
     d'inscription. Lui presenter un bouton « Sauvegarde complete » n'a aucun
     sens — il n'a rien saisi. Mais un enseignant qui a des donnees et dont la
     session a expire, lui, en a precisement besoin : c'est le pire moment
     pour lui cacher la porte de sortie.

     On ne sonde donc PAS l'etat du mur (fragile, et il repondrait a la
     mauvaise question). On regarde s'il existe la moindre cle `carneteps-`.
     Rien a sauvegarder → rien a afficher. */
  function aDesDonnees() {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.indexOf(PREFIXE) === 0) return true;
    }
    return false;
  }

  function monterUI() {
    if (!aDesDonnees()) return;
    var btn = el('button', BTN, '💾 Sauvegarde complète');
    btn.type = 'button';

    var pan = el('div', PANNEAU);
    pan.hidden = true;

    var titre = el('div', 'font-weight:700;margin-bottom:4px', 'Sauvegarde complète');
    var sous  = el('div', 'font-size:12.5px;color:#475569;margin-bottom:10px',
      'Inclut les photos d’élèves, que la sauvegarde ordinaire laisse derrière elle.');

    var bExp = el('button', ACTION + ';background:#4F46E5;color:#fff', 'Exporter tout (.json)');
    var bImp = el('button', ACTION + ';background:#E2E8F0;color:#0f172a', 'Restaurer un fichier');
    bExp.type = bImp.type = 'button';

    var etat = el('div', 'font-size:12.5px;margin-top:10px;min-height:18px;color:#475569');

    var fichier = el('input', 'display:none');
    fichier.type = 'file';
    fichier.accept = 'application/json,.json';

    pan.appendChild(titre); pan.appendChild(sous);
    pan.appendChild(bExp);  pan.appendChild(bImp);
    pan.appendChild(etat);  pan.appendChild(fichier);

    btn.addEventListener('click', function () { pan.hidden = !pan.hidden; });

    bExp.addEventListener('click', function () {
      etat.textContent = 'Préparation…';
      etat.style.color = '#475569';
      exporter().then(function (p) {
        etat.style.color = '#166534';
        etat.textContent = 'Exporté : ' + p.counts.active + ' clés actives, ' +
          p.counts.legacy + ' héritées, ' + p.counts.photos + ' photo(s).';
      }).catch(function (e) {
        etat.style.color = '#b91c1c';
        etat.textContent = 'Échec : ' + e.message;
      });
    });

    bImp.addEventListener('click', function () { fichier.click(); });

    fichier.addEventListener('change', function () {
      var f = fichier.files && fichier.files[0];
      if (!f) return;
      var fr = new FileReader();
      fr.onload = function () {
        etat.textContent = 'Restauration…';
        etat.style.color = '#475569';
        Promise.resolve()
          .then(function () { return importer(String(fr.result)); })
          .then(function (r) {
            etat.style.color = '#166534';
            etat.textContent = 'Restauré : ' + r.cles + ' clés, ' + r.photos +
              ' photo(s). Rechargement…';
            setTimeout(function () { location.reload(); }, 1200);
          })
          .catch(function (e) {
            etat.style.color = '#b91c1c';
            etat.textContent = 'Échec : ' + e.message;
          });
      };
      fr.readAsText(f);
      fichier.value = '';
    });

    document.body.appendChild(btn);
    document.body.appendChild(pan);
  }

  // API exposee : la recette et le futur importeur s'en servent sans l'UI.
  window.CarnetExport = {
    version: VERSION,
    construire: construire,
    exporter: exporter,
    importer: importer,
    lirePhotos: lirePhotos,
    registre: REGISTRE
  };

  if (document.readyState === 'loading')
    document.addEventListener('DOMContentLoaded', monterUI);
  else
    monterUI();
})();
