// auth.js — Vérification Firebase ID token (RS256, JWKS Google).
//
// Stratégie : tolérante. Renvoie { uid } si le header Authorization contient
// un token Firebase valide ; renvoie null sinon (absent OU invalide). Ne lève
// jamais — un token forgé est traité comme un anonyme (défense en profondeur).
//
// PROJECT_ID lu depuis env.FIREBASE_PROJECT_ID (public, pas un secret).
//
// Cache JWKS : in-memory via globalThis. Workers réutilisent l'isolate entre
// requêtes (warm start), donc les clés publiques Google sont mises en cache
// 5 min. Cold start = 1 fetch HTTP vers Google securetoken (≈50ms).

import { Auth } from "firebase-auth-cloudflare-workers";

const JWKS_TTL_MS = 5 * 60 * 1000; // 5 min

// KeyStorer in-memory minimaliste (interface attendue par la lib).
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
 * Vérifie le header Authorization: Bearer <Firebase ID token>.
 * @returns {Promise<{uid: string, email?: string} | null>}
 */
export async function verifyIdToken(request, env) {
  const header = request.headers.get("Authorization");
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    // Header présent mais malformé : on log, on rejette (anonyme).
    console.warn("[auth] Authorization header malformé");
    return null;
  }
  const jwt = match[1].trim();
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
    // Expired, signature invalide, claims invalides, etc.
    console.warn("[auth] Token rejeté:", e?.message || e);
    return null;
  }
}

/**
 * Helper : log si l'UID du token diffère de body.uid (signal d'usurpation).
 */
export function logUidMismatch(tokenUid, bodyUid, route) {
  if (tokenUid && bodyUid && tokenUid !== bodyUid) {
    console.warn(`[auth][${route}] body.uid="${bodyUid}" ignoré — token.uid="${tokenUid}"`);
  }
}
