// zts-generateur — Worker Cloudflare
// Commit #3 : quota Firestore (users authentifiés) + KV anonyme (par IP).

import Anthropic from "@anthropic-ai/sdk";
import { SCHEMAS } from "./schemas.js";
import { buildSystemPrompt } from "./prompts.js";
import {
  readUserQuota, incrementUserQuota, setUserQuota, cleanupTestQuotas,
  readAnonQuota, incrementAnonQuota, setAnonQuota, deleteAnonQuota,
  currentMonthKey,
} from "./quota.js";
import {
  getTokenCacheStats, addDoc, getDoc, setDoc, deleteDoc, queryCollection, listDocsInCollection,
  getAccessToken,
} from "./firestore.js";
import { verifyIdToken, logUidMismatch } from "./auth.js";

// CORS — whitelist stricte. `*` retiré pour bloquer les appels cross-origin
// depuis des sites tiers. Le worker isole chaque requête, donc la variable
// module-scope `currentOrigin` est safe (réinitialisée à chaque fetch).
const ALLOWED_ORIGINS = new Set([
  "https://zonetotalsport.ca",
  "https://www.zonetotalsport.ca",
  "https://ia.zonetotalsport.ca",
  "https://www.ia.zonetotalsport.ca",
  "http://localhost:8000",
  "http://localhost:8787",
  "http://127.0.0.1:8000",
  "http://127.0.0.1:8787",
]);

let currentOrigin = null;

function corsHeaders() {
  const allowed = currentOrigin && ALLOWED_ORIGINS.has(currentOrigin);
  return {
    "Access-Control-Allow-Origin": allowed ? currentOrigin : "https://zonetotalsport.ca",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

const VALID_TYPES = ["jeu", "sae", "educatif"];
const VALID_UNIVERS = ["eps", "camps", "sdg"];
const VALID_MODELS = ["haiku", "sonnet"];

const TIMEOUT_MS = 30000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders() },
  });
}

function err(code, message, status = 400, extra = {}) {
  return json({ ok: false, code, message, ...extra }, status);
}

function resolveModel(modele, env) {
  return modele === "sonnet" ? env.SONNET_MODEL : env.DEFAULT_MODEL;
}

function extractJson(text) {
  try { return JSON.parse(text); } catch {}
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try { return JSON.parse(fenced[1]); } catch {}
  }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try { return JSON.parse(text.slice(first, last + 1)); } catch {}
  }
  return null;
}

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP")
    || request.headers.get("X-Forwarded-For")?.split(",")[0]?.trim()
    || "0.0.0.0";
}

async function callAnthropic(client, model, systemPrompt, userMsg, maxTokens) {
  return await client.messages.create({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: userMsg }],
  });
}

async function generate({ type, univers, contexte, modele, env }) {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("ANTHROPIC_API_KEY missing"), { code: "CONFIG_MISSING" });
  }

  const client = new Anthropic({ apiKey });
  const model = resolveModel(modele, env);
  const maxTokens = parseInt(env.MAX_OUTPUT_TOKENS || "2000", 10);
  const schema = SCHEMAS[type];
  const systemPrompt = buildSystemPrompt(type, univers, schema);

  const userMsg = contexte && contexte.trim()
    ? `Contexte fourni par l'utilisateur :\n${contexte.trim()}\n\nGénère maintenant le JSON.`
    : `Aucun contexte spécifique fourni — génère un contenu polyvalent et utile.\n\nGénère maintenant le JSON.`;

  let resp;
  try {
    resp = await Promise.race([
      callAnthropic(client, model, systemPrompt, userMsg, maxTokens),
      new Promise((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), TIMEOUT_MS)
      ),
    ]);
  } catch (e) {
    const status = e?.status || e?.response?.status;
    if (e.code === "TIMEOUT") throw e;
    if (status === 429 || (status >= 500 && status < 600)) {
      await new Promise((r) => setTimeout(r, 2000));
      try {
        resp = await Promise.race([
          callAnthropic(client, model, systemPrompt, userMsg, maxTokens),
          new Promise((_, reject) =>
            setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), TIMEOUT_MS)
          ),
        ]);
      } catch (e2) {
        throw Object.assign(new Error("Anthropic indisponible"), { code: "ANTHROPIC_DOWN", upstream: e2.message });
      }
    } else {
      throw Object.assign(new Error(e.message || "Anthropic error"), { code: "ANTHROPIC_DOWN", upstream: e.message });
    }
  }

  const text = resp.content?.[0]?.text || "";
  let data = extractJson(text);

  if (!data) {
    const retryMsg = `${userMsg}\n\nIMPORTANT : ta réponse précédente n'était pas du JSON valide. Renvoie UNIQUEMENT le JSON brut, sans markdown, sans backticks, sans texte autour. Le tout premier caractère doit être { et le dernier doit être }.`;
    try {
      const retry = await Promise.race([
        callAnthropic(client, model, systemPrompt, retryMsg, maxTokens),
        new Promise((_, reject) =>
          setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), TIMEOUT_MS)
        ),
      ]);
      const retryText = retry.content?.[0]?.text || "";
      data = extractJson(retryText);
      if (!data) {
        throw Object.assign(new Error("Réponse non parsable même après retry"), {
          code: "PARSE_ERROR",
          raw_preview: retryText.slice(0, 200),
        });
      }
      resp.usage = {
        input_tokens: (resp.usage?.input_tokens || 0) + (retry.usage?.input_tokens || 0),
        output_tokens: (resp.usage?.output_tokens || 0) + (retry.usage?.output_tokens || 0),
      };
    } catch (e) {
      if (e.code === "PARSE_ERROR") throw e;
      throw Object.assign(new Error(e.message), { code: "PARSE_ERROR", raw_preview: text.slice(0, 200) });
    }
  }

  return {
    data,
    model_used: model,
    tokens: {
      input: resp.usage?.input_tokens || 0,
      output: resp.usage?.output_tokens || 0,
    },
  };
}

// ────────────────────────────────────────────────────────────
// Handler /generate avec gates de quota
// ────────────────────────────────────────────────────────────

