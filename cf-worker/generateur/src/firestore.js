// Firestore REST helpers + Google OAuth via Service Account JWT.
// Pattern réutilisé de zone-subscribers/worker/worker.js (testé en prod).

function b64urlBytes(bytes) {
  const s = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlString(s) {
  return b64urlBytes(new TextEncoder().encode(s));
}

async function importPrivateKey(pem) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\\n/g, "")
    .replace(/\s/g, "");
  const der = Uint8Array.from(atob(body), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8", der.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false, ["sign"]
  );
}

// Cache global (par isolate Worker) — partagé entre requêtes
let tokenCache = { token: null, exp: 0, hits: 0, misses: 0 };

export function getTokenCacheStats() {
  return { hits: tokenCache.hits, misses: tokenCache.misses, cached: !!tokenCache.token };
}

export async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (tokenCache.token && tokenCache.exp > now + 60) {
    tokenCache.hits++;
    return tokenCache.token;
  }
  tokenCache.misses++;

  const saRaw = env.FIREBASE_SERVICE_ACCOUNT;
  if (!saRaw) throw Object.assign(new Error("FIREBASE_SERVICE_ACCOUNT missing"), { code: "CONFIG_MISSING" });
  const sa = typeof saRaw === "string" ? JSON.parse(saRaw) : saRaw;

  const header = { alg: "RS256", typ: "JWT", kid: sa.private_key_id };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64urlString(JSON.stringify(header))}.${b64urlString(JSON.stringify(payload))}`;
  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64urlBytes(sig)}`;

  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!r.ok) {
    const txt = await r.text();
    throw Object.assign(new Error("OAuth Google: " + txt), { code: "OAUTH_ERROR" });
  }
  const data = await r.json();
  tokenCache = {
    token: data.access_token,
    exp: now + (data.expires_in || 3600),
    hits: tokenCache.hits,
    misses: tokenCache.misses,
  };
  return tokenCache.token;
}

// ────────────────────────────────────────────────────────────
// Firestore REST API
// Doc URL : projects/{pid}/databases/(default)/documents/{collection}/{docId}
// ────────────────────────────────────────────────────────────

function docUrl(projectId, path) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
}

// Encode value JS → Firestore typed value
function encodeValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "boolean") return { booleanValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "string") return { stringValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(encodeValue) } };
  if (typeof v === "object") return { mapValue: { fields: encodeFields(v) } };
  return { stringValue: String(v) };
}
function encodeFields(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) out[k] = encodeValue(v);
  return out;
}
function decodeValue(v) {
  if (!v) return null;
  if ("nullValue" in v) return null;
  if ("booleanValue" in v) return v.booleanValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("stringValue" in v) return v.stringValue;
  if ("timestampValue" in v) return new Date(v.timestampValue);
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decodeValue);
  if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
  return null;
}
function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

export async function getDoc(env, path) {
  const token = await getAccessToken(env);
  const r = await fetch(docUrl(env.FIREBASE_PROJECT_ID, path), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 404) return null;
  if (!r.ok) {
    const t = await r.text();
    throw Object.assign(new Error(`Firestore GET ${path}: ${t}`), { code: "FIRESTORE_ERROR" });
  }
  const data = await r.json();
  return { name: data.name, fields: decodeFields(data.fields || {}) };
}

// PATCH avec updateMask = remplace seulement les champs fournis ; crée le doc s'il n'existe pas.
export async function setDoc(env, path, fields) {
  const token = await getAccessToken(env);
  const mask = Object.keys(fields).map(k => `updateMask.fieldPaths=${encodeURIComponent(k)}`).join("&");
  const url = `${docUrl(env.FIREBASE_PROJECT_ID, path)}?${mask}`;
  const r = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields: encodeFields(fields) }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw Object.assign(new Error(`Firestore PATCH ${path}: ${t}`), { code: "FIRESTORE_ERROR" });
  }
  return await r.json();
}

export async function deleteDoc(env, path) {
  const token = await getAccessToken(env);
  const r = await fetch(docUrl(env.FIREBASE_PROJECT_ID, path), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok && r.status !== 404) {
    const t = await r.text();
    throw Object.assign(new Error(`Firestore DELETE ${path}: ${t}`), { code: "FIRESTORE_ERROR" });
  }
  return r.ok;
}

// runQuery via :runQuery — utilisé pour cleanup par préfixe d'ID
export async function listDocsInCollection(env, collection) {
  const token = await getAccessToken(env);
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/${collection}?pageSize=300`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) {
    const t = await r.text();
    throw Object.assign(new Error(`Firestore LIST ${collection}: ${t}`), { code: "FIRESTORE_ERROR" });
  }
  const data = await r.json();
  return (data.documents || []).map(d => ({
    id: d.name.split("/").pop(),
    name: d.name,
    fields: decodeFields(d.fields || {}),
  }));
}
