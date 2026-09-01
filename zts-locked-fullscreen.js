/**
 * ZTS Locked Fullscreen — Pop-up cadenas plein ecran (composant unifie)
 *
 * Usage : window.ztsShowLockedFullscreen({ source, slug, targetUrl, closable })
 *   - source : 'article' | 'resource' | 'grid' | 'generator'
 *   - slug   : identifiant pour tracking
 *   - targetUrl : URL a ouvrir apres inscription (passe a ztsSetProtected)
 *   - closable : true (overlay sur grille) | false (page entiere verrouillee)
 *
 * Style : Pop Art Mr. Root (tokens du shell, cyan/violet, dashed, offset shadow).
 */
(function () {
  'use strict';

  var STYLE_ID = 'zts-locked-fullscreen-css';
  var OVERLAY_ID = 'zts-locked-fullscreen';

  var CSS =
    '#' + OVERLAY_ID + '{position:fixed;inset:0;z-index:99998;display:flex;align-items:center;justify-content:center;padding:20px;background:linear-gradient(135deg,#1e3a8a 0%,#4c1d95 50%,#6d28d9 100%);font-family:var(--ztsh-f-corps,"Quicksand",system-ui,sans-serif);color:#fff;overflow-y:auto;animation:zts-lf-fade .25s ease-out}' +
    '#' + OVERLAY_ID + '::before{content:"";position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.08) 1.5px,transparent 1.5px);background-size:18px 18px;pointer-events:none;opacity:.6}' +
    '@keyframes zts-lf-fade{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}' +
    '.zts-lf-box{position:relative;z-index:1;max-width:560px;width:100%;background:#fff;color:#1f2937;border:4px solid #000;border-radius:24px;box-shadow:10px 10px 0 #000;padding:32px 28px;text-align:center}' +
    '.zts-lf-close{position:absolute;top:10px;right:14px;background:#FFD700;border:3px solid #000;border-radius:50%;width:40px;height:40px;font-size:1.4rem;cursor:pointer;font-weight:bold;line-height:1;box-shadow:3px 3px 0 #000;transition:transform .15s}' +
    '.zts-lf-close:hover{transform:rotate(-10deg) scale(1.1)}' +
    '.zts-lf-icon{font-size:3.5rem;margin-bottom:6px;display:inline-block;animation:zts-lf-bounce 1.4s ease-in-out infinite}' +
    '@keyframes zts-lf-bounce{0%,100%{transform:translateY(0) rotate(-4deg)}50%{transform:translateY(-6px) rotate(4deg)}}' +
    '.zts-lf-title{font-family:var(--ztsh-f-titre,"Luckiest Guy",system-ui,sans-serif);font-size:clamp(1.5rem,4vw,2.1rem);color:#1e3a8a;line-height:1.15;margin:0 0 14px;letter-spacing:.5px}' +
    '.zts-lf-sub{font-size:1.05rem;color:#374151;margin:0 0 18px;line-height:1.4}' +
    '.zts-lf-perks{list-style:none;padding:0;margin:0 0 18px;text-align:left;display:inline-block}' +
    '.zts-lf-perks li{font-size:1.05rem;margin:6px 0;color:#1f2937;font-family:var(--ztsh-f-corps,"Quicksand",system-ui,sans-serif)}' +
    '.zts-lf-perks li::before{content:"OUI";color:#10b981;font-weight:bold;font-family:var(--ztsh-f-titre,"Luckiest Guy",system-ui,sans-serif);font-size:.85rem;background:#d1fae5;padding:1px 6px;border-radius:6px;margin-right:8px;border:2px solid #10b981}' +
    '.zts-lf-bonus{background:linear-gradient(135deg,#FFF7CC,#FFE066);border:3px dashed #1e3a8a;border-radius:14px;padding:12px 14px;margin:0 0 20px;font-family:var(--ztsh-f-corps,"Quicksand",system-ui,sans-serif);color:#1e3a8a;font-size:1.05rem;line-height:1.3}' +
    '.zts-lf-bonus strong{font-family:var(--ztsh-f-titre,"Luckiest Guy",system-ui,sans-serif);font-size:1.15rem;letter-spacing:.5px}' +
    '.zts-lf-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-bottom:14px}' +
    '.zts-lf-btn{font-family:var(--ztsh-f-titre,"Luckiest Guy",system-ui,sans-serif);font-size:1.05rem;letter-spacing:.5px;padding:14px 18px;border:3px solid #000;border-radius:14px;cursor:pointer;box-shadow:5px 5px 0 #000;transition:transform .15s,box-shadow .15s;min-width:180px;flex:1 1 200px;max-width:240px}' +
    '.zts-lf-btn:hover{transform:translate(-2px,-2px);box-shadow:7px 7px 0 #000}' +
    '.zts-lf-btn:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #000}' +
    '.zts-lf-btn-google{background:#fff;color:#1f2937}' +
    '.zts-lf-btn-email{background:#00C4FF;color:#fff}' +
    '.zts-lf-login{font-size:.95rem;color:#4b5563;margin:8px 0 12px}' +
    '.zts-lf-login a{color:#1e3a8a;font-weight:bold;text-decoration:underline;cursor:pointer}' +
    '.zts-lf-social{font-size:.88rem;color:#6b7280;font-style:italic;margin-top:6px}' +
    '.zts-lf-genia{font-size:.92rem;color:#1e3a8a;background:#EEF6FF;border:2px dashed #93c5fd;' +
    'border-radius:11px;padding:8px 12px;margin:2px 0 10px}' +
    '.zts-lf-genia a{color:#1e3a8a;font-weight:bold;text-decoration:underline}' +
    '@media(max-width:480px){.zts-lf-box{padding:24px 18px}.zts-lf-btn{flex:1 1 100%;max-width:100%}}';

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    // AUCUNE POLICE N'EST CHARGEE ICI. Ce module injectait un <link> vers
    // Google Fonts pour tirer Fredoka — une police sortie du site le 4 aout
    // 2026. Le meme motif a ete retire de zts-newsletter.js le 9 aout, et le
    // §D de LOT0-COMPLETE.md l'a signale dans zts-jeux-cta.js comme une chose
    // a ne surtout pas refusionner. Il vivait pourtant encore ici, sur toutes
    // les pages qui affichent le mur.
    //
    // Deux torts, pas un : une requete vers un tiers sur chaque page murée,
    // et une police que le reste du site n'utilise plus — donc un mur qui ne
    // ressemblait pas au site autour de lui.
    //
    // Les styles ci-dessous prennent les tokens du shell
    // (--ztsh-f-titre, --ztsh-f-corps) avec un repli explicite.
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

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

  var T = {
    fr: {
      titreArticle:   'Cet article est réservé aux membres gratuits',
      titreRessource: 'Cette ressource est réservée aux membres gratuits',
      // Le nombre vient de window.ztsAnonLimit — le plafond appartient a
      // zts-anon-fingerprint.js depuis le 21 aout. Ecrit en dur, il disait
      // encore « 2 essais » alors que le mur tombe a 3.
      titreGenerateur: function (n) { return 'Tu as utilisé tes ' + n + ' essais gratuits du générateur'; },
      titreDefaut:    'Ce contenu est réservé aux membres gratuits',
      sous:     'Crée ton compte en 10 secondes (gratuit, sans carte).',
      perks:    ['Accès à TOUTES les ressources (200+)', 'Tous les articles complets', 'Générateur IA illimité'],
      bonus:    '90 cours clé en main d\'ÉPS livrés par courriel',
      google:   'Continuer avec Google',
      courriel: 'S\'inscrire avec un courriel',
      dejaLabel: 'Déjà membre ? ',
      dejaLien: 'Connecte-toi',
      social:   'Rejoins les profs du Québec qui utilisent la Zone chaque semaine',
      fermer:   'Fermer',
      // Le nombre vient de window.ztsAnonLimit, jamais du texte : c'est le
      // meme plafond que celui du mur du generateur, deux lignes plus haut.
      genia:    function (n) { return n + ' essais gratuits de l\'assistant IA, sans compte'; },
      geniaLien: 'Essayer →'
    },
    en: {
      titreArticle:   'This article is for free members',
      titreRessource: 'This resource is for free members',
      titreGenerateur: function (n) { return 'You have used your ' + n + ' free generator tries'; },
      titreDefaut:    'This content is for free members',
      sous:     'Create your account in 10 seconds (free, no card).',
      perks:    ['Access to ALL resources (200+)', 'Every article, in full', 'Unlimited AI generator'],
      bonus:    '90 ready-to-teach PE lessons, sent by email',
      google:   'Continue with Google',
      courriel: 'Sign up with an email',
      dejaLabel: 'Already a member? ',
      dejaLien: 'Sign in',
      social:   'Join the Quebec teachers who use the Zone every week',
      fermer:   'Close',
      genia:    function (n) { return n + ' free AI assistant tries, no account'; },
      geniaLien: 'Try it →'
    }
  };
  function t() { return T[lang()] || T.fr; }

  // SEUL lecteur du plafond anonyme dans ce fichier. Le proprietaire est
  // zts-anon-fingerprint.js, qui l'expose en window.ztsAnonLimit ; le repli
  // vaut ce que vaut le sien, et il est ecrit une seule fois.
  function plafondAnon() {
    return (typeof window.ztsAnonLimit === 'number' && window.ztsAnonLimit > 0) ? window.ztsAnonLimit : 3;
  }

  function noun(source) {
    var d = t();
    if (source === 'article') return d.titreArticle;
    if (source === 'resource') return d.titreRessource;
    if (source === 'generator') return d.titreGenerateur(plafondAnon());
    return d.titreDefaut;
  }

  function build(opts) {
    var box = document.createElement('div');
    box.className = 'zts-lf-box';

    var d = t();
    var closeBtn = opts.closable
      ? '<button class="zts-lf-close" aria-label="' + d.fermer + '">X</button>' : '';

    box.innerHTML =
      closeBtn +
      '<div class="zts-lf-icon">CADENAS</div>' +
      '<h1 class="zts-lf-title">' + noun(opts.source) + '</h1>' +
      '<p class="zts-lf-sub">' + d.sous + '</p>' +
      '<ul class="zts-lf-perks">' +
        '<li>' + d.perks[0] + '</li>' +
        '<li>' + d.perks[1] + '</li>' +
        '<li>' + d.perks[2] + '</li>' +
      '</ul>' +
      '<div class="zts-lf-bonus"><strong>BONUS</strong><br>' + d.bonus + '</div>' +
      '<div class="zts-lf-btns">' +
        '<button class="zts-lf-btn zts-lf-btn-google" data-action="google">' + d.google + '</button>' +
        '<button class="zts-lf-btn zts-lf-btn-email" data-action="email">' + d.courriel + '</button>' +
      '</div>' +
      '<div class="zts-lf-login">' + d.dejaLabel + '<a data-action="login">' + d.dejaLien + '</a></div>' +
      (opts.source === 'generator' ? '' :
        '<div class="zts-lf-genia">' + d.genia(plafondAnon()) +
        ' <a data-action="genia" href="/apps/generateur/">' + d.geniaLien + '</a></div>') +
      '<div class="zts-lf-social">' + d.social + '</div>';

    // Replace placeholder text with emojis (avoid encoding issues in source)
    var icon = box.querySelector('.zts-lf-icon');
    if (icon) icon.textContent = '🔒';
    var bonus = box.querySelector('.zts-lf-bonus strong');
    if (bonus) bonus.textContent = '🎁 BONUS';

    return box;
  }

  function fireSignup(provider, targetUrl) {
    try { sessionStorage.setItem('zts_signup_source', 'popup'); } catch (e) {}
    if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_click_signup', { source: 'fullscreen', provider: provider, cta_source: 'popup' });
    if (targetUrl && window.ztsSetProtected) window.ztsSetProtected(targetUrl);
    if (window.ztsShowSignup) window.ztsShowSignup({ provider: provider });
  }

  function fireLogin() {
    if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_click_login', { source: 'fullscreen' });
    if (window.ztsShowLogin) window.ztsShowLogin();
  }

  // Bascule FR/EN pendant que le mur est affiche : on redessine SON CONTENU.
  // Surtout pas en rappelant ztsShowLockedFullscreen : cette fonction emet
  // `locked_view`, et changer de langue compterait une vue de plus. On
  // remplace la boite, on ne rejoue pas l'ouverture.
  document.addEventListener('zts:langchange', function () {
    var el = document.getElementById(OVERLAY_ID);
    if (!el || !el.__ztsOpts) return;
    var vieille = el.querySelector('.zts-lf-box');
    if (vieille) el.replaceChild(build(el.__ztsOpts), vieille);
  });


  /* =====================================================================
     VERROU CLAVIER — le calque arretait la souris, PAS le clavier
     ---------------------------------------------------------------------
     Mesure du 31 aout 2026, navigation anonyme, /apps/grille/ en prod :
     le calque etait bien la (position:fixed, inset:0, z-index 99998,
     body en overflow:hidden), et pourtant VINGT-NEUF elements focalisables
     restaient hors de lui. Un Tab menait au bouton « Reglages » de l'app,
     Entree l'activait, et la modale de configuration s'ouvrait — verrou
     toujours affiche. Le mur tenait la porte et laissait la fenetre ouverte.

     Trois verrous, parce qu'aucun ne suffit seul :

     1. `inert` sur tout ce qui n'est pas le calque. C'est la bonne reponse :
        l'element sort du parcours de tabulation ET cesse de recevoir les
        evenements. Disponible dans tous les navigateurs courants depuis
        2023 ; la ou il manque, les deux suivants prennent le relais.

     2. Un observateur : l'app CONTINUE DE VIVRE derriere le calque et
        ajoute ses propres modales au <body>. Sans ca, chaque nouvelle
        arrivante serait focalisable.

     3. Un rattrapage sur `focusin`, en capture : si un focus atterrit
        malgre tout hors du calque, on le ramene dedans. C'est le filet des
        navigateurs sans `inert`.

     Le tout est annule proprement a la fermeture : un verrou « closable »
     doit rendre la page au visiteur, pas la laisser inerte.
     ===================================================================== */
  var __ztsVerrou = null;

  function ztsPoserVerrouClavier(calque) {
    ztsLeverVerrouClavier();
    var etat = { calque: calque, inertes: [], obs: null, surFocus: null };

    function inerter(el) {
      if (!el || el === calque || el.nodeType !== 1) return;
      if (el.hasAttribute('inert')) return;      // deja inerte pour une autre raison
      try { el.inert = true; } catch (e) { return; }
      etat.inertes.push(el);
    }
    for (var i = 0; i < document.body.children.length; i++) inerter(document.body.children[i]);

    if (window.MutationObserver) {
      etat.obs = new MutationObserver(function (muts) {
        for (var m = 0; m < muts.length; m++) {
          var aj = muts[m].addedNodes;
          for (var k = 0; k < aj.length; k++) inerter(aj[k]);
        }
      });
      etat.obs.observe(document.body, { childList: true });
    }

    etat.surFocus = function (e) {
      if (calque.contains(e.target)) return;
      var premier = calque.querySelector('button,a[href],input,select,textarea,[tabindex]');
      if (premier) premier.focus(); else calque.focus();
    };
    document.addEventListener('focusin', etat.surFocus, true);

    if (!calque.hasAttribute('tabindex')) calque.setAttribute('tabindex', '-1');
    try { calque.focus(); } catch (e) {}
    __ztsVerrou = etat;
  }

  function ztsLeverVerrouClavier() {
    if (!__ztsVerrou) return;
    var e = __ztsVerrou;
    for (var i = 0; i < e.inertes.length; i++) { try { e.inertes[i].inert = false; } catch (x) {} }
    if (e.obs) e.obs.disconnect();
    if (e.surFocus) document.removeEventListener('focusin', e.surFocus, true);
    __ztsVerrou = null;
  }

  function close() {
    var el = document.getElementById(OVERLAY_ID);
    if (el) el.remove();
    document.body.style.overflow = '';
    ztsLeverVerrouClavier();
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
    overlay.__ztsOpts = opts;      // pour redessiner au changement de langue
    overlay.appendChild(build(opts));
    document.body.appendChild(overlay);
    // Un verrou NON refermable doit fermer la page pour de bon : la souris
    // par le calque, le clavier par le garde ci-dessus. Un verrou refermable
    // (l'apercu d'un article, par exemple) laisse la page vivre.
    if (!opts.closable) {
      document.body.style.overflow = 'hidden';
      ztsPoserVerrouClavier(overlay);
    }

    overlay.addEventListener('click', function (e) {
      var act = e.target && e.target.getAttribute && e.target.getAttribute('data-action');
      if (act === 'google' || act === 'email') {
        fireSignup(act, opts.targetUrl);
      } else if (act === 'login') {
        fireLogin();
      } else if (act === 'genia') {
        // On ne bloque PAS la navigation : le lien porte son href, le clic
        // le suit. L'evenement part avant, comme les autres du mur.
        if (window.ztsTrackFunnel) {
          window.ztsTrackFunnel('genia_click', { source: 'mur-genia', layer: opts.source || 'inconnu' });
        }
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
