/**
 * zts-editeur.js — editeur de fiches de jeu, reserve a l'admin.
 *
 * Route /admin/fiches. Le contenu vit dans Firestore, les images dans
 * Storage ; plus rien dans localStorage sauf le brouillon de recuperation.
 */
(function (global) {
  'use strict';

  var URL_INSCRIPTION = 'https://zonetotalsport.ca/inscription';
  var CLE_BROUILLON = 'zts-fiche-brouillon';

  var etat = {
    fiche: null,
    sections: [],
    edition: false,
    sale: false,       // modifications non sauvegardees
    minuteur: null
  };

  /* ══ Migration depuis la maquette locale ═══════════════════════════════
   *
   * L'ancienne page gardait ses textes sous des cles POSITIONNELLES
   * (p0-l4, p2-l1…) produites en parcourant tous les h1/h2/h3/p/li/div/span
   * de chaque page. La table ci-dessous a ete relevee en executant la
   * maquette d'origine, pas devinee.
   *
   * Deux constats a garder en tete :
   *  - p0-l0 « PORTRAIT », p0-l1 « SUITE », p1-l1 « BUT DU JEU »… sont des
   *    morceaux d'interface qui se retrouvaient sauvegardes comme du
   *    contenu. Ils ne sont pas migres.
   *  - le TITRE n'a jamais ete editable (le parcours saute les <span> d'un
   *    <h1>), pas plus que les deux variantes de la page 4 (elles
   *    contiennent un <strong>, donc ont des enfants). Il n'y a donc rien a
   *    migrer pour ces champs-la.
   */
  var MIGRATION = {
    'p0-l4': 'sousTitre',
    'p0-l5': 'badges.0.texte',
    'p0-l6': 'badges.1.texte',
    'p0-l7': 'badges.2.texte',
    'p0-l8': 'badges.3.texte',
    'p1-l2': 'butDuJeu',
    'p2-l0': 'sections.0.titre',
    'p2-l1': 'sections.0.explications.0.texte',
    'p2-l2': 'sections.0.explications.1.texte',
    'p2-l3': 'sections.0.explications.2.texte',
    'p2-l4': 'sections.0.explications.3.texte',
    'p3-l1': 'sections.1.titre',
    'p3-l2': 'sections.1.explications.0.texte',
    'p3-l3': 'sections.1.explications.1.texte',
    'p3-l4': 'sections.1.explications.2.texte',
    'p3-l5': 'sections.2.titre'
  };

  function lireLocal(cle) {
    try { return JSON.parse(localStorage.getItem(cle) || 'null'); } catch (e) { return null; }
  }

  function aMigrer() {
    return !!(lireLocal('zts-fiche-textes') || lireLocal('zts-fiche-pages') ||
              localStorage.getItem('zts-unlocked'));
  }

  /**
   * Construit une fiche a partir de ce que la maquette avait garde dans le
   * navigateur. Ne touche a rien tant que la sauvegarde Firestore n'a pas
   * reussi — la purge se fait apres, jamais avant.
   */
  function migrer() {
    var textes = lireLocal('zts-fiche-textes') || {};
    var pages = lireLocal('zts-fiche-pages') || [];
    var f = ZTSFiche.vide();

    // Pages ajoutees -> sections supplementaires (2 explications chacune).
    pages.forEach(function (p) {
      f.sections.push(ZTSFiche.sectionVide(p.orient === 'landscape' ? 'paysage' : 'portrait'));
    });

    Object.keys(textes).forEach(function (cle) {
      var val = textes[cle];
      if (typeof val !== 'string' || !val.trim()) return;

      if (MIGRATION[cle]) { ZTSFiche.ecrire(f, MIGRATION[cle], val); return; }

      // Pages ajoutees : wrap 4+k -> section 3+k, l0 titre, l1/l2 textes.
      var m = /^p(\d+)-l(\d+)$/.exec(cle);
      if (!m) return;
      var wrap = +m[1], leaf = +m[2];
      if (wrap < 4) return;                       // deja couvert, ou interface
      var idx = 3 + (wrap - 4);
      if (!f.sections[idx]) return;
      if (leaf === 0) f.sections[idx].titre = val;
      else if (leaf === 1 || leaf === 2) {
        f.sections[idx].explications[leaf - 1].texte = val;
      }
    });

    f.titre = 'FICHE RÉCUPÉRÉE';
    f.statut = 'brouillon';
    return f;
  }

  function purgerLocal() {
    ['zts-fiche-textes', 'zts-fiche-pages', 'zts-unlocked'].forEach(function (k) {
      try { localStorage.removeItem(k); } catch (e) {}
    });
  }

  /* ══ Etat visuel ══════════════════════════════════════════════════════ */

  function etatMsg(txt, erreur) {
    var el = document.getElementById('zts-etat');
    if (!txt) { el.style.display = 'none'; return; }
    el.textContent = txt;
    el.className = 'zts-etat' + (erreur ? ' zts-etat--erreur' : '');
    el.style.display = 'block';
    if (!erreur) {
      clearTimeout(el._t);
      el._t = setTimeout(function () { el.style.display = 'none'; }, 2200);
    }
  }

  /* ══ Sauvegarde ═══════════════════════════════════════════════════════ */

  function sauverBrouillonLocal() {
    try { localStorage.setItem(CLE_BROUILLON, JSON.stringify(etat.fiche)); } catch (e) {}
  }

  function sauver(silencieux) {
    if (!etat.fiche) return Promise.resolve();
    var f = etat.fiche;

    var base = ZTSFichesDB.slugifier(f.slug || f.titre);
    if (!base) {
      etatMsg('Donne un titre à la fiche avant de sauvegarder.', true);
      return Promise.reject(new Error('slug vide'));
    }

    return ZTSFichesDB.slugUnique(base, f.id)
      .then(function (slug) {
        f.slug = slug;
        return ZTSFichesDB.sauver(f);
      })
      .then(function () {
        etat.sale = false;
        try { localStorage.removeItem(CLE_BROUILLON); } catch (e) {}
        // La maquette n'est purgee qu'ICI : tant que Firestore n'a pas
        // accuse reception, le contenu de l'ancienne page reste sur le
        // disque de Joey. Une migration qui perd des donnees vaut moins
        // qu'une migration qui laisse trainer trois cles.
        if (etat.migration) { purgerLocal(); etat.migration = false; }
        if (!silencieux) etatMsg('Fiche sauvegardée ✓');
        majBarre();
      })
      .catch(function (e) {
        sauverBrouillonLocal();
        etatMsg('Sauvegarde impossible — brouillon gardé sur cet appareil. ' +
                (e && e.code ? '(' + e.code + ')' : ''), true);
        throw e;
      });
  }

  function marquerSale() {
    etat.sale = true;
    majBarre();
    clearTimeout(etat.minuteur);
    etat.minuteur = setTimeout(function () { sauver(true).catch(function () {}); }, 1500);
  }

  /* ══ Champs editables ═════════════════════════════════════════════════ */

  /** Ecrit une valeur de texte au bon endroit du modele. */
  function ecrireChamp(chemin, texte) {
    var f = etat.fiche;
    var m = /^badges\.(\d+)$/.exec(chemin);
    if (m) {
      f.badges[+m[1]] = f.badges[+m[1]] || {};
      f.badges[+m[1]].texte = texte;
      return;
    }
    ZTSFiche.ecrire(f, chemin, texte);
  }

  function brancherEdition() {
    var racine = document.getElementById('zts-racine');
    var champs = racine.querySelectorAll('[data-champ]');
    Array.prototype.forEach.call(champs, function (el) {
      if (el.tagName === 'IMAGE-SLOT') return;
      // En atelier, un clic SELECTIONNE et un double-clic ecrit : les champs
      // restent donc non editables jusqu'a ce que l'atelier en ouvre un.
      // Sans ca, impossible de glisser un titre — le clic poserait un
      // curseur de saisie au lieu de prendre l'element.
      el.contentEditable = 'false';
      if (!etat.edition) { el.oninput = null; el.onblur = null; return; }

      el.oninput = function () {
        // Le titre porte des <span> colores : on ne touche pas au DOM
        // pendant la frappe, sinon le curseur saute a chaque caractere.
        ecrireChamp(el.getAttribute('data-champ'), el.textContent);
        marquerSale();
      };
      el.onblur = function () {
        // Le titre apparait deux fois (pages 1 et 2) : on recolorise les
        // deux d'un coup, une fois la frappe finie. Les couleurs viennent de
        // styles.titre quand l'atelier les a reglees.
        if (el.getAttribute('data-champ') !== 'titre') return;
        var alt = ZTSFiche.altTitre(etat.fiche);
        Array.prototype.forEach.call(
          document.querySelectorAll('[data-champ="titre"]'), function (h) {
            h.innerHTML = ZTSFiche.titreColore(etat.fiche.titre, alt.a, alt.b);
          });
      };
    });
    racine.classList.toggle('zts-editable-on', etat.edition);
  }

  /* ══ Rendu ════════════════════════════════════════════════════════════ */

  /**
   * Redessine la zone de travail.
   *
   * L'ordre compte : les surcharges de style AVANT les formes, parce que
   * `ZTSFormes.dessiner` lit `page.offsetWidth` — une surcharge posee apres
   * mesurerait la page a ses dimensions d'avant. C'est le meme ordre que
   * /fiches/fiche.html cote public, et il ne doit pas diverger.
   */
  function dessiner() {
    var racine = document.getElementById('zts-racine');
    racine.innerHTML = ZTSFiche.rendre(etat.fiche, {
      mode: 'editeur',
      signupUrl: URL_INSCRIPTION,
      base: '/fiches/'
    });
    ZTSFormes.appliquerStyles(racine, etat.fiche.styles);
    ZTSFormes.dessiner(racine, etat.fiche.formes);
    brancherEdition();
    if (ZTSAtelier.estActif()) ZTSAtelier.rafraichir();
    majBarre();
  }

  /* ══ Barre d'outils ═══════════════════════════════════════════════════ */

  function optionsSections() {
    return etat.sections.map(function (s) {
      return '<option value="' + s.slug + '"' +
        (etat.fiche.category === s.slug ? ' selected' : '') + '>' +
        (s.icone ? s.icone + ' ' : '') + s.nom + '</option>';
    }).join('');
  }

  function majBarre() {
    var f = etat.fiche;
    if (!f) return;
    document.getElementById('zts-slug').textContent = f.slug ? '/fiches/' + f.slug : '(slug à la sauvegarde)';
    document.getElementById('zts-statut').textContent =
      (f.statut === 'publie' ? 'PUBLIÉE' : 'BROUILLON') + (etat.sale ? ' · modifiée' : '');
    document.getElementById('zts-publier').textContent =
      f.statut === 'publie' ? 'DÉPUBLIER' : 'PUBLIER';
    document.getElementById('zts-edition').textContent =
      etat.edition ? "TERMINER L'ÉDITION" : 'MODE ÉDITION';
    document.getElementById('zts-edition').classList.toggle('zts-bouton--vert', etat.edition);
  }

  function brancherBarre() {
    var f = function () { return etat.fiche; };

    document.getElementById('zts-edition').addEventListener('click', function () {
      etat.edition = !etat.edition;
      brancherEdition();
      if (etat.edition) ZTSAtelier.activer(); else ZTSAtelier.desactiver();
      majBarre();
    });

    document.getElementById('zts-portrait').addEventListener('click', function () {
      f().sections.push(ZTSFiche.sectionVide('portrait')); marquerSale(); dessiner();
    });
    document.getElementById('zts-paysage').addEventListener('click', function () {
      f().sections.push(ZTSFiche.sectionVide('paysage')); marquerSale(); dessiner();
    });
    document.getElementById('zts-retirer').addEventListener('click', function () {
      // On ne retire que les sections ajoutees : les trois premieres sont
      // la structure de base de la fiche.
      if (f().sections.length <= 3) { etatMsg('Les trois sections de base ne se retirent pas.', true); return; }
      f().sections.pop(); marquerSale(); dessiner();
    });

    document.getElementById('zts-sauver').addEventListener('click', function () {
      sauver(false).catch(function () {});
    });

    document.getElementById('zts-publier').addEventListener('click', function () {
      var fi = f();
      if (fi.statut !== 'publie' && !fi.category) {
        etatMsg('Choisis une catégorie avant de publier.', true); return;
      }
      fi.statut = fi.statut === 'publie' ? 'brouillon' : 'publie';
      sauver(false).then(majBarre).catch(function () {});
    });

    document.getElementById('zts-pdf').addEventListener('click', function () { window.print(); });

    document.getElementById('zts-apercu').addEventListener('click', function () {
      if (!f().slug) { etatMsg('Sauvegarde d’abord la fiche.', true); return; }
      window.open('/fiches/fiche.html?f=' + encodeURIComponent(f().slug), '_blank', 'noopener');
    });

    document.getElementById('zts-univers').addEventListener('change', function (e) {
      f().univers = e.target.value; marquerSale();
    });
    document.getElementById('zts-categorie').addEventListener('change', function (e) {
      f().category = e.target.value; marquerSale();
    });

    document.getElementById('zts-nouvelle').addEventListener('click', function () {
      if (etat.sale && !confirm('Des modifications ne sont pas sauvegardées. Continuer ?')) return;
      etat.fiche = ZTSFiche.vide();
      etat.fiche.id = ZTSFichesDB.nouvelId();
      etat.sale = false;
      dessiner();
    });

    document.getElementById('zts-liste').addEventListener('click', ouvrirListe);

    global.addEventListener('beforeunload', function (e) {
      if (etat.sale) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  /* ══ Liste des fiches ═════════════════════════════════════════════════ */

  function ouvrirListe() {
    var boite = document.getElementById('zts-liste-boite');
    boite.style.display = 'block';
    boite.innerHTML = '<p style="margin:0;padding:14px;">Chargement…</p>';
    ZTSFichesDB.listerToutes().then(function (l) {
      if (!l.length) { boite.innerHTML = '<p style="margin:0;padding:14px;">Aucune fiche.</p>'; return; }
      boite.innerHTML =
        '<button type="button" class="zts-bouton zts-bouton--gris" id="zts-fermer-liste"' +
        ' style="margin:12px;">FERMER</button><ul style="list-style:none;margin:0;padding:0 12px 12px;">' +
        l.map(function (x) {
          return '<li style="padding:7px 0;border-bottom:2px dashed #ddd;">' +
            '<a href="#" data-id="' + x.id + '" style="text-decoration:none;color:#101010;font-weight:700;">' +
            (x.titre || '(sans titre)') + '</a> ' +
            '<span style="font-size:12px;color:#6b7a83;">' +
            (x.statut === 'publie' ? '· publiée' : '· brouillon') + '</span></li>';
        }).join('') + '</ul>';
      boite.querySelector('#zts-fermer-liste').addEventListener('click', function () {
        boite.style.display = 'none';
      });
      Array.prototype.forEach.call(boite.querySelectorAll('a[data-id]'), function (a) {
        a.addEventListener('click', function (ev) {
          ev.preventDefault();
          charger(a.getAttribute('data-id'));
          boite.style.display = 'none';
        });
      });
    }).catch(function () {
      boite.innerHTML = '<p style="margin:0;padding:14px;">Lecture impossible.</p>';
    });
  }

  function charger(id) {
    etatMsg('Ouverture…');
    ZTSFichesDB.parId(id)
      .then(ZTSFichesDB.complete)
      .then(function (f) {
        etat.fiche = f;
        etat.sale = false;
        dessiner();
        etatMsg('');
      })
      .catch(function () { etatMsg('Fiche illisible.', true); });
  }

  /* ══ Demarrage ════════════════════════════════════════════════════════ */

  function demarrer() {
    document.getElementById('zts-appli').style.display = 'block';
    document.getElementById('zts-gate').style.display = 'none';

    ZTSImageSlot.configurer({
      resoudre: ZTSFichesDB.urlDe,
      editable: true,
      televerser: function (blob, champ, onProgres) {
        if (!etat.fiche.id) etat.fiche.id = ZTSFichesDB.nouvelId();
        return ZTSFichesDB.televerser(blob, etat.fiche.id, champ, onProgres);
      }
    });

    document.addEventListener('zts-image', function (e) {
      ZTSFiche.ecrire(etat.fiche, e.detail.champ, e.detail.path);
      marquerSale();
      if (ZTSAtelier.estActif()) ZTSAtelier.instantane('Image');
    });

    /* L'atelier ne connait pas Firestore : il lit et ecrit une fiche, et
     * demande un redessin. Tout ce qui touche a la sauvegarde reste ici. */
    ZTSAtelier.configurer({
      racine: function () { return document.getElementById('zts-racine'); },
      fiche: function () { return etat.fiche; },
      change: marquerSale,
      redessiner: dessiner,
      remplacer: function (f) {
        // L'identifiant ne fait pas partie de ce qu'on annule : le remonter
        // d'un instantane pointerait les televersements vers l'ancien doc.
        var id = etat.fiche && etat.fiche.id;
        etat.fiche = f;
        if (id) etat.fiche.id = id;
        marquerSale();
        dessiner();
      }
    });

    brancherBarre();

    ZTSFichesDB.sections().then(function (s) {
      etat.sections = s;
      document.getElementById('zts-categorie').innerHTML =
        '<option value="">— Publier dans… —</option>' + optionsSections();
    }).catch(function () {});

    // Reprise : brouillon local d'abord (une sauvegarde a echoue), puis
    // migration de la maquette, puis fiche neuve.
    var brouillon = lireLocal(CLE_BROUILLON);
    if (brouillon) {
      etat.fiche = brouillon;
      etatMsg('Brouillon local repris — sauvegarde-le pour le remettre en ligne.', true);
    } else if (aMigrer()) {
      etat.fiche = migrer();
      etat.fiche.id = ZTSFichesDB.nouvelId();
      etat.migration = true;
      dessiner();
      etatMsg('Contenu de l’ancienne maquette récupéré. Vérifie, puis sauvegarde.');
      return;
    } else {
      etat.fiche = ZTSFiche.vide();
      etat.fiche.id = ZTSFichesDB.nouvelId();
    }
    dessiner();
  }

  /* ══ Porte admin ══════════════════════════════════════════════════════ */

  function refus(msg) {
    var g = document.getElementById('zts-gate-msg');
    g.textContent = msg;
    g.style.display = 'block';
  }

  function verifier() {
    if (ZTSFichesDB.estAdmin()) { demarrer(); return; }
    if (ZTSFichesDB.estConnecte()) {
      // Connecte mais pas admin : on le dit, puis on renvoie au public.
      refus('Ce compte n’a pas accès à l’éditeur. Redirection…');
      setTimeout(function () { location.replace('/fiches/'); }, 2500);
      return;
    }
    document.getElementById('zts-gate').style.display = 'flex';
  }

  ZTSFichesDB.pret().then(verifier).catch(function () {
    refus('Firebase injoignable. Réessaie dans un instant.');
    document.getElementById('zts-gate').style.display = 'flex';
  });

  document.getElementById('zts-connexion').addEventListener('submit', function (e) {
    e.preventDefault();
    var b = document.getElementById('zts-connexion-btn');
    b.disabled = true;
    refus('');
    document.getElementById('zts-gate-msg').style.display = 'none';
    ZTSFichesDB.connexion(
      document.getElementById('zts-mail').value.trim(),
      document.getElementById('zts-mdp').value
    ).then(function (admin) {
      b.disabled = false;
      if (admin) demarrer();
      else refus('Ce compte n’a pas accès à l’éditeur.');
    }).catch(function (err) {
      b.disabled = false;
      var codes = {
        'auth/invalid-credential': 'Courriel ou mot de passe incorrect.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/user-not-found': 'Aucun compte pour ce courriel.',
        'auth/too-many-requests': 'Trop de tentatives — réessaie dans quelques minutes.'
      };
      refus(codes[err && err.code] || 'Connexion impossible.');
    });
  });
})(window);
