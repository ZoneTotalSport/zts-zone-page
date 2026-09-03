#!/usr/bin/env node
// gen-images-sports.mjs — les 9 images de sport de la carte du groupe (proto G2).
//
// Même mécanique que scripts/gen-images-promo.mjs, dont ce script est le
// décalque : idempotent, reprenable, arrêt volontaire après la première image
// pour validation humaine, puis le lot sur confirmation.
//
// Usage :
//   node scripts/gen-images-sports.mjs             # UNE image puis arrêt (validation)
//   node scripts/gen-images-sports.mjs --tout      # tout ce qui manque
//   node scripts/gen-images-sports.mjs --slug=soccer
//   node scripts/gen-images-sports.mjs --force     # régénère même si le fichier est là
//   node scripts/gen-images-sports.mjs --seches    # n'appelle pas l'API, affiche le plan
//
// Prérequis : GEMINI_API_KEY dans l'environnement, `npm i` à la racine du dépôt.
//
// CE QUI DIFFÈRE DU SCRIPT PROMO, ET POURQUOI
//
//   1. LE POIDS EST UN CONTRAT, PAS UN AVERTISSEMENT. Les images promo sont des
//      vignettes sociales : 400 ko y passent. Celles-ci sont le FOND de la carte
//      du groupe, et un prof en voit six dans sa journée — six fonds à charger
//      sur le réseau d'une école. Le lot est donc borné à 150 ko par image, et
//      le script DESCEND la qualité webp par paliers jusqu'à y tenir plutôt que
//      de se contenter de le signaler. S'il n'y arrive pas, il échoue : une
//      image trop lourde qui passe en silence, personne ne la reverra.
//
//   2. LE CADRAGE EST VÉRIFIÉ, PAS SEULEMENT DEMANDÉ. Le tiers gauche doit
//      rester calme — la carte y pose un dégradé et deux pastilles blanches. Le
//      prompt le demande ; le modèle ne le respecte pas toujours. On mesure donc
//      l'écart-type de luminance du tiers gauche et on le RAPPORTE. Le script ne
//      refuse pas l'image pour autant : c'est un chiffre pour décider à l'œil,
//      pas un test automatique — l'oeil de Joey reste l'arbitre.
//
//   3. `fit:'cover'` SANS `position:'attention'`. Le script promo laisse sharp
//      choisir le recadrage sur la zone « intéressante » : ici ce serait le
//      contraire de ce qu'on veut, puisque l'intérêt est VOLONTAIREMENT à droite
//      et que sharp recentrerait dessus, mangeant le tiers gauche calme qui est
//      toute la raison du cadrage. On garde donc le centre géométrique.

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const RACINE = process.cwd();
const JSON_PROMPTS = path.join(RACINE, '_data', 'prompts-sports-proto.json');
const DOSSIER_SORTIE = path.join(RACINE, 'apps', 'planificateur', 'proto', 'img', 'sports');
const MODELE = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

/* les paliers de qualité webp, du plus beau au plus léger. On s'arrête au
   premier qui tient sous le plafond — jamais plus bas que nécessaire. */
const QUALITES = [82, 74, 66, 58, 50, 42];

const args = process.argv.slice(2);
const a = (n) => args.includes(n);
const argVal = (n) => {
  const m = args.find((x) => x.startsWith(n + '='));
  return m ? m.slice(n.length + 1) : null;
};

const MODE_SEC = a('--seches');
const FORCE = a('--force');
const TOUT = a('--tout');
const SLUG = argVal('--slug');

const log = (...m) => console.log(...m);
const err = (...m) => console.error('❌', ...m);

