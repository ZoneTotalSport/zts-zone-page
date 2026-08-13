/**
 * ZTS Newsletter — capture courriel site-wide (lead magnet 90 cours).
 *
 * Objectif : récolter les courriels du trafic SEO sans nuire au référencement.
 * - S'affiche sur les pages de CONTENU (home, hubs, blog, articles), JAMAIS
 *   sur /apps/* (déjà gérées par le verrou) ni par-dessus une autre modale.
 * - Déclencheurs : exit-intent (desktop), 50% de scroll, ou 35s.
 * - Cap de fréquence : ne réapparaît pas avant DISMISS_DAYS après fermeture,
 *   jamais si déjà abonné ou déjà connecté.
 * - Soumission → courriel écrit dans Firestore `leads`, puis accès donné TOUT
 *   DE SUITE, en clair dans la confirmation.
 * - Bouton secondaire → compte complet (ztsShowSignup) avec courriel pré-rempli.
 *
 * PLUS AUCUN COURRIEL N'EST ENVOYE — 12 aout 2026.
 * Le worker Resend (zts-send-pdf) est debranche : il repond
 * {"ok":false,"error":"API key is invalid"}. Consequences de l'ancien code, qui
 * faisait dependre le succes de CE worker :
 *   1. le visiteur voyait « Oups, reessaie dans un instant » alors que son
 *      courriel venait d'etre enregistre — il croyait avoir echoue ;
 *   2. markDone() n'etait jamais appele, donc le pop-up revenait le harceler
 *      a chaque visite, indefiniment ;
 *   3. la confirmation promettait « verifie ta boite courriel » pour un
 *      courriel qui ne partait pas.
 * Le succes depend desormais de l'ECRITURE FIRESTORE, qui, elle, fonctionne
 * (regles `leads` en place et verifiees en prod le 12 aout). L'acces est donne
 * dans la modale : plus rien a attendre dans une boite de reception.
 * Pour reactiver l'envoi un jour : remettre un appel au worker APRES la
 * confirmation, en best-effort, et surtout PAS comme condition de succes.
 *
 * Aucune dépendance obligatoire. Si firebase-auth.js est présent, on saute les
 * membres connectés. Charger avec `defer`.
 */
