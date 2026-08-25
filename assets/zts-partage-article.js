/**
 * ZTS Partage Article — le bloc de partage d'un article de blogue.
 *
 * A NE PAS CONFONDRE avec shared/zts-partage.js, qui porte un nom voisin et
 * fait autre chose : celui-la est le bloc « Fais connaitre ZoneTotalSport »
 * du pied de page et de /bienvenue.html, et il partage LE SITE. Celui-ci
 * partage L'ARTICLE COURANT, et ne vit que dans /articles/.
 *
 * IL NE DESSINE RIEN DE NEUF. Les 24 articles portaient deja quatre cercles
 * de partage qui marchaient — Facebook, X, LinkedIn, courriel — plus une
 * pilule « Copier le lien ». Les remplacer aurait ete du travail perdu et un
 * risque de regression. Ce script les REPREND en place :
 *
 *   - un bouton navigator.share en PREMIER cercle, sur mobile seulement ;
 *   - WhatsApp, recupere du bloc du bas supprime au meme lot ;
 *   - le titre de l'article passe a X et au courriel (ils partaient nus) ;
 *   - x.com/intent/post au lieu de twitter.com/intent/tweet ;
 *   - « Copier le lien » avec un vrai toast, un repli si le presse-papiers
 *     refuse, et le multilingue preserve.
 *
 * AUCUN SDK, AUCUN SCRIPT TIERS. Que des liens sharer et l'API du navigateur.
 * Charger le SDK Facebook sur un article poserait un mouchard sur une page
 * lue par des enfants.
 *
 * Classes prefixees `ztsp-`, jamais `zts-` : les `.zts-*` sont gelees.
 */
