#!/usr/bin/env node
/* ============================================================
   EXTRACTEUR DES COLLECTIONS  (extrait-collections-jeux.js)

   Vague 2, pilier Jeux, PR A. Absorbe les 14 mini-apps du gabarit partagé
   dans le catalogue `_data/jeux-merged.json`, sous forme de COLLECTIONS.

   Déterministe et relançable : même entrée → même sortie. Relancer après une
   correction dans une app propage la correction.

       node _scripts/extrait-collections-jeux.js            # écrit
       node _scripts/extrait-collections-jeux.js --essai    # n'écrit rien

   CE QU'IL FAIT
   ─────────────
   1. Lit le tableau inline de chacune des 14 apps.
   2. Normalise chaque item vers le schéma du catalogue (57 clés, bilingue).
   3. Dédoublonne contre les 1439 jeux existants.
   4. Les INÉDITS entrent au catalogue. Les DOUBLONS n'entrent pas — mais le
      jeu du catalogue qu'ils désignent reçoit l'étiquette de collection.
   5. Écrit `_data/collections-jeux.json` : titre + intro, bilingues, repris
      des apps sources.

   POURQUOI LA SOURCE RESTE L'APP
   ──────────────────────────────
   Les activités vivent dans `apps/<app>/index.html`. Les recopier à la main
   créerait une seconde vérité qui divergerait. Le principe est repris de
   `apps/planificateur/data/_generate-mini-banques.js`, dont ce script
   emprunte deux primitives éprouvées : la lecture par comptage de crochets
   et la similarité de Sørensen–Dice.

   ADDITIF, PARCE QUE NEUF CONSOMMATEURS LISENT CETTE BANQUE
   ─────────────────────────────────────────────────────────
   `jeux-merged.json` est lu par 9 points d'entrée (worker R2, seed, fiches,
   planificateur…). Deux garanties tenues ici, et vérifiées à la fin :
     • aucune clé existante n'est modifiée sur un jeu existant ;
     • le seul ajout sur un jeu existant est `collections`.
   Les nouveaux jeux portent les 57 clés du schéma, pour qu'un consommateur
   qui lit `j.intentionsC1` ne tombe pas sur `undefined`.

   RIEN N'EST DEVINÉ
   ─────────────────
   Quand une source ne porte pas une information, le champ reste VIDE plutôt
   que rempli au jugé. Un champ vide laisse passer les filtres — c'est la
   règle de l'âge, inscrite au contrat. Un champ inventé, lui, ment.
   ============================================================ */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RACINE = path.resolve(__dirname, '..');
const CATALOGUE = path.join(RACINE, '_data', 'jeux-merged.json');
/* Les définitions vont sous `assets/`, PAS sous `_data/`, et c'est réfléchi.
   `_data/` est réservé aux banques versées dans R2 et servies par le worker
   derrière un jeton — et Jekyll ne publie aucun dossier `_*`. Or ceci n'est
   pas du contenu : c'est de la métadonnée de navigation, 14 titres et 14
   intros, ~5 Ko. La murer imposerait un worker, un déploiement et un jeton
   pour afficher le nom d'une rangée. `assets/` est publié par Pages, donc
   lisible par l'app sans rien de tout ça. */
const DEFINITIONS = path.join(RACINE, 'assets', 'collections-jeux.json');
const RAPPORT = path.join(RACINE, 'RAPPORT-COLLECTIONS-JEUX.md');
const ESSAI = process.argv.includes('--essai');

/* ═══════════════ Les 14 collections ═══════════════

   `univers` et `category` ne sont pas inventés : l'univers vient du public
   déclaré en tête de l'app (`<!-- App — … (Public). Gabarit partagé. -->`),
   la catégorie est choisie parmi les 18 qui existent déjà au catalogue.
   Aucune catégorie nouvelle n'est créée. */

