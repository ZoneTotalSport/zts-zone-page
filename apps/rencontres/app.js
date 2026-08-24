/**
 * app.js — Zone Rencontres, interface.
 *
 * REGLE DE CE FICHIER : il ne parle JAMAIS a Firestore ni au Worker
 * directement. Tout passe par RencData.* (dataStore.js), sur le meme patron
 * que apps/inventaire et apps/planificateur.
 *
 * VAGUES LIVREES ICI
 *   A  onglets, tiroir du rail, menu ⋯, etat du reseau, detection vocale.
 *   B  dossiers, liste, editeur de notes, autosauvegarde locale 10 s,
 *      ecriture Firestore au blur et au bouton, restauration apres plantage.
 *   C  micro : consentement, MediaRecorder toujours actif, texte en direct
 *      quand le navigateur le porte, minuteur, redemarrage sur onend.
 *   D  transcription : depot d'un fichier, decodage 16 kHz mono, decoupage au
 *      silence, envoi segment par segment, devis et quota en minutes.
 *   E  traitement IA : mot a mot par blocs, compte rendu structure, resume
 *      d'un passage selectionne.
 *
 * Les commandes des vagues F a H sont a l'ecran mais desactivees, et chacune
 * NOMME sa vague dans son title — voir pasEncore().
 *
 * Script classique, pas un module : charge apres shared/zts.js, zts-gate.js,
 * le montage du shell, dataStore.js et transcription.js.
 */
