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
    + '#btnLogout{cursor:pointer;}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var gate = document.createElement('div');
  gate.id = 'adminGate';
  gate.innerHTML = '<div class="card">'
    + '<h2>🔒 Studio Jeu</h2>'
    + '<p>Accès administrateur — connecte-toi pour continuer.</p>'
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
  }
})();