async function existe(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function chargerPlan() {
  let brut;
  try {
    brut = await fs.readFile(JSON_PROMPTS, 'utf8');
  } catch {
    err(`Fichier introuvable : ${JSON_PROMPTS}`);
    err('Lance le script depuis la racine du dépôt.');
    process.exit(1);
  }
  let doc;
  try { doc = JSON.parse(brut); } catch (e) {
    err('JSON invalide :', e.message); process.exit(1);
  }
  if (!Array.isArray(doc.images) || doc.images.length === 0) {
    err('Aucune entrée dans doc.images'); process.exit(1);
  }
  /* garde-fous : mêmes que le script promo, plus le chemin de sortie. Un nom de
     fichier hors du dossier du proto irait se perdre ailleurs dans le dépôt. */
  const vus = new Set();
  for (const img of doc.images) {
    if (vus.has(img.fichier)) { err('Doublon de fichier :', img.fichier); process.exit(1); }
    vus.add(img.fichier);
    for (const champ of ['slug', 'prompt', 'fichier', 'dimensions']) {
      if (!img[champ]) { err(`Champ « ${champ} » manquant pour`, img.slug || '(sans slug)'); process.exit(1); }
    }
    if (!/^apps\/planificateur\/proto\/img\/sports\/[a-z0-9-]+\.webp$/.test(img.fichier)) {
      err('Nom de fichier non conforme :', img.fichier); process.exit(1);
    }
  }
  /* le sport par défaut de la carte doit exister dans le lot, sinon la carte
     n'aurait rien à afficher pour un groupe qui n'a pas choisi son sport */
  const defaut = doc._defaut;
  if (defaut && !doc.images.some((i) => i.slug === defaut)) {
    err(`Le sport par défaut « ${defaut} » n'est pas dans le lot.`); process.exit(1);
  }
  return doc;
}

function filtrer(doc) {
  return SLUG ? doc.images.filter((i) => i.slug === SLUG) : doc.images;
}

/* L'écart-type de luminance du tiers gauche — voir la note 2 en tête. Plus il
   est bas, plus la zone est uniforme, plus les pastilles blanches y seront
   lisibles. Repère observé : sous 20, franchement calme ; au-delà de 40, chargé. */
async function calmeDuTiersGauche(sharp, tampon, largeur, hauteur) {
  const t = await sharp(tampon)
    .resize(largeur, hauteur, { fit: 'cover' })
    .extract({ left: 0, top: 0, width: Math.round(largeur / 3), height: hauteur })
    .greyscale()
    .stats();
  return Math.round(t.channels[0].stdev);
}

async function genererUne(img, client, plafondKo) {
  const sortie = path.join(RACINE, img.fichier);
  if (!FORCE && await existe(sortie)) {
    log(`⏭️  déjà là — ${img.fichier}`);
    return 'saute';
  }
  const [w, h] = img.dimensions.split('x').map(Number);
  if (MODE_SEC) {
    log(`🧪 (à sec) ${img.fichier} — ${w}×${h}, plafond ${plafondKo} ko`);
    log('   ' + img.prompt.slice(0, 150).replace(/\s+/g, ' ') + '…');
    return 'sec';
  }

  const promptComplet =
    `${img.prompt}\n\nÀ ÉVITER ABSOLUMENT : ${img.negative_prompt}\n` +
    `Format demandé : ${img.aspect_ratio} (${img.dimensions}).`;

  const reponse = await client.models.generateContent({
    model: MODELE,
    contents: [{ role: 'user', parts: [{ text: promptComplet }] }],
  });

  const parts = reponse?.candidates?.[0]?.content?.parts || [];
  const bloc = parts.find((p) => p.inlineData?.data);
  if (!bloc) {
    const txt = parts.map((p) => p.text).filter(Boolean).join(' ').slice(0, 200);
    throw new Error(`Aucune image renvoyée pour ${img.slug}${txt ? ' — réponse : ' + txt : ''}`);
  }

  const brut = Buffer.from(bloc.inlineData.data, 'base64');
  const { default: sharp } = await import('sharp');
  await fs.mkdir(path.dirname(sortie), { recursive: true });

  /* ── on descend la qualité jusqu'à tenir sous le plafond ── */
  let poids = null, qualite = null;
  for (const q of QUALITES) {
    await sharp(brut)
      .resize(w, h, { fit: 'cover' })   /* voir la note 3 : pas de `position` */
      .webp({ quality: q })
      .toFile(sortie);
    ({ size: poids } = await fs.stat(sortie));
    qualite = q;
    if (poids <= plafondKo * 1024) break;
  }
  if (poids > plafondKo * 1024) {
    throw new Error(`${img.slug} — ${(poids / 1024).toFixed(0)} ko même à qualité ${qualite}, `
                  + `au-delà du plafond de ${plafondKo} ko. Reformule le prompt pour un fond plus simple.`);
  }

  const calme = await calmeDuTiersGauche(sharp, brut, w, h);
  log(`✅ ${img.fichier} — ${w}×${h}, ${(poids / 1024).toFixed(0)} ko (q${qualite}), `
    + `tiers gauche σ=${calme} ${calme <= 20 ? '— calme' : calme <= 40 ? '— acceptable' : '— CHARGÉ, à revoir à l’œil'}`);
  return 'genere';
}

async function main() {
  const doc = await chargerPlan();
  const plafondKo = doc._poids_max_ko || 150;
  const liste = filtrer(doc);
  if (liste.length === 0) { err('Aucune image ne correspond aux filtres.'); process.exit(1); }

  await fs.mkdir(DOSSIER_SORTIE, { recursive: true });

  const restantes = [];
  for (const img of liste) {
    if (FORCE || !(await existe(path.join(RACINE, img.fichier)))) restantes.push(img);
  }
  log(`📋 ${liste.length} image(s) au plan, ${restantes.length} à produire, `
    + `${liste.length - restantes.length} déjà présente(s). Plafond : ${plafondKo} ko.`);
  if (restantes.length === 0) { log('Rien à faire.'); return; }

  let client = null;
  if (!MODE_SEC) {
    if (!process.env.GEMINI_API_KEY) {
      err('GEMINI_API_KEY absent de l\'environnement.'); process.exit(1);
    }
    const { GoogleGenAI } = await import('@google/genai');
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  /* ---- Étape 1 : une seule image, puis arrêt pour validation humaine ---- */
  const premiere = restantes[0];
  log(`\n🎬 Première image (validation) : ${premiere.slug} — ${premiere.fichier}`);
  try {
    await genererUne(premiere, client, plafondKo);
  } catch (e) {
    err(e.message); process.exit(1);
  }

  if (!TOUT && !SLUG) {
    log('\n⏸️  ARRÊT VOLONTAIRE après la première image.');
    log('   Ouvre le fichier et valide : photoréaliste, aucun texte, aucun logo,');
    log('   sujet à DROITE et tiers gauche calme. Puis relance avec --tout.');
    return;
  }

  /* ---- Étape 2 : le lot, en série (limite de débit) et reprenable ---- */
  let ok = 0, saut = 0, ko = 0;
  for (const img of restantes.slice(1)) {
    try {
      const r = await genererUne(img, client, plafondKo);
      if (r === 'genere') ok++; else saut++;
      await new Promise((r2) => setTimeout(r2, 1500));
    } catch (e) {
      ko++;
      err(`${img.slug} — ${e.message}`);
      log('   → on continue ; relance le script pour reprendre là où ça a bloqué.');
    }
  }
  log(`\n📊 Bilan : ${ok + 1} générée(s), ${saut} sautée(s), ${ko} en échec.`);
  if (ko > 0) process.exitCode = 1;
}

main().catch((e) => { err(e); process.exit(1); });
