#!/usr/bin/env node
/**
 * zts-seed-sections.js — remplit la collection Firestore `sections`.
 *
 * Les sections ne sont pas inventees : elles sont EXTRAITES de
 * apps/jeux/data/jeux-merged.json, qui classe deja les 1439 jeux du site
 * sur deux axes — `univers` (eps / camps / sdg) et `category` (18 valeurs,
 * chacune avec son nom, son icone et sa couleur). Reprendre cette taxonomie
 * telle quelle evite d'avoir deux vocabulaires concurrents dans le meme
 * site, ce que la regle d'or n°2 de CLAUDE.md interdit explicitement.
 *
 * L'ordre est celui du nombre de jeux par categorie, decroissant : la
 * categorie la plus fournie arrive en tete de l'index /fiches.
 *
 * USAGE
 *   GOOGLE_APPLICATION_CREDENTIALS=~/cle-zts.json \
 *     node _scripts/zts-seed-sections.js
 *
 *   # voir ce qui serait ecrit, sans rien ecrire
 *   node _scripts/zts-seed-sections.js --simulation
 *
 * Idempotent : relancer le script met a jour les documents existants
 * (merge) sans jamais en supprimer.
 */

'use strict';

const fs = require('fs');
const path = require('path');

// 2026-09-02, vague 1 : le catalogue a quitte apps/jeux/data/ pour _data/.
// Ce chemin pointait un fichier absent — le script plantait au premier
// readFileSync. C'est le seul chemin EXECUTABLE encore mort ; les autres
// occurrences du vieux chemin dans le depot sont de la prose de commentaire.
const SOURCE = path.join(__dirname, '..', '_data', 'jeux-merged.json');
const simulation = process.argv.includes('--simulation');

function extraire() {
  const jeux = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const vues = new Map();
  const compte = new Map();

  for (const j of jeux) {
    const slug = j.category;
    if (!slug) continue;
    compte.set(slug, (compte.get(slug) || 0) + 1);
    if (!vues.has(slug)) {
      vues.set(slug, {
        slug,
        nom: j.categoryName || slug,
        icone: j.categoryIcon || '',
        couleur: j.categoryColor || '#FFFFFF'
      });
    }
  }

  return [...vues.values()]
    .sort((a, b) => compte.get(b.slug) - compte.get(a.slug))
    .map((s, i) => Object.assign({}, s, { ordre: i + 1, nbJeux: compte.get(s.slug) }));
}

(async () => {
  const sections = extraire();
  console.log(`${sections.length} section(s) extraite(s) de ${path.relative(process.cwd(), SOURCE)} :\n`);
  for (const s of sections) {
    console.log(`  ${String(s.ordre).padStart(2)}. ${s.icone} ${s.nom.padEnd(24)} ${s.slug.padEnd(20)} ${s.couleur}  (${s.nbJeux} jeux)`);
  }

  if (simulation) {
    console.log('\n--simulation : rien n’a été écrit.');
    return;
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('\nGOOGLE_APPLICATION_CREDENTIALS n’est pas défini — voir l’en-tête du script.');
    process.exit(1);
  }

  const admin = require('firebase-admin');
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'zone-total-sport'
  });

  const db = admin.firestore();
  const lot = db.batch();
  for (const s of sections) {
    lot.set(db.collection('sections').doc(s.slug), s, { merge: true });
  }
  await lot.commit();

  console.log(`\n${sections.length} section(s) écrite(s) dans Firestore.`);
})().catch((e) => {
  console.error('Échec :', e.message);
  process.exit(1);
});
