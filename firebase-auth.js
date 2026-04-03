/**
 * ZTS Zone - Firebase Auth System
 * Authentification complète avec popup modal design ZTS
 * Firebase compat SDK (CDN) pour site statique
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
    appId: "1:681359040455:web:80c9f584583824cc8cc3e2",
    measurementId: "G-09S9R1HJ94"
  };

  var _user = null;
  var _authReady = false;
  var _onAuthCallbacks = [];

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

  // ── Inject Fonts + Styles ──
  function injectStyles() {
    if (document.getElementById('zts-auth-styles')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Bangers&family=Schoolbell&family=Fredoka+One&display=swap';
    document.head.appendChild(link);

    var s = document.createElement('style');
    s.id = 'zts-auth-styles';
    s.textContent = '\
/* ── Auth Overlay ── */\
.zts-auth-overlay {\
  position:fixed;inset:0;z-index:100000;\
  display:flex;align-items:center;justify-content:center;\
  background:rgba(0,0,0,0.75);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);\
  opacity:0;visibility:hidden;transition:opacity .4s ease,visibility .4s ease;\
  padding:20px;\
}\
.zts-auth-overlay.zts-open{opacity:1;visibility:visible}\
\
/* ── Modal Container ── */\
.zts-auth-modal{\
  position:relative;width:100%;max-width:600px;\
  background:url("/gym-bg.jpg") center/cover no-repeat;\
  border-radius:28px;overflow:hidden;overflow-y:auto;max-height:95vh;\
  border:4px solid #00E5FF;\
  box-shadow:0 0 80px rgba(0,229,255,.3),0 0 0 8px rgba(0,229,255,.1),0 25px 60px rgba(0,0,0,.5);\
  transform:scale(.85) translateY(40px);opacity:0;\
  transition:transform .5s cubic-bezier(.34,1.56,.64,1),opacity .4s ease;\
  font-family:"Schoolbell",cursive;\
}\
.zts-auth-modal::before{\
  content:"";position:absolute;inset:0;\
  background:rgba(15,15,46,.82);backdrop-filter:blur(4px);\
  z-index:0;\
}\
.zts-auth-modal>*{position:relative;z-index:1;}\
.zts-auth-overlay.zts-open .zts-auth-modal{transform:scale(1) translateY(0);opacity:1}\
\
/* ── Close Button ── */\
.zts-auth-close{\
  position:absolute;top:14px;right:14px;z-index:10;\
  width:42px;height:42px;border-radius:50%;border:3px solid rgba(255,255,255,.3);\
  background:rgba(0,0,0,.3);color:#fff;font-size:1.5rem;line-height:1;\
  cursor:pointer;display:flex;align-items:center;justify-content:center;\
  transition:all .2s;font-family:sans-serif;\
}\
.zts-auth-close:hover{background:rgba(0,0,0,.6);transform:scale(1.15);border-color:#FFD700}\
\
/* ── Header ── */\
.zts-auth-header{\
  text-align:center;padding:30px 30px 10px;\
}\
.zts-auth-mascot{\
  width:180px;height:auto;border-radius:0;object-fit:contain;\
  border:none;box-shadow:none;filter:drop-shadow(0 4px 20px rgba(0,0,0,.5));\
  margin-bottom:12px;\
}\
.zts-auth-title{\
  font-family:"Bangers",cursive;font-size:2.8rem;color:#00E5FF;\
  text-shadow:3px 3px 0 rgba(0,0,0,.4);margin:0;letter-spacing:3px;\
}\
.zts-auth-subtitle{\
  font-family:"Schoolbell",cursive;font-size:1.4rem;color:rgba(255,255,255,.9);\
  margin:8px 0 0;\
}\
\
/* ── Stats Row ── */\
.zts-auth-stats{\
  display:flex;justify-content:center;gap:12px;padding:12px 20px;flex-wrap:wrap;\
}\
.zts-auth-stat{\
  background:rgba(255,255,255,.15);border-radius:12px;padding:8px 14px;\
  text-align:center;backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.2);\
}\
.zts-auth-stat-num{\
  font-family:"Bangers",cursive;font-size:1.6rem;color:#00E5FF;\
  display:block;text-shadow:1px 1px 0 rgba(0,0,0,.3);\
}\
.zts-auth-stat-label{\
  font-size:.75rem;color:rgba(255,255,255,.85);display:block;\
}\
\
/* ── Form ── */\
.zts-auth-form-wrap{\
  padding:10px 30px 20px;\
}\
.zts-auth-form-card{\
  background:rgba(255,255,255,.12);border-radius:20px;padding:24px;\
  backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.2);\
}\
.zts-auth-row{display:flex;gap:10px;}\
.zts-auth-row .zts-auth-field{flex:1;}\
.zts-auth-field{\
  margin-bottom:14px;\
}\
.zts-auth-field label{\
  display:block;font-family:"Schoolbell",cursive;font-size:1.2rem;\
  color:#fff;margin-bottom:6px;text-shadow:1px 1px 0 rgba(0,0,0,.15);\
}\
.zts-auth-field input{\
  width:100%;padding:16px 20px;border-radius:14px;border:2px solid rgba(0,229,255,.3);\
  background:rgba(255,255,255,.1);color:#fff;font-family:"Schoolbell",cursive;\
  font-size:1.15rem;outline:none;transition:all .3s;\
}\
.zts-auth-field input::placeholder{color:rgba(255,255,255,.5)}\
.zts-auth-field input:focus{border-color:#00E5FF;background:rgba(255,255,255,.2);box-shadow:0 0 15px rgba(0,229,255,.3)}\
\
/* ── Buttons ── */\
.zts-auth-btn{\
  width:100%;padding:18px;border-radius:16px;border:none;cursor:pointer;\
  font-family:"Bangers",cursive;font-size:1.4rem;letter-spacing:2px;\
  transition:all .3s;display:flex;align-items:center;justify-content:center;gap:10px;\
}\
.zts-auth-btn-primary{\
  background:linear-gradient(135deg,#00E5FF,#8B5CF6);color:#fff;\
  box-shadow:0 4px 20px rgba(0,229,255,.4);\
}\
.zts-auth-btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 30px rgba(0,229,255,.6)}\
.zts-auth-btn-primary:active{transform:translateY(0)}\
\
.zts-auth-btn-google{\
  background:rgba(255,255,255,.95);color:#333;margin-top:12px;\
  font-family:"Fredoka One",cursive;font-size:1.15rem;letter-spacing:0;\
}\
.zts-auth-btn-google:hover{background:#fff;transform:translateY(-2px);box-shadow:0 4px 20px rgba(255,255,255,.4)}\
.zts-auth-btn-google svg{width:20px;height:20px;}\
\
/* ── Links ── */\
.zts-auth-links{\
  display:flex;justify-content:space-between;align-items:center;\
  padding:0 8px;margin-top:12px;\
}\
.zts-auth-link{\
  color:#00E5FF;font-size:1.05rem;cursor:pointer;text-decoration:underline;\
  background:none;border:none;font-family:"Schoolbell",cursive;\
  transition:color .2s;\
}\
.zts-auth-link:hover{color:#fff}\
\
/* ── Error ── */\
.zts-auth-error{\
  background:rgba(255,42,122,.25);border:1px solid rgba(255,42,122,.5);\
  color:#fff;border-radius:12px;padding:10px 16px;margin-bottom:12px;\
  font-size:.9rem;display:none;text-align:center;\
}\
.zts-auth-error.show{display:block;animation:ztsShake .5s ease}\
@keyframes ztsShake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}\
\
/* ── Success ── */\
.zts-auth-success{\
  background:rgba(57,255,20,.2);border:1px solid rgba(57,255,20,.5);\
  color:#fff;border-radius:12px;padding:10px 16px;margin-bottom:12px;\
  font-size:.9rem;display:none;text-align:center;\
}\
.zts-auth-success.show{display:block}\
\
/* ── Feature Cards ── */\
.zts-auth-features{\
  display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 30px 10px;\
}\
.zts-auth-feat{\
  border-radius:14px;padding:12px;text-align:center;\
  backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.15);\
  transition:transform .3s;\
}\
.zts-auth-feat:hover{transform:translateY(-3px)}\
.zts-auth-feat-icon{font-size:1.5rem;margin-bottom:4px;display:block;}\
.zts-auth-feat-text{font-family:"Bangers",cursive;font-size:.85rem;color:#fff;letter-spacing:1px;}\
.zts-auth-feat-blue{background:rgba(0,229,255,.2);}\
.zts-auth-feat-green{background:rgba(57,255,20,.2);}\
.zts-auth-feat-orange{background:rgba(255,107,0,.3);}\
.zts-auth-feat-pink{background:rgba(255,42,122,.2);}\
\
/* ── Social Proof ── */\
.zts-auth-proof{\
  text-align:center;padding:12px 30px 24px;\
  font-family:"Bangers",cursive;font-size:1.2rem;color:#FFD700;\
  text-shadow:1px 1px 0 rgba(0,0,0,.3);letter-spacing:1.5px;\
}\
\
/* ── Spinner ── */\
.zts-auth-spinner{\
  display:inline-block;width:20px;height:20px;\
  border:3px solid rgba(255,255,255,.3);border-top-color:#FFD700;\
  border-radius:50%;animation:ztsSpin .7s linear infinite;\
}\
@keyframes ztsSpin{to{transform:rotate(360deg)}}\
\
/* ── User Dropdown ── */\
.zts-user-dropdown{\
  position:relative;display:inline-flex;\
}\
.zts-user-btn{\
  display:flex;align-items:center;gap:6px;\
  padding:8px 16px;border-radius:30px;\
  background:linear-gradient(135deg,#39FF14,#00E5FF);\
  color:#1a1a2e;font-family:"Bangers",cursive;font-size:.95rem;\
  letter-spacing:1px;border:2px solid rgba(255,255,255,.3);\
  cursor:pointer;transition:all .3s;text-decoration:none;\
}\
.zts-user-btn:hover{transform:translateY(-2px);box-shadow:0 4px 20px rgba(57,255,20,.4)}\
.zts-user-menu{\
  position:absolute;top:calc(100% + 8px);right:0;min-width:180px;\
  background:rgba(15,15,46,.95);border-radius:14px;border:2px solid rgba(255,215,0,.3);\
  backdrop-filter:blur(12px);padding:8px;opacity:0;visibility:hidden;\
  transform:translateY(-8px);transition:all .3s;z-index:100001;\
}\
.zts-user-dropdown.open .zts-user-menu{opacity:1;visibility:visible;transform:translateY(0)}\
.zts-user-menu-item{\
  display:flex;align-items:center;gap:8px;padding:10px 14px;\
  border-radius:10px;color:#fff;font-family:"Schoolbell",cursive;\
  font-size:.95rem;cursor:pointer;transition:background .2s;border:none;background:none;width:100%;text-align:left;\
}\
.zts-user-menu-item:hover{background:rgba(255,255,255,.1)}\
.zts-user-menu-item.logout{color:#FF2A7A}\
\
/* ── Responsive ── */\
@media(max-width:600px){\
  .zts-auth-modal{max-width:100%;border-radius:20px;}\
  .zts-auth-title{font-size:2rem;}\
  .zts-auth-subtitle{font-size:1.1rem;}\
  .zts-auth-stats{gap:6px;}\
  .zts-auth-stat{padding:6px 10px;}\
  .zts-auth-stat-num{font-size:1.2rem;}\
  .zts-auth-form-wrap{padding:8px 18px 16px;}\
  .zts-auth-form-card{padding:16px;}\
  .zts-auth-features{gap:6px;padding:0 18px 8px;}\
  .zts-auth-mascot{width:140px;}\
  .zts-auth-row{flex-direction:column;gap:0;}\
  .zts-auth-btn{font-size:1.2rem;padding:16px;}\
  .zts-auth-field label{font-size:1.05rem;}\
  .zts-auth-field input{font-size:1rem;padding:14px 16px;}\
}';
    document.head.appendChild(s);
  }

  // ── Google SVG Icon ──
  var GOOGLE_SVG = '<svg viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>';

  // ── Build Modal HTML ──
  function buildModalHTML(mode) {
    var isLogin = mode === 'login';
    return '\
<div class="zts-auth-overlay" id="ztsAuthOverlay">\
  <div class="zts-auth-modal">\
    <button class="zts-auth-close" id="ztsAuthClose" aria-label="Fermer">&times;</button>\
    \
    <div class="zts-auth-header">\
      <img src="/bucheron-basketball.png" alt="ZTS Mascotte" class="zts-auth-mascot">\
      <h2 class="zts-auth-title">' + (isLogin ? 'Content de te revoir!' : 'Rejoins la Zone!') + '</h2>\
      <p class="zts-auth-subtitle">' + (isLogin ? 'Connecte-toi pour acceder a toutes les ressources' : 'Cree ton compte gratuit en quelques secondes') + '</p>\
    </div>\
    \
    <div class="zts-auth-stats">\
      <div class="zts-auth-stat"><span class="zts-auth-stat-num">500+</span><span class="zts-auth-stat-label">Jeux</span></div>\
      <div class="zts-auth-stat"><span class="zts-auth-stat-num">128</span><span class="zts-auth-stat-label">SAE</span></div>\
      <div class="zts-auth-stat"><span class="zts-auth-stat-num">IA</span><span class="zts-auth-stat-label">Generateur</span></div>\
      <div class="zts-auth-stat"><span class="zts-auth-stat-num">0$</span><span class="zts-auth-stat-label">Gratuit</span></div>\
    </div>\
    \
    <div class="zts-auth-form-wrap">\
      <div class="zts-auth-form-card">\
        <div class="zts-auth-error" id="ztsAuthError"></div>\
        <div class="zts-auth-success" id="ztsAuthSuccess"></div>\
        \
        <form id="ztsAuthForm" autocomplete="on">\
          ' + (!isLogin ? '\
          <div class="zts-auth-row">\
            <div class="zts-auth-field">\
              <label>Prenom</label>\
              <input type="text" id="ztsFirstName" placeholder="Ton prenom" required autocomplete="given-name">\
            </div>\
            <div class="zts-auth-field">\
              <label>Nom</label>\
              <input type="text" id="ztsLastName" placeholder="Ton nom" required autocomplete="family-name">\
            </div>\
          </div>\
          ' : '') + '\
          <div class="zts-auth-field">\
            <label>Courriel</label>\
            <input type="email" id="ztsEmail" placeholder="ton@courriel.com" required autocomplete="email">\
          </div>\
          <div class="zts-auth-field">\
            <label>Mot de passe</label>\
            <input type="password" id="ztsPassword" placeholder="' + (isLogin ? 'Ton mot de passe' : 'Minimum 6 caracteres') + '" required autocomplete="' + (isLogin ? 'current-password' : 'new-password') + '" minlength="6">\
          </div>\
          \
          <button type="submit" class="zts-auth-btn zts-auth-btn-primary" id="ztsAuthSubmit">\
            ' + (isLogin ? '&#x1F3C3; Se connecter' : '&#x1F680; Creer mon compte') + '\
          </button>\
        </form>\
        \
        <button class="zts-auth-btn zts-auth-btn-google" id="ztsGoogleBtn">\
          ' + GOOGLE_SVG + '\
          ' + (isLogin ? 'Se connecter avec Google' : "S'inscrire avec Google") + '\
        </button>\
        \
        <div class="zts-auth-links">\
          ' + (isLogin
            ? '<button class="zts-auth-link" id="ztsForgotPw">Mot de passe oublie?</button><button class="zts-auth-link" id="ztsToggleMode">Pas de compte? Inscris-toi!</button>'
            : '<span></span><button class="zts-auth-link" id="ztsToggleMode">Deja un compte? Connecte-toi!</button>') + '\
        </div>\
      </div>\
    </div>\
    \
    <div class="zts-auth-features">\
      <div class="zts-auth-feat zts-auth-feat-blue"><span class="zts-auth-feat-icon">&#x1F3C0;</span><span class="zts-auth-feat-text">+500 jeux sportifs</span></div>\
      <div class="zts-auth-feat zts-auth-feat-green"><span class="zts-auth-feat-icon">&#x1F916;</span><span class="zts-auth-feat-text">Generateur IA</span></div>\
      <div class="zts-auth-feat zts-auth-feat-orange"><span class="zts-auth-feat-icon">&#x1F4DA;</span><span class="zts-auth-feat-text">SAE + Outils</span></div>\
      <div class="zts-auth-feat zts-auth-feat-pink"><span class="zts-auth-feat-icon">&#x1F389;</span><span class="zts-auth-feat-text">100% gratuit</span></div>\
    </div>\
    \
    <div class="zts-auth-proof">&#x1F3C6; 2 295 enseignants utilisent la Zone!</div>\
  </div>\
</div>';
  }

  // ── Firebase Error Messages (FR) ──
  var ERROR_MESSAGES = {
    'auth/invalid-email': 'Adresse courriel invalide.',
    'auth/user-disabled': 'Ce compte a ete desactive.',
    'auth/user-not-found': 'Aucun compte trouve avec ce courriel.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/email-already-in-use': 'Ce courriel est deja utilise. Essaie de te connecter!',
    'auth/weak-password': 'Le mot de passe doit avoir au moins 6 caracteres.',
    'auth/too-many-requests': 'Trop de tentatives. Reessaie dans quelques minutes.',
    'auth/popup-closed-by-user': 'Connexion Google annulee.',
    'auth/network-request-failed': 'Erreur de connexion. Verifie ton internet.',
    'auth/invalid-credential': 'Courriel ou mot de passe incorrect.',
    'auth/missing-password': 'Entre ton mot de passe.'
  };

  function getErrorMsg(code) {
    console.log('[ZTS Auth] Error code:', code);
    return ERROR_MESSAGES[code] || 'Erreur: ' + code;
  }

  // ── Current mode tracking ──
  var _currentMode = 'login';

  // ── Show/Hide Modal ──
  function showModal(mode) {
    _currentMode = mode;
    // Remove existing
    var existing = document.getElementById('ztsAuthOverlay');
    if (existing) existing.remove();

    // Inject
    var wrapper = document.createElement('div');
    wrapper.innerHTML = buildModalHTML(mode);
    document.body.appendChild(wrapper.firstElementChild);

    var overlay = document.getElementById('ztsAuthOverlay');

    // Open with small delay for animation
    requestAnimationFrame(function() {
      requestAnimationFrame(function() {
        overlay.classList.add('zts-open');
      });
    });

    // Close button (disabled in protected mode)
    document.getElementById('ztsAuthClose').addEventListener('click', function() {
      if (!_protectedMode) closeModal();
    });
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay && !_protectedMode) closeModal();
    });

    // ESC key (disabled in protected mode)
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && !_protectedMode) closeModal();
    });

    // Hide close button in protected mode
    if (_protectedMode) {
      document.getElementById('ztsAuthClose').style.display = 'none';
    }

    // Toggle mode
    var toggleBtn = document.getElementById('ztsToggleMode');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        closeModal();
        setTimeout(function() { showModal(mode === 'login' ? 'signup' : 'login'); }, 200);
      });
    }

    // Forgot password
    var forgotBtn = document.getElementById('ztsForgotPw');
    if (forgotBtn) {
      forgotBtn.addEventListener('click', handleForgotPassword);
    }

    // Form submit
    document.getElementById('ztsAuthForm').addEventListener('submit', function(e) {
      e.preventDefault();
      if (mode === 'login') handleLogin(); else handleSignup();
    });

    // Google button
    document.getElementById('ztsGoogleBtn').addEventListener('click', handleGoogle);
  }

  function closeModal() {
    var overlay = document.getElementById('ztsAuthOverlay');
    if (!overlay) return;
    // If protected mode and user just logged in, redirect to resource
    if (_protectedMode && _user && _protectedHref) {
      var href = _protectedHref;
      _protectedMode = false;
      _protectedHref = null;
      window.location.href = href;
      return;
    }
    _protectedMode = false;
    _protectedHref = null;
    overlay.classList.remove('zts-open');
    document.removeEventListener('keydown', _escHandler);
    setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 500);
  }

  function _escHandler(e) {
    if (e.key === 'Escape') closeModal();
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

  // ── Loading State ──
  function setLoading(loading) {
    var btn = document.getElementById('ztsAuthSubmit');
    var gBtn = document.getElementById('ztsGoogleBtn');
    if (!btn) return;
    if (loading) {
      btn.disabled = true;
      btn.innerHTML = '<span class="zts-auth-spinner"></span> Chargement...';
      if (gBtn) gBtn.disabled = true;
    } else {
      btn.disabled = false;
      btn.innerHTML = _currentMode === 'login' ? '&#x1F3C3; Se connecter' : '&#x1F680; Creer mon compte';
      if (gBtn) gBtn.disabled = false;
    }
  }

  // ── Auth Handlers ──
  function handleLogin() {
    var email = document.getElementById('ztsEmail').value.trim();
    var password = document.getElementById('ztsPassword').value;
    if (!email || !password) { showError('Remplis tous les champs!'); return; }
    setLoading(true);
    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(function(result) { if (window.ztsNotifyLogin) window.ztsNotifyLogin(result.user); closeModal(); })
      .catch(function(err) { console.error('[ZTS Auth] Full error:', err); showError('Erreur [' + (err.code || 'unknown') + ']: ' + (err.message || err)); setLoading(false); });
  }

  function handleSignup() {
    var firstName = (document.getElementById('ztsFirstName') || {}).value || '';
    var lastName = (document.getElementById('ztsLastName') || {}).value || '';
    var email = document.getElementById('ztsEmail').value.trim();
    var password = document.getElementById('ztsPassword').value;
    if (!firstName.trim() || !lastName.trim() || !email || !password) {
      showError('Remplis tous les champs!'); return;
    }
    setLoading(true);
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then(function(result) {
        return result.user.updateProfile({
          displayName: firstName.trim() + ' ' + lastName.trim()
        }).then(function() { return result; });
      })
      .then(function(result) { if (window.ztsNotifySignup) window.ztsNotifySignup(result.user); closeModal(); })
      .catch(function(err) { showError(getErrorMsg(err.code)); setLoading(false); });
  }

  function handleGoogle() {
    var provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setLoading(true);
    firebase.auth().signInWithPopup(provider)
      .then(function(result) {
        if (result.additionalUserInfo && result.additionalUserInfo.isNewUser && window.ztsNotifySignup) {
          window.ztsNotifySignup(result.user);
        } else if (window.ztsNotifyLogin) {
          window.ztsNotifyLogin(result.user);
        }
        closeModal();
      })
      .catch(function(err) { console.error('[ZTS Auth] Google error:', err); showError('Erreur [' + (err.code || 'unknown') + ']: ' + (err.message || err)); setLoading(false); });
  }

  function handleForgotPassword() {
    var email = document.getElementById('ztsEmail').value.trim();
    if (!email) { showError('Entre ton courriel pour reinitialiser ton mot de passe.'); return; }
    firebase.auth().sendPasswordResetEmail(email)
      .then(function() { showSuccess('Courriel de reinitialisation envoye! Verifie ta boite.'); })
      .catch(function(err) { showError(getErrorMsg(err.code)); });
  }

  // ── UI Update on Auth State ──
  function updateUI(user) {
    var loginBtn = document.getElementById('zts-login-btn');
    if (!loginBtn) return;

    if (user) {
      var displayName = user.displayName || user.email.split('@')[0];
      var firstName = displayName.split(' ')[0];

      // Replace button with user dropdown
      var dropdown = document.createElement('div');
      dropdown.className = 'zts-user-dropdown';
      dropdown.id = 'zts-login-btn';
      dropdown.innerHTML = '\
        <button class="zts-user-btn" id="ztsUserToggle">\
          <span style="font-size:1.2em">&#x1F44B;</span> Salut, ' + firstName + '!\
        </button>\
        <div class="zts-user-menu">\
          <button class="zts-user-menu-item" onclick="window.ztsShowProfile&&window.ztsShowProfile()">&#x1F464; Mon profil</button>\
          <button class="zts-user-menu-item logout" onclick="window.ztsLogout()">&#x1F6AA; Deconnexion</button>\
        </div>';

      loginBtn.replaceWith(dropdown);

      // Toggle dropdown
      var toggle = document.getElementById('ztsUserToggle');
      if (toggle) {
        toggle.addEventListener('click', function(e) {
          e.stopPropagation();
          dropdown.classList.toggle('open');
        });
        document.addEventListener('click', function() { dropdown.classList.remove('open'); });
      }
    } else {
      // Restore login button
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
        if (typeof firebase !== 'undefined') firebase.auth().signOut();
      });
    });
  }

  // ── Global API ──
  root.ztsShowLogin = function() { showModal('login'); };
  root.ztsShowSignup = function() { showModal('signup'); };
  root.ztsLogout = function() {
    if (typeof firebase !== 'undefined') firebase.auth().signOut();
  };
  root.ztsGetUser = function() { return _user; };
  root.ztsOnAuth = function(cb) {
    _onAuthCallbacks.push(cb);
    if (_authReady) cb(_user);
  };

  // ── Init on DOM ready ──
  function init() {
    injectStyles();
    initFirebase();
    // Wait for DOM fully loaded to bind
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        bindDataAttributes();
        bindProtectedLinks();
      });
    } else {
      bindDataAttributes();
      bindProtectedLinks();
    }
  }

  init();

})(window);
