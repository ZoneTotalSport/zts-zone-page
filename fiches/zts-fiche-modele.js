/**
 * zts-fiche-modele.js — moteur de rendu des fiches de jeu.
 *
 * Portage vanille de « Fiche de jeu.dc.html » (runtime d'artefact Claude).
 * Aucune dependance : ni React, ni CDN tiers. Le balisage et les styles
 * inline sont recopies tels quels depuis la maquette d'origine ; ce qui a
 * change est liste dans ECARTS ci-dessous et documente dans FICHES.md.
 *
 * Expose window.ZTSFiche.
 *
 *   ZTSFiche.rendre(fiche, options) -> chaine HTML
 *   ZTSFiche.vide()                 -> gabarit de fiche neuve
 *   ZTSFiche.lire(fiche, chemin)    -> valeur a un chemin pointe
 *   ZTSFiche.ecrire(fiche, chemin, v)
 *
 * ECARTS assumes vs la maquette (decides avec Joey le 2026-08-16) :
 *   1. Page 3 passe de 856x1172 a 850x1100 (le fond etait dessine en
 *      850x1100 : il restait 6 px a droite et 72 px de cyan nu en bas).
 *      Elle recoit aussi l'etiquette d'en-tete que les autres pages avaient.
 *   2. Les etiquettes (badges) de la page 1 sont normalisees sur un seul
 *      style : la 1re avait width:181px/height:37px et letter-spacing:1px
 *      en dur, les autres non. La largeur devient naturelle.
 *   3. Les cadres d'image sont uniformises : la case de la page 2 etait
 *      fixee a 911x474 dans un cadre de 941x480, et la 4e case de la page 3
 *      a 288x241 la ou ses voisines faisaient 300x170. Toutes remplissent
 *      desormais leur cadre (inset:0, object-fit:cover).
 *   4. L'etiquette « BUT DU JEU » passe de #FFF200 (jaune sur blanc,
 *      illisible) a #101010.
 */
