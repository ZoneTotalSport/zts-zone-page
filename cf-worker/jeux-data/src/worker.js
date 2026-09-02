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
// La source vit dans R2, stockage prive, lu par le binding de ce Worker. Le
// depot garde une copie versionnee dans `_data/` — hors de l'arbre publie par
// Pages — mais PERSONNE ne la sert : c'est ce qui rend le verrou reel plutot
// que decoratif. Residu assume : l'historique git reste clonable (voir
// LOT1-VAGUE-D.md, « residu accepte »). On ferme l'acces commode.

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
  // Une banque « catalogue » : un tableau d'items, chacun avec un corps de
  // valeur. Le patron deux-URL s'y applique naturellement.
  jeux: {
    source: "jeux-merged.json",
    forme: "tableau",
    slugDe: (x) => slugify(x.title),
    // Vague 2, PR A — trois champs ajoutes a la liste publique, et pas un de
    // plus. `apps/jeux` est LIBRE : l'anonyme est le cas normal, pas
    // l'exception. Sans eux, les filtres et les rangees de collections de la
    // PR B ne fonctionneraient que pour un membre connecte.
    //   collections  l'etiquette de rangee — 14 valeurs closes
    //   univers      eps / camps / sdg — 3 valeurs closes
    //   dureeMin     un entier
    // Ce sont des cles d'INDEX, pas du contenu : elles disent ou ranger un
    // jeu, jamais comment il se joue. `materiel` reste volontairement dehors —
    // c'est du texte de fiche, donc de la valeur (voir RAPPORT-COLLECTIONS-JEUX.md).
    liste: ["id", "title", "titleEn", "category", "categoryName", "categoryIcon",
            "categoryColor", "ageMin", "ageMax", "duree", "niveauActivite",
            "collections", "univers", "dureeMin", "materielCat"],
    vitrines: "jeux",
    public: true,
  },

  // sae-all-light n'est PAS un tableau : c'est une carte de 32 categories vers
  // { saes: [...] } (ou un tableau nu selon la categorie). 1880 items au total.
  // On aplatit pour la charge publique, en gardant la categorie sur chaque item
  // — sans elle la liste n'est pas navigable.
  // `tache_complexe` est volontairement HORS de `liste` : c'est du contenu
  // pedagogique, pas un champ d'index.
  sae: {
    source: "sae-all-light.json",
    forme: "carte",
    slugDe: (x) => slugify(x.titre || x.title),
    liste: ["id", "titre", "cycle", "niveau", "duree_periodes", "duree_par_periode",
            "competence_pfeq", "composante", "moyen_action", "espace"],
    vitrines: "sae",
    public: true,
    // Vague C. La banque `sae` est la SEULE dont le contenu ne vit pas dans sa
    // propre source : `sae-all-light.json` ne porte que l'index, la valeur est
    // dans `sae-detail/<categorie>.json`, derriere jeton (servirFichier).
    // Sans ce prefixe, une SAE vitrine serait « ouverte » et pourtant VIDE :
    // l'anonyme recevrait l'item light entier et rien du contenu. On va donc
    // chercher son detail au moment de batir la charge publique.
    detailPrefixe: "sae-detail",
  },

  // PAS DE CHARGE PUBLIQUE, et ce n'est pas un oubli.
  // moyens-action n'est pas une liste d'items : c'est un cube agrege
  // { moyens[10], mois[13], years[9], buckets[1360], top_activities[100] }.
  // Reduire ca a « des champs de liste » n'a aucun sens — il n'y a pas d'item
  // a resumer. Et l'app est DEJA muree (zts-lock-page.js) : aucun anonyme n'y
  // navigue, donc aucune charge publique a servir.
  "moyens-action": {
    source: "moyens-action.json",
    forme: "opaque",
    public: false,
  },

  // Meme raisonnement : l'app planification est muree, ses 7 fichiers sont du
  // contenu complet sans version resumee utile.
  planification: {
    source: "planification/camp.json",   // route par chemin, voir servirFichier
    forme: "opaque",
    public: false,
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
    "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
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

// Les erreurs ne se mettent JAMAIS en cache. Sans ce `no-store`, Cloudflare a
// garde un 405 au bord et l'a resservi apres correction et redeploiement — la
// panne survivait au correctif. Une erreur transitoire (source illisible,
// deploiement en cours) serait sinon servie a tout le monde pendant 24 h.
function err(code, message, status) {
  return json({ ok: false, code, message }, status, { "Cache-Control": "no-store" });
}

// ETag fort, derive du contenu. Sert les 304 : un membre qui recharge le
// planificateur ne retelecharge pas 12 Mo, il recoit 304 et vide son cache.
async function etagDe(texte) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
  const hex = [...new Uint8Array(buf)].slice(0, 16).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `"${hex}"`;
}