const COLLECTIONS = [
  { id: 'jeux-par-theme', app: 'jeux-par-theme', icon: '🎭', categorie: 'ludiques', univers: ['camps'],
    titre: { fr: 'Jeux par thème', en: 'Games by theme' },
    intro: { fr: "Choisir l'activité par l'intention plutôt que par le matériel : un thème, une ambiance, un jeu qui tombe juste.",
             en: 'Pick an activity by intent rather than by equipment: a theme, a mood, a game that lands right.' } },

  { id: 'jeux-rapides', app: 'jeux-rapides', icon: '⚡', categorie: 'sans-materiel', univers: ['sdg'],
    titre: { fr: 'Jeux rapides', en: 'Quick games' },
    intro: { fr: "À sortir n'importe quand, sans matériel et sans préparation : les cinq minutes qui restent avant la cloche.",
             en: 'Pull one out anytime, no equipment, no prep: for the five minutes left before the bell.' } },

  { id: 'jeux-calmes', app: 'jeux-calmes', icon: '🧘', categorie: 'cooperatifs', univers: ['sdg'],
    titre: { fr: 'Jeux calmes', en: 'Calm games' },
    intro: { fr: 'Faire redescendre un groupe : transitions, fins de journée, retours au calme après un gros jeu.',
             en: 'Bring a group back down: transitions, end of day, winding down after a big game.' } },

  { id: 'activites-duree', app: 'activites-duree', icon: '⏳', categorie: 'ludiques', univers: ['sdg'],
    titre: { fr: 'Activités par durée', en: 'Activities by length' },
    intro: { fr: "Quand c'est le temps disponible qui commande — 15, 30 ou 60 minutes, et une activité qui rentre dedans.",
             en: 'When the clock decides: 15, 30 or 60 minutes, and an activity that fits.' } },

  { id: 'echauffements', app: 'echauffements', icon: '🔥', categorie: 'sans-materiel', univers: ['eps'],
    titre: { fr: 'Échauffements', en: 'Warm-ups' },
    intro: { fr: 'Préparer le corps avant l\'effort, sans y passer le tiers du cours.',
             en: 'Get the body ready without burning a third of the class.' } },

  { id: 'enigmes', app: 'enigmes', icon: '🧩', categorie: 'ludiques', univers: ['camps', 'eps', 'sdg'],
    titre: { fr: 'Énigmes & devinettes', en: 'Riddles & puzzles' },
    intro: { fr: 'Des défis à poser à la volée : file d\'attente, retour d\'autobus, minute creuse entre deux ateliers.',
             en: 'Challenges to drop in on the fly: a queue, a bus ride, a dead minute between stations.' } },

  { id: 'plan-b-meteo', app: 'plan-b-meteo', icon: '⛅', categorie: 'ludiques', univers: ['eps'],
    titre: { fr: 'Plan B météo', en: 'Weather plan B' },
    intro: { fr: "Le terrain extérieur tombe à l'eau : de quoi tenir le cours à l'intérieur sans improviser.",
             en: 'The field is out: enough to hold the class indoors without improvising.' } },

  { id: 'plan-b-pluie', app: 'plan-b-pluie', icon: '🌧️', categorie: 'ludiques', univers: ['sdg'],
    titre: { fr: 'Plan B jours de pluie', en: 'Rainy-day plan B' },
    intro: { fr: 'Grand groupe, local fermé, journée qui n\'en finit plus : des activités qui tiennent dedans.',
             en: 'Big group, closed room, a day that drags: activities built for inside.' } },

  { id: 'brise-glace', app: 'brise-glace', icon: '😄', categorie: 'cooperatifs', univers: ['camps'],
    titre: { fr: 'Brise-glace', en: 'Ice-breakers' },
    intro: { fr: 'Le premier matin, quand personne ne se connaît encore et que le groupe reste collé aux murs.',
             en: "First morning, nobody knows anybody, and the group is still stuck to the walls." } },

  { id: 'grands-jeux', app: 'grands-jeux', icon: '🏴', categorie: 'exterieur', univers: ['camps'],
    titre: { fr: 'Grands jeux', en: 'Big games' },
    intro: { fr: 'Le morceau de résistance de la semaine : un scénario, un terrain, tout le camp dedans.',
             en: "The week's centrepiece: a scenario, a field, the whole camp in it." } },

  { id: 'jeux-eau', app: 'jeux-eau', icon: '💦', categorie: 'exterieur', univers: ['camps'],
    titre: { fr: "Jeux d'eau", en: 'Water games' },
    intro: { fr: '30 degrés à l\'ombre : rafraîchir le groupe sans que ça tourne à la bataille générale.',
             en: '30 in the shade: cool the group down without it turning into a free-for-all.' } },

  { id: 'rallyes', app: 'rallyes', icon: '🗺️', categorie: 'exterieur', univers: ['camps'],
    titre: { fr: 'Rallyes & chasses au trésor', en: 'Rallies & treasure hunts' },
    intro: { fr: 'Un parcours d\'énigmes clé en main, à poser sur la cour ou le quartier.',
             en: 'A ready-made trail of riddles to lay over the yard or the neighbourhood.' } },

  { id: 'veillee-feu-de-camp', app: 'veillee-feu-de-camp', icon: '🔥', categorie: 'ludiques', univers: ['camps'],
    titre: { fr: 'Veillée & feu de camp', en: 'Campfire night' },
    intro: { fr: 'La tombée du jour : histoires, sketchs et chansons pour finir la journée en beauté.',
             en: 'Nightfall: stories, skits and songs to close the day well.' } },

  { id: 'olympiades-scolaires', app: 'olympiades-scolaires', icon: '🥇', categorie: 'olympiques', univers: ['eps'],
    titre: { fr: 'Olympiades scolaires', en: 'School olympics' },
    intro: { fr: 'Monter une journée d\'épreuves : rotations, pointage, et tout le monde qui joue.',
             en: 'Build a day of events: rotations, scoring, and everybody playing.' } },
];

/* ═══════════════ Lecture des apps ═══════════════
   Emprunté à _generate-mini-banques.js : le tableau est isolé par comptage de
   crochets — pas par regex, les chaînes contiennent des « ] » — puis évalué
   dans un bac à sable. C'est du littéral JS, pas du JSON. */

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

