/**
 * app.js — Zone Rencontres, interface.
 *
 * REGLE DE CE FICHIER : il ne parle JAMAIS a Firestore ni au Worker
 * directement. Tout passe par RencData.* (dataStore.js), sur le meme patron
 * que apps/inventaire et apps/planificateur. A la vague A, dataStore.js
 * n'existe pas encore et l'app tient en memoire : les points d'accrochage
 * sont marques « VAGUE B » et ce sont les seuls endroits a rouvrir.
 *
 * VAGUE A — ce qui est reellement branche ici :
 *   · les deux series d'onglets (capture, sortie) ;
 *   · le tiroir du rail sous 900 px ;
 *   · le menu ⋯ ;
 *   · l'etat du reseau ;
 *   · la DETECTION de la reconnaissance vocale, qui decide de ce que l'onglet
 *     micro annonce a l'usager.
 *
 * Script classique, pas un module : charge apres shared/zts.js, zts-gate.js
 * et le montage du shell.
 */
(function () {
  'use strict';

  /* ── Dossiers de depart ───────────────────────────────────────────────
     Deux, exactement ceux du cahier. Ce ne sont pas des categories fermees :
     l'usager en ajoute, en renomme et en supprime a la vague F. Les
     identifiants sont stables et ne bougent JAMAIS quand un libelle change —
     c'est `id` que les rencontres portent. */
  var DOSSIERS_DEFAUT = [
    { id: 'comites',     nom: 'Comités' },
    { id: 'statutaires', nom: 'Statutaires' }
  ];

  /* ── Reconnaissance vocale : presente ou absente ──────────────────────
     `webkitSpeechRecognition` n'existe NI sur Firefox NI sur Safari. Sur un
     Mac ou un iPhone — une bonne part du parc scolaire quebecois — la
     transcription se fera donc a la fin de l'enregistrement, par le worker.

     CE N'EST PAS UN REPLI, ET L'INTERFACE NE LE DIRA JAMAIS. Ce sont deux
     facons de transcrire : l'une ecrit pendant la rencontre, l'autre a la
     fin. L'usager de Safari n'a pas une version abimee de l'app, il a une
     version qui transcrit apres coup. Le mot « repli » vit dans ce
     commentaire et nulle part ailleurs.

     La detection sert a deux choses, ici et a la vague C : le sous-titre de
     l'onglet micro, et le choix du chemin de capture. */
  var DIRECT = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  function id(x) { return document.getElementById(x); }

  /* ==================================================================== */
  /* Onglets                                                              */
  /* ==================================================================== */

  /**
   * Cable un groupe d'onglets ARIA. `paires` associe le bouton au panneau.
   * Un seul panneau visible ; `aria-selected` et `hidden` restent d'accord,
   * ce qui evite qu'un lecteur d'ecran annonce deux onglets actifs.
   */
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
        var i = boutons.indexOf(bt);
        var n = boutons.length;
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

    bt.addEventListener('click', function (e) {
      e.stopPropagation();
      pose(!rail.classList.contains('is-ouvert'));
    });
    // Un clic dans le rail ne le referme pas : on y choisit un dossier PUIS
    // une rencontre, deux gestes.
    rail.addEventListener('click', function (e) { e.stopPropagation(); });
    document.addEventListener('click', function () { pose(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && rail.classList.contains('is-ouvert')) { pose(false); bt.focus(); }
    });
    // Au retour en deux colonnes, le rail redevient une colonne : la classe
    // n'a plus de sens et laisserait un `transform` orphelin.
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
    // bouton « Partager » inerte sur ordinateur serait pire que pas de
    // bouton du tout.
    var partage = id('rencPartage');
    if (partage && typeof navigator.share === 'function') partage.hidden = false;
  }

  /* ==================================================================== */
  /* Etat du reseau                                                       */
  /* ==================================================================== */

  function cableReseau() {
    var bandeau = id('rencReseau');
    if (!bandeau) return;
    function relis() { bandeau.hidden = navigator.onLine !== false; }
    window.addEventListener('online', relis);
    window.addEventListener('offline', relis);
    relis();
  }

  /* ==================================================================== */
  /* Rail : dossiers et liste                                             */
  /* ==================================================================== */

  var dossierActif = null;   // null = tous les dossiers

  function dessineDossiers() {
    var hote = id('rencDossiers');
    if (!hote) return;
    hote.textContent = '';

    var tous = [{ id: null, nom: 'Toutes mes rencontres' }].concat(DOSSIERS_DEFAUT);
    tous.forEach(function (d) {
      var li = document.createElement('li');
      var bt = document.createElement('button');
      bt.type = 'button';
      bt.className = 'renc-dossier' + (d.id === dossierActif ? ' is-actif' : '');
      // textContent et jamais innerHTML : un nom de dossier est saisi par
      // l'usager, il n'a aucune raison d'etre interprete comme du balisage.
      bt.textContent = (d.id === null ? '📚 ' : '📁 ') + d.nom;
      bt.addEventListener('click', function () {
        dossierActif = d.id;
        dessineDossiers();
        dessineListe();
      });
      li.appendChild(bt);
      hote.appendChild(li);
    });
  }

  /* VAGUE B — la liste se remplira de RencData.listeRencontres(). Tant
     qu'elle est vide, c'est le message d'accueil qui parle. */
  function dessineListe() {
    var hote = id('rencListe'), vide = id('rencListeVide');
    if (!hote) return;
    hote.textContent = '';
    if (vide) vide.hidden = hote.children.length > 0;
  }

  /* ==================================================================== */
  /* Ouvrir une rencontre                                                 */
  /* ==================================================================== */

  function ouvreFiche() {
    var accueil = id('rencAccueil'), fiche = id('rencFiche');
    if (!accueil || !fiche) return;
    accueil.hidden = true;
    fiche.hidden = false;

    var date = id('rencDate');
    // Date du jour en ISO court. `toISOString()` seul renverrait la veille
    // apres 20 h a Montreal : il travaille en UTC. On decale de l'offset
    // local avant de couper.
    if (date && !date.value) {
      var d = new Date();
      date.value = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString().slice(0, 10);
    }

    var dossier = id('rencDossier');
    if (dossier && !dossier.options.length) {
      DOSSIERS_DEFAUT.forEach(function (o) {
        var opt = document.createElement('option');
        opt.value = o.id;
        opt.textContent = o.nom;
        dossier.appendChild(opt);
      });
    }

    var titre = id('rencTitre');
    if (titre) titre.focus();

    // VAGUE B — l'autosauvegarde et l'ecriture Firestore se branchent ici.
    etat('Brouillon local. L\'enregistrement arrive à la vague B.');
  }

  function etat(texte) {
    var n = id('rencEtat');
    if (n) n.textContent = texte || '';
  }

  /* ==================================================================== */
  /* Ce qui n'est pas encore branche                                      */
  /* ==================================================================== */

  /**
   * Desactive une commande dont la vague n'est pas livree, en DISANT laquelle.
   * Un bouton qui ne fait rien sans expliquer pourquoi est un defaut ; un
   * bouton grise qui nomme sa vague est un chantier lisible.
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

  function demarre() {
    cableOnglets([['ongNotes', 'panNotes'], ['ongMicro', 'panMicro'], ['ongImport', 'panImport']]);
    cableOnglets([['ongResultat', 'panResultat'], ['ongBrut', 'panBrut']]);
    cableTiroir();
    cableMenu();
    cableReseau();
    dessineDossiers();
    dessineListe();

    // Le libelle de l'onglet micro depend du navigateur, et il annonce ce que
    // l'usager VERRA — pas de quelle interface de programmation il dispose.
    var sous = id('ongMicroSous');
    if (sous) {
      sous.textContent = DIRECT ? 'transcription en direct' : 'transcription à la fin';
    }
    var micro = id('ongMicro');
    if (micro) {
      micro.title = DIRECT
        ? 'Le texte s\'écrit pendant la rencontre.'
        : 'Le texte s\'écrit une fois l\'enregistrement terminé.';
    }

    [id('rencNouvelle'), id('rencNouvelle2')].forEach(function (bt) {
      if (bt) bt.addEventListener('click', ouvreFiche);
    });

    ['rencVerbatim', 'rencStructure'].forEach(function (c) { pasEncore(c, 'E'); });
    ['rencEnvoyer', 'rencCopier', 'rencPdf', 'rencTxt', 'rencMd', 'rencPartage']
      .forEach(function (c) { pasEncore(c, 'G'); });
    ['rencNouveauDossier', 'rencSupprimer', 'rencCherche'].forEach(function (c) { pasEncore(c, 'F'); });
    pasEncore('rencMesActions', 'H');

    // zts-gate.js emet `zts:auth` une fois le mur franchi. Rien n'en depend a
    // la vague A ; l'ecouteur est pose des maintenant pour que la vague B
    // n'ait qu'a remplir le corps.
    document.addEventListener('zts:auth', function () {
      // VAGUE B — RencData.pret() puis premier chargement de la liste.
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarre);
  else demarre();
})();
