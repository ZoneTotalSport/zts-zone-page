/**
 * Studio Jeu — porte ADMINISTRATEUR (acces reserve a Joey).
 * Firebase Auth (projet zone-total-sport), compte courriel + mot de passe.
 * Seul ADMIN_EMAIL passe ; tout autre compte est deconnecte.
 * NB : gate cote client sur un site statique — protege l'acces a l'outil,
 * pas les fichiers eux-memes (repo public).
 */
(function () {
  'use strict';
  var ADMIN_EMAIL = 'zts@hotmail.ca';
  var CFG = {
    apiKey: 'AIzaSyBoBxVP6g_ObKIJJ1jkviNFQ-wpJoWdjbA',
    authDomain: 'zone-total-sport.firebaseapp.com',
    projectId: 'zone-total-sport',
    appId: '1:681359040455:web:80c9f584583824cc8cc3e2',
  };

  // ---- overlay (visible tout de suite, avant meme Firebase) ----------------
  var css = ''
    + '#adminGate{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;'
    + 'background:radial-gradient(circle at 30% 20%,#CCFAFF 0,transparent 45%),radial-gradient(circle at 80% 80%,#FFF6B0 0,transparent 45%),#FFFEF7;}'
    + '#adminGate .card{background:#fff;border:4px solid #1A1A2E;border-radius:16px;box-shadow:8px 8px 0 #1A1A2E;'
    + 'padding:28px 30px;width:min(380px,90vw);font-family:Quicksand,sans-serif;}'
    + '#adminGate h2{font-family:"Luckiest Guy",Impact,cursive;font-size:24px;margin:0 0 4px;color:#1A1A2E;}'
    + '#adminGate p{margin:0 0 16px;font-size:13.5px;color:#555;}'
    + '#adminGate input{width:100%;box-sizing:border-box;border:3px solid #1A1A2E;border-radius:10px;'
    + 'padding:10px 12px;font:inherit;font-weight:700;margin-bottom:10px;}'
    + '#adminGate button{width:100%;font-family:Bangers,Impact,cursive;font-size:18px;letter-spacing:.5px;'
    + 'border:3px solid #1A1A2E;border-radius:10px;background:#00E5FF;color:#111;padding:10px;cursor:pointer;'
    + 'box-shadow:4px 4px 0 #1A1A2E;transition:transform .06s;}'
    + '#adminGate button:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 #1A1A2E;}'
    + '#adminGate button:disabled{opacity:.6;cursor:wait;transform:none;}'
    + '#adminGate .err{color:#FF2D2D;font-weight:700;font-size:13px;min-height:18px;margin:8px 0 0;}'
    + '#adminGate .back{display:block;text-align:center;margin-top:14px;font-size:12.5px;color:#888;text-decoration:none;}'
    + '#adminGate .sep{display:flex;align-items:center;gap:10px;margin:14px 0 10px;color:#999;font-size:12px;font-weight:700;}'
    + '#adminGate .sep::before,#adminGate .sep::after{content:"";flex:1;border-top:2px dashed #ccc;}'
    + '#agGoogle{background:#fff !important;display:flex;align-items:center;justify-content:center;gap:9px;}'
    + '#agGoogle svg{width:20px;height:20px;flex-shrink:0;}'
    + '#btnLogout{cursor:pointer;}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var gate = document.createElement('div');
  gate.id = 'adminGate';
  var GOOGLE_ICON = '<svg viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C36.9 42.6 44 38 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>';
  gate.innerHTML = '<div class="card">'
    + '<h2>🔒 Studio Jeu</h2>'
    + '<p>Accès administrateur — connecte-toi pour continuer.</p>'
    + '<button type="button" id="agGoogle">' + GOOGLE_ICON + 'Continuer avec Google</button>'
    + '<div class="sep">ou</div>'
    + '<form id="agForm">'
    + '<input type="email" id="agMail" placeholder="Courriel" autocomplete="username" required>'
    + '<input type="password" id="agPass" placeholder="Mot de passe" autocomplete="current-password" required>'
    + '<button type="submit" id="agGo">Se connecter</button>'
    + '</form><div class="err" id="agErr"></div>'
    + '<a class="back" href="https://zonetotalsport.ca/">← Retour à zonetotalsport.ca</a>'
    + '</div>';
  function mount() { document.body.appendChild(gate); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  function err(msg) { var e = document.getElementById('agErr'); if (e) e.textContent = msg || ''; }
  function busy(b) { var g = document.getElementById('agGo'); if (g) g.disabled = !!b; }

  // ---- Firebase -------------------------------------------------------------
  function loadScript(src, cb) {
    var s = document.createElement('script'); s.src = src; s.onload = cb;
    s.onerror = function () { err('Connexion impossible (réseau). Recharge la page.'); };
    document.head.appendChild(s);
  }
  loadScript('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js', function () {
    loadScript('https://www.gstatic.com/firebasejs/10.14.0/firebase-auth-compat.js', init);
  });

  function init() {
    var app = firebase.apps.length ? firebase.app() : firebase.initializeApp(CFG);
    var auth = firebase.auth(app);

    auth.onAuthStateChanged(function (user) {
      if (user && (user.email || '').toLowerCase() === ADMIN_EMAIL) {
        gate.remove();
        var out = document.getElementById('btnLogout');
        if (out) {
          out.hidden = false;
          out.onclick = function () { auth.signOut().then(function () { location.reload(); }); };
        }
      } else if (user) {
        auth.signOut();
        err('Accès réservé à l\'administrateur.');
        busy(false);
        var g = document.getElementById('agGoogle');
        if (g) g.disabled = false;
      }
    });

    document.addEventListener('submit', function (e) {
      if (e.target && e.target.id === 'agForm') {
        e.preventDefault(); err(''); busy(true);
        var mail = document.getElementById('agMail').value.trim();
        var pass = document.getElementById('agPass').value;
        auth.signInWithEmailAndPassword(mail, pass).catch(function () {
          err('Courriel ou mot de passe invalide.'); busy(false);
        });
      }
    });

    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('#agGoogle') : null;
      if (!b) return;
      err(''); b.disabled = true;
      var provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: ADMIN_EMAIL, prompt: 'select_account' });
      auth.signInWithPopup(provider).catch(function (ex) {
        b.disabled = false;
        if (ex && ex.code === 'auth/popup-closed-by-user') return;
        if (ex && ex.code === 'auth/operation-not-allowed') {
          err('Connexion Google pas encore activée dans Firebase (Authentication → Sign-in method).');
        } else {
          err('Connexion Google impossible. Réessaie ou utilise le courriel.');
        }
      });
      // succes -> onAuthStateChanged fait le reste (et rejette tout autre compte)
    });
  }
})();
