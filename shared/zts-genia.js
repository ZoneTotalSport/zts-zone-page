/**
 * ZTS GenIA — la carte « essaie l'assistant IA sans compte », au pied de page.
 *
 * POURQUOI ELLE EXISTE. Le générateur est l'outil le plus coûteux du site et
 * le seul qu'on puisse essayer sans compte. En trois mois — du 18 mai au
 * 21 août 2026 — la collection `anonGenCount` est restée à zéro document :
 * pas une panne (vérifié maillon par maillon, §3 de LOT2-PRESCAN.md), un
 * chiffre d'usage. Personne ne trouve l'outil. Il n'était lié que depuis trois
 * pages, et ses essais gratuits n'étaient annoncés nulle part ailleurs.
 *
 * Même mécanique que shared/zts-partage.js : un hôte `data-zts-genia` dans le
 * pied partagé, monté après le chargement du dictionnaire, redessiné au
 * changement de langue.
 *
 * PAS DE BANDEAU PERMANENT sur les 1440 fiches — décision du §D de
 * LOT0-COMPLETE.md, maintenue. Cette carte vit dans le pied, où elle ne
 * s'impose à personne.
 */
(function () {
  'use strict';

  var LIEN = '/apps/generateur/';
  var STYLE_ID = 'zts-genia-css';

  function t(cle, repli) {
    try { if (window.ZTS && ZTS.t) return ZTS.t(cle, repli); } catch (e) {}
    return repli;
  }

  // Le plafond appartient a zts-anon-fingerprint.js, qui l'expose en
  // window.ztsAnonLimit. Ce module n'est PAS charge sur la page du
  // generateur : le repli sert donc presque toujours, et il doit valoir
  // exactement le meme nombre. C'est le seul endroit du fichier ou il est
  // ecrit.
  function plafondAnon() {
    return (typeof window.ztsAnonLimit === 'number' && window.ztsAnonLimit > 0) ? window.ztsAnonLimit : 3;
  }

  function injecteCss() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    // Tokens du shell, aucune police chargee.
    s.textContent =
      '.zts-genia{background:#EEF6FF;border:3px dashed #1e3a8a;border-radius:16px;' +
      'padding:16px 18px;max-width:620px;margin:18px auto 0;text-align:center}' +
      '.zts-genia__titre{font-family:var(--ztsh-f-titre,"Luckiest Guy",system-ui,sans-serif);' +
      'font-size:clamp(17px,3vw,22px);color:#1e3a8a;margin:0 0 6px;line-height:1.15;letter-spacing:.3px}' +
      '.zts-genia__sous{font-family:var(--ztsh-f-corps,"Quicksand",system-ui,sans-serif);' +
      'font-size:.98rem;line-height:1.4;color:#0F0F2E;opacity:.85;margin:0 auto 12px;max-width:44ch}' +
      '.zts-genia__cta{display:inline-block;font-family:var(--ztsh-f-titre,"Luckiest Guy",system-ui,sans-serif);' +
      'font-size:1rem;letter-spacing:.4px;padding:11px 20px;border:3px solid #0F0F2E;border-radius:13px;' +
      'background:#00C4FF;color:#0F0F2E;text-decoration:none;box-shadow:4px 4px 0 #0F0F2E;' +
      'transition:transform .12s,box-shadow .12s}' +
      '.zts-genia__cta:hover{transform:translate(2px,2px);box-shadow:2px 2px 0 #0F0F2E}';
    document.head.appendChild(s);
  }

  function rendre(hote) {
    var n = plafondAnon();
    hote.className = 'zts-genia';
    hote.innerHTML =
      '<h3 class="zts-genia__titre"></h3>' +
      '<p class="zts-genia__sous"></p>' +
      '<a class="zts-genia__cta" href="' + LIEN + '" data-zts-cad="non"></a>';

    // textContent : ces chaines viennent d'un dictionnaire, pas du balisage.
    hote.querySelector('.zts-genia__titre').textContent =
      t('genia.titre', 'Assistant IA — ' + n + ' essais gratuits');
    hote.querySelector('.zts-genia__sous').textContent =
      t('genia.sous', 'Décris ton contexte, il te sort un jeu, une SAÉ ou un éducatif sur mesure. ' + n + ' essais sans créer de compte.');
    hote.querySelector('.zts-genia__cta').textContent = t('genia.cta', 'Essayer maintenant →');

    // Le titre et le sous-titre portent le NOMBRE : les cles du dictionnaire
    // contiennent un {n} qu'on remplace ici. Une chaine i18n ne peut pas
    // calculer, et le nombre n'a qu'un seul proprietaire.
    ['.zts-genia__titre', '.zts-genia__sous'].forEach(function (sel) {
      var el = hote.querySelector(sel);
      el.textContent = el.textContent.split('{n}').join(String(n));
    });

    hote.querySelector('.zts-genia__cta').addEventListener('click', function () {
      // Le lien porte son href : on trace, on ne bloque pas la navigation.
      if (window.ztsTrackFunnel) {
        window.ztsTrackFunnel('genia_click', { source: 'pied-genia', layer: 'footer' });
      }
    });
  }

  function monterTout() {
    var hotes = document.querySelectorAll('[data-zts-genia]');
    if (!hotes.length) return;
    injecteCss();
    Array.prototype.forEach.call(hotes, rendre);
  }

  window.ZTSGenIA = { monter: monterTout };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monterTout);
  } else {
    monterTout();
  }
  document.addEventListener('zts:ready', monterTout);
  document.addEventListener('zts:langchange', monterTout);
})();
