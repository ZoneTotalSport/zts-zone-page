/**
 * ZTS Partage — « Fais connaître ZoneTotalSport »
 *
 * UN SEUL composant, deux emplacements : le pied de page partagé (donc les
 * ~1519 pages qui portent le chrome) et /bienvenue.html, juste après une
 * inscription. Le moment de l'inscription est le meilleur pour demander un
 * partage : quelqu'un vient de décider que le site en valait la peine.
 *
 * Se monte sur tout élément portant `data-zts-partage="<source>"`. La source
 * ('footer' | 'bienvenue') part telle quelle dans l'événement `share_click`,
 * pour qu'on sache lequel des deux travaille.
 *
 * TROIS CHEMINS, dans cet ordre :
 *   1. navigator.share  — la feuille de partage du système (mobile surtout).
 *   2. Copier le lien   — marche partout, y compris sans réseau social.
 *   3. Facebook / X     — liens directs, pour qui préfère viser.
 * Le 1 n'existe pas sur la plupart des navigateurs de bureau : les 2 et 3 ne
 * sont donc PAS un repli d'erreur, ils sont toujours affichés.
 *
 * Les chaînes viennent de shared/i18n/{fr,en}.json via ZTS.t(). Contrairement
 * aux modules du tunnel — qui dessinent sur un clic, parfois avant que le
 * dictionnaire soit chargé — ce composant n'est monté qu'APRÈS l'injection du
 * chrome et le chargement du dictionnaire. Il peut donc s'en servir. Chaque
 * appel garde tout de même un repli français explicite : une clé brute
 * affichée à l'écran serait pire qu'une phrase non traduite.
 */
