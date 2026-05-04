#!/usr/bin/env node
/**
 * Validateur de schéma v2 — Banque de Jeux Sportifs Mondiaux
 * Usage : node validate_schema_v2.js [fichier.json]
 * Sans argument : valide tous les fichiers dans data/jeux/
 */

const fs = require('fs');
const path = require('path');

const CHAMPS_OBLIGATOIRES = [
  'id', 'titre', 'noms_alternatifs', 'origine',
  'intentions_pedagogiques', 'competences_motrices', 'valeurs',
  'niveau', 'age_min', 'age_max', 'duree',
  'nb_joueurs_min', 'nb_joueurs_max', 'espace', 'niveau_activite',
  'materiel', 'disposition', 'deroulement', 'variantes',
  'consignes_securite', 'adaptations_besoins_speciaux',
  'role_enseignant', 'retour_au_calme', 'questions_reflexion',
  'progression', 'erreurs_frequentes', 'tags'
];

const MINIMUMS = {
  deroulement: { min: 8, label: 'étapes de déroulement' },
  variantes: { min: 4, label: 'variantes' },
  consignes_securite: { min: 3, label: 'consignes de sécurité' },
  adaptations_besoins_speciaux: { min: 3, label: 'adaptations' },
  questions_reflexion: { min: 3, label: 'questions de réflexion' },
  progression: { min: 3, label: 'niveaux de progression' },
  erreurs_frequentes: { min: 3, label: 'erreurs fréquentes' },
  competences_motrices: { min: 3, label: 'compétences motrices' },
  valeurs: { min: 3, label: 'valeurs' },
  tags: { min: 5, label: 'tags' }
};

const NIVEAUX_ACTIVITE_VALIDES = ['Faible', 'Modéré', 'Élevé', 'Très élevé'];

function validateJeu(jeu, fichier) {
  const erreurs = [];
  const avertissements = [];
  const id = jeu.id || '???';

  // Champs obligatoires
  for (const champ of CHAMPS_OBLIGATOIRES) {
    if (jeu[champ] === undefined || jeu[champ] === null) {
      erreurs.push(`[${id}] Champ manquant : ${champ}`);
    }
  }

  // Vérifier que deroulement est un array (pas un string)
  if (typeof jeu.deroulement === 'string') {
    erreurs.push(`[${id}] deroulement doit être un ARRAY d'étapes, pas un string`);
  }

  // Minimums pour les arrays
  for (const [champ, config] of Object.entries(MINIMUMS)) {
    const val = jeu[champ];
    if (Array.isArray(val) && val.length < config.min) {
      avertissements.push(`[${id}] ${champ} : ${val.length}/${config.min} ${config.label} (minimum non atteint)`);
    }
  }

  // Vérifier format enrichi des variantes (objets avec nom/description)
  if (Array.isArray(jeu.variantes) && jeu.variantes.length > 0) {
    if (typeof jeu.variantes[0] === 'string') {
      avertissements.push(`[${id}] variantes : format v1 détecté (strings). Doit être converti en objets {nom, description, niveau_difficulte}`);
    }
  }

  // Vérifier format enrichi des adaptations (objets avec type/adaptation)
  if (typeof jeu.adaptations_besoins_speciaux === 'string') {
    avertissements.push(`[${id}] adaptations_besoins_speciaux : format v1 détecté (string). Doit être converti en array d'objets {type, adaptation}`);
  }

  // Vérifier niveau_activite
  if (jeu.niveau_activite && !NIVEAUX_ACTIVITE_VALIDES.includes(jeu.niveau_activite)) {
    avertissements.push(`[${id}] niveau_activite "${jeu.niveau_activite}" n'est pas standard. Valeurs acceptées : ${NIVEAUX_ACTIVITE_VALIDES.join(', ')}`);
  }

  // Vérifier champs multilingues (doivent être convertis en strings FR)
  for (const champ of ['titre', 'but_du_jeu', 'intentions_pedagogiques', 'disposition', 'origine']) {
    if (jeu[champ] && typeof jeu[champ] === 'object' && jeu[champ].fr) {
      avertissements.push(`[${id}] ${champ} : format multilingue détecté. Doit être converti en string français simple.`);
    }
  }

  // Vérifier durée inclut explication
  if (jeu.duree && !jeu.duree.includes('explication') && !jeu.duree.includes('min ')) {
    avertissements.push(`[${id}] duree "${jeu.duree}" : devrait préciser le temps d'explication vs temps de jeu`);
  }

  return { erreurs, avertissements };
}

function validateFichier(filepath) {
  const contenu = fs.readFileSync(filepath, 'utf8');
  const data = JSON.parse(contenu);
  const jeux = data.jeux || [];
  const nomFichier = path.basename(filepath);

  let totalErreurs = 0;
  let totalAvertissements = 0;
  let jeuxV2Complets = 0;

  console.log(`\n${'='.repeat(60)}`);
  console.log(`FICHIER : ${nomFichier} (${jeux.length} jeux)`);
  console.log(`${'='.repeat(60)}`);

  // Vérifier enveloppe
  if (!data.schema_version) {
    console.log(`  ⚠️  Pas de schema_version — fichier non migré vers v2`);
  }

  for (const jeu of jeux) {
    const { erreurs, avertissements } = validateJeu(jeu, nomFichier);
    totalErreurs += erreurs.length;
    totalAvertissements += avertissements.length;

    if (erreurs.length === 0 && avertissements.length === 0) {
      jeuxV2Complets++;
    }

    for (const e of erreurs) console.log(`  ❌ ${e}`);
    for (const a of avertissements) console.log(`  ⚠️  ${a}`);
  }

  console.log(`\n  RÉSUMÉ : ${jeuxV2Complets}/${jeux.length} jeux conformes v2 | ${totalErreurs} erreurs | ${totalAvertissements} avertissements`);
  return { total: jeux.length, complets: jeuxV2Complets, erreurs: totalErreurs, avertissements: totalAvertissements };
}

// Main
const args = process.argv.slice(2);
let fichiers;

if (args.length > 0) {
  fichiers = args;
} else {
  const dossier = path.join(__dirname, 'jeux');
  fichiers = fs.readdirSync(dossier)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(dossier, f));
}

let grandTotal = 0, grandComplets = 0, grandErreurs = 0, grandAvertissements = 0;

for (const f of fichiers) {
  const r = validateFichier(f);
  grandTotal += r.total;
  grandComplets += r.complets;
  grandErreurs += r.erreurs;
  grandAvertissements += r.avertissements;
}

console.log(`\n${'#'.repeat(60)}`);
console.log(`TOTAL GLOBAL : ${grandComplets}/${grandTotal} jeux conformes v2`);
console.log(`               ${grandErreurs} erreurs | ${grandAvertissements} avertissements`);
console.log(`${'#'.repeat(60)}\n`);