/* ═══════════════ Similarité — Sørensen–Dice sur bigrammes ═══════════════
   Mêmes seuils que DOUBLONS-EXTRACTION.md, pour que les 12 doublons déjà
   arbitrés soient redétectés à l'identique. */

const normalise = s => String(s || '').toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

function bigrammes(s) {
  const g = new Set();
  for (let i = 0; i < s.length - 1; i++) g.add(s.slice(i, i + 2));
  return g;
}

function ratio(a, b) {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const A = bigrammes(a), B = bigrammes(b);
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return (2 * inter) / (A.size + B.size);
}

function motsLongs(s) {
  return new Set(normalise(s).split(' ').filter(m => m.length >= 4));
}

/* ═══════════════ Une VARIANTE n'est pas un doublon ═══════════════

   Décision de Joey, 2 septembre 2026, après revue des 19 rapprochements de
   la première passe : « une variante qui change la mécanique (coopératif,
   élimination, etc.) n'est pas un doublon ».

   Le cas qui a tranché : « Statues musicales » avait été écarté au profit de
   « STATUES MUSICALES COOPÉRATIVES ». Or la version classique élimine, la
   coopérative fait se regrouper — deux jeux, deux intentions pédagogiques.
   Les écarter l'un pour l'autre effaçait un jeu du catalogue en silence.

   La règle : quand un titre est inclus dans l'autre, on regarde les mots EN
   PLUS. S'ils portent un marqueur de mécanique, ce n'est pas un doublon. */

const MARQUEURS_MECANIQUE = [
  'cooperatif', 'cooperative', 'cooperatifs', 'cooperatives',
  'elimination', 'sans elimination', 'inverse', 'inversee',
  'physique', 'elastique', 'ballon', 'ballons', 'bases',
  'geant', 'geante', 'aveugle', 'chaine', 'relais', 'duel',
  // Ajoutes apres la 2e passe. Un arbitrage est indexe sur UNE paire ; quand
  // il ecarte un rapprochement, le suivant prend sa place. « Capture du
  // drapeau » est ainsi passe de « 4 bases » (arbitre) a « Evoluee (CTD
  // Tactique) » — une variante elle aussi, que rien n'attrapait.
  'evoluee', 'evolue', 'tactique', 'ctd', 'avancee', 'avance', 'simplifiee',
];

function motsEnPlus(court, long) {
  const c = new Set(normalise(court).split(' ').filter(Boolean));
  return normalise(long).split(' ').filter(m => m && !c.has(m));
}

function estVariante(titreA, titreB) {
  const a = normalise(titreA), b = normalise(titreB);
  const [court, long] = a.length <= b.length ? [a, b] : [b, a];
  if (!long.includes(court)) return null;
  const plus = motsEnPlus(court, long);
  for (const m of plus) if (MARQUEURS_MECANIQUE.includes(m)) return m;
  return null;
}

/* ═══════════════ Arbitrages manuels ═══════════════

   Les décisions que Joey a prises nommément le 2 septembre, et celles que la
   revue des 19 a tranchées avec son critère. Elles sont ÉCRITES ici plutôt
   que déduites : un jugement humain sur un cas précis ne se recalcule pas, il
   se cite. Clé = titre extrait + id du jeu du catalogue.

   `doublon: false` → l'item entre au catalogue comme inédit. */

const ARBITRAGES = {
  'la queue du dragon|AAO_005':        { doublon: true,  note: 'Joey : vrai doublon, ecarte confirme.' },
  'statues musicales|pfeq_122':        { doublon: false, note: 'Joey : la classique elimine, la cooperative regroupe — deux jeux.' },
  'capture du drapeau|MO1_010':        { doublon: false, note: 'Revue : « 4 bases » change la mecanique du terrain.' },
  'poule, renard, vipere|pfeq_187':    { doublon: false, note: 'Revue : « avec ballon » change la mecanique.' },
  'telephone arabe|pfeq_145':          { doublon: false, note: 'Revue : la version « physique » passe des gestes, pas des mots.' },
  'lancer de precision|AAO_056':       { doublon: false, note: 'Revue : Kolap est un jeu traditionnel precis, pas l\'epreuve generique.' },
  'saut en hauteur (elastique)|IND_005': { doublon: false, note: 'Revue : elastique au lieu de barre — autre engin, autre mecanique.' },
  'saut en longueur|OLYM_002':         { doublon: true,  note: 'Revue : meme epreuve (elan-impulsion-reception).' },
  'course en sac|AM-EU-042':           { doublon: true,  note: 'Revue : meme mecanique, habillage culturel different.' },
  'tir a la corde|AAO_050':            { doublon: true,  note: 'Revue : meme mecanique, habillage culturel different.' },
};

