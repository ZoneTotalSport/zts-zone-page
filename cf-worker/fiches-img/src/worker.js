// zts-fiches-img — Worker Cloudflare : les images des fiches de jeu, dans R2.
//
// POURQUOI PAS FIREBASE STORAGE (2026-08-17)
// Créer un bucket Firebase exige le forfait Blaze, ce qui bascule TOUT le
// projet en facturé à l'usage — Firestore compris, alors qu'il s'arrête
// aujourd'hui net au quota Spark. Et le palier « Always Free » des buckets
// *.firebasestorage.app ne couvre que US-CENTRAL1/EAST1/WEST1, jamais
// northamerica-northeast1 où vit la base. R2 ne facture aucun trafic sortant.
//
// DEUX CHEMINS DISTINCTS, PAS UNE URL QUI VARIE
//   GET /img/{ficheId}/pub/{fichier}     tout le monde
//   GET /img/{ficheId}/prive/{fichier}   jeton valide requis
//
// C'est le même raisonnement que zts-jeux-data : une URL unique dont le corps
// dépend de `Authorization` imposerait `Vary: Authorization`, ce qui anéantit
// le cache du bord ET risque de servir une image de membre à un anonyme si une
// couche ignore le Vary. Deux chemins rendent l'erreur impossible par
// construction — et le découpage pub/ prive/ existait déjà côté client.
//
// CACHE
//   pub/   `public, max-age=3600, s-maxage=86400` + ETag. Une copie au bord,
//          servie à tous. C'est la vignette de la page 1 et l'image og:.
//   prive/ `private, max-age=3600` + ETag. Cache NAVIGATEUR seulement, jamais
//          le bord. Sans ce `private`, Cloudflare garderait au bord une image
//          obtenue avec un jeton et la resservirait à un anonyme.
//
// ÉCRITURE
//   PUT    /img/{ficheId}/{zone}/{fichier}   admin seulement
//   DELETE /img/{ficheId}/{zone}/{fichier}   admin seulement
// Le DELETE sert au ménage du fichier de l'autre extension : remplacer une
// photo par un détourage fait passer .jpg à .png, et l'ancien resterait
// orphelin dans le bucket (voir commit 49b4bfe côté client).
//
// La validation du PUT reprend celle de storage.rules, qui reste dans le dépôt
// comme documentation du modèle : image/jpeg ou image/png, sous 5 Mio. Le
// client redimensionne déjà à 1600 px, mais un client modifié ne se gêne pas.
//
// Bucket : `zts-fiches`, séparé de `zts-banques`. Les banques sont réécrites
// par la CI à chaque poussée sur main et sont régénérables depuis le dépôt ;
// les rendus DAZ ne le sont pas. Contenu jetable et contenu irremplaçable ne
// partagent pas un bucket.

import { verifyIdToken } from "./auth.js";

const ALLOWED_ORIGINS = new Set([
  "https://zonetotalsport.ca",
  "https://www.zonetotalsport.ca",
  "http://localhost:8000",
  "http://localhost:8765",
  "http://localhost:8787",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:8787",
]);

const TAILLE_MAX = 5 * 1024 * 1024;               // 5 Mio, comme storage.rules
const TYPES = new Set(["image/jpeg", "image/png"]);

// `ficheId` : identifiant Firestore auto-généré (20 caractères alphanumériques).
// La borne large accepte aussi un identifiant posé à la main, mais AUCUN slash
// ni point : c'est ce qui interdit `..` et la sortie du préfixe de la fiche.
const RE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const RE_FICHIER = /^[A-Za-z0-9._-]{1,120}\.(jpg|png)$/i;
const ZONES = new Set(["pub", "prive"]);

let currentOrigin = null;

function corsHeaders() {
  const allowed = currentOrigin && ALLOWED_ORIGINS.has(currentOrigin);
  return {
    "Access-Control-Allow-Origin": allowed ? currentOrigin : "https://zonetotalsport.ca",
    "Access-Control-Allow-Methods": "GET, HEAD, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

// Les erreurs ne se mettent JAMAIS en cache : sans ce `no-store`, un 502
// transitoire (bucket illisible, déploiement en cours) serait servi au bord
// pendant 24 h et survivrait au correctif.
function err(code, message, status) {
  return new Response(JSON.stringify({ ok: false, code, message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(),
    },
  });
}

/** Clé R2 = le `imagePath` stocké dans Firestore, verbatim. */
function cleR2(ficheId, zone, fichier) {
  return `fiches/${ficheId}/${zone}/${fichier}`;
}

function typeDe(fichier) {
  return /\.png$/i.test(fichier) ? "image/png" : "image/jpeg";
}

async function servir(request, env, ficheId, zone, fichier, estHead) {
  if (zone === "prive") {
    const membre = await verifyIdToken(request, env);
    if (!membre) {
      return err(
        "compte_requis",
        "Cette image fait partie du contenu réservé aux membres. " +
          "Seule l'illustration de la page 1 est publique.",
        401
      );
    }
  }

  let objet;
  try {
    objet = await env.FICHES.get(cleR2(ficheId, zone, fichier));
  } catch (e) {
    console.error("[fiches-img] R2 illisible:", e?.message || e);
    return err("source_illisible", "Image temporairement indisponible.", 502);
  }
  if (!objet) return err("introuvable", "Image introuvable.", 404);

  const cache =
    zone === "pub"
      ? "public, max-age=3600, s-maxage=86400"
      : "private, max-age=3600";

  // R2 pose un etag faible (`W/"..."`) sur certains objets ; on le normalise
  // pour que le If-None-Match du navigateur retombe dessus.
  const etag = objet.httpEtag || (objet.etag ? `"${objet.etag}"` : null);

  if (etag && request.headers.get("If-None-Match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": cache, ...corsHeaders() },
    });
  }

  const entetes = {
    "Content-Type": objet.httpMetadata?.contentType || typeDe(fichier),
    "Cache-Control": cache,
    "X-ZTS-Zone": zone,
    ...corsHeaders(),
  };
  if (etag) entetes.ETag = etag;

  return new Response(estHead ? null : objet.body, { status: 200, headers: entetes });
}

