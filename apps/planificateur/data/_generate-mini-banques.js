#!/usr/bin/env node
/* ============================================================
   GÉNÉRATEUR DE LA MINI-BANQUE  (_generate-mini-banques.js)

   Produit `mini-banques.json` à partir des applications « fiche unique »
   du dépôt. Déterministe et relançable : même entrée → même sortie.

   POURQUOI UN GÉNÉRATEUR ET PAS UN FICHIER ÉCRIT À LA MAIN
   ──────────────────────────────────────────────────────────
   Les activités vivent déjà dans les apps (`apps/<app>/index.html`, tableau
   `GAMES`/`SONGS`/`SLOTS` inline). Les recopier à la main, c'est créer une
   seconde vérité qui divergera. Ici la source reste l'app ; la banque est
   dérivée. Une correction dans l'app se propage en relançant :

       node apps/planificateur/data/_generate-mini-banques.js

   VOCABULAIRE : GELÉ, PAS INVENTÉ
   ──────────────────────────────────────────────────────────
   Les valeurs de tags viennent du vocabulaire arrêté avec Joey
   (voir MINI-BANQUES-SCHEMA.md). Ce script n'invente aucune valeur : quand
   une source ne porte pas l'information, le tag est ABSENT plutôt que
   deviné. Un tag absent laisse passer tous les filtres — le tiroir applique
   « inconnu = matche tout », donc on ne cache jamais de contenu. Un tag
   inventé, lui, ment silencieusement.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RACINE = path.resolve(__dirname, '../../..');
const SORTIE = path.join(__dirname, 'mini-banques.json');
const CATALOGUE = path.join(RACINE, '_data/jeux-merged.json');
const RAPPORT_DOUBLONS = path.join(__dirname, '_doublons-sdg.md');

/* ═══════════════ Lecture des apps sources ═══════════════
   Les données sont inline dans le HTML. On isole le tableau par comptage
   de crochets (pas de regex gourmande : les chaînes contiennent des `]`),
   puis on l'évalue dans un bac à sable — c'est du littéral JS, pas du JSON
   (clés non quotées, apostrophes échappées). */
