/* ============================================================
   ZONE TOTAL SPORT — MENU DE NAVIGATION (zts-menu.js)
   Construit les 6 entrées du header + les 3 menus déroulants
   + le tiroir mobile. Appelé par zts.js après l'injection du header.

   AJOUTER UNE APP = une ligne dans MENU ci-dessous. Rien d'autre.
   ============================================================ */
(function () {
  'use strict';

  /* ==================== CONFIGURATION ====================
     app    : dossier de l'app  ->  /apps/APP/
     url    : URL complète, si l'app vit hors du repo (prioritaire sur `app`)
     query  : paramètres optionnels passés à l'app (ex. 'cycle=1')
     badge  : 'nouveau' | 'bientot'   ('bientot' = non cliquable)
     em     : emoji de repli (utilisé partout : Lucide n'est pas
              chargé sur la majorité des pages)
     ======================================================== */

  /* Pourquoi le chemin canonique plutôt que le sous-domaine :
     - le patron `?open=` n'existe nulle part sur le site (vérifié en prod :
       la page d'accueil ignore le paramètre) ;
     - APP.zonetotalsport.ca répond 301 vers /apps/APP/ MAIS Cloudflare
       jette la query string au passage — `?cycle=2` serait perdu.
     Un seul endroit à changer si le shell voit le jour un jour. */
  var SITE = 'https://zonetotalsport.ca';

  function appUrl(item) {
    var base = item.url || (SITE + '/apps/' + item.app + '/');
    return base + (item.query ? '?' + item.query : '');
  }

  var MENU = [
    { id: 'accueil', label: 'Accueil', i18n: 'nav.home', em: '🏠',
      href: 'https://zonetotalsport.ca/', active: ['/', '/index.html'] },

    { id: 'outils', label: 'Outils pédagogiques', i18n: 'nav.tools', em: '🧰',
      title: 'Outils pédagogiques', items: [
      { name: 'Boîte à outils',      app: 'educatifs',  color: '#00E5FF', em: '🧰', icon: 'wrench',    desc: 'Fiches et générateurs',
        i18n: 'menu.educatifs.nom', i18nDesc: 'menu.educatifs.desc' },
      { name: "Carnet d'évaluation", app: 'evaluation', color: '#8B5CF6', em: '📗', icon: 'book-open', desc: 'Suivi des élèves',
        i18n: 'menu.evaluation.nom', i18nDesc: 'menu.evaluation.desc' },
      { name: 'Musique',             app: 'musique',    color: '#FF2A7A', em: '🎵', icon: 'music',     desc: 'Trames et minuteries',
        i18n: 'menu.musique.nom', i18nDesc: 'menu.musique.desc' },
      // « Code Oreille » est un NOM PROPRE : pas de cle pour le nom, donc pas
      // de traduction — c'est precisement a ca que sert le mecanisme opt-in.
      // Seule la description passe en anglais.
      { name: 'Code Oreille',        app: 'code-oreille', color: '#FFD700', em: '👂', icon: 'ear',    desc: 'Quoi faire quand ça dérape', badge: 'nouveau',
        i18nDesc: 'menu.codeoreille.desc' },
      { name: 'Inventaire du matériel', app: 'inventaire', color: '#FFA200', em: '📦', icon: 'package', desc: 'Photo + IA, QR, liste d\'achats', badge: 'nouveau',
        i18n: 'menu.inventaire.nom', i18nDesc: 'menu.inventaire.desc' }
    ]},

    { id: 'sae', label: 'SAÉ', i18n: 'nav.sae', em: '📋',
      title: 'Situations d’apprentissage', items: [
      { name: 'SAÉ — 1er cycle', app: 'sae', query: 'cycle=1', color: '#00E5FF', em: '📋', icon: 'clipboard-list', desc: '6 à 8 ans' },
      { name: 'SAÉ — 2e cycle',  app: 'sae', query: 'cycle=2', color: '#00E5FF', em: '📋', icon: 'clipboard-list', desc: '8 à 10 ans' },
      { name: 'SAÉ — 3e cycle',  app: 'sae', query: 'cycle=3', color: '#00E5FF', em: '📋', icon: 'clipboard-list', desc: '10 à 12 ans' }
    ]},

    { id: 'plan', label: 'Planifications', i18n: 'nav.planning', em: '📅',
      title: 'Planifier son année', items: [
      { name: 'Zone Total Planner', app: 'planificateur', color: '#FFD700', em: '📅', icon: 'calendar', desc: 'Planification annuelle', badge: 'bientot' }
    ]},

    { id: 'blog', label: 'Blog', i18n: 'nav.blog', em: '✏️',
      href: 'https://zonetotalsport.ca/blog.html',
      active: ['/blog.html'], activePrefix: ['/articles/', '/blog'] },

    { id: 'jeux', label: 'Jeux', i18n: 'nav.games', em: '🎮',
      href: SITE + '/apps/jeux/', activePrefix: ['/apps/jeux'] }
  ];

  /* ======================= Utilitaires ======================= */

  var HAS_LUCIDE = typeof window.lucide !== 'undefined' && typeof window.lucide.createIcons === 'function';

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;      // textContent : jamais d'innerHTML
    return n;
  }

  /* Texte d'une carte, traduisible SI l'entree declare une cle.
     ────────────────────────────────────────────────────────────────────
     OPT-IN VOLONTAIRE. Jusqu'ici les noms et descriptions des cartes
     etaient ecrits en dur : les quatre entrees historiques s'affichent en
     francais y compris quand le site est en anglais. Les traduire d'office
     changerait quatre libelles sans que personne l'ait demande.

     Une entree SANS cle se comporte donc exactement comme avant. Une entree
     AVEC cle est resolue tout de suite par ZTS.t — le menu se construit
     apres applyI18n(document) et ne serait pas repeint autrement — et porte
     `data-i18n`, ce qui la fait suivre les bascules de langue ulterieures.

     Le noeud retourne est un <span> : `applyI18n` ecrit dans textContent, et
     ecrire dans celui de `.ztsm-name` effacerait le badge NOUVEAU qui vit a
     cote. */
  function txt(cle, secours) {
    var valeur = secours;
    if (cle && window.ZTS && typeof ZTS.t === 'function') valeur = ZTS.t(cle, secours);
    if (!cle) return document.createTextNode(secours);
    var n = el('span', null, valeur);
    n.setAttribute('data-i18n', cle);
    return n;
  }

  // Icône : Lucide si disponible, sinon emoji (cas majoritaire sur le site).
  function iconNode(item) {
    if (HAS_LUCIDE && item.icon) {
      var i = document.createElement('i');
      i.setAttribute('data-lucide', item.icon);
      i.setAttribute('aria-hidden', 'true');
      return i;
    }
    return el('span', null, item.em || '•');
  }

  var PATH = window.location.pathname.replace(/\/+$/, '') || '/';
  function isActive(entry) {
    var i;
    if (entry.activePrefix) {
      for (i = 0; i < entry.activePrefix.length; i++)
        if (PATH.indexOf(entry.activePrefix[i]) === 0) return true;
    }
    if (entry.active) {
      for (i = 0; i < entry.active.length; i++) {
        var a = entry.active[i];
        if (a === '/' ? PATH === '/' : PATH === a.replace(/\/+$/, '')) return true;
      }
    }
    return false;
  }

  /* Types de badge. Ajouter une entree ici suffit a en creer un nouveau ;
     une carte le porte en declarant `badge: '<cle>'`.
     `bientot` conserve son nom d'origine — quatre entrees du menu et
     zts-menu.css s'y referent deja par `is-soon`. */
  var BADGES = {
    nouveau: { cls: 'is-new',  i18n: 'menu.badge.nouveau', secours: 'NOUVEAU' },
    bientot: { cls: 'is-soon', i18n: 'menu.badge.bientot', secours: 'BIENTÔT' }
  };

  /* ====================== Carte d'app ====================== */

  function buildCard(item) {
    var soon = item.badge === 'bientot';
    var node = soon ? el('div', 'ztsm-card') : el('a', 'ztsm-card');

    if (soon) node.setAttribute('aria-disabled', 'true');
    else node.href = appUrl(item);
    node.setAttribute('role', 'menuitem');
    node.tabIndex = -1;                          // focus piloté aux flèches

    var pill = el('span', 'ztsm-pill');
    pill.style.background = item.color;
    pill.appendChild(iconNode(item));
    node.appendChild(pill);

    var body = el('span', 'ztsm-body');
    var name = el('span', 'ztsm-name');
    name.appendChild(txt(item.i18n, item.name));
    body.appendChild(name);
    var desc = el('span', 'ztsm-desc');
    desc.appendChild(txt(item.i18nDesc, item.desc));
    body.appendChild(desc);
    node.appendChild(body);

    /* Le badge est un enfant de la CARTE, pas du nom.
       ──────────────────────────────────────────────────────────────────
       Il vivait dans `.ztsm-name`, qui est un flex a retour a la ligne : le
       badge y passait a la ligne des que le nom etait long, et il y cotoyait
       la pastille « compte gratuit » que zts-cadenas.js injecte au meme
       endroit. Deux etiquettes qui se disputent la meme boite.

       En enfant de la carte, il se pose en absolu dans le coin superieur
       droit et ne pousse plus rien : l'alignement des autres cartes ne
       bouge pas, qu'elles aient un badge ou non.

       MECANISME REUTILISABLE, pas du cas particulier : c'est la cle
       `badge` de l'entree qui decide, et le retirer efface le badge. Un
       nouveau type de badge se declare dans BADGES ci-dessous. */
    if (BADGES[item.badge]) {
      var b = BADGES[item.badge];
      var etiq = el('span', 'ztsm-badge ' + b.cls);
      etiq.appendChild(txt(b.i18n, b.secours));
      node.appendChild(etiq);
    }

    return node;
  }

  function buildGrid(entry) {
    var grid = el('div', 'ztsm-grid' + (entry.items.length >= 4 ? ' is-wide' : ''));
    var focusables = [];
    entry.items.forEach(function (it) {
      var c = buildCard(it);
      grid.appendChild(c);
      if (it.badge !== 'bientot') focusables.push(c);   // « bientôt » non focalisable
    });
    return { grid: grid, items: focusables };
  }

  /* ==================== Entrées du header ==================== */

  var groups = [];

  function buildDesktop(nav) {
    // Point d'insertion : avant Connexion / le sélecteur de langue,
    // qui restent tels quels dans header.html (hooks d'auth conservés).
    var anchor = nav.querySelector('.zts-btn--login') || nav.querySelector('.zts-lang') || null;

    MENU.forEach(function (entry) {
      if (!entry.items) {
        var a = el('a', 'zts-btn ztsm-item');
        a.href = entry.href;
        a.appendChild(el('span', 'em', entry.em));
        var lbl = el('span', null, entry.label);
        if (entry.i18n) lbl.setAttribute('data-i18n', entry.i18n);
        a.appendChild(lbl);
        if (isActive(entry)) a.classList.add('is-active');
        nav.insertBefore(a, anchor);
        return;
      }

      var wrap = el('div', 'ztsm-wrap ztsm-item');
      var pid  = 'ztsm-panel-' + entry.id;

      var btn = el('button', 'zts-btn');
      btn.type = 'button';
      btn.setAttribute('aria-haspopup', 'true');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-controls', pid);
      btn.appendChild(el('span', 'em', entry.em));
      var bl = el('span', null, entry.label);
      if (entry.i18n) bl.setAttribute('data-i18n', entry.i18n);
      btn.appendChild(bl);
      var chev = el('span', 'ztsm-chev', HAS_LUCIDE ? null : '▾');
      if (HAS_LUCIDE) { var ci = document.createElement('i'); ci.setAttribute('data-lucide', 'chevron-down'); chev.appendChild(ci); }
      btn.appendChild(chev);
      wrap.appendChild(btn);
      nav.insertBefore(wrap, anchor);

      // Le panneau vit sur <body> : .zts-header a overflow:hidden.
      var panel = el('div', 'ztsm-panel');
      panel.id = pid;
      panel.hidden = true;
      panel.setAttribute('role', 'menu');
      panel.setAttribute('aria-label', entry.title || entry.label);
      panel.appendChild(el('div', 'ztsm-panel-title', entry.title || entry.label));
      var built = buildGrid(entry);
      panel.appendChild(built.grid);
      document.body.appendChild(panel);

      var g = { trigger: btn, panel: panel, items: built.items };
      groups.push(g);

      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var open = panel.hidden;
        toggle(g, open);
        // e.detail === 0 => clic synthétisé par Entrée ou Espace sur le <button>.
        // On entre alors directement dans le menu.
        if (open && e.detail === 0) focusItem(g, 0);
      });
      btn.addEventListener('keydown', function (e) {
        // Entrée et Espace NE SONT PAS gérés ici : le <button> émet déjà un
        // `click` natif. Les intercepter ouvrait le menu, puis le click le
        // refermait aussitôt.
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          toggle(g, true);
          focusItem(g, e.key === 'ArrowUp' ? -1 : 0);
        }
      });
      panel.addEventListener('click', function (e) { e.stopPropagation(); });
      panel.addEventListener('keydown', function (e) {
        var cur = g.items.indexOf(document.activeElement);
        if      (e.key === 'ArrowDown') { e.preventDefault(); focusItem(g, cur + 1); }
        else if (e.key === 'ArrowUp')   { e.preventDefault(); focusItem(g, cur - 1); }
        else if (e.key === 'Home')      { e.preventDefault(); focusItem(g, 0); }
        else if (e.key === 'End')       { e.preventDefault(); focusItem(g, g.items.length - 1); }
        else if (e.key === 'Escape')    { e.preventDefault(); toggle(g, false); btn.focus(); }
        else if (e.key === 'Tab')       { toggle(g, false); }
      });
    });
  }

  function focusItem(g, i) {
    if (!g.items.length) return;
    var n = g.items.length;
    g.items[((i % n) + n) % n].focus();
  }

  function closeAll(except) {
    groups.forEach(function (g) {
      if (g === except) return;
      g.panel.hidden = true;
      g.trigger.setAttribute('aria-expanded', 'false');
    });
  }

  function toggle(g, open) {
    closeAll(g);
    g.panel.hidden = !open;
    g.trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) place(g);
  }

  // Positionne le panneau fixe sous son déclencheur, sans déborder du viewport.
  function place(g) {
    var r  = g.trigger.getBoundingClientRect();
    var p  = g.panel;
    p.style.top = Math.round(r.bottom + 12) + 'px';
    p.style.left = '0px';
    var pw  = p.offsetWidth;
    var pad = 12;
    var left = r.left + r.width / 2 - pw / 2;
    left = Math.max(pad, Math.min(left, window.innerWidth - pw - pad));
    p.style.left = Math.round(left) + 'px';
    p.style.setProperty('--ztsm-arrow', Math.round(r.left + r.width / 2 - left) + 'px');
  }

  /* ====================== Tiroir mobile ====================== */

  var mob, mobList, burger, lastFocus = null, accs = [];

  function buildMobile(nav) {
    burger = el('button', 'zts-btn ztsm-burger');
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-controls', 'ztsm-mob');
    burger.appendChild(el('span', 'em', '☰'));
    var anchor = nav.querySelector('.zts-btn--login') || nav.querySelector('.zts-lang') || null;
    nav.insertBefore(burger, anchor);

    mob = el('div', 'ztsm-mob');
    mob.id = 'ztsm-mob';
    mob.hidden = true;
    var head = el('div', 'ztsm-mob-head');
    head.appendChild(el('span', 'ztsm-mob-brand', 'ZONE TOTAL SPORT'));
    var close = el('button', 'ztsm-mob-close', '✕');
    close.type = 'button';
    close.setAttribute('aria-label', 'Fermer le menu');
    head.appendChild(close);
    mob.appendChild(head);

    mobList = el('div', 'ztsm-mob-list');
    mob.appendChild(mobList);
    document.body.appendChild(mob);

    MENU.forEach(function (entry) {
      var row = el('div', 'ztsm-mob-row');

      if (!entry.items) {
        var a = el('a', 'ztsm-mob-link');
        a.href = entry.href;
        var l = el('span', 'ztsm-mob-label', entry.label);
        if (entry.i18n) l.setAttribute('data-i18n', entry.i18n);
        a.appendChild(l);
        if (isActive(entry)) row.classList.add('is-active');
        row.appendChild(a);
        mobList.appendChild(row);
        return;
      }

      var sid = 'ztsm-mob-sub-' + entry.id;
      var b = el('button', 'ztsm-mob-acc');
      b.type = 'button';
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-controls', sid);
      var bl = el('span', 'ztsm-mob-label', entry.label);
      if (entry.i18n) bl.setAttribute('data-i18n', entry.i18n);
      b.appendChild(bl);
      b.appendChild(el('span', 'ztsm-chev', '▾'));

      var sub = el('div', 'ztsm-mob-sub');
      sub.id = sid;
      sub.hidden = true;
      sub.setAttribute('role', 'menu');
      entry.items.forEach(function (it) {
        var c = buildCard(it);
        if (it.badge !== 'bientot') c.tabIndex = 0;    // clavier natif dans le tiroir
        sub.appendChild(c);
      });

      row.appendChild(b);
      row.appendChild(sub);
      mobList.appendChild(row);
      accs.push({ btn: b, sub: sub });

      b.addEventListener('click', function () {
        var open = sub.hidden;
        accs.forEach(function (a2) {                   // un seul accordéon ouvert
          a2.sub.hidden = true;
          a2.btn.setAttribute('aria-expanded', 'false');
        });
        sub.hidden = !open;
        b.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });

    burger.addEventListener('click', openMob);
    close.addEventListener('click', closeMob);
  }

  function openMob() {
    lastFocus = document.activeElement;
    mob.hidden = false;
    void mob.offsetWidth;                              // force le reflow avant la transition
    mob.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    mob.querySelector('.ztsm-mob-close').focus();
    document.addEventListener('keydown', trap, true);
  }

  function closeMob() {
    mob.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', trap, true);
    window.setTimeout(function () { mob.hidden = true; }, 280);
    if (lastFocus) lastFocus.focus();
  }

  // Piège le focus clavier dans le tiroir tant qu'il est ouvert.
  function trap(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeMob(); return; }
    if (e.key !== 'Tab') return;
    var f = mob.querySelectorAll('a[href],button:not([disabled]),[tabindex="0"]');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ==================== Hauteur de la bande ====================
     Publie la hauteur réelle de .zts-topbar dans --zts-topbar-h : le bandeau
     bleu se cale dessus (zts-menu.css). La nav peut passer sur deux lignes
     quand la fenêtre rétrécit, d'où la mesure dynamique.
     Le `resize` synthétique fait recalculer à zts.js le padding du body ;
     il n'est émis que si la hauteur a vraiment changé, sinon boucle infinie
     avec notre propre écouteur de resize. */
  var lastBarH = -1;

  function syncTopbar() {
    var bar = document.querySelector('.zts-topbar');
    if (!bar) return;
    var h = Math.round(bar.getBoundingClientRect().height);
    if (h === lastBarH || !h) return;
    lastBarH = h;
    document.documentElement.style.setProperty('--zts-topbar-h', h + 'px');
    window.dispatchEvent(new Event('resize'));
  }

  /* ========================== Init ========================== */

  function init() {
    var nav = document.querySelector('.zts-header__nav');
    if (!nav || nav.querySelector('.ztsm-item')) return;   // absent ou déjà construit

    buildDesktop(nav);
    buildMobile(nav);

    document.addEventListener('click', function () { closeAll(null); });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      groups.forEach(function (g) {
        if (!g.panel.hidden) { toggle(g, false); g.trigger.focus(); }
      });
    });
    // Le header se replie au défilement : on ferme pour éviter un panneau orphelin.
    addEventListener('scroll', function () { closeAll(null); }, { passive: true });
    addEventListener('resize', function () {
      closeAll(null);
      syncTopbar();
      if (innerWidth >= 768 && mob && mob.classList.contains('is-open')) closeMob();
    }, { passive: true });

    syncTopbar();
    if (window.ResizeObserver) {
      var bar = document.querySelector('.zts-topbar');
      if (bar) new ResizeObserver(syncTopbar).observe(bar);
    }
    setTimeout(syncTopbar, 350);   // après le chargement des polices

    if (HAS_LUCIDE) { try { window.lucide.createIcons(); } catch (err) {} }
  }

  window.ZTSMenu = { init: init };
  init();   // si le script est chargé après l'injection du header
})();
