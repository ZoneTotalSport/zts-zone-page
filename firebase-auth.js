/**
 * ZTS Zone - Firebase Auth System
 * Authentification avec popup modal design ZTS (Pop Art, fond floute)
 * Firebase compat SDK (CDN) pour site statique
 *
 * V2 (2026-08-09) : modal 2 etapes (proposition de valeur → formulaire),
 * fond floute translucide, mode wall pour les apps gatees.
 */
(function(root) {
  'use strict';

  // ── Firebase Config ──
  var firebaseConfig = {
    apiKey: "AIzaSyBoBxVP6g_ObKIJJ1jkviNFQ-wpJoWdjbA",
    authDomain: "zone-total-sport.firebaseapp.com",
    databaseURL: "https://zone-total-sport-default-rtdb.firebaseio.com",
    projectId: "zone-total-sport",
    storageBucket: "zone-total-sport.firebasestorage.app",
    messagingSenderId: "681359040455",
    appId: "1:681359040455:web:80c9f584583824cc8cc3e2"
    // PROPRIETE GA4 INERTE — ne pas reactiver sans decider laquelle porte
    // l'historique. G-09S9R1HJ94 n'existe que comme measurementId dans ce
    // firebaseConfig : aucun analytics-compat n'est charge, aucun
    // firebase.analytics(), aucun getAnalytics() nulle part dans le depot
    // (verifie le 28 aout 2026). C'est G-C2L5PD388L, via analytics.js
    // injecte par le chrome partage, qui recoit tout le trafic.
    // Commente plutot que supprime : un firebaseConfig ampute souleve une
    // question a la prochaine copie depuis la console Firebase.
    // measurementId: "G-09S9R1HJ94"
  };

  var _user = null;
  var _authReady = false;
  var _onAuthCallbacks = [];

  // Le drapeau `zts_signed_out` a ete retire le 2026-08-12 avec le chemin
  // redirect. Il n'existait que pour empecher un getRedirectResult() en cache
  // de ressusciter une session apres une deconnexion volontaire. Plus de
  // getRedirectResult, plus de session fantome a intercepter : il devenait
  // ecrit-jamais-lu. Ne pas le reintroduire sans lecteur.
  // N'a jamais eu de rapport avec zts_signup_pending / zts_signup_source
  // (invariant du funnel), qui gardent leur propre cycle de vie.

  // ── Load Firebase SDK ──
  function loadScript(src, cb) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = cb;
    s.onerror = function() { console.error('Failed to load:', src); };
    document.head.appendChild(s);
  }

  function initFirebase() {
    loadScript('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js', function() {
      loadScript('https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js', function() {
        loadScript('https://www.gstatic.com/firebasejs/10.14.0/firebase-database-compat.js', function() {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        firebase.auth().onAuthStateChanged(function(user) {
          _user = user;
          _authReady = true;
          updateUI(user);
          _onAuthCallbacks.forEach(function(cb) { cb(user); });
        });
        });
      });
    });
  }

  // ── CSS ──
  var CSS = [
    /* Polices auto-hebergees */
    /* Mesure du 3 septembre 2026 sur /fonts/ZoneTotalSport.ttf : 144 points de code,
       tous les accents francais courants compris. Le decoupage ASCII precedent
       renvoyait donc TOUS les accents a Luckiest Guy pour rien. Ne manquent
       vraiment que A-aigu, U-grave, a-aigu, y-trema, Y-trema, AE, ae, OE, oe,
       l apostrophe courbe, les guillemets, le tiret cadratin et le degre. */
    '@font-face{font-family:"ZTSDisplay";src:url("/fonts/ZoneTotalSport.ttf") format("truetype");',
    '  font-display:swap;size-adjust:50%;}',
    '@font-face{font-family:"ZTSDisplay";src:local("Luckiest Guy"),url("/fonts/LuckiestGuy-Regular.ttf") format("truetype");',
    '  font-display:swap;unicode-range:U+00C1,U+00D9,U+00E1,U+00FF,U+0178,U+00C6,U+00E6,U+0152,U+0153,U+2019,U+00AB,U+00BB,U+2014,U+00B0;}',
    '@font-face{font-family:"ZTSLucky";src:local("Luckiest Guy"),url("/fonts/LuckiestGuy-Regular.ttf") format("truetype");',
    '  font-display:swap;}',
    /* Annie Use Your Telescope — meme famille "AnnieZTS" et meme fichier que
       apps/inventaire/styles.css l.74. OFL dans /fonts/OFL-AnnieUseYourTelescope.txt.
       Elle n'etait pas declaree ici : la modale tombait sur system-ui. */
    '@font-face{font-family:"AnnieZTS";src:url("/fonts/AnnieUseYourTelescope-Regular.ttf") format("truetype");',
    '  font-display:swap;}',

    /* =================================================================
       HABILLAGE MARINE — la modale est la premiere page que voit un
       visiteur non inscrit, et la seule qui decide s'il s'inscrit.
       Elle etait blanche, en system-ui, a 16 px : etrangere au site et
       illisible a bout de bras dans un gymnase.
       Plancher 20 px, champs et boutons >= 56 px, cibles >= 44 px.
       Le titre garde Luckiest Guy, comme avant. Bangers nulle part.
       ================================================================= */

    /* Overlay : voile marine, et Annie posee des la racine */
    '.zts-auth-overlay{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;',
    '  justify-content:center;background:rgba(6,23,38,.74);backdrop-filter:blur(14px);',
    '  -webkit-backdrop-filter:blur(14px);opacity:0;visibility:hidden;',
    '  transition:opacity .25s,visibility .25s;padding:20px;overflow-y:auto;',
    '  font-family:"AnnieZTS","Annie Use Your Telescope",cursive;font-size:20px;}',
    '.zts-auth-overlay.zts-open{opacity:1;visibility:visible}',
    /* input, button et select ne HERITENT pas de la police : il faut les
       nommer, sinon la moitie de la modale reste en system-ui. */
    '.zts-auth-overlay,.zts-auth-overlay *{font-family:"AnnieZTS","Annie Use Your Telescope",cursive;}',
    '.zts-auth-title,.zts-auth-cta,.zts-auth-btn-primary,.zts-auth-btn-google{',
    '  font-family:"ZTSDisplay","Luckiest Guy",cursive !important;}',

    /* Carte : marine en degrade, bordure noire epaisse, ombre dure decalee */
    '.zts-auth-modal{position:relative;width:100%;max-width:520px;',
    '  background:linear-gradient(163deg,#12879E 0%,#0C5C7D 28%,#0A3A5E 58%,#08243D 82%,#061726 100%);',
    '  border:4px solid #1A1A2E;border-radius:24px;box-shadow:8px 8px 0 #1A1A2E;',
    '  padding:32px 26px;text-align:center;overflow-y:auto;max-height:95vh;color:#E6F4FA;',
    '  transform:scale(.92);opacity:0;',
    '  transition:transform .3s cubic-bezier(.34,1.56,.64,1),opacity .25s;}',
    '.zts-auth-overlay.zts-open .zts-auth-modal{transform:scale(1);opacity:1}',

    /* Close — 48px, au-dessus de la cible de 44 */
    '.zts-auth-close{position:absolute;top:12px;right:12px;z-index:10;width:48px;height:48px;',
    '  border-radius:50%;border:3px solid #1A1A2E;background:#FFEA00;color:#1A1A2E;',
    '  font-size:26px;line-height:1;cursor:pointer;display:flex;align-items:center;',
    '  justify-content:center;transition:transform .15s;box-shadow:3px 3px 0 #1A1A2E;}',
    '.zts-auth-close:hover{transform:rotate(-10deg) scale(1.1)}',
    '.zts-auth-overlay.zts-wall .zts-auth-close{display:none}',

    /* Mascotte */
    '.zts-auth-header{padding:0 0 4px;}',
    '.zts-auth-header picture{display:inline-block;line-height:0;}',
    '.zts-auth-mascot{height:130px;width:auto;object-fit:contain;border:none;box-shadow:none;',
    '  filter:drop-shadow(0 4px 16px rgba(0,0,0,.35));margin-bottom:4px;}',

    /* Titre — blanc creme sur marine, ~15:1 */
    /* px et non rem : les apps hotes rebasent la taille racine (grille est a 10,75px), le titre tombait a 21px. */
    /* !important : l'ecran 2 porte un font-size en ligne (l.658) qui gagnait sur la feuille et ramenait le titre a 21px. Le style en ligne n'est pas touche : rien n'est retire du gabarit. */
    '.zts-auth-title{font-size:clamp(30px,6vw,42px) !important;color:#FFFEF7;margin:6px 0 10px;',
    '  line-height:1.15;letter-spacing:.5px;}',

    /* Sous-titre */
    '.zts-auth-sub{font-size:21px;color:#E6F4FA;margin:0 0 18px;line-height:1.5;}',

    /* Chiffres — cartes creme posees sur le marine, comme l accueil */
    '.zts-auth-stats{display:flex;justify-content:center;gap:10px;margin:0 0 20px;flex-wrap:wrap;}',
    '.zts-auth-stat{background:#FFFBE8;border:3px solid #1A1A2E;border-radius:12px;',
    '  padding:8px 14px;text-align:center;box-shadow:3px 3px 0 #1A1A2E;}',
    '.zts-auth-stat-num{font-size:24px;color:#1A1A2E;display:block;font-weight:700;}',
    '.zts-auth-stat-label{font-size:20px;color:#1A1A2E;display:block;}',

    /* CTA principal — cyan plein */
    /* Boutons en ZoneTotalSport.ttf. 18 px sur TOUS les boutons, decision du 3 septembre 2026 : l'ecran
       de connexion (« Content de te revoir ») debordait a 22-24 px. Seule
       exception au plancher de 20 px, et elle est assumee — la hauteur de
       bouton (>= 56 px) et la cible tactile ne bougent pas. Contour noir en text-shadow
       multidirectionnel par defaut — `-webkit-text-stroke` seul est centre sur
       le contour du glyphe et RONGE la lettre. La ou `paint-order` existe, le
       stroke passe DERRIERE le remplissage et ne ronge plus : on le reprend, et
       l'ombre dure decalee 3px reste dans les deux cas. */
    '.zts-auth-cta{width:100%;min-height:56px;padding:14px 18px;font-size:18px;',
    '  font-family:"ZTSDisplay","Luckiest Guy",cursive;color:#FFFEF7;text-shadow:-1.5px -1.5px 0 #1A1A2E,1.5px -1.5px 0 #1A1A2E,-1.5px 1.5px 0 #1A1A2E,1.5px 1.5px 0 #1A1A2E,0 -1.5px 0 #1A1A2E,0 1.5px 0 #1A1A2E,-1.5px 0 0 #1A1A2E,1.5px 0 0 #1A1A2E,3px 3px 0 #1A1A2E;',
    '  line-height:1.15;',
    '  letter-spacing:.3px;background:#00E5FF;',
    '  border:3px solid #1A1A2E;border-radius:14px;box-shadow:5px 5px 0 #1A1A2E;',
    '  cursor:pointer;transition:transform .15s,box-shadow .15s;}',
    '.zts-auth-cta:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 #1A1A2E}',
    '.zts-auth-cta:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #1A1A2E}',

    /* Lien de connexion */
    '.zts-auth-login-link{display:block;margin-top:16px;color:#E6F4FA;font-size:20px;}',
    '.zts-auth-login-link a,.zts-auth-login-link button{color:#00E5FF;font-weight:700;',
    '  text-decoration:underline;cursor:pointer;background:none;border:none;font-size:inherit;',
    '  padding:10px 6px;min-height:44px;display:inline-block;}',

    /* Preuve sociale */
    '.zts-auth-proof{margin-top:14px;font-size:20px;color:#C4E1EE;font-style:italic;}',

    /* Retour */
    '.zts-auth-back{background:none;border:none;color:#C4E1EE;font-size:20px;cursor:pointer;',
    '  padding:10px 6px;margin-bottom:8px;min-height:44px;font-weight:700;}',
    '.zts-auth-back:hover{color:#FFEA00}',

    /* Google — carte creme sur marine, >= 56px */
    '.zts-auth-btn-google{width:100%;min-height:56px;display:flex;align-items:center;',
    '  justify-content:center;gap:12px;padding:12px 16px;border:3px solid #1A1A2E;',
    '  border-radius:14px;background:#FFFEF7;color:#1A1A2E;font-size:18px;',
    /* Fond creme : un libelle clair y serait illisible meme cerne. Il reste
       fonce, sans contour, mais passe a la meme police que les autres. */
    '  font-family:"ZTSDisplay","Luckiest Guy",cursive;line-height:1.15;',
    '  letter-spacing:.2px;cursor:pointer;box-shadow:4px 4px 0 #1A1A2E;',
    '  transition:transform .15s,box-shadow .15s;}',
    '.zts-auth-btn-google:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #1A1A2E}',
    '.zts-auth-btn-google:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #1A1A2E}',
    '.zts-auth-btn-google svg{width:26px;height:26px;flex:none;}',
    '.zts-auth-btn-google:disabled{opacity:.5;pointer-events:none}',

    /* Separateur — clair, sinon il disparait sur le marine */
    '.zts-auth-or{display:flex;align-items:center;gap:12px;margin:16px 0;color:#C4E1EE;',
    '  font-weight:700;font-size:20px;}',
    '.zts-auth-or::before,.zts-auth-or::after{content:"";flex:1;height:3px;background:rgba(230,244,250,.35);}',

    /* Champs — creme sur marine : le texte saisi doit etre le plus lisible de la modale */
    '.zts-auth-field{margin-bottom:14px;text-align:left;}',
    '.zts-auth-field label{display:block;font-size:20px;color:#E6F4FA;margin-bottom:6px;',
    '  font-weight:700;letter-spacing:.2px;}',
    '.zts-auth-field input{width:100%;min-height:56px;padding:14px 16px;border-radius:12px;',
    '  border:3px solid #1A1A2E;background:#FFFEF7;color:#1A1A2E;font-size:22px;outline:none;',
    '  transition:border-color .2s,box-shadow .2s;box-sizing:border-box;}',
    '.zts-auth-field input:focus{border-color:#00E5FF;box-shadow:0 0 0 4px rgba(0,229,255,.35)}',
    '.zts-auth-field input::placeholder{color:#5A6B7A}',
    '.zts-auth-row{display:flex;gap:12px;}',
    '.zts-auth-row .zts-auth-field{flex:1;min-width:0;}',

    /* Soumettre — cyan plein, pas de degrade */
    '.zts-auth-btn-primary{width:100%;min-height:56px;padding:14px 18px;font-size:18px;',
    '  font-family:"ZTSDisplay","Luckiest Guy",cursive;color:#FFFEF7;text-shadow:-1.5px -1.5px 0 #1A1A2E,1.5px -1.5px 0 #1A1A2E,-1.5px 1.5px 0 #1A1A2E,1.5px 1.5px 0 #1A1A2E,0 -1.5px 0 #1A1A2E,0 1.5px 0 #1A1A2E,-1.5px 0 0 #1A1A2E,1.5px 0 0 #1A1A2E,3px 3px 0 #1A1A2E;',
    '  line-height:1.15;letter-spacing:.3px;background:#00E5FF;',
    '  border:3px solid #1A1A2E;border-radius:14px;box-shadow:5px 5px 0 #1A1A2E;',
    '  cursor:pointer;transition:transform .15s,box-shadow .15s;',
    '  display:flex;align-items:center;justify-content:center;gap:10px;}',
    '.zts-auth-btn-primary:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 #1A1A2E}',
    '.zts-auth-btn-primary:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #1A1A2E}',
    '.zts-auth-btn-primary:disabled{opacity:.5;pointer-events:none}',

    /* Liens secondaires */
    '.zts-auth-links{display:flex;justify-content:space-between;align-items:center;',
    '  margin-top:14px;flex-wrap:wrap;gap:8px;}',
    '.zts-auth-link{color:#00E5FF;font-size:20px;cursor:pointer;text-decoration:underline;',
    '  background:none;border:none;font-weight:700;padding:10px 6px;min-height:44px;}',
    '.zts-auth-link:hover{color:#FFEA00}',

    /* Erreur / succes — chips claires bordees de noir, texte fonce */
    '.zts-auth-error{background:#FFE4E6;border:3px solid #1A1A2E;color:#8A1020;border-radius:12px;',
    '  padding:12px 16px;margin-bottom:14px;font-size:21px;display:none;text-align:center;',
    '  font-weight:700;box-shadow:3px 3px 0 #1A1A2E;}',
    '.zts-auth-error.show{display:block;animation:ztsShake .5s ease}',
    '@keyframes ztsShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}',
    '.zts-auth-success{background:#D1FAE5;border:3px solid #1A1A2E;color:#0B5138;border-radius:12px;',
    '  padding:12px 16px;margin-bottom:14px;font-size:21px;display:none;text-align:center;',
    '  font-weight:700;box-shadow:3px 3px 0 #1A1A2E;}',
    '.zts-auth-success.show{display:block}',

    /* Spinner */
    '.zts-auth-spinner{display:inline-block;width:24px;height:24px;border:3px solid rgba(26,26,46,.25);',
    '  border-top-color:#1A1A2E;border-radius:50%;animation:ztsSpin .7s linear infinite;}',
    '@keyframes ztsSpin{to{transform:rotate(360deg)}}',
    '@supports(paint-order:stroke){.zts-auth-cta,.zts-auth-btn-primary{',
    '  -webkit-text-stroke:1.5px #1A1A2E;paint-order:stroke fill;text-shadow:3px 3px 0 #1A1A2E}}',

    /* User dropdown (header) */
    '.zts-user-dropdown{position:relative;display:inline-flex;}',
    /* PASTILLE MEMBRE — 3 septembre 2026.
       Elle etait une gelule (30px de rayon) en degrade VERT->cyan, avec un
       halo vert au survol : la seule forme et la seule couleur de l'en-tete
       a ne ressembler a rien d'autre. Elle prend la forme des boutons
       voisins — coins 14px, bordure noire epaisse, ombre dure decalee — et
       un degrade horizontal cyan -> jaune du site. Plus aucun vert dans
       l'en-tete. La police ne change pas ; la taille s'aligne sur les
       18px de la bande. */
    '.zts-user-btn{display:flex;align-items:center;gap:8px;padding:12px 17px;border-radius:14px;',
    '  min-height:52px;font-size:18px;border:3px solid #1A1A2E;box-shadow:4px 4px 0 #1A1A2E;',
    '  background:linear-gradient(90deg,#00E5FF 0%,#FFEA00 100%);color:#061726;',
    '  font-family:"ZTSDisplay","Luckiest Guy",cursive;letter-spacing:1px;',
    '  cursor:pointer;transition:transform .15s,box-shadow .15s;text-decoration:none;}',
    '.zts-user-btn:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #1A1A2E}',
    '.zts-user-btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #1A1A2E}',
    '.zts-user-menu{position:absolute;top:calc(100% + 8px);right:0;min-width:180px;',
    '  background:rgba(15,15,46,.95);border-radius:14px;border:2px solid rgba(255,215,0,.3);',
    '  backdrop-filter:blur(12px);padding:8px;opacity:0;visibility:hidden;transform:translateY(-8px);',
    '  transition:all .3s;z-index:100001;}',
    '.zts-user-dropdown.open .zts-user-menu{opacity:1;visibility:visible;transform:translateY(0)}',
    '.zts-user-menu-item{display:flex;align-items:center;gap:8px;padding:10px 14px;border-radius:10px;',
    '  color:#fff;font-family:"ZTSLucky","Luckiest Guy",cursive;font-size:.95rem;cursor:pointer;',
    '  transition:background .2s;border:none;background:none;width:100%;text-align:left;}',
    '.zts-user-menu-item:hover{background:rgba(255,255,255,.1)}',
    '.zts-user-menu-item.logout{color:#FF2A7A}',

    /* Responsive — 390px. Le plancher de 20px et la cible de 44px tiennent :
       seule la mascotte et le titre retrecissent. */
    '@media(max-width:500px){',
    '  .zts-auth-modal{padding:26px 16px;max-width:100%;border-radius:18px;box-shadow:5px 5px 0 #1A1A2E;}',
    '  .zts-auth-mascot{height:104px;}',
    '  .zts-auth-title{font-size:30px !important;}',
    '  .zts-auth-row{flex-direction:column;gap:0;}',
    /* 18px partout, y compris sous 500px : la coherence prime sur le confort de lecture d'un libelle de bouton, dont la hauteur ne bouge pas. */
    '  .zts-auth-cta,.zts-auth-btn-primary,.zts-auth-btn-google{font-size:18px;}',
    '  .zts-auth-close{top:8px;right:8px;}',
    '}'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('zts-auth-styles')) return;
    var s = document.createElement('style');
    s.id = 'zts-auth-styles';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ── Google SVG Icon ──
  var GOOGLE_SVG = '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>';

  // ── Preuve sociale (compteur d'abonnes) ──
  // ── La langue : UNE seule definition pour tout le tunnel ──
  // L'algorithme vit dans shared/zts.js (`ZTS.langue`) : ?lang= d'abord, puis
  // le choix memorise, puis la langue du navigateur. On l'appelle quand il est
  // la ; sinon on refait EXACTEMENT le meme calcul, parce que ce module peut
  // s'executer avant shared/zts.js selon l'ordre des balises de la page.
  //
  // Repondre « fr » par defaut serait plus court et FAUX : c'est precisement
  // ce qui faisait voir a un anglophone le cadenas dans une langue et le mur
  // dans l'autre, sur la meme page. Les trois versions divergentes de cette
  // fonction — localStorage seul, ZTS.getLang() seul, trois niveaux — sont
  // remplacees par ce bloc, identique dans chaque module.
  function lang() {
    try { if (window.ZTS && ZTS.langue) return ZTS.langue(); } catch (e) {}
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'en' || q === 'fr') return q;
    } catch (e) {}
    try {
      var saved = localStorage.getItem('zts_lang');
      if (saved === 'en' || saved === 'fr') return saved;
    } catch (e) {}
    return (navigator.language || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr';
  }

  // ── Les chaines de la modale, FR et EN ──
  // Elles vivent ICI et non dans shared/i18n/{fr,en}.json, contrairement au
  // reste du site : ce dictionnaire-la est charge par `fetch` depuis
  // shared/zts.js, donc de facon ASYNCHRONE. La modale, elle, se dessine sur
  // un clic — parfois avant que le fetch ait repondu, parfois sur une page ou
  // shared/zts.js arrive apres firebase-auth.js. Une modale a moitie traduite
  // serait pire que pas de traduction. Meme patron que zts-cadenas.js,
  // shared/zts-gate.js et shared/zts-unlock.js, deja bilingues ainsi.
  var T = {
    fr: {
      titreStep1: 'Débloque la Zone!',
      sousStep1: 'Ton compte gratuit te donne accès à <strong>1\u00a0439 jeux</strong>, <strong>~1\u00a0880 SAÉ</strong> et tous les outils pour l\'ÉPS, les camps et le service de garde.',
      statJeux: 'Jeux', statSae: 'SAÉ', statOutils: 'Outils', statGratuit: 'Gratuit',
      cta: 'Créer mon compte gratuit',
      dejaMembre: 'Déjà membre? ', connexion: 'Connexion',
      mascotteAlt: 'Le prof d\'éducation physique',
      googleSignup: ' S\'inscrire avec Google', googleLogin: ' Se connecter avec Google',
      ou: 'ou',
      prenom: 'Prénom', phPrenom: 'Ton prénom',
      nom: 'Nom', phNom: 'Ton nom',
      courriel: 'Courriel', phCourriel: 'ton@courriel.com',
      motDePasse: 'Mot de passe', phMdpLogin: 'Ton mot de passe', phMdpSignup: 'Minimum 6 caractères',
      afficherMdp: 'Afficher le mot de passe', masquerMdp: 'Masquer le mot de passe',
      soumettreLogin: 'Se connecter', soumettreSignup: 'Créer mon compte',
      mdpOublie: 'Mot de passe oublié?',
      versSignup: 'Pas de compte? Inscris-toi', versLogin: 'Déjà un compte? Connecte-toi',
      titreLogin: 'Content de te revoir!', titreSignup: 'Crée ton compte',
      retour: '← Retour', fermer: 'Fermer',
      champsManquants: 'Remplis tous les champs!',
      courrielPourReset: 'Entre ton courriel pour réinitialiser.',
      resetEnvoye: 'Courriel de réinitialisation envoyé!',
      echecGenerique: 'La connexion a échoué. Réessaie dans un instant.',
      pwaSafari: 'Ouvre zonetotalsport.ca dans Safari pour te connecter avec Google, ou crée un compte par courriel.',
      proofRepli: 'Rejoins les profs d\'ÉPS du Québec',
      proofChiffre: function (n) { return n + '+ enseignants utilisent la Zone'; }
    },
    en: {
      titreStep1: 'Unlock the Zone!',
      sousStep1: 'Your free account gives you <strong>1,439 games</strong>, <strong>~1,880 ready-to-teach PE units</strong> and every tool for PE, camps and after-school care.',
      statJeux: 'Games', statSae: 'Units', statOutils: 'Tools', statGratuit: 'Free',
      cta: 'Create my free account',
      dejaMembre: 'Already a member? ', connexion: 'Sign in',
      mascotteAlt: 'The physical education teacher',
      googleSignup: ' Sign up with Google', googleLogin: ' Sign in with Google',
      ou: 'or',
      prenom: 'First name', phPrenom: 'Your first name',
      nom: 'Last name', phNom: 'Your last name',
      courriel: 'Email', phCourriel: 'you@email.com',
      motDePasse: 'Password', phMdpLogin: 'Your password', phMdpSignup: 'At least 6 characters',
      afficherMdp: 'Show password', masquerMdp: 'Hide password',
      soumettreLogin: 'Sign in', soumettreSignup: 'Create my account',
      mdpOublie: 'Forgot your password?',
      versSignup: 'No account? Sign up', versLogin: 'Already have an account? Sign in',
      titreLogin: 'Good to see you again!', titreSignup: 'Create your account',
      retour: '← Back', fermer: 'Close',
      champsManquants: 'Fill in every field!',
      courrielPourReset: 'Enter your email to reset it.',
      resetEnvoye: 'Reset email sent!',
      echecGenerique: 'Sign-in failed. Try again in a moment.',
      pwaSafari: 'Open zonetotalsport.ca in Safari to sign in with Google, or create an account by email.',
      proofRepli: 'Join the PE teachers of Quebec',
      proofChiffre: function (n) { return n + '+ teachers use the Zone'; }
    }
  };
  function t() { return T[lang()] || T.fr; }

  // ── Preuve sociale : un chiffre reel, jamais fige ──
  // Le compte vient du worker `zone-subscriber-count`, jamais du code : un
  // nombre ecrit en dur vieillit en silence et ment un peu plus chaque jour.
  //
  // La version d'origine lancait UN fetch au chargement du script et gardait
  // le resultat dans une variable. Deux consequences : une modale ouverte
  // avant la reponse affichait le repli generique et ne se corrigeait jamais,
  // et une page laissee ouverte une journee servait le chiffre du matin.
  //
  // Ici : la valeur est relue A L'OUVERTURE, et le noeud est mis a jour quand
  // la reponse arrive — meme si elle arrive apres l'affichage. Le worker
  // repond `cache-control: max-age=300`, donc rouvrir la modale dix fois de
  // suite ne fait pas dix appels reseau : le navigateur sert son cache.
  var PROOF_URL = 'https://zone-subscriber-count.zts-ccd.workers.dev/';
  var _proofTotal = null;   // dernier chiffre connu, null tant qu'on n'a rien

  // Le texte se RECALCULE a chaque lecture : sinon un changement de langue
  // laisserait la phrase figee dans l'ancienne, comme le compteur du
  // generateur avant le 21 aout.
  function proofTexte() {
    var d = t();
    if (typeof _proofTotal !== 'number') return d.proofRepli;
    return d.proofChiffre(_proofTotal.toLocaleString(lang() === 'en' ? 'en-CA' : 'fr-CA'));
  }

  // Rafraichit `_proofText`, puis ecrit dans le noeud s'il est encore la.
  // Le garde-fou `total > 50` vient de la version d'origine : il evite
  // d'afficher « 3+ enseignants » si le worker repond un compte partiel.
  function rafraichitProof() {
    try {
      fetch(PROOF_URL)
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (!d || typeof d.total !== 'number' || d.total <= 50) return;
          _proofTotal = d.total;
          var n = document.getElementById('ztsProof');
          if (n) n.textContent = proofTexte();   // la modale peut avoir ete fermee
        })
        .catch(function() {});                 // le repli reste affiche
    } catch (e) {}
  }

  // ── Step 1 : proposition de valeur ──
  function buildStep1HTML() {
    var d = t();
    return '<div class="zts-auth-header">' +
      '<picture>' +
        '<source srcset="/shared/img/perso/perso_eps.webp" type="image/webp">' +
        '<img src="/shared/img/perso/perso_eps.png" alt="' + d.mascotteAlt + '" class="zts-auth-mascot">' +
      '</picture>' +
    '</div>' +
    '<h2 class="zts-auth-title">' + d.titreStep1 + '</h2>' +
    '<p class="zts-auth-sub">' + d.sousStep1 + '</p>' +
    '<div class="zts-auth-stats">' +
      '<div class="zts-auth-stat"><span class="zts-auth-stat-num">1\u00a0439</span><span class="zts-auth-stat-label">' + d.statJeux + '</span></div>' +
      '<div class="zts-auth-stat"><span class="zts-auth-stat-num">~1\u00a0880</span><span class="zts-auth-stat-label">' + d.statSae + '</span></div>' +
      '<div class="zts-auth-stat"><span class="zts-auth-stat-num">20+</span><span class="zts-auth-stat-label">' + d.statOutils + '</span></div>' +
      '<div class="zts-auth-stat"><span class="zts-auth-stat-num">0$</span><span class="zts-auth-stat-label">' + d.statGratuit + '</span></div>' +
    '</div>' +
    '<button class="zts-auth-cta" id="ztsAuthCta">' + d.cta + '</button>' +
    '<div class="zts-auth-login-link">' + d.dejaMembre + '<button id="ztsStep1Login">' + d.connexion + '</button></div>' +
    '<div class="zts-auth-proof" id="ztsProof"></div>';
  }

  // ── Step 2 : formulaire ──
  function buildStep2HTML(mode) {
    var d = t();
    var isLogin = mode === 'login';
    var html = '<div class="zts-auth-error" id="ztsAuthError"></div>' +
      '<div class="zts-auth-success" id="ztsAuthSuccess"></div>' +
      '<button class="zts-auth-btn-google" id="ztsGoogleBtn">' + GOOGLE_SVG +
        (isLogin ? d.googleLogin : d.googleSignup) + '</button>' +
      '<div class="zts-auth-or">' + d.ou + '</div>' +
      '<form id="ztsAuthForm" autocomplete="on">';
    if (!isLogin) {
      html += '<div class="zts-auth-row">' +
        '<div class="zts-auth-field"><label>' + d.prenom + '</label>' +
          '<input type="text" id="ztsFirstName" placeholder="' + d.phPrenom + '" required autocomplete="given-name"></div>' +
        '<div class="zts-auth-field"><label>' + d.nom + '</label>' +
          '<input type="text" id="ztsLastName" placeholder="' + d.phNom + '" required autocomplete="family-name"></div>' +
      '</div>';
    }
    html += '<div class="zts-auth-field"><label>' + d.courriel + '</label>' +
        '<input type="email" id="ztsEmail" placeholder="' + d.phCourriel + '" required autocomplete="email"></div>' +
      '<div class="zts-auth-field"><label>' + d.motDePasse + '</label>' +
        '<div style="position:relative">' +
          '<input type="password" id="ztsPassword" placeholder="' +
            (isLogin ? d.phMdpLogin : d.phMdpSignup) +
            '" required autocomplete="' + (isLogin ? 'current-password' : 'new-password') +
            '" minlength="6" style="padding-right:44px">' +
          '<button type="button" id="ztsTogglePw" aria-label="' + d.afficherMdp + '" ' +
            'style="position:absolute;right:8px;top:50%;transform:translateY(-50%);background:transparent;' +
            'border:none;cursor:pointer;padding:6px;font-size:1.25rem;color:#6b7280;line-height:1">&#x1F441;</button>' +
        '</div></div>' +
      '<button type="submit" class="zts-auth-btn-primary" id="ztsAuthSubmit">' +
        (isLogin ? d.soumettreLogin : d.soumettreSignup) + '</button>' +
    '</form>' +
    '<div class="zts-auth-links">';
    if (isLogin) {
      html += '<button class="zts-auth-link" id="ztsForgotPw">' + d.mdpOublie + '</button>' +
        '<button class="zts-auth-link" id="ztsToggleMode">' + d.versSignup + '</button>';
    } else {
      html += '<span></span>' +
        '<button class="zts-auth-link" id="ztsToggleMode">' + d.versLogin + '</button>';
    }
    html += '</div>';
    return html;
  }

  // ── Firebase Error Messages (FR) ──
  // Les 14 entrees de `main` sont conservees telles quelles cote FR — dont le
  // `null` de `auth/cancelled-popup-request`, qui TAIT volontairement l'erreur
  // levee quand le visiteur ouvre deux fenetres de connexion.
  var ERROR_MESSAGES = {
    fr: {
      'auth/invalid-email': 'Adresse courriel invalide.',
      'auth/user-disabled': 'Ce compte a été désactivé.',
      'auth/user-not-found': 'Aucun compte trouvé avec ce courriel.',
      'auth/wrong-password': 'Mot de passe incorrect.',
      'auth/email-already-in-use': 'Ce courriel est déjà utilisé. Essaie de te connecter!',
      'auth/weak-password': 'Le mot de passe doit avoir au moins 6 caractères.',
      'auth/too-many-requests': 'Trop de tentatives. Réessaie dans quelques minutes.',
      'auth/cancelled-popup-request': null,
      'auth/popup-closed-by-user': 'Connexion annulée.',
      'auth/popup-blocked': 'Ton navigateur a bloqué la fenêtre de connexion. Autorise les fenêtres surgissantes, puis réessaie.',
      'auth/network-request-failed': 'Connexion réseau perdue. Réessaie.',
      'auth/unauthorized-domain': 'Domaine non autorisé. Contacte le support.',
      'auth/invalid-credential': 'Courriel ou mot de passe incorrect.',
      'auth/missing-password': 'Entre ton mot de passe.'
    },
    en: {
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with that email.',
      'auth/wrong-password': 'Wrong password.',
      'auth/email-already-in-use': 'That email is already in use. Try signing in!',
      'auth/weak-password': 'Your password needs at least 6 characters.',
      'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
      'auth/cancelled-popup-request': null,
      'auth/popup-closed-by-user': 'Sign-in cancelled.',
      'auth/popup-blocked': 'Your browser blocked the sign-in window. Allow pop-ups, then try again.',
      'auth/network-request-failed': 'Network connection lost. Try again.',
      'auth/unauthorized-domain': 'Domain not allowed. Contact support.',
      'auth/invalid-credential': 'Wrong email or password.',
      'auth/missing-password': 'Enter your password.'
    }
  };

  function getErrorMsg(code) {
    console.warn('[ZTS Auth] Error code:', code);
    var table = ERROR_MESSAGES[lang()] || ERROR_MESSAGES.fr;
    var msg = table[code];
    // `null` est une valeur VOULUE : ne rien afficher. `undefined` veut dire
    // « code inconnu » et tombe sur le message generique plus bas. Les
    // distinguer est ce qui garde `auth/cancelled-popup-request` silencieux.
    if (msg === null) return null;
    return msg || t().echecGenerique;
  }

  // ── Modal state ──
  var _currentMode = 'login';
  var _wallMode = false;

  // ── Show Modal ──
  function showModal(mode, opts) {
    opts = opts || {};
    _currentMode = mode;
    _wallMode = !!opts.wall;

    // Remove existing
    var existing = document.getElementById('ztsAuthOverlay');
    if (existing) existing.remove();

    // Create overlay
    var overlay = document.createElement('div');
    overlay.className = 'zts-auth-overlay' + (_wallMode ? ' zts-wall' : '');
    overlay.id = 'ztsAuthOverlay';

    var modal = document.createElement('div');
    modal.className = 'zts-auth-modal';

    // Close button (hidden in wall mode via CSS)
    var closeBtn = document.createElement('button');
    closeBtn.className = 'zts-auth-close';
    closeBtn.id = 'ztsAuthClose';
    closeBtn.setAttribute('aria-label', t().fermer);
    closeBtn.innerHTML = '&times;';
    modal.appendChild(closeBtn);

    // Content container
    var content = document.createElement('div');
    content.id = 'ztsAuthContent';
    modal.appendChild(content);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // ── Quel ecran ouvrir ──
    // Le mur plein ecran demande deja le fournisseur AVANT d'appeler
    // `ztsShowSignup({provider:'google'})`. Jusqu'ici la modale jetait ce
    // choix et rouvrait sur l'ecran argumentaire : le visiteur devait
    // recliquer « Google », puis choisir son compte. Trois clics pour une
    // intention exprimee au premier.
    //
    // Quand le fournisseur est connu, on saute donc l'argumentaire — il a
    // deja fait son travail, c'est lui qui a produit le clic — et on ouvre
    // sur le formulaire, qui sert de repli VISIBLE si la fenetre Google est
    // bloquee ou refermee.
    var googleDemande = (mode === 'signup' && opts.provider === 'google');

    if (mode !== 'signup') {
      renderStep2(content, 'login');
    } else if (googleDemande) {
      renderStep2(content, 'signup');
    } else {
      renderStep1(content);
    }

    // ── Google, dans le MEME geste de clic ──
    // signInWithPopup doit partir du geste utilisateur, sinon le navigateur
    // bloque la fenetre. On est encore dans le handler de clic du mur : cet
    // appel est donc synchrone, sans `await` ni `setTimeout` avant lui.
    //
    // Si le SDK n'est pas encore charge, on ne declenche RIEN : un appel
    // differe perdrait le geste et la fenetre serait bloquee. Le formulaire
    // est deja affiche avec son bouton Google — le visiteur clique une fois,
    // comme avant ce commit. Jamais pire, souvent mieux.
    if (googleDemande && _authReady && typeof firebase !== 'undefined' && firebase.auth) {
      handleGoogle();
    }

    // Open animation
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        overlay.classList.add('zts-open');
      });
    });
    setTimeout(function() {
      if (overlay && overlay.parentNode) overlay.classList.add('zts-open');
    }, 60);

    // Close handlers (only if not wall)
    if (!_wallMode) {
      closeBtn.addEventListener('click', function() {
        if (root.ztsTrackFunnel) root.ztsTrackFunnel('locked_close', { source: 'auth_modal' });
        closeModal();
      });
      overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
          if (root.ztsTrackFunnel) root.ztsTrackFunnel('locked_close', { source: 'auth_modal' });
          closeModal();
        }
      });
      document.addEventListener('keydown', _escHandler);
    }
  }

  function renderStep1(container) {
    container.innerHTML = buildStep1HTML();

    // Preuve sociale : on affiche ce qu'on a deja, puis on redemande.
    var proof = document.getElementById('ztsProof');
    if (proof) proof.textContent = proofTexte();
    rafraichitProof();

    // AUCUN `locked_click_signup` ICI. La version d'origine en emettait un
    // (`cta_source: 'step1_cta'`), ce qui aurait ete un CINQUIEME emetteur et
    // aurait refait, dans la modale, le double comptage retire du site le
    // 13 aout 2026.
    //
    // Les quatre chemins qui ouvrent cette modale emettent DEJA l'evenement
    // avant de l'ouvrir : zts-lock.js:89 (en repli), zts-locked-fullscreen.js:105,
    // zts-lock-page.js:146, shared/zts-unlock.js:98. Passer de l'ecran
    // argumentaire au formulaire n'est pas une nouvelle intention, c'est la
    // meme qui avance d'un ecran — la compter deux fois gonflerait le
    // numerateur du tunnel sans une inscription de plus.
    //
    // Si on veut un jour mesurer la conversion de l'ecran argumentaire lui-meme,
    // c'est un evenement DISTINCT qu'il faut, pas celui-ci.
    document.getElementById('ztsAuthCta').addEventListener('click', function() {
      renderStep2(container, 'signup');
    });

    // Login link → login form
    document.getElementById('ztsStep1Login').addEventListener('click', function() {
      renderStep2(container, 'login');
    });
  }

  function renderStep2(container, mode) {
    _currentMode = mode;
    var isLogin = mode === 'login';

    // Back button (only for signup mode, to go back to step 1)
    var backHTML = !isLogin
      ? '<button class="zts-auth-back" id="ztsBack">' + t().retour + '</button>'
      : '';

    var titleHTML = '<h2 class="zts-auth-title" style="font-size:clamp(1.2rem,3.5vw,1.5rem);margin:0 0 14px;">' +
      (isLogin ? t().titreLogin : t().titreSignup) + '</h2>';

    container.innerHTML = backHTML + titleHTML + buildStep2HTML(mode);

    // Back to step 1
    var backBtn = document.getElementById('ztsBack');
    if (backBtn) {
      backBtn.addEventListener('click', function() { renderStep1(container); });
    }

    // Form submit
    document.getElementById('ztsAuthForm').addEventListener('submit', function(e) {
      e.preventDefault();
      if (mode === 'login') handleLogin(); else handleSignup();
    });

    // Google button — AUCUN await avant signInWithPopup
    document.getElementById('ztsGoogleBtn').addEventListener('click', handleGoogle);

    // Toggle mode
    var toggleBtn = document.getElementById('ztsToggleMode');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        renderStep2(container, isLogin ? 'signup' : 'login');
      });
    }

    // Forgot password
    var forgotBtn = document.getElementById('ztsForgotPw');
    if (forgotBtn) forgotBtn.addEventListener('click', handleForgotPassword);

    // Toggle password visibility
    var togglePwBtn = document.getElementById('ztsTogglePw');
    if (togglePwBtn) {
      togglePwBtn.addEventListener('click', function() {
        var pw = document.getElementById('ztsPassword');
        if (!pw) return;
        if (pw.type === 'password') {
          pw.type = 'text';
          togglePwBtn.innerHTML = '&#x1F648;';
          togglePwBtn.setAttribute('aria-label', t().masquerMdp);
        } else {
          pw.type = 'password';
          togglePwBtn.innerHTML = '&#x1F441;';
          togglePwBtn.setAttribute('aria-label', t().afficherMdp);
        }
      });
    }

    // Pre-fill email
    try {
      var prefill = sessionStorage.getItem('zts_signup_prefill_email');
      if (prefill) {
        var emailInput = document.getElementById('ztsEmail');
        if (emailInput) emailInput.value = prefill;
        sessionStorage.removeItem('zts_signup_prefill_email');
      }
    } catch (e) {}
  }

  function closeModal() {
    // Wall mode : ne ferme que si l'utilisateur est authentifie
    if (_wallMode && !_user) return;
    var overlay = document.getElementById('ztsAuthOverlay');
    if (!overlay) return;
    // Protected mode redirect
    if (_protectedMode && _user && _protectedHref) {
      var href = _protectedHref;
      _protectedMode = false;
      _protectedHref = null;
      _wallMode = false;
      window.location.href = href;
      return;
    }
    _protectedMode = false;
    _protectedHref = null;
    _wallMode = false;
    overlay.classList.remove('zts-open');
    document.removeEventListener('keydown', _escHandler);
    setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 500);
  }

  function _escHandler(e) {
    if (e.key === 'Escape' && !_wallMode) closeModal();
  }

  // ── Show Error/Success ──
  function showError(msg) {
    var el = document.getElementById('ztsAuthError');
    var suc = document.getElementById('ztsAuthSuccess');
    if (suc) { suc.classList.remove('show'); suc.textContent = ''; }
    if (el) { el.textContent = msg; el.classList.add('show'); }
  }

  function showSuccess(msg) {
    var el = document.getElementById('ztsAuthSuccess');
    var err = document.getElementById('ztsAuthError');
    if (err) { err.classList.remove('show'); err.textContent = ''; }
    if (el) { el.textContent = msg; el.classList.add('show'); }
  }

  function setLoading(loading) {
    var btn = document.getElementById('ztsAuthSubmit');
    var gBtn = document.getElementById('ztsGoogleBtn');
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = '<span class="zts-auth-spinner"></span>';
      if (gBtn) gBtn.disabled = true;
    } else {
      btn.disabled = false;
      btn.innerHTML = _currentMode === 'login' ? t().soumettreLogin : t().soumettreSignup;
      if (gBtn) gBtn.disabled = false;
    }
  }

  // ── Auth Handlers ──
  function handleLogin() {
    var email = document.getElementById('ztsEmail').value.trim();
    var password = document.getElementById('ztsPassword').value;
    if (!email || !password) { showError(t().champsManquants); return; }
    setLoading(true);
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(function(result) {
        if (root.ztsTrackLogin) root.ztsTrackLogin('email', result.user.uid);
        if (root.ztsNotifyLogin) root.ztsNotifyLogin(result.user);
        closeModal();
      })
      .catch(function(err) {
        console.error('[ZTS Auth] Full error:', err);
        showError(getErrorMsg(err.code) || ('Erreur: ' + (err.message || err)));
        setLoading(false);
      });
  }

  // signup_complete : pose un flag sessionStorage SYNCHRONE (survit a la
  // redirection vers /bienvenue.html), consomme par zts-funnel.js a l'arrivee.
  function fireSignupComplete(method) {
    var signup_source = 'direct';
    var signup_slug = null;
    try {
      signup_source = sessionStorage.getItem('zts_signup_source') || 'direct';
      // LE SLUG N'APPARTIENT QU'AUX DEMI-MURS, ET C'EST UNE GARDE, PAS UN DETAIL.
      // Les trois autres emetteurs ('locked_card', 'popup', 'newsletter_popup')
      // posent une source sans jamais poser de slug. Sans ce test, un slug
      // survivant d'un demi-mur abandonne se collerait a l'inscription suivante :
      // visiteur qui clique le CTA de catastrophes-ordinaires, n'acheve pas,
      // navigue, puis s'inscrit dix minutes plus tard par le pop-up newsletter
      // -> le pop-up ecrase la source, mais le slug de l'article survivrait et
      // crediterait une conversion que l'article n'a pas produite. C'est
      // precisement le chiffre qui decide lesquels des 27 articles meritent un
      // frere : il ne peut pas etre gonfle.
      if (signup_source.indexOf('demi_mur_') === 0) {
        signup_slug = sessionStorage.getItem('zts_signup_slug') || null;
      }
      // LES DEUX CLES SE CONSOMMENT DANS TOUS LES CAS, y compris quand le slug
      // vient d'etre ignore. Un seul point de verite pour le nettoyage : un
      // quatrieme emetteur ajoute plus tard n'a rien a savoir de cette regle,
      // il lui suffit de poser sa source.
      sessionStorage.removeItem('zts_signup_source');
      sessionStorage.removeItem('zts_signup_slug');
    } catch (e) {}
    try {
      sessionStorage.setItem('zts_signup_pending', JSON.stringify({
        method: method,
        signup_source: signup_source,
        signup_slug: signup_slug,
        ts: Date.now()
      }));
    } catch (e) {}
  }

  // Finalisation unifiee : un seul point d'entree pour toutes les inscriptions.
  // INVARIANT : fireSignupComplete() est synchrone et DOIT etre appele AVANT
  // window.location.href — jamais dans un .then() separe.
  function finaliserInscription(result, method) {
    if (!result || !result.user) return;
    var isNew = (result.additionalUserInfo && result.additionalUserInfo.isNewUser)
      || (result.user.metadata.creationTime === result.user.metadata.lastSignInTime);
    if (isNew) {
      if (root.ztsTrackSignup) root.ztsTrackSignup(method, result.user.uid);
      fireSignupComplete(method);   // synchrone — sessionStorage
      if (root.ztsNotifySignup) root.ztsNotifySignup(result.user);
      window.location.href = '/bienvenue.html';
    } else {
      if (root.ztsTrackLogin) root.ztsTrackLogin(method, result.user.uid);
      if (root.ztsNotifyLogin) root.ztsNotifyLogin(result.user);
      closeModal();
    }
  }

  function handleSignup() {
    var firstName = (document.getElementById('ztsFirstName') || {}).value || '';
    var lastName = (document.getElementById('ztsLastName') || {}).value || '';
    var email = document.getElementById('ztsEmail').value.trim();
    var password = document.getElementById('ztsPassword').value;
    if (!firstName.trim() || !lastName.trim() || !email || !password) {
      showError(t().champsManquants); return;
    }
    setLoading(true);
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(function(result) {
        return result.user.updateProfile({
          displayName: firstName.trim() + ' ' + lastName.trim()
        }).then(function() { return result; });
      })
      .then(function(result) {
        finaliserInscription(result, 'email');
      })
      .catch(function(err) { showError(getErrorMsg(err.code)); setLoading(false); });
  }

  function handleGoogle() {
    // Mode PWA standalone (ajout ecran accueil iOS) : pas de fenetre dispo
    if (window.navigator.standalone === true) {
      showError(t().pwaSafari);
      return;
    }
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setLoading(true);
    // AUCUN await avant signInWithPopup — appel synchrone dans le handler de clic
    firebase.auth().signInWithPopup(provider)
      .then(function(result) {
        finaliserInscription(result, 'google');
      })
      .catch(function(err) {
        var msg = getErrorMsg(err.code);
        if (msg) showError(msg);
        console.warn('[ZTS Auth] Google:', err.code, err.message);
        setLoading(false);
      });
  }

  function handleForgotPassword() {
    var email = document.getElementById('ztsEmail').value.trim();
    if (!email) { showError(t().courrielPourReset); return; }
    firebase.auth().sendPasswordResetEmail(email)
      .then(function() { showSuccess(t().resetEnvoye); })
      .catch(function(err) { showError(getErrorMsg(err.code)); });
  }

  // ── UI Update on Auth State ──
  function updateUI(user) {
    var loginBtn = document.getElementById('zts-login-btn');
    if (!loginBtn) return;

    if (user) {
      var displayName = user.displayName || user.email.split('@')[0];
      var firstName = displayName.split(' ')[0];

      var dropdown = document.createElement('div');
      dropdown.className = 'zts-user-dropdown';
      dropdown.id = 'zts-login-btn';
      dropdown.innerHTML =
        '<button class="zts-user-btn" id="ztsUserToggle">' +
          '<span style="font-size:1.2em">&#x1F44B;</span> Salut, ' + firstName + '!' +
        '</button>' +
        '<div class="zts-user-menu">' +
          '<button class="zts-user-menu-item" onclick="window.ztsShowProfile&&window.ztsShowProfile()">&#x1F464; Mon profil</button>' +
          '<button class="zts-user-menu-item logout" onclick="window.ztsLogout()">&#x1F6AA; Déconnexion</button>' +
        '</div>';

      loginBtn.replaceWith(dropdown);

      var toggle = document.getElementById('ztsUserToggle');
      if (toggle) {
        toggle.addEventListener('click', function(e) {
          e.stopPropagation();
          dropdown.classList.toggle('open');
        });
        document.addEventListener('click', function() { dropdown.classList.remove('open'); });
      }
    } else {
      var existing = document.getElementById('zts-login-btn');
      if (existing && existing.classList.contains('zts-user-dropdown')) {
        var btn = document.createElement('a');
        btn.href = '#';
        btn.className = 'wix-nav-btn btn-login-nav';
        btn.id = 'zts-login-btn';
        btn.setAttribute('data-auth', 'login');
        btn.style.cssText = 'background:linear-gradient(135deg,#FF6B00,#FF9500);color:white;border:none;';
        btn.innerHTML = '<i data-lucide="user" class="w-3.5 h-3.5"></i> <span>Connexion</span>';
        btn.addEventListener('click', function(e) { e.preventDefault(); showModal('login'); });
        existing.replaceWith(btn);
        if (typeof lucide !== 'undefined') lucide.createIcons();
      }
    }
  }

  // ── Protected links (non-closeable modal) ──
  var _protectedMode = false;
  var _protectedHref = null;

  function bindProtectedLinks() {
    document.querySelectorAll('[data-protected="true"]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        if (!_user) {
          e.preventDefault();
          e.stopPropagation();
          _protectedMode = true;
          _protectedHref = el.getAttribute('href') || el.dataset.href || null;
          showModal('signup');
        }
      });
    });
  }

  // ── Data-attribute bindings ──
  function bindDataAttributes() {
    document.querySelectorAll('[data-auth="login"]').forEach(function(el) {
      el.addEventListener('click', function(e) { e.preventDefault(); showModal('login'); });
    });
    document.querySelectorAll('[data-auth="signup"]').forEach(function(el) {
      el.addEventListener('click', function(e) { e.preventDefault(); showModal('signup'); });
    });
    document.querySelectorAll('[data-auth="logout"]').forEach(function(el) {
      el.addEventListener('click', function(e) {
        e.preventDefault();
        root.ztsLogout();
      });
    });
  }

  // ── Global API ──
  // Changement de langue pendant que la modale est ouverte : on redessine
  // l'ecran courant. Sans ca, le visiteur qui bascule FR/EN garde une modale
  // dans l'ancienne langue jusqu'a la fermer — meme patron que
  // zts-cadenas.js, zts-gate.js et zts-unlock.js.
  document.addEventListener('zts:langchange', function () {
    var overlay = document.getElementById('ztsAuthOverlay');
    if (!overlay) return;
    var content = document.getElementById('ztsAuthContent');
    if (!content) return;
    if (document.getElementById('ztsAuthCta')) renderStep1(content);
    else renderStep2(content, _currentMode);
  });

  root.ztsShowLogin = function() { showModal('login'); };
  root.ztsShowSignup = function(opts) { showModal('signup', opts); };

  // Wall = mur bloquant pour les apps gatees. Non fermable, se retire
  // automatiquement quand l'utilisateur s'authentifie.
  root.ztsShowWall = function() {
    // Deja authentifie → pas de mur
    if (_authReady && _user) return;
    showModal('signup', { wall: true });
    // Auto-close quand l'auth reussit
    root.ztsOnAuth(function(user) {
      if (user && _wallMode) {
        _wallMode = false;
        var overlay = document.getElementById('ztsAuthOverlay');
        if (overlay) {
          overlay.classList.remove('zts-wall', 'zts-open');
          setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 400);
        }
      }
    });
  };

  root.ztsLogout = function() {
    function done() {
      try {
        sessionStorage.removeItem('zts_signup_pending');
        sessionStorage.removeItem('zts_signup_source');
        sessionStorage.removeItem('zts_signup_slug');
      } catch (e) {}
      window.location.href = '/';
    }
    if (typeof firebase === 'undefined' || !firebase.auth) { done(); return; }
    firebase.auth().signOut()
      .catch(function(e) { console.error('[ZTS Auth] signOut:', e); })
      .then(done);
  };
  root.ztsGetUser = function() { return _user; };
  root.ztsSetProtected = function(url) {
    _protectedMode = true;
    _protectedHref = url;
  };
  root.ztsOnAuth = function(cb) {
    _onAuthCallbacks.push(cb);
    if (_authReady) cb(_user);
  };

  // ── Init on DOM ready ──
  function init() {
    injectStyles();
    initFirebase();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        bindDataAttributes();
        bindProtectedLinks();
      });
    } else {
      bindDataAttributes();
      bindProtectedLinks();
    }
    // Header/footer partages injectes async par zts.js → re-lier apres injection
    document.addEventListener('zts:ready', function() {
      bindDataAttributes();
      bindProtectedLinks();
      if (_authReady) updateUI(_user);
    });
  }

  init();

})(window);