(function (global) {
  'use strict';

  /* ── Constantes de style, extraites verbatim de la maquette ─────────── */

  var CYAN = '#22ccf5';
  var JAUNE = '#FFF200';
  var VERT = '#93FA00';
  var NOIR = '#101010';

  var S = {
    conteneur:
      "display:flex;flex-direction:column;align-items:center;gap:40px;padding:40px 0;" +
      "font-family:'Comic Neue','Comic Sans MS',cursive;font-weight:700;color:" + NOIR + ';',

    wrap: 'display:flex;flex-direction:column;align-items:center;gap:10px;',

    etiquette:
      'display:flex;align-items:center;gap:10px;background:' + NOIR + ';color:' + JAUNE + ';' +
      "font-family:'Luckiest Guy',cursive;font-size:15px;letter-spacing:2px;padding:6px 16px 4px;" +
      'box-shadow:4px 4px 0 rgba(0,0,0,0.35);',

    // Texte d'explication : identique sur les pages 3, 4 et les pages ajoutees.
    explication:
      'flex:1 1 0;min-width:0;' +
      "font-family:'ZoneTotalSportFiche',Bangers,cursive;font-size:13px;line-height:2.2;color:" + CYAN + ';' +
      '-webkit-text-stroke:4.5pt #000;word-spacing:8px;letter-spacing:0.8px;' +
      'paint-order:stroke fill;text-shadow:3px 3px 0 #000;',

    rangee: 'display:flex;gap:18px;align-items:center;',

    // Etiquette d'age / nombre / duree / lieu, page 1. (ECART 2)
    badge:
      'border:3px solid #000;padding:4px 12px;' +
      "font-family:'ZoneTotalSportFiche',Bangers,cursive;font-size:15px;line-height:3;color:#fff;" +
      '-webkit-text-stroke:1.2px #000;word-spacing:6px;letter-spacing:0.6px;' +
      'paint-order:stroke fill;text-shadow:2px 2px 0 #000;box-shadow:3px 3px 0 #000;'
  };

  // Couleurs par defaut des etiquettes de la page 1, dans l'ordre d'origine.
  var COULEURS_BADGE = [JAUNE, '#00D7FF', '#FFEB00', CYAN];

  /* ── Gabarits de section ────────────────────────────────────────────────
   * pleine : la section occupe sa propre page (ex. « Deroulement »).
   * demi   : les sections « demi » consecutives se partagent une page
   *          (ex. « Materiel & preparation » + « Variantes »).
   * Chaque section porte son orientation ; 'paysage' donne 1100x850.
   */
  var GABARITS = {
    pleine: { titreTaille: 34, imgL: 300, imgH: 170, gap: 18, motEspace: 0 },
    // La maquette posait word-spacing:8px sur les titres a 30px (page 4 et
    // pages ajoutees) mais pas sur celui a 34px (page 3). Sans ce 8px,
    // « Materiel & preparation » perd 16 px et le titre centre se decale.
    demi: { titreTaille: 30, imgL: 260, imgH: 132, gap: 16, motEspace: 8 }
  };

  /* ── Utilitaires ────────────────────────────────────────────────────── */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /**
   * Echappement + deux commodites reprises de la maquette :
   *
   *  - insecables devant la ponctuation double (regle typographique FR) ;
   *    la maquette les posait a la main (« billots&nbsp;? »).
   *  - **gras** -> amorce en jaune. La maquette ecrivait ces amorces en
   *    <strong style="color:#FFF200"> en dur (« Tempête : », « Duo : »),
   *    ce qui les rendait justement NON editables : le parcours de texte
   *    sautait tout element ayant des enfants. Le passer en balisage rend
   *    l'amorce editable sans perdre le jaune.
   */
  function typo(s) {
    return esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:' + JAUNE + '">$1</strong>')
      .replace(/ ([?!:;»])/g, ' $1')
      .replace(/(«) /g, '$1 ');
  }

  function lire(obj, chemin) {
    var cur = obj;
    var parts = String(chemin).split('.');
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return undefined;
      cur = cur[parts[i]];
    }
    return cur;
  }

  function ecrire(obj, chemin, valeur) {
    var parts = String(chemin).split('.');
    var cur = obj;
    for (var i = 0; i < parts.length - 1; i++) {
      var k = parts[i];
      if (cur[k] == null) cur[k] = /^\d+$/.test(parts[i + 1]) ? [] : {};
      cur = cur[k];
    }
    cur[parts[parts.length - 1]] = valeur;
    return obj;
  }

  /**
   * Titre en lettres alternees, deux couleurs.
   * L'alternance porte sur les caracteres non blancs uniquement, et
   * commence par `a` ; les espaces restent hors des <span>.
   *
   * `a` et `b` viennent de `styles.titre.altA / .altB` quand l'atelier les a
   * regles ; sans eux on retombe sur le cyan / jaune de la maquette. Le
   * titre est stocke en TEXTE BRUT — les <span> sont regeneres au rendu.
   */
  function titreColore(texte, a, b) {
    var out = '';
    var i = 0;
    var ca = a || CYAN, cb = b || JAUNE;
    var chars = Array.from(String(texte == null ? '' : texte));
    for (var k = 0; k < chars.length; k++) {
      var c = chars[k];
      if (/\s/.test(c)) { out += esc(c); continue; }
      out += '<span style="color:' + (i % 2 === 0 ? ca : cb) + '">' + esc(c) + '</span>';
      i++;
    }
    return out;
  }

  /** Couleurs alternees du titre, telles que reglees dans l'atelier. */
  function altTitre(f) {
    var s = f && f.styles && f.styles.titre;
    return { a: s && s.altA, b: s && s.altB };
  }

  /** Case image : <image-slot> qui remplit son cadre. (ECART 3) */
  function caseImage(chemin, placeholder, opts) {
    return '<image-slot data-champ="' + esc(chemin) + '"' +
      (opts && opts.chemin ? ' path="' + esc(opts.chemin) + '"' : '') +
      ' placeholder="' + esc(placeholder) + '"></image-slot>';
  }

  /**
   * `data-bloc` porte le MEME chemin que la case qu'il encadre, prefixe
   * « b: » du cote des styles. C'est lui la cible deplacable : <image-slot>
   * est en position:absolute;inset:0, donc bouger la case sans bouger son
   * cadre laisserait le contour noir sur place. Cle explicite, jamais un
   * chemin d'indices DOM — voir FICHES.md.
   */
  function cadre(largeurCss, hauteur, ombre, chemin, placeholder, opts) {
    return '<div data-bloc="' + esc(chemin) + '" style="' + largeurCss +
      'height:' + hauteur + 'px;position:relative;' +
      'border:5px solid #000;box-shadow:6px 6px 0 ' + ombre + ';">' +
      caseImage(chemin, placeholder, opts) + '</div>';
  }

  function etiquettePage(texte, orientation) {
    return '<div class="zts-ui" style="' + S.etiquette + '">' + esc(texte) +
      ' <span style="color:' + CYAN + '">' + (orientation === 'paysage' ? 'PAYSAGE' : 'PORTRAIT') +
      '</span></div>';
  }

  function dimensions(orientation) {
    return orientation === 'paysage' ? { w: 1100, h: 850 } : { w: 850, h: 1100 };
  }

  /** Feuille de fond ZTS, aux dimensions demandees. */
  function feuille(orientation, contenu, opts) {
    var d = dimensions(orientation);
    var fond = (opts && opts.fond) ||
      "background-image:url('" + (opts && opts.base || '') + "assets/fond-zts.png');" +
      'background-size:' + d.w + 'px ' + d.h + 'px;background-repeat:no-repeat;';
    return '<div data-page style="width:' + d.w + 'px;height:' + d.h + 'px;position:relative;' +
      fond + 'overflow:hidden;flex:0 0 auto;">' + contenu + '</div>';
  }

  function page(etiquette, orientation, contenu, opts) {
    return '<div class="zts-page-wrap" style="' + S.wrap + '">' +
      (etiquette ? etiquettePage(etiquette, orientation) : '') +
      feuille(orientation, contenu, opts) + '</div>';
  }

  /* ── Page 1 — titre & illustration ──────────────────────────────────── */

  function page1(f, o) {
    var badges = (f.badges || []).map(function (b, i) {
      var texte = typeof b === 'string' ? b : (b && b.texte) || '';
      var couleur = (b && b.couleur) || COULEURS_BADGE[i % COULEURS_BADGE.length];
      // `largeur` est optionnelle : sans elle l'etiquette prend sa largeur
      // naturelle. La maquette forcait 181px sur la premiere seulement ;
      // le champ existe pour pouvoir la reproduire au pixel si besoin.
      var largeur = (b && b.largeur) ? 'width:' + parseInt(b.largeur, 10) + 'px;' : '';
      return '<div data-champ="badges.' + i + '" style="' + S.badge + largeur +
        'background-color:' + couleur + '">' + typo(texte) + '</div>';
    }).join('');

    var suite =
      '<a href="' + esc(o.suiteHref) + '" style="position:absolute;right:40px;bottom:66px;' +
      'display:flex;align-items:center;gap:8px;background:' + JAUNE + ';border:3px solid #000;' +
      'box-shadow:4px 4px 0 #000;padding:5px 12px;transform:rotate(-1.5deg);text-decoration:none;">' +
      "<span style=\"font-family:'Luckiest Guy',cursive;font-size:14px;letter-spacing:1px;color:" + NOIR + ';">SUITE</span>' +
      "<span style=\"font-family:'Luckiest Guy',cursive;font-size:22px;line-height:1;color:" + CYAN + ';' +
      '-webkit-text-stroke:1.4px #000;paint-order:stroke fill;">➜</span></a>';

    var corps =
      suite +
      '<div style="position:absolute;left:62px;top:54px;width:690px;display:flex;flex-direction:column;gap:16px;">' +
        '<div style="text-align:center;">' +
          '<div style="display:inline-block;background:#000;color:' + JAUNE + ';' +
            "font-family:'Luckiest Guy',cursive;font-size:13px;letter-spacing:2px;padding:5px 14px 3px;" +
            'transform:rotate(-1.2deg);">FICHE DE JEU · ÉDUCATION PHYSIQUE</div>' +
          '<h1 data-champ="titre" style="margin:35px 0 0;' +
            "font-family:'ZoneTotalSportFiche',Bangers,cursive;font-size:24px;line-height:1.42;letter-spacing:3px;" +
            '-webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:4px 4px 0 #000;' +
            'text-wrap:balance;">' + titreColore(f.titre, o.altA, o.altB) + '</h1>' +
          '<p data-champ="sousTitre" style="margin:10px 0 0;' +
            "font-family:'Luckiest Guy',cursive;font-size:19px;letter-spacing:0.5px;color:" + NOIR + ';">' +
            typo(f.sousTitre) + '</p>' +
          '<div style="margin-top:12px;display:flex;justify-content:center;gap:8px;width:690px;height:51px;">' +
            badges + '</div>' +
        '</div>' +
        '<div data-bloc="imagePrincipale" style="position:relative;height:700px;' +
          'border:5px solid #000;box-shadow:8px 8px 0 ' + CYAN + ';">' +
          caseImage('imagePrincipale', 'Grande illustration du jeu — glisse ton image ici',
                    { chemin: f.imagePrincipale }) +
        '</div>' +
      '</div>';

    return page('PAGE 1 · TITRE & ILLUSTRATION', 'portrait', corps, o);
  }

  /* ── Page 2 — image du jeu & but ────────────────────────────────────── */

  function page2(f, o) {
    var base = o.base || '';
    var corps =
      '<div style="position:absolute;left:28px;top:24px;right:40px;bottom:36px;background:#fff;' +
        'border:5px solid #000;box-shadow:12px 12px 0 #000;"></div>' +
      '<div style="position:absolute;left:62px;top:52px;width:984px;display:flex;flex-direction:column;gap:14px;">' +
        '<h1 data-champ="titre" style="margin:0;text-align:center;' +
          "font-family:'ZoneTotalSportFiche',Bangers,cursive;font-size:24px;line-height:4;letter-spacing:3px;" +
          '-webkit-text-stroke:5px #000;paint-order:stroke fill;text-shadow:4px 4px 0 #000;' +
          'width:982px;height:70px;">' + titreColore(f.titre, o.altA, o.altB) + '</h1>' +
        '<div data-bloc="imagePage2" style="position:relative;height:490px;border:5px solid #000;' +
          'box-shadow:8px 8px 0 ' + CYAN + ';width:951px;">' +
          caseImage('imagePage2', 'Image du jeu pleine page — glisse ton image ici',
                    { chemin: f.imagePage2 }) +
        '</div>' +
        '<div style="display:flex;align-items:stretch;border:4px solid #000;box-shadow:5px 5px 0 #000;' +
          'background-color:#F5FF00;">' +
          // ECART 4 : #FFF200 sur #FFFFFF etait illisible.
          '<div style="flex:0 0 auto;color:' + NOIR + ';' +
            "font-family:'Luckiest Guy',cursive;font-size:25px;letter-spacing:1px;padding:10px 14px;" +
            'display:flex;align-items:center;background-color:#FFFFFF;text-transform:uppercase;">BUT DU JEU</div>' +
          '<p data-champ="butDuJeu" style="margin:0;padding:10px 16px;' +
            "font-family:'ZoneTotalSportFiche',Bangers,cursive;font-size:14px;line-height:2.15;color:" + CYAN + ';' +
            '-webkit-text-stroke:4.5pt #000;word-spacing:8px;letter-spacing:0.8px;paint-order:stroke fill;' +
            'text-shadow:3px 3px 0 #000;text-wrap:pretty;">' + typo(f.butDuJeu) + '</p>' +
        '</div>' +
      '</div>' +
      '<img src="' + base + 'assets/logo-bandeau2.png" alt="Zone Total Sport" ' +
        'style="position:absolute;left:50%;bottom:0;transform:translateX(-50%);width:430px;height:auto;display:block;">';

    return page('PAGE 2 · IMAGE DU JEU & BUT', 'paysage', corps, {
      base: base,
      fond: "background:url('" + base + "assets/fond-page2.png') center / cover no-repeat;"
    });
  }

  /* ── Sections (pages 3, 4 et suivantes) ─────────────────────────────── */

  function titreSection(chemin, texte, g, margeHaut) {
    return '<h2 data-champ="' + esc(chemin) + '" style="margin:' +
      (margeHaut ? '8px 0 0' : '0') + ';text-align:center;' +
      "font-family:'ZoneTotalSportFiche',Bangers,cursive;font-size:" + g.titreTaille + 'px;' +
      (g.motEspace ? 'word-spacing:' + g.motEspace + 'px;' : '') + 'letter-spacing:0.5px;' +
      'color:' + VERT + ';-webkit-text-stroke:2px #000;paint-order:stroke fill;">' + typo(texte) + '</h2>';
  }

  /**
   * Une rangee texte/image.
   *
   * L'alternance (image a droite / a gauche, ombre cyan / jaune) est
   * indexee sur `rang`, un compteur qui court sur toute la PAGE et non sur
   * la section : dans la maquette, « Variantes » reprend l'alternance la ou
   * « Materiel & preparation » l'avait laissee. Repartir de zero a chaque
   * titre inverserait les deux dernieres rangees de la page 4.
   */
  function rangee(cheminSection, idx, rang, expl, g) {
    var gauche = rang % 2 === 0;
    var texte = '<div data-champ="' + cheminSection + '.explications.' + idx + '.texte" style="' +
      S.explication + '">' + typo(expl && expl.texte) + '</div>';
    var img = cadre(
      'flex:0 0 ' + g.imgL + 'px;', g.imgH, gauche ? CYAN : JAUNE,
      cheminSection + '.explications.' + idx + '.imagePath',
      'Illustration ' + (idx + 1),
      { chemin: expl && expl.imagePath }
    );
    return '<div style="' + S.rangee + '">' +
      (gauche ? texte + img : img + texte) + '</div>';
  }

  function blocSection(f, i, g, compteur, secondaire) {
    var s = f.sections[i];
    var chemin = 'sections.' + i;
    var html = titreSection(chemin + '.titre', s.titre, g, secondaire);
    (s.explications || []).forEach(function (e, k) {
      html += rangee(chemin, k, compteur.n++, e, g);
    });
    return html;
  }

  /**
   * Regroupe les sections en pages : une section « pleine » par page,
   * les « demi » consecutives partagees. Retourne [[i], [i, i+1], ...].
   */
  function grouper(sections) {
    var groupes = [];
    var courant = null;
    (sections || []).forEach(function (s, i) {
      if ((s.gabarit || 'pleine') === 'demi') {
        if (!courant) { courant = []; groupes.push(courant); }
        courant.push(i);
      } else {
        courant = null;
        groupes.push([i]);
      }
    });
    return groupes;
  }

  function pagesSections(f, o) {
    var groupes = grouper(f.sections);
    var html = '';
    groupes.forEach(function (grp, gi) {
      var premiere = f.sections[grp[0]];
      var orientation = premiere.orientation === 'paysage' ? 'paysage' : 'portrait';
      var g = GABARITS[(premiere.gabarit || 'pleine') === 'demi' ? 'demi' : 'pleine'];
      var corps = '<div style="position:absolute;left:62px;top:62px;width:690px;' +
        'display:flex;flex-direction:column;gap:' + g.gap + 'px;">';
      var compteur = { n: 0 };   // alternance continue sur toute la page
      grp.forEach(function (i, k) {
        // La maquette separait « Variantes » du bloc precedent par un
        // simple margin-top:8px sur le <h2>. Un div espaceur ferait un
        // item flex de plus, donc le gap compterait DEUX fois autour :
        // 16+8+16 au lieu de 16+8.
        corps += blocSection(f, i, g, compteur, k > 0);
      });
      corps += '</div>';
      var noms = grp.map(function (i) { return (f.sections[i].titre || '').toUpperCase(); }).join(' & ');
      html += page('PAGE ' + (gi + 3) + ' · ' + noms, orientation, corps, o);
    });
    return html;
  }

  /* ── Bloc mur d'inscription (mode public) ───────────────────────────── */

  function murInscription(o) {
    return '<div style="width:850px;max-width:100%;background:#fff;border:5px solid #000;' +
      'box-shadow:12px 12px 0 ' + NOIR + ';padding:40px 44px 36px;text-align:center;">' +
      '<div style="display:inline-block;background:#000;color:' + JAUNE + ';' +
        "font-family:'Luckiest Guy',cursive;font-size:14px;letter-spacing:2px;padding:5px 14px 3px;" +
        'transform:rotate(-1.2deg);">SUITE DE LA FICHE</div>' +
      "<h3 style=\"margin:20px 0 12px;font-family:'Luckiest Guy',cursive;font-size:34px;line-height:1.1;color:" + NOIR + ';">' +
        'But du jeu, déroulement, matériel et variantes</h3>' +
      '<p style="margin:0 auto 26px;max-width:560px;font-size:17px;line-height:1.55;color:#24333d;">' +
        'Le reste de la fiche est réservé aux membres. L’inscription est gratuite et te donne ' +
        'accès à toutes les fiches de jeu, en ligne et en PDF.</p>' +
      '<a href="' + esc(o.signupUrl) + '" style="' +
        "font-family:'Luckiest Guy',cursive;letter-spacing:1px;border:3px solid #000;" +
        'box-shadow:4px 4px 0 #000;cursor:pointer;background:' + JAUNE + ';color:' + NOIR + ';' +
        'text-decoration:none;display:inline-block;font-size:18px;padding:12px 26px 10px;">' +
        'VOIR LA SUITE — INSCRIPTION GRATUITE ➜</a></div>';
  }

  /* ── Rendu ──────────────────────────────────────────────────────────── */

  /**
   * @param {object} fiche
   * @param {object} [options]
   *   mode      'editeur' | 'public' | 'membre'   (defaut 'public')
   *   signupUrl URL de la page d'inscription
   *   base      prefixe des assets (defaut '')
   */
  function rendre(fiche, options) {
    var f = fiche || vide();
    var o = options || {};
    o.base = o.base || '';
    o.signupUrl = o.signupUrl || 'https://zonetotalsport.ca/inscription';
    var mode = o.mode || 'public';
    var toutVoir = mode !== 'public';
    o.suiteHref = toutVoir ? '#' : o.signupUrl;

    // Les couleurs du titre alterne sont un style comme un autre, mais elles
    // se posent au RENDU (dans les <span>) et non par appliquerStyle() : on
    // les sort de `styles` ici plutot que de laisser chaque appelant y penser.
    var alt = altTitre(f);
    if (o.altA === undefined) o.altA = alt.a;
    if (o.altB === undefined) o.altB = alt.b;

    var html = page1(f, o);
    if (toutVoir) {
      html += page2(f, o) + pagesSections(f, o);
    } else {
      html += murInscription(o);
    }
    return '<div class="zts-fiche" style="' + S.conteneur + '">' + html + '</div>';
  }

  /** Fiche neuve, calquee sur la structure de la maquette d'origine. */
  function vide() {
    return {
      slug: '',
      titre: 'NOUVELLE FICHE',
      sousTitre: 'Sous-titre du jeu',
      badges: [
        { texte: '3e à 6e année', couleur: COULEURS_BADGE[0] },
        { texte: '20 à 30 élèves', couleur: COULEURS_BADGE[1] },
        { texte: '25 min', couleur: COULEURS_BADGE[2] },
        { texte: 'Gymnase', couleur: COULEURS_BADGE[3] }
      ],
      butDuJeu: 'Écris ici le but du jeu.',
      imagePrincipale: '',
      imagePage2: '',
      sections: [
        {
          titre: 'Déroulement', gabarit: 'pleine', orientation: 'portrait',
          explications: [
            { texte: '1. Écris ton explication ici.', imagePath: '' },
            { texte: '2. Écris ton explication ici.', imagePath: '' },
            { texte: '3. Écris ton explication ici.', imagePath: '' },
            { texte: '4. Écris ton explication ici.', imagePath: '' }
          ]
        },
        {
          titre: 'Matériel & préparation', gabarit: 'demi', orientation: 'portrait',
          explications: [
            { texte: 'Le matériel nécessaire.', imagePath: '' },
            { texte: 'La disposition du terrain.', imagePath: '' },
            { texte: 'La formation des équipes.', imagePath: '' }
          ]
        },
        {
          titre: 'Variantes', gabarit: 'demi', orientation: 'portrait',
          explications: [
            { texte: 'Première variante.', imagePath: '' },
            { texte: 'Deuxième variante.', imagePath: '' }
          ]
        }
      ],
      univers: 'eps',
      category: '',
      statut: 'brouillon'
    };
  }

  /** Section vierge, pour le bouton « + page » de l'editeur. */
  function sectionVide(orientation) {
    return {
      titre: 'Nouvelle section',
      gabarit: 'pleine',
      orientation: orientation === 'paysage' ? 'paysage' : 'portrait',
      explications: [
        { texte: 'Écris ton explication ici.', imagePath: '' },
        { texte: 'Écris ton explication ici.', imagePath: '' }
      ]
    };
  }

  global.ZTSFiche = {
    rendre: rendre,
    vide: vide,
    sectionVide: sectionVide,
    lire: lire,
    ecrire: ecrire,
    titreColore: titreColore,
    altTitre: altTitre,
    GABARITS: GABARITS,
    COULEURS_BADGE: COULEURS_BADGE
  };
})(window);