(function () {
  'use strict';

  var APP_URL = 'https://zonetotalsport.ca/apps/cours-maternelle/?token=DEMO2026';
  var SAVE_TIMEOUT_MS = 6000;   // au-dela, on ouvre l'acces sans attendre l'ecriture
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
      sub: 'Des jeux et idées testés au gymnase. Laisse ton courriel : l’accès s’ouvre tout de suite. 100 % gratuit, pour toujours.',
      ph: 'ton@courriel.ca',
      btn: '🎁 Débloque mes 90 cours',
      sending: 'Un instant…',
      ok: '🎉 C’est parti! Tes 90 cours t’attendent :',
      okBtn: 'Ouvrir mes 90 cours →',
      bad: 'Entre un courriel valide.',
      full: 'Je veux plutôt créer mon compte complet',
      close: 'Fermer',
      proof: '🏆 328 profs sont déjà dans la Zone'
    },
    en: {
      kicker: 'FREE GIFT',
      title: 'Get your 90 ready-to-use lessons',
      sub: 'Gym-tested games and ideas. Leave your email — access opens right away. 100% free, forever.',
      ph: 'you@email.com',
      btn: '🎁 Unlock my 90 lessons',
      sending: 'One moment…',
      ok: '🎉 Done! Your 90 lessons are waiting:',
      okBtn: 'Open my 90 lessons →',
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

  // ── Sauvegarde du lead dans Firestore (charge le SDK au besoin)
  function loadScript(src, cb) {
    var s = document.createElement('script'); s.src = src; s.onload = cb;
    s.onerror = function () { cb(); }; document.head.appendChild(s);
  }
  /* Ecrit le courriel dans `leads` et rend une promesse.
     Avant le 12 aout 2026 cette fonction etait un tir-et-oublie : le resultat
     de l'ecriture n'etait lu par personne, et c'est la reponse du worker Resend
     qui decidait de ce que voyait le visiteur. Elle rend desormais une promesse,
     parce que c'est ELLE qui decide.

     La promesse se resout TOUJOURS au bout de SAVE_TIMEOUT_MS au plus : le SDK
     Firestore se charge a la demande (les fiches de jeux ne l'embarquent pas),
     et un reseau lent ne doit pas laisser le visiteur devant un bouton
     desactive. Mieux vaut ouvrir l'acces sans avoir confirme l'ecriture que
     retenir quelqu'un qui a fait ce qu'on lui demandait.

     Regles : `leads` est create-only cote client (firestore.rules:47-53) —
     email string de 3 a 200 caracteres, ts == request.time. Aucune lecture
     publique : l'export passe par la console Firebase. */
  function saveLead(email) {
    return new Promise(function (resolve, reject) {
      var fini = false;
      var minuteur = setTimeout(function () {
        if (fini) return;
        fini = true;
        reject(new Error('delai-depasse'));
      }, SAVE_TIMEOUT_MS);

      function ok()  { if (fini) return; fini = true; clearTimeout(minuteur); resolve(); }
      function ko(e) { if (fini) return; fini = true; clearTimeout(minuteur); reject(e || new Error('echec')); }

      if (typeof firebase === 'undefined' || !firebase.apps || !firebase.apps.length) {
        ko(new Error('firebase-absent')); return;
      }
      function write() {
        try {
          firebase.firestore().collection('leads').add({
            email: email, source: 'newsletter_popup', lang: lang(),
            page: location.pathname,
            ts: firebase.firestore.FieldValue.serverTimestamp()
          }).then(ok, ko);
        } catch (e) { ko(e); }
      }
      if (firebase.firestore) { write(); return; }
      // loadScript rappelle son callback MEME en cas d'erreur reseau : on
      // reteste donc firebase.firestore plutot que de supposer le chargement.
      loadScript('https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore-compat.js', function () {
        if (firebase.firestore) write();
        else ko(new Error('firestore-indisponible'));
      });
    });
  }

  // ── Style (shadowbox néobrutaliste ZTS)
  function injectCss() {
    if (document.getElementById('zts-nl-css')) return;
    var s = document.createElement('style');
    s.id = 'zts-nl-css';
    s.textContent = [
      // L'@IMPORT EST PARTI — 9 août. Il tirait Nunito, SORTIE DU SITE le
      // 4 août (Quicksand est la seule police de lecture), et Luckiest Guy
      // depuis Google, dont le sous-ensemble `latin` n'a ni Œ ni Æ. Injecté
      // par JS, il avait échappé au balayage des polices du 8 août, qui ne
      // visait que les balises <link>. Il partait sur 26 pages, dont les
      // 25 articles.
      // Les deux polices viennent maintenant des tokens : Quicksand par le
      // <link> de la page, Luckiest Guy par le @font-face LOCAL de
      // shared/zts-header.css. Les replis nomment la famille locale d'abord,
      // pour une page qui n'aurait ni zts.css ni zts-header.css.
      '.zts-nl-overlay{position:fixed;inset:0;z-index:99990;display:flex;align-items:center;justify-content:center;padding:18px;',
      'background:rgba(15,15,46,.72);opacity:0;visibility:hidden;transition:opacity .25s,visibility .25s;}',
      '.zts-nl-overlay.open{opacity:1;visibility:visible;}',
      '.zts-nl-card{position:relative;width:100%;max-width:440px;background:linear-gradient(165deg,#E0F7FF,#CFF3FF);',
      'border:3px solid #0F0F2E;border-radius:26px;box-shadow:8px 8px 0 #0F0F2E;padding:30px 26px 26px;',
      'font-family:var(--font-body,"Quicksand",system-ui,sans-serif);transform:translateY(18px) scale(.96);transition:transform .3s cubic-bezier(.34,1.56,.64,1);}',
      '.zts-nl-overlay.open .zts-nl-card{transform:translateY(0) scale(1);}',
      '.zts-nl-x{position:absolute;top:10px;right:12px;width:34px;height:34px;border-radius:50%;border:2px solid #0F0F2E;',
      'background:#fff;color:#0F0F2E;font-size:1.2rem;line-height:1;cursor:pointer;box-shadow:2px 2px 0 #0F0F2E;}',
      '.zts-nl-x:active{transform:translate(2px,2px);box-shadow:0 0 0 #0F0F2E;}',
      '.zts-nl-kicker{display:inline-block;background:#FF2D87;color:#fff;font-family:var(--font-impact,"LuckiestGuy","Luckiest Guy",cursive);font-size:.8rem;',
      'letter-spacing:1.5px;padding:5px 14px;border-radius:999px;border:2px solid #0F0F2E;box-shadow:2px 2px 0 #0F0F2E;transform:rotate(-3deg);}',
      '.zts-nl-title{font-family:var(--font-impact,"LuckiestGuy","Luckiest Guy",cursive);font-size:clamp(24px,5.5vw,32px);color:#0F0F2E;line-height:1.05;margin:14px 0 8px;}',
      '.zts-nl-sub{font-size:1rem;color:#1a2540;opacity:.85;margin:0 0 16px;line-height:1.4;}',
      '.zts-nl-form{display:flex;flex-direction:column;gap:10px;}',
      '.zts-nl-form input{width:100%;box-sizing:border-box;padding:15px 16px;border:3px solid #0F0F2E;border-radius:14px;',
      'font-family:inherit;font-size:1.05rem;font-weight:700;background:#fff;color:#0F0F2E;}',
      '.zts-nl-form input:focus{outline:none;box-shadow:0 0 0 3px rgba(0,229,255,.5);}',
      '.zts-nl-btn{cursor:pointer;font-family:var(--font-impact,"LuckiestGuy","Luckiest Guy",cursive);font-size:1.15rem;letter-spacing:.5px;padding:15px;',
      'border:3px solid #0F0F2E;border-radius:14px;background:#FFD700;color:#0F0F2E;box-shadow:4px 4px 0 #0F0F2E;}',
      '.zts-nl-btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #0F0F2E;}',
      '.zts-nl-btn[disabled]{opacity:.6;cursor:default;}',
      '.zts-nl-full{margin:12px 0 0;background:none;border:none;color:#0F0F2E;text-decoration:underline;cursor:pointer;font-family:inherit;font-weight:700;font-size:.92rem;opacity:.8;}',
      '.zts-nl-proof{margin:14px 0 0;text-align:center;font-family:var(--font-impact,"LuckiestGuy","Luckiest Guy",cursive);color:#0F0F2E;font-size:.95rem;letter-spacing:.5px;}',
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
      btn.disabled = true; btn.textContent = tr2.sending;
      track('newsletter_submit', { source: 'popup' });

      // Le visiteur a donne son courriel : il obtient son acces, point. Que
      // l'ecriture aboutisse ou non ne le regarde pas — c'est notre probleme,
      // pas le sien. D'ou le meme ecran dans les deux cas, et markDone() dans
      // les deux cas : le harceler a la visite suivante serait le punir d'un
      // defaut qui n'est pas le sien.
      // L'echec reste visible POUR NOUS, par un evenement de tunnel distinct.
      saveLead(email)
        .then(function () {
          track('newsletter_complete', { source: 'popup' });
        })
        .catch(function (e) {
          track('newsletter_save_failed', { source: 'popup', reason: (e && e.message) || 'inconnu' });
        })
        .then(function () {
          markDone();
          donnerAcces();
        });
    });

    /* Confirmation : l'acces EN CLAIR, tout de suite. Plus de « verifie ta
       boite courriel » — plus aucun courriel ne part (voir l'en-tete). */
    function donnerAcces() {
      form.style.display = 'none';
      var plein = ov.querySelector('.zts-nl-full');
      if (plein) plein.style.display = 'none';

      var tr3 = t();
      showMsg(tr3.ok, 'ok');

      // Un lien, pas un bouton : il doit rester ouvrable dans un nouvel onglet
      // et survivre a la fermeture de la modale.
      if (!ov.querySelector('.zts-nl-go')) {
        var a = document.createElement('a');
        a.className = 'zts-nl-btn zts-nl-go';
        a.href = APP_URL;
        a.textContent = tr3.okBtn;
        a.style.display = 'block';
        a.style.textDecoration = 'none';
        a.style.textAlign = 'center';
        a.style.marginTop = '12px';
        a.addEventListener('click', function () { track('newsletter_open_gift', { source: 'popup' }); });
        msg.parentNode.insertBefore(a, msg.nextSibling);
      }
      // La modale ne se referme plus toute seule : le lien est l'objet meme de
      // la visite, l'escamoter au bout de 3,5 s ferait perdre le cadeau.
    }

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