async function ecrire(request, env, ficheId, zone, fichier) {
  const membre = await verifyIdToken(request, env);
  if (!membre || !membre.estAdmin) {
    return err("admin_requis", "Écriture réservée à l'administrateur.", 403);
  }

  const type = (request.headers.get("Content-Type") || "").split(";")[0].trim().toLowerCase();
  if (!TYPES.has(type)) {
    return err("type", "Content-Type doit être image/jpeg ou image/png.", 415);
  }
  // L'extension et le Content-Type doivent concorder : sans ça une image
  // servie plus tard prendrait le type déduit du nom et s'afficherait cassée.
  if (typeDe(fichier) !== type) {
    return err("type", `Le nom « ${fichier} » ne correspond pas à ${type}.`, 415);
  }

  // On lit AVANT de mesurer : Content-Length est déclaratif, un client modifié
  // peut mentir. `byteLength` est la taille réelle reçue.
  const corps = await request.arrayBuffer();
  if (corps.byteLength > TAILLE_MAX) {
    return err("taille", "Image au-dessus de 5 Mio.", 413);
  }
  if (corps.byteLength === 0) {
    return err("vide", "Corps vide.", 400);
  }

  try {
    await env.FICHES.put(cleR2(ficheId, zone, fichier), corps, {
      httpMetadata: { contentType: type },
    });
  } catch (e) {
    console.error("[fiches-img] écriture R2 échouée:", e?.message || e);
    return err("ecriture", "Écriture impossible.", 502);
  }

  return new Response(
    JSON.stringify({ ok: true, path: cleR2(ficheId, zone, fichier), taille: corps.byteLength }),
    {
      status: 201,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...corsHeaders(),
      },
    }
  );
}

async function effacer(request, env, ficheId, zone, fichier) {
  const membre = await verifyIdToken(request, env);
  if (!membre || !membre.estAdmin) {
    return err("admin_requis", "Suppression réservée à l'administrateur.", 403);
  }
  try {
    await env.FICHES.delete(cleR2(ficheId, zone, fichier));
  } catch (e) {
    console.error("[fiches-img] suppression R2 échouée:", e?.message || e);
    return err("suppression", "Suppression impossible.", 502);
  }
  // R2 ne distingue pas « supprimé » de « n'existait pas », et c'est très bien :
  // le ménage de l'autre extension appelle ceci sur un fichier absent la
  // plupart du temps.
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store", ...corsHeaders() } });
}

export default {
  async fetch(request, env) {
    currentOrigin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ ok: true, worker: "zts-fiches-img" }), {
        status: 200,
        headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...corsHeaders() },
      });
    }

    const m = url.pathname.match(/^\/img\/([^/]+)\/([^/]+)\/([^/]+)$/);
    if (!m) {
      return err("route", "Route attendue : /img/{ficheId}/{pub|prive}/{fichier}", 404);
    }
    const [, ficheId, zone, fichierBrut] = m;
    let fichier;
    try {
      fichier = decodeURIComponent(fichierBrut);
    } catch (e) {
      return err("chemin", "Nom de fichier mal encodé.", 400);
    }

    if (!RE_ID.test(ficheId) || !ZONES.has(zone) || !RE_FICHIER.test(fichier)) {
      return err("chemin", "Identifiant, zone ou nom de fichier invalide.", 400);
    }

    // HEAD est accepté comme GET : c'est ainsi que les caches, les sondes et
    // `curl -I` interrogent une ressource.
    const estHead = request.method === "HEAD";
    if (request.method === "GET" || estHead) {
      return servir(request, env, ficheId, zone, fichier, estHead);
    }
    if (request.method === "PUT") return ecrire(request, env, ficheId, zone, fichier);
    if (request.method === "DELETE") return effacer(request, env, ficheId, zone, fichier);

    return err("methode", "GET, HEAD, PUT, DELETE ou OPTIONS.", 405);
  },
};