// ── Source : R2, et rien d'autre ──
// Un premier essai lisait `raw.githubusercontent.com/<repo>/<ref>/_data/…`.
// Le depot est PUBLIC : `raw` servait donc les 12 Mo a n'importe qui, et l'URL
// etait ecrite en clair dans ce fichier meme, lui aussi public. Le verrou
// n'existait pas. R2 est un stockage prive : c'est ce Worker, et lui seul, qui
// peut lire le bucket — via son binding, sans URL publique.
async function lireSource(env, cle) {
  const objet = await env.BANQUES.get(cle);
  if (!objet) throw new Error(`banque absente de R2 : ${cle}`);
  return objet.text();
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

// La charge publique conserve LA FORME de la source, et ne reduit que la
// richesse des items. C'est une regle, pas un detail : une charge publique de
// forme differente obligerait chaque consommateur a se dedoubler selon qu'il
// est connecte ou non — l'app SAE lit `allData[categorie]`, elle doit lire
// pareil dans les deux cas.
function reduire(item, banque, vitrines) {
  const slug = banque.slugDe(item);
  if (vitrines.has(slug)) return { ...item, _slug: slug, _vitrine: true };
  const out = { _slug: slug };
  for (const champ of banque.liste) if (item[champ] !== undefined) out[champ] = item[champ];
  return out;
}

function construirePublic(brut, banque, slugsVitrine) {
  const vitrines = new Set(slugsVitrine || []);

  if (banque.forme === "tableau") {
    const arr = Array.isArray(brut) ? brut : (brut.jeux || brut.items || []);
    return arr.map((x) => reduire(x, banque, vitrines));
  }

  if (banque.forme === "carte") {
    // { categorie: { saes:[…] } | [ … ] }  ->  meme carte, items reduits.
    const out = {};
    for (const cat of Object.keys(brut)) {
      const v = brut[cat];
      if (Array.isArray(v)) {
        out[cat] = v.map((x) => reduire(x, banque, vitrines));
      } else {
        const clefTab = Object.keys(v).find((k) => Array.isArray(v[k]));
        out[cat] = { ...v };
        if (clefTab) out[cat][clefTab] = v[clefTab].map((x) => reduire(x, banque, vitrines));
      }
    }
    return out;
  }

  return {};
}

// ── Vague C : rendre les SAE vitrine reellement completes ──
// `reduire` a rendu l'item light ENTIER pour une vitrine — mais l'item light
// n'est qu'un index (664 o) : ni `cours`, ni `deroulement`, ni grille. La fiche
// paraitrait ouverte et serait creuse. On lit donc le detail et on le fusionne.
//
// Trois garde-fous, dans cet ordre d'importance :
//  1. `_idx` vient des donnees (verifie sur les 1880 : aucun decalage). On
//     verifie quand meme l'`id` apres coup — un decalage futur publierait la
//     MAUVAISE SAE en clair, ce qui est pire qu'une vitrine vide.
//  2. Un fichier de detail illisible ne fait pas echouer la charge publique :
//     on laisse l'item light. Une banque qui tombe pour trois vitrines serait
//     un mauvais echange.
//  3. Un seul fichier lu par categorie, et seulement si elle porte une vitrine
//     — trois lectures R2 au plus, sur une reponse mise en cache 24 h au bord.
async function enrichirVitrines(objet, env, prefixe) {
  const tableauDe = (v) => {
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      const k = Object.keys(v).find((x) => Array.isArray(v[x]));
      if (k) return v[k];
    }
    return null;
  };

  for (const cat of Object.keys(objet)) {
    const arr = tableauDe(objet[cat]);
    if (!arr) continue;
    if (!arr.some((it) => it && it._vitrine)) continue;   // rien a enrichir ici

    let detail;
    try {
      detail = tableauDe(JSON.parse(await lireSource(env, `${prefixe}/${cat}.json`)));
    } catch (e) {
      console.warn(`[jeux-data] detail vitrine illisible (${cat}):`, e.message);
      continue;
    }
    if (!detail) continue;

    for (const it of arr) {
      if (!it || !it._vitrine || typeof it._idx !== "number") continue;
      let d = detail[it._idx];
      if (!d || d.id !== it.id) {
        d = detail.find((x) => x && x.id === it.id);   // repli : l'id fait foi
        if (d) console.warn(`[jeux-data] _idx decale pour ${it.id} (${cat})`);
      }
      if (d) Object.assign(it, d);
      else console.warn(`[jeux-data] vitrine sans detail : ${it.id} (${cat})`);
    }
  }
}

