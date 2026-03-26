/**
 * ZTS Zone - Popup Membre VIP
 * Reproduit le popup Wix "Deviens Membre VIP" avec couleurs fluo
 * Redirige vers Wix pour inscription/connexion
 */
(function (root) {

  var LUMBERJACK_IMG = 'https://static.wixstatic.com/media/692b77_03932649151440d9a1951e988412c76a~mv2.png';

  // ── Inject styles ─────────────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('zts-vip-styles')) return;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Bangers&family=Schoolbell&family=Fredoka+One&family=Boogaloo&display=swap';
    document.head.appendChild(link);

    var s = document.createElement('style');
    s.id = 'zts-vip-styles';
    s.textContent = `
/* ── Overlay ── */
.zts-vip-overlay {
  position:fixed;inset:0;z-index:99999;
  display:flex;align-items:center;justify-content:center;
  background:rgba(0,0,0,0.7);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  opacity:0;visibility:hidden;transition:opacity .4s,visibility .4s;
}
.zts-vip-overlay.zts-open{opacity:1;visibility:visible}

/* ── Modal ── */
.zts-vip-modal{
  position:relative;width:95%;max-width:960px;
  background:linear-gradient(145deg,#00C8E8 0%,#00B4D8 50%,#0096C7 100%);
  border-radius:28px;overflow:hidden;
  border:5px solid #FFD700;
  box-shadow:0 0 60px rgba(0,200,232,.4),0 0 0 8px rgba(255,215,0,.2);
  transform:scale(.9) translateY(30px);
  transition:transform .5s cubic-bezier(.34,1.56,.64,1);
}
.zts-vip-overlay.zts-open .zts-vip-modal{transform:scale(1) translateY(0)}

/* ── Close ── */
.zts-vip-close{
  position:absolute;top:16px;right:16px;z-index:10;
  width:44px;height:44px;border-radius:50%;border:3px solid rgba(255,255,255,.3);
  background:rgba(0,0,0,.25);color:#fff;font-size:1.6rem;
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  transition:background .2s,transform .2s;
}
.zts-vip-close:hover{background:rgba(0,0,0,.5);transform:scale(1.1)}

/* ── Layout ── */
.zts-vip-grid{display:grid;grid-template-columns:1fr 1fr;gap:0}
@media(max-width:700px){.zts-vip-grid{grid-template-columns:1fr}}

/* ── Left ── */
.zts-vip-left{padding:40px 30px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:center}
.zts-vip-mascot{width:220px;height:auto;margin-bottom:16px;filter:drop-shadow(4px 6px 12px rgba(0,0,0,.3))}
.zts-vip-title{
  font-family:'Bangers',cursive;font-size:2.6rem;color:#fff;
  text-shadow:3px 3px 0 rgba(0,0,0,.2);margin:0 0 8px;line-height:1.1;
}
.zts-vip-subtitle{font-family:'Schoolbell',cursive;font-size:1.3rem;color:rgba(255,255,255,.9);margin:0 0 20px}

/* ── Stats ── */
.zts-vip-stats{
  display:grid;grid-template-columns:repeat(4,1fr);gap:8px;
  background:rgba(0,0,0,.15);border-radius:16px;padding:14px 10px;width:100%;
}
.zts-vip-stat{text-align:center}
.zts-vip-stat-num{font-family:'Bangers',cursive;font-size:1.6rem;line-height:1.2}
.zts-vip-stat-label{font-family:'Schoolbell',cursive;font-size:.95rem;color:rgba(255,255,255,.8)}
.zts-stat-pink{color:#FF2A7A}
.zts-stat-white{color:#fff}
.zts-stat-green{color:#39FF14}
.zts-stat-yellow{color:#FFD700}

/* ── Right ── */
.zts-vip-right{padding:30px 28px;display:flex;flex-direction:column;gap:14px;justify-content:center}

/* ── Feature cards ── */
.zts-vip-card{
  display:flex;align-items:center;gap:16px;
  padding:16px 20px;border-radius:16px;
  transition:transform .2s,box-shadow .2s;cursor:default;
}
.zts-vip-card:hover{transform:translateX(6px);box-shadow:0 4px 20px rgba(0,0,0,.2)}
.zts-vip-card-icon{
  width:48px;height:48px;border-radius:14px;
  display:flex;align-items:center;justify-content:center;
  font-size:1.6rem;background:rgba(255,255,255,.25);flex-shrink:0;
}
.zts-vip-card h3{font-family:'Fredoka One',cursive;font-size:1.15rem;margin:0 0 2px;color:#fff}
.zts-vip-card p{font-family:'Schoolbell',cursive;font-size:1rem;margin:0;color:rgba(255,255,255,.85)}

/* Card colors - FLUO */
.zts-card-blue{background:linear-gradient(135deg,#00BFFF,#1E90FF);border:2px solid rgba(255,255,255,.2)}
.zts-card-green{background:linear-gradient(135deg,#39FF14,#00E676);border:2px solid rgba(255,255,255,.2)}
.zts-card-green h3,.zts-card-green p{color:#0a3d0a}
.zts-card-orange{background:linear-gradient(135deg,#FF6B00,#FF9500);border:2px solid rgba(255,255,255,.2)}
.zts-card-pink{background:linear-gradient(135deg,#FF2A7A,#FF69B4);border:2px solid rgba(255,255,255,.2)}

/* ── Social proof ── */
.zts-vip-proof{
  display:flex;align-items:center;justify-content:center;gap:10px;
  padding:10px 0;
}
.zts-vip-avatars{display:flex}
.zts-vip-avatars span{
  width:32px;height:32px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-family:'Fredoka One',cursive;font-size:.7rem;color:#fff;
  border:2px solid #00C8E8;margin-left:-8px;
}
.zts-vip-avatars span:first-child{margin-left:0}
.zts-vip-proof-text{font-family:'Schoolbell',cursive;font-size:1.05rem;color:rgba(255,255,255,.9)}

/* ── CTA ── */
.zts-vip-cta{
  display:block;width:100%;padding:22px 20px;border:none;border-radius:18px;
  background:linear-gradient(135deg,#FFD700,#FFA500);
  font-family:'Bangers',cursive;font-size:1.6rem;color:#0a0a2e;
  cursor:pointer;text-align:center;text-decoration:none;
  box-shadow:0 6px 30px rgba(255,215,0,.4);
  transition:transform .2s,box-shadow .2s;
  border:3px solid rgba(0,0,0,.1);
}
.zts-vip-cta:hover{transform:translateY(-4px) scale(1.02);box-shadow:0 10px 40px rgba(255,215,0,.5)}
.zts-vip-cta:active{transform:translateY(0)}

/* ── Login link ── */
.zts-vip-login-link{
  display:block;text-align:center;padding:8px;
  font-family:'Schoolbell',cursive;font-size:1.1rem;
  color:rgba(255,255,255,.7);text-decoration:underline;cursor:pointer;
  background:none;border:none;width:100%;
  transition:color .2s;
}
.zts-vip-login-link:hover{color:#fff}

.zts-vip-small{
  text-align:center;font-family:'Schoolbell',cursive;
  font-size:.95rem;color:rgba(255,255,255,.5);margin:0;
}

/* ── Close text ── */
.zts-vip-skip{
  display:block;text-align:center;padding:10px;
  font-family:'Schoolbell',cursive;font-size:1rem;
  color:rgba(255,255,255,.4);cursor:pointer;background:none;border:none;width:100%;
  transition:color .2s;
}
.zts-vip-skip:hover{color:rgba(255,255,255,.7)}

/* ── Sports emojis floating ── */
.zts-vip-emoji{position:absolute;font-size:1.8rem;opacity:.4;pointer-events:none}

/* ── Mobile ── */
@media(max-width:700px){
  .zts-vip-modal{max-height:95dvh;overflow-y:auto;border-radius:20px}
  .zts-vip-left{padding:28px 20px 16px}
  .zts-vip-mascot{width:150px}
  .zts-vip-title{font-size:2rem}
  .zts-vip-right{padding:16px 18px}
  .zts-vip-cta{font-size:1.3rem;padding:18px}
  .zts-vip-stats{grid-template-columns:repeat(4,1fr);gap:4px}
  .zts-vip-stat-num{font-size:1.3rem}
}

/* ── Toast ── */
.zts-toast{
  position:fixed;top:24px;right:24px;z-index:100000;
  background:linear-gradient(135deg,#39FF14,#00E676);
  color:#0a3d0a;font-family:'Fredoka One',cursive;font-size:1.15rem;
  padding:18px 30px;border-radius:14px;
  box-shadow:0 6px 30px rgba(57,255,20,.35);
  transform:translateX(120%);transition:transform .4s cubic-bezier(.34,1.56,.64,1);
}
.zts-toast.zts-toast-show{transform:translateX(0)}
@media(max-width:520px){.zts-toast{left:16px;right:16px;text-align:center}}
`;
    document.head.appendChild(s);
  }

  // ── Create popup ────────────────────────────────────────────────────────────
  var overlay = null;

  function createPopup() {
    if (overlay) return overlay;

    var div = document.createElement('div');
    div.className = 'zts-vip-overlay';
    div.innerHTML = `
<div class="zts-vip-modal">
  <button class="zts-vip-close" id="zts-vip-close">&times;</button>

  <!-- Floating emojis -->
  <span class="zts-vip-emoji" style="top:8%;left:3%">\u26BD</span>
  <span class="zts-vip-emoji" style="top:5%;right:12%">\uD83C\uDFC0</span>
  <span class="zts-vip-emoji" style="bottom:12%;left:5%">\u26BE</span>
  <span class="zts-vip-emoji" style="bottom:8%;right:4%">\uD83C\uDFC8</span>

  <div class="zts-vip-grid">

    <!-- LEFT -->
    <div class="zts-vip-left">
      <img src="${LUMBERJACK_IMG}" alt="Le Bucheron Sportif" class="zts-vip-mascot">
      <h2 class="zts-vip-title">DEVIENS MEMBRE<br>VIP!</h2>
      <p class="zts-vip-subtitle">Accede au plein potentiel de la Zone!</p>
      <div class="zts-vip-stats">
        <div class="zts-vip-stat"><div class="zts-vip-stat-num zts-stat-pink">500+</div><div class="zts-vip-stat-label">jeux</div></div>
        <div class="zts-vip-stat"><div class="zts-vip-stat-num zts-stat-white">128</div><div class="zts-vip-stat-label">SAE</div></div>
        <div class="zts-vip-stat"><div class="zts-vip-stat-num zts-stat-green">IA</div><div class="zts-vip-stat-label">generateur</div></div>
        <div class="zts-vip-stat"><div class="zts-vip-stat-num zts-stat-yellow">0$</div><div class="zts-vip-stat-label">gratuit!</div></div>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="zts-vip-right">

      <div class="zts-vip-card zts-card-blue">
        <div class="zts-vip-card-icon">\u26BD</div>
        <div><h3>+500 jeux sportifs</h3><p>Fiches detaillees, regles et variantes</p></div>
      </div>

      <div class="zts-vip-card zts-card-green">
        <div class="zts-vip-card-icon">\uD83E\uDD16</div>
        <div><h3>Generateur IA</h3><p>Cree un jeu sur mesure en 10 secondes</p></div>
      </div>

      <div class="zts-vip-card zts-card-orange">
        <div class="zts-vip-card-icon">\uD83D\uDCCB</div>
        <div><h3>SAE + Outils</h3><p>Situations d'apprentissage et gestion de classe</p></div>
      </div>

      <div class="zts-vip-card zts-card-pink">
        <div class="zts-vip-card-icon">\uD83C\uDD93</div>
        <div><h3>100% gratuit</h3><p>Sans abonnement ni carte de credit</p></div>
      </div>

      <div class="zts-vip-proof">
        <div class="zts-vip-avatars">
          <span style="background:#8B5CF6">MC</span>
          <span style="background:#FF2A7A">JR</span>
          <span style="background:#39FF14;color:#0a3d0a">SL</span>
        </div>
        <span class="zts-vip-proof-text">2 295 enseignants utilisent la Zone!</span>
      </div>

      <a href="https://www.zonetotalsport.ca?action=signup" class="zts-vip-cta" id="zts-vip-cta">
        \uD83C\uDFC6 REJOINDRE LA ZONE GRATUITEMENT!
      </a>

      <p class="zts-vip-small">Aucune carte de credit. Aucun abonnement. \uD83C\uDF89</p>

      <button class="zts-vip-login-link" id="zts-vip-login">Deja membre? Se connecter</button>

      <button class="zts-vip-skip" id="zts-vip-skip">Non merci, plus tard</button>

    </div>
  </div>
</div>`;

    document.body.appendChild(div);
    overlay = div;

    // Events
    div.querySelector('#zts-vip-close').addEventListener('click', hidePopup);
    div.querySelector('#zts-vip-skip').addEventListener('click', hidePopup);
    div.addEventListener('click', function(e) { if (e.target === div) hidePopup(); });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && div.classList.contains('zts-open')) hidePopup();
    });

    div.querySelector('#zts-vip-cta').addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = 'https://www.zonetotalsport.ca?action=signup';
    });

    div.querySelector('#zts-vip-login').addEventListener('click', function() {
      window.location.href = 'https://www.zonetotalsport.ca?action=login';
    });

    return div;
  }

  // ── Show / Hide ────────────────────────────────────────────────────────────
  function showPopup() {
    injectStyles();
    var p = createPopup();
    void p.offsetHeight;
    p.classList.add('zts-open');
    document.body.style.overflow = 'hidden';
  }

  function hidePopup() {
    if (!overlay) return;
    overlay.classList.remove('zts-open');
    document.body.style.overflow = '';
  }

  function showToast(msg) {
    injectStyles();
    var t = document.createElement('div');
    t.className = 'zts-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function() {
      requestAnimationFrame(function() { t.classList.add('zts-toast-show'); });
    });
    setTimeout(function() {
      t.classList.remove('zts-toast-show');
      setTimeout(function() { t.remove(); }, 500);
    }, 4000);
  }

  // ── Auto-init ──────────────────────────────────────────────────────────────
  function init() {
    // Bind all login/connexion buttons
    var btns = document.querySelectorAll('[onclick*="showAuthPopup"], [onclick*="login"], .btn-login-nav, #zts-login-btn');
    btns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showPopup();
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // ── Public API ─────────────────────────────────────────────────────────────
  root.ZTSAuth = {
    showAuthPopup: showPopup,
    hideAuthPopup: hidePopup,
    logout: function() { showToast('A bientot! \uD83D\uDC4B'); }
  };

})(window);
