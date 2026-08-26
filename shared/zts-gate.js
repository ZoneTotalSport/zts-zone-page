/**
 * ZTS Gate — barrière d'inscription "soft" sur les outils (/apps/*).
 * Le visiteur doit créer un compte gratuit (Google ou courriel) pour utiliser un outil.
 * Home + hubs restent libres (SEO). Firebase compat SDK, projet zone-total-sport.
 *
 * Brancher : <script src="../../shared/zts-gate.js"></script> après shared/zts.js.
 * NB : pour la prod, ajouter le domaine du site dans Firebase Console →
 *      Authentication → Settings → Authorized domains (sinon le popup Google est bloqué).
 */
(function () {
  'use strict';
  var firebaseConfig = {
    apiKey: "AIzaSyBoBxVP6g_ObKIJJ1jkviNFQ-wpJoWdjbA",
    authDomain: "zone-total-sport.firebaseapp.com",
    databaseURL: "https://zone-total-sport-default-rtdb.firebaseio.com",
    projectId: "zone-total-sport",
    storageBucket: "zone-total-sport.firebasestorage.app",
    messagingSenderId: "681359040455",
    appId: "1:681359040455:web:80c9f584583824cc8cc3e2",
    measurementId: "G-09S9R1HJ94"
  };

  // chemin racine relatif (les apps sont à /apps/<nom>/ → ../../)
  var ROOT = '../../';

  var T = {
    fr: {
      badge: '🔓 Accès gratuit', title: 'Crée ton compte gratuit',
      sub: 'Inscris-toi pour débloquer cet outil et les 20+ autres. 100 % gratuit, pour toujours.',
      google: 'Continuer avec Google', or: 'ou',
      email: 'Ton courriel', pass: 'Mot de passe (6+ caractères)',
      signup: 'Créer mon compte', login: 'Se connecter',
      toLogin: 'Déjà membre? Se connecter', toSignup: 'Nouveau? Créer un compte gratuit',
      home: '← Retour à l’accueil', loading: 'Vérification…',
      bye: 'Déconnexion', hi: 'Connecté',
      errMail: 'Courriel ou mot de passe invalide.', errUsed: 'Ce courriel a déjà un compte — connecte-toi.',
      errPass: 'Mot de passe trop court (min. 6 caractères).', errGoogle: 'Connexion Google annulée ou bloquée.',
      errNet: 'Connexion impossible. Réessaie.', retry: 'Réessayer'
    },
    en: {
      badge: '🔓 Free access', title: 'Create your free account',
      sub: 'Sign up to unlock this tool and 20+ others. 100% free, forever.',
      google: 'Continue with Google', or: 'or',
      email: 'Your email', pass: 'Password (6+ characters)',
      signup: 'Create my account', login: 'Sign in',
      toLogin: 'Already a member? Sign in', toSignup: 'New? Create a free account',
      home: '← Back to home', loading: 'Checking…',
      bye: 'Sign out', hi: 'Signed in',
      errMail: 'Invalid email or password.', errUsed: 'This email already has an account — sign in.',
      errPass: 'Password too short (min. 6 characters).', errGoogle: 'Google sign-in cancelled or blocked.',
      errNet: 'Connection failed. Try again.', retry: 'Retry'
    }
  };
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
  function t() { return T[lang()]; }

  var mode = 'signup'; // 'signup' | 'login'
  var ready = false;
  var leaving = false;  // deconnexion en cours : ne pas redessiner le mur

  // Le drapeau `zts_signed_out`, partage avec firebase-auth.js, a ete retire
  // le 2026-08-12 avec le chemin redirect : son unique lecteur etait le bloc
  // getRedirectResult de boot(). Ne pas le reintroduire sans lecteur.

  function injectStyles() {
    if (document.getElementById('zts-gate-css')) return;
    var s = document.createElement('style');
    s.id = 'zts-gate-css';
    s.textContent = [
      '#zts-gate{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;',
      'padding:20px;background:rgba(12,22,48,.86);backdrop-filter:blur(4px);font-family:var(--font-body,system-ui);}',
      '#zts-gate[hidden]{display:none;}',
      /* LA COULEUR DU TEXTE EST OBLIGATOIRE ICI. Le shell pose
         `color:#E6F4FA` sur <body> — juste pour son fond marine, mais
         herite par tout descendant qui n'en declare pas. Cette carte a un
         fond BLANC : sans `color`, son titre et son sous-titre sortaient en
         bleu tres pale sur blanc, contraste 1,12:1. Sur les 42 apps
         verrouillees, c'est le premier ecran que voit un visiteur. */
      '.ztg-card{width:100%;max-width:420px;background:#fff;color:#1a1a1a;border:var(--bord,3px solid #1a1a1a);',
      'border-radius:var(--r-3,22px);box-shadow:var(--ombre,6px 6px 0 #1a1a1a);padding:26px 24px;text-align:center;}',
      '.ztg-badge{display:inline-block;font-family:var(--font-fun,inherit);font-weight:700;font-size:13px;',
      'background:var(--metier,#19B5C9);border:2px solid #1a1a1a;border-radius:999px;padding:3px 12px;margin-bottom:10px;}',
      '.ztg-card h2{font-family:var(--font-impact,Luckiest Guy,system-ui);font-size:clamp(22px,5vw,30px);margin:.2em 0;}',
      '.ztg-sub{font-weight:600;opacity:.85;font-size:15px;margin:0 0 18px;}',
      '.ztg-g{display:flex;align-items:center;justify-content:center;gap:10px;width:100%;cursor:pointer;',
      'font-family:var(--font-impact,system-ui);font-size:17px;padding:12px;border:var(--bord,3px solid #1a1a1a);',
      'border-radius:999px;background:#fff;box-shadow:var(--ombre,4px 4px 0 #1a1a1a);}',
      '.ztg-g:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #1a1a1a;}',
      '.ztg-or{display:flex;align-items:center;gap:10px;margin:16px 0;color:#777;font-weight:700;font-size:13px;}',
      '.ztg-or::before,.ztg-or::after{content:"";flex:1;height:2px;background:#e3e3ea;}',
      '.ztg-in{width:100%;box-sizing:border-box;font-family:var(--font-body,system-ui);font-weight:600;font-size:15px;',
      'padding:12px 14px;border:2px solid #1a1a1a;border-radius:12px;margin-bottom:10px;}',
      '.ztg-sub-btn{width:100%;cursor:pointer;font-family:var(--font-impact,system-ui);font-size:18px;padding:13px;',
      'border:var(--bord,3px solid #1a1a1a);border-radius:999px;background:var(--metier,#19B5C9);color:#1a1a1a;',
      'box-shadow:var(--ombre,4px 4px 0 #1a1a1a);}',
      '.ztg-sub-btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #1a1a1a;}',
      '.ztg-toggle{display:inline-block;margin-top:14px;background:none;border:0;cursor:pointer;font-weight:700;',
      'text-decoration:underline;color:#19527a;font-size:14px;}',
      '.ztg-home{display:inline-block;margin-top:8px;color:#666;font-weight:700;font-size:13px;text-decoration:none;}',
      '.ztg-err{color:#c8102e;font-weight:700;font-size:14px;margin:6px 0 0;min-height:1.2em;}',
      '.ztg-busy{opacity:.6;pointer-events:none;}',
      '.ztg-out{position:fixed;right:12px;bottom:12px;z-index:9998;font-family:var(--font-fun,system-ui);font-weight:700;',
      'font-size:13px;background:#fff;border:2px solid #1a1a1a;border-radius:999px;padding:6px 12px;cursor:pointer;box-shadow:2px 2px 0 #1a1a1a;}'
    ].join('');
    document.head.appendChild(s);
  }

  function el(id) { return document.getElementById(id); }

  function render() {
    var L = t();
    var g = el('zts-gate');
    if (!g) return;
    g.innerHTML =
      '<div class="ztg-card" role="dialog" aria-modal="true" aria-label="' + L.title + '">' +
        '<span class="ztg-badge">' + L.badge + '</span>' +
        '<h2>' + L.title + '</h2>' +
        '<p class="ztg-sub">' + L.sub + '</p>' +
        '<button class="ztg-g" id="ztg-google"><span style="font-size:20px;">🇬</span>' + L.google + '</button>' +
        '<div class="ztg-or">' + L.or + '</div>' +
        '<input class="ztg-in" id="ztg-email" type="email" autocomplete="email" placeholder="' + L.email + '">' +
        '<input class="ztg-in" id="ztg-pass" type="password" autocomplete="current-password" placeholder="' + L.pass + '">' +
        '<button class="ztg-sub-btn" id="ztg-submit">' + (mode === 'signup' ? L.signup : L.login) + '</button>' +
        '<p class="ztg-err" id="ztg-err"></p>' +
        '<button class="ztg-toggle" id="ztg-toggle">' + (mode === 'signup' ? L.toLogin : L.toSignup) + '</button><br>' +
        '<a class="ztg-home" href="' + ROOT + 'index.html">' + L.home + '</a>' +
      '</div>';
    el('ztg-google').addEventListener('click', doGoogle);
    el('ztg-submit').addEventListener('click', doEmail);
    el('ztg-pass').addEventListener('keydown', function (e) { if (e.key === 'Enter') doEmail(); });
    el('ztg-toggle').addEventListener('click', function () { mode = (mode === 'signup') ? 'login' : 'signup'; render(); });
  }

  function showErr(msg) { var e = el('ztg-err'); if (e) e.textContent = msg || ''; }
  function busy(on) { var c = document.querySelector('#zts-gate .ztg-card'); if (c) c.classList.toggle('ztg-busy', !!on); }

  function messageErreurAuth(code) {
    switch (code) {
      case 'auth/cancelled-popup-request': return null;
      case 'auth/popup-closed-by-user': return 'Connexion annulée.';
      case 'auth/popup-blocked': return 'Ton navigateur a bloqué la fenêtre de connexion. Autorise les fenêtres surgissantes, puis réessaie.';
      case 'auth/network-request-failed': return 'Connexion réseau perdue. Réessaie.';
      case 'auth/unauthorized-domain': return 'Domaine non autorisé. Contacte le support.';
      default: return t().errGoogle;
    }
  }

  function doGoogle() {
    // Mode PWA standalone (ajout ecran accueil iOS) : pas de fenetre dispo
    if (window.navigator.standalone === true) {
      showErr("Ouvre zonetotalsport.ca dans Safari pour te connecter avec Google, ou cree un compte par courriel.");
      return;
    }
    showErr(''); busy(true);
    var p = new firebase.auth.GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    firebase.auth().signInWithPopup(p).catch(function (err) {
      busy(false);
      var msg = messageErreurAuth(err.code);
      if (msg) showErr(msg);
      console.warn('[ZTS Gate] Google:', err.code, err.message);
    });
  }

  function doEmail() {
    var L = t();
    var email = (el('ztg-email').value || '').trim();
    var pass = el('ztg-pass').value || '';
    showErr('');
    if (pass.length < 6) { showErr(L.errPass); return; }
    busy(true);
    var auth = firebase.auth();
    var op = (mode === 'signup')
      ? auth.createUserWithEmailAndPassword(email, pass)
      : auth.signInWithEmailAndPassword(email, pass);
    op.catch(function (err) {
      busy(false);
      var c = err && err.code;
      if (c === 'auth/email-already-in-use') { mode = 'login'; render(); showErr(L.errUsed); }
      else if (c === 'auth/weak-password') showErr(L.errPass);
      else showErr(L.errMail);
    });
  }

  function onAuth(user) {
    // Deconnexion en cours : la page part vers l'accueil. Redessiner le mur
    // ici ferait clignoter « Cree ton compte » sur l'outil qu'on vient de
    // quitter — c'est l'aller-retour vers une page de connexion a eviter.
    if (leaving) return;
    var g = el('zts-gate');
    if (user) {
      if (g) g.hidden = true;
      addLogout(user);
      document.dispatchEvent(new CustomEvent('zts:auth', { detail: { user: user } }));
    } else {
      if (g) { g.hidden = false; render(); }
      removeLogout();
    }
  }

  function addLogout(user) {
    if (el('ztg-out')) return;
    var b = document.createElement('button');
    b.id = 'ztg-out'; b.className = 'ztg-out';
    var name = (user && (user.displayName || user.email)) || '';
    b.textContent = '👋 ' + t().bye + (name ? ' · ' + name.split('@')[0] : '');
    // Meme contrat que window.ztsLogout() de firebase-auth.js : drapeau pose
    // avant, signOut() AWAITE (sinon la navigation tue le vidage async de la
    // persistance et l'usager revient au chargement suivant), puis sortie
    // vers l'accueil. Avant, ce bouton faisait un signOut() nu et laissait
    // l'usager face au mur plein ecran sur l'outil qu'il utilisait.
    b.addEventListener('click', function () {
      leaving = true;
      firebase.auth().signOut()
        .catch(function (e) { console.error('[ZTS Gate] signOut:', e); })
        .then(function () { window.location.href = ROOT + 'index.html'; });
    });
    document.body.appendChild(b);
  }
  function removeLogout() { var b = el('ztg-out'); if (b) b.remove(); }

  function boot() {
    injectStyles();
    var g = document.createElement('div');
    g.id = 'zts-gate';
    g.innerHTML = '<div class="ztg-card"><h2>' + t().loading + '</h2></div>';
    document.body.appendChild(g);

    // re-render overlay si la langue change
    document.addEventListener('zts:langchange', function () { if (!ready || (firebase && !firebase.auth().currentUser)) render(); });

    loadSdk(function (ok) {
      if (!ok) { fail(); return; }
      try {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
        firebase.auth().onAuthStateChanged(function (user) { ready = true; onAuth(user); });
      } catch (e) { fail(); }
    });
  }

  function fail() {
    var g = el('zts-gate'); if (!g) return;
    g.hidden = false;
    g.innerHTML = '<div class="ztg-card"><h2>⚠️</h2><p class="ztg-sub">' + t().errNet + '</p>' +
      '<button class="ztg-sub-btn" onclick="location.reload()">' + t().retry + '</button></div>';
  }

  function loadSdk(cb) {
    function add(src, next) {
      var s = document.createElement('script'); s.src = src;
      s.onload = next; s.onerror = function () { cb(false); };
      document.head.appendChild(s);
    }
    add('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js', function () {
      add('https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js', function () { cb(true); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
