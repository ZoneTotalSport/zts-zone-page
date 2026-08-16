// zts-jeux-data — Worker Cloudflare : les banques de donnees derriere un jeton.
//
// LOT 1, vague D (2026-08-16). Trois fichiers servaient jusqu'ici la totalite
// du contenu a un `curl` anonyme :
//     apps/jeux/data/jeux-merged.json        12,0 Mo   1439 jeux
//     apps/moyens-action/data.json           10,4 Mo
//     apps/sae/data/sae-all-light.json        2,9 Mo   ~1790 SAE
// C'etait le robinet qui donne tout d'un coup : aucun verrou JavaScript ne
// resiste a un telechargement direct. Fermer un robinet sur trois aurait fait
// un verrou decoratif — les trois passent ici.
//
// DEUX URL PAR BANQUE, PAS UNE SEULE QUI VARIE
//   GET /<banque>/public.json   tout le monde   -> vitrine + champs de liste
//   GET /<banque>/full.json     jeton valide    -> la banque entiere
//
// Une seule URL dont le corps depend de `Authorization` imposerait
// `Vary: Authorization`, ce qui aneantit le cache du bord ET risque de servir
// la charge d'un membre a un anonyme si une couche ignore le Vary. Deux URL
// distinctes rendent l'erreur impossible par construction.
//
// CACHE — les membres et le planificateur ne doivent RIEN perdre
//   public.json : `public, max-age=3600, s-maxage=86400` + ETag fort.
//                 Une seule copie au bord, servie a tous. Un anonyme va donc
//                 PLUS VITE qu'avant, ou il tirait 12 Mo depuis l'origine.
//   full.json   : `private, max-age=3600` + ETag. Cache NAVIGATEUR seulement,
//                 jamais le bord. Le planificateur garde sa banque une heure,
//                 et l'ETag rend les rechargements gratuits (304).
//
// La source vit hors de l'arbre publie par GitHub Pages (`_data/`, exclu par
// Jekyll — verifie : /_scripts/… repond 404 en prod). Le Worker la lit via
// GitHub raw, avec cache. C'est ce qui rend le verrou reel plutot que decoratif.

import { verifyIdToken } from "./auth.js";

const ALLOWED_ORIGINS = new Set([
  "https://zonetotalsport.ca",
  "https://www.zonetotalsport.ca",
  "http://localhost:8000",
  "http://localhost:8765",
  "http://localhost:8766",
  "http://localhost:8767",
  "http://localhost:8768",
  "http://localhost:8787",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:8787",
]);

// Registre des banques. `liste` = les champs qu'un anonyme recoit pour CHAQUE
// item : de quoi naviguer, filtrer et avoir envie — jamais de quoi se passer
// d'un compte. La liste reste un outil de vente, les fiches sont la valeur.
const BANQUES = {
  jeux: {
    source: "jeux-merged.json",
    cle: "id",
    slugDe: (x) => slugify(x.title),
    liste: ["id", "title", "titleEn", "category", "categoryName", "categoryIcon",
            "categoryColor", "ageMin", "ageMax", "duree", "niveauActivite"],
    vitrines: "jeux",          // clef dans freeItems
  },
  "moyens-action": {
    source: "moyens-action.json",
    cle: "id",
    slugDe: (x) => slugify(x.titre || x.title || x.nom),
    liste: ["id", "titre", "title", "nom", "categorie", "category", "niveau", "duree"],
    vitrines: "moyensAction",
  },
  sae: {
    source: "sae-all-light.json",
    cle: "id",
    slugDe: (x) => slugify(x.titre || x.title),
    liste: ["id", "titre", "title", "cycle", "categorie", "category", "competence", "duree"],
    vitrines: "sae",
  },
};

function slugify(s) {
  return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}

let currentOrigin = null;

function corsHeaders() {
  const allowed = currentOrigin && ALLOWED_ORIGINS.has(currentOrigin);
  return {
    "Access-Control-Allow-Origin": allowed ? currentOrigin : "https://zonetotalsport.ca",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body, status, extraHeaders) {
  return new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...corsHeaders(),
      ...(extraHeaders || {}),
    },
  });
}

function err(code, message, status) {
  return json({ ok: false, code, message }, status);
}

