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
} from "./firestore.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const VALID_TYPES = ["jeu", "sae", "educatif"];
const VALID_UNIVERS = ["eps", "camps", "sdg"];
const VALID_MODELS = ["haiku", "sonnet"];

const TIMEOUT_MS = 30000;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
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
  let body;
  try {
    body = await request.json();
  } catch {
    return err("INVALID_INPUT", "Body JSON malformé");
  }

  const { type, univers, contexte = "", modele = "haiku", uid = null } = body || {};

  if (!VALID_TYPES.includes(type)) return err("INVALID_INPUT", `type doit être ${VALID_TYPES.join("|")}`);
  if (!VALID_UNIVERS.includes(univers)) return err("INVALID_INPUT", `univers doit être ${VALID_UNIVERS.join("|")}`);
  if (!VALID_MODELS.includes(modele)) return err("INVALID_INPUT", `modele doit être ${VALID_MODELS.join("|")}`);
  if (typeof contexte !== "string" || contexte.length > 1000) {
    return err("INVALID_INPUT", "contexte doit être une string ≤ 1000 chars");
  }
  if (uid !== null && (typeof uid !== "string" || uid.length === 0 || uid.length > 128)) {
    return err("INVALID_INPUT", "uid invalide");
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

async function handleListGenerations(url, env) {
  const uid = url.searchParams.get("uid");
  const limit = Math.min(Math.max(1, parseInt(url.searchParams.get("limit") || "12", 10)), 50);
  if (!uid || typeof uid !== "string" || uid.length > 128) {
    return err("INVALID_INPUT", "?uid=... obligatoire (≤128 chars)");
  }
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
  const body = await request.json().catch(() => null);
  if (!body || typeof body.uid !== "string" || typeof body.favori !== "boolean") {
    return err("INVALID_INPUT", "body: { uid, favori: bool }");
  }
  const doc = await getDoc(env, `generations/${genId}`);
  if (!doc) return err("NOT_FOUND", "Génération introuvable", 404);
  if (doc.fields.uid !== body.uid) {
    return err("FORBIDDEN", "Cette génération n'appartient pas à cet uid", 403);
  }
  await setDoc(env, `generations/${genId}`, { favori: body.favori });
  return json({ ok: true, id: genId, favori: body.favori });
}

async function handleMigrateAnon(request, env) {
  const body = await request.json().catch(() => null);
  if (!body || !body.uid || typeof body.uid !== "string" || body.uid.length > 128) {
    return err("INVALID_INPUT", "body: { uid: string, generations: [...] }");
  }
  if (!Array.isArray(body.generations)) {
    return err("INVALID_INPUT", "generations doit être un array");
  }
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
        uid: body.uid,
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

async function handleDeleteGeneration(genId, request, env) {
  if (!genId || !/^[a-zA-Z0-9_-]{1,80}$/.test(genId)) {
    return err("INVALID_INPUT", "ID génération invalide");
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body.uid !== "string") {
    return err("INVALID_INPUT", "body: { uid }");
  }
  const doc = await getDoc(env, `generations/${genId}`);
  if (!doc) return err("NOT_FOUND", "Génération introuvable", 404);
  if (doc.fields.uid !== body.uid) {
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

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
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

    if (url.pathname === "/generations" && request.method === "GET") {
      try { return await handleListGenerations(url, env); }
      catch (e) { return err(e.code || "INTERNAL", e.message, 500); }
    }

    if (url.pathname === "/migrate-anon-generation" && request.method === "POST") {
      try { return await handleMigrateAnon(request, env); }
      catch (e) { return err(e.code || "INTERNAL", e.message, 500); }
    }

    // /generation/:id/favori (POST) ou /generation/:id (DELETE)
    const m = url.pathname.match(/^\/generation\/([a-zA-Z0-9_-]+)(?:\/(favori))?$/);
    if (m) {
      const genId = m[1];
      try {
        if (m[2] === "favori" && request.method === "POST") {
          return await handleToggleFavori(genId, request, env);
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
