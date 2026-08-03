/* ==========================================================================
   ZTS — PATRON DE PAGE  ·  shared/zts-modele.js
   --------------------------------------------------------------------------
   Compagnon de shared/zts-modele.css. Deux mécanismes, tous deux facultatifs :
   une page qui n'a ni sélecteur de métier ni compteur peut charger ce fichier
   sans effet.

     1. Sélecteur de métier — pose body[data-metier] et refait le hero.
     2. Compteurs — anime les éléments portant data-cible quand ils entrent
        dans la vue.

   RIEN N'EST IMPOSÉ. Le script ne s'active que si le balisage est présent, et
   il respecte `prefers-reduced-motion` dans les deux cas.

   Extrait de la maquette retenue le 2 août 2026, version de 9:12.
   ========================================================================== */
(function () {
  'use strict';

  var reduit = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------ MÉTIER
     Les trois métiers du site. Les chemins d'images sont relatifs à la racine :
     la maquette de 9:12 les avait déjà ainsi, c'est ce qui la rendait prête
     pour le dépôt. Ne pas les remettre en absolu vers le domaine. */
  var METIERS = {
    ep:  { img: '/perso-ep.png',   alt: "Mr. Root, prof d'éducation physique",
           cri: 'ON Y VA!',
           sub: "Tu es en mode <b>Éducation physique</b>. Tout ce qui suit est filtré pour le gymnase — change de métier en haut et la page se refait." },
    sdg: { img: '/perso-sdg.png',  alt: 'Mr. Root, éducateur en service de garde',
           cri: 'ON EMBARQUE!',
           sub: "Tu es en mode <b>Service de garde</b>. Routines, jeux calmes et plans de pluie — change de métier en haut et la page se refait." },
    cdj: { img: '/perso-camp.png', alt: 'Mr. Root, animateur de camp de jour',
           cri: 'DEHORS!',
           sub: "Tu es en mode <b>Camp de jour</b>. Grands jeux, thèmes et plan B météo — change de métier en haut et la page se refait." }
  };

  function poserMetier(cle) {
    var m = METIERS[cle];
    if (!m) return;

    document.body.setAttribute('data-metier', cle);

    var img = document.getElementById('ztsp-perso-hero');
    if (img) { img.src = m.img; img.alt = m.alt; }

    var cri = document.getElementById('ztsp-cri-hero');
    if (cri) cri.textContent = m.cri;

    var sub = document.getElementById('ztsp-sub-hero');
    if (sub) sub.innerHTML = m.sub;

    var boutons = document.querySelectorAll('[data-ztsp-metier]');
    for (var i = 0; i < boutons.length; i++) {
      boutons[i].setAttribute('aria-pressed', boutons[i].getAttribute('data-ztsp-metier') === cle ? 'true' : 'false');
    }

    // Rejouer l'animation : retirer la classe, forcer un reflow, la remettre.
    // Sans le reflow le navigateur ne voit aucun changement et ne rejoue rien.
    if (!reduit) {
      var vedette = document.querySelector('.ztsp-vedette');
      if (vedette) {
        vedette.classList.remove('ztsp-bascule');
        void vedette.offsetWidth;
        vedette.classList.add('ztsp-bascule');
      }
    }

    try { localStorage.setItem('zts_metier', cle); } catch (e) { /* navigation privée */ }
  }

  function brancherMetiers() {
    var boutons = document.querySelectorAll('[data-ztsp-metier]');
    if (!boutons.length) return;

    for (var i = 0; i < boutons.length; i++) {
      boutons[i].addEventListener('click', function () {
        poserMetier(this.getAttribute('data-ztsp-metier'));
      });
    }

    // Métier de départ : celui déjà posé sur <body>, sinon le dernier choisi,
    // sinon l'éducation physique.
    var depart = document.body.getAttribute('data-metier');
    if (!METIERS[depart]) {
      try { depart = localStorage.getItem('zts_metier'); } catch (e) { depart = null; }
    }
    poserMetier(METIERS[depart] ? depart : 'ep');
  }

  /* ---------------------------------------------------------------- COMPTEURS
     Le HTML doit porter la vraie valeur en texte : si le script ne tourne pas,
     la page reste juste. L'animation ne fait que la remplacer temporairement. */
  function brancherCompteurs() {
    var cibles = document.querySelectorAll('[data-cible]');
    if (!cibles.length) return;

    for (var i = 0; i < cibles.length; i++) {
      (function (el) {
        var fin = parseInt(el.getAttribute('data-cible'), 10);
        if (!isFinite(fin)) return;

        if (reduit || !('IntersectionObserver' in window)) {
          el.textContent = fin.toLocaleString('fr-CA');
          return;
        }

        var io = new IntersectionObserver(function (entrees) {
          for (var j = 0; j < entrees.length; j++) {
            if (!entrees[j].isIntersecting) continue;
            io.disconnect();
            var t0 = performance.now(), duree = 1150;
            var pas = function (t) {
              var p = Math.min((t - t0) / duree, 1);
              var e = 1 - Math.pow(1 - p, 3);
              el.textContent = Math.round(fin * e).toLocaleString('fr-CA');
              if (p < 1) requestAnimationFrame(pas);
            };
            requestAnimationFrame(pas);
          }
        }, { threshold: .4 });
        io.observe(el);
      })(cibles[i]);
    }
  }

  function demarrer() { brancherMetiers(); brancherCompteurs(); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', demarrer);
  else demarrer();
})();
