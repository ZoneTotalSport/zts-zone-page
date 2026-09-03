/**
 * ZTS Administration — bloc « Administration » du pied de page partage.
 *
 * 2 septembre 2026.
 *
 * CE QUE FAIT CE FICHIER
 * Il ajoute, au bas du pied de page partage, une carte qui regroupe les outils
 * de creation de Joey. Cette carte n'existe QUE si le compte connecte est un
 * compte administrateur : hors de ce cas, rien n'est construit, rien n'est
 * insere, et le DOM public reste identique a ce qu'il etait avant ce fichier.
 *
 * POURQUOI INJECTE ET NON MASQUE
 * Un bloc ecrit dans shared/footer.html puis cache en CSS serait present dans
 * le DOM des 1573 pages qui chargent ce pied de page — visible au clic droit,
 * indexable, et desactivable en une ligne d'inspecteur. Le contrat du mandat
 * est explicite : « aucune fuite dans le HTML public ». On construit donc apres
 * verification d'identite, jamais avant.
 *
 * CE QUE CE FICHIER NE FAIT PAS
 * Il n'ouvre aucun acces. Les cinq destinations sont deja gardees a la porte —
 * trois par admin-gate.js (courriel administrateur exige), deux par
 * shared/zts-gate.js (compte gratuit exige). Ce bloc est un raccourci de
 * navigation, pas une autorisation : masquer le lien ne protegerait rien et
 * l'afficher n'ouvre rien.
 *
 * IL NE CHARGE PAS FIREBASE.
 * Ce module est charge sur toutes les pages du site. Y initialiser le SDK
 * Firebase ajouterait deux requetes et ~200 ko a 1573 pages pour le confort
 * d'un seul compte. Il se branche donc sur l'authentification que la page
 * porte deja :
 *   - window.ztsOnAuth (firebase-auth.js) — present sur 1547 des 1573 pages ;
 *   - firebase.auth() (shared/zts-gate.js, qui charge le SDK lui-meme) ;
 * et si la page n'a ni l'un ni l'autre au bout de ~30 s, il abandonne en
 * silence. Le repli est donc « pas de bloc », jamais « bloc affiche sans
 * verification ».
 *
 * LANGUE : francais seulement, volontairement. Le bloc s'adresse a un seul
 * compte, francophone. Lui poser des cles data-i18n obligerait a maintenir des
 * traductions que personne ne lira jamais dans shared/i18n/en.json.
 */
