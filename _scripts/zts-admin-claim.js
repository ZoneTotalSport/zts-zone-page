#!/usr/bin/env node
/**
 * zts-admin-claim.js — pose (ou retire) le custom claim `admin: true`.
 *
 * A lancer UNE fois. Tant qu'il ne l'est pas, firestore.rules et
 * storage.rules acceptent le repli par courriel : rien n'est bloque, mais
 * le claim reste la bonne facon de faire — il survit a un changement
 * d'adresse et ne depend pas d'une chaine ecrite dans deux fichiers.
 *
 * PREALABLE — telecharger une cle de service :
 *   console Firebase → Paramètres du projet → Comptes de service
 *   → « Générer une nouvelle clé privée » → enregistrer hors du depot.
 *
 * ⚠ Ce fichier JSON donne les pleins pouvoirs sur le projet. Il ne doit
 *   JAMAIS entrer dans le depot : _scripts/verifie-secrets.sh le refuserait
 *   au commit, et il aurait raison. Garde-le hors de l'arborescence git.
 *
 * USAGE
 *   npm install firebase-admin           # dans un dossier hors du depot
 *   GOOGLE_APPLICATION_CREDENTIALS=~/cle-zts.json \
 *     node _scripts/zts-admin-claim.js zts@hotmail.ca
 *
 *   # retirer le claim
 *   GOOGLE_APPLICATION_CREDENTIALS=~/cle-zts.json \
 *     node _scripts/zts-admin-claim.js zts@hotmail.ca --retirer
 *
 * Le jeton du navigateur porte encore l'ancien claim pendant au plus une
 * heure. Pour le rafraichir tout de suite : se deconnecter puis se
 * reconnecter sur /admin/fiches.
 */

'use strict';

const admin = require('firebase-admin');

const courriel = process.argv[2];
const retirer = process.argv.includes('--retirer');

if (!courriel) {
  console.error('Usage : node zts-admin-claim.js <courriel> [--retirer]');
  process.exit(1);
}

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('GOOGLE_APPLICATION_CREDENTIALS n’est pas défini — voir l’en-tête du script.');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'zone-total-sport'
});

(async () => {
  try {
    const user = await admin.auth().getUserByEmail(courriel);
    const claims = Object.assign({}, user.customClaims || {});

    if (retirer) delete claims.admin;
    else claims.admin = true;

    await admin.auth().setCustomUserClaims(user.uid, claims);

    const relu = await admin.auth().getUser(user.uid);
    console.log(retirer ? 'Claim retiré.' : 'Claim posé.');
    console.log('  uid    :', relu.uid);
    console.log('  claims :', JSON.stringify(relu.customClaims || {}));
    console.log('\nDéconnecte-toi puis reconnecte-toi sur /admin/fiches pour rafraîchir le jeton.');
  } catch (e) {
    console.error('Échec :', e.message);
    process.exit(1);
  }
})();