async function servir(request, env, nomBanque, portee) {
  const banque = BANQUES[nomBanque];
  if (!banque) return err("banque_inconnue", `Banque « ${nomBanque} » inconnue.`, 404);

  if (portee === "public" && banque.public === false) {
    return err("pas_de_charge_publique",
      "Cette banque n'a pas de version publique : l'app qui la consomme est " +
      "deja derriere un mur, et ses donnees ne se resument pas en liste. " +
      "Utiliser /" + nomBanque + "/full.json avec un compte.", 404);
  }

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
    const wl = await lireWhitelist(env);
    const slugs = ((wl.freeItems || {})[banque.vitrines]) || [];
    const objet = construirePublic(JSON.parse(brut), banque, slugs);
    if (banque.detailPrefixe && slugs.length) {
      await enrichirVitrines(objet, env, banque.detailPrefixe);
    }
    corps = JSON.stringify(objet);
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

// Un fichier sous un prefixe R2 : contenu complet, donc jeton obligatoire et
// cache PRIVE. Le nom de fichier est valide par la regex de la route (ni `..`,
// ni `/`) — la cle R2 est donc toujours `<prefixe>/<nom>`, jamais ailleurs.
// C'est cette validation en amont qui rend la concatenation sure.
async function servirFichier(request, env, prefixe, fichier, quoi) {
  const membre = await verifyIdToken(request, env);
  if (!membre) {
    return err("compte_requis",
      `${quoi} demande un compte gratuit.`, 401);
  }

  let corps;
  try {
    corps = await lireSource(env, `${prefixe}/${fichier}`);
  } catch (e) {
    console.error("[jeux-data] fichier illisible:", e.message);
    return err("source_illisible", "Fichier temporairement indisponible.", 502);
  }

  const etag = await etagDe(corps);
  if (request.headers.get("If-None-Match") === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, "Cache-Control": "private, max-age=3600", ...corsHeaders() },
    });
  }
  return json(corps, 200, {
    ETag: etag,
    "Cache-Control": "private, max-age=3600",
    "X-ZTS-Portee": prefixe,
  });
}

export default {
  async fetch(request, env) {
    currentOrigin = request.headers.get("Origin");

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }
    // HEAD est accepte comme GET : c'est ainsi que les caches, les sondes et
    // `curl -I` interrogent une ressource. Le refuser rendait la verification
    // des en-tetes de cache impossible depuis l'exterieur.
    const estHead = request.method === "HEAD";
    if (request.method !== "GET" && !estHead) {
      return err("methode", "GET ou HEAD seulement.", 405);
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true, banques: Object.keys(BANQUES) }, 200);
    }

    // Route par CHEMIN pour les 32 fichiers de sae-detail, appeles un par un
    // par apps/sae/app.js a l'ouverture d'une fiche. Jeton REQUIS : c'est le
    // contenu complet des 1880 SAE, il n'y a pas de version publique a en
    // tirer. La liste, elle, passe par /sae/public.json.
    const d = url.pathname.match(/^\/sae\/detail\/([a-z0-9_-]+\.json)$/i);
    if (d) return servirFichier(request, env, "sae-detail", d[1], "Le detail des SAE");

    // Les 7 fichiers de planification, appeles un par un par l'app. Jeton
    // requis : contenu complet, app deja muree, pas de version resumee utile.
    const pl = url.pathname.match(/^\/planification\/([a-z0-9_.-]+\.json)$/i);
    if (pl) return servirFichier(request, env, "planification", pl[1], "Les planifications");

    const m = url.pathname.match(/^\/([a-z-]+)\/(public|full)\.json$/);
    if (!m) {
      return err("route",
        "Routes : /<banque>/public.json, /<banque>/full.json, /sae/detail/<fichier>.json", 404);
    }
    const rep = await servir(request, env, m[1], m[2]);
    // HEAD : memes en-tetes (dont ETag et Cache-Control), corps vide.
    return estHead ? new Response(null, { status: rep.status, headers: rep.headers }) : rep;
  },
};