(function () {
  'use strict';

  // MEME garde que apps/studio-jeu/admin-gate.js et apps/decodage/admin-gate.js.
  // Si cette liste change la-bas, elle change ici : trois copies, une seule
  // verite. C'est la duplication assumee d'un site statique sans build.
  var ADMIN_EMAILS = ['zts@hotmail.ca'];
  function estAdmin(mail) {
    return ADMIN_EMAILS.indexOf(String(mail || '').toLowerCase()) !== -1;
  }

  /* ---------- Les outils ----------
     Ordre : d'abord les trois outils reserves a l'administrateur (admin-gate),
     puis les deux outils ouverts a tout compte gratuit que Joey utilise comme
     outils de travail. `href` est relatif a la racine du depot — resolue plus
     bas par ZTS.paths.root, exactement comme le {{ROOT}} de footer.html : le
     pied de page sert aussi depuis jeux.zonetotalsport.ca, ou un chemin en
     « / » ne pointerait pas au bon endroit. */
  var OUTILS = [
    { url: 'admin/fiches/',    nom: 'Éditeur de fiches',       desc: 'Composer et publier les fiches du site' },
    { url: 'apps/studio-jeu/', nom: 'Studio Jeu',              desc: 'Illustrer les jeux du catalogue' },
    { url: 'apps/decodage/',   nom: 'Décodage du corps',       desc: 'Explorer le sens émotionnel des symptômes' },
    { url: 'apps/rencontres/', nom: 'Zone Rencontres',         desc: 'Transformer une rencontre en compte rendu' },
    { url: 'apps/inventaire/', nom: 'Zone Inventaire',         desc: 'Photographier et cataloguer le matériel' }
  ];

  var ID = 'zts-admin';

  function racine() {
    try {
      if (window.ZTS && ZTS.paths && ZTS.paths.root) return ZTS.paths.root;
    } catch (e) { /* ZTS pas encore la : on retombe sur la racine du domaine */ }
    return '/';
  }

  /* ---------- Habillage ----------
     Aucune couleur, aucune police en dur qui ne soit pas deja un jeton de
     shared/zts.css : --zts-creme, --zts-noir, --cyan, --jaune, --font-impact
     (Luckiest Guy, auto-hebergee depuis /fonts/), --font-body (Quicksand).
     Les valeurs litterales en commentaire sont celles du mandat, pour que la
     correspondance se verifie sans ouvrir la feuille.

     Le CSS est pose ICI, au montage, et pas dans shared/zts.css : un visiteur
     ne telecharge donc meme pas les regles du bloc qu'il ne verra jamais. */
  function poserCss() {
    if (document.getElementById('zts-admin-css')) return;
    var s = document.createElement('style');
    s.id = 'zts-admin-css';
    s.textContent = [
      /* Carte creme #FFFBE8 sur le marine, bordure 3px, ombre 4px 4px 0. */
      '#zts-admin{max-width:1200px;margin:var(--space-5,34px) auto 0;',
      '  background:var(--zts-creme,#FFFBE8);color:var(--zts-noir,#1A1A2E);',
      '  border:3px solid var(--zts-noir,#1A1A2E);border-radius:var(--r-2,16px);',
      '  box-shadow:4px 4px 0 var(--zts-noir,#1A1A2E);',
      '  padding:var(--space-4,22px);}',

      /* Titre en Luckiest Guy + pastille jaune. Le jaune ne sert JAMAIS de
         couleur de texte : ici c'est un fond, l'encre reste le marine. */
      '#zts-admin .zts-admin__titre{display:flex;align-items:center;gap:10px;',
      '  flex-wrap:wrap;margin:0 0 var(--space-3,14px);',
      '  font-family:var(--font-impact,"LuckiestGuy",Impact,sans-serif);',
      '  font-size:var(--fs-3,20px);color:var(--zts-noir,#1A1A2E);letter-spacing:.01em;}',
      '#zts-admin .zts-admin__badge{font-family:var(--font-body,"Quicksand",sans-serif);',
      '  font-weight:700;font-size:.62em;letter-spacing:.08em;text-transform:uppercase;',
      '  background:var(--jaune,#FFEA00);color:var(--zts-noir,#1A1A2E);',
      '  border:2px solid var(--zts-noir,#1A1A2E);border-radius:var(--r-pill,999px);',
      '  padding:2px 10px;line-height:1.5;}',

      /* Un lien = une pastille (le nom) + une ligne de description dessous. */
      /* 190px : la largeur juste assez petite pour que les CINQ outils tiennent
         sur une seule rangee dans les 1200px du pied de page. A 240px, le
         cinquieme tombait seul sur une deuxieme rangee, a cote d'un grand vide. */
      '#zts-admin .zts-admin__liens{display:grid;gap:var(--space-3,14px);',
      '  grid-template-columns:repeat(auto-fit,minmax(min(100%,190px),1fr));}',
      '#zts-admin .zts-admin__lien{display:block;text-decoration:none;color:inherit;}',
      '#zts-admin .zts-admin__nom{display:inline-block;',
      '  font-family:var(--font-impact,"LuckiestGuy",Impact,sans-serif);',
      '  font-size:var(--fs-1,14px);letter-spacing:.02em;',
      '  background:var(--cyan,#00E5FF);color:var(--zts-noir,#1A1A2E);',
      '  border:3px solid var(--zts-noir,#1A1A2E);border-radius:var(--r-pill,999px);',
      /* 8px de haut plutot que 6 : la pastille atteint les 44px de cible
         tactile que shared/zts.css impose deja aux boutons du site. */
      '  padding:8px 18px;box-shadow:4px 4px 0 var(--zts-noir,#1A1A2E);',
      '  transition:transform .08s ease,box-shadow .08s ease;}',
      '#zts-admin .zts-admin__lien:hover .zts-admin__nom,',
      '#zts-admin .zts-admin__lien:focus-visible .zts-admin__nom{',
      '  transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--zts-noir,#1A1A2E);}',
      '#zts-admin .zts-admin__desc{display:block;margin-top:7px;',
      '  font-family:var(--font-body,"Quicksand",sans-serif);font-weight:600;',
      '  font-size:var(--fs-1,14px);line-height:1.35;color:var(--zts-noir,#1A1A2E);',
      /* Le pied de page pose color:#fff et opacity:.85 sur ses colonnes ; la
         carte est creme, il faut y revenir a l'encre pleine. */
      '  opacity:.82;}',
      /* Le focus clavier du site (contour cyan) serait invisible sur une
         pastille cyan : sur cette carte, on le passe au marine. */
      '#zts-admin .zts-admin__lien:focus-visible{outline:3px solid var(--zts-noir,#1A1A2E);',
      '  outline-offset:4px;border-radius:var(--r-1,10px);}',
      '@media(max-width:600px){#zts-admin{padding:var(--space-3,14px);}',
      '  #zts-admin .zts-admin__nom{font-size:15px;}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---------- Montage ---------- */
  function monter() {
    if (document.getElementById(ID)) return;                 // idempotent
    var pied = document.querySelector('.zts-footer');
    if (!pied) return;                                       // page sans pied de page partage
    poserCss();

    var racineUrl = racine();
    var bloc = document.createElement('section');
    bloc.id = ID;
    bloc.setAttribute('aria-label', 'Administration');

    var titre = document.createElement('h5');
    titre.className = 'zts-admin__titre';
    titre.appendChild(document.createTextNode('Administration'));
    var badge = document.createElement('span');
    badge.className = 'zts-admin__badge';
    badge.textContent = 'admin';
    titre.appendChild(badge);
    bloc.appendChild(titre);

    var liste = document.createElement('div');
    liste.className = 'zts-admin__liens';
    OUTILS.forEach(function (o) {
      var a = document.createElement('a');
      a.className = 'zts-admin__lien';
      a.href = racineUrl + o.url;
      // Le cadenas du menu (zts-cadenas.js) pose une pastille « compte gratuit
      // requis » sur tout lien /apps/ garde. Ici elle serait fausse deux fois :
      // le lecteur EST connecte, et il est administrateur.
      a.setAttribute('data-zts-cad', 'non');
      var nom = document.createElement('span');
      nom.className = 'zts-admin__nom';
      nom.textContent = o.nom;
      var desc = document.createElement('span');
      desc.className = 'zts-admin__desc';
      desc.textContent = o.desc;
      a.appendChild(nom);
      a.appendChild(desc);
      liste.appendChild(a);
    });
    bloc.appendChild(liste);

    // Au bas du pied de page, mais AVANT la ligne de copyright : celle-ci
    // ferme la page, elle reste la derniere.
    var bas = pied.querySelector('.zts-footer__bottom');
    if (bas) pied.insertBefore(bloc, bas);
    else pied.appendChild(bloc);
  }

  function demonter() {
    var b = document.getElementById(ID);
    if (b) b.remove();
  }

  var admin = false;    // dernier etat connu, relu au montage differe ci-dessous

  function appliquer(user) {
    admin = !!(user && estAdmin(user.email));
    if (admin) monter();
    else demonter();      // deconnexion en place : le bloc s'en va avec la session
  }

  /* ---------- Authentification ----------
     On ne fait que s'abonner a ce que la page porte deja. `ztsOnAuth` rappelle
     immediatement si l'etat est connu, et a chaque changement ensuite. */
  var essais = 0;
  (function attendreAuth() {
    if (window.ztsOnAuth) { window.ztsOnAuth(appliquer); return; }
    if (window.firebase && firebase.apps && firebase.apps.length && firebase.auth) {
      firebase.auth().onAuthStateChanged(appliquer);
      return;
    }
    if (++essais > 100) return;     // ~30 s puis on renonce : la page n'a pas
                                    // d'authentification, donc rien a verifier
    setTimeout(attendreAuth, 300);
  })();

  /* Le pied de page est injecte par shared/zts.js ; sur les pages ou ce module
     gagne la course, `monter()` n'a rien trouve. On repasse a `zts:ready`.

     On relit `admin`, PAS l'utilisateur courant : `ztsGetUser()` repond null
     tant que Firebase n'a pas resolu la session, et appeler `appliquer(null)`
     ici retirerait un bloc legitime sans qu'aucun rappel ne vienne le remettre
     — `ztsOnAuth` ne rappelle que sur CHANGEMENT d'etat. */
  document.addEventListener('zts:ready', function () {
    if (admin) monter();
  });
})();