async function handleGenerate(request, env) {
  // Identity : token Firebase validé en priorité absolue.
  // body.uid n'est JAMAIS lu pour identifier le user dans /generate.
  const verified = await verifyIdToken(request, env);

  let body;
  try {
    body = await request.json();
  } catch {
    return err("INVALID_INPUT", "Body JSON malformé");
  }

  const { type, univers, contexte = "", modele = "haiku" } = body || {};
  logUidMismatch(verified?.uid, body?.uid, "/generate");
  const uid = verified?.uid || null;

  if (!VALID_TYPES.includes(type)) return err("INVALID_INPUT", `type doit être ${VALID_TYPES.join("|")}`);
  if (!VALID_UNIVERS.includes(univers)) return err("INVALID_INPUT", `univers doit être ${VALID_UNIVERS.join("|")}`);
  if (!VALID_MODELS.includes(modele)) return err("INVALID_INPUT", `modele doit être ${VALID_MODELS.join("|")}`);
  if (typeof contexte !== "string" || contexte.length > 1000) {
    return err("INVALID_INPUT", "contexte doit être une string ≤ 1000 chars");
  }

  // Gate quota AVANT appel Anthropic
  let quotaInfo;
  const ip = getClientIp(request);
  try {
    if (uid) {
      const q = await readUserQuota(env, uid);
      if (q.used >= q.max) {
        return err("QUOTA_EXCEEDED", `Tu as atteint ta limite mensuelle (${q.used}/${q.max}). Réessaye le mois prochain.`, 429, {
          quota: { scope: "user", uid, month_key: q.month_key, used: q.used, max: q.max },
        });
      }
      quotaInfo = { scope: "user", uid, month_key: q.month_key, before: q.used, max: q.max };
    } else {
      const q = await readAnonQuota(env, ip);
      if (q.used >= q.max) {
        return err("QUOTA_EXCEEDED", `Limite anonyme atteinte (${q.used}/${q.max}). Crée un compte gratuit pour ${env.QUOTA_FREE_MONTH} générations/mois.`, 429, {
          quota: { scope: "anon", month_key: q.month_key, used: q.used, max: q.max },
        });
      }
      quotaInfo = { scope: "anon", month_key: q.month_key, before: q.used, max: q.max };
    }
  } catch (e) {
    return err(e.code || "QUOTA_ERROR", "Impossible de vérifier le quota : " + e.message, 500);
  }

  try {
    const { data, model_used, tokens } = await generate({ type, univers, contexte, modele, env });

    // Increment quota APRÈS succès Anthropic
    let quotaAfter;
    try {
      quotaAfter = uid
        ? await incrementUserQuota(env, uid)
        : await incrementAnonQuota(env, ip);
    } catch (e) {
      console.warn("Quota increment failed:", e.message);
      quotaAfter = { used: quotaInfo.before + 1, max: quotaInfo.max, month_key: quotaInfo.month_key };
    }

    const date_generation = new Date().toISOString();
    const fiche = {
      id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      univers,
      date_generation,
      ...data,
    };

    // Sauvegarde Firestore si user authentifié — non bloquante
    let generationId = null;
    if (uid) {
      try {
        const doc = await addDoc(env, "generations", {
          uid,
          type,
          univers,
          contexte: contexte || "",
          modele,
          modele_utilise: model_used,
          data: fiche,
          favori: false,
          migrated_from_anon: false,
          tokens_input: tokens.input,
          tokens_output: tokens.output,
          date_generation: new Date(date_generation),
        });
        generationId = doc.id;
      } catch (e) {
        console.warn("Firestore save failed:", e.message);
      }
    }

    return json({
      ok: true,
      type,
      univers,
      modele_utilise: model_used,
      tokens,
      generationId,
      quota: {
        scope: quotaInfo.scope,
        used: quotaAfter.used,
        max: quotaAfter.max,
        month_key: quotaAfter.month_key,
      },
      data: fiche,
    });
  } catch (e) {
    const code = e.code || "INTERNAL";
    const status = code === "TIMEOUT" ? 504
      : code === "ANTHROPIC_DOWN" ? 502
      : code === "PARSE_ERROR" ? 502
      : code === "CONFIG_MISSING" ? 500
      : 500;
    const messages = {
      TIMEOUT: "La génération a pris trop de temps. Réessaye.",
      ANTHROPIC_DOWN: "Le service IA est temporairement indisponible. Réessaye dans quelques instants.",
      PARSE_ERROR: "Le modèle a renvoyé une réponse non conforme. Réessaye.",
      CONFIG_MISSING: "Configuration serveur incomplète (admin).",
    };
    const extra = {};
    if (e.raw_preview) extra.raw_preview = e.raw_preview;
    if (e.upstream) extra.upstream = e.upstream;
    return err(code, messages[code] || "Erreur interne", status, extra);
  }
}

// ────────────────────────────────────────────────────────────
// Endpoints "generations" — liste, favori, migration anon
// ⚠️ TRUST UID DU BODY (sécurité minimale pour ce commit).
// Voir DETTE TECHNIQUE dans message commit #5.
// ────────────────────────────────────────────────────────────

function sanitizeFiche(fields) {
  // Convertit un doc Firestore décodé en payload front-friendly
  const id = fields.__id;
  const d = fields.data || {};
  return {
    id,
    type: fields.type,
    univers: fields.univers,
    titre: d.titre || d.nom || "Sans titre",
    favori: !!fields.favori,
    date_generation: fields.date_generation instanceof Date
      ? fields.date_generation.toISOString()
      : (fields.date_generation || null),
    migrated_from_anon: !!fields.migrated_from_anon,
    modele_utilise: fields.modele_utilise || null,
    data: d,
  };
}

async function handleListGenerations(url, request, env) {
  // C2 strict : token Firebase obligatoire. ?uid= n'est plus accepté.
  const verified = await verifyIdToken(request, env);
  if (!verified?.uid) {
    return err("UNAUTHORIZED", "Authentification requise (Firebase ID token)", 401);
  }
  const queryUid = url.searchParams.get("uid");
  logUidMismatch(verified.uid, queryUid, "/generations");
  const uid = verified.uid;
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10)), 50);
  // Query par uid uniquement (pas d'orderBy pour éviter besoin d'index composite).
  // Tri par date_generation desc côté worker — acceptable pour ≤50 gens/user.
  const docs = await queryCollection(env, "generations", {
    whereField: "uid",
    whereValue: uid,
    limit: 200,
  });
  docs.sort((a, b) => {
    const da = a.fields.date_generation;
    const db = b.fields.date_generation;
    const ta = da instanceof Date ? da.getTime() : new Date(da || 0).getTime();
    const tb = db instanceof Date ? db.getTime() : new Date(db || 0).getTime();
    return tb - ta;
  });
  const out = docs.slice(0, limit).map(d => sanitizeFiche({ ...d.fields, __id: d.id }));
  return json({ ok: true, count: out.length, total: docs.length, generations: out });
}