(function () {
  'use strict';

  var STYLE_ID = 'ztsp-partage-css';
  var MARQUE = 'data-ztsp-monte';

  // ── La langue : le meme calcul que partout ailleurs dans le tunnel ──
  // Copie deliberee de zts-lock-page.js. Ce module peut s'executer avant
  // shared/zts.js selon l'ordre des balises : on appelle ZTS.langue() quand
  // elle est la, sinon on refait exactement le meme calcul. Repondre « fr »
  // par defaut serait plus court et FAUX — c'est ce qui faisait voir a un
  // anglophone le cadenas dans une langue et le mur dans l'autre.
  function langue() {
    try { if (window.ZTS && ZTS.langue) return ZTS.langue(); } catch (e) {}
    try {
      var q = new URLSearchParams(location.search).get('lang');
      if (q === 'en' || q === 'fr') return q;
    } catch (e) {}
    try {
      var memo = localStorage.getItem('zts_lang');
      if (memo === 'en' || memo === 'fr') return memo;
    } catch (e) {}
    return (navigator.language || 'fr').toLowerCase().indexOf('en') === 0 ? 'en' : 'fr';
  }

  var TEXTES = {
    fr: {
      partager: 'Partager', whatsapp: 'WhatsApp', courriel: 'Envoyer par courriel',
      copier: 'Copier le lien', copie: 'Lien copié !',
      echec: 'Copie impossible — sélectionne le lien à la main.',
      sujet: 'À lire : ', corps: 'Je te partage cet article : '
    },
    en: {
      partager: 'Share', whatsapp: 'WhatsApp', courriel: 'Send by email',
      copier: 'Copy link', copie: 'Link copied!',
      echec: 'Copy failed — select the link by hand.',
      sujet: 'Worth reading: ', corps: 'Sharing this article with you: '
    }
  };
  function t() { return TEXTES[langue()] || TEXTES.fr; }

  // ── Ce qu'on partage ──

  function lien() {
    var c = document.querySelector('link[rel="canonical"]');
    if (c && c.href) return c.href;
    var o = document.querySelector('meta[property="og:url"]');
    if (o && o.content) return o.content;
    return location.href;
  }

  /**
   * Le titre dans la langue affichee.
   *
   * og:title est toujours en francais — les articles n'ont pas de version
   * anglaise en fichier separe, le multilingue se fait par <span lang> dans
   * la meme page. On lit donc d'abord le <span lang> du titre du heros, et
   * on ne retombe sur og:title que s'il n'y en a pas.
   */
  function titre() {
    var h = document.querySelector('.hero-gradient h1, .hero-gradient h2');
    if (h) {
      var sp = h.querySelector('span[lang="' + langue() + '"]');
      var txt = (sp || h).textContent.trim();
      if (txt) return txt;
    }
    var o = document.querySelector('meta[property="og:title"]');
    if (o && o.content) return o.content.replace(/\s*\|\s*ZTS\s*$/, '').trim();
    return document.title.split('|')[0].trim();
  }

  function css() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    // Les cercles reprennent la mesure de ceux qui existaient — 40 px, rond,
    // fond cyan pale — pour que l'ajout ne se voie pas comme une piece
    // rapportee. Polices : les tokens du shell, avec repli explicite ; aucune
    // police n'est chargee ici (voir project_polices_zts : zero Google Fonts).
    s.textContent =
      '.ztsp-btn{width:40px;height:40px;border-radius:9999px;display:inline-flex;' +
      'align-items:center;justify-content:center;background:#ecfeff;color:#00C4FF;' +
      'border:none;cursor:pointer;transition:all .25s;box-shadow:0 1px 2px rgba(0,0,0,.05);' +
      'flex-shrink:0;padding:0;}' +
      '.ztsp-btn:hover{background:#00C4FF;color:#fff;transform:translateY(-2px);}' +
      '.ztsp-btn svg{width:20px;height:20px;display:block;}' +
      '.ztsp-btn--wa:hover{background:#25D366;}' +
      '.ztsp-btn--natif{background:#FFF000;color:#0F0F2E;}' +
      '.ztsp-btn--natif:hover{background:#0F0F2E;color:#FFF000;}' +
      // Le toast : au-dessus du mur d'inscription (z-index 99999), sinon il
      // serait invisible sur les 21 articles en demi-apercu.
      '.ztsp-toast{position:fixed;left:50%;bottom:28px;transform:translate(-50%,14px);' +
      'z-index:100000;background:#0F0F2E;color:#fff;padding:13px 24px;border-radius:9999px;' +
      'border:3px solid #FFF000;box-shadow:0 6px 24px rgba(0,0,0,.3);opacity:0;' +
      'pointer-events:none;transition:opacity .22s,transform .22s;max-width:88vw;' +
      'text-align:center;font-size:1rem;line-height:1.3;' +
      'font-family:var(--ztsh-f-corps,"Quicksand","Helvetica Neue",sans-serif);font-weight:700;}' +
      '.ztsp-toast--on{opacity:1;transform:translate(-50%,0);}' +
      '@media (prefers-reduced-motion:reduce){.ztsp-btn,.ztsp-toast{transition:none;}}';
    document.head.appendChild(s);
  }

  // ── LOGOS DE MARQUE, EN SVG INLINE ──
  // Les trois premiers cercles — Facebook, X, LinkedIn — sont poses par les
  // articles avec une icone lucide (`<i data-lucide="facebook">`). LUCIDE NE
  // LES SERT PLUS : les icones de marque sont sorties du paquet en 2024, elles
  // vivent depuis dans un paquet separe. `lucide.createIcons()` ne trouve donc
  // rien a poser et laisse les <i> VIDES — trois cercles cyan pales sans
  // dessin sur chaque article. Constate au navigateur le 24 aout 2026 :
  // unpkg lucide@latest expose 2031 icones, et aucune des quatre marques
  // (facebook, twitter, linkedin, instagram). `mail` et `link`, generiques,
  // sont toujours la — d'ou le courriel et « Copier le lien » qui, eux,
  // s'affichaient. Le defaut n'a rien a voir avec le decor du 24 aout : il
  // date du jour ou lucide@latest a bascule.
  //
  // On ne va PAS chercher le paquet de marque : une dependance CDN de plus
  // pour trois dessins, sur une page lue par des enfants, alors que le reste
  // du bloc est deja en SVG inline sans aucun tiers.
  //
  // Traces repris de Simple Icons (CC0, domaine public). `fill:currentColor`
  // pour que le survol du cercle les recolore comme les autres.
  var MARQUES = {
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    twitter:  '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932L18.901 1.153zm-1.291 19.49h2.039L6.486 3.24H4.298L17.61 20.643z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 1 1 0-4.125 2.062 2.062 0 0 1 0 4.125zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.454C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z"/></svg>'
  };
  // `x` est le nom que lucide donnerait a la croix : les articles ecrivent
  // `twitter`. On accepte les deux graphies pour le meme dessin.
  MARQUES['x'] = MARQUES.twitter;

  /**
   * Pose le logo dans les trois cercles de marque.
   *
   * ON RECONNAIT LE LIEN PAR SON href, PAS PAR SON CONTENU. Les articles
   * portent deux habillages qui ne se ressemblent pas : 25 posent une icone
   * lucide (`<i data-lucide="facebook">`), et grands-jeux-exterieurs, seul de
   * son gabarit, pose une INITIALE typographique (`<span>f</span>`,
   * « 𝕏 », « in ») dans des pastilles `.share-ic`. Chercher les <i> n'aurait
   * repare que le premier groupe. L'URL sharer, elle, est commune aux deux —
   * c'est deja l'ancre que `monte()` utilise pour se reperer.
   *
   * Le courriel et « Copier le lien » ne sont PAS touches : le premier groupe
   * les rend par lucide (icones generiques, toujours servies) et le second par
   * un emoji. Les deux s'affichent.
   *
   * Les dimensions sont posees en attributs autant qu'en classes : un <svg>
   * sans dimension prend 300x150 par defaut et ferait exploser le cercle sur
   * le gabarit qui n'a pas Tailwind.
   */
  var SHARERS = [
    [/facebook\.com\/sharer/i,               'facebook'],
    [/(twitter\.com|x\.com)\/intent/i,       'twitter'],
    [/linkedin\.com\/shar/i,                  'linkedin']
  ];

  function poseLogos(racine) {
    var liens = racine.querySelectorAll('a[href]');
    for (var i = 0; i < liens.length; i++) {
      var a = liens[i];
      var href = a.getAttribute('href') || '';
      var nom = null;
      for (var j = 0; j < SHARERS.length; j++) {
        if (SHARERS[j][0].test(href)) { nom = SHARERS[j][1]; break; }
      }
      if (!nom) continue;
      if (a.querySelector('svg')) continue;    // deja dessine : on ne repasse pas
      var ancienne = a.querySelector('i[data-lucide]');
      var classe = ancienne ? ancienne.className : '';
      a.innerHTML = MARQUES[nom];
      var svg = a.querySelector('svg');
      if (!svg) continue;
      if (classe) svg.setAttribute('class', classe);
      svg.setAttribute('width', '20');
      svg.setAttribute('height', '20');
    }
  }

  var SVG = {
    partager: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 016.988 2.896 9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.359.101 11.945c0 2.096.549 4.142 1.593 5.945L0 24l6.335-1.652a11.93 11.93 0 005.71 1.454h.005c6.581 0 11.94-5.358 11.943-11.945A11.86 11.86 0 0020.52 3.45"/></svg>'
  };

  /** Un toast, un seul, reutilise. */
  var _toast, _minuteur;
  function toast(message) {
    if (!_toast) {
      _toast = document.createElement('div');
      _toast.className = 'ztsp-toast';
      _toast.setAttribute('role', 'status');
      _toast.setAttribute('aria-live', 'polite');
      document.body.appendChild(_toast);
    }
    _toast.textContent = message;
    // Deux images successives : sans le reflow force, un second clic pendant
    // que le toast est encore la ne rejoue pas la transition.
    _toast.classList.remove('ztsp-toast--on');
    void _toast.offsetWidth;
    _toast.classList.add('ztsp-toast--on');
    clearTimeout(_minuteur);
    _minuteur = setTimeout(function () { _toast.classList.remove('ztsp-toast--on'); }, 2400);
  }

  /**
   * Copie, avec repli.
   *
   * navigator.clipboard n'existe pas hors contexte securise et peut etre
   * refuse par permission. L'ancien bouton enchainait un .then() sans .catch :
   * la promesse partait au neant et RIEN ne se passait a l'ecran. On garde
   * donc execCommand('copy') — deprecie, mais c'est le seul repli qui marche
   * la ou l'API moderne est absente.
   */
  function copier(texte) {
    var d = t();
    function replis() {
      var z = document.createElement('textarea');
      z.value = texte;
      z.setAttribute('readonly', '');
      z.style.cssText = 'position:fixed;top:-9999px;opacity:0';
      document.body.appendChild(z);
      z.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(z);
      toast(ok ? d.copie : d.echec);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(texte).then(function () { toast(d.copie); }, replis);
    } else {
      replis();
    }
  }

  function bouton(classe, etiquette, svg) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ztsp-btn ' + classe;
    b.setAttribute('aria-label', etiquette);
    b.title = etiquette;
    b.innerHTML = svg;
    return b;
  }

  function monte() {
    // On ancre sur le lien Facebook plutot que sur une classe : les articles
    // portent trois habillages differents (cercles Tailwind, pilules
    // .share-btn, initiales .share-ic) et le lien sharer est le seul point
    // commun aux trois.
    var ancre = document.querySelector('a[href*="facebook.com/sharer"]');
    if (!ancre) return;
    var rangee = ancre.parentNode;
    if (!rangee || rangee.getAttribute(MARQUE) === '1') return;
    rangee.setAttribute(MARQUE, '1');

    css();
    var d = t(), url = lien(), ttl = titre();
    var urlEnc = encodeURIComponent(url), ttlEnc = encodeURIComponent(ttl);

    // Facebook ne lit que og:*, il n'accepte aucun titre en parametre :
    // son lien reste tel quel. On le realigne seulement sur le canonical,
    // au cas ou le HTML porterait une vieille URL.
    ancre.href = 'https://www.facebook.com/sharer/sharer.php?u=' + urlEnc;

    // X : le lien partait nu — l'URL sans le titre. Et twitter.com/intent/tweet
    // redirige encore, mais l'adresse a jour est x.com/intent/post.
    var x = rangee.querySelector('a[href*="twitter.com/intent"], a[href*="x.com/intent"]');
    if (x) x.href = 'https://x.com/intent/post?url=' + urlEnc + '&text=' + ttlEnc;

    // Courriel : le sujet etait « Article Zone Total Sport » sur les 24
    // articles — le meme pour tous, donc sans valeur dans une boite de
    // reception. Il porte maintenant le titre.
    var mail = rangee.querySelector('a[href^="mailto:"]');
    if (mail) {
      mail.href = 'mailto:?subject=' + encodeURIComponent(d.sujet + ttl) +
                  '&body=' + encodeURIComponent(d.corps + url);
      mail.setAttribute('aria-label', d.courriel);
    }

    // WhatsApp : il n'existait que dans le bloc du bas, supprime au meme lot.
    // Sans cette ligne, le nettoyage du doublon aurait retire un canal reel
    // entre profs au lieu de le deplacer.
    if (!rangee.querySelector('a[href*="wa.me"]')) {
      var wa = document.createElement('a');
      wa.href = 'https://wa.me/?text=' + encodeURIComponent(ttl + ' ' + url);
      wa.target = '_blank';
      wa.rel = 'noopener';
      wa.className = 'ztsp-btn ztsp-btn--wa';
      wa.setAttribute('aria-label', d.whatsapp);
      wa.title = d.whatsapp;
      wa.innerHTML = SVG.whatsapp;
      var pilule = rangee.querySelector('button');
      rangee.insertBefore(wa, pilule || null);
    }

    // Le partage natif, en PREMIER cercle. navigator.share n'existe sur
    // presque aucun navigateur de bureau : ce bouton n'est donc pas un repli
    // d'erreur, c'est un canal en plus la ou il existe. Les autres restent
    // affiches dans tous les cas.
    // Le garde compte : au changement de langue on repasse dans monte(),
    // et sans lui un second bouton natif s'ajouterait a chaque bascule.
    if (navigator.share && !rangee.querySelector('.ztsp-btn--natif')) {
      var n = bouton('ztsp-btn--natif', d.partager, SVG.partager);
      n.addEventListener('click', function () {
        navigator.share({ title: ttl, text: ttl, url: url })
          .catch(function () { /* l'utilisateur a ferme la feuille : rien a dire */ });
      });
      rangee.insertBefore(n, ancre);
    }

    // La pilule « Copier le lien ». L'ancien onclick ecrasait le
    // textContent du <span>, donc les quatre <span lang> qu'il contenait :
    // apres un clic, un lecteur anglophone se retrouvait avec un bouton en
    // francais jusqu'au rechargement. Le libelle n'est plus touche du tout —
    // c'est le toast qui confirme.
    var pil = rangee.querySelector('button:not(.ztsp-btn)');
    if (pil) {
      pil.removeAttribute('onclick');
      var neuf = pil.cloneNode(true);          // clone : coupe tout ecouteur restant
      pil.parentNode.replaceChild(neuf, pil);
      neuf.type = 'button';
      neuf.addEventListener('click', function () { copier(url); });
    }

    // Les trois logos de marque, que lucide ne sert plus (voir MARQUES).
    // AVANT createIcons : une fois le <i> remplace par son <svg>, lucide n'a
    // plus rien a y faire, dans un sens comme dans l'autre.
    poseLogos(rangee);

    // Les cercles d'origine portent des icones lucide. Celles qu'on vient
    // d'inserer sont en SVG inline et n'en ont pas besoin, mais un article
    // qui a deja rendu ses icones doit repasser sur le lien WhatsApp s'il
    // en avait un en attente.
    try { if (window.lucide && lucide.createIcons) lucide.createIcons(); } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', monte);
  } else {
    monte();
  }

  // Le selecteur FR/EN redessine le chrome sans recharger la page. Les
  // libelles et le sujet du courriel doivent suivre — le demi-mur avait
  // exactement ce defaut avant la vague B : bilingue au CHARGEMENT seulement.
  document.addEventListener('zts:langchange', function () {
    var rangee = document.querySelector('[' + MARQUE + '="1"]');
    if (rangee) rangee.removeAttribute(MARQUE);
    monte();
  });
})();
