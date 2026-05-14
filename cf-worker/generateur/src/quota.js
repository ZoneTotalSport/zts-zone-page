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