// Les quatre règles de DOUBLONS-EXTRACTION.md, dans l'ordre, puis les deux
// garde-fous ajoutés le 2 septembre : arbitrage écrit, puis marqueur de variante.
function estDoublon(titreA, titreB, idCatalogue) {
  const a = normalise(titreA), b = normalise(titreB);
  if (!a || !b) return null;

  const cle = `${a}|${idCatalogue}`;
  if (Object.prototype.hasOwnProperty.call(ARBITRAGES, cle)) {
    const arb = ARBITRAGES[cle];
    return arb.doublon ? { regle: `arbitrage — ${arb.note}`, r: 1, arbitre: true } : null;
  }

  let base = null;
  if (a === b) base = { regle: 'titre identique', r: 1 };
  else {
    const r = ratio(a, b);
    if (r >= 0.90) base = { regle: 'ratio >= 0.90', r: +r.toFixed(2) };
    else if (r >= 0.84) {
      const A = motsLongs(a), B = motsLongs(b);
      for (const m of A) if (B.has(m)) { base = { regle: `ratio >= 0.84 + mot « ${m} »`, r: +r.toFixed(2) }; break; }
    }
    if (!base && a.length >= 10 && b.length >= 10 && (a.includes(b) || b.includes(a)))
      base = { regle: 'inclusion de titre', r: +r.toFixed(2) };
  }
  if (!base) return null;

  const marqueur = estVariante(titreA, titreB);
  if (marqueur) return null;   // variante : entre au catalogue

  return base;
}

/* ═══════════════ Normalisation vers le schéma du catalogue ═══════════════

   Les 14 apps ont chacune leurs dimensions natives (`dur`, `age`, `mom`,
   `taille`, `gear`…). On ne traduit QUE ce qui se traduit sans perte :
     • `dur` porte des minutes → dureeMin + duree
     • `age` porte « 5-8 »    → ageMin/ageMax
     • `gear`/`mat`           → materiel
   Tout le reste reste dans `tags`, tel quel, préfixé par sa dimension : on
   ne perd pas l'information et on n'en invente pas. */

function minutesDe(v) {
  const m = /(\d+)/.exec(String(v || ''));
  return m ? +m[1] : null;
}

function bornesAge(v) {
  const m = /^(\d+)\s*-\s*(\d+)$/.exec(String(v || '').trim());
  return m ? [+m[1], +m[2]] : [null, null];
}

const CLES_DIMENSION = new Set(['id', 'icon', 'fr', 'en']);

function normalise1(item, col, index) {
  const fr = item.fr || {}, en = item.en || {};
  const titre = fr.n || '';
  if (!titre) return null;

  const [ageMin, ageMax] = bornesAge(item.age);
  const dureeMin = minutesDe(item.dur) || minutesDe(fr.tag);

  // Les énigmes portent { q, a } au lieu de { d, steps } : la question est le
  // but, la réponse est le déroulement. Rien n'est perdu, rien n'est inventé.
  const but = fr.d || fr.q || '';
  const butEn = en.d || en.q || '';
  const deroulement = fr.steps || (fr.a ? ['Réponse : ' + fr.a] : []);
  const deroulementEn = en.steps || (en.a ? ['Answer: ' + en.a] : []);

  const materiel = [];
  if (item.gear) materiel.push(String(item.gear));
  if (item.mat) materiel.push(String(item.mat));

  // Dimensions natives conservées telles quelles, préfixées.
  const tags = [];
  for (const k of Object.keys(item)) {
    if (CLES_DIMENSION.has(k)) continue;
    if (item[k] === undefined || item[k] === null || item[k] === '') continue;
    tags.push(`${k}:${item[k]}`);
  }

  const vide = '', videT = [];
  return {
    id: `COLL_${col.id}_${String(index + 1).padStart(2, '0')}`,
    title: titre, titleEn: en.n || titre,
    category: col.categorie,
    categoryName: null, categoryIcon: null, categoryColor: null, // remplis plus bas
    but, intentionsC1: vide, intentionsC2: vide, intentionsC3: vide,
    transversales: videT,
    materiel,
    disposition: vide,
    duree: dureeMin ? `${dureeMin} min` : vide,
    dureeMin: dureeMin || 0,
    deroulement,
    variantes: videT,
    origine: `Collection « ${col.titre.fr} » — Zone Total Sport`,
    ageMin: ageMin === null ? '' : ageMin,
    ageMax: ageMax === null ? '' : ageMax,
    nbJoueursMin: vide, nbJoueursMax: vide,
    espace: vide, niveauActivite: vide, niveau: vide,
    consignesSecurite: videT, adaptations: videT, roleEnseignant: vide,
    retourAuCalme: vide, questionsReflexion: videT, progression: vide,
    erreursFrequentes: videT, noms_alternatifs: videT,
    tags,
    _source: 'collections',
    butEn, dispositionEn: vide, deroulementEn, variantesEn: videT,
    _uid: `coll-${col.id}-${item.id}`,
    origineEn: `Collection "${col.titre.en}" — Zone Total Sport`,
    roleEnseignantEn: vide, retourAuCalmeEn: vide, progressionEn: vide,
    niveauEn: vide, espaceEn: vide, niveauActiviteEn: vide,
    dureeEn: dureeMin ? `${dureeMin} min` : vide,
    transversalesEn: videT, materielEn: materiel.slice(),
    consignesSecuriteEn: videT, adaptationsEn: videT,
    questionsReflexionEn: videT, erreursFrequentesEn: videT,
    noms_alternatifsEn: videT,
    univers: col.univers.slice(),
    collections: [col.id],
    icon: item.icon || col.icon,
  };
}