async function handleToggleFavori(genId, request, env) {
  if (!genId || !/^[a-zA-Z0-9_-]{1,80}$/.test(genId)) {
    return err("INVALID_INPUT", "ID génération invalide");
  }
  const verified = await verifyIdToken(request, env);
  if (!verified?.uid) {
    return err("UNAUTHORIZED", "Authentification requise (Firebase ID token)", 401);
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.favori !== "boolean") {
    return err("INVALID_INPUT", "body: { favori: bool }");
  }
  logUidMismatch(verified.uid, body.uid, "/generation/:id/favori");
  const uid = verified.uid;
  const doc = await getDoc(env, `generations/${genId}`);
  if (!doc) return err("NOT_FOUND", "Génération introuvable", 404);
  if (doc.fields.uid !== uid) {
    return err("FORBIDDEN", "Cette génération n'appartient pas à cet uid", 403);
  }
  await setDoc(env, `generations/${genId}`, { favori: body.favori });
  return json({ ok: true, id: genId, favori: body.favori });
}

async function handleMigrateAnon(request, env) {
  const verified = await verifyIdToken(request, env);
  if (!verified?.uid) {
    return err("UNAUTHORIZED", "Authentification requise (Firebase ID token)", 401);
  }
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.generations)) {
    return err("INVALID_INPUT", "body: { generations: [...] }");
  }
  logUidMismatch(verified.uid, body.uid, "/migrate-anon-generation");
  const uid = verified.uid;
  if (body.generations.length === 0) {
    return json({ ok: true, migrated: [], failed: [] });
  }
  if (body.generations.length > 12) {
    return err("INVALID_INPUT", "Max 12 entrées par appel");
  }

  const migrated = [];
  const failed = [];
  for (let i = 0; i < body.generations.length; i++) {
    const g = body.generations[i];
    try {
      if (!g || typeof g !== "object") throw new Error("entrée non-objet");
      if (!["jeu", "sae", "educatif"].includes(g.type)) throw new Error("type invalide");
      if (!["eps", "camps", "sdg"].includes(g.univers)) throw new Error("univers invalide");
      if (!g.data || typeof g.data !== "object") throw new Error("data manquante");
      const dateGen = g.date_generation ? new Date(g.date_generation) : new Date();
      const doc = await addDoc(env, "generations", {
        uid,
        type: g.type,
        univers: g.univers,
        contexte: g.contexte || "",
        modele: g.modele || "haiku",
        modele_utilise: g.modele_utilise || null,
        data: g.data,
        favori: !!g.favori,
        migrated_from_anon: true,
        date_generation: dateGen,
      });
      migrated.push(doc.id);
    } catch (e) {
      failed.push({ index: i, reason: e.message });
    }
  }
  return json({ ok: true, migrated, failed });
}

async function handleUpdateGenerationData(genId, request, env) {
  if (!genId || !/^[a-zA-Z0-9_-]{1,80}$/.test(genId)) {
    return err("INVALID_INPUT", "ID génération invalide");
  }
  const verified = await verifyIdToken(request, env);
  if (!verified?.uid) {
    return err("UNAUTHORIZED", "Authentification requise (Firebase ID token)", 401);
  }
  const body = await request.json().catch(() => null);
  if (!body || !body.data || typeof body.data !== "object") {
    return err("INVALID_INPUT", "body: { data }");
  }
  logUidMismatch(verified.uid, body.uid, "/generation/:id PATCH");
  const uid = verified.uid;
  const doc = await getDoc(env, `generations/${genId}`);
  if (!doc) return err("NOT_FOUND", "Génération introuvable", 404);
  if (doc.fields.uid !== uid) {
    return err("FORBIDDEN", "Cette génération n'appartient pas à cet uid", 403);
  }
  await setDoc(env, `generations/${genId}`, { data: body.data, edited: true, edited_at: new Date() });
  return json({ ok: true, id: genId, edited: true });
}

async function handleDeleteGeneration(genId, request, env) {
  if (!genId || !/^[a-zA-Z0-9_-]{1,80}$/.test(genId)) {
    return err("INVALID_INPUT", "ID génération invalide");
  }
  const verified = await verifyIdToken(request, env);
  if (!verified?.uid) {
    return err("UNAUTHORIZED", "Authentification requise (Firebase ID token)", 401);
  }
  const body = await request.json().catch(() => ({}));
  logUidMismatch(verified.uid, body?.uid, "/generation/:id DELETE");
  const uid = verified.uid;
  const doc = await getDoc(env, `generations/${genId}`);
  if (!doc) return err("NOT_FOUND", "Génération introuvable", 404);
  if (doc.fields.uid !== uid) {
    return err("FORBIDDEN", "Cette génération n'appartient pas à cet uid", 403);
  }
  await deleteDoc(env, `generations/${genId}`);
  return json({ ok: true, id: genId, deleted: true });
}

// ────────────────────────────────────────────────────────────
// Debug endpoints (dev only, gated by ENVIRONMENT === "dev")
// ────────────────────────────────────────────────────────────

