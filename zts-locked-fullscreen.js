/**
 * ZTS Locked Fullscreen — Pop-up cadenas plein ecran (composant unifie)
 *
 * Usage : window.ztsShowLockedFullscreen({ source, slug, targetUrl, closable })
 *   - source : 'article' | 'resource' | 'grid' | 'generator'
 *   - slug   : identifiant pour tracking
 *   - targetUrl : URL a ouvrir apres inscription (passe a ztsSetProtected)
 *   - closable : true (overlay sur grille) | false (page entiere verrouillee)
 *
 * Style : Pop Art Mr. Root (Patrick Hand, cyan/violet, dashed, offset shadow).
 */
(function () {
  'use strict';

  var STYLE_ID = 'zts-locked-fullscreen-css';
  var OVERLAY_ID = 'zts-locked-fullscreen';

  var CSS =
    '#' + OVERLAY_ID + '{position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;background:linear-gradient(135deg,#1e3a8a 0%,#4c1d95 50%,#6d28d9 100%);font-family:"Patrick Hand","Comic Neue",cursive;color:#fff;overflow-y:auto;animation:zts-lf-fade .25s ease-out}' +
    '#' + OVERLAY_ID + '::before{content:"";position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.08) 1.5px,transparent 1.5px);background-size:18px 18px;pointer-events:none;opacity:.6}' +
    '@keyframes zts-lf-fade{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}' +
    '.zts-lf-box{position:relative;z-index:1;max-width:560px;width:100%;background:#fff;color:#1f2937;border:4px solid #000;border-radius:24px;box-shadow:10px 10px 0 #000;padding:32px 28px;text-align:center}' +
    '.zts-lf-close{position:absolute;top:10px;right:14px;background:#FFD700;border:3px solid #000;border-radius:50%;width:40px;height:40px;font-size:1.4rem;cursor:pointer;font-weight:bold;line-height:1;box-shadow:3px 3px 0 #000;transition:transform .15s}' +
    '.zts-lf-close:hover{transform:rotate(-10deg) scale(1.1)}' +
    '.zts-lf-icon{font-size:3.5rem;margin-bottom:6px;display:inline-block;animation:zts-lf-bounce 1.4s ease-in-out infinite}' +
    '@keyframes zts-lf-bounce{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-6px) rotate(4deg)}}' +
    '.zts-lf-title{font-family:"Luckiest Guy","Patrick Hand",cursive;font-size:clamp(1.5rem,4vw,2.1rem);color:#1e3a8a;line-height:1.15;margin:0 0 14px;letter-spacing:.5px}' +
    '.zts-lf-sub{font-size:1.05rem;color:#374151;margin:0 0 18px;line-height:1.4}' +
    '.zts-lf-perks{list-style:none;padding:0;margin:0 0 18px;text-align:left;display:inline-block}' +
    '.zts-lf-perks li{font-size:1.05rem;margin:6px 0;color:#1f2937;font-family:"Patrick Hand",cursive}' +
    '.zts-lf-perks li::before{content:"OUI";color:#10b981;font-weight:bold;font-family:"Luckiest Guy",cursive;font-size:.85rem;background:#d1fae5;padding:1px 6px;border-radius:6px;margin-right:8px;border:2px solid #10b981}' +
    '.zts-lf-bonus{background:linear-gradient(135deg,#FFF7CC,#FFE066);border:3px dashed #1e3a8a;border-radius:14px;padding:12px 14px;margin:0 0 20px;font-family:"Patrick Hand",cursive;color:#1e3a8a;font-size:1.05rem;line-height:1.3}' +
    '.zts-lf-bonus strong{font-family:"Luckiest Guy",cursive;font-size:1.15rem;letter-spacing:.5px}' +
    '.zts-lf-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-bottom:14px}' +
    '.zts-lf-btn{font-family:"Luckiest Guy","Patrick Hand",cursive;font-size:1.05rem;letter-spacing:.5px;padding:14px 18px;border:3px solid #000;border-radius:14px;cursor:pointer;box-shadow:5px 5px 0 #000;transition:transform .15s,box-shadow .15s;min-width:180px;flex:1 1 200px;max-width:240px}' +
    '.zts-lf-btn:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 #000}' +
    '.zts-lf-btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #000}' +
    '.zts-lf-btn-google{background:#fff;color:#1f2937}' +
    '.zts-lf-btn-email{background:#00C4FF;color:#fff}' +
    '.zts-lf-login{font-size:.95rem;color:#4b5563;margin:8px 0 12px}' +
    '.zts-lf-login a{color:#1e3a8a;font-weight:bold;text-decoration:underline;cursor:pointer}' +
    '.zts-lf-social{font-size:.88rem;color:#6b7280;font-style:italic;margin-top:6px}' +
    '@media(max-width:480px){.zts-lf-box{padding:24px 18px}.zts-lf-btn{flex:1 1 100%;max-width:100%}}';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function noun(source) {
    if (source === 'article') return 'Cet article est reserve aux membres gratuits';
    if (source === 'resource') return 'Cette ressource est reservee aux membres gratuits';
    if (source === 'generator') return 'Tu as utilise tes 2 essais gratuits du generateur';
    return 'Ce contenu est reserve aux membres gratuits';
  }

  function build(opts) {
    var box = document.createElement('div');
    box.className = 'zts-lf-box';

    var closeBtn = opts.closable
      ? '<button class="zts-lf-close" aria-label="Fermer">X</button>' : '';

    box.innerHTML =
      closeBtn +
      '<div class="zts-lf-icon">CADENAS</div>' +
      '<h1 class="zts-lf-title">' + noun(opts.source) + '</h1>' +
      '<p class="zts-lf-sub">Cree ton compte en 10 secondes (gratuit, sans carte).</p>' +
      '<ul class="zts-lf-perks">' +
        '<li>Acces a TOUTES les ressources (200+)</li>' +
        '<li>Tous les articles complets</li>' +
        '<li>Generateur IA illimite</li>' +
      '</ul>' +
      '<div class="zts-lf-bonus"><strong>BONUS</strong><br>90 cours cle en main d EPS livres par courriel</div>' +
      '<div class="zts-lf-btns">' +
        '<button class="zts-lf-btn zts-lf-btn-google" data-action="google">Continuer avec Google</button>' +
        '<button class="zts-lf-btn zts-lf-btn-email" data-action="email">S inscrire avec un courriel</button>' +
      '</div>' +
      '<div class="zts-lf-login">Deja membre ? <a data-action="login">Connecte-toi</a></div>' +
      '<div class="zts-lf-social">Marie-Claude et 47 autres profs se sont inscrits cette semaine</div>';

    // Replace placeholder text with emojis (avoid encoding issues in source)
    var icon = box.querySelector('.zts-lf-icon');
    if (icon) icon.textContent = '🔒';
    var bonus = box.querySelector('.zts-lf-bonus strong');
    if (bonus) bonus.textContent = '🎁 BONUS';

    return box;
  }

  function fireSignup(provider, targetUrl) {
    if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_click_signup', { source: 'fullscreen', provider: provider });
    if (targetUrl && window.ztsSetProtected) window.ztsSetProtected(targetUrl);
    if (window.ztsShowSignup) window.ztsShowSignup({ provider: provider });
  }

  function fireLogin() {
    if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_click_login', { source: 'fullscreen' });
    if (window.ztsShowLogin) window.ztsShowLogin();
  }

  function close() {
    var el = document.getElementById(OVERLAY_ID);
    if (el) el.remove();
    document.body.style.overflow = '';
  }

  window.ztsShowLockedFullscreen = function (opts) {
    opts = opts || {};
    injectStyles();
    close();

    if (window.ztsTrackFunnel) {
      window.ztsTrackFunnel('locked_view', { source: opts.source || 'unknown', slug: opts.slug, layer: 'fullscreen' });
    }

    var overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    overlay.appendChild(build(opts));
    document.body.appendChild(overlay);
    if (!opts.closable) document.body.style.overflow = 'hidden';

    overlay.addEventListener('click', function (e) {
      var act = e.target && e.target.getAttribute && e.target.getAttribute('data-action');
      if (act === 'google' || act === 'email') {
        fireSignup(act, opts.targetUrl);
      } else if (act === 'login') {
        fireLogin();
      } else if (e.target.classList && e.target.classList.contains('zts-lf-close')) {
        close();
      }
    });

    // Auto-unlock on auth state change
    if (window.ztsOnAuth) {
      window.ztsOnAuth(function (user) { if (user) close(); });
    }
  };

  window.ztsCloseLockedFullscreen = close;
})();