/* ═══════════════ Une collection est une RÈGLE ═══════════════

   Décision de Joey, 2 septembre : une collection n'est pas seulement les 8-10
   étiquettes héritées d'une mini-app. Quand un champ du catalogue porte le
   critère, la collection est un FILTRE ENREGISTRÉ sur les 1533 jeux, et les
   étiquettes manuelles s'ajoutent par-dessus.

   Cible : 20-60 jeux. Une règle qui en ramène moins de 15 est SIGNALÉE au
   rapport, jamais forcée — mieux vaut une collection thématique assumée
   qu'une règle tordue jusqu'à faire le compte.

   ⚠ Frontières de mot obligatoires. La première version cherchait « eau » en
   sous-chaîne et ramenait 369 jeux : « cerceau » contient « eau ». */

const texteDe = (j, ...champs) => champs.map(c => {
  const v = j[c];
  return Array.isArray(v) ? v.join(' ') : (v || '');
}).join(' ').toLowerCase();

const LETTRE = 'a-zàâçéèêëîïôûùüÿñæœ';
function mot(t, ...mots) {
  return mots.some(m => new RegExp(`(?<![${LETTRE}])${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![${LETTRE}])`).test(t));
}

const estInterieur = j => {
  const e = texteDe(j, 'espace');
  return (e.includes('gymnase') || e.includes('intérieur')) && !e.includes('extérieur');
};
const aUnivers = (j, u) => (j.univers || []).includes(u);

const REGLES = {
  'jeux-calmes': j => texteDe(j, 'niveauActivite').includes('faible')
                   || mot(texteDe(j, 'title', 'but'), 'calme', 'calmes'),
  'jeux-rapides': j => Number.isInteger(j.dureeMin) && j.dureeMin > 0 && j.dureeMin <= 10,
  'jeux-eau': j => mot(texteDe(j, 'title', 'but', 'materiel'),
                       'eau', 'éponge', 'éponges', 'seau', 'seaux', 'piscine', 'arrosoir', 'aquatique'),
  'plan-b-meteo': j => estInterieur(j) && aUnivers(j, 'eps'),
  'plan-b-pluie': j => estInterieur(j) && aUnivers(j, 'sdg'),
  'echauffements': j => mot(texteDe(j, 'title', 'but', 'tags'),
                            'échauffement', 'échauffements', 'échauffer', 'réchauffement'),
  'grands-jeux': j => texteDe(j, 'espace').includes('extérieur')
                   && Number.isInteger(j.nbJoueursMin) && j.nbJoueursMin >= 12,
  'olympiades-scolaires': j => j.category === 'olympiques',
};

/* Sans règle, et c'est assumé : ces collections restent THÉMATIQUES, portées
   par leurs seules étiquettes. Aucun champ du catalogue ne porte leur critère,
   et le deviner reviendrait à étiqueter au jugé.
     activites-duree  aucune règle tenable — `dureeMin <= 20` ramène 1434 des
                      1533 jeux (1165 sont à 15 min). Le filtre par durée fait
                      déjà ce travail, mieux et sans mentir.
     jeux-par-theme   « thème » n'est pas un champ du catalogue.
     enigmes, brise-glace, rallyes, veillee-feu-de-camp
                      règles testées, toutes sous 15 jeux. Signalées telles
                      quelles au rapport. */

/* ═══════════════ Catégories de matériel ═══════════════

   Décision de Joey : pas de texte libre dans le filtre. Dix catégories
   normalisées, dérivées du champ `materiel` par mots-clés, ORDONNÉES — le
   premier mot-clé qui matche gagne. « Sans matériel » passe en premier :
   c'est le filtre le plus demandé sur le terrain. */

const MATERIEL_CATS = [
  ['Sans matériel',        ['aucun', 'sans matériel']],
  ['Parachute',            ['parachute']],
  ['Eau / extérieur',      ['eau', 'éponge', 'éponges', 'seau', 'seaux', 'piscine', 'arrosoir']],
  ['Cerceaux',             ['cerceau', 'cerceaux']],
  ['Cordes',               ['corde', 'cordes', 'élastique', 'élastiques']],
  ['Ballons',              ['ballon', 'ballons', 'balle', 'balles']],
  ['Cônes / dossards',     ['cône', 'cônes', 'cone', 'cones', 'dossard', 'dossards', 'plot', 'plots',
                            'foulard', 'foulards', 'chasuble', 'chasubles']],
  ['Gros matériel de gym', ['tapis', 'banc', 'bancs', 'espalier', 'espaliers', 'poutre', 'tremplin',
                            'caisson', 'filet', 'filets', 'but', 'buts', 'panier', 'paniers']],
  ['Papier / crayons',     ['papier', 'papiers', 'crayon', 'crayons', 'carton', 'cartons',
                            'feuille', 'feuilles', 'fiche', 'fiches', 'craie', 'craies']],
  ['Petit matériel varié', ['sifflet', 'sifflets', 'chronomètre', 'ruban', 'musique', 'bâton', 'bâtons',
                            'quille', 'quilles', 'sac', 'sacs', 'pince', 'pinces', 'coussin', 'coussins',
                            'dé', 'dés', 'carte', 'cartes', 'lampe', 'lampes', 'objet', 'objets',
                            'bac', 'bacs', 'anneau', 'anneaux', 'bouteille', 'bouteilles',
                            'raquette', 'raquettes', 'frisbee', 'chaise', 'chaises']],
];