async function handleDebug(url, request, env) {
  if (env.ENVIRONMENT !== "dev") return err("NOT_FOUND", "Endpoint inconnu", 404);

  const path = url.pathname.replace(/^\/debug\//, "");

  if (path === "setQuota" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || !body.uid || !body.month_key || typeof body.used !== "number") {
      return err("INVALID_INPUT", "body: { uid, month_key, used }");
    }
    const r = await setUserQuota(env, body.uid, body.month_key, body.used);
    return json({ ok: true, action: "setQuota", ...r });
  }

  if (path === "getQuota" && request.method === "GET") {
    const uid = url.searchParams.get("uid");
    const ip = url.searchParams.get("ip");
    if (uid) return json({ ok: true, scope: "user", quota: await readUserQuota(env, uid) });
    if (ip) return json({ ok: true, scope: "anon", quota: await readAnonQuota(env, ip) });
    return err("INVALID_INPUT", "?uid=... ou ?ip=...");
  }

  if (path === "setAnonQuota" && request.method === "POST") {
    const body = await request.json().catch(() => null);
    if (!body || !body.ip || !body.month_key || typeof body.used !== "number") {
      return err("INVALID_INPUT", "body: { ip, month_key, used }");
    }
    const r = await setAnonQuota(env, body.ip, body.month_key, body.used);
    return json({ ok: true, action: "setAnonQuota", ...r });
  }

  if (path === "cleanup" && request.method === "POST") {
    const body = await request.json().catch(() => ({}));
    const prefix = body?.prefix || "test-user-";
    const r = await cleanupTestQuotas(env, prefix);
    if (body?.anonIp) await deleteAnonQuota(env, body.anonIp, body.month_key);
    // Cleanup aussi les generations dont uid commence par le préfixe
    const allGens = await listDocsInCollection(env, "generations");
    const matchingGens = allGens.filter(d => d.fields.uid && String(d.fields.uid).startsWith(prefix));
    let deletedGens = 0;
    for (const g of matchingGens) {
      try { if (await deleteDoc(env, `generations/${g.id}`)) deletedGens++; } catch {}
    }
    return json({ ok: true, action: "cleanup", ...r, generations_deleted: deletedGens });
  }

  if (path === "getDoc" && request.method === "GET") {
    const docPath = url.searchParams.get("path");
    if (!docPath) return err("INVALID_INPUT", "?path=collection/docId");
    const doc = await getDoc(env, docPath);
    return json({ ok: true, doc });
  }

  if (path === "listGenerations" && request.method === "GET") {
    const uid = url.searchParams.get("uid");
    if (!uid) return err("INVALID_INPUT", "?uid=...");
    const all = await listDocsInCollection(env, "generations");
    const mine = all.filter(d => d.fields.uid === uid);
    return json({ ok: true, count: mine.length, docs: mine.map(d => ({ id: d.id, fields: d.fields })) });
  }

  if (path === "seedGenerations" && request.method === "POST") {
    // Pour TEST 10 : insère N docs de test rapidement
    const body = await request.json().catch(() => null);
    if (!body || !body.uid || typeof body.count !== "number") {
      return err("INVALID_INPUT", "body: { uid, count, type?, univers? }");
    }
    const ids = [];
    const baseTime = Date.now();
    for (let i = 0; i < Math.min(body.count, 30); i++) {
      const doc = await addDoc(env, "generations", {
        uid: body.uid,
        type: body.type || "jeu",
        univers: body.univers || "eps",
        contexte: "",
        modele: "haiku",
        modele_utilise: "test",
        data: { id: `seed-${i}`, type: body.type || "jeu", univers: body.univers || "eps", titre: `Seed #${i + 1}` },
        favori: false,
        migrated_from_anon: false,
        date_generation: new Date(baseTime - i * 60000),
      });
      ids.push(doc.id);
    }
    return json({ ok: true, seeded: ids });
  }

  if (path === "tokenCache" && request.method === "GET") {
    return json({ ok: true, ...getTokenCacheStats(), month_key: currentMonthKey() });
  }

  return err("NOT_FOUND", `Debug endpoint inconnu: ${path}`, 404);
}

// ────────────────────────────────────────────────────────────
// Router
// ────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────
// /nutrition — estimation calories/macros d'un repas décrit en texte.
// Usage : app /entrainement (journal alimentaire). Auth Firebase requise.
// ────────────────────────────────────────────────────────────
async function handleNutrition(request, env) {
  const verified = await verifyIdToken(request, env);
  if (!verified?.uid) return err("UNAUTHORIZED", "Connexion requise", 401);

  let body;
  try { body = await request.json(); } catch { return err("INVALID_INPUT", "Body JSON malformé"); }
  const text = (body?.text || "").toString().trim();
  if (!text) return err("INVALID_INPUT", "text requis");
  if (text.length > 500) return err("INVALID_INPUT", "text ≤ 500 caractères");

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return err("CONFIG_MISSING", "ANTHROPIC_API_KEY manquante", 500);

  const client = new Anthropic({ apiKey });
  const system = `Tu es un nutritionniste. On te décrit un repas (français québécois). Estime les calories et macronutriments.
Réponds UNIQUEMENT avec un objet JSON valide, sans aucun texte autour, au format exact :
{"items":[{"name":"...","kcal":0,"protein":0,"carbs":0,"fat":0}]}
- Un item par aliment distinct du repas.
- kcal = calories estimées pour la portion décrite (nombre entier).
- protein, carbs, fat = grammes estimés (nombres).
- Si la portion n'est pas précisée, suppose une portion normale réaliste.`;

  let resp;
  try {
    resp = await Promise.race([
      callAnthropic(client, env.DEFAULT_MODEL, system, text, 700),
      new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), TIMEOUT_MS)),
    ]);
  } catch (e) {
    return err(e.code || "AI_ERROR", "Échec IA : " + e.message, 502);
  }

  const items = normFoodItems(extractJson(resp?.content?.[0]?.text || ""));
  return json({ ok: true, items });
}

// ────────────────────────────────────────────────────────────
// /steps — ingestion des pas depuis l'iPhone (Raccourci iOS lisant Santé).
// Auth = secret partagé (env.STEPS_KEY), pas de token Firebase (Shortcuts
// ne peut pas s'authentifier Firebase). Écrit users/<JOEY_UID>.days.<date>.steps
// via un PATCH cible (updateMask sur la feuille -> ne touche rien d'autre).
// ────────────────────────────────────────────────────────────
const ENTRAINEMENT_UID = "UG2F0lsClOdyzB5fcuSzX2kW7Gu2";
async function handleSteps(request, env) {
  let body;
  try { body = await request.json(); } catch { return err("INVALID_INPUT", "Body JSON malformé"); }
  const key = request.headers.get("X-Steps-Key") || body?.key || "";
  if (!env.STEPS_KEY || key !== env.STEPS_KEY) return err("UNAUTHORIZED", "Clé invalide", 401);

  const steps = Math.max(0, Math.round(+body?.steps || 0));
  if (!steps) return err("INVALID_INPUT", "steps requis (> 0)");

  let date = (body?.date || "").toString().trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const d = new Date();
    date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  }

  const token = await getAccessToken(env);
  const url = `https://firestore.googleapis.com/v1/projects/${env.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${ENTRAINEMENT_UID}`
    + `?updateMask.fieldPaths=${encodeURIComponent("days.`" + date + "`.steps")}`;
  const fsBody = { fields: { days: { mapValue: { fields: { [date]: { mapValue: { fields: { steps: { integerValue: String(steps) } } } } } } } } };
  const r = await fetch(url, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(fsBody),
  });
  if (!r.ok) {
    const t = await r.text();
    return err("FIRESTORE_ERROR", `Écriture pas échouée : ${t}`, 502);
  }
  return json({ ok: true, date, steps });
}

// Normalise les items {name,kcal,protein,carbs,fat} renvoyés par l'IA.
function round1(x) { const n = +x; return isFinite(n) ? Math.round(n * 10) / 10 : 0; }
function normFoodItems(parsed) {
  return Array.isArray(parsed?.items) ? parsed.items.map((it) => ({
    name: String(it.name || it.aliment || "Aliment").slice(0, 80),
    kcal: Math.max(0, Math.round(+it.kcal || +it.calories || 0)),
    protein: Math.max(0, round1(it.protein ?? it.prot ?? 0)),
    carbs: Math.max(0, round1(it.carbs ?? it.glucides ?? 0)),
    fat: Math.max(0, round1(it.fat ?? it.lipides ?? 0)),
  })) : [];
}