(function () {
  'use strict';

  var URL_SITE = 'https://zonetotalsport.ca';
  var STYLE_ID = 'zts-partage-css';

  function t(cle, repli) {
    try { if (window.ZTS && ZTS.t) return ZTS.t(cle, repli); } catch (e) {}
    return repli;
  }

  function textes() {
    return {
      titre:      t('partage.titre', 'Fais connaître ZoneTotalSport'),
      sous:       t('partage.sous', '1439 jeux. 1880 SAÉ. Des outils prêts pour le gym, le camp et le service de garde. Fait au Québec par un prof d’ÉPS, 22 ans de gymnase — compte gratuit.'),
      court:      t('partage.court', 'Des jeux, des SAÉ pis des outils prêts à sortir pour le gym, le camp et le SDG. Gratuit. 👉 zonetotalsport.ca'),
      partager:   t('partage.bouton', 'Partager'),
      copier:     t('partage.copier', 'Copier le lien'),
      copie:      t('partage.copie', 'Lien copié !'),
      copieEchec: t('partage.copieEchec', 'Copie impossible — sélectionne le lien à la main.'),
      facebook:   t('partage.facebook', 'Facebook'),
      x:          t('partage.x', 'X')
    };
  }

  function injecteCss() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    // Polices : les tokens du shell, avec repli explicite. Aucune police n'est
    // chargée ici — voir zts-locked-fullscreen.js, qui tirait Fredoka depuis
    // Google Fonts sur toutes les pages murées jusqu'au 21 août 2026.
    s.textContent =
      '.zts-partage{background:#fff;border:3px solid #0F0F2E;border-radius:18px;' +
      'box-shadow:5px 5px 0 #0F0F2E;padding:20px 18px;max-width:620px;margin:28px auto;text-align:center}' +
      '.zts-partage__titre{font-family:var(--ztsh-f-titre,"Luckiest Guy",system-ui,sans-serif);' +
      'font-size:clamp(19px,3.4vw,26px);color:#0F0F2E;margin:0 0 8px;line-height:1.15;letter-spacing:.4px}' +
      '.zts-partage__sous{font-family:var(--ztsh-f-corps,"Quicksand",system-ui,sans-serif);' +
      'font-size:1rem;line-height:1.45;color:#0F0F2E;opacity:.85;margin:0 auto 16px;max-width:46ch}' +
      '.zts-partage__btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}' +
      '.zts-partage__btn{font-family:var(--ztsh-f-titre,"Luckiest Guy",system-ui,sans-serif);' +
      'font-size:1rem;letter-spacing:.4px;padding:12px 18px;border:3px solid #0F0F2E;border-radius:13px;' +
      'cursor:pointer;background:#FFF000;color:#0F0F2E;box-shadow:4px 4px 0 #0F0F2E;' +
      'transition:transform .12s,box-shadow .12s}' +
      '.zts-partage__btn:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 #0F0F2E}' +
      '.zts-partage__btn--2{background:#00C4FF}' +
      '.zts-partage__btn--3{background:#fff}' +
      '.zts-partage__etat{font-family:var(--ztsh-f-corps,"Quicksand",system-ui,sans-serif);' +
      'font-size:.9rem;color:#0F0F2E;opacity:.75;min-height:1.2em;margin:10px 0 0}' +
      '@media(max-width:480px){.zts-partage__btn{flex:1 1 100%}}';
    document.head.appendChild(s);
  }

  function trace(source, moyen) {
    if (window.ztsTrackFunnel) {
      window.ztsTrackFunnel('share_click', { source: source, layer: moyen });
    }
  }

  function copierLien(hote, tx, source) {
    var etat = hote.querySelector('.zts-partage__etat');
    var charge = tx.sous + '\n' + URL_SITE;
    var fini = function (ok) {
      if (etat) etat.textContent = ok ? tx.copie : tx.copieEchec;
    };
    trace(source, 'copie');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(charge).then(function () { fini(true); }, function () { fini(false); });
        return;
      }
    } catch (e) {}
    // Repli pour les navigateurs sans presse-papiers asynchrone (et pour les
    // pages non sécurisées, où l'API n'existe pas).
    try {
      var ta = document.createElement('textarea');
      ta.value = charge;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:absolute;left:-9999px';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      fini(ok);
    } catch (e) { fini(false); }
  }

  function rendre(hote) {
    var source = hote.getAttribute('data-zts-partage') || 'inconnu';
    var tx = textes();

    hote.className = 'zts-partage';
    hote.innerHTML =
      '<h3 class="zts-partage__titre"></h3>' +
      '<p class="zts-partage__sous"></p>' +
      '<div class="zts-partage__btns">' +
        '<button type="button" class="zts-partage__btn" data-moyen="systeme"></button>' +
        '<button type="button" class="zts-partage__btn zts-partage__btn--2" data-moyen="copie"></button>' +
        '<button type="button" class="zts-partage__btn zts-partage__btn--3" data-moyen="facebook"></button>' +
        '<button type="button" class="zts-partage__btn zts-partage__btn--3" data-moyen="x"></button>' +
      '</div>' +
      '<p class="zts-partage__etat" role="status" aria-live="polite"></p>';

    // textContent et non innerHTML : ces chaines viennent d'un dictionnaire,
    // elles n'ont aucune raison de porter du balisage.
    hote.querySelector('.zts-partage__titre').textContent = tx.titre;
    hote.querySelector('.zts-partage__sous').textContent = tx.sous;
    hote.querySelector('[data-moyen="systeme"]').textContent = tx.partager;
    hote.querySelector('[data-moyen="copie"]').textContent = tx.copier;
    hote.querySelector('[data-moyen="facebook"]').textContent = tx.facebook;
    hote.querySelector('[data-moyen="x"]').textContent = tx.x;

    // La feuille de partage du systeme n'existe pas partout : on cache le
    // bouton plutot que d'offrir un clic qui ne fait rien.
    var btnSysteme = hote.querySelector('[data-moyen="systeme"]');
    if (!navigator.share) btnSysteme.style.display = 'none';

    hote.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-moyen]');
      if (!btn) return;
      var moyen = btn.getAttribute('data-moyen');
      var d = textes();

      if (moyen === 'systeme') {
        trace(source, 'systeme');
        try {
          navigator.share({ title: 'Zone Total Sport', text: d.court, url: URL_SITE }).catch(function () {});
        } catch (err) {}
        return;
      }
      if (moyen === 'copie') { copierLien(hote, d, source); return; }
      if (moyen === 'facebook') {
        trace(source, 'facebook');
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(URL_SITE),
                    '_blank', 'noopener,width=620,height=520');
        return;
      }
      if (moyen === 'x') {
        trace(source, 'x');
        // Le pitch court porte deja « zonetotalsport.ca » : on ne passe donc
        // PAS `url=` en plus, sinon l'adresse apparait deux fois.
        window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(d.court),
                    '_blank', 'noopener,width=620,height=520');
      }
    });
  }

  function monterTout() {
    var hotes = document.querySelectorAll('[data-zts-partage]');
    if (!hotes.length) return;
    injecteCss();
    Array.prototype.forEach.call(hotes, rendre);
  }

  window.ZTSPartage = { monter: monterTout };

  // Le dictionnaire est charge avant `zts:ready` : on monte la, et on
  // redessine au changement de langue comme le reste du chrome.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monterTout);
  } else {
    monterTout();
  }
  document.addEventListener('zts:ready', monterTout);
  document.addEventListener('zts:langchange', monterTout);
})();
