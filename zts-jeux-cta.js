/**
 * ZTS Jeux CTA — bandeau « Créer un compte » PERMANENT en bas des fiches de jeux.
 *
 * Charge uniquement sur /jeux/* (injecté par shared/zts.js). Complémentaire du
 * pop-up courriel (zts-newsletter.js) : ici le CTA COMPTE est toujours visible,
 * non fermable, non plafonné — il comble le fait que les fiches (surface SEO
 * dominante, 1400+ pages) n'avaient aucune invitation permanente à s'inscrire.
 *
 * - Anonyme  → bandeau affiché + événement funnel `locked_view` (source 'jeu').
 * - Clic     → `locked_click_signup` (source 'jeu') puis window.ztsShowSignup().
 * - Connecté → bandeau retiré (ztsOnAuth).
 *
 * Dépend (optionnellement) de firebase-auth.js (ztsOnAuth / ztsShowSignup) et de
 * zts-funnel.js (ztsTrackFunnel), tous deux chargés par les fiches. Aucune
 * dépendance dure : dégrade proprement si absents.
 */
(function () {
  'use strict';

  if (!/\/jeux\//.test(location.pathname)) return;

  function slug() {
    var m = location.pathname.match(/\/jeux\/([^\/]+?)(?:\.html)?$/);
    return m ? m[1] : 'jeu';
  }

  function lang() {
    try { if (window.ZTS && ZTS.getLang) return ZTS.getLang() === 'en' ? 'en' : 'fr'; } catch (e) {}
    try { if (localStorage.getItem('zts_lang') === 'en') return 'en'; } catch (e) {}
    return (navigator.language || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr';
  }

  var T = {
    fr: {
      title: 'Tu aimes ce jeu? Il y en a 1&nbsp;400+ autres.',
      sub: 'Crée ton compte gratuit et débloque tous les jeux, SAÉ et outils du gymnase. 100&nbsp;% gratuit, pour toujours. Aucune carte de crédit.',
      btn: '🔓 Créer mon compte gratuit',
      proof: '🏆 328 profs sont déjà dans la Zone'
    },
    en: {
      title: 'Like this game? There are 1,400+ more.',
      sub: 'Create your free account and unlock every game, lesson plan and gym tool. 100% free, forever. No credit card.',
      btn: '🔓 Create my free account',
      proof: '🏆 328 teachers are already in the Zone'
    }
  };
  function t() { return T[lang()]; }

  function injectCss() {
    if (document.getElementById('zts-jcta-css')) return;
    var s = document.createElement('style');
    s.id = 'zts-jcta-css';
    s.textContent = [
      '@import url("https://fonts.googleapis.com/css2?family=Luckiest+Guy&family=Nunito:wght@600;800&display=swap");',
      '.zts-jcta{max-width:640px;margin:36px auto 30px;padding:28px 22px;box-sizing:border-box;text-align:center;',
      'font-family:"Nunito",system-ui,sans-serif;background:linear-gradient(165deg,#E0F7FF,#CFF3FF);',
      'border:3px solid #0F0F2E;border-radius:24px;box-shadow:7px 7px 0 #0F0F2E;}',
      '.zts-jcta h2{font-family:"Luckiest Guy",cursive;font-size:clamp(21px,4.5vw,28px);color:#0F0F2E;margin:0 0 8px;line-height:1.08;}',
      '.zts-jcta p{font-size:1rem;color:#1a2540;opacity:.85;margin:0 auto 16px;max-width:48ch;line-height:1.4;}',
      '.zts-jcta button{cursor:pointer;font-family:"Luckiest Guy",cursive;font-size:1.15rem;letter-spacing:.5px;',
      'padding:15px 28px;border:3px solid #0F0F2E;border-radius:14px;background:#FFD700;color:#0F0F2E;box-shadow:4px 4px 0 #0F0F2E;}',
      '.zts-jcta button:active{transform:translate(2px,2px);box-shadow:2px 2px 0 #0F0F2E;}',
      '.zts-jcta .zts-jcta-proof{margin:14px 0 0;font-family:"Luckiest Guy",cursive;color:#0F0F2E;font-size:.9rem;letter-spacing:.5px;}',
      '@media(max-width:480px){.zts-jcta{margin:26px 12px;padding:24px 16px;box-shadow:5px 5px 0 #0F0F2E;}}'
    ].join('');
    document.head.appendChild(s);
  }

  var viewed = false;

  function render() {
    if (document.getElementById('zts-jcta')) return;
    injectCss();
    var tr = t();
    var box = document.createElement('section');
    box.className = 'zts-jcta';
    box.id = 'zts-jcta';
    box.setAttribute('aria-label', 'Créer un compte gratuit Zone Total Sport');
    box.innerHTML =
      '<h2>' + tr.title + '</h2>' +
      '<p>' + tr.sub + '</p>' +
      '<button type="button">' + tr.btn + '</button>' +
      '<div class="zts-jcta-proof">' + tr.proof + '</div>';
    document.body.appendChild(box);

    box.querySelector('button').addEventListener('click', function () {
      try { sessionStorage.setItem('zts_signup_source', 'jeu_cta'); } catch (e) {}
      if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_click_signup', { source: 'jeu', slug: slug() });
      if (window.ztsShowSignup) window.ztsShowSignup();
    });

    if (!viewed && window.ztsTrackFunnel) {
      viewed = true;
      window.ztsTrackFunnel('locked_view', { source: 'jeu', slug: slug() });
    }
  }

  function remove() {
    var b = document.getElementById('zts-jcta');
    if (b) b.remove();
  }

  var decided = false;
  function apply(user) { decided = true; if (user) remove(); else render(); }

  function attach() {
    window.ztsOnAuth(function (user) { apply(user); });
    // Filet : si firebase tarde ou échoue (SDK bloqué/lent), on affiche quand
    // même le CTA en anonyme au bout de 2,5 s — jamais priver un visiteur.
    setTimeout(function () { if (!decided) render(); }, 2500);
  }

  function boot() {
    if (window.ztsOnAuth) { attach(); return; }
    // firebase-auth.js pas encore prêt : on retente ~3 s, puis on affiche.
    var tries = 0;
    (function tick() {
      if (window.ztsOnAuth) { attach(); return; }
      if (++tries > 15) { render(); return; }
      setTimeout(tick, 200);
    })();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
