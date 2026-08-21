/**
 * ZTS Cadenas — pastilles « compte gratuit requis » dans le chrome partage.
 *
 * LOT 1 vague A, 2026-08-13.
 *
 * POURQUOI CE FICHIER EXISTE
 * L'audit disait « l'accueil distribue 27 liens /apps/ sans cadenas ». Le
 * compte etait exact, l'endroit non : sur les 27, **3 seulement** sont ecrits
 * dans index.html (les portes du planificateur). Les 24 autres viennent du
 * MENU partage (18) et du PIED DE PAGE partage (6) — donc de ~1489 pages, pas
 * d'une. Verrouiller « l'accueil » n'en aurait touche que trois.
 *
 * CE QUE CE MODULE FAIT, ET CE QU'IL NE FAIT PAS
 * Il pose une pastille cadenas sur les liens dont la destination exige un
 * compte. Il ne bloque RIEN : le lien reste cliquable, et le mur de l'app fait
 * son travail a l'arrivee. C'est l'option 1 retenue par Joey le 13 aout —
 * l'option « clic bloquant » a ete ecartee : le contenu se garde deja a la
 * porte, bloquer la barre de navigation sur 1489 pages punirait le visiteur
 * deux fois pour un contenu qui ne fuit pas par la.
 *
 * Le manque comble n'est donc pas une fuite, c'est une conversion : sans
 * cadenas, le visiteur ne sait qu'un compte l'attend qu'APRES avoir clique,
 * et l'intention se perd en route.
 *
 * TUNNEL — un seul emetteur par intention
 * Ce module n'emet AUCUN `locked_click_signup`. C'est deliberé : cet
 * evenement appartient au mur de destination, qui est l'endroit ou
 * l'utilisateur decide vraiment. En emettre un ici gonflerait le numerateur
 * du tunnel sans qu'aucune inscription de plus n'ait ete tentee — le defaut
 * exact releve dans la V2 de firebase-auth.js et dans claude/conversion-cta.
 * Il emet `locked_view {source:'menu'}` UNE FOIS PAR SESSION, pas par page :
 * a 1489 pages, un tir par chargement noierait le denominateur.
 *
 * Depend de : locked-whitelist.json, et optionnellement firebase-auth.js
 * (ztsOnAuth) et zts-funnel.js (ztsTrackFunnel). Degrade proprement sans eux —
 * en l'absence d'auth, on suppose « anonyme », ce qui est le bon defaut : un
 * cadenas de trop se voit et se corrige, un cadenas manquant ne se voit pas.
 */