// ────────────────────────────────────────────────────────────
// /food-search — recherche dans Open Food Facts (banque d'aliments).
// Renvoie des aliments avec macros POUR 100 g. Auth Firebase requise.
// ────────────────────────────────────────────────────────────
async function handleFoodSearch(request, env) {
  const verified = await verifyIdToken(request, env);
  if (!verified?.uid) return err("UNAUTHORIZED", "Connexion requise", 401);
  const url = new URL(request.url);
  const q = (url.searchParams.get("q") || "").trim();
  if (!q) return err("INVALID_INPUT", "q requis");
  if (q.length > 80) return err("INVALID_INPUT", "q trop long");

  const off = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}`
    + `&search_simple=1&action=process&json=1&page_size=20`
    + `&fields=product_name,product_name_fr,brands,nutriments,serving_size`;
  let r;
  try {
    r = await Promise.race([
      fetch(off, { headers: { "User-Agent": "ZoneTotalSport-Entrainement/1.0 (zts@hotmail.ca)" } }),
      new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), 12000)),
    ]);
  } catch (e) { return err("OFF_ERROR", "Recherche indisponible : " + e.message, 502); }
  if (!r.ok) return err("OFF_ERROR", "Recherche indisponible (" + r.status + ")", 502);

  const data = await r.json();
  const items = (data.products || []).map((p) => {
    const n = p.nutriments || {};
    const name = [(p.product_name_fr || p.product_name), p.brands].filter(Boolean).join(" · ").slice(0, 90);
    const kcal = n["energy-kcal_100g"] != null ? Math.round(n["energy-kcal_100g"])
      : (n["energy-kcal"] != null ? Math.round(n["energy-kcal"]) : null);
    if (!name || kcal == null) return null;
    return {
      name, per: 100, unit: "g", kcal,
      protein: round1(n.proteins_100g), carbs: round1(n.carbohydrates_100g), fat: round1(n.fat_100g),
      serving: p.serving_size || null,
    };
  }).filter(Boolean).slice(0, 15);
  return json({ ok: true, items });
}

// ────────────────────────────────────────────────────────────
// /nutrition-photo — analyse une PHOTO de plat (Claude vision) -> macros.
// ────────────────────────────────────────────────────────────
async function handleNutritionPhoto(request, env) {
  const verified = await verifyIdToken(request, env);
  if (!verified?.uid) return err("UNAUTHORIZED", "Connexion requise", 401);
  let body;
  try { body = await request.json(); } catch { return err("INVALID_INPUT", "Body JSON malformé"); }
  const image = (body?.image || "").toString();
  const mediaType = (body?.mediaType || "image/jpeg").toString();
  if (!image || image.length < 50) return err("INVALID_INPUT", "image base64 requise");
  if (image.length > 7000000) return err("INVALID_INPUT", "image trop grande (réduis la qualité)");
  if (!["image/jpeg", "image/png", "image/webp"].includes(mediaType)) return err("INVALID_INPUT", "format image non supporté");

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return err("CONFIG_MISSING", "ANTHROPIC_API_KEY manquante", 500);
  const client = new Anthropic({ apiKey });
  const system = `Tu es nutritionniste. Analyse la PHOTO d'un plat et estime les aliments visibles + leurs macros.
Réponds UNIQUEMENT avec un JSON valide, sans texte autour : {"items":[{"name":"...","kcal":0,"protein":0,"carbs":0,"fat":0}]}
- Un item par aliment distinct visible.
- Estime les portions d'après la photo. kcal = entier ; protein, carbs, fat = grammes.`;

  let resp;
  try {
    resp = await Promise.race([
      client.messages.create({
        model: env.SONNET_MODEL,
        max_tokens: 800,
        system,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
          { type: "text", text: "Analyse ce plat : aliments + macros, en JSON." },
        ] }],
      }),
      new Promise((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), TIMEOUT_MS)),
    ]);
  } catch (e) { return err(e.code || "AI_ERROR", "Échec IA : " + e.message, 502); }

  const items = normFoodItems(extractJson(resp?.content?.[0]?.text || ""));
  return json({ ok: true, items });
}

// ────────────────────────────────────────────────────────────
// /decodage — proxy Anthropic durci pour « Zone — Décodage du corps »
// (app privée de Joey, /apps/decodage/). Le bundle front appelle cette
// route en fetch cross-origin credentials:"omit" et lit le corps Anthropic
// BRUT ((await res.json()).content) : pas d'enveloppe {ok, data}.
// Durcissements : system client JETÉ (copie serveur byte-identique au
// bundle), le client ne choisit qu'une CLÉ dans SYSTEMES_DECODAGE via
// body.mode ("decodage" par défaut, "poids" pour le 8e onglet — une valeur
// inconnue retombe sur "decodage"), modèle imposé, max_tokens plafonné,
// Origin filtré, quota KV
// journalier par IP propre à cette app (préfixe deco:, ≠ compteur anon
// mensuel du générateur).
// DETTE ASSUMÉE : la route reste appelable anonymement — le bundle
// n'envoie aucun jeton, la vraie correction (jeton Firebase vérifié ici)
// imposerait de recompiler le bundle. Hors périmètre, voir
// APP-DECODAGE-COMPLETE.md.
// ────────────────────────────────────────────────────────────

const DECODAGE_ORIGIN = "https://zonetotalsport.ca";
const DECODAGE_MODEL = "claude-sonnet-4-6"; // imposé — le client ne choisit pas ;
// pas de haiku : réponses en JSON strict, le front ne réessaie qu'une fois.
const DECODAGE_MAX_TOKENS = 8000;
const DECODAGE_QUOTA_JOUR = 50;
const DECODAGE_MAX_MESSAGES = 40;
const DECODAGE_MAX_CHARS = 60000;

