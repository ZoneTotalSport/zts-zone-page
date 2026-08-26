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
 *   F  classement : creer, renommer et supprimer un dossier, glisser-deposer
 *      une rencontre, recherche plein texte, filtre par type.
 *   G  sortie : courriel, copie, impression PDF, export .txt et .md, partage
 *      natif.
 *   H  suivi : vue « Mes actions », gabarits d'ordre du jour, chainage des
 *      rencontres recurrentes, liste de presences.
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
          // `data-a` est le SEUL attribut conserve avec `type` et `checked` :
          // il porte le rang de l'action dans `actions[]`. Sans lui, cocher
          // une case dans le compte rendu ne pourrait etre rattache a rien, et
          // la vue « Mes actions » afficherait le contraire de l'ecran. On le
          // borne a des chiffres : c'est un rang, pas un champ libre.
          var rang = n.getAttribute('data-a');
          var neuf = document.createElement('input');
          neuf.setAttribute('type', 'checkbox');
          if (coche) neuf.setAttribute('checked', '');
          if (rang && /^\d{1,3}$/.test(rang)) neuf.setAttribute('data-a', rang);
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
    // « Supprimer » n'a de sens que sur une rencontre qui existe deja au
    // serveur. Sur une rencontre neuve, le bouton rouge n'efface rien et
    // vole l'attention juste au-dessus de la seule vraie action de l'ecran.
    var sup = id('rencSupprimerFiche');
    if (sup) sup.hidden = !doc.id;
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
      etat('⚠ La mémoire de cet appareil est pleine : la copie de secours n\'a pas pu s\'écrire. Enregistre maintenant.', 'alerte');
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
    // Avant d'ecrire : si le titre est vide, on en propose un. La liste ne
    // doit pas se remplir de « Sans titre ».
    proposeTitre();
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
      // Elle existe au serveur : « Supprimer » redevient une action reelle.
      var sup = id('rencSupprimerFiche');
      if (sup) sup.hidden = !ecrit.id;
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
      .concat(dossiers)
      .concat([{ id: '', fr: 'Non classées', en: 'Unfiled' }]);

    tous.forEach(function (d) {
      var li = document.createElement('li');
      li.className = 'renc-dossier-l';

      var bt = document.createElement('button');
      bt.type = 'button';
      bt.className = 'renc-dossier' + (d.id === dossierActif ? ' is-actif' : '');
      var lib = document.createElement('span');
      // textContent et jamais innerHTML : un nom de dossier est saisi par
      // l'usager, il n'a aucune raison d'etre interprete comme du balisage.
      lib.textContent = (d.id === null ? '📚 ' : (d.id === '' ? '🗂️ ' : '📁 ')) + nomDossier(d);
      bt.appendChild(lib);
      bt.addEventListener('click', function () {
        dossierActif = d.id;
        dessineDossiers();
        dessineListe();
      });
      li.appendChild(bt);

      // Cible de depot. « Toutes mes rencontres » n'en est pas une : y
      // deposer quelque chose ne voudrait rien dire.
      if (d.id !== null) cibleDepot(bt, d.id);

      // Renommer et supprimer, seulement sur un vrai dossier.
      if (d.id !== null && d.id !== '') {
        li.appendChild(commandeDossier('✏️', 'Renommer ' + nomDossier(d), function () {
          renommeSurPlace(li, bt, d);
        }));
        li.appendChild(commandeDossier('🗑️', 'Supprimer ' + nomDossier(d), function () {
          supprimeDossier(d);
        }));
      }
      hote.appendChild(li);
    });
  }

  function commandeDossier(emoji, titre, action) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'renc-doss-act';
    b.textContent = emoji;
    b.title = titre;
    b.setAttribute('aria-label', titre);
    b.addEventListener('click', function (e) { e.stopPropagation(); action(); });
    return b;
  }

  /* ── Renommer sur place ────────────────────────────────────────────────
     Pas de prompt() : on renomme la ou on lit. L'identifiant du dossier ne
     bouge JAMAIS — c'est lui que les rencontres portent, et renommer
     « Comites » en « Comites d'ecole » ne doit toucher aucune rencontre. */
  function renommeSurPlace(li, bouton, d, estNouveau) {
    if (li.querySelector('.renc-doss-edit')) return;
    var champ = document.createElement('input');
    champ.type = 'text';
    champ.className = 'renc-doss-edit';
    champ.value = nomDossier(d);
    champ.maxLength = 60;
    li.replaceChild(champ, bouton);
    champ.focus();
    champ.select();

    var fini = false;
    function termine(garder) {
      if (fini) return;
      fini = true;
      var nom = champ.value.trim().slice(0, 60);

      // ANNULER LA CREATION DOIT VRAIMENT L'ANNULER. Le dossier est deja dans
      // le tableau quand le champ s'ouvre — c'est ce qui permet de le dessiner
      // — donc Echap, ou un nom vide, doit l'en RETIRER. Sans ca, renoncer
      // laissait derriere un dossier appele « Nouveau dossier », exactement ce
      // que l'edition sur place devait eviter. Vu au navigateur le 24 aout.
      if (estNouveau && (!garder || !nom)) {
        dossiers = dossiers.filter(function (x) { return x.id !== d.id; });
        dessineDossiers();
        return;
      }
      if (garder && nom && (estNouveau || nom !== nomDossier(d))) {
        var cible = dossiers.filter(function (x) { return x.id === d.id; })[0];
        if (cible) {
          if (lang() === 'en') cible.en = nom; else cible.fr = nom;
          // Un dossier cree en francais n'a pas de libelle anglais : on pose
          // le meme des deux cotes plutot que de laisser un trou.
          if (!cible.en) cible.en = nom;
          if (!cible.fr) cible.fr = nom;
          enregistreDossiers(estNouveau ? 'Dossier créé.' : 'Dossier renommé.');
          return;
        }
      }
      dessineDossiers();
    }
    champ.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); termine(true); }
      else if (e.key === 'Escape') { e.preventDefault(); termine(false); }
    });
    champ.addEventListener('blur', function () { termine(true); });
  }

  /* ── Supprimer un dossier ──────────────────────────────────────────────
     SUPPRIMER UN DOSSIER N'EFFACE JAMAIS SON CONTENU — exigence du §6 du
     cahier. Les rencontres deviennent « non classees », et le message le dit
     AVANT, avec leur nombre : c'est la seule facon que la confirmation veuille
     dire quelque chose. */
  async function supprimeDossier(d) {
    var dedans = rencontres.filter(function (r) { return (r.dossier || '') === d.id; }).length;
    var m = 'Supprimer le dossier « ' + nomDossier(d) + ' » ?';
    m += dedans
      ? '\n\nSes ' + dedans + ' rencontre' + (dedans > 1 ? 's deviennent' : ' devient')
        + ' « non classée' + (dedans > 1 ? 's' : '') + ' ». Aucune n\'est effacée.'
      : '\n\nIl est vide.';
    if (!window.confirm(m)) return;

    try {
      if (dedans) await RencData.reassignerDossier(d.id, '');
      dossiers = dossiers.filter(function (x) { return x.id !== d.id; });
      if (dossierActif === d.id) dossierActif = null;
      await RencData.majDossiers(dossiers);
      await rafraichitListe();
      dessineDossiers();
      etat(dedans
        ? 'Dossier supprimé — ' + dedans + ' rencontre' + (dedans > 1 ? 's sont' : ' est')
          + ' maintenant « non classée' + (dedans > 1 ? 's' : '') + ' ».'
        : 'Dossier supprimé.');
    } catch (e) {
      etat('⚠ La suppression a échoué (' + (e.message || e) + ').', 'alerte');
    }
  }

  function nouveauDossier() {
    var nom = 'Nouveau dossier';
    var d = { id: RencData.nouvelIdDossier(), fr: nom, en: nom };
    dossiers.push(d);
    dessineDossiers();
    // On ouvre tout de suite le champ : personne ne veut d'un dossier qui
    // s'appelle « Nouveau dossier ».
    var lignes = id('rencDossiers').children;
    var li = lignes[lignes.length - 2];   // avant « Non classées »
    if (li) renommeSurPlace(li, li.querySelector('.renc-dossier'), d, true);
    else dossiers = dossiers.filter(function (x) { return x.id !== d.id; });
  }

  async function enregistreDossiers(message) {
    try {
      dossiers = await RencData.majDossiers(dossiers);
      dessineDossiers();
      remplitSelectDossiers(courante ? (courante.dossier || '') : '');
      if (message) etat(message);
    } catch (e) {
      etat('⚠ Les dossiers n\'ont pas pu être enregistrés (' + (e.message || e) + ').', 'alerte');
      dessineDossiers();
    }
  }

  /* ── Glisser-deposer ───────────────────────────────────────────────────
     `dragover` DOIT appeler preventDefault, sinon le navigateur refuse le
     depot sans rien dire — c'est le piege classique de cette API. */
  function cibleDepot(noeud, idDossier) {
    noeud.addEventListener('dragover', function (e) {
      if (!porte) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      noeud.classList.add('is-cible');
    });
    noeud.addEventListener('dragleave', function () { noeud.classList.remove('is-cible'); });
    noeud.addEventListener('drop', function (e) {
      e.preventDefault();
      noeud.classList.remove('is-cible');
      if (porte) deplace(porte, idDossier);
    });
  }

  var porte = null;   // la rencontre en cours de deplacement

  async function deplace(r, versDossier) {
    if ((r.dossier || '') === (versDossier || '')) return;
    var nom = versDossier
      ? (dossiers.filter(function (x) { return x.id === versDossier; })[0] || {})
      : null;
    try {
      await RencData.majRencontre(r.id, Object.assign({}, r, { dossier: versDossier || '' }));
      r.dossier = versDossier || '';
      if (courante && courante.id === r.id) {
        courante.dossier = r.dossier;
        remplitSelectDossiers(r.dossier);
      }
      dessineListe();
      etat('« ' + (r.titre || 'Sans titre') + ' » → '
        + (nom ? nomDossier(nom) : 'non classées') + '.');
    } catch (e) {
      etat('⚠ Le déplacement a échoué (' + (e.message || e) + ').', 'alerte');
    }
  }

  var LIBELLE_TYPE = { comite: 'Comité', statutaire: 'Statutaire', autre: 'Autre' };

  /* Recherche plein texte, cote client, sur les rencontres deja chargees —
     v1 assumee au §6 du cahier. Elle regarde TOUT ce qui porte du sens :
     titre, participants, animateur, secretaire, notes, transcription et
     compte rendu. Chercher « surveillances » doit trouver la rencontre ou le
     mot n'a ete prononce qu'une fois, pas seulement celle qui l'a dans son
     titre.

     Les balises sont retirees avant la comparaison : sans ca, chercher « div »
     ou « input » ramenerait tout ce qui contient une case a cocher. */
  function sansBalises(html) {
    return String(html || '').replace(/<[^>]*>/g, ' ');
  }

  function normaliseRecherche(t) {
    t = String(t || '').toLowerCase();
    // Les accents sont retires des DEUX cotes : personne ne tape « périodè »,
    // et beaucoup tapent « periode ».
    try { return t.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
    catch (e) { return t; }
  }

  function correspond(r, q) {
    if (!q) return true;
    var foin = normaliseRecherche([
      r.titre, r.animateur, r.secretaire,
      (r.participants || []).join(' '),
      sansBalises(r.notesBrutes), r.transcription, sansBalises(r.sortieIA)
    ].join(' '));
    // Tous les mots doivent etre presents, pas seulement le premier : une
    // recherche a deux mots sert precisement a resserrer.
    return normaliseRecherche(q).split(/\s+/).filter(Boolean)
      .every(function (mot) { return foin.indexOf(mot) !== -1; });
  }

  function dessineListe() {
    var hote = id('rencListe'), vide = id('rencListeVide');
    if (!hote) return;
    hote.textContent = '';

    var q = (id('rencCherche') || {}).value || '';
    var type = (id('rencFType') || {}).value || '';
    var enAttente = RencData.brouillon.enAttente();
    var visibles = rencontres.filter(function (r) {
      if (dossierActif !== null && (r.dossier || '') !== dossierActif) return false;
      if (type && (r.type || 'comite') !== type) return false;
      return correspond(r, q);
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

      bt.draggable = true;
      bt.addEventListener('dragstart', function (e) {
        porte = r;
        bt.classList.add('is-porte');
        e.dataTransfer.effectAllowed = 'move';
        // Certains navigateurs refusent de commencer un glisser sans donnee.
        try { e.dataTransfer.setData('text/plain', r.id); } catch (err) {}
      });
      bt.addEventListener('dragend', function () {
        porte = null;
        bt.classList.remove('is-porte');
        var c = document.querySelectorAll('.renc-dossier.is-cible');
        for (var i = 0; i < c.length; i++) c[i].classList.remove('is-cible');
      });

      li.className = 'renc-item-l';
      li.appendChild(bt);

      // La corbeille de la rangee. Elle vit dans le DOM en permanence pour
      // rester atteignable au clavier ; c'est l'opacite qui l'efface au repos.
      var jeter = document.createElement('button');
      jeter.type = 'button';
      jeter.className = 'renc-item-jeter';
      jeter.textContent = '🗑️';
      jeter.title = 'Supprimer « ' + (r.titre || 'Sans titre') + ' »';
      jeter.setAttribute('aria-label', jeter.title);
      jeter.addEventListener('click', function (e) {
        e.stopPropagation();
        supprimeRencontre(r);
      });
      li.appendChild(jeter);

      hote.appendChild(li);
    });

    if (vide) {
      vide.hidden = visibles.length > 0;
      // Le message d'absence doit dire POURQUOI la liste est vide. « Aucune
      // rencontre » devant un filtre actif fait croire a une perte de donnees.
      if (!visibles.length) {
        var filtre = q || type || dossierActif !== null;
        vide.innerHTML = '';
        var l1 = document.createElement('span');
        l1.textContent = rencontres.length && filtre
          ? 'Aucune rencontre ne correspond.'
          : 'Aucune rencontre pour l\'instant.';
        vide.appendChild(l1);
        vide.appendChild(document.createElement('br'));
        var l2 = document.createElement('span');
        l2.className = 'renc-vide__aide';
        l2.textContent = rencontres.length && filtre
          ? 'Il y en a ' + rencontres.length + ' en tout — enlève un filtre pour les revoir.'
          : 'Le bouton « + Nouvelle rencontre » en crée une.';
        vide.appendChild(l2);
      }
    }
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

  function montreFiche(quel) {
    if (window.__rencFermeTiroir) window.__rencFermeTiroir();
    poseEcran(quel || 'avant');
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
    dessinePresences();
    pointCourant = -1;
    texteParPoint = null;
    dessineOdj();
    montreFiche(ecranDe(courante));
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
    dessinePresences();
    pointCourant = -1;
    texteParPoint = null;
    dessineOdj();
    annonceTitre();
    montreFiche('avant');
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

  /* ── Compteur de credits ───────────────────────────────────────────────
     « 118 min · 38 traitements IA restants aujourd'hui », en permanence.

     IL NE COUTE AUCUN APPEL DE MODELE. Les deux nombres viennent du devis,
     qui n'est qu'une lecture de compteur — on l'appelle une fois au
     chargement avec `secondes: 0`, puis on rafraichit avec ce que RENDENT les
     reponses de transcription et de traitement. Aucune requete
     supplementaire pendant le travail.

     POURQUOI L'AFFICHER. Un outil gratuit mais plafonne ou le plafond est
     invisible se comporte, pour celui qui l'utilise, comme un outil au cout
     inconnu — et on hesite avant chaque geste. Le montrer coute une pastille
     et supprime la question. */

  var credits = { minutes: null, minutesMax: null, ia: null, iaMax: null };

  function dessineCredits() {
    // Deux hotes, un seul visible : la barre d'outils sur la liste, la barre
    // de retour dans une rencontre. Le compteur ne quitte jamais l'ecran.
    var n = (ecran === 'liste') ? id('rencCredits') : id('rencCredits2');
    var autre = (ecran === 'liste') ? id('rencCredits2') : id('rencCredits');
    if (autre) autre.hidden = true;
    if (!n) return;
    if (credits.minutes === null && credits.ia === null) { n.hidden = true; return; }
    var bouts = [];
    if (credits.minutes !== null) bouts.push(credits.minutes + ' min');
    if (credits.ia !== null) bouts.push(credits.ia + ' compte' + (credits.ia > 1 ? 's' : '') + ' rendu' + (credits.ia > 1 ? 's' : ''));
    n.textContent = bouts.join(' · ') + ' restants aujourd\'hui';
    n.title = 'Ce qu\'il te reste aujourd\'hui : '
      + (credits.minutes !== null ? credits.minutes + ' minutes de micro sur ' + credits.minutesMax : '')
      + (credits.ia !== null ? ', et ' + credits.ia + ' comptes rendus sur ' + credits.iaMax : '')
      + '. Tout repart à neuf demain. C\'est gratuit, et ça le reste.';
    // Deux seuils, pour voir venir la limite au lieu de la heurter.
    var basMin = credits.minutesMax ? credits.minutes <= credits.minutesMax * 0.15 : false;
    var basIA  = credits.iaMax ? credits.ia <= credits.iaMax * 0.15 : false;
    n.classList.toggle('is-vide', credits.minutes === 0 || credits.ia === 0);
    n.classList.toggle('is-bas', !(credits.minutes === 0 || credits.ia === 0) && (basMin || basIA));
    n.hidden = false;
  }

  /**
   * Met a jour ce qu'une reponse du serveur vient de nous apprendre.
   *
   * TROIS ROUTES, TROIS FORMES, ET `plafondJour` NE VEUT PAS DIRE LA MEME
   * CHOSE DANS LES TROIS. C'est le plafond des MINUTES pour le devis et pour
   * un segment, celui des TRAITEMENTS pour /rencontres-ia. On tranche sur le
   * champ qui n'existe que dans l'une :
   *
   *   restantJour     -> reponse de /rencontres-ia   (plafondJour = IA)
   *   iaRestantJour   -> reponse du devis            (plafondJour = minutes)
   *   ni l'un ni l'autre -> reponse d'un segment     (plafondJour = minutes)
   *
   * Une premiere version testait `iaPlafondJour === undefined` pour decider,
   * ce qui rendait le plafond des minutes NULL des que le devis renvoyait les
   * deux compteurs — et l'infobulle affichait « sur null ». Vu au banc.
   */
  function noteCredits(r) {
    if (!r) return;
    var estIA = (typeof r.restantJour === 'number');

    if (estIA) {
      credits.ia = r.restantJour;
      if (typeof r.plafondJour === 'number') credits.iaMax = r.plafondJour;
    } else {
      if (typeof r.minutesRestantes === 'number') credits.minutes = r.minutesRestantes;
      if (typeof r.plafondJour === 'number') credits.minutesMax = r.plafondJour;
      if (typeof r.iaRestantJour === 'number') credits.ia = r.iaRestantJour;
      if (typeof r.iaPlafondJour === 'number') credits.iaMax = r.iaPlafondJour;
    }
    dessineCredits();
  }

  async function litCredits() {
    try {
      noteCredits(await RencData.devisTranscription(0));
    } catch (e) {
      // Un compteur qu'on n'a pas pu lire ne s'invente pas : on n'affiche rien
      // plutot qu'un chiffre faux.
    }
  }

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

    /* LA BANDE EST CE QUI REND LES NOTES UTILISABLES PENDANT L'ENREGISTREMENT.
       Les commandes du panneau micro disparaissent des qu'on passe a l'onglet
       Notes — c'est le principe d'un onglet. La bande, elle, vit HORS des
       onglets : minuteur, pause et arret restent sous la main quel que soit
       l'ecran, et on peut ecrire tout en gardant l'oeil dessus. */
    var bande = id('rencBande');
    if (bande) bande.hidden = (e === 'arret');
    var p2 = id('rencMicPause2');
    if (p2) p2.textContent = p.textContent;
    var rec2 = id('rencRec2');
    if (rec2) rec2.hidden = (e !== 'enregistre');
  }

  /* ── ⏹ TERMINER : UN SEUL GESTE ────────────────────────────────────────
     Entre l'arret et « c'est en surete », il y avait six gestes et trois
     decisions — et quatre facons de tout perdre, dont la pire : appuyer sur
     ⏹, fermer le portable, et decouvrir qu'il ne reste rien parce que l'audio
     ne vivait qu'en memoire.

     Desormais l'usager appuie sur ⏹ et peut fermer. Dans l'ordre :

       1. la rencontre est ECRITE AU SERVEUR tout de suite, avec ses notes,
          AVANT que la transcription ne commence — c'est ce qui met le travail
          de la rencontre en surete independamment de la suite ;
       2. la transcription part seule, sans devis : apres avoir parle une
          heure, il n'y a plus de choix a faire ;
       3. chaque segment transcrit est ecrit a mesure ;
       4. a l'arrivee, les deux boutons de traitement se proposent, sur une
          rencontre deja enregistree.

     L'AUDIO N'EST JAMAIS STOCKE, ni ici ni ailleurs. Quand le quota du jour
     ne suffit pas, il reste en memoire et le bouton de transcription reste
     offert TANT QUE L'ONGLET VIT — pas au-dela. Le faire survivre a la
     fermeture demanderait de l'ecrire quelque part, ce qui contredirait la
     section 14 de politique.html et la section 9 de l'article. On ne casse
     pas une promesse ecrite pour un cas rare : c'est en dette v2. */
  async function termineEnregistrement(blob, info) {
    poseEcran('apres');
    etatMicro('Enregistrement terminé — ' + RencMicro.formate(info.secondes) + '.', 'attente');

    // Le point en cours se ferme sur la duree totale : sans ca son `fin`
    // resterait vide et son audio ne serait rattache a rien.
    var ptsFin = odj();
    if (pointCourant >= 0 && ptsFin[pointCourant] && ptsFin[pointCourant].fin == null) {
      if (ptsFin[pointCourant].debut == null) ptsFin[pointCourant].debut = 0;
      ptsFin[pointCourant].fin = info.secondes;
      dessineOdj();
    }

    // 1 — mettre la rencontre en surete AVANT tout le reste.
    if (!courante) nouvelle(null);
    proposeTitre();
    marqueSale();
    try {
      await sauveServeur(true);
      etatImport('Rencontre enregistrée. On prépare ton texte…');
    } catch (e) {
      etatImport('⚠ La rencontre n\'a pas pu être enregistrée (' + (e.message || e)
        + '). Tes notes restent sur cet appareil.', 'alerte');
    }

    // 2 — enchainer la transcription, sans rien demander.
    id('ongImport').click();
    prepare(blob, 'enregistrement.' + (String(info.mime).indexOf('mp4') >= 0 ? 'm4a' : 'webm'), true);
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
    // Deux phrases, aucune des deux ne s'excuse. Elles disent QUAND le texte
    // arrive, jamais qu'une version serait moins bonne que l'autre.
    mode.textContent = RencMicro.direct
      ? "Tu verras les mots défiler pendant que ça enregistre. La version propre — ponctuée, sans les « euh » — arrive à la fin."
      : "Le texte s'écrit une fois l'enregistrement terminé.";
    var etiq = id('rencMicEtiq');
    if (etiq) {
      etiq.textContent = RencMicro.direct
        ? 'Texte brut — la version propre arrive à la fin'
        : 'Le texte apparaîtra ici à la fin de l\'enregistrement';
    }

    RencMicro.sur('minuteur', function (s) {
      var t = RencMicro.formate(s);
      var c = id('rencChrono');
      if (c) c.textContent = t;
      var c2 = id('rencChrono2');
      if (c2) c2.textContent = t;
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
      // Le temoin de la bande : les derniers mots entendus, et rien de plus.
      // Ce n'est pas le compte rendu, c'est la preuve que ca capte.
      var tout = (fini + ' ' + (provisoire || '')).trim();
      var vu = id('rencBandeVu');
      if (vu) vu.textContent = tout.slice(-140);
      // Et sous le point courant, ou il donne l'impression que « ca se
      // structure en direct » — sans une seule requete.
      dernierBrut = tout.slice(-260);
      var zb = id('rencOdjBrut');
      if (zb) {
        zb.textContent = '';
        var t2 = document.createElement('b');
        t2.textContent = 'Ce qui se dit';
        zb.appendChild(t2);
        zb.appendChild(document.createTextNode(dernierBrut || '…'));
      }
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

    RencMicro.sur('audio', termineEnregistrement);

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
        // On revient aux NOTES des que ca tourne : c'est la qu'on ecrit
        // pendant une rencontre. La bande garde le minuteur et l'arret a
        // portee, et le texte capte continue de s'accumuler dans son panneau.
        poseEcran('pendant');
        var ong = id('ongNotes');
        if (ong) ong.click();
        var z = id('rencNotes');
        if (z) z.focus();
        // Le point de depart : le PREMIER NON COCHE. L'usager peut ensuite
        // cliquer n'importe lequel — une vraie rencontre ne suit jamais
        // l'ordre du jour dans l'ordre.
        var pts = odj();
        if (pts.length) {
          var d0 = 0;
          for (var k = 0; k < pts.length; k++) if (!pts[k].fait) { d0 = k; break; }
          pointCourant = -1;          // pour que rendCourant ne ferme rien
          rendCourant(d0);
        }
      } catch (e) {
        // LE MICRO A ECHOUE, MAIS LA RENCONTRE COMMENCE QUAND MEME. On passe
        // a l'ecran « pendant » avec les notes : prendre des notes a la main
        // reste possible, et c'est exactement ce que quelqu'un fera si le
        // micro est refuse. L'echec du micro n'est pas l'echec de la
        // rencontre.
        poseEcran('pendant');
        var ong2 = id('ongNotes');
        if (ong2) ong2.click();
        var msg = MICRO_ERREURS[e.message] || MICRO_ERREURS.MICRO_ERREUR;
        etatMicro(msg, 'alerte');
        etat(msg + ' Tes notes fonctionnent quand même — écris ici.', 'alerte');
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

    // Les commandes de la bande ne dupliquent pas la logique : elles
    // rejouent le clic des boutons du panneau. Une seule implementation.
    var p2 = id('rencMicPause2');
    if (p2) p2.addEventListener('click', function () { id('rencMicPause').click(); });
    var a2 = id('rencMicArret2');
    if (a2) a2.addEventListener('click', function () { id('rencMicArret').click(); });

    boutonsMicro();
  }

  /* ==================================================================== */
  /* Transcription (vague D)                                              */
  /* ==================================================================== */

  var enCours = false;          // une transcription tourne : on n'en lance pas deux
  var aTranscrire = null;       // { segments, secondes, nom }

  function duree(s) {
    // « 0 minute » pour un enregistrement de vingt secondes : vu au banc, et
    // ca fait douter de la lecture du fichier au moment precis ou l'usager
    // decide s'il lance. On nomme le cas court au lieu d'arrondir a zero.
    if (s < 45) return 'moins d\'une minute';
    var m = Math.round(s / 60) || 1;
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
  /**
   * @param {boolean} auto  parcours du micro : rien a decider, tout s'enchaine
   */
  async function prepare(source, nom, auto) {
    if (enCours) { etatImport('On est déjà en train d\'écrire ton texte.', 'attente'); return; }
    if (nom && !RencAudio.formatAccepte(nom)) {
      etatImport('Format non reconnu. Accepte : mp3, m4a, wav, mp4, webm.', 'alerte');
      return;
    }
    if (!RencData.enLigne()) {
      etatImport('Écrire ton texte demande Internet. Tes notes, elles, continuent de fonctionner.', 'attente');
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
    /* LES BORNES DE L'ORDRE DU JOUR REMPLACENT LES TRANCHES DE CINQ MINUTES —
       elles ne s'y ajoutent pas. Meme quantite d'audio envoyee a Whisper,
       coupee ailleurs : c'est ce qui rend ce mode gratuit en jetons.

       Elles ne servent que dans le parcours automatique : un fichier importe
       n'a pas d'horodatage a lui. Un point sans `debut` n'a jamais ete
       courant — il n'a pas d'audio, et il sera dit « non aborde ». */
    var bornes = null;
    if (auto) {
      var avecAudio = odj().filter(function (p) { return p.debut != null; });
      if (avecAudio.length) {
        bornes = odj().map(function (p) { return { debut: p.debut, fin: p.fin }; });
      }
    }
    var segments;
    try {
      segments = RencAudio.segmente(buffer, bornes);
    } catch (e) {
      etatImport('On n\'a pas réussi à lire ce fichier — il est peut-être trop long pour cet appareil.', 'alerte');
      return;
    }
    // Le buffer decode pese jusqu'a 115 Mo : on lache la reference des que les
    // segments sont faits, sinon il reste en memoire toute la transcription.
    buffer = null;

    var devis;
    try {
      devis = await RencData.devisTranscription(Math.round(secondes));
      noteCredits(devis);
    } catch (e) {
      etatImport('Ça n\'a pas répondu. Réessaie dans un moment. (' + (e.message || e) + ')', 'alerte');
      return;
    }

    aTranscrire = { segments: segments, secondes: secondes, nom: nom || 'enregistrement' };
    etatImport('');

    /* ── PARCOURS AUTOMATIQUE ────────────────────────────────────────────
       Apres un enregistrement au micro, l'usager n'a plus de choix a faire :
       il vient de parler une heure, l'audio est la, le transcrire est la
       seule suite qui a du sens. On ne lui montre donc PAS le devis — c'est
       une decision qui n'existe plus — et tout s'enchaine.

       Le devis reste affiche avant un IMPORT de fichier : la, il choisit
       encore, et il a le droit de savoir avant. */
    if (auto) {
      id('rencDevis').hidden = true;
      if (devis.suffisant) { await lance(true); return; }
      // Quota epuise : on n'abandonne rien. La rencontre est deja enregistree
      // (voir termineEnregistrement), les notes sont en surete, et le bouton
      // reste offert tant que l'onglet vit.
      id('rencTranscrire').hidden = false;
      etatImport('Il te reste ' + devis.minutesRestantes + ' minute'
        + (devis.minutesRestantes > 1 ? 's' : '') + ' aujourd\'hui, et cet enregistrement en demande '
        + devis.minutesDemandees + '. Ta rencontre et tes notes sont enregistrées. '
        + 'Laisse cette page ouverte et demande-le quand tu veux — '
        + 'ou réenregistre demain, le compteur repart.', 'attente');
      return;
    }

    id('rencDevisDuree').textContent = 'Enregistrement de ' + duree(secondes) + '.';
    id('rencDevisQuota').textContent = 'Ça prend ' + devis.minutesDemandees
      + ' de tes ' + devis.minutesRestantes + ' minutes gratuites d\'aujourd\'hui.';

    var avert = id('rencDevisAvert');
    if (devis.longue) {
      avert.hidden = false;
      avert.textContent = '⚠ Plus de 90 minutes. Ça va prendre un bon moment, et ça utilise '
        + 'une bonne part de tes minutes gratuites du jour. Garde cette page ouverte.';
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
  /** @param {boolean} auto  vrai quand l'enchainement vient du micro */
  async function lance(auto) {
    if (!aTranscrire || enCours) return;
    enCours = true;
    id('rencDevis').hidden = true;
    id('rencTranscrire').hidden = true;
    id('rencAvance').hidden = false;
    if (!courante) nouvelle(null);

    var segments = aTranscrire.segments;
    var morceaux = [];
    var faits = 0;
    // Le texte de chaque point, dans l'ordre des points. `-1` = mode libre.
    var parPoint = {};

    function avance(texte) {
      id('rencJauge').style.width = Math.round((faits / segments.length) * 100) + '%';
      // « Tu peux fermer » n'est dit que si c'est VRAI — donc seulement dans
      // le parcours automatique, ou chaque segment est ecrit au serveur des
      // qu'il arrive.
      id('rencAvanceTexte').textContent = texte
        + (auto ? ' Tu peux fermer, on garde tout ce qui est déjà écrit.' : '');
    }
    avance('On écrit ton texte… 1 morceau sur ' + segments.length + '.');

    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      try {
        var rep = await RencData.transcrisSegment(seg.wav, seg.secondes, seg.index, lang());
        noteCredits(rep);
        morceaux.push(rep.texte || '');
        // Chaque morceau sait a quel point de l'ordre du jour il appartient :
        // c'est ce rang qui etiquettera le texte avant l'unique passage IA.
        if (seg.point >= 0) {
          parPoint[seg.point] = ((parPoint[seg.point] || '') + ' ' + (rep.texte || '')).trim();
        }
        // Le texte s'ecrit au fur et a mesure : sur une rencontre d'une heure,
        // attendre douze segments sans rien voir donne l'impression d'un
        // plantage.
        appliqueTranscription(morceaux.join(' ').replace(/\s+/g, ' ').trim());
        faits++;
        // CHAQUE SEGMENT EST ECRIT AU SERVEUR DES QU'IL ARRIVE. C'est ce qui
        // rend vraie la phrase « tu peux fermer » : partir a mi-chemin ne
        // perd que ce qui restait a transcrire, jamais ce qui l'est deja.
        if (auto) { try { await sauveServeur(true); } catch (e) {} }
        avance(faits < segments.length
          ? 'On écrit ton texte… ' + (faits + 1) + ' morceaux sur ' + segments.length + '.'
          : 'Presque fini…');
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
    // Le texte range par point, garde pour le passage structure.
    texteParPoint = Object.keys(parPoint).length ? parPoint : null;
    await sauveServeur(true);
    etatImport('');
    poseEcran('apres');
    if (id('rencFiniTitre')) id('rencFiniTitre').textContent = 'C\'est écrit, et c\'est enregistré.';
    if (id('rencFiniSous')) {
      id('rencFiniSous').textContent = auto
        ? 'Rien ne se perdra plus — tu peux fermer. Le texte est dans « Original ».'
        : 'Le texte est dans « Original ».';
    }
    // Les deux boutons de traitement se signalent, une fois, sur une
    // rencontre deja en surete. C'est le seul moment ou un choix a du sens.
    ['rencVerbatim', 'rencStructure'].forEach(function (c) {
      var n = id(c);
      if (!n) return;
      n.classList.add('is-propose');
      setTimeout(function () { n.classList.remove('is-propose'); }, 6000);
    });
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

    id('rencLancer').addEventListener('click', function () { lance(false); });
    var tr = id('rencTranscrire');
    if (tr) tr.addEventListener('click', function () { lance(true); });
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
  var texteParPoint = null;   // { rang: texte } quand un ordre du jour a servi

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

  /** La date de la rencontre ouverte — elle ancre les echeances relatives. */
  function dateRencontre() {
    return (id('rencDate') || {}).value || '';
  }

  /**
   * Le titre qu'on PROPOSE quand l'usager n'en a pas mis.
   *
   * « Sans titre » est un aveu d'echec affiche dans la liste : trois
   * rencontres « Sans titre » ne se distinguent plus, et il faut les ouvrir
   * une par une pour savoir laquelle jeter. « Rencontre du 25 août » est
   * toujours plus parlant, et ca ne coute rien a produire.
   *
   * L'annee n'est ecrite que si elle n'est pas l'annee courante : « Rencontre
   * du 25 août » se lit mieux que « Rencontre du 25 août 2026 », et le jour
   * ou ca compte — une vieille rencontre — l'annee reapparait d'elle-meme.
   */
  function titreParDefaut(iso) {
    var d = iso ? new Date(iso + 'T12:00:00') : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var opts = { day: 'numeric', month: 'long' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    var quand;
    try { quand = d.toLocaleDateString(lang() === 'en' ? 'en-CA' : 'fr-CA', opts); }
    catch (e) { quand = iso || ''; }
    return (lang() === 'en' ? 'Meeting of ' : 'Rencontre du ') + quand;
  }

  /** Remplit le champ titre s'il est vide. On le POSE dans le champ plutot
      que de l'inventer au moment d'ecrire : l'usager voit ce qui sera
      enregistre, et peut encore le changer. */
  function proposeTitre() {
    var t = id('rencTitre');
    if (!t || t.value.trim()) return false;
    t.value = titreParDefaut((id('rencDate') || {}).value);
    return true;
  }

  /** Le meme titre, mais en gris dans le champ vide : l'usager VOIT d'avance
      ce qui sera inscrit s'il n'ecrit rien, au lieu de le decouvrir apres. */
  function annonceTitre() {
    var t = id('rencTitre');
    if (t) t.placeholder = titreParDefaut((id('rencDate') || {}).value);
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

  /** Une liste d'actions en cases a cocher, numerotees pour « Mes actions ». */
  function rendActions(liste, depart) {
    return liste.map(function (a, i) {
      var qui = a.qui ? ' <b>— ' + echappe(a.qui) + '</b>' : '';
      var ech = a.echeance ? ' <b>(' + echappe(a.echeance) + ')</b>' : '';
      return '<div><input type="checkbox" data-a="' + (depart + i) + '"'
        + (a.fait ? ' checked' : '') + '> ' + echappe(a.quoi) + qui + ech + '</div>';
    }).join('');
  }

  /** Le compte rendu structure, rendu en HTML — celui que l'usager editera. */
  function rendStructure(s) {
    var h = [];
    if (s.resume) h.push('<h2>Résumé</h2><p>' + echappe(s.resume).replace(/\n+/g, '<br>') + '</p>');

    /* AVEC UN ORDRE DU JOUR, LE COMPTE RENDU SUIT LES POINTS. Un point sans
       parole enregistree est dit « non abordé » plutot qu'omis : c'est
       l'information la plus utile du document pour qui prepare la rencontre
       suivante. */
    if (Array.isArray(s.sections) && s.sections.length) {
      var rang = 0;
      s.sections.forEach(function (sec, i) {
        h.push('<h2>' + (i + 1) + ' · ' + echappe(sec.titre || 'Point ' + (i + 1)) + '</h2>');
        if (!sec.aborde) {
          h.push('<p><b>Non abordé.</b></p>');
          return;
        }
        if (sec.discussion) h.push('<p>' + echappe(sec.discussion).replace(/\n+/g, '<br>') + '</p>');
        if (sec.decisions && sec.decisions.length) {
          h.push('<h3>Décisions</h3><ul>' + sec.decisions.map(function (d) {
            return '<li>' + echappe(d) + '</li>'; }).join('') + '</ul>');
        }
        if (sec.actions && sec.actions.length) {
          h.push('<h3>Actions à faire</h3>' + rendActions(sec.actions, rang));
          rang += sec.actions.length;
        }
      });
      if (s.reportes && s.reportes.length) {
        h.push('<h2>Points reportés à la prochaine rencontre</h2><ul>'
          + s.reportes.map(function (x) { return '<li>' + echappe(x) + '</li>'; }).join('') + '</ul>');
      }
      return h.join('');
    }

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
      h.push(rendActions(s.actions, 0));
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
        var r = await RencData.traiteIA('verbatim', parts[i], modeleChoisi(), lang(), dateRencontre());
        noteCredits(r);
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

  /**
   * LE TEXTE ETIQUETE PAR POINT. C'est tout ce que le mode « ordre du jour »
   * change a l'appel : le meme passage structure, le meme et unique appel,
   * mais l'entree porte des reperes que le modele n'a plus a deviner.
   */
  function sourceEtiquetee() {
    var pts = odj();
    if (!pts.length || !texteParPoint) return null;
    var bouts = [];
    pts.forEach(function (p, i) {
      var t = (texteParPoint[i] || '').trim();
      bouts.push('=== POINT ' + (i + 1) + ' : ' + p.texte + ' ===\n'
        + (t || '(aucune parole enregistrée sur ce point)'));
    });
    return bouts.join('\n\n');
  }

  async function faisStructure() {
    if (iaEnCours || !courante) return;
    var pts = odj();
    var etiquete = sourceEtiquetee();
    var source = etiquete || texteSource();
    if (!source) { etat('Il n\'y a encore rien à résumer.', 'attente'); return; }
    iaOccupee(true, etiquete
      ? 'Compte rendu en préparation, point par point…'
      : 'Compte rendu en préparation…');
    try {
      var r = await RencData.traiteIA('structure', source, modeleChoisi(), lang(),
        dateRencontre(), etiquete ? pts.map(function (p) { return p.texte; }) : null);
      noteCredits(r);
      var sortie = r.sortie || {};
      // Avec des sections, les actions de tous les points sont rassemblees :
      // c'est `actions[]` que la vue « Mes actions » relit.
      var toutes = [];
      if (Array.isArray(sortie.sections)) {
        sortie.sections.forEach(function (sec) {
          (sec.actions || []).forEach(function (a) { toutes.push(a); });
        });
      }
      courante.actions = toutes.length ? toutes : (sortie.actions || []);
      appliqueSortie(rendStructure(sortie), 'structure');
      var nonAbordes = Array.isArray(sortie.sections)
        ? sortie.sections.filter(function (x) { return !x.aborde; }).length : 0;
      iaOccupee(false, 'Compte rendu prêt — '
        + courante.actions.length + ' action' + (courante.actions.length > 1 ? 's' : '') + ' à faire'
        + (nonAbordes ? ', ' + nonAbordes + ' point' + (nonAbordes > 1 ? 's' : '')
            + ' non abordé' + (nonAbordes > 1 ? 's' : '') : '')
        + '. Tout reste modifiable.');
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
      var r = await RencData.traiteIA('passage', sel, modeleChoisi(), lang(), dateRencontre());
      noteCredits(r);
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

  /**
   * Supprimer une rencontre. UNE SEULE FONCTION pour les trois portes — la
   * corbeille de la liste, le bouton de la fiche, l'entree du menu ⋯ — parce
   * qu'une suppression qui se comporte differemment selon l'endroit d'ou on
   * l'a lancee est une suppression a laquelle on ne fait plus confiance.
   *
   * @param {Object} [r] la rencontre a supprimer ; par defaut, celle ouverte
   */
  async function supprimeRencontre(r) {
    var cible = r || courante;
    if (!cible || !cible.id) { etat('Rien à supprimer.', 'attente'); return; }

    // La question de Joey, mot pour mot, avec le titre pour qu'on sache
    // laquelle on jette.
    if (!window.confirm('Supprimer « ' + (cible.titre || 'Sans titre')
      + ' » ?\n\nElle sera effacée définitivement.')) return;

    try {
      await RencData.supprimerRencontre(cible.id);
      if (courante && courante.id === cible.id) {
        courante = null;
        marquePropre();
        poseEcran('liste');
      }
      await rafraichitListe();
      etat('« ' + (cible.titre || 'Sans titre') + ' » supprimée.');
    } catch (e) {
      etat('⚠ La suppression a échoué (' + (e.message || e) + ').', 'alerte');
    }
  }

  /* ==================================================================== */
  /* Sortie : courriel, copie, PDF, exports (vague G)                     */
  /* ==================================================================== */

  var CLE_DESTINATAIRES = 'zts_renc_destinataires';

  var LIBELLE_TYPE_LONG = {
    comite: 'Comité', statutaire: 'Rencontre statutaire', autre: 'Rencontre'
  };

  /**
   * Convertit le compte rendu en TEXTE. Ce n'est pas cosmetique : c'est ce qui
   * part par courriel, ce qui atterrit dans le presse-papiers et ce qui
   * s'exporte. Un `innerText` brut perdrait les puces et les cases a cocher —
   * or « fait » ou « pas fait » est justement l'information.
   *
   * @param {'txt'|'md'} format
   */
  function htmlVersTexte(html, format) {
    var bac = document.implementation.createHTMLDocument('').body;
    bac.innerHTML = assainit(html || '');
    var out = [];

    function marche(n, dansListe, rang) {
      var i;
      for (i = 0; i < n.childNodes.length; i++) {
        var e = n.childNodes[i];
        if (e.nodeType === 3) {
          var t = e.textContent.replace(/\s+/g, ' ');
          if (t.trim()) { out.push(t); continue; }
          // UN NOEUD DE TEXTE FAIT D'ESPACES N'EST PAS DU VIDE. Entre
          // « </b> <b> », c'est la seule chose qui separe deux mots — le jeter
          // collait « Marie-Eve(2026-09-08) ». On le reduit a une espace, et
          // seulement si ce qui precede n'en a pas deja une.
          if (out.length && !/\s$/.test(out[out.length - 1])) out.push(' ');
          continue;
        }
        if (e.nodeType !== 1) continue;
        var tag = e.tagName;

        if (tag === 'INPUT' && e.getAttribute('type') === 'checkbox') {
          // En Markdown, une case a cocher n'est reconnue que dans une PUCE :
          // `[x]` tout seul s'affiche tel quel, `- [x]` devient une vraie case
          // dans GitHub, Obsidian, Notion et les autres.
          var coche = e.hasAttribute('checked') || e.checked;
          out.push((format === 'md' ? '- ' : '') + (coche ? '[x] ' : '[ ] '));
          continue;
        }
        if (tag === 'BR') { out.push('\n'); continue; }
        if (/^H[1-3]$/.test(tag)) {
          var niveau = Number(tag.slice(1));
          out.push('\n\n');
          // Le titre du document prend `#` : les sections commencent donc a
          // `##`, sinon la hierarchie du fichier est fausse des la premiere.
          if (format === 'md') out.push('#'.repeat(niveau) + ' ');
          marche(e, false, 0);
          // En .txt, un titre se souligne : c'est ce qui le distingue quand il
          // n'y a pas de mise en forme du tout.
          if (format !== 'md') {
            var texteTitre = out[out.length - 1] || '';
            out.push('\n' + '-'.repeat(Math.min(60, String(texteTitre).trim().length)));
          }
          out.push('\n');
          continue;
        }
        if (tag === 'UL' || tag === 'OL') {
          out.push('\n');
          var num = 1;
          for (var j = 0; j < e.children.length; j++) {
            if (e.children[j].tagName !== 'LI') continue;
            out.push(tag === 'OL' ? (num++) + '. ' : '- ');
            marche(e.children[j], true, 0);
            out.push('\n');
          }
          continue;
        }
        if (tag === 'P' || tag === 'DIV') {
          out.push('\n');
          marche(e, dansListe, rang);
          out.push('\n');
          continue;
        }
        if ((tag === 'B' || tag === 'STRONG') && format === 'md') {
          out.push('**'); marche(e, dansListe, rang); out.push('**');
          continue;
        }
        marche(e, dansListe, rang);
      }
    }
    marche(bac, false, 0);
    return out.join('')
      // Les espaces doubles viennent des marqueurs de case a cocher suivis
      // d'un noeud de texte qui commence lui-meme par une espace. On les
      // reduit APRES coup plutot que de compliquer la marche.
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /** L'en-tete du compte rendu, en texte. */
  function enteteTexte(format) {
    var r = lisFormulaire();
    var l = [];
    var titre = (r.titre || 'Compte rendu').trim();
    if (format === 'md') l.push('# ' + titre);
    else l.push(titre.toUpperCase(), '='.repeat(Math.min(60, titre.length)));
    l.push('');
    l.push((LIBELLE_TYPE_LONG[r.type] || 'Rencontre') + ' — ' + (r.date || ''));
    var d = dossiers.filter(function (x) { return x.id === r.dossier; })[0];
    if (d) l.push('Dossier : ' + nomDossier(d));
    if (r.animateur) l.push('Animateur : ' + r.animateur);
    if (r.secretaire) l.push('Secrétaire : ' + r.secretaire);
    var p = String(r.participants || '').trim();
    if (p) l.push('Participants : ' + p);
    return l.join('\n');
  }

  /** Le compte rendu complet, pret a partir. */
  function rendu(format) {
    var corps = htmlVersTexte((id('rencSortie') || {}).innerHTML, format);
    if (!corps) corps = htmlVersTexte((id('rencNotes') || {}).innerHTML, format);
    return enteteTexte(format) + '\n\n' + corps + '\n';
  }

  function sujetCourriel() {
    var r = lisFormulaire();
    return (r.titre || 'Compte rendu') + ' — ' + (r.date || '');
  }

  async function copie(texte) {
    try {
      await navigator.clipboard.writeText(texte);
      return true;
    } catch (e) {
      // Le presse-papiers est refuse hors d'un geste de l'usager, et sur
      // certains navigateurs sans HTTPS. On retombe sur la vieille methode
      // plutot que d'echouer : c'est le bouton le plus utile de la barre.
      try {
        var z = document.createElement('textarea');
        z.value = texte;
        z.setAttribute('readonly', '');
        z.style.position = 'fixed';
        z.style.top = '-1000px';
        document.body.appendChild(z);
        z.select();
        var ok = document.execCommand('copy');
        z.remove();
        return ok;
      } catch (e2) { return false; }
    }
  }

  function telecharge(nom, texte, type) {
    var b = new Blob([texte], { type: type + ';charset=utf-8' });
    var u = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = u;
    a.download = nom;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // On libere l'URL, mais pas tout de suite : Safari annule le
    // telechargement si l'objet disparait avant qu'il ait commence.
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }

  function nomFichier(ext) {
    var r = lisFormulaire();
    var base = (r.titre || 'compte-rendu')
      .toLowerCase()
      .normalize ? (r.titre || 'compte-rendu').toLowerCase().normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') : (r.titre || 'compte-rendu').toLowerCase();
    base = base.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'compte-rendu';
    return base + '-' + (r.date || '') + '.' + ext;
  }

  /* ── Courriel ──────────────────────────────────────────────────────────
     `mailto:` tronque : la limite pratique tourne autour de 2 000 caracteres,
     moins sur Outlook, et un compte rendu structure les depasse presque
     toujours. On n'essaie donc PAS de faire passer le corps entier : le
     courriel porte l'en-tete et une phrase, le compte rendu complet va dans le
     presse-papiers, et l'interface le DIT. C'est le §7 du cahier. */
  async function envoieCourriel() {
    if (!courante) return;
    var memoire = '';
    try { memoire = localStorage.getItem(CLE_DESTINATAIRES) || ''; } catch (e) {}
    var dest = window.prompt(
      'À qui envoyer ce compte rendu ?\n(adresses séparées par des virgules)', memoire);
    if (dest === null) return;
    dest = dest.trim();
    try { if (dest) localStorage.setItem(CLE_DESTINATAIRES, dest); } catch (e) {}

    var complet = rendu('txt');
    var colle = await copie(complet);

    var corps = enteteTexte('txt') + '\n\n'
      + (colle
          ? 'Le compte rendu complet est dans ton presse-papiers : colle-le ici (Ctrl+V ou Cmd+V).'
          : 'Le compte rendu complet suit — copie-le depuis l\'application.')
      + '\n';

    var url = 'mailto:' + encodeURIComponent(dest)
      + '?subject=' + encodeURIComponent(sujetCourriel())
      + '&body=' + encodeURIComponent(corps);
    window.location.href = url;

    etat(colle
      ? 'Courriel ouvert. Le compte rendu complet est dans le presse-papiers — colle-le dans le message.'
      : '⚠ Le presse-papiers a été refusé. Utilise « Copier le compte rendu », puis colle dans le courriel.',
      colle ? 'attente' : 'alerte');
  }

  function cableSortie() {
    var e = id('rencEnvoyer');
    if (e) e.addEventListener('click', envoieCourriel);

    var c = id('rencCopier');
    if (c) c.addEventListener('click', async function () {
      var ok = await copie(rendu('txt'));
      etat(ok ? 'Compte rendu copié — colle-le où tu veux.'
              : '⚠ La copie a été refusée par le navigateur.', ok ? '' : 'alerte');
    });

    var p = id('rencPdf');
    if (p) p.addEventListener('click', function () {
      // Le bloc @media print de styles.css rend la main au contenu : sans lui
      // les 41 apps migrees impriment une page blanche.
      window.print();
    });

    var t = id('rencTxt');
    if (t) t.addEventListener('click', function () {
      telecharge(nomFichier('txt'), rendu('txt'), 'text/plain');
      etat('Fichier .txt téléchargé.');
    });

    var m = id('rencMd');
    if (m) m.addEventListener('click', function () {
      telecharge(nomFichier('md'), rendu('md'), 'text/markdown');
      etat('Fichier .md téléchargé.');
    });

    var s = id('rencPartage');
    if (s) s.addEventListener('click', async function () {
      if (typeof navigator.share !== 'function') return;
      try {
        await navigator.share({ title: sujetCourriel(), text: rendu('txt') });
        etat('Partagé.');
      } catch (err) {
        // L'usager qui ferme la feuille de partage declenche une erreur
        // « AbortError ». Ce n'est pas une panne, c'est un renoncement.
        if (err && err.name !== 'AbortError') {
          etat('⚠ Le partage a échoué (' + (err.message || err) + ').', 'alerte');
        }
      }
    });
  }

  /* ==================================================================== */
  /* LES TROIS MOMENTS                                                    */
  /* ==================================================================== */

  /* UNE SEULE REGLE : l'ecran ne montre que ce qui sert MAINTENANT.
     ────────────────────────────────────────────────────────────────────
     Ce qui ne sert pas n'est ni grise ni rapetisse — il est ABSENT, range
     derriere un geste. L'app savait deja tout faire ; elle montrait tout en
     meme temps, et c'est ca qui la rendait difficile.

     AUCUNE FONCTION N'EST RETIREE. Les dossiers, la recherche, les gabarits,
     les presences, les exports, l'ordre du jour : tout existe encore. Ce
     module ne fait que decider QUAND chaque chose parait. La preuve : il ne
     contient pas une ligne de logique metier.

       liste    l'accueil de l'app — dossiers, recherche, liste
       avant    preparer — les champs, l'ordre du jour, UN bouton
       pendant  capturer — le minuteur, l'arret, les notes, les points
       apres    finaliser — le compte rendu, deux boutons, les envois
       actions  la vue transversale « Mes actions » */

  var ecran = 'liste';

  function poseEcran(nom) {
    ecran = nom;
    var w = id('rencWrap');
    if (w) w.setAttribute('data-ecran', nom);

    var dansRencontre = (nom !== 'liste');
    var retour = id('rencRetour');
    if (retour) retour.hidden = !dansRencontre;

    // Le rappel de OU on est. En pleine rencontre, le titre suffit ; sur
    // « Mes actions », c'est le nom de la vue.
    var ou = id('rencRetourOu');
    if (ou) {
      ou.textContent = nom === 'actions' ? 'MES ACTIONS'
        : (dansRencontre ? ((id('rencTitre') || {}).value || 'Rencontre').toUpperCase() : '');
    }

    if (id('rencAccueil'))    id('rencAccueil').hidden    = dansRencontre || rencontres.length > 0;
    if (id('rencFiche'))      id('rencFiche').hidden      = (nom !== 'avant' && nom !== 'pendant' && nom !== 'apres');
    if (id('rencActionsVue')) id('rencActionsVue').hidden = (nom !== 'actions');
    if (id('rencPied'))       id('rencPied').hidden       = (nom !== 'apres');
    if (id('rencFini'))       id('rencFini').hidden       = (nom !== 'apres');
    if (id('rencResume'))     id('rencResume').hidden     = (nom !== 'apres');

    // L'en-tete se replie a chaque arrivee sur APRES : on y vient pour lire
    // le compte rendu, pas pour relire les champs.
    if (w) w.classList.remove('entete-ouverte');
    if (nom === 'apres') dessineResume();

    // Le compteur de credits suit l'ecran : dans la barre d'outils sur la
    // liste, dans la barre de retour ailleurs. Un seul des deux est visible.
    dessineCredits();
    if (window.scrollTo) window.scrollTo(0, 0);
  }

  /** Le resume d'une ligne de l'ecran APRES. */
  function dessineResume() {
    var n = id('rencResumeTexte');
    if (!n) return;
    var r = lisFormulaire();
    var d = dossiers.filter(function (x) { return x.id === r.dossier; })[0];
    // La date en clair : « 25 août 2026 », pas « 2026-08-25 ». L'ISO trie et
    // se stocke ; il ne se lit pas.
    var quand = r.date;
    try {
      var dd = new Date(r.date + 'T12:00:00');
      if (!isNaN(dd.getTime())) {
        quand = dd.toLocaleDateString(lang() === 'en' ? 'en-CA' : 'fr-CA',
          { day: 'numeric', month: 'long', year: 'numeric' });
      }
    } catch (e) {}
    var bouts = [r.titre || 'Sans titre', quand || ''];
    if (LIBELLE_TYPE[r.type]) bouts.push(LIBELLE_TYPE[r.type]);
    if (d) bouts.push(nomDossier(d));
    var p = String(r.participants || '').trim();
    if (p) bouts.push(p.split(',').length + ' participants');
    n.textContent = bouts.filter(Boolean).join('  ·  ');
  }

  /** Ou en est cette rencontre ? Une rencontre qui a du contenu s'ouvre a la
      fin ; une rencontre vide s'ouvre au debut. */
  function ecranDe(r) {
    if (!r) return 'avant';
    var aDuTexte = (r.transcription && r.transcription.trim())
      || (r.sortieIA && r.sortieIA.trim())
      || (r.notesBrutes && r.notesBrutes.replace(/<[^>]*>/g, '').trim());
    return aDuTexte ? 'apres' : 'avant';
  }

  /**
   * Le seul chemin hors d'une rencontre — et il doit marcher de PARTOUT.
   *
   * Si le micro tourne, on ne part pas en douce : partir sans rien dire
   * laisserait un enregistrement orphelin qui continue de tourner pendant
   * qu'on regarde autre chose, et dont le texte n'irait nulle part. On
   * demande, et si c'est oui on ARRETE pour de bon — ce qui declenche le
   * meme chemin que le bouton « Terminer la rencontre », donc l'ecriture.
   */
  function retourListe() {
    if (typeof RencMicro !== 'undefined' && RencMicro.etat() !== 'arret') {
      if (!window.confirm('L\'enregistrement est en cours.\n\nL\'arrêter et enregistrer ?')) return;
      var stop = id('rencMicArret');
      if (stop) stop.click();
    }
    if (sale) sauveServeur(true);
    poseEcran('liste');
    dessineListe();
  }

  /**
   * Le decalage de la barre collante.
   *
   * Le chrome du shell (barre de navigation + banniere) est en
   * `position:fixed` et sa hauteur change avec la largeur de l'ecran. Une
   * barre `sticky top:0` se glisserait dessous et disparaitrait — le defaut
   * qu'on repare. On mesure donc ce qui occupe REELLEMENT le haut, et on le
   * pose dans `--renc-collant`.
   *
   * Sont ecartes : le decor (rayons, trame) qui est plus large que l'ecran et
   * ne bloque pas les clics, et tout ce qui n'est pas ancre en haut.
   */
  function poseCollant() {
    var w = id('rencWrap');
    if (!w) return;
    var bas = 0;
    var tous = document.body.querySelectorAll('*');
    for (var i = 0; i < tous.length; i++) {
      var n = tous[i], c = window.getComputedStyle(n);
      if (c.position !== 'fixed') continue;
      if (c.pointerEvents === 'none' || c.visibility === 'hidden') continue;
      var r = n.getBoundingClientRect();
      if (r.height < 8) continue;
      // Une barre de chrome est une BANDE. Un element qui couvre la moitie de
      // l'ecran est un voile, un tiroir ou une fenetre — pas du chrome, et le
      // prendre pour tel collait la barre de retour hors de l'ecran.
      if (r.height > window.innerHeight * 0.5) continue;
      if (r.width < window.innerWidth * 0.5) continue;   // pas une barre
      if (r.width > window.innerWidth * 1.05) continue;  // le decor
      // Ancre dans le HAUT de l'ecran. Le seuil est genereux a dessein : la
      // banniere du shell commence a 85px, pas a 0 — un seuil serre la
      // laissait passer et la barre se serait collee DESSOUS, invisible.
      if (r.top > window.innerHeight * 0.4) continue;
      // Le casier d'outils est en bas : il n'occupe pas le haut.
      if (r.top > 0 && r.bottom > window.innerHeight * 0.75) continue;
      if (r.bottom > bas) bas = r.bottom;
    }
    w.style.setProperty('--renc-collant', Math.round(bas) + 'px');
  }

  function cableEcrans() {
    var b = id('rencRetourBt');
    if (b) b.addEventListener('click', retourListe);

    var go = id('rencCommencer');
    if (go) go.addEventListener('click', function () { id('rencMicDemarrer').click(); });

    var imp = id('rencOuvrirImport');
    if (imp) imp.addEventListener('click', function () {
      // L'import n'a pas de « pendant » : le fichier est deja enregistre.
      poseEcran('apres');
      id('ongImport').click();
      id('rencDepot').scrollIntoView({ block: 'center' });
    });

    var mod = id('rencModifierEntete');
    if (mod) mod.addEventListener('click', function () {
      var w = id('rencWrap');
      if (w) w.classList.add('entete-ouverte');
      var t = id('rencTitre');
      if (t) t.focus();
    });

    var vo = id('rencVoirOriginal');
    if (vo) vo.addEventListener('click', function () { id('ongBrut').click(); });

    // Le pied reprend les commandes du menu ⋯, sans les dupliquer : il rejoue
    // le clic de l'original. Une seule implementation, un seul endroit ou se
    // tromper.
    [['rencEnvoyer2', 'rencEnvoyer'], ['rencCopier2', 'rencCopier'], ['rencPdf2', 'rencPdf'],
     ['rencTxt2', 'rencTxt'], ['rencMd2', 'rencMd'], ['rencPartage2', 'rencPartage'],
     ['rencSuite2', 'rencSuite'], ['rencGabarit2', 'rencGabarit'], ['rencSupprimer2', 'rencSupprimer']
    ].forEach(function (paire) {
      var n = id(paire[0]), src = id(paire[1]);
      if (n && src) n.addEventListener('click', function () { src.click(); });
    });
    var part = id('rencPartage2');
    if (part && typeof navigator.share === 'function') part.hidden = false;

    // Le menu ⋯ du pied, meme comportement que celui de la barre d'outils.
    var bt2 = id('rencMenu2'), liste2 = id('rencMenuListe2');
    if (bt2 && liste2) {
      function pose(ouvert) {
        liste2.hidden = !ouvert;
        bt2.setAttribute('aria-expanded', ouvert ? 'true' : 'false');
      }
      bt2.addEventListener('click', function (e) { e.stopPropagation(); pose(liste2.hidden); });
      liste2.addEventListener('click', function (e) { e.stopPropagation(); });
      document.addEventListener('click', function () { pose(false); });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !liste2.hidden) { pose(false); bt2.focus(); }
      });
    }
  }

  /* ==================================================================== */
  /* Ordre du jour guide                                                  */
  /* ==================================================================== */

  /* CE QUE CE MODE AJOUTE, ET CE QU'IL NE COUTE PAS.
     ────────────────────────────────────────────────────────────────────
     L'usager donne ses points, les coche a mesure, et l'app note l'INSTANT
     de chaque bascule — en secondes depuis le debut de l'enregistrement, pas
     en heure d'horloge : c'est la position dans le fichier audio.

     A l'arret, le decoupage se fait sur ces instants AU LIEU des tranches de
     cinq minutes. Meme quantite d'audio envoyee a Whisper, coupee ailleurs.
     Et l'unique passage structure recoit le texte deja etiquete par point.
     ZERO appel ajoute — c'est la contrainte du chantier, et elle tient parce
     que le decoupage REMPLACE l'ancien au lieu de s'y ajouter.

     Le mode libre reste le defaut : sans ordre du jour, tout se comporte
     exactement comme avant. */

  var pointCourant = -1;   // rang du point en cours, -1 = aucun

  function odj() {
    return (courante && Array.isArray(courante.ordreDuJour)) ? courante.ordreDuJour : [];
  }

  /** Secondes ecoulees d'enregistrement, ou null si le micro ne tourne pas. */
  function instant() {
    /* ⚠ PAS `window.RencMicro`. RencMicro est declare `const` au premier
       niveau de son fichier : un `const` de premier niveau N'EST PAS une
       propriete de window — seul `var` l'est. `window.RencMicro` vaut donc
       toujours undefined, et le garde retournait null a chaque appel : aucun
       horodatage n'etait pose, et le message disait « reglé » sans heure.
       Constate au banc du 25 aout. Le nom nu, lui, est bien dans la portee. */
    return (typeof RencMicro !== 'undefined' && RencMicro.etat() !== 'arret')
      ? RencMicro.secondes() : null;
  }

  function mmss(s) {
    if (s == null) return '';
    var m = Math.floor(s / 60), r = s % 60;
    return m + ':' + (r < 10 ? '0' : '') + r;
  }

  function dessineOdj() {
    var panneau = id('rencOdj'), liste = id('rencOdjListe'), depart = id('rencOdjDepart');
    var travail = document.querySelector('.renc-travail');
    if (!panneau || !liste) return;

    var points = odj();
    // Le panneau ne s'affiche que si la rencontre est ouverte. La grille ne
    // se dedouble que s'il y a des points — sinon la capture garde toute la
    // largeur, et le mode libre reste ce qu'il etait.
    panneau.hidden = !courante;
    if (travail) travail.classList.toggle('a-odj', !!courante && points.length > 0);
    if (depart) depart.hidden = points.length > 0;
    var vider = id('rencOdjVider');
    if (vider) vider.hidden = points.length === 0;

    liste.textContent = '';
    points.forEach(function (p, i) {
      var li = document.createElement('li');
      li.className = 'renc-point'
        + (p.fait ? ' is-fait' : '')
        + (i === pointCourant ? ' is-courant' : '');

      var c = document.createElement('input');
      c.type = 'checkbox';
      c.className = 'renc-point__case';
      c.checked = !!p.fait;
      c.setAttribute('aria-label', (p.fait ? 'Rouvrir' : 'Marquer comme réglé') + ' : ' + p.texte);
      c.addEventListener('change', function () { basculePoint(i, c.checked); });
      li.appendChild(c);

      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'renc-point__t';
      b.appendChild(document.createTextNode(p.texte));
      if (p.debut != null) {
        var h = document.createElement('span');
        h.className = 'renc-point__h';
        h.textContent = mmss(p.debut) + (p.fin != null ? ' → ' + mmss(p.fin) : ' → en cours');
        b.appendChild(h);
      }
      // Cliquer le libelle rend le point COURANT — une vraie rencontre ne
      // suit jamais l'ordre du jour dans l'ordre.
      b.addEventListener('click', function () { rendCourant(i); });
      li.appendChild(b);

      liste.appendChild(li);

      // Le brut s'accumule sous le point courant, et sous lui seul.
      if (i === pointCourant) {
        var brut = document.createElement('li');
        brut.className = 'renc-odj__brut';
        brut.id = 'rencOdjBrut';
        var t = document.createElement('b');
        t.textContent = 'Ce qui se dit';
        brut.appendChild(t);
        brut.appendChild(document.createTextNode(dernierBrut || '…'));
        liste.appendChild(brut);
      }
    });

    var pied = id('rencOdjPied');
    if (pied) {
      var faits = points.filter(function (p) { return p.fait; }).length;
      pied.hidden = !points.length;
      pied.textContent = points.length
        ? faits + ' point' + (faits > 1 ? 's' : '') + ' réglé' + (faits > 1 ? 's' : '')
          + ' sur ' + points.length + '. Coche un point quand il est réglé — ça n\'interrompt jamais l\'enregistrement.'
        : '';
    }
  }

  var dernierBrut = '';

  /** Rend un point courant, et horodate la bascule si ca enregistre. */
  function rendCourant(i) {
    var points = odj();
    if (!points[i]) return;
    var t = instant();
    if (pointCourant >= 0 && points[pointCourant] && t != null && points[pointCourant].fin == null) {
      points[pointCourant].fin = t;
    }
    pointCourant = i;
    if (t != null && points[i].debut == null) points[i].debut = t;
    dernierBrut = '';
    marqueSale();
    dessineOdj();
  }

  /**
   * Cocher ferme le point et passe au premier non regle. Decocher le rouvre
   * et efface son heure de fin — une fausse manoeuvre a la minute 3 ne doit
   * pas fausser une heure de decoupage.
   */
  function basculePoint(i, fait) {
    var points = odj();
    if (!points[i]) return;
    var t = instant();
    points[i].fait = fait;

    if (fait) {
      if (t != null) {
        if (points[i].debut == null) points[i].debut = 0;
        points[i].fin = t;
      }
      // Au suivant : le premier non regle apres celui-ci, sinon le premier
      // non regle tout court.
      var suiv = -1, j;
      for (j = i + 1; j < points.length; j++) if (!points[j].fait) { suiv = j; break; }
      if (suiv === -1) for (j = 0; j < points.length; j++) if (!points[j].fait) { suiv = j; break; }
      if (suiv >= 0) {
        rendCourant(suiv);
        etat('« ' + points[i].texte + ' » réglé' + (t != null ? ' à ' + mmss(t) : '')
          + '. Au suivant : ' + points[suiv].texte + '.');
        return;
      }
      pointCourant = -1;
      etat('Tous les points sont réglés.' + (t != null ? ' L\'enregistrement continue.' : ''));
    } else {
      points[i].fin = null;
      etat('« ' + points[i].texte +' » rouvert.');
    }
    marqueSale();
    dessineOdj();
  }

  /** Cree les points a partir d'un texte, une ligne par point. */
  function creeOdj(texte) {
    if (!courante) { etat('Ouvre ou crée une rencontre d\'abord.', 'attente'); return; }
    var lignes = String(texte || '').split(/\r?\n/)
      .map(function (l) {
        // « 1. », « 1) », « - », « • » : la numerotation vient de la liste,
        // pas du texte. La laisser donnerait « 1. 1. Horaire ».
        return l.replace(/^\s*(?:\d+\s*[.)\-]|[-–—•*])\s*/, '').trim();
      })
      .filter(Boolean)
      .slice(0, 60);
    if (!lignes.length) { etat('Aucun point trouvé — une ligne par point.', 'attente'); return; }

    courante.ordreDuJour = lignes.map(function (l) {
      return { texte: l.slice(0, 300), fait: false, debut: null, fin: null };
    });
    pointCourant = 0;
    marqueSale();
    dessineOdj();
    etat(lignes.length + ' point' + (lignes.length > 1 ? 's' : '') + ' créé'
      + (lignes.length > 1 ? 's' : '') + '. Coche-les à mesure pendant la rencontre.');
    sauveServeur(true);
  }

  function cableOdj() {
    var creer = id('rencOdjCreer');
    if (creer) creer.addEventListener('click', function () {
      creeOdj((id('rencOdjSaisie') || {}).value);
      var z = id('rencOdjSaisie');
      if (z) z.value = '';
    });

    var vider = id('rencOdjVider');
    if (vider) vider.addEventListener('click', function () {
      if (!courante) return;
      if (!window.confirm('Effacer l\'ordre du jour ?\n\nLes points et leurs horodatages partent. '
        + 'Tes notes, ta transcription et ton compte rendu restent.')) return;
      courante.ordreDuJour = [];
      pointCourant = -1;
      marqueSale();
      dessineOdj();
      sauveServeur(true);
      etat('Ordre du jour effacé.');
    });

    var fich = id('rencOdjFichier'), input = id('rencOdjFichierInput');
    if (fich && input) {
      fich.addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () {
        var f = input.files && input.files[0];
        input.value = '';
        if (!f) return;
        f.text().then(function (t) { creeOdj(t); })
          .catch(function () { etat('Le fichier n\'a pas pu être lu.', 'alerte'); });
      });
    }

    var gab = id('rencOdjGabarit');
    if (gab) gab.addEventListener('click', function () {
      var m = 'Quel gabarit ?\n\n' + GABARITS.map(function (g, i) {
        return (i + 1) + '. ' + g.nom;
      }).join('\n') + '\n\nTape un numéro.';
      var r = window.prompt(m, '1');
      if (r === null) return;
      var g = GABARITS[Number(r) - 1];
      if (!g) { etat('Numéro inconnu.', 'attente'); return; }
      creeOdj(g.pts.join('\n'));
    });
  }

  /* ==================================================================== */
  /* Suivi : actions, presences, gabarits, chainage (vague H)             */
  /* ==================================================================== */

  /* ── Presences ─────────────────────────────────────────────────────────
     Construites des participants, et REUTILISEES d'une rencontre a l'autre
     par le chainage. Un objet { nom: true|false } et non un tableau de
     presents : un tableau ne distingue pas « absent » de « pas encore
     pointe », et une liste qui ne dit pas qui manquait ne sert a rien. */

  function dessinePresences() {
    var hote = id('rencPresences');
    if (!hote || !courante) return;
    var noms = String((id('rencParticipants') || {}).value || '')
      .split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    hote.textContent = '';
    hote.hidden = !noms.length;
    if (!noms.length) return;

    var etatP = courante.presences || {};
    noms.forEach(function (nom) {
      var l = document.createElement('label');
      l.className = 'renc-pres' + (etatP[nom] ? ' is-la' : '');
      var c = document.createElement('input');
      c.type = 'checkbox';
      c.checked = !!etatP[nom];
      c.addEventListener('change', function () {
        courante.presences = courante.presences || {};
        courante.presences[nom] = c.checked;
        l.classList.toggle('is-la', c.checked);
        marqueSale();
      });
      l.appendChild(c);
      l.appendChild(document.createTextNode(nom));
      hote.appendChild(l);
    });
  }

  /* ── Cocher une action DANS le compte rendu ───────────────────────────
     La case cochee a l'ecran et l'entree de `actions[]` doivent dire la meme
     chose, sinon « Mes actions » affiche le contraire du compte rendu. C'est
     `data-a` qui les relie. */
  function cableCasesSortie() {
    var z = id('rencSortie');
    if (!z) return;
    z.addEventListener('change', function (e) {
      var c = e.target;
      if (!c || c.tagName !== 'INPUT' || c.type !== 'checkbox') return;
      // On garde l'attribut d'accord avec la propriete : c'est l'attribut
      // qu'`innerHTML` serialise, et donc lui seul qui survit a
      // l'enregistrement.
      if (c.checked) c.setAttribute('checked', ''); else c.removeAttribute('checked');
      var rang = c.getAttribute('data-a');
      if (rang !== null && courante && Array.isArray(courante.actions)) {
        var a = courante.actions[Number(rang)];
        if (a) a.fait = c.checked;
      }
      marqueSale();
      sauveServeur(true);
    });
  }

  /* ── La vue « Mes actions » ────────────────────────────────────────────
     Toutes les cases a cocher de toutes les rencontres. C'est ce qui fait
     qu'un compte rendu cesse d'etre un document qu'on classe et qu'on oublie
     — le §9.1 du cahier l'appelle l'argument massue, et il a raison : c'est
     la seule vue qui donne une raison de revenir demain. */

  function jourISO(d) {
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }

  function groupeEcheance(ech, aujourdhui, dans7) {
    if (!ech) return { cle: 'sans', rang: 3, titre: 'Sans échéance' };
    if (ech < aujourdhui) return { cle: 'retard', rang: 0, titre: 'En retard' };
    if (ech === aujourdhui) return { cle: 'jour', rang: 1, titre: "Aujourd'hui" };
    if (ech <= dans7) return { cle: 'semaine', rang: 2, titre: 'Dans les 7 prochains jours' };
    return { cle: 'apres', rang: 4, titre: 'Plus tard' };
  }

  function ouvreActions() {
    if (window.__rencFermeTiroir) window.__rencFermeTiroir();
    poseEcran('actions');
    dessineActions();
  }

  function fermeActions() {
    poseEcran(courante ? ecranDe(courante) : 'liste');
    if (!courante) dessineListe();
  }

  function dessineActions() {
    var hote = id('rencActionsListe'), vide = id('rencActionsVide');
    if (!hote) return;
    hote.textContent = '';
    var voirFaites = !!(id('rencVoirFaites') || {}).checked;

    var auj = jourISO(new Date());
    var d7 = jourISO(new Date(Date.now() + 7 * 86400000));

    var tout = [];
    rencontres.forEach(function (r) {
      (r.actions || []).forEach(function (a, i) {
        if (!voirFaites && a.fait) return;
        tout.push({ r: r, a: a, i: i, g: groupeEcheance(a.echeance, auj, d7) });
      });
    });

    if (!tout.length) {
      vide.hidden = false;
      // Trois situations, trois messages. « Tout est coche » devant zero
      // rencontre serait faux, et « aucune action » devant dix rencontres
      // toutes reglees serait injuste.
      if (!rencontres.length) {
        vide.textContent = 'Aucune rencontre pour l\'instant. Les actions apparaissent ici dès qu\'un compte rendu structuré en produit.';
      } else if (voirFaites) {
        vide.textContent = 'Aucune action dans tes ' + rencontres.length
          + ' rencontre' + (rencontres.length > 1 ? 's' : '')
          + '. Le bouton « Structuré » en tire des comptes rendus.';
      } else {
        vide.textContent = 'Rien à faire — tout est coché. 🎉';
      }
      return;
    }
    vide.hidden = true;

    // Le retard d'abord, puis aujourd'hui, puis la semaine. L'ordre n'est pas
    // chronologique : il est URGENT d'abord.
    tout.sort(function (x, y) {
      return x.g.rang - y.g.rang
        || String(x.a.echeance || '').localeCompare(String(y.a.echeance || ''))
        || String(y.r.date || '').localeCompare(String(x.r.date || ''));
    });

    var courantG = null, boite = null;
    tout.forEach(function (o) {
      if (!courantG || courantG !== o.g.cle) {
        courantG = o.g.cle;
        boite = document.createElement('div');
        boite.className = 'renc-groupe' + (o.g.cle === 'retard' ? ' is-retard' : '');
        var t = document.createElement('p');
        t.className = 'renc-groupe__t';
        t.textContent = o.g.titre;
        boite.appendChild(t);
        hote.appendChild(boite);
      }
      boite.appendChild(ligneAction(o));
    });
  }

  function ligneAction(o) {
    var l = document.createElement('div');
    l.className = 'renc-act' + (o.a.fait ? ' is-faite' : '');

    var c = document.createElement('input');
    c.type = 'checkbox';
    c.checked = !!o.a.fait;
    c.setAttribute('aria-label', o.a.quoi);
    c.addEventListener('change', function () { bascule(o, c.checked, l); });
    l.appendChild(c);

    var corps = document.createElement('div');
    corps.className = 'renc-act__c';
    var q = document.createElement('div');
    q.className = 'renc-act__q';
    q.textContent = o.a.quoi;
    corps.appendChild(q);

    var m = document.createElement('div');
    m.className = 'renc-act__m';
    if (o.a.qui) m.appendChild(document.createTextNode(o.a.qui + ' · '));
    if (o.a.echeance) m.appendChild(document.createTextNode(o.a.echeance + ' · '));
    var lien = document.createElement('button');
    lien.type = 'button';
    lien.className = 'renc-act__ou';
    lien.textContent = o.r.titre || 'Sans titre';
    lien.addEventListener('click', function () { fermeActions(); ouvre(o.r); });
    m.appendChild(lien);
    corps.appendChild(m);

    l.appendChild(corps);
    return l;
  }

  /** Coche ou decoche une action depuis la vue transversale. */
  async function bascule(o, fait, ligne) {
    o.a.fait = fait;
    ligne.classList.toggle('is-faite', fait);
    // Si la rencontre est ouverte a l'ecran, sa case doit suivre — sinon les
    // deux vues se contredisent sous les yeux de l'usager.
    if (courante && courante.id === o.r.id) {
      if (Array.isArray(courante.actions) && courante.actions[o.i]) {
        courante.actions[o.i].fait = fait;
      }
      var c = document.querySelector('#rencSortie input[data-a="' + o.i + '"]');
      if (c) {
        c.checked = fait;
        if (fait) c.setAttribute('checked', ''); else c.removeAttribute('checked');
        courante.sortieIA = id('rencSortie').innerHTML;
      }
      marqueSale();
    }
    try {
      var doc = Object.assign({}, o.r);
      if (courante && courante.id === o.r.id) doc = lisFormulaire();
      doc.actions = o.r.actions;
      await RencData.majRencontre(o.r.id, doc);
      if (courante && courante.id === o.r.id) marquePropre();
    } catch (e) {
      etat('⚠ La case n\'a pas pu être enregistrée (' + (e.message || e) + ').', 'alerte');
    }
  }

  /* ── Gabarits d'ordre du jour ──────────────────────────────────────────
     Volontairement COURTS. Un gabarit de trente lignes se supprime au lieu de
     se remplir ; celui-ci donne la charpente et laisse la place. */
  var GABARITS = [
    { nom: 'Rencontre statutaire', pts: ['Retour sur la dernière rencontre', 'Suivis et informations', 'Points de l\'équipe', 'Varia', 'Prochaine rencontre'] },
    { nom: 'Comité (EHDAA, activités, cour d\'école)', pts: ['Ouverture et présences', 'Adoption de l\'ordre du jour', 'Suivi des dossiers', 'Nouveaux dossiers', 'Décisions', 'Prochaine rencontre'] },
    { nom: 'Rencontre de parents', pts: ['Accueil', 'Portrait de l\'élève', 'Forces et défis', 'Ce qu\'on met en place', 'Suivi convenu'] },
    { nom: 'Coordination de camp', pts: ['Retour sur la semaine', 'Groupes et animateurs', 'Sécurité et incidents', 'Sorties et matériel', 'Semaine à venir'] }
  ];

  function choisitGabarit() {
    if (!courante) { etat('Ouvre ou crée une rencontre d\'abord.', 'attente'); return; }
    var m = 'Quel gabarit ?\n\n' + GABARITS.map(function (g, i) {
      return (i + 1) + '. ' + g.nom;
    }).join('\n') + '\n\nTape un numéro.';
    var r = window.prompt(m, '1');
    if (r === null) return;
    var g = GABARITS[Number(r) - 1];
    if (!g) { etat('Numéro inconnu.', 'attente'); return; }

    var html = '<h2>Ordre du jour</h2><ul>'
      + g.pts.map(function (p) { return '<li>' + echappe(p) + '</li>'; }).join('') + '</ul>';
    var z = id('rencNotes');
    // On AJOUTE, on n'ecrase pas : quelqu'un qui a deja commence a prendre des
    // notes ne doit pas les perdre parce qu'il a voulu la charpente.
    z.innerHTML = assainit(html + (z.innerHTML || ''));
    id('ongNotes').click();
    marqueSale();
    etat('Gabarit « ' + g.nom + ' » ajouté en tête des notes.');
  }

  /* ── Chainage : creer la suite ─────────────────────────────────────────
     Ce qui se recopie : le cadre (titre, type, dossier, animateur,
     secretaire, participants, presences remises a zero) plus LES POINTS
     REPORTES et LES ACTIONS NON COCHEES. Ce qui ne se recopie pas : les
     notes, la transcription et le compte rendu — ils appartiennent a la
     rencontre passee. */
  function creeLaSuite() {
    if (!courante) { etat('Ouvre une rencontre d\'abord.', 'attente'); return; }
    var source = lisFormulaire();
    var restantes = (courante.actions || []).filter(function (a) { return !a.fait; });

    // Les points reportes sont dans le compte rendu, sous leur titre. On les
    // relit dans le HTML plutot que de les redemander a l'IA.
    var reportes = [];
    var z = id('rencSortie');
    if (z) {
      var enfants = z.children, dedans = false;
      for (var i = 0; i < enfants.length; i++) {
        var e = enfants[i];
        if (/^H[1-3]$/.test(e.tagName)) {
          dedans = /report/i.test(e.textContent);
          continue;
        }
        if (dedans && (e.tagName === 'UL' || e.tagName === 'OL')) {
          for (var j = 0; j < e.children.length; j++) {
            var t = (e.children[j].textContent || '').trim();
            if (t) reportes.push(t);
          }
        }
      }
    }

    var presences = {};
    Object.keys(courante.presences || {}).forEach(function (n) { presences[n] = false; });

    var neuve = RencData.normalise({
      titre: source.titre, type: source.type, dossier: source.dossier,
      animateur: source.animateur, secretaire: source.secretaire,
      participants: source.participants, presences: presences,
      date: RencData.aujourdhui()
    });
    neuve.id = null;

    var html = '';
    if (reportes.length) {
      html += '<h2>Reporté de la rencontre précédente</h2><ul>'
        + reportes.map(function (p) { return '<li>' + echappe(p) + '</li>'; }).join('') + '</ul>';
    }
    if (restantes.length) {
      html += '<h2>Actions encore ouvertes</h2>'
        + restantes.map(function (a) {
            var qui = a.qui ? ' <b>— ' + echappe(a.qui) + '</b>' : '';
            var ech = a.echeance ? ' <b>(' + echappe(a.echeance) + ')</b>' : '';
            return '<div><input type="checkbox"> ' + echappe(a.quoi) + qui + ech + '</div>';
          }).join('');
    }
    neuve.notesBrutes = html;
    // Les actions ouvertes suivent aussi dans `actions[]` : sans ca elles
    // disparaitraient de « Mes actions » a la seconde ou l'on cree la suite.
    neuve.actions = restantes.map(function (a) {
      return { quoi: a.quoi, qui: a.qui, echeance: a.echeance, fait: false };
    });

    if (sale) sauveLocal();
    courante = neuve;
    posteFormulaire(courante);
    dessinePresences();
    dessineOdj();
    montreFiche('avant');
    marqueSale();
    var quoi = [];
    if (reportes.length) quoi.push(reportes.length + ' point' + (reportes.length > 1 ? 's' : '') + ' reporté' + (reportes.length > 1 ? 's' : ''));
    if (restantes.length) quoi.push(restantes.length + ' action' + (restantes.length > 1 ? 's' : '') + ' encore ouverte' + (restantes.length > 1 ? 's' : ''));
    etat(quoi.length
      ? 'Suite créée avec ' + quoi.join(' et ') + '. Enregistre quand tu veux.'
      : 'Suite créée — rien n\'était en attente.');
  }

  function cableSuivi() {
    var a = id('rencMesActions');
    if (a) a.addEventListener('click', ouvreActions);
    var f = id('rencFermerActions');
    if (f) f.addEventListener('click', fermeActions);
    var v = id('rencVoirFaites');
    if (v) v.addEventListener('change', dessineActions);
    var g = id('rencGabarit');
    if (g) g.addEventListener('click', choisitGabarit);
    var s = id('rencSuite');
    if (s) s.addEventListener('click', creeLaSuite);
    var p = id('rencParticipants');
    if (p) p.addEventListener('input', dessinePresences);
    cableCasesSortie();
  }

  /* pasEncore() a vecu ici de la vague A a la vague G : elle grisait une
     commande non livree en NOMMANT sa vague dans son title. Toutes les vagues
     etant livrees, elle n'a plus d'appelant — et une fonction sans appelant
     est du code mort, pas une reserve. Retiree a la vague H.

     Son histoire, si la question revient : un bouton qui ne fait rien sans
     expliquer pourquoi est un defaut ; un bouton grise qui nomme son echeance
     est un chantier lisible. */

  /* ==================================================================== */
  /* Entonnoir d'inscription                                              */
  /* ==================================================================== */

  /* CE QUE CE BLOC COUVRE, ET CE QU'IL NE COUVRE PAS.
     ────────────────────────────────────────────────────────────────────
     `shared/zts-gate.js` — le mur des apps — ne trace RIEN. Verifie le
     25 aout 2026 : aucun appel a ztsTrackFunnel, aucun a gtag. Les 26 apps
     qui l'utilisent sont donc absentes de l'entonnoir, la ou les 19 qui
     passent par zts-lock-page.js y sont.

     On emet ici les deux evenements que l'app PEUT constater sans toucher au
     fichier partage :

       locked_view          le mur s'affiche a un anonyme
       locked_click_signup  il appuie sur « Creer mon compte » ou sur Google

     `signup_complete` MANQUE ENCORE, et il faut le dire. Il est pose par
     firebase-auth.js — que le mur des apps ne charge pas : le gate fait sa
     propre authentification. Le boucler demanderait de modifier zts-gate.js,
     donc de decider pour les 26 apps. C'est une decision de Joey, pas un
     ajout a glisser dans un chantier d'app. */

  function cableEntonnoir() {
    if (typeof window.ztsTrackFunnel !== 'function') return;
    var mur = id('zts-gate');
    if (!mur) return;

    var vu = false;
    function regarde() {
      var visible = !mur.hidden && getComputedStyle(mur).display !== 'none';
      if (visible && !vu) {
        vu = true;
        window.ztsTrackFunnel('locked_view', { source: 'app', slug: 'rencontres', layer: 'gate' });
      }
    }

    // Le mur se dessine puis se cache si la session est deja ouverte : on
    // observe l'attribut plutot que de mesurer une fois au chargement, sinon
    // on tracerait un « mur vu » a chaque visite d'un membre.
    if (window.MutationObserver) {
      new MutationObserver(regarde).observe(mur, { attributes: true, attributeFilter: ['hidden', 'style'] });
    }
    setTimeout(regarde, 1200);

    // Les deux boutons vivent dans le DOM du mur, redessine a chaque bascule
    // entre « creer un compte » et « se connecter » : on ecoute au niveau du
    // mur, pas sur les boutons eux-memes.
    mur.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('#ztg-submit, #ztg-google');
      if (!b) return;
      window.ztsTrackFunnel('locked_click_signup', {
        source: 'app', slug: 'rencontres', layer: 'gate',
        provider: b.id === 'ztg-google' ? 'google' : 'email'
      });
    });
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

    // Changer la date change le titre propose : le gris doit suivre.
    var champDate = id('rencDate');
    if (champDate) champDate.addEventListener('change', annonceTitre);

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
      // Meme piege que dans instant() : `window.RencMicro` est toujours
      // undefined, donc le micro n'etait PAS coupe a la fermeture de l'onglet
      // — la pastille rouge restait allumee et le peripherique restait pris.
      if (typeof RencMicro !== 'undefined' && RencMicro.etat() !== 'arret') RencMicro.arrete();
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
    litCredits();
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
    cableSortie();
    cableSuivi();
    cableOdj();
    cableEcrans();

    // Le decalage de la barre collante : au demarrage, puis chaque fois que la
    // largeur change (le chrome du shell ne fait pas la meme hauteur sur un
    // telephone et sur un portable). Le second passage rattrape le chrome que
    // le shell dessine apres nous.
    poseCollant();
    window.setTimeout(poseCollant, 400);
    window.addEventListener('load', poseCollant);
    window.addEventListener('resize', poseCollant, { passive: true });
    cableEntonnoir();

    dossiers = RencData.dossiersDefaut();
    dessineDossiers();
    dessineListe();
    poseEcran('liste');

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

    var nd = id('rencNouveauDossier');
    if (nd) nd.addEventListener('click', nouveauDossier);
    [id('rencSupprimer'), id('rencSupprimerFiche')].forEach(function (b) {
      if (b) b.addEventListener('click', function () { supprimeRencontre(null); });
    });
    ['rencCherche', 'rencFType'].forEach(function (c) {
      var n = id(c);
      if (n) n.addEventListener('input', dessineListe);
    });
    var ft = id('rencFType');
    if (ft) ft.addEventListener('change', dessineListe);

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
