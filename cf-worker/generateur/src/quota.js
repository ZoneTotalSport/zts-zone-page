// Quota management : Firestore pour users authentifiés, KV pour anonymes (par IP).
// Collection Firestore : userQuotas/{uid} = { month_key, used, max, updated_at }
// KV key : `anon:{ip}:{month_key}` = "<count>"

import { getDoc, setDoc, listDocsInCollection, deleteDoc } from "./firestore.js";

export function currentMonthKey(d = new Date()) {
  return d.toISOString().slice(0, 7); // "YYYY-MM"
}

// ────────────────────────────────────────────────────────────
// Quota user authentifié (Firestore)
// ────────────────────────────────────────────────────────────

export async function readUserQuota(env, uid) {
  const month = currentMonthKey();
  const max = parseInt(env.QUOTA_FREE_MONTH || "10", 10);
  const doc = await getDoc(env, `userQuotas/${uid}`);
  if (!doc || !doc.fields || doc.fields.month_key !== month) {
    // pas de doc, ou doc d'un mois précédent → reset implicite
    return { uid, month_key: month, used: 0, max, exists: !!doc };
  }
  return {
    uid,
    month_key: doc.fields.month_key,
    used: Number(doc.fields.used || 0),
    max: Number(doc.fields.max || max),
    exists: true,
  };
}

export async function incrementUserQuota(env, uid) {
  const month = currentMonthKey();
  const max = parseInt(env.QUOTA_FREE_MONTH || "10", 10);
  const current = await readUserQuota(env, uid);
  const used = current.used + 1;
  await setDoc(env, `userQuotas/${uid}`, {
    month_key: month,
    used,
    max,
    updated_at: new Date(),
  });
  return { uid, month_key: month, used, max };
}

export async function setUserQuota(env, uid, month_key, used) {
  const max = parseInt(env.QUOTA_FREE_MONTH || "10", 10);
  await setDoc(env, `userQuotas/${uid}`, {
    month_key,
    used,
    max,
    updated_at: new Date(),
  });
  return { uid, month_key, used, max };
}

export async function deleteUserQuota(env, uid) {
  return await deleteDoc(env, `userQuotas/${uid}`);
}

export async function cleanupTestQuotas(env, prefix = "test-user-") {
  const docs = await listDocsInCollection(env, "userQuotas");
  const matches = docs.filter(d => d.id.startsWith(prefix));
  let deleted = 0;
  for (const d of matches) {
    if (await deleteDoc(env, `userQuotas/${d.id}`)) deleted++;
  }
  return { matched: matches.map(d => d.id), deleted };
}

// ────────────────────────────────────────────────────────────
// Quota anonyme (KV par IP)
// ────────────────────────────────────────────────────────────

function anonKey(ip, month) {
  return `anon:${ip}:${month}`;
}

export async function readAnonQuota(env, ip) {
  const month = currentMonthKey();
  const max = parseInt(env.QUOTA_ANON_MONTH || "3", 10);
  const raw = await env.ANON_QUOTA.get(anonKey(ip, month));
  const used = raw ? parseInt(raw, 10) : 0;
  return { ip, month_key: month, used, max };
}

export async function incrementAnonQuota(env, ip) {
  const month = currentMonthKey();
  const max = parseInt(env.QUOTA_ANON_MONTH || "3", 10);
  const key = anonKey(ip, month);
  const raw = await env.ANON_QUOTA.get(key);
  const used = (raw ? parseInt(raw, 10) : 0) + 1;
  // TTL ~40 jours : auto-expire au mois suivant
  await env.ANON_QUOTA.put(key, String(used), { expirationTtl: 60 * 60 * 24 * 40 });
  return { ip, month_key: month, used, max };
}

export async function setAnonQuota(env, ip, month_key, used) {
  const max = parseInt(env.QUOTA_ANON_MONTH || "3", 10);
  await env.ANON_QUOTA.put(anonKey(ip, month_key), String(used), { expirationTtl: 60 * 60 * 24 * 40 });
  return { ip, month_key, used, max };
}

export async function deleteAnonQuota(env, ip, month_key) {
  await env.ANON_QUOTA.delete(anonKey(ip, month_key || currentMonthKey()));
  return true;
}

// ────────────────────────────────────────────────────────────
// Quota de TRANSCRIPTION — en minutes d'audio, par jour, par utilisateur.
//
// POURQUOI DES MINUTES ET NON DES REQUETES. Une rencontre de 90 minutes se
// decoupe en 18 segments de 5 minutes : comptee en requetes, elle vaudrait 18
// et viderait d'un coup n'importe quel plafond raisonnable. C'est la duree
// d'audio qui coute, pas le nombre d'appels.
//
// POURQUOI UN COMPTEUR SEPARE DE CELUI DU GENERATEUR. Les deux fonctions
// partagent le meme compte Cloudflare. Un compteur commun laisserait une
// transcription de 90 minutes assecher le generateur pour la journee — et
// l'inverse. Ils ne doivent jamais se toucher : cle differente, plafond
// different (QUOTA_MINUTES_JOUR contre QUOTA_FREE_MONTH), remise a zero
// different (quotidienne contre mensuelle).
//
// POURQUOI KV ET NON FIRESTORE. Le compteur est ecrit une fois par segment,
// donc jusqu'a 18 fois pour une seule rencontre. KV encaisse ca sans frais
// d'ecriture de document, et une perte de compteur n'est pas grave : le pire
// cas rend quelques minutes a l'usager, il ne perd rien.
//
// La cle vit dans le namespace ANON_QUOTA, sous un prefixe qui lui est propre.
// Aucune collision possible avec `anon:{ip}:{mois}` du generateur.
// ────────────────────────────────────────────────────────────

export function currentDayKey(d = new Date()) {
  return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function transKey(uid, jour) {
  return `renc:${uid}:${jour}`;
}

/** @returns {{uid, jour, minutes, max, restant}} */
export async function readTranscriptionQuota(env, uid) {
  const jour = currentDayKey();
  const max = parseInt(env.QUOTA_MINUTES_JOUR || "120", 10);
  const raw = await env.ANON_QUOTA.get(transKey(uid, jour));
  const minutes = raw ? parseFloat(raw) : 0;
  return { uid, jour, minutes, max, restant: Math.max(0, max - minutes) };
}

/**
 * Debite des minutes APRES une transcription reussie, jamais avant : un
 * segment qui echoue ne doit rien couter a l'usager.
 *
 * Les secondes sont arrondies au dixieme de minute vers le HAUT. Facturer la
 * minute pleine pour un segment de 12 secondes serait faux dans l'autre sens.
 * TTL de 3 jours : la cle s'efface d'elle-meme, aucun menage a faire.
 */
export async function debitTranscription(env, uid, secondes) {
  const jour = currentDayKey();
  const max = parseInt(env.QUOTA_MINUTES_JOUR || "120", 10);
  const key = transKey(uid, jour);
  const raw = await env.ANON_QUOTA.get(key);
  const avant = raw ? parseFloat(raw) : 0;
  const ajout = Math.ceil((Number(secondes) || 0) / 6) / 10;
  const minutes = Math.round((avant + ajout) * 10) / 10;
  await env.ANON_QUOTA.put(key, String(minutes), { expirationTtl: 60 * 60 * 24 * 3 });
  return { uid, jour, minutes, max, restant: Math.max(0, max - minutes) };
}