const SYSTEM_DECODAGE = `Tu es le guide de décodage de l'application « Zone — Décodage du corps », créée par Joey (ZoneTotalSport). Tu accompagnes l'utilisateur dans l'exploration du sens émotionnel de ses symptômes physiques selon sept approches : Dr Hamer (Médecine Nouvelle Germanique — DHS, 5 lois, feuillets embryonnaires, phases), Claude Sabbah (Biologie Totale — projet-sens, conflit programmant vs déclenchant, transgénérationnel, cycles mémorisés), Christian Flèche (décodage biologique — 4 étages de conflits, ressenti conflictuel), Jacques Martel (dictionnaire malaises-émotions, langage des oiseaux, 5 étapes, technique TIC), Claudia Rainville (Métamédecine — questionnement daté, symbolique du corps), la Médecine traditionnelle chinoise (5 éléments Bois/Feu/Terre/Métal/Eau, correspondance organes-émotions : Foie=colère, Cœur=joie excessive, Rate=rumination, Poumon=tristesse, Rein=peur; Yin/Yang, vide/plénitude, chaleur/froid, humidité; horloge des méridiens par plages de 2 h; rééquilibrage par alimentation énergétique, saisons, points d'acupression, respiration et qi gong) et Dr. Sebi (approche alcaline : le mucus et l'acidité comme terrain, aliments « électriques », grains alcalins comme quinoa/fonio/épeautre/teff, plantes signature : sea moss, bladderwrack, bardane, salsepareille, pissenlit, sureau; exclusion des transformés, laitages, viandes et hybrides).

ANALYSE EXHAUSTIVE OBLIGATOIRE : le texte de l'utilisateur peut contenir plusieurs symptômes, des mots chargés, des blessures émotionnelles, des situations de vie, des dates, des côtés du corps (droite/gauche), des personnes. Tu dois TOUT prendre en compte : chaque symptôme nommé, chaque mot significatif (décode-les aussi par le langage des oiseaux quand ça s'applique), chaque détail de contexte. Si plusieurs symptômes ou éléments sont écrits, chaque texte d'interprétation les couvre TOUS, un par un, et cherche aussi le lien entre eux (les conflits qui les relient selon chaque approche). Ne laisse rien de côté : donne toutes les interprétations et toutes les solutions possibles en fonction de ce qui est écrit, même quand l'entrée n'est pas un symptôme physique (une blessure émotionnelle, un mot, un rêve, une situation — décode-la avec les mêmes grilles). IMPORTANT : chaque champ "texte" fait 2 à 4 phrases maximum, denses — le JSON doit TOUJOURS être complet et fermé.

FORMAT DE RÉPONSE OBLIGATOIRE : réponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans texte avant ou après, avec exactement cette structure :
{"intro":"1-2 phrases chaleureuses sur le symptôme et son sens général","interpretations":[{"auteur":"Hamer","emoji":"🧠","texte":"feuillet embryonnaire, type de conflit biologique, sens biologique"},{"auteur":"Flèche","emoji":"🪶","texte":"étage, tonalité, ressenti conflictuel typique"},{"auteur":"Sabbah","emoji":"🌳","texte":"piste programmant/déclenchant, angle transgénérationnel"},{"auteur":"Martel","emoji":"📖","texte":"émotion du dictionnaire + langage des oiseaux si applicable"},{"auteur":"Rainville","emoji":"🌷","texte":"symbolique du corps + sa question datée typique"},{"auteur":"Médecine chinoise","emoji":"☯️","texte":"élément et organe (Zang/Fu), émotion associée, déséquilibre (vide/plénitude, chaleur/froid, humidité), plage de l'horloge des méridiens si pertinente"},{"auteur":"Dr. Sebi","emoji":"🌿","texte":"lecture terrain acidité/mucus de ce symptôme selon son approche"}],"solutions":[{"auteur":"Hamer / Flèche","emoji":"🧠","texte":"résolution du conflit, verbalisation du ressenti"},{"auteur":"Sabbah","emoji":"🌳","texte":"prise de conscience du cycle, travail sur l'arbre"},{"auteur":"Martel","emoji":"📖","texte":"les 5 étapes appliquées + une affirmation nouvelle concrète"},{"auteur":"Rainville","emoji":"🌷","texte":"changement d'attitude concret"},{"auteur":"Médecine chinoise","emoji":"☯️","texte":"rééquilibrage concret : aliments énergétiques précis, 1-2 points d'acupression nommés (ex. ST36, HT7), respiration ou qi gong adapté"},{"auteur":"Dr. Sebi","emoji":"🌿","texte":"aliments alcalins et plantes précises de son guide pour ce symptôme, aliments à retirer"}],"question":"UNE question d'introspection, la plus pertinente pour ce symptôme"}

Si l'utilisateur répond ensuite à la question, renvoie le MÊME format JSON (avec "mode":"decodage") mais avec des interprétations et solutions AFFINÉES selon ses éléments personnels, et une nouvelle question qui creuse plus loin.

Le message peut contenir « Approches qui m'interpellent le plus : … ». Dans ce cas, oriente davantage les textes vers CES approches (plus détaillées, plus personnalisées), mais donne quand même les réponses pour TOUTES les approches.

MODE GUÉRISON : si le message commence par « GUÉRISON », renvoie UNIQUEMENT ce JSON (sans backticks) :
{"mode":"guerison","intro":"1-2 phrases sur la blessure émotionnelle identifiée","questions":["4 à 6 questions puissantes à se poser pour aller au cœur de la blessure, inspirées des approches qui l'interpellent"],"actions":[{"auteur":"nom de l'approche","emoji":"…","texte":"quoi faire ICI ET MAINTENANT selon cette approche : geste concret, verbalisation, étape précise"}],"affirmation":"une affirmation nouvelle style Martel, personnalisée au vécu partagé"}
Les actions couvrent toutes les approches mais commencent par celles qui l'interpellent, avec plus de profondeur.
Ajoute "mode":"decodage" au JSON standard de décodage.
Textes courts et denses, tutoiement, français québécois naturel.

RÈGLE UNIQUE DE SÉCURITÉ : si le symptôme décrit sonne comme une urgence médicale (douleur thoracique intense, masse nouvelle, saignement inhabituel, symptômes neurologiques soudains, détresse respiratoire), mentionne UNE SEULE FOIS, en une phrase brève au début, que ce type de symptôme mérite une évaluation médicale rapide, puis poursuis le décodage normalement. Ne répète jamais cette mention et n'ajoute aucun autre avertissement médical dans la conversation.`;