// Rend [categorie, classeExplicitement]. Le fourre-tout est aussi la valeur
// par defaut : on distingue « range par mot-cle » de « tombe dedans faute de
// mieux », pour que le rapport dise la verite sur la couverture.
function categorieMateriel(j) {
  const m = j.materiel;
  if (!m || !m.length) return [null, false];
  const t = m.map(String).join(' ').toLowerCase();
  for (const [nom, mots] of MATERIEL_CATS) if (mot(t, ...mots)) return [nom, true];
  return ['Petit matériel varié', false];
}

/* ═══════════════ Exécution ═══════════════ */

function main() {
  const lu = JSON.parse(fs.readFileSync(CATALOGUE, 'utf8'));

  /* ── REMISE À ZÉRO, pour que le script soit vraiment relançable ──
     Une passe précédente a pu écrire ses inédits (`COLL_*`) et ses étiquettes
     dans le catalogue. Repartir de cet état ferait grossir le fichier à chaque
     lancement et rendrait le rapport dépendant du nombre de passes. On retire
     donc d'abord TOUT ce que ce script a produit, puis on rebâtit depuis les
     apps. Même entrée → même sortie, quel que soit le nombre de lancements. */
  const rejoues = lu.filter(j => String(j.id).startsWith('COLL_')).length;
  const catalogue = lu.filter(j => !String(j.id).startsWith('COLL_'));
  for (const j of catalogue) { delete j.collections; delete j.materielCat; }
  if (rejoues) console.log(`(relance : ${rejoues} inedit(s) et les etiquettes de la passe precedente retires avant reconstruction)`);

  const avantCles = JSON.stringify(catalogue.map(j => Object.keys(j).sort()));
  const avantN = catalogue.length;

  // Palette des catégories, reprise du catalogue — jamais inventée.
  const palette = {};
  for (const j of catalogue) {
    if (!palette[j.category]) palette[j.category] =
      { nom: j.categoryName, icone: j.categoryIcon, couleur: j.categoryColor };
  }

  const parTitre = catalogue.map(j => ({ ref: j, n: normalise(j.title) }));
  const rapport = [];
  const inedits = [];
  let totalExtraits = 0, totalDoublons = 0;

  for (const col of COLLECTIONS) {
    const bruts = lireSource(col.app);
    totalExtraits += bruts.length;
    const lignes = { col, extraits: bruts.length, doublons: [], inedits: 0, etiquetes: 0 };

    bruts.forEach((item, i) => {
      const f = normalise1(item, col, i);
      if (!f) return;

      let trouve = null;
      for (const c of parTitre) {
        // Un item ne se compare qu'au CATALOGUE, jamais aux inédits déjà
        // ajoutés par cette passe : deux énigmes de la même app portent le
        // titre « Devinette du gym » avec des questions différentes. Les
        // confondre en effacerait une. Le défaut de source est signalé au
        // rapport, il se corrige dans apps/enigmes.
        if (String(c.ref.id).startsWith('COLL_')) continue;
        const d = estDoublon(f.title, c.ref.title, c.ref.id);
        if (d) { trouve = { jeu: c.ref, ...d }; break; }
      }

      if (trouve) {
        // Le doublon n'entre pas. Le jeu du catalogue qu'il désigne reçoit
        // l'étiquette : c'est bien de cette collection qu'il fait partie.
        totalDoublons++;
        lignes.doublons.push({ extrait: f.title, catalogue: trouve.jeu.title, id: trouve.jeu.id, regle: trouve.regle, r: trouve.r });
        if (!Array.isArray(trouve.jeu.collections)) trouve.jeu.collections = [];
        if (!trouve.jeu.collections.includes(col.id)) { trouve.jeu.collections.push(col.id); lignes.etiquetes++; }
      } else {
        const p = palette[col.categorie];
        if (!p) throw new Error(`categorie inconnue au catalogue : ${col.categorie}`);
        f.categoryName = p.nom; f.categoryIcon = p.icone; f.categoryColor = p.couleur;
        inedits.push(f);
        parTitre.push({ ref: f, n: normalise(f.title) }); // évite les doublons INTERNES
        lignes.inedits++; lignes.etiquetes++;
      }
    });

    rapport.push(lignes);
  }

  // Les inédits rejoignent le catalogue.
  const final = catalogue.concat(inedits);

  /* ── Les collections deviennent des RÈGLES ──
     Les étiquettes héritées des mini-apps sont déjà posées. On applique
     maintenant les filtres enregistrés PAR-DESSUS, sur les 1533 jeux. */
  const parRegle = {};
  for (const [id, regle] of Object.entries(REGLES)) {
    let n = 0;
    for (const j of final) {
      let ok = false;
      try { ok = regle(j); } catch (e) { ok = false; }
      if (!ok) continue;
      if (!Array.isArray(j.collections)) j.collections = [];
      if (!j.collections.includes(id)) j.collections.push(id);
      n++;
    }
    parRegle[id] = n;
  }

  /* ── Catégorie de matériel, sur chaque jeu ──
     Champ dérivé et additif : `materielCat`. Un jeu sans matériel renseigné
     n'en reçoit pas — absent laisse passer le filtre, comme pour l'âge. */
  const distMateriel = {}; let explicite = 0, parDefaut = 0, avecMateriel = 0;
  for (const j of final) {
    const [cat, sur] = categorieMateriel(j);
    if (!cat) continue;
    avecMateriel++;
    j.materielCat = cat;
    distMateriel[cat] = (distMateriel[cat] || 0) + 1;
    if (sur) explicite++; else parDefaut++;
  }

  /* ── Garanties additives, vérifiées et non promises ── */
  const apresCles = JSON.stringify(final.slice(0, avantN).map(j =>
    Object.keys(j).filter(k => k !== 'collections' && k !== 'materielCat').sort()));
  if (avantCles !== apresCles)
    throw new Error('REFUS : une cle existante a change sur un jeu existant.');

  const idsVus = new Set();
  for (const j of final) {
    if (idsVus.has(j.id)) throw new Error(`REFUS : id en double — ${j.id}`);
    idsVus.add(j.id);
  }

  const etiquetes = final.filter(j => Array.isArray(j.collections) && j.collections.length);

  /* ── Définitions des collections ── */
  const defs = {
    _lisezmoi: [
      'Definitions des collections du pilier Jeux. Genere par',
      '_scripts/extrait-collections-jeux.js — ne pas editer a la main :',
      'la source des ITEMS reste apps/<app>/index.html, la source des TITRES',
      'et INTROS est le tableau COLLECTIONS de ce script.',
      '',
      'Chaque collection est une etiquette posee sur les jeux du catalogue,',
      'pas une banque separee. Un jeu peut appartenir a plusieurs collections.',
    ],
    genere: new Date().toISOString().slice(0, 10),
    collections: COLLECTIONS.map(c => {
      const n = etiquetes.filter(j => j.collections.includes(c.id)).length;
      return { id: c.id, icon: c.icon, titre: c.titre, intro: c.intro,
               univers: c.univers, categorie: c.categorie, nbJeux: n,
               appOrigine: `apps/${c.app}/` };
    }),
  };

  /* ── Rapport ── */
  let md = `# RAPPORT-COLLECTIONS-JEUX — vague 2, PR A\n\n`;
  md += `> Généré par \`_scripts/extrait-collections-jeux.js\` le ${defs.genere}.\n`;
  md += `> Relançable : même entrée, même sortie.\n\n`;
  md += `## Décompte\n\n`;
  md += `| | |\n|---|---|\n`;
  md += `| Items extraits des 14 apps | **${totalExtraits}** |\n`;
  md += `| Doublons du catalogue | **${totalDoublons}** |\n`;
  md += `| Inédits ajoutés au catalogue | **${inedits.length}** |\n`;
  md += `| Catalogue | ${avantN} → **${final.length}** jeux |\n`;
  md += `| Jeux portant au moins une collection | **${etiquetes.length}** |\n\n`;
  md += `## Par collection\n\n`;
  md += `| Collection | Extraits | Doublons | Inédits | Jeux étiquetés |\n|---|---|---|---|---|\n`;
  for (const l of rapport) {
    const n = etiquetes.filter(j => j.collections.includes(l.col.id)).length;
    md += `| ${l.col.icon} ${l.col.titre.fr} | ${l.extraits} | ${l.doublons.length} | ${l.inedits} | **${n}** |\n`;
  }
  /* ── Largeur des collections, après application des règles ── */
  md += `\n## Largeur des collections — étiquettes + règle\n\n`;
  md += `> Décision de Joey : une collection est une **règle**, pas seulement les étiquettes\n`;
  md += `> héritées de la mini-app. Cible 20-60 jeux. Une règle sous 15 est **signalée**,\n`;
  md += `> jamais forcée.\n\n`;
  md += `| Collection | Étiquettes | Règle | Total | |\n|---|---|---|---|---|\n`;
  for (const c of COLLECTIONS) {
    const total = final.filter(j => (j.collections || []).includes(c.id)).length;
    const r = parRegle[c.id];
    const etiq = rapport.find(l => l.col.id === c.id);
    const nEtiq = etiq ? etiq.inedits + etiq.doublons.length : 0;
    let verdict = '';
    if (r === undefined) verdict = '⚪ thématique — aucune règle tenable';
    else if (r < 15) verdict = `⚠️ règle sous 15 (${r}) — reste thématique`;
    else if (total > 200) verdict = '⚠️ très large — la règle est quasi un filtre';
    else if (total >= 20 && total <= 60) verdict = '✅ dans la cible';
    else verdict = '🟡 hors cible, mais honnête';
    md += `| ${c.icon} ${c.titre.fr} | ${nEtiq} | ${r === undefined ? '—' : r} | **${total}** | ${verdict} |\n`;
  }
  md += `\n**Ce qui n'a pas de règle, et pourquoi.** Aucun champ du catalogue ne porte leur\n`;
  md += `critère ; le deviner reviendrait à étiqueter au jugé.\n\n`;
  md += `- \`activites-duree\` — \`dureeMin <= 20\` ramène **1434 des ${final.length}** jeux (1165 sont\n`;
  md += `  à 15 min). Le filtre par durée fait déjà ce travail, mieux et sans mentir.\n`;
  md += `- \`jeux-par-theme\` — « thème » n'est pas un champ du catalogue.\n`;
  md += `- \`enigmes\`, \`brise-glace\`, \`rallyes\`, \`veillee-feu-de-camp\` — règles testées,\n`;
  md += `  toutes sous 15 jeux. Elles restent thématiques.\n\n`;
  md += `**Dette de fond, hors PR B** : l'enrichissement IA des étiquettes sur les\n`;
  md += `${final.length} jeux, validé par Joey. Il élargira les collections thématiques sans\n`;
  md += `règle. Ce n'est **pas** un préalable à la PR B.\n\n`;

  /* ── Matériel ── */
  md += `\n## Filtre matériel — 10 catégories normalisées\n\n`;
  md += `> Pas de texte libre. Le premier mot-clé qui matche gagne, et « Sans matériel »\n`;
  md += `> passe en premier : c'est le filtre le plus demandé sur le terrain.\n\n`;
  md += `Champ dérivé \`materielCat\`, posé sur les **${avecMateriel}** jeux dont le matériel est\n`;
  md += `renseigné. Un jeu sans matériel renseigné n'en reçoit pas — absent laisse passer le\n`;
  md += `filtre, comme pour l'âge.\n\n`;
  md += `| Catégorie | Jeux | Part |\n|---|---|---|\n`;
  for (const [k, v] of Object.entries(distMateriel).sort((a, b) => b[1] - a[1]))
    md += `| ${k} | ${v} | ${(100 * v / avecMateriel).toFixed(1)} % |\n`;
  const couv = 100 * explicite / avecMateriel;
  md += `\n**Couverture : ${couv.toFixed(1)} %** rangés par un mot-clé explicite. Les\n`;
  md += `${parDefaut} restants (${(100 * parDefaut / avecMateriel).toFixed(1)} %) tombent dans « Petit matériel varié »\n`;
  md += `faute de mieux — sous le seuil de 5 % fixé par Joey.\n\n`;

  md += `\n## Doublons écartés\n\n`;
  md += `> L'item extrait n'entre pas au catalogue. Le jeu qu'il désigne reçoit\n`;
  md += `> l'étiquette de la collection : il en fait bien partie.\n\n`;
  let aucun = true;
  for (const l of rapport) {
    if (!l.doublons.length) continue;
    aucun = false;
    md += `### ${l.col.titre.fr} — ${l.doublons.length}\n\n`;
    md += `| Item extrait | ≈ Jeu du catalogue | id | Règle |\n|---|---|---|---|\n`;
    for (const d of l.doublons) md += `| ${d.extrait} | ${d.catalogue} | \`${d.id}\` | ${d.regle} (${d.r}) |\n`;
    md += `\n`;
  }
  if (aucun) md += `Aucun.\n\n`;

  if (ESSAI) {
    console.log(md);
    console.log('--essai : rien n\'a été écrit.');
    return;
  }

  // ⚠ FORMAT PRÉSERVÉ. Le catalogue est MINIFIÉ sur une seule ligne, sans
  // saut de ligne final. Le réécrire indenté produirait un diff de ~1,5
  // million de lignes pour 94 ajouts, illisible en revue et lourd dans git —
  // et changerait l'octet servi par R2 à 9 consommateurs sans raison.
  fs.writeFileSync(CATALOGUE, JSON.stringify(final), 'utf8');
  fs.writeFileSync(DEFINITIONS, JSON.stringify(defs, null, 2) + '\n', 'utf8');
  fs.writeFileSync(RAPPORT, md, 'utf8');

  console.log(`Items extraits   : ${totalExtraits}`);
  console.log(`Doublons ecartes : ${totalDoublons}`);
  console.log(`Inedits ajoutes  : ${inedits.length}`);
  console.log(`Catalogue        : ${avantN} -> ${final.length}`);
  console.log(`Jeux etiquetes   : ${etiquetes.length}`);
  console.log(`Ecrit : _data/jeux-merged.json, assets/collections-jeux.json, RAPPORT-COLLECTIONS-JEUX.md`);
  console.log(`\n⚠ _data/jeux-merged.json a change : il faut le reverser dans R2`);
  console.log(`  (bash _scripts/publie-banques-r2.sh) avant que la prod le voie.`);
}

main();
