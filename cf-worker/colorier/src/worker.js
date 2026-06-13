// zts-colorier — Worker Cloudflare
// Génère des pages à colorier (line art N&B) via **Cloudflare Workers AI** (Flux),
// avec une **banque d'images partagée** : chaque sujet n'est généré qu'une fois,
// les reprises sont servies depuis le stock (gratuit, instantané).
//
// Routes :
//   POST /generate   { subject } -> { ok, image(dataURL), cached, used, limit }
//   GET  /gallery               -> { ok, items:[{key,subject,ts,url}] }
//   GET  /page?k=<key>          -> l'image (image/jpeg, cache edge, CORS)
//   GET  /health

const ALLOWED_ORIGINS = new Set([
  "https://zonetotalsport.ca",
  "https://www.zonetotalsport.ca",
  "https://ia.zonetotalsport.ca",
  "http://localhost:8000",
  "http://localhost:8011",
  "http://localhost:8787",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:8011",
  "http://127.0.0.1:8787",
]);

let currentOrigin = null;

// Version du prompt/qualité. Bumper ce numéro invalide automatiquement toutes les
// images de la banque générées avec un prompt antérieur (régénérées au prochain
// appel, et masquées de la galerie). Évite tout flush manuel de KV.
const PROMPT_VERSION = "3";

