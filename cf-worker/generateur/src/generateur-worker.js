// zts-generateur — Worker Cloudflare
// Étape #2 : intégration Anthropic SDK + 9 prompts système + parsing JSON.
// Le quota Firestore + KV anon seront ajoutés au commit #3.

import Anthropic from "@anthropic-ai/sdk";
import { SCHEMAS } from "./schemas.js";
import { buildSystemPrompt } from "./prompts.js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  // Stratégie 1 : parse direct
  try {
    return JSON.parse(text);
  } catch {}
  // Stratégie 2 : strip ```json ... ``` enrobant
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced) {
    try {
      return JSON.parse(fenced[1]);
    } catch {}
  }
  // Stratégie 3 : premier { au dernier } équilibrés
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) {
    try {
      return JSON.parse(text.slice(first, last + 1));
    } catch {}
  }
  return null;
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

  // 1er appel
  let resp;
  try {
    resp = await Promise.race([
      callAnthropic(client, model, systemPrompt, userMsg, maxTokens),
      new Promise((_, reject) =>
        setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "TIMEOUT" })), TIMEOUT_MS)
      ),
    ]);
  } catch (e) {
    // Retry 1× sur 5xx ou 429 après 2s
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

  // Retry 1× sur parse error avec rappel JSON pur
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
      // Cumule tokens
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

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true, service: "zts-generateur", version: "0.2.0" });
    }

    if (url.pathname !== "/generate" || request.method !== "POST") {
      return err("NOT_FOUND", "Endpoint inconnu", 404);
    }

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

    try {
      const { data, model_used, tokens } = await generate({ type, univers, contexte, modele, env });
      return json({
        ok: true,
        type,
        univers,
        modele_utilise: model_used,
        tokens,
        data: {
          id: `gen-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type,
          univers,
          date_generation: new Date().toISOString(),
          ...data,
        },
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
  },
};
