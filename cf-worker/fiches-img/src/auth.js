// auth.js — Vérification Firebase ID token (RS256, JWKS Google).
//
// DUPLIQUÉ depuis cf-worker/jeux-data/src/auth.js (commit cd4bb89), avec UNE
// différence assumée, signalée plus bas. La duplication est volontaire : chaque
// Worker est une unité de déploiement séparée, avec ses propres node_modules.
// Un import relatif à travers `../../jeux-data/` marcherait au bundling mais
// lierait deux chantiers indépendants — une correction dans LOT 1 partirait en
// production ici sans que personne ne l'ait décidé.
//
// Stratégie : tolérante. Renvoie l'identité si le header Authorization contient
// un token Firebase valide ; renvoie null sinon (absent OU invalide). Ne lève
// jamais — un token forgé est traité comme un anonyme (défense en profondeur).
//
// PROJECT_ID lu depuis env.FIREBASE_PROJECT_ID (public, pas un secret).
//
// Cache JWKS : in-memory via globalThis. Workers réutilisent l'isolate entre
// requêtes (warm start), donc les clés publiques Google sont mises en cache
// 5 min. Cold start = 1 fetch HTTP vers Google securetoken (≈50ms).
//
// ── LA DIFFÉRENCE ──
// jeux-data renvoie { uid, email } : il lui suffit de savoir QU'UN compte
// existe. Ici il faut distinguer un membre d'un ADMIN, parce que le PUT écrit
// dans le bucket. On remonte donc aussi le custom claim `admin`, et l'objet
// porte un `estAdmin` calculé avec EXACTEMENT le même critère que
// firestore.rules — courriel de repli compris, tant que le claim n'est pas posé
// sur le compte. Si ce critère diverge de firestore.rules, le mur a deux
// serrures différentes : c'est une régression.

import { Auth } from "firebase-auth-cloudflare-workers";

const JWKS_TTL_MS = 5 * 60 * 1000; // 5 min

// Doit rester identique à COURRIELS_ADMIN de fiches/zts-fiches-firebase.js et
// à la liste de firestore.rules.
const COURRIELS_ADMIN = ["zts@hotmail.ca"];

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
 * @returns {Promise<{uid: string, email?: string, estAdmin: boolean} | null>}
 */
export async function verifyIdToken(request, env) {
  const header = request.headers.get("Authorization");
  if (!header) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
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
    const email = decoded.email;
    const estAdmin =
      decoded.admin === true ||
      (typeof email === "string" &&
        COURRIELS_ADMIN.indexOf(email.toLowerCase()) !== -1);
    return { uid: decoded.uid, email, estAdmin };
  } catch (e) {
    // Expired, signature invalide, claims invalides, etc.
    console.warn("[auth] Token rejeté:", e?.message || e);
    return null;
  }
}