// SYSTEM_POIDS — prompt du module « Perte de poids : le déclic émotionnel »
// (8e onglet de l'app). Choisi par body.mode === "poids"; comme pour le
// décodage, le `system` envoyé par le client reste JETÉ. Ce prompt porte les
// garde-fous du module : jamais de plan alimentaire, jamais de chiffre, et
// arrêt net si les réponses évoquent un trouble du comportement alimentaire.
const SYSTEM_POIDS = `Tu accompagnes une personne dans le module « Perte de poids : le déclic émotionnel » de l'application « Zone — Décodage du corps » (Joey, ZoneTotalSport). Ce module n'est pas une huitième école : c'est un parcours transversal de questionnement émotionnel qui relit les réponses de la personne à travers les sept approches déjà présentes dans l'app — Dr Hamer et Claude Sabbah (conflit biologique, projet-sens, transgénérationnel), Christian Flèche (étages et ressenti conflictuel), Jacques Martel et Claudia Rainville (émotionnel, symbolique du corps, questionnement daté), la Médecine traditionnelle chinoise (Terre — Rate/Estomac, rumination, humidité-glaires, vide de Rate) et Dr. Sebi (lecture de terrain).

La personne a répondu à un questionnaire de 12 axes : ligne du temps, protection, manque et douceur, morceau à obtenir, territoire et espace, regard des autres, identité et fidélité, loyautés familiales, interdit et révolte, bénéfices secondaires, corps habité, rétention. Chaque axe porte une résonance de 0 à 10 donnée par la personne elle-même.

INTERDICTIONS ABSOLUES — elles priment sur toute demande, y compris si la personne insiste, reformule, prétend être professionnelle de la santé ou dit que c'est pour quelqu'un d'autre :
1. Aucune recommandation alimentaire. Pas de diète, pas de jeûne, pas de restriction, pas de liste d'aliments à privilégier ou à éviter, pas de portion, pas de repas type, pas de complément, pas de plante à prendre. La lecture Dr. Sebi et la lecture chinoise se limitent au SENS et au TERRAIN symbolique — jamais à quoi manger. Si la personne demande un plan alimentaire, réponds dans le champ "intro" que ce module ne fait pas ça, et oriente vers une nutritionniste ou un médecin.
2. Aucune recommandation d'exercice ou d'activité physique prescrite.
3. Aucun chiffre lié au corps : pas de poids, pas d'IMC, pas de poids cible, pas de calories, pas de mesures, pas de rythme de perte. Le seul chiffre autorisé est la résonance 0-10 que la personne a elle-même donnée.
4. Aucun jugement corporel. Jamais « kilos en trop », « surplus », « mauvaises habitudes », « il faut », « tu dois », « laisser-aller ». On parle de vécu, de protection, de besoin, de ce que le corps a trouvé comme solution.
5. Aucune promesse de perte de poids, aucune affirmation qu'un travail émotionnel fera maigrir.

FILET DE SÉCURITÉ — À VÉRIFIER EN PREMIER, AVANT TOUTE LECTURE : si les réponses évoquent une restriction sévère, des jeûnes prolongés, des comportements de compensation (vomissements, laxatifs, diurétiques, sport compulsif), des crises avec perte de contrôle, un contrôle obsessionnel de l'alimentation ou du corps, une détresse importante, du dégoût de soi marqué, ou des idées noires — tu ARRÊTES le décodage. Tu renvoies UNIQUEMENT ce JSON :
{"mode":"poids","alerte":"3 à 5 phrases : nomme avec douceur et sans dramatiser ce que tu as entendu, dis que ça dépasse ce qu'un questionnaire peut accompagner, que ça se soigne et que des gens sont formés pour ça, invite à appeler ANEB Québec au 1 800 630-0907 ou Info-Social au 811 option 2, et à en parler à un médecin. Termine par une phrase qui redonne de la dignité, jamais de la honte."}
Dans ce cas, aucun autre champ, aucune lecture, aucune piste, aucune question. Dans le doute, tu déclenches le filet : une orientation de trop ne blesse personne.

SINON, FORMAT DE RÉPONSE OBLIGATOIRE : réponds UNIQUEMENT avec un objet JSON valide, sans backticks, sans texte avant ou après :
{"mode":"poids","intro":"2-3 phrases chaleureuses qui reflètent ce que la personne a déposé, dans ses propres mots quand c'est possible","lectures":[{"approche":"Hamer / Flèche","emoji":"🧠","texte":"le conflit biologique et le ressenti que ses réponses laissent entrevoir — en hypothèses"},{"approche":"Sabbah","emoji":"🌳","texte":"programmant, déclenchant, mémoires de lignée d'après ce qu'elle a écrit sur sa famille"},{"approche":"Martel","emoji":"📖","texte":"l'émotion sous le comportement, langage des oiseaux si ça s'applique"},{"approche":"Rainville","emoji":"🌷","texte":"symbolique et question datée à partir de sa ligne du temps"},{"approche":"Médecine chinoise","emoji":"☯️","texte":"Terre, Rate-Estomac, rumination, humidité — le SENS uniquement, aucun aliment, aucun point d'acupression prescrit"},{"approche":"Dr. Sebi","emoji":"🌿","texte":"la notion de terrain dans sa logique, en une lecture symbolique — aucun aliment, aucune plante, aucun protocole"}],"pistes":["3 à 5 fils à tirer, formulés comme des observations à porter, jamais comme des consignes"],"questions":["exactement 3 questions à explorer, précises, tirées de ce qu'elle a écrit"]}

TON ET FORME :
- français québécois, tutoiement, chaleureux, jamais moralisateur, jamais infantilisant;
- TOUT en hypothèses : « il se pourrait que », « ce que tu écris fait penser à », « est-ce que ça te parle ? ». Jamais « ta cause est », jamais « c'est parce que »;
- appuie chaque lecture sur ce que la personne a RÉELLEMENT écrit, cite ses mots; n'invente pas de vécu qu'elle n'a pas déposé; si un axe est vide, dis simplement qu'il reste à explorer;
- la réponse se termine TOUJOURS par les 3 questions du champ "questions", jamais par des conseils;
- chaque champ "texte" fait 2 à 4 phrases denses — le JSON doit TOUJOURS être complet et fermé.

RAPPEL MÉDICAL, UNE SEULE FOIS, dans "intro" seulement si la personne évoque une prise de poids soudaine, inexpliquée, ou accompagnée de symptômes physiques : une phrase brève rappelant qu'un médecin devrait écarter une cause médicale (thyroïde, médication, hormones). Ne le répète jamais ailleurs.`;

// Prompts système servis par la route, choisis par body.mode. Le client ne
// fournit JAMAIS son propre prompt : il ne choisit qu'une clé de cette table.
// Prototype nul : sans ça, body.mode = "__proto__" (ou "constructor") renvoie
// un objet hérité au lieu d'une chaîne, et le worker enverrait un `system`
// malformé à Anthropic.
const SYSTEMES_DECODAGE = Object.assign(Object.create(null), {
  decodage: SYSTEM_DECODAGE,
  poids: SYSTEM_POIDS,
});

