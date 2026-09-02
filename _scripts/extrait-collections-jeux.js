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

// Les quatre règles de DOUBLONS-EXTRACTION.md, dans l'ordre.
function estDoublon(titreA, titreB) {
  const a = normalise(titreA), b = normalise(titreB);
  if (!a || !b) return null;
  if (a === b) return { regle: 'titre identique', r: 1 };
  const r = ratio(a, b);
  if (r >= 0.90) return { regle: 'ratio >= 0.90', r: +r.toFixed(2) };
  if (r >= 0.84) {
    const A = motsLongs(a), B = motsLongs(b);
    for (const m of A) if (B.has(m)) return { regle: `ratio >= 0.84 + mot « ${m} »`, r: +r.toFixed(2) };
  }
  if (a.length >= 10 && b.length >= 10 && (a.includes(b) || b.includes(a)))
    return { regle: 'inclusion de titre', r: +r.toFixed(2) };
  return null;
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
  for (const j of catalogue) delete j.collections;
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
        const d = estDoublon(f.title, c.ref.title);
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

  /* ── Garanties additives, vérifiées et non promises ── */
  const apresCles = JSON.stringify(final.slice(0, avantN).map(j =>
    Object.keys(j).filter(k => k !== 'collections').sort()));
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
  md += `\n## ⚠ Ce que ces chiffres veulent dire pour la PR B\n\n`;
  md += `Une collection compte **entre 4 et 10 jeux**, sur un catalogue de ${final.length}.\n`;
  md += `C'est le contenu réel des mini-apps, ni plus ni moins : l'étiquette n'est posée\n`;
  md += `que sur ce que la source contenait vraiment — les inédits, et les jeux du\n`;
  md += `catalogue que ses doublons désignaient. **Rien n'a été étiqueté au jugé.**\n\n`;
  md += `Une rangée de 8 jeux, c'est une rangée honnête, pas une rangée vide. Mais si la\n`;
  md += `PR B les présente comme « la » collection de jeux calmes du site, elle promet\n`;
  md += `plus que ce qu'il y a derrière — alors que le catalogue contient sûrement des\n`;
  md += `dizaines d'autres jeux calmes, simplement jamais étiquetés comme tels.\n\n`;
  md += `Deux sorties, et c'est un choix de Joey, pas du script :\n\n`;
  md += `1. **Garder tel quel** — la collection est une sélection, courte et assumée.\n`;
  md += `2. **Élargir par règle** — poser aussi l'étiquette selon un critère du catalogue\n`;
  md += `   (durée courte → jeux rapides, catégorie → grands jeux…). Déterministe, mais\n`;
  md += `   c'est une règle par collection, à écrire et à arbitrer une par une.\n\n`;
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