(function () {
  'use strict';

  /* Toutes les 10 secondes, comme demande au cahier. Ce n'est PAS une
     ecriture Firestore : c'est le brouillon local. Ecrire au serveur toutes
     les 10 s pendant un comite d'une heure ferait 360 ecritures facturees
     pour une seule rencontre. */
  var AUTO_MS = 10000;

  /* ── Reconnaissance vocale : presente ou absente ──────────────────────
     `webkitSpeechRecognition` n'existe NI sur Firefox NI sur Safari. Sur un
     Mac ou un iPhone — une bonne part du parc scolaire quebecois — la
     transcription se fera donc a la fin de l'enregistrement, par le worker.

     CE N'EST PAS UN REPLI, ET L'INTERFACE NE LE DIRA JAMAIS. Ce sont deux
     facons de transcrire : l'une ecrit pendant la rencontre, l'autre a la
     fin. L'usager de Safari n'a pas une version abimee de l'app, il a une
     version qui transcrit apres coup. Le mot « repli » vit dans ce
     commentaire et nulle part ailleurs. */
  var DIRECT = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  var dossiers   = [];
  var rencontres = [];
  var courante   = null;    // la rencontre ouverte ; `id` null tant qu'elle est neuve
  var sale       = false;   // du travail que le serveur n'a pas encore vu
  var dossierActif = null;  // null = tous les dossiers
  var pretServeur  = false;

  function id(x) { return document.getElementById(x); }
  function lang() { try { return (window.ZTS && ZTS.langue) ? ZTS.langue() : 'fr'; } catch (e) { return 'fr'; } }
  function nomDossier(d) { return (lang() === 'en' ? d.en : d.fr) || d.fr || d.id; }

  /* ==================================================================== */
  /* Onglets                                                              */
  /* ==================================================================== */

  function cableOnglets(paires) {
    var boutons = paires.map(function (p) { return id(p[0]); }).filter(Boolean);

    function montre(cle) {
      paires.forEach(function (p) {
        var bt = id(p[0]), pan = id(p[1]);
        if (!bt || !pan) return;
        var actif = (p[0] === cle);
        bt.classList.toggle('is-actif', actif);
        bt.setAttribute('aria-selected', actif ? 'true' : 'false');
        pan.hidden = !actif;
      });
    }

    paires.forEach(function (p) {
      var bt = id(p[0]);
      if (!bt) return;
      bt.addEventListener('click', function () { montre(p[0]); });
      // Fleches gauche/droite entre onglets : comportement attendu d'un
      // tablist, et le seul moyen de circuler au clavier sans Tab.
      bt.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
        e.preventDefault();
        var i = boutons.indexOf(bt), n = boutons.length;
        var suivant = boutons[((i + (e.key === 'ArrowRight' ? 1 : -1)) % n + n) % n];
        suivant.focus();
        suivant.click();
      });
    });
  }

  /* ==================================================================== */
  /* Tiroir du rail (sous 900 px)                                         */
  /* ==================================================================== */

  function cableTiroir() {
    var bt = id('rencBascule'), rail = id('rencRail');
    if (!bt || !rail) return;

    function pose(ouvert) {
      rail.classList.toggle('is-ouvert', ouvert);
      bt.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    }
    window.__rencFermeTiroir = function () { pose(false); };

    bt.addEventListener('click', function (e) {
      e.stopPropagation();
      pose(!rail.classList.contains('is-ouvert'));
    });
    rail.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { pose(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rail.classList.contains('is-ouvert')) { pose(false); bt.focus(); }
    });
    // Au retour en deux colonnes, la classe n'a plus de sens et laisserait un
    // `transform` orphelin.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) pose(false);
    }, { passive: true });
  }

  /* ==================================================================== */
  /* Menu ⋯                                                               */
  /* ==================================================================== */

  function cableMenu() {
    var bt = id('rencMenu'), liste = id('rencMenuListe');
    if (!bt || !liste) return;

    function pose(ouvert) {
      liste.hidden = !ouvert;
      bt.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
    }
    bt.addEventListener('click', function (e) { e.stopPropagation(); pose(liste.hidden); });
    liste.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { pose(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !liste.hidden) { pose(false); bt.focus(); }
    });

    // Partage natif : le bouton n'apparait que la ou il fonctionne. Un
    // bouton « Partager » inerte sur ordinateur serait pire que pas de bouton.
    var partage = id('rencPartage');
    if (partage && typeof navigator.share === 'function') partage.hidden = false;
  }

  /* ==================================================================== */
  /* Etat du reseau                                                       */
  /* ==================================================================== */

  function cableReseau() {
    var bandeau = id('rencReseau');
    if (!bandeau) return;
    function relis() {
      bandeau.hidden = navigator.onLine !== false;
      // Le retour du reseau est le bon moment pour pousser ce qui attend.
      if (navigator.onLine !== false && sale && courante) sauveServeur(true);
    }
    window.addEventListener('online', relis);
    window.addEventListener('offline', relis);
    relis();
  }

  /* ==================================================================== */
  /* Assainissement du contenu editable                                   */
  /* ==================================================================== */

  /* La liste est VOLONTAIREMENT COURTE. Un compte rendu de comite se lit, il
     ne se met pas en page — et tout ce qui entre ici devra ressortir en texte
     brut pour le courriel (vague G) et a l'impression. Ce qui n'est pas dans
     cette liste est remplace par son texte, jamais supprime : personne ne
     perd un paragraphe parce qu'il l'a colle depuis Word. */
  var BALISES_OK = ['H1', 'H2', 'H3', 'P', 'DIV', 'BR', 'UL', 'OL', 'LI',
                    'B', 'STRONG', 'I', 'EM', 'U'];

  /**
   * Nettoie du HTML colle ou saisi. Aucun attribut n'est conserve, a une
   * exception pres : `type="checkbox"` et `checked` sur les <input>, qui
   * portent les cases a cocher des actions a faire.
   *
   * Un `style=` conserve laisserait entrer des polices et des couleurs de
   * Word ; un `href` laisserait entrer un `javascript:`. On n'en garde aucun.
   */
  function assainit(html) {
    var bac = document.implementation.createHTMLDocument('').body;
    bac.innerHTML = String(html || '');

    (function marche(noeud) {
      var enfants = Array.prototype.slice.call(noeud.childNodes);
      enfants.forEach(function (n) {
        if (n.nodeType === 3) return;                      // texte : intact
        if (n.nodeType !== 1) { n.remove(); return; }      // commentaire, etc.
        marche(n);

        if (n.tagName === 'INPUT') {
          if (n.getAttribute('type') !== 'checkbox') { n.remove(); return; }
          var coche = n.hasAttribute('checked') || n.checked;
          var neuf = document.createElement('input');
          neuf.setAttribute('type', 'checkbox');
          if (coche) neuf.setAttribute('checked', '');
          n.replaceWith(neuf);
          return;
        }

        if (BALISES_OK.indexOf(n.tagName) === -1) {
          // On remplace la balise par son CONTENU : le texte survit.
          n.replaceWith.apply(n, Array.prototype.slice.call(n.childNodes));
          return;
        }
        // Balise autorisee : on la vide de tous ses attributs.
        Array.prototype.slice.call(n.attributes)
          .forEach(function (a) { n.removeAttribute(a.name); });
      });
    })(bac);

    return bac.innerHTML;
  }

  function cableCollage(zone) {
    if (!zone) return;
    zone.addEventListener('paste', function (e) {
      var dt = e.clipboardData;
      if (!dt) return;
      e.preventDefault();
      var html = dt.getData('text/html');
      var propre = html ? assainit(html)
                        : String(dt.getData('text/plain') || '')
                            .replace(/[&<>]/g, function (c) {
                              return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c];
                            })
                            .replace(/\n/g, '<br>');
      document.execCommand('insertHTML', false, propre);
    });
  }

  /* ── Barre de mise en forme ───────────────────────────────────────────
     `execCommand` est deprecie et n'a pas de remplacant : l'API Editing
     moderne n'est implementee nulle part. Tous les editeurs legers du web
     l'utilisent encore, y compris en 2026. Le jour ou il disparait vraiment,
     c'est CE bloc qu'il faut reecrire, et lui seul. */
  function cableFormat() {
    var barre = document.querySelector('.renc-format');
    var zone = id('rencNotes');
    if (!barre || !zone) return;

    barre.addEventListener('click', function (e) {
      var bt = e.target.closest('button[data-cmd]');
      if (!bt) return;
      e.preventDefault();
      zone.focus();
      var cmd = bt.getAttribute('data-cmd');
      if (cmd === 'bold')    document.execCommand('bold');
      else if (cmd === 'ul') document.execCommand('insertUnorderedList');
      else if (cmd === 'ol') document.execCommand('insertOrderedList');
      else if (cmd === 'h2') {
        // Bascule : un deuxieme clic sur un titre le rend au paragraphe.
        var bloc = document.queryCommandValue('formatBlock');
        document.execCommand('formatBlock', false,
          /h2/i.test(String(bloc)) ? 'p' : 'h2');
      } else if (cmd === 'case') {
        document.execCommand('insertHTML', false, '<input type="checkbox">&nbsp;');
      }
      marqueSale();
    });
    // Un `mousedown` sur la barre ferait perdre le focus — donc la selection
    // — avant que le clic n'arrive.
    barre.addEventListener('mousedown', function (e) { e.preventDefault(); });
  }

  /* ==================================================================== */
  /* Formulaire <-> objet                                                 */
  /* ==================================================================== */

  var CHAMPS = ['rencTitre', 'rencDate', 'rencType', 'rencDossier',
                'rencAnimateur', 'rencSecretaire', 'rencParticipants'];

  function lisFormulaire() {
    var base = courante || {};
    return Object.assign({}, base, {
      titre:        (id('rencTitre')        || {}).value || '',
      date:         (id('rencDate')         || {}).value || '',
      type:         (id('rencType')         || {}).value || 'comite',
      dossier:      (id('rencDossier')      || {}).value || '',
      animateur:    (id('rencAnimateur')    || {}).value || '',
      secretaire:   (id('rencSecretaire')   || {}).value || '',
      participants: (id('rencParticipants') || {}).value || '',
      notesBrutes:  (id('rencNotes')  || {}).innerHTML || '',
      sortieIA:     (id('rencSortie') || {}).innerHTML || ''
    });
  }

  function posteFormulaire(doc) {
    doc = doc || {};
    if (id('rencTitre'))      id('rencTitre').value      = doc.titre || '';
    if (id('rencDate'))       id('rencDate').value       = doc.date || RencData.aujourdhui();
    if (id('rencType'))       id('rencType').value       = doc.type || 'comite';
    if (id('rencAnimateur'))  id('rencAnimateur').value  = doc.animateur || '';
    if (id('rencSecretaire')) id('rencSecretaire').value = doc.secretaire || '';
    if (id('rencParticipants')) {
      id('rencParticipants').value = Array.isArray(doc.participants)
        ? doc.participants.join(', ') : (doc.participants || '');
    }
    remplitSelectDossiers(doc.dossier || '');
    if (id('rencNotes'))  id('rencNotes').innerHTML  = assainit(doc.notesBrutes || '');
    if (id('rencSortie')) id('rencSortie').innerHTML = assainit(doc.sortieIA || '');
    if (id('rencBrut'))   id('rencBrut').textContent = doc.transcription || '';
  }

  function remplitSelectDossiers(choisi) {
    var sel = id('rencDossier');
    if (!sel) return;
    sel.textContent = '';
    var vide = document.createElement('option');
    vide.value = '';
    vide.textContent = '— non classée —';
    sel.appendChild(vide);
    dossiers.forEach(function (d) {
      var o = document.createElement('option');
      o.value = d.id;
      o.textContent = nomDossier(d);
      sel.appendChild(o);
    });
    sel.value = choisi || '';
  }

  /* ==================================================================== */
  /* Sauvegarde                                                           */
  /* ==================================================================== */

  function etat(texte, ton) {
    var n = id('rencEtat');
    if (!n) return;
    n.textContent = texte || '';
    n.dataset.ton = ton || '';
  }

  function marqueSale() {
    sale = true;
    var bt = id('rencSauver');
    if (bt) { bt.classList.add('is-sale'); bt.textContent = '💾 Enregistrer'; }
  }

  function marquePropre() {
    sale = false;
    var bt = id('rencSauver');
    if (bt) { bt.classList.remove('is-sale'); bt.textContent = '✓ Enregistré'; }
  }

  /**
   * Etat NEUTRE : rien a enregistrer, mais rien n'a ete enregistre non plus.
   *
   * C'est la nuance qui manquait. Une rencontre neuve et vide affichait
   * « ✓ Enregistré » — vu a l'ecran le 24 aout. Le bouton disait vrai au sens
   * technique (aucun travail en attente) et FAUX au sens de celui qui le lit :
   * rien n'avait ete ecrit nulle part. Un indicateur d'enregistrement qui
   * ment, meme par omission, ne vaut rien le jour ou l'usager s'y fie.
   */
  function marqueNeutre() {
    sale = false;
    var bt = id('rencSauver');
    if (bt) { bt.classList.remove('is-sale'); bt.textContent = '💾 Enregistrer'; }
  }

  /** Ecrit le brouillon local. Ne touche jamais au reseau. */
  function sauveLocal() {
    if (!courante) return true;
    var ok = RencData.brouillon.ecrire(courante.id || RencData.NEUVE, lisFormulaire());
    if (!ok) {
      // Un brouillon qu'on croit ecrit et qui ne l'est pas, c'est exactement
      // la panne qu'on cherche a eviter. On le DIT.
      etat('⚠ Le stockage de cet appareil est plein : le brouillon local n\'a pas pu être écrit. Enregistre maintenant.', 'alerte');
    }
    return ok;
  }

  /**
   * Ecrit au serveur. `silencieux` sert aux ecritures declenchees par un blur
   * ou par le retour du reseau : elles ne doivent pas crier « Enregistré »
   * en plein milieu d'une phrase.
   */
  async function sauveServeur(silencieux) {
    if (!courante || !pretServeur) return;
    if (!RencData.enLigne()) {
      etat('Pas de réseau — tes notes restent sur cet appareil et partiront au retour de la connexion.', 'attente');
      return;
    }
    var doc = lisFormulaire();
    var verdict = RencData.verifiePoids(doc);
    if (!verdict.ok) {
      etat('⚠ Ce compte rendu dépasse la taille d\'un document ('
        + Math.round(verdict.poids / 1024) + ' Ko sur ' + Math.round(verdict.max / 1024)
        + ' Ko). Coupe-le en deux rencontres.', 'alerte');
      return;
    }
    try {
      etat('Enregistrement…');
      var ecrit = courante.id
        ? await RencData.majRencontre(courante.id, doc)
        : await RencData.creerRencontre(doc);
      // Une rencontre neuve vient de recevoir son identifiant : le brouillon
      // qui vivait sous la cle « neuve » doit demenager, sinon il ressuscite
      // au prochain chargement comme une SECONDE rencontre.
      if (!courante.id) RencData.brouillon.oublier(RencData.NEUVE);
      courante = ecrit;
      RencData.brouillon.oublier(ecrit.id);
      marquePropre();
      etat(silencieux ? '' : 'Enregistré.');
      await rafraichitListe();
    } catch (e) {
      // On NE vide PAS le brouillon local : c'est tout ce qui reste.
      etat('⚠ L\'enregistrement a échoué (' + (e.message || e)
        + '). Tes notes restent sur cet appareil ; réessaie.', 'alerte');
    }
  }

  /* ==================================================================== */
  /* Rail : dossiers et liste                                             */
  /* ==================================================================== */

  function dessineDossiers() {
    var hote = id('rencDossiers');
    if (!hote) return;
    hote.textContent = '';

    var tous = [{ id: null, fr: 'Toutes mes rencontres', en: 'All my meetings' }]
      .concat(dossiers);

    tous.forEach(function (d) {
      var li = document.createElement('li');
      var bt = document.createElement('button');
      bt.type = 'button';
      bt.className = 'renc-dossier' + (d.id === dossierActif ? ' is-actif' : '');
      // textContent et jamais innerHTML : un nom de dossier est saisi par
      // l'usager, il n'a aucune raison d'etre interprete comme du balisage.
      bt.textContent = (d.id === null ? '📚 ' : '📁 ') + nomDossier(d);
      bt.addEventListener('click', function () {
        dossierActif = d.id;
        dessineDossiers();
        dessineListe();
      });
      li.appendChild(bt);
      hote.appendChild(li);
    });
  }

  var LIBELLE_TYPE = { comite: 'Comité', statutaire: 'Statutaire', autre: 'Autre' };

  function dessineListe() {
    var hote = id('rencListe'), vide = id('rencListeVide');
    if (!hote) return;
    hote.textContent = '';

    var enAttente = RencData.brouillon.enAttente();
    var visibles = rencontres.filter(function (r) {
      return dossierActif === null || (r.dossier || '') === dossierActif;
    });

    visibles.forEach(function (r) {
      var li = document.createElement('li');
      var bt = document.createElement('button');
      bt.type = 'button';
      bt.className = 'renc-item'
        + (courante && courante.id === r.id ? ' is-actif' : '')
        + (enAttente.indexOf(r.id) >= 0 ? ' is-sale' : '');

      var n = document.createElement('span');
      n.className = 'renc-item__n';
      n.textContent = r.titre || 'Sans titre';
      bt.appendChild(n);

      var m = document.createElement('span');
      m.className = 'renc-item__m';
      var pastille = document.createElement('span');
      pastille.className = 'renc-pastille';
      pastille.setAttribute('data-type', r.type || 'comite');
      m.appendChild(pastille);
      m.appendChild(document.createTextNode(
        (r.date || '') + ' · ' + (LIBELLE_TYPE[r.type] || 'Comité')));
      bt.appendChild(m);

      bt.addEventListener('click', function () { ouvre(r); });
      li.appendChild(bt);
      hote.appendChild(li);
    });

    if (vide) vide.hidden = visibles.length > 0;
  }

  async function rafraichitListe() {
    if (!pretServeur) return;
    try {
      rencontres = await RencData.listeRencontres();
      dessineListe();
    } catch (e) {
      etat('⚠ La liste n\'a pas pu être relue (' + (e.message || e) + ').', 'alerte');
    }
  }

  /* ==================================================================== */
  /* Ouvrir une rencontre                                                 */
  /* ==================================================================== */

  function montreFiche() {
    var accueil = id('rencAccueil'), fiche = id('rencFiche');
    if (accueil) accueil.hidden = true;
    if (fiche) fiche.hidden = false;
    if (window.__rencFermeTiroir) window.__rencFermeTiroir();
  }

  /**
   * Ouvre une rencontre existante. Le brouillon local gagne s'il est plus
   * recent que la copie serveur — c'est la seule facon de rendre a quelqu'un
   * les notes qu'il a prises juste avant que son navigateur ne meure.
   */
  function ouvre(doc) {
    if (sale && courante) sauveLocal();
    var local = RencData.brouillon.lire(doc.id);
    var r = RencData.fusionne(doc, local);
    courante = r.doc;
    posteFormulaire(courante);
    montreFiche();
    dessineListe();
    if (r.restaure) {
      marqueSale();
      etat('Notes retrouvées sur cet appareil — elles sont plus récentes que la dernière version enregistrée. Vérifie, puis enregistre.', 'attente');
    } else {
      marquePropre();
      etat('');
    }
  }

  /** Une rencontre neuve. Rien n'est ecrit au serveur avant une saisie. */
  function nouvelle(brouillonExistant) {
    if (sale && courante) sauveLocal();
    courante = brouillonExistant || RencData.normalise({ date: RencData.aujourdhui() });
    if (!brouillonExistant) courante.id = null;
    posteFormulaire(courante);
    montreFiche();
    dessineListe();
    if (brouillonExistant) {
      marqueSale();
      etat('Rencontre non enregistrée retrouvée sur cet appareil. Vérifie, puis enregistre.', 'attente');
    } else {
      marqueNeutre();
      etat('');
      var t = id('rencTitre');
      if (t) t.focus();
    }
  }

  /* ==================================================================== */
  /* Micro (vague C)                                                      */
  /* ==================================================================== */

  var SOUCIS = {
    'texte-direct-refuse':
      "Le navigateur n'autorise pas l'écriture en direct. L'enregistrement continue : le texte s'écrira à la fin.",
    'texte-direct-reseau':
      "Réseau instable — l'écriture en direct s'est interrompue. L'enregistrement continue.",
    'texte-direct-arrete':
      "L'écriture en direct s'est arrêtée. L'enregistrement continue : le texte s'écrira à la fin.",
    'enregistrement-interrompu':
      "⚠ L'enregistrement a été interrompu. Ce qui a été capté jusqu'ici est conservé.",
    'arret-impossible':
      "⚠ L'arrêt de l'enregistrement a échoué. Recharge la page ; ce qui est déjà transcrit est conservé."
  };

  var MICRO_ERREURS = {
    MICRO_REFUSE: "Le micro a été refusé. Autorise-le dans la barre d'adresse, puis redémarre.",
    MICRO_ABSENT: "Aucun micro détecté sur cet appareil.",
    MICRO_INDISPONIBLE: "Ce navigateur ne donne pas accès au micro.",
    ENREGISTREUR_INDISPONIBLE: "Ce navigateur ne sait pas enregistrer l'audio.",
    MICRO_ERREUR: "Le micro n'a pas pu démarrer."
  };

  function etatMicro(texte, ton) {
    var n = id('rencMicEtat');
    if (!n) return;
    n.textContent = texte || '';
    n.dataset.ton = ton || '';
  }

  function boutonsMicro() {
    var e = RencMicro.etat();
    var d = id('rencMicDemarrer'), p = id('rencMicPause'), a = id('rencMicArret');
    if (!d) return;
    d.disabled = (e !== 'arret');
    p.disabled = (e === 'arret');
    a.disabled = (e === 'arret');
    p.textContent = (e === 'pause') ? '▶ Reprendre' : '⏸ Pause';
    var rec = id('rencRec');
    if (rec) rec.hidden = (e !== 'enregistre');
  }

  function cableMicro() {
    var zone = id('rencMicTexte');
    var mode = id('rencMicMode');
    if (!zone || !mode) return;

    if (!RencMicro.disponible) {
      mode.textContent = "Ce navigateur ne donne pas accès au micro. Les deux autres façons de capturer restent ouvertes : écrire à la main, ou déposer un enregistrement.";
      ['rencMicDemarrer', 'rencMicPause', 'rencMicArret'].forEach(function (c) {
        var n = id(c); if (n) n.disabled = true;
      });
      return;
    }

    // Ce que l'usager VERRA, jamais de quelle interface dispose son
    // navigateur. Les deux phrases se valent : aucune n'annonce un manque.
    mode.textContent = RencMicro.direct
      ? "Le texte s'écrit à l'écran pendant la rencontre."
      : "Le texte s'écrit une fois l'enregistrement terminé.";

    RencMicro.sur('minuteur', function (s) {
      var c = id('rencChrono');
      if (c) c.textContent = RencMicro.formate(s);
    });

    RencMicro.sur('etat', boutonsMicro);

    RencMicro.sur('texte', function (fini, provisoire) {
      // textContent pour le fini, un <span> pour le provisoire : c'est du
      // texte dicte, il n'a aucune raison d'etre interprete comme du balisage.
      zone.textContent = fini;
      if (provisoire) {
        var sp = document.createElement('span');
        sp.className = 'renc-provisoire';
        sp.textContent = (fini ? ' ' : '') + provisoire;
        zone.appendChild(sp);
      }
      zone.scrollTop = zone.scrollHeight;
      if (courante) {
        courante.transcription = fini;
        var brut = id('rencBrut');
        if (brut) brut.textContent = fini;
        marqueSale();
      }
    });

    RencMicro.sur('souci', function (code) {
      etatMicro(SOUCIS[code] || code, code.indexOf('enregistrement') === 0 ? 'alerte' : 'attente');
    });

    RencMicro.sur('audio', function (blob, info) {
      // L'enregistrement rejoint EXACTEMENT le meme tuyau qu'un fichier
      // depose : meme decodage 16 kHz mono, meme decoupage, meme devis, meme
      // quota. C'est ce qui rend le mode micro identique sur Safari et sur
      // Chrome — d'un cote le texte s'est deja ecrit pendant la rencontre, de
      // l'autre il arrive maintenant, et le resultat de reference est le meme.
      etatMicro('Enregistrement terminé — ' + RencMicro.formate(info.secondes)
        + '. Préparation de la transcription…', 'attente');
      id('ongImport').click();
      prepare(blob, 'enregistrement.' + (String(info.mime).indexOf('mp4') >= 0 ? 'm4a' : 'webm'));
    });

    // ── Consentement ──
    var bloc = id('rencConsent'), coche = id('rencConsentOk');
    if (coche) {
      coche.addEventListener('change', function () {
        if (coche.checked) {
          RencMicro.donneConsentement();
          if (bloc) bloc.hidden = true;
          etatMicro('');
        }
      });
    }

    id('rencMicDemarrer').addEventListener('click', async function () {
      if (!RencMicro.consentementDonne()) {
        if (bloc) bloc.hidden = false;
        etatMicro('Coche la case ci-dessus avant de démarrer.', 'attente');
        if (coche) coche.focus();
        return;
      }
      if (!courante) nouvelle(null);
      etatMicro('');
      try {
        await RencMicro.demarre();
        etatMicro('');
      } catch (e) {
        etatMicro(MICRO_ERREURS[e.message] || MICRO_ERREURS.MICRO_ERREUR, 'alerte');
      }
      boutonsMicro();
    });

    id('rencMicPause').addEventListener('click', function () {
      if (RencMicro.etat() === 'pause') RencMicro.reprend();
      else RencMicro.pause();
      boutonsMicro();
    });

    id('rencMicArret').addEventListener('click', function () {
      RencMicro.arrete();
      boutonsMicro();
    });

    boutonsMicro();
  }

  /* ==================================================================== */
  /* Transcription (vague D)                                              */
  /* ==================================================================== */

  var enCours = false;          // une transcription tourne : on n'en lance pas deux
  var aTranscrire = null;       // { segments, secondes, nom }

  function duree(s) {
    var m = Math.round(s / 60);
    if (m < 60) return m + ' minute' + (m > 1 ? 's' : '');
    var h = Math.floor(m / 60), r = m % 60;
    return h + ' h' + (r ? ' ' + (r < 10 ? '0' : '') + r : '');
  }

  function etatImport(texte, ton) {
    var n = id('rencImportEtat');
    if (!n) return;
    n.textContent = texte || '';
    n.dataset.ton = ton || '';
  }

  /**
   * Prend un fichier ou un blob, le decode, le decoupe, demande le devis et
   * montre ce que ca va couter. Rien ne part avant que l'usager n'appuie.
   */
  async function prepare(source, nom) {
    if (enCours) { etatImport('Une transcription est déjà en cours.', 'attente'); return; }
    if (nom && !RencAudio.formatAccepte(nom)) {
      etatImport('Format non reconnu. Accepte : mp3, m4a, wav, mp4, webm.', 'alerte');
      return;
    }
    if (!RencData.enLigne()) {
      etatImport('La transcription a besoin du réseau. Tes notes, elles, continuent de fonctionner.', 'attente');
      return;
    }

    id('rencDevis').hidden = true;
    etatImport('Lecture du fichier…');
    var buffer;
    try {
      buffer = await RencAudio.decode(source);
    } catch (e) {
      var m = {
        AUDIO_INDISPONIBLE: "Ce navigateur ne sait pas décoder l'audio.",
        LECTURE_IMPOSSIBLE: 'Le fichier n\'a pas pu être lu.',
        FORMAT_ILLISIBLE: "Ce fichier n'a pas pu être décodé. Essaie un .mp3 ou un .m4a."
      };
      etatImport(m[e.message] || 'Le fichier n\'a pas pu être décodé.', 'alerte');
      return;
    }

    var secondes = buffer.length / RencAudio.TAUX;
    etatImport('Découpage…');
    var segments;
    try {
      segments = RencAudio.segmente(buffer);
    } catch (e) {
      etatImport('Le découpage a échoué — le fichier est peut-être trop long pour cet appareil.', 'alerte');
      return;
    }
    // Le buffer decode pese jusqu'a 115 Mo : on lache la reference des que les
    // segments sont faits, sinon il reste en memoire toute la transcription.
    buffer = null;

    var devis;
    try {
      devis = await RencData.devisTranscription(Math.round(secondes));
    } catch (e) {
      etatImport('Le serveur n\'a pas répondu (' + (e.message || e) + ').', 'alerte');
      return;
    }

    aTranscrire = { segments: segments, secondes: secondes, nom: nom || 'enregistrement' };
    etatImport('');

    id('rencDevisDuree').textContent = 'Durée détectée : ' + duree(secondes)
      + ' — ' + segments.length + ' segment' + (segments.length > 1 ? 's' : '') + '.';
    id('rencDevisQuota').textContent = 'Coût : ' + devis.minutesDemandees
      + ' minutes sur les ' + devis.minutesRestantes + ' qu\'il te reste aujourd\'hui'
      + ' (plafond ' + devis.plafondJour + ' par jour).';

    var avert = id('rencDevisAvert');
    if (devis.longue) {
      avert.hidden = false;
      avert.textContent = '⚠ Plus de 90 minutes. La transcription prendra un moment, '
        + 'et elle consomme une bonne part de ton quota du jour. Garde cet onglet ouvert.';
    } else {
      avert.hidden = true;
    }

    id('rencLancer').disabled = !devis.suffisant;
    if (!devis.suffisant) {
      avert.hidden = false;
      avert.textContent = 'Il ne reste pas assez de minutes aujourd\'hui pour cet enregistrement. '
        + 'Le compteur repart demain — ou découpe le fichier en deux.';
    }
    id('rencDevis').hidden = false;
  }

  /** Envoie les segments un par un, dans l'ordre, et recolle le texte. */
  async function lance() {
    if (!aTranscrire || enCours) return;
    enCours = true;
    id('rencDevis').hidden = true;
    id('rencAvance').hidden = false;
    if (!courante) nouvelle(null);

    var segments = aTranscrire.segments;
    var morceaux = [];
    var faits = 0;

    function avance(texte) {
      id('rencJauge').style.width = Math.round((faits / segments.length) * 100) + '%';
      id('rencAvanceTexte').textContent = texte;
    }
    avance('Envoi du segment 1 sur ' + segments.length + '…');

    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      try {
        var rep = await RencData.transcrisSegment(seg.wav, seg.secondes, seg.index, lang());
        morceaux.push(rep.texte || '');
        // Le texte s'ecrit au fur et a mesure : sur une rencontre d'une heure,
        // attendre douze segments sans rien voir donne l'impression d'un
        // plantage.
        appliqueTranscription(morceaux.join(' ').replace(/\s+/g, ' ').trim());
        faits++;
        avance(faits < segments.length
          ? 'Segment ' + (faits + 1) + ' sur ' + segments.length + '…'
          : 'Dernier segment…');
      } catch (e) {
        // On garde ce qui est deja transcrit : la moitie d'un compte rendu
        // vaut infiniment mieux que rien, et l'usager peut relancer le reste.
        enCours = false;
        id('rencAvance').hidden = true;
        var q = (e.code === 'QUOTA_MINUTES');
        etatImport((q ? '' : '⚠ ') + (e.message || e)
          + (faits ? ' — les ' + faits + ' premier' + (faits > 1 ? 's' : '') + ' segment'
             + (faits > 1 ? 's sont' : ' est') + ' conservé' + (faits > 1 ? 's' : '')
             + ' dans « Original ».' : ''), q ? 'attente' : 'alerte');
        if (sale) sauveServeur(true);
        return;
      }
    }

    enCours = false;
    aTranscrire = null;
    id('rencAvance').hidden = true;
    etatImport('Transcription terminée. Le texte est dans « Original » — les deux boutons de traitement arrivent à la vague E.', 'attente');
    if (sale) sauveServeur(true);
  }

  /** Pose le texte transcrit dans la rencontre ouverte et dans l'onglet Original. */
  function appliqueTranscription(texte) {
    if (!courante) return;
    courante.transcription = texte;
    var brut = id('rencBrut');
    if (brut) brut.textContent = texte;
    marqueSale();
  }

  function cableImport() {
    var zone = id('rencDepot'), champ = id('rencFichier');
    if (!zone || !champ) return;

    zone.addEventListener('click', function () { champ.click(); });
    zone.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); champ.click(); }
    });
    champ.addEventListener('change', function () {
      var f = champ.files && champ.files[0];
      if (f) prepare(f, f.name);
      // On vide le champ : sans ca, redeposer LE MEME fichier n'emet aucun
      // evenement `change` et l'app a l'air morte.
      champ.value = '';
    });

    ['dragenter', 'dragover'].forEach(function (n) {
      zone.addEventListener(n, function (e) {
        e.preventDefault(); e.stopPropagation();
        zone.classList.add('is-survol');
      });
    });
    ['dragleave', 'drop'].forEach(function (n) {
      zone.addEventListener(n, function (e) {
        e.preventDefault(); e.stopPropagation();
        zone.classList.remove('is-survol');
      });
    });
    zone.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) prepare(f, f.name);
    });
    // Un fichier lache A COTE de la zone ouvrirait le lecteur du navigateur et
    // ferait perdre la page — et avec elle la rencontre en cours.
    ['dragover', 'drop'].forEach(function (n) {
      window.addEventListener(n, function (e) {
        if (zone.contains(e.target)) return;
        e.preventDefault();
      });
    });

    id('rencLancer').addEventListener('click', lance);
    id('rencAnnuler').addEventListener('click', function () {
      aTranscrire = null;
      id('rencDevis').hidden = true;
      etatImport('');
    });
  }

  /* ==================================================================== */
  /* Traitement IA (vague E)                                              */
  /* ==================================================================== */

  var iaEnCours = false;

  /* Le mot a mot part PAR BLOCS. Une rencontre de 90 minutes fait environ
     13 000 mots : nettoyee d'un coup, la sortie depasserait tout plafond
     raisonnable et reviendrait tronquee AU MILIEU D'UNE PHRASE — la pire des
     sorties, parce qu'elle a l'air complete.

     La coupe se fait sur une FIN DE PHRASE quand il y en a une a portee, pas
     au mot le plus proche : couper « ...on decide que » | « ...Marie s'en
     occupe » donnerait deux blocs dont aucun ne se tient, et le modele
     ponctuerait chacun comme s'il etait entier. */
  var MOTS_PAR_BLOC = 1500;

  function blocs(texte) {
    var mots = String(texte || '').trim().split(/\s+/).filter(Boolean);
    if (!mots.length) return [];
    var out = [];
    var i = 0;
    while (i < mots.length) {
      var fin = Math.min(i + MOTS_PAR_BLOC, mots.length);
      if (fin < mots.length) {
        // On recule jusqu'a un mot qui termine une phrase, dans les 150
        // derniers mots du bloc. Au-dela on coupe net : mieux vaut un bloc
        // un peu long qu'une recherche qui remonte au debut.
        var recul = fin;
        while (recul > i + MOTS_PAR_BLOC - 150 && !/[.!?…]["»)]?$/.test(mots[recul - 1])) recul--;
        if (recul > i + MOTS_PAR_BLOC - 150) fin = recul;
      }
      out.push(mots.slice(i, fin).join(' '));
      i = fin;
    }
    return out;
  }

  function modeleChoisi() {
    var c = id('rencSonnet');
    return (c && c.checked) ? 'sonnet' : 'haiku';
  }

  /** Le texte de depart : la transcription si elle existe, sinon les notes. */
  function texteSource() {
    if (courante && courante.transcription && courante.transcription.trim()) {
      return courante.transcription.trim();
    }
    var n = id('rencNotes');
    return n ? (n.innerText || '').trim() : '';
  }

  function echappe(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /** Le compte rendu structure, rendu en HTML — celui que l'usager editera. */
  function rendStructure(s) {
    var h = [];
    if (s.resume) h.push('<h2>Résumé</h2><p>' + echappe(s.resume).replace(/\n+/g, '<br>') + '</p>');
    function bloc(titre, items) {
      if (!items || !items.length) return;
      h.push('<h2>' + titre + '</h2><ul>'
        + items.map(function (x) { return '<li>' + echappe(x) + '</li>'; }).join('') + '</ul>');
    }
    bloc('Points discutés', s.points);
    bloc('Décisions prises', s.decisions);
    if (s.actions && s.actions.length) {
      // Les actions sont des CASES A COCHER, pas des puces : c'est ce qui les
      // rend vivantes, et c'est ce que la vue « Mes actions » de la vague H
      // relira.
      h.push('<h2>Actions à faire</h2>');
      h.push(s.actions.map(function (a) {
        var q = echappe(a.quoi);
        var qui = a.qui ? ' <b>— ' + echappe(a.qui) + '</b>' : '';
        var ech = a.echeance ? ' <b>(' + echappe(a.echeance) + ')</b>' : '';
        return '<div><input type="checkbox"'
          + (a.fait ? ' checked' : '') + '> ' + q + qui + ech + '</div>';
      }).join(''));
    }
    bloc('Points reportés à la prochaine rencontre', s.reportes);
    return h.join('');
  }

  function iaOccupee(oui, texte) {
    iaEnCours = oui;
    ['rencVerbatim', 'rencStructure', 'rencPassage'].forEach(function (c) {
      var n = id(c);
      if (n) n.disabled = oui;
    });
    etat(texte || '', oui ? 'attente' : '');
  }

  function messageIA(e) {
    if (e && e.code === 'QUOTA_IA') return e.message;
    return '⚠ ' + (e && e.message ? e.message : e);
  }

  async function faisVerbatim() {
    if (iaEnCours || !courante) return;
    var source = texteSource();
    if (!source) { etat('Il n\'y a encore rien à nettoyer.', 'attente'); return; }
    var parts = blocs(source);
    iaOccupee(true, 'Mot à mot — bloc 1 sur ' + parts.length + '…');

    var faits = [];
    for (var i = 0; i < parts.length; i++) {
      try {
        var r = await RencData.traiteIA('verbatim', parts[i], modeleChoisi(), lang());
        faits.push(r.texte || '');
        appliqueSortie(faits.join('\n\n'), 'verbatim');
        if (i + 1 < parts.length) {
          iaOccupee(true, 'Mot à mot — bloc ' + (i + 2) + ' sur ' + parts.length
            + ' (' + r.restantJour + ' traitements restants aujourd\'hui)…');
        }
      } catch (e) {
        // Ce qui est deja nettoye RESTE. Un mot a mot a moitie fait vaut
        // mieux qu'un ecran vide, et l'usager peut relancer.
        iaOccupee(false, messageIA(e)
          + (faits.length ? ' — les ' + faits.length + ' premiers blocs sont conservés.' : ''));
        if (sale) sauveServeur(true);
        return;
      }
    }
    iaOccupee(false, 'Mot à mot terminé. Le texte reste modifiable à la main.');
    if (sale) sauveServeur(true);
  }

  async function faisStructure() {
    if (iaEnCours || !courante) return;
    var source = texteSource();
    if (!source) { etat('Il n\'y a encore rien à résumer.', 'attente'); return; }
    iaOccupee(true, 'Compte rendu en préparation…');
    try {
      var r = await RencData.traiteIA('structure', source, modeleChoisi(), lang());
      courante.actions = (r.sortie && r.sortie.actions) || [];
      appliqueSortie(rendStructure(r.sortie || {}), 'structure');
      iaOccupee(false, 'Compte rendu prêt — '
        + courante.actions.length + ' action' + (courante.actions.length > 1 ? 's' : '')
        + ' à faire. Tout reste modifiable.');
      if (sale) sauveServeur(true);
    } catch (e) {
      iaOccupee(false, messageIA(e));
    }
  }

  /** Le résumé d'un seul passage, selectionne dans l'onglet « Original ». */
  async function faisPassage() {
    if (iaEnCours || !courante) return;
    var sel = String(window.getSelection ? window.getSelection().toString() : '').trim();
    if (sel.length < 40) {
      etat('Sélectionne d\'abord un passage dans « Original » (au moins quelques phrases).', 'attente');
      return;
    }
    iaOccupee(true, 'Résumé du passage…');
    try {
      var r = await RencData.traiteIA('passage', sel, modeleChoisi(), lang());
      // Le resume s'AJOUTE au compte rendu, il ne l'ecrase pas : on resume un
      // point precis EN PLUS du reste, jamais a la place.
      var z = id('rencSortie');
      var p = document.createElement('p');
      p.textContent = r.texte || '';
      z.appendChild(p);
      marqueSale();
      iaOccupee(false, 'Résumé ajouté au bas du compte rendu.');
      if (sale) sauveServeur(true);
    } catch (e) {
      iaOccupee(false, messageIA(e));
    }
  }

  /** Ecrit dans l'onglet « Compte rendu » et bascule dessus. */
  function appliqueSortie(html, mode) {
    var z = id('rencSortie');
    if (!z) return;
    z.innerHTML = assainit(html);
    if (courante) {
      courante.sortieIA = z.innerHTML;
      courante.sortieMode = mode;
    }
    var ong = id('ongResultat');
    if (ong && id('panResultat').hidden) ong.click();
    marqueSale();
  }

  function cableIA() {
    var v = id('rencVerbatim'), st = id('rencStructure'), p = id('rencPassage');
    if (v) v.addEventListener('click', faisVerbatim);
    if (st) st.addEventListener('click', faisStructure);
    if (p) p.addEventListener('click', faisPassage);

    // Le bouton « résumer un passage » n'apparait que quand il y a un passage
    // selectionne. Un bouton qui exige une selection invisible et qui ronchonne
    // quand elle manque est une devinette ; celui-ci se montre au bon moment.
    document.addEventListener('selectionchange', function () {
      if (!p) return;
      var brut = id('rencBrut');
      var sel = window.getSelection();
      var dedans = sel && sel.rangeCount && brut
        && brut.contains(sel.getRangeAt(0).commonAncestorContainer);
      p.hidden = !(dedans && String(sel).trim().length >= 40);
    });
  }

  /* ==================================================================== */
  /* Ce qui n'est pas encore branche                                      */
  /* ==================================================================== */

  /**
   * Desactive une commande dont la vague n'est pas livree, en DISANT laquelle.
   * Un bouton qui ne fait rien sans expliquer pourquoi est un defaut ; un
   * bouton grise qui nomme son echeance est un chantier lisible.
   */
  function pasEncore(cle, vague) {
    var n = id(cle);
    if (!n) return;
    n.disabled = true;
    n.title = 'Arrive à la vague ' + vague + '.';
  }

  /* ==================================================================== */
  /* Demarrage                                                            */
  /* ==================================================================== */

  function cableSaisie() {
    // Chaque frappe salit ; l'ecriture SERVEUR n'a lieu qu'au blur ou au
    // bouton. Le blur d'un champ de formulaire est le moment naturel : on
    // vient de finir de le remplir.
    CHAMPS.forEach(function (c) {
      var n = id(c);
      if (!n) return;
      n.addEventListener('input',  marqueSale);
      n.addEventListener('change', marqueSale);
      n.addEventListener('blur', function () { if (sale) sauveServeur(true); });
    });

    ['rencNotes', 'rencSortie'].forEach(function (c) {
      var z = id(c);
      if (!z) return;
      z.addEventListener('input', marqueSale);
      z.addEventListener('blur', function () { if (sale) sauveServeur(true); });
      cableCollage(z);
    });

    var bt = id('rencSauver');
    if (bt) bt.addEventListener('click', function () { sauveServeur(false); });

    // Le battement des 10 secondes. Il n'ecrit QUE si quelque chose a change
    // — un minuteur qui reecrit le meme brouillon 360 fois par heure use le
    // stockage pour rien.
    setInterval(function () { if (sale) sauveLocal(); }, AUTO_MS);

    // Dernier filet avant la fermeture de l'onglet. `beforeunload` n'a le
    // droit qu'a du synchrone : localStorage en est, une ecriture Firestore
    // non — elle serait tuee par la navigation.
    window.addEventListener('beforeunload', function (e) {
      // Le micro d'abord : sans ca, la pastille rouge de l'onglet reste
      // allumee et le peripherique reste pris apres la fermeture.
      if (window.RencMicro && RencMicro.etat() !== 'arret') RencMicro.arrete();
      if (!sale || !courante) return;
      sauveLocal();
      // On ne bloque PAS la fermeture : le brouillon est deja ecrit, retenir
      // quelqu'un avec une boite de dialogue serait gratuit.
    });
  }

  async function chargeApresAuth() {
    try {
      dossiers = await RencData.lireDossiers();
    } catch (e) {
      // Un echec de lecture des dossiers ne doit pas empecher de prendre des
      // notes : on retombe sur les deux dossiers de depart.
      dossiers = RencData.dossiersDefaut();
    }
    pretServeur = true;
    dessineDossiers();
    await rafraichitListe();

    // Une rencontre neuve laissee en plan par un plantage : elle n'a pas
    // d'identifiant serveur, donc rien ne la ramenerait autrement.
    var orpheline = RencData.brouillon.lire(RencData.NEUVE);
    if (orpheline && (orpheline.titre || orpheline.notesBrutes)) nouvelle(orpheline);
  }

  function demarre() {
    cableOnglets([['ongNotes', 'panNotes'], ['ongMicro', 'panMicro'], ['ongImport', 'panImport']]);
    cableOnglets([['ongResultat', 'panResultat'], ['ongBrut', 'panBrut']]);
    cableTiroir();
    cableMenu();
    cableReseau();
    cableFormat();
    cableSaisie();
    cableMicro();
    cableImport();
    cableIA();

    dossiers = RencData.dossiersDefaut();
    dessineDossiers();
    dessineListe();

    // Le libelle de l'onglet micro depend du navigateur, et il annonce ce que
    // l'usager VERRA — pas de quelle interface de programmation il dispose.
    var sous = id('ongMicroSous');
    if (sous) sous.textContent = DIRECT ? 'transcription en direct' : 'transcription à la fin';
    var micro = id('ongMicro');
    if (micro) {
      micro.title = DIRECT
        ? 'Le texte s\'écrit pendant la rencontre.'
        : 'Le texte s\'écrit une fois l\'enregistrement terminé.';
    }

    [id('rencNouvelle'), id('rencNouvelle2')].forEach(function (bt) {
      if (bt) bt.addEventListener('click', function () { nouvelle(null); });
    });

    ['rencEnvoyer', 'rencCopier', 'rencPdf', 'rencTxt', 'rencMd', 'rencPartage']
      .forEach(function (c) { pasEncore(c, 'G'); });
    ['rencNouveauDossier', 'rencSupprimer', 'rencCherche'].forEach(function (c) { pasEncore(c, 'F'); });
    pasEncore('rencMesActions', 'H');

    // zts-gate.js emet `zts:auth` une fois le mur franchi. Tant qu'il ne l'a
    // pas emis, l'app est dessinee mais ne parle a personne.
    document.addEventListener('zts:auth', function () {
      RencData.pret().then(chargeApresAuth);
    });
    // Filet : si `zts:auth` avait ete emis AVANT que cet ecouteur ne soit
    // pose, l'app resterait vide sans jamais rien dire. dataStore.js ecoute
    // l'evenement des son chargement, donc la promesse, elle, est deja
    // resolue dans ce cas.
    if (RencData.connecte()) RencData.pret().then(chargeApresAuth);

    // Le nom des dossiers suit la langue du site.
    document.addEventListener('zts:langchange', function () {
      dessineDossiers();
      if (courante) remplitSelectDossiers(courante.dossier || '');
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarre);
  else demarre();
})();