// ETag fort, derive du contenu. Sert les 304 : un membre qui recharge le
// planificateur ne retelecharge pas 12 Mo, il recoit 304 et vide son cache.
async function etagDe(texte) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  const hex = [...new Uint8Array(buf)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `"${hex}"`;
}

// ── Source : GitHub raw, hors de l'arbre publie ──
// `_data/` n'est pas servi par Pages (Jekyll exclut les dossiers `_`), mais il
// reste dans le depot : le Worker le lit par l'API raw, avec le cache du bord
// devant. Un seul aller-retour par heure et par edge, pas par visiteur.
async function lireSource(env, fichier) {
  const url = `https://raw.githubusercontent.com/${env.GITHUB_REPO}/${env.GITHUB_REF}/_data/${fichier}`;
  const r = await fetch(url, { cf: { cacheTtl: 3600, cacheEverything: true } });
  if (!r.ok) throw new Error(`source ${r.status} ${url}`);
  return r.text();
}

async function lireWhitelist(env) {
  try {
    const r = await fetch("https://zonetotalsport.ca/locked-whitelist.json",
                          { cf: { cacheTtl: 600, cacheEverything: true } });
    if (!r.ok) return {};
    return await r.json();
  } catch (e) {
    // Liste blanche injoignable : on sert la charge publique SANS vitrine
    // plutot que de tout ouvrir. Le defaut sur, c'est moins, jamais plus.
    console.warn("[jeux-data] liste blanche injoignable:", e.message);
    return {};
  }
}

// Charge publique : tous les items reduits aux champs de liste, plus les
// vitrines completes. Le reste du contenu ne sort pas d'ici.
function construirePublic(items, banque, slugsVitrine) {
  const vitrines = new Set(slugsVitrine || []);
  return items.map((x) => {
    const slug = banque.slugDe(x);
    if (vitrines.has(slug)) return { ...x, _slug: slug, _vitrine: true };
    const reduit = { _slug: slug };
    for (const champ of banque.liste) if (x[champ] !== undefined) reduit[champ] = x[champ];
    return reduit;
  });
}

async function servir(request, env, nomBanque, portee) {
  const banque = BANQUES[nomBanque];
  if (!banque) return err("banque_inconnue", `Banque « ${nomBanque} » inconnue.`, 404);

  if (portee === "full") {
    const membre = await verifyIdToken(request, env);
    if (!membre) {
      return err("compte_requis",
        "Cette banque complete demande un compte gratuit. Charge publique : /" +
        nomBanque + "/public.json", 401);
    }
  }

  let brut;
  try {
    brut = await lireSource(env, banque.source);
  } catch (e) {
    console.error("[jeux-data] source illisible:", e.message);
    return err("source_illisible", "Banque temporairement indisponible.", 502);
  }

  let corps;
  if (portee === "full") {
    corps = brut;                                   // tel quel, zero transformation
  } else {
    const items = JSON.parse(brut);
    const liste = Array.isArray(items) ? items : (items.jeux || items.items || []);
    const wl = await lireWhitelist(env);
    const slugs = ((wl.freeItems || {})[banque.vitrines]) || [];
    corps = JSON.stringify(construirePublic(liste, banque, slugs));
  }

  const etag = await etagDe(corps);
  if (request.headers.get("If-None-Match") === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": portee === "full"
          ? "private, max-age=3600"
          : "public, max-age=3600, s-maxage=86400",
        ...corsHeaders(),
      },
    });
  }

  return json(corps, 200, {
    ETag: etag,
    "Cache-Control": portee === "full"
      ? "private, max-age=3600"
      : "public, max-age=3600, s-maxage=86400",
    "X-ZTS-Portee": portee,
  });
}

export default {
  async fetch(request, env) {
    currentOrigin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    if (request.method !== "GET") {
      return err("methode", "GET seulement.", 405);
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true, banques: Object.keys(BANQUES) }, 200);
    }

    const m = url.pathname.match(/^\/([a-z-]+)\/(public|full)\.json$/);
    if (!m) {
      return err("route", "Routes : /<banque>/public.json ou /<banque>/full.json", 404);
    }
    return servir(request, env, m[1], m[2]);
  },
};