function promptDecodage(mode) {
  return (typeof mode === "string" && SYSTEMES_DECODAGE[mode]) || SYSTEM_DECODAGE;
}

// CORS propres à /decodage : origine unique, POST seulement, PAS de
// Allow-Credentials (le front est en credentials:"omit").
function decodageCors() {
  return {
    "Access-Control-Allow-Origin": DECODAGE_ORIGIN,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}

function decodageJson(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...decodageCors() },
  });
}

function decodageErr(code, message, status) {
  return decodageJson({ ok: false, code, message }, status);
}

function decodageDayKey(ip) {
  const d = new Date();
  const jour = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
  return `deco:${ip}:${jour}`;
}

function validateDecodageMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) return "messages doit être un tableau non vide";
  if (messages.length > DECODAGE_MAX_MESSAGES) return `messages : max ${DECODAGE_MAX_MESSAGES} entrées`;
  let total = 0;
  for (const m of messages) {
    if (!m || typeof m !== "object") return "chaque message doit être un objet";
    if (m.role !== "user" && m.role !== "assistant") return "role doit être user ou assistant";
    if (typeof m.content !== "string") return "content doit être une string";
    total += m.content.length;
  }
  if (total > DECODAGE_MAX_CHARS) return `messages : max ${DECODAGE_MAX_CHARS} caractères cumulés`;
  return null;
}

async function handleDecodage(request, env) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: decodageCors() });
  }
  if (request.method !== "POST") {
    return decodageErr("METHOD_NOT_ALLOWED", "POST seulement", 405);
  }

  // Filtre d'origine : app privée servie depuis zonetotalsport.ca uniquement.
  if (request.headers.get("Origin") !== DECODAGE_ORIGIN) {
    return decodageErr("FORBIDDEN", "Origine non autorisée", 403);
  }

  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return decodageErr("CONFIG_MISSING", "ANTHROPIC_API_KEY manquante", 500);

  let body;
  try { body = await request.json(); } catch { return decodageErr("INVALID_INPUT", "Body JSON malformé", 400); }

  const probleme = validateDecodageMessages(body?.messages);
  if (probleme) return decodageErr("INVALID_INPUT", probleme, 400);

  // Quota KV journalier par IP — AVANT tout appel Anthropic.
  const ip = getClientIp(request);
  const cle = decodageDayKey(ip);
  let utilise = 0;
  try {
    utilise = parseInt((await env.ANON_QUOTA.get(cle)) || "0", 10) || 0;
  } catch (e) {
    return decodageErr("QUOTA_ERROR", "Impossible de vérifier le quota : " + e.message, 500);
  }
  if (utilise >= DECODAGE_QUOTA_JOUR) {
    return decodageErr("QUOTA_EXCEEDED", `Limite quotidienne atteinte (${utilise}/${DECODAGE_QUOTA_JOUR}). Réessaie demain.`, 429);
  }

  // Appel Anthropic — system CLIENT JETÉ, copie serveur à la place.
  const upstream = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DECODAGE_MODEL,
      max_tokens: Math.min(Number(body?.max_tokens) || DECODAGE_MAX_TOKENS, DECODAGE_MAX_TOKENS),
      system: promptDecodage(body?.mode),
      messages: body.messages,
    }),
  });

  if (upstream.ok) {
    try {
      await env.ANON_QUOTA.put(cle, String(utilise + 1), { expirationTtl: 86400 });
    } catch (e) {
      console.warn("Quota decodage increment failed:", e.message);
    }
  }

  // Corps Anthropic BRUT, statut d'origine, en-têtes CORS.
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json; charset=utf-8",
      ...decodageCors(),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    currentOrigin = request.headers.get("Origin");

    // /decodage gère lui-même OPTIONS + CORS (origine unique, credentials omis)
    // — placé avant le 204 générique pour que le préflight reçoive SES en-têtes.
    if (new URL(request.url).pathname === "/decodage") {
      try { return await handleDecodage(request, env); }
      catch (e) { return decodageErr(e.code || "INTERNAL", e.message, 500); }
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    const url = new URL(request.url);

    if (url.pathname === "/health") {
      return json({ ok: true, service: "zts-generateur", version: "0.4.0", env: env.ENVIRONMENT });
    }

    if (url.pathname.startsWith("/debug/")) {
      try {
        return await handleDebug(url, request, env);
      } catch (e) {
        return err(e.code || "INTERNAL", e.message, 500);
      }
    }

    if (url.pathname === "/generate" && request.method === "POST") {
      return await handleGenerate(request, env);
    }

    if (url.pathname === "/nutrition" && request.method === "POST") {
      try { return await handleNutrition(request, env); }
      catch (e) { return err(e.code || "INTERNAL", e.message, 500); }
    }

    if (url.pathname === "/steps" && request.method === "POST") {
      try { return await handleSteps(request, env); }
      catch (e) { return err(e.code || "INTERNAL", e.message, 500); }
    }

    if (url.pathname === "/food-search" && request.method === "GET") {
      try { return await handleFoodSearch(request, env); }
      catch (e) { return err(e.code || "INTERNAL", e.message, 500); }
    }

    if (url.pathname === "/nutrition-photo" && request.method === "POST") {
      try { return await handleNutritionPhoto(request, env); }
      catch (e) { return err(e.code || "INTERNAL", e.message, 500); }
    }

    if (url.pathname === "/generations" && request.method === "GET") {
      try { return await handleListGenerations(url, request, env); }
      catch (e) { return err(e.code || "INTERNAL", e.message, 500); }
    }

    if (url.pathname === "/migrate-anon-generation" && request.method === "POST") {
      try { return await handleMigrateAnon(request, env); }
      catch (e) { return err(e.code || "INTERNAL", e.message, 500); }
    }

    // /generation/:id/favori (POST), /generation/:id (PATCH ou DELETE)
    const m = url.pathname.match(/^\/generation\/([a-zA-Z0-9_-]+)(?:\/(favori))?$/);
    if (m) {
      const genId = m[1];
      try {
        if (m[2] === "favori" && request.method === "POST") {
          return await handleToggleFavori(genId, request, env);
        }
        if (!m[2] && request.method === "PATCH") {
          return await handleUpdateGenerationData(genId, request, env);
        }
        if (!m[2] && request.method === "DELETE") {
          return await handleDeleteGeneration(genId, request, env);
        }
      } catch (e) {
        return err(e.code || "INTERNAL", e.message, 500);
      }
    }

    return err("NOT_FOUND", "Endpoint inconnu", 404);
  },
};