(function () {
  'use strict';

  var WHITELIST_URL = '/locked-whitelist.json';
  var CACHE_KEY = 'zts_locked_whitelist_v1';   // meme cle que zts-lock.js
  var CACHE_TTL = 60 * 60 * 1000;
  var VU_KEY = 'zts_cadenas_vu';               // sessionStorage : 1 tir/session

  // Ou l'on pose des pastilles. Volontairement limite au chrome partage :
  // le contenu des pages n'est pas touche, il a ses propres verrous.
  // `.zts-header__nav` est la barre du haut (entrees de premier niveau, ex.
  // « Jeux ») ; `.ztsm-panel` ses tiroirs deroulants ; `.ztsm-mob` le tiroir
  // mobile ; `.zts-footer` le pied de page. Verifie en navigateur : un
  // `.zts-nav` avait ete essaye d'abord, il ne correspondait a rien.
  //
  // `#planifPorte` (le bloc « Planificateur » de l'accueil, trois boutons
  // metier) est la seule zone HORS chrome partage. Elle est ici parce que ces
  // trois boutons menent au planificateur, gate depuis le 13 aout : sans
  // pastille, le meme outil aurait ete badge dans le menu et nu sur la page
  // d'entree du site.
  // NE PAS confondre avec `.ztsp-portes`, les trois portes METIER du hero :
  // celles-la n'ont pas de href, elles appellent choisirMetier() — essayees
  // d'abord comme zone, elles ne contiennent aucun lien.
  var ZONES = ['.zts-header__nav', '.ztsm-panel', '.ztsm-mob', '.zts-footer', '#planifPorte'];

  var _wl = null;
  var _authed = false;
  var _pret = false;

  /* ---------- i18n ---------- */
  var T = {
    fr: { titre: 'Compte gratuit requis', court: 'Compte gratuit' },
    en: { titre: 'Free account required', court: 'Free account' }
  };
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
  function t() { return T[lang()]; }

  /* ---------- Styles ---------- */
  function injectCss() {
    if (document.getElementById('zts-cadenas-css')) return;
    var s = document.createElement('style');
    s.id = 'zts-cadenas-css';
    // Pas de police chargee ici : la pastille est un emoji + du texte au
    // gabarit heritee. Charger une police pour deux mots relancerait
    // exactement le defaut retire de zts-newsletter.js le 9 aout.
    s.textContent = [
      '.zts-cad{display:inline-flex;align-items:center;gap:3px;margin-left:6px;',
      '  padding:1px 6px;border-radius:999px;font-size:.68rem;line-height:1.5;',
      '  font-weight:700;white-space:nowrap;vertical-align:middle;',
      '  background:rgba(255,215,0,.92);color:#0F0F2E;border:1.5px solid #0F0F2E;}',
      '.zts-cad__em{font-size:.72rem;line-height:1}',
      '.zts-footer .zts-cad{background:rgba(255,215,0,.85)}',
      '@media(max-width:600px){.zts-cad{font-size:.62rem;padding:1px 5px}',
      '  .zts-cad__txt{display:none}}'   // mobile : le cadenas seul, sans le mot
    ].join('');
    document.head.appendChild(s);
  }

  /* ---------- Liste blanche ---------- */
  function chargerWhitelist() {
    try {
      var brut = localStorage.getItem(CACHE_KEY);
      if (brut) {
        var c = JSON.parse(brut);
        if (c && c.t && (Date.now() - c.t) < CACHE_TTL && c.d) return Promise.resolve(c.d);
      }
    } catch (e) {}
    return fetch(WHITELIST_URL, { cache: 'no-cache' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d) { try { localStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: d })); } catch (e) {} }
        return d || { freeResources: [], freeArticles: [] };
      })
      .catch(function () { return { freeResources: [], freeArticles: [] }; });
  }

  /* ---------- Slug d'une destination ---------- */
  // Gere /apps/sae/?cycle=2 (query ignoree) et sae.zonetotalsport.ca.
  function slugDe(href) {
    if (!href) return null;
    var m = href.match(/\/apps\/([^/?#]+)/);
    if (m) return m[1];
    m = href.match(/\/\/([^.]+)\.zonetotalsport\.ca/);
    if (m && m[1] !== 'www' && m[1] !== 'zonetotalsport') return m[1];
    return null;
  }

  function exigeCompte(href) {
    var slug = slugDe(href);
    if (!slug) return false;                       // pas une app : blog, hubs, forum
    var libres = (_wl && _wl.freeResources) || [];
    return libres.indexOf(slug) === -1;
  }

  /* ---------- Pose / retrait ---------- */
  function poser(a) {
    if (a.querySelector('.zts-cad')) return;
    // Le pied de page annonce deja « 🔒 Administrateur » pour studio-jeu :
    // une seconde pastille ferait doublon sur le meme lien.
    if ((a.textContent || '').indexOf('🔒') !== -1) return;

    var tr = t();
    var pastille = document.createElement('span');
    pastille.className = 'zts-cad';
    pastille.setAttribute('aria-label', tr.titre);
    pastille.title = tr.titre;

    var em = document.createElement('span');
    em.className = 'zts-cad__em';
    em.textContent = '🔒';
    em.setAttribute('aria-hidden', 'true');

    var txt = document.createElement('span');
    txt.className = 'zts-cad__txt';
    txt.textContent = tr.court;

    pastille.appendChild(em);
    pastille.appendChild(txt);

    // Dans une carte de menu, la pastille va sur le nom ; ailleurs, en fin de
    // lien. Sans ca elle atterrit sous la description et casse la carte.
    var cible = a.querySelector('.ztsm-name') || a;
    cible.appendChild(pastille);
  }

  function appliquer() {
    if (!_pret) return;
    var vus = 0;
    ZONES.forEach(function (zone) {
      document.querySelectorAll(zone + ' a[href]').forEach(function (a) {
        var href = a.getAttribute('href') || '';
        if (_authed || !exigeCompte(href)) {
          var p = a.querySelector('.zts-cad');
          if (p) p.remove();
          return;
        }
        poser(a);
        vus++;
      });
    });
    if (vus > 0) tracerUneFois();
  }

  function tracerUneFois() {
    try { if (sessionStorage.getItem(VU_KEY)) return; } catch (e) { return; }
    try { sessionStorage.setItem(VU_KEY, '1'); } catch (e) {}
    if (window.ztsTrackFunnel) window.ztsTrackFunnel('locked_view', { source: 'menu', layer: 'cadenas' });
  }

  /* ---------- Amorce ---------- */
  function boot() {
    injectCss();

    chargerWhitelist().then(function (wl) {
      _wl = wl;
      _pret = true;
      appliquer();

      // Le menu et le pied de page sont injectes en asynchrone par zts.js :
      // le premier passage tombe souvent avant qu'ils existent.
      var minuteur = null;
      new MutationObserver(function () {
        clearTimeout(minuteur);
        minuteur = setTimeout(appliquer, 80);
      }).observe(document.body, { childList: true, subtree: true });

      document.addEventListener('zts:ready', appliquer);
      document.addEventListener('zts:langchange', function () {
        document.querySelectorAll('.zts-cad').forEach(function (p) { p.remove(); });
        appliquer();
      });

      (function attendreAuth() {
        if (window.ztsOnAuth) {
          window.ztsOnAuth(function (user) { _authed = !!user; appliquer(); });
          return;
        }
        setTimeout(attendreAuth, 300);
      })();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.ZTS_CADENAS = { refresh: appliquer };
})();