function lireSource(app) {
  const p = path.join(RACINE, 'apps', app, 'index.html');
  const t = fs.readFileSync(p, 'utf8');
  const m = /(?:const|let|var)\s+(GAMES|SONGS|SLOTS|MODELS)\s*=\s*\[/.exec(t);
  if (!m) throw new Error(`${app} : aucun tableau de données trouvé`);
  let i = m.index + m[0].length - 1, prof = 0, fin = -1;
  for (let j = i; j < t.length; j++) {
    if (t[j] === '[') prof++;
    else if (t[j] === ']' && --prof === 0) { fin = j; break; }
  }
  if (fin < 0) throw new Error(`${app} : tableau non refermé`);
  return vm.runInNewContext('(' + t.slice(i, fin + 1) + ')');
}

/* ═══════════════ Utilitaires ═══════════════ */

const kebab = s => String(s).toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

// '5-6' → [5,6]. Le vocabulaire gelé stocke des NOMBRES : le cycle scolaire
// est rendu à l'affichage, il n'est pas stocké (8 ans = 1er ou 2e cycle
// selon le mois de naissance — dériver dans ce sens perdrait de l'info).
function bornesAge(tag) {
  const m = /^(\d+)\s*-\s*(\d+)$/.exec(String(tag || '').trim());
  return m ? [+m[1], +m[2]] : [null, null];
}

// Ne pose une clé que si la valeur existe : un tag absent vaut mieux qu'un
// tag deviné (voir en-tête).
function poser(obj, cle, val) {
  if (val === null || val === undefined || val === '') return;
  if (Array.isArray(val) && !val.length) return;
  obj[cle] = val;
}

function fiche({ src, id, titre, titreEn, but, butEn, etapes, etapesEn,
                 materiel, materielEn, icon, univers, tags, dureeMin, ageMin, ageMax }) {
  const slug = `mb-${src}-${kebab(titre)}`;
  const f = {
    id: slug, slug,
    title: titre, titleEn: titreEn || titre,
    but: but || '', butEn: butEn || but || '',
    deroulement: etapes || [], deroulementEn: etapesEn || [],
    materiel: materiel || [], materielEn: materielEn || [],
    icon: icon || '🎯',
    univers, tags, source: src,
  };
  poser(f, 'ageMin', ageMin);
  poser(f, 'ageMax', ageMax);
  poser(f, 'dureeMin', dureeMin);
  return f;
}

/* ═══════════════ MAPPINGS — une entrée par app source ═══════════════

   Chaque app porte ses propres dimensions natives. Le mapping les traduit
   vers le vocabulaire gelé. Tout ce qui ne se traduit pas proprement part
   dans `aArbitrer` : on ne force pas une valeur dans une case qui ne lui
   va pas. */

const aArbitrer = [];
function arbitrer(app, champ, valeur, note) {
  aArbitrer.push({ app, champ, valeur, note });
}

const SDG = {
  /* jeux-calmes — `mom` (transition/fin/sieste) + `age`.
     `energie: calme` est posé : c'est le sujet même de l'app, pas une
     déduction. */
  'jeux-calmes': (e) => {
    const [a1, a2] = bornesAge(e.age);
    const MOMENT = { transition: 'transition', fin: 'fin-de-journee', sieste: 'sieste' };
    const tags = { type: 'jeu-calme', espace: 'interieur', energie: 'calme', materiel: 'aucun' };
    poser(tags, 'moment', MOMENT[e.mom]);
    if (e.mom && !MOMENT[e.mom]) arbitrer('jeux-calmes', 'mom', e.mom, 'hors vocabulaire moment SDG');
    poser(tags, 'age', null);
    return { tags, ageMin: a1, ageMax: a2 };
  },

  /* plan-b-pluie — `esp` (local/gym/couloir) + `age`.
     `meteo: pluie` au sens « CONÇU POUR », pas « compatible avec » : c'est
     la raison d'être de l'app. Sans cette règle le tag finirait sur toutes
     les fiches d'intérieur et ne filtrerait plus rien. */
  'plan-b-pluie': (e) => {
    const [a1, a2] = bornesAge(e.age);
    const LIEU = { local: 'local', gym: 'gym', couloir: 'couloir' };
    const tags = { type: 'plan-b', espace: 'interieur', meteo: 'pluie' };
    poser(tags, 'lieu', LIEU[e.esp]);
    if (e.esp && !LIEU[e.esp]) arbitrer('plan-b-pluie', 'esp', e.esp, 'hors vocabulaire lieu');
    return { tags, ageMin: a1, ageMax: a2 };
  },

  /* sos-conflits — `type` natif (partage/mots/exclusion/bagarre).
     ⚠ Ce `type` natif décrit la NATURE DU CONFLIT, pas la famille
     d'activité. Le mettre dans `type` mélangerait deux natures — l'erreur
     que l'éclatement de `theme` vient justement de corriger. Il part donc
     à l'arbitrage : il porte une vraie information, mais il lui faut sa
     propre dimension, et je n'en invente pas une. */
  'sos-conflits': (e) => {
    const [a1, a2] = bornesAge(e.age);
    if (e.type) arbitrer('sos-conflits', 'type (natif)', e.type,
      'nature du conflit — mérite sa propre dimension, pas le champ `type`');
    return { tags: { type: 'intervention', espace: 'partout', energie: 'calme' }, ageMin: a1, ageMax: a2 };
  },

  /* bricolages — `mat` (recup/papier/nature/dessin) + `gear` (texte) + `age`.
     `mat` dit de QUOI on a besoin → `materiel: specifique`, et la règle du
     vocabulaire impose alors que `materiel[]` soit rempli : `gear` le
     fournit. Un `specifique` sans liste annoncerait du matériel sans dire
     lequel. */
  bricolages: (e) => {
    const [a1, a2] = bornesAge(e.age);
    const tags = { type: 'bricolage', espace: 'interieur', energie: 'calme', materiel: 'specifique' };
    poser(tags, 'matiere', null);
    if (e.mat) arbitrer('bricolages', 'mat', e.mat,
      'matière du bricolage (recup/papier/nature/dessin) — pas de dimension au vocabulaire');
    return {
      tags, ageMin: a1, ageMax: a2,
      materiel: e.gear && e.gear.fr ? [e.gear.fr] : [],
      materielEn: e.gear && e.gear.en ? [e.gear.en] : [],
    };
  },

  /* jeux-rapides — `dur` (minutes, nombre) + `age`.
     `dur` est DÉJÀ un nombre de minutes : il alimente `dureeMin` sans
     conversion ni estimation.
     `energie` n'est PAS posé : « rapide » parle de durée, pas d'intensité. */
  'jeux-rapides': (e) => {
    const [a1, a2] = bornesAge(e.age);
    return {
      tags: { type: 'jeu-rapide', espace: 'partout', materiel: 'aucun' },
      ageMin: a1, ageMax: a2,
      dureeMin: typeof e.dur === 'number' ? e.dur : (parseInt(e.dur, 10) || null),
    };
  },

  /* activites-duree — `dur` ('15'/'30'/'60') + `lieu` (int/ext).
     Pas de tag `age` dans cette app : on n'en invente pas. */
  'activites-duree': (e) => {
    const ESPACE = { int: 'interieur', ext: 'exterieur' };
    const tags = { type: 'activite-duree', materiel: 'aucun' };
    poser(tags, 'espace', ESPACE[e.lieu]);
    if (e.lieu && !ESPACE[e.lieu]) arbitrer('activites-duree', 'lieu', e.lieu, 'hors vocabulaire espace');
    return { tags, ageMin: null, ageMax: null, dureeMin: parseInt(e.dur, 10) || null };
  },
};

/* ═══════════════ Construction des fiches SDG ═══════════════ */

function construireSDG() {
  const out = [];
  for (const [app, mapper] of Object.entries(SDG)) {
    for (const e of lireSource(app)) {
      const m = mapper(e);
      out.push(fiche({
        src: app,
        titre: e.fr.n, titreEn: e.en && e.en.n,
        but: e.fr.d, butEn: e.en && e.en.d,
        etapes: e.fr.steps || [], etapesEn: (e.en && e.en.steps) || [],
        materiel: m.materiel, materielEn: m.materielEn,
        icon: e.icon,
        univers: ['sdg'],
        tags: m.tags,
        ageMin: m.ageMin, ageMax: m.ageMax,
        dureeMin: m.dureeMin,
      }));
      // Conseil d'intervention (sos-conflits) : phrase à dire à l'enfant.
      // Aucun champ du schéma ne l'accueille — on ne le perd pas en silence.
      if (e.fr.say) arbitrer('sos-conflits', 'say', String(e.fr.say).slice(0, 46) + '…',
        'phrase-clé à dire — aucun champ du schéma ne la porte');
    }
  }
  return out;
}


/* ═══════════════ MAPPINGS ÉPS ═══════════════
   Six apps, trois formes de contenu différentes — `steps` classique,
   `q`/`a` pour les énigmes, `ly`/`gest` pour les comptines. Le mapping
   normalise sans déformer, et signale ce qui ne rentre pas.

   `pfeq` et `niveau` : AUCUNE de ces six sources ne les porte. On ne les
   invente donc pas — le mandat disait « quand la source les donne ». Les
   fiches ÉPS sortent avec `ageMin`/`ageMax` seulement. */

const EPS = {
  /* echauffements — `zone` (global/cardio/haut/bas) + `age`.
     `zone` est le tag propre à l'ÉPS du vocabulaire gelé : il passe tel quel.
     `fonction: echauffement` est posé — c'est le sujet même de l'app, au même
     titre que `energie: calme` pour les jeux calmes. */
  echauffements: (e) => {
    const [a1, a2] = bornesAge(e.age);
    const ZONE = { global: 'global', cardio: 'cardio', haut: 'haut', bas: 'bas' };
    const tags = { type: 'echauffement', espace: 'partout', materiel: 'aucun', fonction: 'echauffement' };
    poser(tags, 'zone', ZONE[e.zone]);
    if (e.zone && !ZONE[e.zone]) arbitrer('echauffements', 'zone', e.zone, 'hors vocabulaire zone ÉPS');
    return { tags, ageMin: a1, ageMax: a2 };
  },

  /* enigmes — `type` natif (devinette/logique/charade) + `age`.
     ⚠ FORME PARTICULIÈRE : ni `d` ni `steps`, mais `q` (question) et `a`
     (réponse). Le schéma n'a pas de champ pour ce couple. On place la
     question dans `but` — c'est ce qu'un enseignant doit lire pour choisir —
     et la réponse dans `deroulement`. Signalé à l'arbitrage : ce n'est pas
     l'usage prévu de ces deux champs. */
  enigmes: (e) => {
    const [a1, a2] = bornesAge(e.age);
    if (e.type) arbitrer('enigmes', 'type (natif)', e.type,
      'nature de l\'énigme (devinette/logique/charade) — pas de dimension au vocabulaire');
    arbitrer('enigmes', 'q + a', '(question et réponse)',
      'le schéma n\'a pas de champ question/réponse : q → `but`, a → `deroulement`');
    return {
      tags: { type: 'enigme', espace: 'partout', materiel: 'aucun', energie: 'calme' },
      ageMin: a1, ageMax: a2,
      but: e.fr.q, butEn: e.en && e.en.q,
      etapes: e.fr.a ? [e.fr.a] : [], etapesEn: (e.en && e.en.a) ? [e.en.a] : [],
    };
  },

  /* comptines — `usage` (rassemblement/mouvement/retour) + `age`.
     ⚠ FORME PARTICULIÈRE : `ly` (paroles) et `gest` (geste), pas de `d` ni
     `steps`. On suit le précédent des chansons de camp : les paroles vont
     dans `deroulement`, en un seul bloc avec leurs sauts de ligne. `gest`
     décrit ce que le groupe fait — il tient lieu de `but`. */
  comptines: (e) => {
    const [a1, a2] = bornesAge(e.age);
    const FONCTION = { rassemblement: 'ralliement', retour: 'retour-au-calme' };
    const tags = { type: 'comptine', espace: 'partout', materiel: 'aucun' };
    poser(tags, 'fonction', FONCTION[e.usage]);
    if (e.usage && !FONCTION[e.usage]) arbitrer('comptines', 'usage', e.usage,
      'hors vocabulaire fonction (echauffement/ralliement/retour-au-calme/transition)');
    return {
      tags, ageMin: a1, ageMax: a2,
      but: e.fr.gest, butEn: e.en && e.en.gest,
      etapes: e.fr.ly ? [e.fr.ly] : [], etapesEn: (e.en && e.en.ly) ? [e.en.ly] : [],
    };
  },

  /* intervention-groupe — `cat` (sos/inclusif). Pas de tag d'âge.
     Même `say` que sos-conflits : phrase-clé à dire, sans champ d'accueil. */
  'intervention-groupe': (e) => {
    if (e.cat) arbitrer('intervention-groupe', 'cat', e.cat,
      'sos vs inclusif — deux natures d\'intervention, pas de dimension au vocabulaire');
    if (e.fr.say) arbitrer('intervention-groupe', 'say', String(e.fr.say).slice(0, 46) + '…',
      'phrase-clé à dire — aucun champ du schéma ne la porte');
    return { tags: { type: 'intervention', espace: 'partout', materiel: 'aucun' }, ageMin: null, ageMax: null };
  },

  /* olympiades-scolaires — `type` (course/saut/lancer/relais) + `format`
     (individuel/equipe). Pas de tag d'âge. `note` porte le barème de points. */
  'olympiades-scolaires': (e) => {
    if (e.type) arbitrer('olympiades-scolaires', 'type (natif)', e.type,
      'famille d\'épreuve (course/saut/lancer/relais) — le champ `type` porte déjà « olympiade »');
    if (e.format) arbitrer('olympiades-scolaires', 'format', e.format,
      'individuel vs équipe — dimension distincte de `groupe` (petit/grand/tous)');
    if (e.fr.note) arbitrer('olympiades-scolaires', 'note', String(e.fr.note).slice(0, 46) + '…',
      'barème de pointage — aucun champ du schéma ne le porte');
    return { tags: { type: 'olympiade', espace: 'exterieur', materiel: 'leger' }, ageMin: null, ageMax: null };
  },

  /* plan-b-meteo — `meteo` (pluie/canicule/froid/vent) + `lieu`
     (ext/gym/classe). Les deux entrent dans le vocabulaire gelé sans forcer :
     `meteo` au sens « CONÇU POUR », qui est bien la raison d'être de l'app. */
  'plan-b-meteo': (e) => {
    const METEO = { pluie: 'pluie', canicule: 'canicule', froid: 'froid', vent: 'vent' };
    const LIEU = { gym: { espace: 'interieur', lieu: 'gym' }, classe: { espace: 'interieur', lieu: 'classe' }, ext: { espace: 'exterieur' } };
    const tags = { type: 'plan-b', materiel: 'aucun' };
    poser(tags, 'meteo', METEO[e.meteo]);
    if (e.meteo && !METEO[e.meteo]) arbitrer('plan-b-meteo', 'meteo', e.meteo, 'hors vocabulaire meteo');
    const l = LIEU[e.lieu];
    if (l) { poser(tags, 'espace', l.espace); poser(tags, 'lieu', l.lieu); }
    else if (e.lieu) arbitrer('plan-b-meteo', 'lieu', e.lieu, 'hors vocabulaire espace/lieu');
    return { tags, ageMin: null, ageMax: null };
  },
};

function construireEPS() {
  const out = [];
  for (const [app, mapper] of Object.entries(EPS)) {
    for (const e of lireSource(app)) {
      const m = mapper(e);
      out.push(fiche({
        src: app,
        titre: e.fr.n, titreEn: e.en && e.en.n,
        but: m.but !== undefined ? m.but : e.fr.d,
        butEn: m.butEn !== undefined ? m.butEn : (e.en && e.en.d),
        etapes: m.etapes !== undefined ? m.etapes : (e.fr.steps || []),
        etapesEn: m.etapesEn !== undefined ? m.etapesEn : ((e.en && e.en.steps) || []),
        materiel: m.materiel, materielEn: m.materielEn,
        icon: e.icon,
        univers: ['eps'],
        tags: m.tags,
        ageMin: m.ageMin, ageMax: m.ageMax,
        dureeMin: m.dureeMin,
      }));
    }
  }
  return out;
}

/* ═══════════════ Migration des 61 camps ═══════════════

   Même schéma pour toute la banque : « une banque, un schéma, pas deux
   générations ». Ce qui change :
   - `tags.age` ('5-7') → `ageMin`/`ageMax` en nombres ;
   - `duree` ('~45 min') → `dureeMin` quand c'est une CONVERSION de format ;
     les valeurs qualitatives ('long', 'moyen') et les fiches sans durée
     sont laissées VIDES — ce sont des estimations, elles attendent la
     révision de Joey (mandat E3) ;
   - `energie` : 'haute' → 'actif', 'moyenne' → 'modere' (échelle unique) ;
   - `moment` : les créneaux de grille ('bloc-matin-1'…) SORTENT des fiches.
     Le créneau est une propriété du placement dans le Planificateur, pas de
     l'activité ;
   - `moment: 'canicule'` → `meteo: 'canicule'` : une condition météo n'est
     pas un moment de journée ;
   - `theme` éclaté : les univers narratifs restent dans `theme`, les
     fonctions passent dans `fonction`. */

const ENERGIE = { haute: 'actif', actif: 'actif', moyenne: 'modere', calme: 'calme' };
const LIEU_DEPUIS_ESPACE = {
  boise:   { espace: 'exterieur', lieu: 'boise' },
  terrain: { espace: 'exterieur', lieu: 'terrain' },
};
const MOMENT_CAMPS = ['accueil', 'rassemblement', 'diner', 'soir', 'depart'];
const CRENEAUX = /^bloc-(matin|apres-midi)-\d$/;
const THEME_NARRATIF = ['pirates', 'jungle', 'espace', 'medieval', 'eau'];
const THEME_FONCTION = { echauffement: 'echauffement', ralliement: 'ralliement', veillee: null, jeu: null };
// '~45 min' → 45. Conversion de format, pas estimation.
const minutesDepuisTexte = s => { const m = /(\d+)\s*min/.exec(String(s || '')); return m ? +m[1] : null; };

function migrerCamps(anciennes) {
  const estimations = [];
  const out = anciennes.map(e => {
    const t = e.tags || {};
    // Déjà au nouveau schéma (relance) : on ne retouche pas, on recense
    // seulement ce qui attend encore une durée.
    if (e.ageMin !== undefined || e.dureeMin !== undefined || !('duree' in e)) {
      if (e.dureeMin === undefined) estimations.push({ id: e.slug, titre: e.title, type: t.type, ancien: '' });
      return e;
    }
    const [a1, a2] = bornesAge(t.age);
    const tags = {};
    poser(tags, 'type', t.type);
    // `espace` camps mélangeait le filtre grossier (interieur/exterieur/partout)
    // et le lieu précis (boise/terrain). Le vocabulaire les sépare en deux
    // niveaux : on remonte le lieu dans son champ et on pose l'espace qui va
    // avec — un bois et un terrain sont dehors.
    if (LIEU_DEPUIS_ESPACE[t.espace]) {
      poser(tags, 'espace', LIEU_DEPUIS_ESPACE[t.espace].espace);
      poser(tags, 'lieu', LIEU_DEPUIS_ESPACE[t.espace].lieu);
    } else poser(tags, 'espace', t.espace);
    poser(tags, 'groupe', t.groupe);
    poser(tags, 'materiel', t.materiel);
    poser(tags, 'energie', ENERGIE[t.energie]);
    if (t.energie && !ENERGIE[t.energie]) arbitrer('camps', 'energie', t.energie, 'hors échelle calme/modere/actif');

    // moment : on garde les vrais moments, on écarte les créneaux de grille,
    // on déplace la météo.
    if (t.moment === 'canicule') poser(tags, 'meteo', 'canicule');
    else if (MOMENT_CAMPS.includes(t.moment)) poser(tags, 'moment', t.moment);
    else if (t.moment && CRENEAUX.test(t.moment)) { /* propriété du placement, pas de la fiche */ }
    else if (t.moment) arbitrer('camps', 'moment', t.moment, 'ni moment, ni créneau, ni météo');

    // theme éclaté en theme (narratif) / fonction (effet recherché)
    if (t.theme) {
      if (THEME_NARRATIF.includes(t.theme)) poser(tags, 'theme', t.theme);
      else if (t.theme in THEME_FONCTION) {
        if (THEME_FONCTION[t.theme]) poser(tags, 'fonction', THEME_FONCTION[t.theme]);
        else arbitrer('camps', 'theme', t.theme, 'ni univers narratif, ni fonction du vocabulaire');
      } else arbitrer('camps', 'theme', t.theme, 'hors vocabulaire theme/fonction');
    }

    const conv = minutesDepuisTexte(e.duree);
    if (!conv && e.duree) estimations.push({ id: e.slug, titre: e.title, type: t.type, ancien: e.duree });
    else if (!conv) estimations.push({ id: e.slug, titre: e.title, type: t.type, ancien: '' });

    const f = {
      id: e.id, slug: e.slug,
      title: e.title, titleEn: e.titleEn,
      but: e.but, butEn: e.butEn,
      deroulement: e.deroulement, deroulementEn: e.deroulementEn,
      materiel: e.materiel, materielEn: e.materielEn,
      icon: e.icon,
      // journee-pedago décrit une journée de service de garde : ses 19 fiches
      // servent les deux univers. Le champ est un tableau — c'était prévu.
      univers: e.source === 'journee-pedago' ? ['camps', 'sdg'] : e.univers,
      tags, source: e.source,
    };
    poser(f, 'ageMin', a1); poser(f, 'ageMax', a2);
    poser(f, 'dureeMin', conv);
    return f;
  });
  return { out, estimations };
}

/* ═══════════════ Doublons vs le catalogue 1439 ═══════════════
   Mêmes règles que la passe camps (voir DOUBLONS-EXTRACTION.md) : on
   n'ajoute pas une activité dont le titre existe déjà au catalogue. */

const norm = s => String(s).toLowerCase().normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

function ratio(a, b) {                       // Sørensen–Dice sur bigrammes
  if (a === b) return 1;
  const bg = s => { const o = []; for (let i = 0; i < s.length - 1; i++) o.push(s.slice(i, i + 2)); return o; };
  const A = bg(a), B = bg(b);
  if (!A.length || !B.length) return 0;
  const pool = B.slice(); let n = 0;
  for (const g of A) { const i = pool.indexOf(g); if (i > -1) { pool.splice(i, 1); n++; } }
  return (2 * n) / (A.length + B.length);
}

function detecterDoublons(fiches) {
  let cat;
  try { cat = JSON.parse(fs.readFileSync(CATALOGUE, 'utf8')); }
  catch { console.warn('  ⚠ catalogue illisible — détection de doublons ignorée'); return { gardees: fiches, doublons: [] }; }
  const jeux = (Array.isArray(cat) ? cat : cat.jeux || []).map(j => ({ id: j.id, titre: j.title || j.titre || '', n: norm(j.title || j.titre || '') }));
  const doublons = [], gardees = [];
  for (const f of fiches) {
    const n = norm(f.title);
    let best = null;
    for (const j of jeux) {
      if (!j.n) continue;
      const r = ratio(n, j.n);
      const motCommun = n.split(' ').some(w => w.length >= 4 && j.n.split(' ').includes(w));
      const inclus = n.length >= 10 && j.n.length >= 10 && (n.includes(j.n) || j.n.includes(n));
      if (r >= 0.90 || (r >= 0.84 && motCommun) || inclus) {
        if (!best || r > best.r) best = { r, id: j.id, titre: j.titre };
      }
    }
    if (best) doublons.push({ fiche: f.title, source: f.source, ...best });
    else gardees.push(f);
  }
  return { gardees, doublons };
}

/* ═══════════════ Exécution ═══════════════ */

/* Source des fiches camps : la banque déjà migrée si elle existe, sinon le
   fichier d'origine (première passe seulement).
   ──────────────────────────────────────────────────────────────────
   Sans ça, le générateur dépendrait du fichier qu'il remplace et ne pourrait
   tourner qu'une fois. `migrerCamps` est idempotent — une fiche déjà au
   nouveau schéma en ressort inchangée — donc relancer est sans effet de bord.
   L'extraction camps comportait des choix manuels (3 grands-jeux retenus sur 8,
   doublons écartés) qu'aucun script ne peut redécouvrir : ces 61 fiches sont
   une donnée, pas un dérivé. */
function chargerCamps() {
  const migre = path.join(__dirname, 'mini-banques.json');
  if (fs.existsSync(migre)) {
    const b = JSON.parse(fs.readFileSync(migre, 'utf8'));
    return { fiches: b.filter(e => (e.univers || []).includes('camps')), origine: 'mini-banques.json' };
  }
  const brut = path.join(__dirname, 'mini-banques-camp.json');
  if (fs.existsSync(brut)) return { fiches: JSON.parse(fs.readFileSync(brut, 'utf8')), origine: 'mini-banques-camp.json (1re passe)' };
  throw new Error('aucune banque camps trouvée');
}

function main() {
  const { fiches: anciennes, origine } = chargerCamps();
  console.log(`Camps existantes : ${anciennes.length}  (${origine})`);

  const { out: camps, estimations } = migrerCamps(anciennes);
  console.log(`Camps migrées    : ${camps.length}`);

  /* SDG : déjà extraites lors de la passe précédente. On les relit de la
     banque plutôt que de les reconstruire — leurs doublons ont été écartés
     une fois, et rejouer la détection donnerait le même résultat pour un
     coût inutile. Absentes (1re passe) → on extrait. */
  const dejaLa = fs.existsSync(path.join(__dirname, 'mini-banques.json'))
    ? JSON.parse(fs.readFileSync(path.join(__dirname, 'mini-banques.json'), 'utf8'))
    : [];
  const sdgDejaLa = dejaLa.filter(e => (e.univers || []).includes('sdg') && !(e.univers || []).includes('camps'));
  let sdg, doublons = [];
  if (sdgDejaLa.length) {
    sdg = sdgDejaLa;
    console.log(`SDG (déjà en banque) : ${sdg.length}`);
  } else {
    const sdgBrut = construireSDG();
    console.log(`SDG extraites    : ${sdgBrut.length}`);
    const r = detecterDoublons(sdgBrut);
    sdg = r.gardees; doublons = r.doublons;
    console.log(`SDG gardées      : ${sdg.length}  (${doublons.length} doublon(s) écarté(s))`);
  }

  const epsDejaLa = dejaLa.filter(e => (e.univers || []).includes('eps'));
  let eps, doublonsEps = [];
  if (epsDejaLa.length) {
    eps = epsDejaLa;
    console.log(`ÉPS (déjà en banque) : ${eps.length}`);
  } else {
    const epsBrut = construireEPS();
    console.log(`ÉPS extraites    : ${epsBrut.length}`);
    const r = detecterDoublons(epsBrut);
    eps = r.gardees; doublonsEps = r.doublons;
    console.log(`ÉPS gardées      : ${eps.length}  (${doublonsEps.length} doublon(s) écarté(s))`);
  }

  const banque = [...camps, ...sdg, ...eps].sort((a, b) => a.slug.localeCompare(b.slug, 'fr'));
  fs.writeFileSync(SORTIE, JSON.stringify(banque, null, 2) + '\n', 'utf8');
  console.log(`\n→ ${path.relative(RACINE, SORTIE)} : ${banque.length} fiches`);

  const parUnivers = {};
  for (const f of banque) for (const u of f.univers) parUnivers[u] = (parUnivers[u] || 0) + 1;
  console.log('  par univers :', parUnivers);

  // Rapport de doublons, même forme que DOUBLONS-EXTRACTION.md
  /* Le rapport de doublons est une TRACE : il documente ce qui a été écarté et
     pourquoi. Une relance qui ne redétecte rien (tout est déjà en banque) ne
     doit pas l'effacer — sinon la trace disparaît au premier `node` de
     confort. On ne réécrit que si cette passe a réellement détecté. */
  const tousDoublons = [...doublons, ...doublonsEps];
  if (!tousDoublons.length && fs.existsSync(RAPPORT_DOUBLONS)) {
    console.log('  rapport de doublons : inchangé (aucune détection cette passe)');
  } else {
  let md = '# DOUBLONS D\'EXTRACTION — SDG et ÉPS vs catalogue 1439\n\n';
  md += '> Généré par `_generate-mini-banques.js`. Activités NON ajoutées car un jeu\n';
  md += '> au titre fortement similaire existe déjà dans `_data/jeux-merged.json`.\n';
  md += '> Mêmes règles que la passe camps.\n\n';
  if (!tousDoublons.length) md += 'Aucun doublon détecté lors de cette passe (déjà écartés en banque).\n';
  else {
    md += '| Activité écartée | Source | ≈ Jeu du catalogue | id catalogue | similarité |\n|---|---|---|---|---|\n';
    for (const d of tousDoublons) md += `| ${d.fiche} | ${d.source} | ${d.titre} | \`${d.id}\` | ${d.r.toFixed(2)} |\n`;
  }
  fs.writeFileSync(RAPPORT_DOUBLONS, md, 'utf8');
  }

  // Sorties de travail (non committées) : à arbitrer + estimations E3
  fs.writeFileSync(path.join(__dirname, '_a-arbitrer.json'), JSON.stringify(aArbitrer, null, 2), 'utf8');
  fs.writeFileSync(path.join(__dirname, '_estimations-duree.json'), JSON.stringify(estimations, null, 2), 'utf8');
  console.log(`  à arbitrer : ${aArbitrer.length} · estimations de durée à réviser : ${estimations.length}`);
}

main();
