/**
 * ZTS Newsletter — capture courriel site-wide (lead magnet 90 cours).
 *
 * Objectif : récolter les courriels du trafic SEO sans nuire au référencement.
 * - S'affiche sur les pages de CONTENU (home, hubs, blog, articles), JAMAIS
 *   sur /apps/* (déjà gérées par le verrou) ni par-dessus une autre modale.
 * - Déclencheurs : exit-intent (desktop), 50% de scroll, ou 35s.
 * - Cap de fréquence : ne réapparaît pas avant DISMISS_DAYS après fermeture,
 *   jamais si déjà abonné ou déjà connecté.
 * - Soumission → worker Resend (zts-send-pdf) qui envoie l'accès par courriel.
 * - Bouton secondaire → compte complet (ztsShowSignup) avec courriel pré-rempli.
 *
 * Aucune dépendance obligatoire. Si firebase-auth.js est présent, on saute les
 * membres connectés. Charger avec `defer`.
 */
(function () {
  'use strict';

  var WORKER_URL = 'https://zts-send-pdf.zts-ccd.workers.dev';
  var APP_URL = 'https://zonetotalsport.ca/apps/cours-maternelle/?token=DEMO2026';
  var DELAY_MS = 35000;
  var SCROLL_RATIO = 0.5;
  var DISMISS_DAYS = 10;
  var DONE_KEY = 'zts_nl_done';
  var DISMISS_KEY = 'zts_nl_dismissed';

  // ── Ne PAS afficher sur les apps (déjà gated) ni sur les pages techniques
  function pathBlocked() {
    var p = location.pathname;
    return /\/apps\//.test(p) || /bienvenue|politique|login|teasing|promo/.test(p);
  }

  function lang() {
    try {
      if (window.ZTS && ZTS.getLang) return ZTS.getLang() === 'en' ? 'en' : 'fr';
      var s = localStorage.getItem('zts_lang');
      if (s === 'en') return 'en';
    } catch (e) {}
    return (navigator.language || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr';
  }

  var T = {
    fr: {
      kicker: 'CADEAU GRATUIT',
      title: 'Reçois tes 90 cours clé en main',
      sub: 'Des jeux et idées testés au gymnase, droit dans ta boîte courriel. 100 % gratuit, pour toujours. Aucune carte de crédit.',
      ph: 'ton@courriel.ca',
      btn: '🎁 Envoie-moi l’accès',
      sending: 'Envoi…',
      ok: '🎉 C’est parti! Vérifie ta boîte courriel (et tes indésirables).',
      err: 'Oups, réessaie dans un instant.',
      bad: 'Entre un courriel valide.',
      full: 'Je veux plutôt créer mon compte complet',
      close: 'Fermer',
      proof: '🏆 328 profs sont déjà dans la Zone'
    },
    en: {
      kicker: 'FREE GIFT',
      title: 'Get your 90 ready-to-use lessons',
      sub: 'Gym-tested games and ideas, straight to your inbox. 100% free, forever. No credit card.',
      ph: 'you@email.com',
      btn: '🎁 Send me access',
      sending: 'Sending…',
      ok: '🎉 Done! Check your inbox (and spam folder).',
      err: 'Oops, try again in a moment.',
      bad: 'Enter a valid email.',
      full: 'I’d rather create my full account',
      close: 'Close',
      proof: '🏆 328 teachers are already in the Zone'
    }
  };
  function t() { return T[lang()]; }

  // ── Fréquence
  function recentlyDismissed() {
    try {
      if (localStorage.getItem(DONE_KEY)) return true;
      var d = parseInt(localStorage.getItem(DISMISS_KEY) || '0', 10);
      if (!d) return false;
      return (Date.now() - d) < DISMISS_DAYS * 86400000;
    } catch (e) { return false; }
  }
  function markDismissed() { try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) {} }
  function markDone() { try { localStorage.setItem(DONE_KEY, '1'); } catch (e) {} }

  // ── Conflit : une autre modale est ouverte ?
  function modalOpen() {
    return !!document.querySelector('.zts-auth-overlay.zts-open, .zts-locked-overlay, #ztsLockedFullscreen, .zts-nl-overlay');
  }

  function track(ev, extra) {
    if (window.ztsTrackFunnel) window.ztsTrackFunnel(ev, extra || {});
  }

  // ── Style (shadowbox néobrutaliste ZTS)
  function injectCss() {
    if (document.getElementById('zts-nl-css')) return;
    var s = document.createElement('style');
    s.id = 'zts-nl-css';
    s.textContent = [
      '@import url("https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Nunito:wght@600;800&display=swap");',
      '.zts-nl-overlay{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:18px;',
      'background:rgba(15,15,46,.72);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;}',
      '.zts-nl-overlay.open{opacity:1;visibility:visible;}',
      '.zts-nl-card{position:relative;width:100%;max-width:440px;background:linear-gradient(165deg,#E0F7FF,#CFF3FF);',
      'border:3px solid #0F0F2E;border-radius:26px;box-shadow:8px 8px 0 #0F0F2E;padding:30px 26px 26px;',
      'font-family:"Nunito",system-ui,sans-serif;transform:translateY(18px) scale(.96);transition:transform .3s cubic-bezier(.34,1.56,.64,1);}',
      '.zts-nl-overlay.open .zts-nl-card{transform:translateY(0) scale(1);}',
      '.zts-nl-x{position:absolute;top:10px;right:12px;width:34px;height:34px;border-radius:50%;border:2px solid #0F0F2E;',
      'background:#fff;color:#0F0F2E;font-size:1.2rem;line-height:1;cursor:pointer;box-shadow:2px 2px 0 #0F0F2E;}',
      '.zts-nl-x:active{transform:translate(2px,2px);box-shadow:0 0 0 #0F0F2E;}',
      '.zts-nl-kicker{display:inline-block;background:#FF2D87;color:#fff;font-family:"Luckiest Guy",cursive;font-size:.8rem;',
      'letter-spacing:1.5px;padding:5px 14px;border-radius:999px;border:2px solid #0F0F2E;box-shadow:2px 2px 0 #0F0F2E;transform:rotate(-3deg);}',
      '.zts-nl-title{font-family:"Luckiest Guy",cursive;font-size:clamp(24px,5.5vw,32px);color:#0F0F2E;line-height:1.05;margin:14px 0 8px;}',
      '.zts-nl-sub{font-size:1rem;color:#1a2540;opacity:.85;margin:0 0 16px;line-height:1.4;}',
      '.zts-nl-form{display:flex;flex-direction:column;gap:10px;}',
      '.zts-nl-form input{width:100%;box-sizing:border-box;padding:15px 16px;border:3px solid #0F0F2E;border-radius:14px;',
      'font-family:inherit;font-size:1.05rem;font-weight:700;background:#fff;color:#0F0F2E;}',
      '.zts-nl-form input:focus{outline:none;box-shadow:0 0 0 3px rgba(0,229,255,.5);}',
      '.zts-nl-btn{cursor:pointer;font-family:"Luckiest Guy",cursive;font-size:1.15rem;letter-spacing:.5px;padding:15px;',
      'border:3px solid #0F0F2E;border-radius:14px;background:#FFD700;color:#0F0F2E;box-shadow:4px 4px 0 #0F0F2E;}',
      '.zts-nl-btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #0F0F2E;}',
      '.zts-nl-btn[disabled]{opacity:.6;cursor:default;}',
      '.zts-nl-full{margin:12px 0 0;background:none;border:none;color:#0F0F2E;text-decoration:underline;cursor:pointer;font-family:inherit;font-weight:700;font-size:.92rem;opacity:.8;}',
      '.zts-nl-proof{margin:14px 0 0;text-align:center;font-family:"Luckiest Guy",cursive;color:#0F0F2E;font-size:.95rem;letter-spacing:.5px;}',
      '.zts-nl-msg{margin:10px 0 0;font-weight:800;font-size:.98rem;text-align:center;}',
      '.zts-nl-msg.ok{color:#0a7d2e;}.zts-nl-msg.err{color:#c41d4a;}',
      '@media(max-width:480px){.zts-nl-card{padding:26px 18px 20px;box-shadow:6px 6px 0 #0F0F2E;}}'
    ].join('');
    document.head.appendChild(s);
  }

  var shown = false;

  function build() {
    var tr = t();
    var ov = document.createElement('div');
    ov.className = 'zts-nl-overlay';
    ov.innerHTML =
      '<div class="zts-nl-card" role="dialog" aria-modal="true" aria-label="' + tr.title + '">' +
        '<button class="zts-nl-x" aria-label="' + tr.close + '">&times;</button>' +
        '<span class="zts-nl-kicker">' + tr.kicker + '</span>' +
        '<h2 class="zts-nl-title">' + tr.title + '</h2>' +
        '<p class="zts-nl-sub">' + tr.sub + '</p>' +
        '<form class="zts-nl-form" novalidate>' +
          '<input type="email" autocomplete="email" placeholder="' + tr.ph + '" required>' +
          '<button type="submit" class="zts-nl-btn">' + tr.btn + '</button>' +
        '</form>' +
        '<div class="zts-nl-msg" hidden></div>' +
        '<button type="button" class="zts-nl-full">' + tr.full + '</button>' +
        '<p class="zts-nl-proof">' + tr.proof + '</p>' +
      '</div>';
    document.body.appendChild(ov);

    var card = ov.querySelector('.zts-nl-card');
    var input = ov.querySelector('input');
    var form = ov.querySelector('.zts-nl-form');
    var btn = ov.querySelector('.zts-nl-btn');
    var msg = ov.querySelector('.zts-nl-msg');

    function close(reason) {
      ov.classList.remove('open');
      markDismissed();
      track('newsletter_close', { reason: reason || 'x' });
      setTimeout(function () { if (ov.parentNode) ov.remove(); }, 320);
    }
    ov.querySelector('.zts-nl-x').addEventListener('click', function () { close('x'); });
    ov.addEventListener('click', function (e) { if (e.target === ov) close('backdrop'); });
    document.addEventListener('keydown', function esc(e) {
      if (e.key === 'Escape' && document.body.contains(ov)) { close('esc'); document.removeEventListener('keydown', esc); }
    });

    // Bouton secondaire : compte complet (pré-remplit la modale auth)
    ov.querySelector('.zts-nl-full').addEventListener('click', function () {
      try { if (input.value.trim()) sessionStorage.setItem('zts_signup_prefill_email', input.value.trim()); } catch (e) {}
      try { sessionStorage.setItem('zts_signup_source', 'newsletter_popup'); } catch (e) {}
      track('newsletter_to_signup', {});
      if (window.ztsShowSignup) { close('to_signup'); window.ztsShowSignup(); }
    });

    function showMsg(text, kind) {
      msg.textContent = text; msg.className = 'zts-nl-msg ' + kind; msg.hidden = false;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var tr2 = t();
      var email = input.value.trim();
      if (!email || email.indexOf('@') < 1) { showMsg(tr2.bad, 'err'); return; }
      btn.disabled = true; var label = btn.textContent; btn.textContent = tr2.sending;
      track('newsletter_submit', { source: 'popup' });

      // Lead → Firestore (best-effort, si firebase dispo)
      try {
        if (window.firebase && firebase.firestore) {
          firebase.firestore().collection('leads').add({
            email: email, source: 'newsletter_popup', lang: lang(),
            page: location.pathname, ts: firebase.firestore.FieldValue.serverTimestamp()
          }).catch(function () {});
        }
      } catch (e) {}

      // Envoi de l'accès par courriel via le worker Resend
      fetch(WORKER_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, lang: lang(), appUrl: APP_URL, pdf: '90cours' })
      })
      .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
      .then(function (res) {
        if (res && res.ok) {
          markDone();
          track('newsletter_complete', { source: 'popup' });
          form.style.display = 'none';
          ov.querySelector('.zts-nl-full').style.display = 'none';
          showMsg(t().ok, 'ok');
          setTimeout(function () { ov.classList.remove('open'); setTimeout(function () { if (ov.parentNode) ov.remove(); }, 320); }, 3500);
        } else {
          btn.disabled = false; btn.textContent = label;
          showMsg(t().err, 'err');
        }
      })
      .catch(function () { btn.disabled = false; btn.textContent = label; showMsg(t().err, 'err'); });
    });

    requestAnimationFrame(function () { requestAnimationFrame(function () { ov.classList.add('open'); }); });
    setTimeout(function () { if (ov.parentNode) ov.classList.add('open'); }, 60);
    track('newsletter_view', { trigger: ov.dataset.trigger || 'unknown' });
    setTimeout(function () { try { input.focus(); } catch (e) {} }, 400);
    return ov;
  }

  function trigger(reason) {
    if (shown || recentlyDismissed() || modalOpen()) return;
    shown = true;
    var ov = build();
    if (ov) ov.dataset.trigger = reason;
  }

  function arm() {
    if (recentlyDismissed()) return;

    // 1) délai
    var timer = setTimeout(function () { trigger('delay'); }, DELAY_MS);

    // 2) scroll 50%
    function onScroll() {
      var h = document.documentElement;
      var ratio = (h.scrollTop + window.innerHeight) / (h.scrollHeight || 1);
      if (ratio >= SCROLL_RATIO) { window.removeEventListener('scroll', onScroll); trigger('scroll'); }
    }
    window.addEventListener('scroll', onScroll, { passive: true });

    // 3) exit-intent (desktop)
    function onLeave(e) {
      if (e.clientY <= 0) { document.removeEventListener('mouseout', onLeave); trigger('exit'); }
    }
    if (!/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) {
      document.addEventListener('mouseout', onLeave);
    }
  }

  function boot() {
    if (pathBlocked() || recentlyDismissed()) return;
    injectCss();

    // Sauter les membres connectés si firebase-auth.js est là
    if (window.ztsOnAuth) {
      var decided = false;
      window.ztsOnAuth(function (user) {
        if (decided) return; decided = true;
        if (!user) arm();
      });
      // Filet si ztsOnAuth ne répond jamais
      setTimeout(function () { if (!decided) { decided = true; arm(); } }, 2500);
    } else {
      arm();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ZTS_NEWSLETTER = { open: function () { shown = false; trigger('manual'); } };
})();
