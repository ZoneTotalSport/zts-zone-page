// auth.js — Vérification Firebase ID token (RS256, JWKS Google).
//
// Copié du worker générateur. Renvoie { uid, email } si le header
// Authorization contient un token Firebase valide ; null sinon. Ne lève jamais.
//
// PROJECT_ID lu depuis env.FIREBASE_PROJECT_ID (public, pas un secret).
// Cache JWKS in-memory via globalThis (warm start), TTL 5 min.

import { Auth } from "firebase-auth-cloudflare-workers";

const JWKS_TTL_MS = 5 * 60 * 1000; // 5 min

const memStore = {
  get: async (_key) => {
    const cache = globalThis.__ztsJwksCache;
    if (!cache) return null;
    if (Date.now() - cache.storedAt > JWKS_TTL_MS) return null;
    return cache.value;
  },
  put: async (_key, value, _opts) => {
    globalThis.__ztsJwksCache = { value, storedAt: Date.now() };
  },
};

/**
 * Extrait le token brut du header Authorization: Bearer <jwt>.
 * @returns {string|null}
 */
export function extractBearer(request) {
  const header = request.headers.get("Authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const jwt = match[1].trim();
  return jwt || null;
}

/**
 * Vérifie le header Authorization: Bearer <Firebase ID token>.
 * @returns {Promise<{uid: string, email?: string} | null>}
 */
export async function verifyIdToken(request, env) {
  const jwt = extractBearer(request);
  if (!jwt) return null;

  const projectId = env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    console.error("[auth] FIREBASE_PROJECT_ID manquant dans env");
    return null;
  }

  try {
    const auth = Auth.getOrInitialize(projectId, memStore);
    const decoded = await auth.verifyIdToken(jwt, false);
    if (!decoded || !decoded.uid) {
      console.warn("[auth] Token décodé sans uid");
      return null;
    }
    return { uid: decoded.uid, email: decoded.email };
  } catch (e) {
    console.warn("[auth] Token rejeté:", e?.message || e);
    return null;
  }
}
