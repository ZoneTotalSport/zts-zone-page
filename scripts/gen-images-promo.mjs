#!/usr/bin/env node
// gen-images-promo.mjs — génération locale des images promo sociales ZTS
// Même mécanique que scripts/gen-images-inventaire.mjs : idempotent, s'arrête
// après la première image pour validation, puis génère le lot sur confirmation.
//
// Usage :
//   node scripts/gen-images-promo.mjs                  # génère UNE image puis s'arrête (validation)
//   node scripts/gen-images-promo.mjs --lot1           # génère le lot 1 (9 articles prioritaires)
//   node scripts/gen-images-promo.mjs --tout           # génère tout ce qui manque
//   node scripts/gen-images-promo.mjs --slug=color-run # une image précise
//   node scripts/gen-images-promo.mjs --force          # régénère même si le fichier existe
//   node scripts/gen-images-promo.mjs --seches         # n'appelle pas l'API, affiche le plan
//
// Prérequis : GEMINI_API_KEY dans l'environnement, `npm i @google/genai sharp`

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const RACINE = process.cwd();
const JSON_PROMPTS = path.join(RACINE, '_data', 'prompts-promo-social.json');
const DOSSIER_SORTIE = path.join(RACINE, 'promo');
const MODELE = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';

const args = process.argv.slice(2);
const a = (n) => args.includes(n);
const argVal = (n) => {
  const m = args.find((x) => x.startsWith(n + '='));
  return m ? m.slice(n.length + 1) : null;
};

const MODE_SEC = a('--seches');
const FORCE = a('--force');
const TOUT = a('--tout');
const LOT1 = a('--lot1');
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
    err('Lance le script depuis la racine du dépôt wix-deploy.');
    process.exit(1);
  }
  let doc;
  try { doc = JSON.parse(brut); } catch (e) {
    err('JSON invalide :', e.message); process.exit(1);
  }
  if (!Array.isArray(doc.images) || doc.images.length === 0) {
    err('Aucune entrée dans doc.images'); process.exit(1);
  }
  // garde-fou : pas de doublon de fichier de sortie
  const vus = new Set();
  for (const img of doc.images) {
    if (vus.has(img.fichier)) { err('Doublon de fichier :', img.fichier); process.exit(1); }
    vus.add(img.fichier);
    for (const champ of ['slug', 'prompt', 'fichier', 'dimensions']) {
      if (!img[champ]) { err(`Champ « ${champ} » manquant pour`, img.slug || '(sans slug)'); process.exit(1); }
    }
    if (!/^promo\/[a-z0-9-]+-(carre|story)\.webp$/.test(img.fichier)) {
      err('Nom de fichier non conforme :', img.fichier); process.exit(1);
    }
  }
  return doc;
}

function filtrer(doc) {
  let liste = doc.images;
  if (SLUG) liste = liste.filter((i) => i.slug === SLUG);
  else if (LOT1) {
    const lot = new Set(doc._priorite?.lot_1 || []);
    liste = liste.filter((i) => lot.has(i.slug));
  }
  return liste;
}

async function genererUne(img, client) {
  const sortie = path.join(RACINE, img.fichier);
  if (!FORCE && await existe(sortie)) {
    log(`⏭️  déjà là — ${img.fichier}`);
    return 'saute';
  }
  const [w, h] = img.dimensions.split('x').map(Number);
  if (MODE_SEC) {
    log(`🧪 (à sec) ${img.fichier} — ${w}×${h}`);
    log('   ' + img.prompt.slice(0, 160) + '…');
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
  await sharp(brut)
    .resize(w, h, { fit: 'cover', position: 'attention' })
    .webp({ quality: 82 })
    .toFile(sortie);

  const { size } = await fs.stat(sortie);
  log(`✅ ${img.fichier} — ${w}×${h}, ${(size / 1024).toFixed(0)} ko`);
  if (size > 400 * 1024) log(`   ⚠️  plus de 400 ko, à surveiller pour le poids des pages`);
  return 'genere';
}

async function main() {
  const doc = await chargerPlan();
  const liste = filtrer(doc);
  if (liste.length === 0) { err('Aucune image ne correspond aux filtres.'); process.exit(1); }

  await fs.mkdir(DOSSIER_SORTIE, { recursive: true });

  const restantes = [];
  for (const img of liste) {
    if (FORCE || !(await existe(path.join(RACINE, img.fichier)))) restantes.push(img);
  }
  log(`📋 ${liste.length} image(s) au plan, ${restantes.length} à produire, ` +
      `${liste.length - restantes.length} déjà présente(s).`);
  if (restantes.length === 0) { log('Rien à faire.'); return; }

  let client = null;
  if (!MODE_SEC) {
    if (!process.env.GEMINI_API_KEY) {
      err('GEMINI_API_KEY absent de l\'environnement.'); process.exit(1);
    }
    const { GoogleGenAI } = await import('@google/genai');
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  // ---- Étape 1 : une seule image, puis arrêt pour validation humaine
  const premiere = restantes[0];
  log(`\n🎬 Première image (validation) : ${premiere.slug} — ${premiere.fichier}`);
  try {
    await genererUne(premiere, client);
  } catch (e) {
    err(e.message); process.exit(1);
  }

  if (!TOUT && !LOT1 && !SLUG) {
    log('\n⏸️  ARRÊT VOLONTAIRE après la première image.');
    log('   Ouvre le fichier, valide le style (photoréaliste, aucun texte, aucune mascotte),');
    log('   puis relance avec --lot1 (les 9 prioritaires) ou --tout.');
    return;
  }

  // ---- Étape 2 : le lot, en série (limite de débit) et reprenable
  let ok = 0, saut = 0, ko = 0;
  for (const img of restantes.slice(1)) {
    try {
      const r = await genererUne(img, client);
      if (r === 'genere') ok++; else saut++;
      await new Promise((r2) => setTimeout(r2, 1500));
    } catch (e) {
      ko++;
      err(`${img.slug} — ${e.message}`);
      log('   → on continue; relance le script pour reprendre là où ça a bloqué.');
    }
  }
  log(`\n📊 Bilan : ${ok + 1} générée(s), ${saut} sautée(s), ${ko} en échec.`);
  if (ko > 0) process.exitCode = 1;
}

main().catch((e) => { err(e); process.exit(1); });