function corsHeaders() {
  const allowed = currentOrigin && ALLOWED_ORIGINS.has(currentOrigin);
  return {
    "Access-Control-Allow-Origin": allowed ? currentOrigin : "https://zonetotalsport.ca",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

function err(code, message, status = 400, extra = {}) {
  return json({ ok: false, code, message, ...extra }, status);
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP")
    || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
    || "0.0.0.0";
}

// ---------- Quota anonyme par IP/jour (anti-abus sur la GÉNÉRATION) ----------
function dayKey(ip) {
  const d = new Date().toISOString().slice(0, 10);
  return `img:${ip}:${d}`;
}
async function readQuota(env, ip) {
  if (!env.ANON_QUOTA) return 0;
  const raw = await env.ANON_QUOTA.get(dayKey(ip));
  return raw ? parseInt(raw, 10) || 0 : 0;
}
async function bumpQuota(env, ip) {
  if (!env.ANON_QUOTA) return;
  const cur = await readQuota(env, ip);
  await env.ANON_QUOTA.put(dayKey(ip), String(cur + 1), { expirationTtl: 60 * 60 * 48 });
}

// ---------- Sujet : nettoyage + clé normalisée (dédup banque) ----------
function cleanSubject(s) {
  if (typeof s !== "string") return "";
  return s.replace(/[\x00-\x1f\x7f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
}
function normKey(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // enlève les accents
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

// Petit garde-fou : on ne PUBLIE pas dans la banque un sujet douteux (l'image
// reste générée pour l'utilisateur, mais n'entre pas dans le stock public).
const BLOCKLIST = ["porn", "nude", "naked", "sex", "nu ", "nue ", "drogue", "drug", "weapon", "arme", "gun", "fusil", "blood", "sang", "kill", "tuer", "suicide", "nazi", "hitler"];
function isPublishable(subject) {
  const low = " " + subject.toLowerCase() + " ";
  return !BLOCKLIST.some((w) => low.includes(w));
}

function dataUrlParts(dataUrl) {
  const m = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!m) return null;
  return { mime: m[1], b64: m[2] };
}
function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// ---------- Génération via Workers AI (Flux, gratuit) ----------
// Prompt très strict : UN seul sujet, comptes exacts, AUCUN doublon — c'est ce
// qui évite les « 3 jambes / 2 ballons » de Flux.
function buildPrompt(subject) {
  return [
    `Children's coloring book page: ONE single simple cartoon LINE DRAWING of ${subject}.`,
    "Draw only ONE of each thing: one child, and if there is a ball draw ONE ball total.",
    "Never repeat or duplicate any object — no second ball, no extra balls, no repeated items",
    "anywhere in the picture. Correct anatomy: one head, two arms, two legs, five fingers per",
    "hand, no extra or missing limbs.",
    "Thick bold clean black outlines on a pure solid white background.",
    "Black outlines ONLY: no shading, no grey, no gradient, no color, no fill.",
    "Simple and friendly, full body, centered, large open areas easy to color.",
    "No text, no words, no watermark. Sport and physical education theme for kids 5 to 12, safe.",
  ].join(" ");
}

async function callImage(env, prompt) {
  const model = env.AI_MODEL || "@cf/black-forest-labs/flux-1-schnell";
  let result;
  try {
    result = await env.AI.run(model, { prompt, steps: 8 });
  } catch (e) {
    throw Object.assign(new Error("workers-ai failed: " + (e?.message || e)), { code: "UPSTREAM" });
  }
  if (result && typeof result.image === "string") return `data:image/jpeg;base64,${result.image}`;
  throw Object.assign(new Error("no image in result"), { code: "NO_IMAGE" });
}

// ---------- Banque d'images ----------
async function bankGet(env, norm) {
  if (!env.PAGES || !norm) return null;
  const got = await env.PAGES.getWithMetadata("page:" + norm, { type: "text" });
  if (!got || !got.value) return null;
  // Image d'une version de prompt antérieure -> on l'ignore (sera régénérée).
  if (!got.metadata || got.metadata.v !== PROMPT_VERSION) return null;
  const mime = got.metadata.mime || "image/jpeg";
  return { dataUrl: `data:${mime};base64,${got.value}`, meta: got.metadata };
}
async function bankPut(env, norm, subject, dataUrl) {
  if (!env.PAGES || !norm) return;
  const parts = dataUrlParts(dataUrl);
  if (!parts) return;
  await env.PAGES.put("page:" + norm, parts.b64, {
    metadata: { subject, ts: Date.now(), mime: parts.mime, v: PROMPT_VERSION },
  });
}

export default {
  async fetch(request, env) {
    currentOrigin = request.headers.get("Origin");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/health") {
      return json({ ok: true, service: "zts-colorier" });
    }

    // --- Route debug : essayer un modèle Workers AI précis ---
    if (request.method === "GET" && url.pathname === "/debug/try" && env.ENVIRONMENT === "debug") {
      const model = url.searchParams.get("model") || "@cf/black-forest-labs/flux-1-schnell";
      const subject = url.searchParams.get("subject") || "un joueur de soccer qui frappe un ballon";
      const promptOverride = url.searchParams.get("prompt");
      try {
        const out = await env.AI.run(model, { prompt: promptOverride || buildPrompt(subject), steps: 8 });
        if (out && typeof out.image === "string") {
          return new Response(b64ToBytes(out.image), { headers: { "Content-Type": "image/jpeg" } });
        }
        return new Response(out, { headers: { "Content-Type": "image/png" } });
      } catch (e) {
        return json({ ok: false, model, error: String(e?.message || e) }, 502);
      }
    }

    // --- Galerie : liste des pages en stock ---
    if (request.method === "GET" && url.pathname === "/gallery") {
      if (!env.PAGES) return json({ ok: true, items: [] });
      const list = await env.PAGES.list({ prefix: "page:", limit: 1000 });
      const base = url.origin;
      const items = list.keys
        .filter((k) => k.metadata && k.metadata.v === PROMPT_VERSION) // que la version courante
        .map((k) => ({
          key: k.name.slice(5),
          subject: (k.metadata && k.metadata.subject) || k.name.slice(5),
          ts: (k.metadata && k.metadata.ts) || 0,
          url: `${base}/page?k=${encodeURIComponent(k.name.slice(5))}`,
        }))
        .sort((a, b) => b.ts - a.ts)
        .slice(0, 120);
      return json({ ok: true, items });
    }

    // --- Service d'une image de la banque (cacheable, CORS pour <img crossorigin>) ---
    if (request.method === "GET" && url.pathname === "/page") {
      const k = url.searchParams.get("k");
      if (!k || !env.PAGES) return err("NOT_FOUND", "Page introuvable.", 404);
      const got = await env.PAGES.getWithMetadata("page:" + k, { type: "text" });
      if (!got || !got.value) return err("NOT_FOUND", "Page introuvable.", 404);
      const mime = (got.metadata && got.metadata.mime) || "image/jpeg";
      return new Response(b64ToBytes(got.value), {
        status: 200,
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=31536000, immutable",
          ...corsHeaders(),
        },
      });
    }

    if (request.method !== "POST" || url.pathname !== "/generate") {
      return err("NOT_FOUND", "Route inconnue.", 404);
    }

    // --- Génération (avec reprise depuis la banque) ---
    let payload;
    try { payload = await request.json(); } catch { return err("BAD_JSON", "Corps de requête invalide."); }

    const subject = cleanSubject(payload?.subject);
    if (!subject || subject.length < 2) {
      return err("BAD_SUBJECT", "Décris ce que tu veux colorier (ex. « joueur de soccer »).");
    }
    const norm = normKey(subject);
    const force = payload?.force === true; // « Autre version » : ignore la banque + écrase

    // 1) Déjà en stock ? -> on ressert (gratuit, ne consomme PAS le quota).
    if (!force) {
      const hit = await bankGet(env, norm);
      if (hit) {
        return json({ ok: true, image: hit.dataUrl, cached: true, subject: hit.meta.subject || subject });
      }
    }

    // 2) Sinon on génère (soumis au quota anti-abus).
    const ip = getClientIp(request);
    const limit = parseInt(env.QUOTA_ANON_DAY || "15", 10);
    const used = await readQuota(env, ip);
    if (used >= limit) {
      return err("QUOTA_EXCEEDED",
        "Limite quotidienne de nouvelles images atteinte. Tu peux quand même piger dans la banque !",
        429, { used, limit });
    }

    try {
      const image = await callImage(env, buildPrompt(subject));
      await bumpQuota(env, ip);
      if (isPublishable(subject)) await bankPut(env, norm, subject, image);
      return json({ ok: true, image, cached: false, used: used + 1, limit });
    } catch (e) {
      const code = e.code || "ERROR";
      const map = {
        CONFIG_MISSING: ["Service mal configuré (clé manquante).", 500],
        TIMEOUT: ["Le dessin a pris trop de temps. Réessaie.", 504],
        UPSTREAM_RATE: ["Trop de demandes en ce moment. Réessaie dans une minute.", 429],
        UPSTREAM: ["Le générateur d'images est occupé. Réessaie dans un instant.", 502],
        NO_IMAGE: ["Impossible de dessiner ce sujet. Essaie une autre description.", 422],
      };
      const [msg, status] = map[code] || ["Une erreur est survenue. Réessaie.", 500];
      return err(code, msg, status, env.ENVIRONMENT === "debug" ? { detail: e?.message } : {});
    }
  },
};
