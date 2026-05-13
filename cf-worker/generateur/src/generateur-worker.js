// zts-generateur — Worker Cloudflare
// Étape #1 (scaffold) : echo + CORS + validation body minimale.
// Étape #2 ajoutera l'appel Anthropic + les 9 prompts.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

const VALID_TYPES = ["jeu", "sae", "educatif"];
const VALID_UNIVERS = ["eps", "camps", "sdg"];
const VALID_MODELS = ["haiku", "sonnet"];

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

function err(code, message, status = 400) {
  return json({ ok: false, code, message }, status);
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true, service: "zts-generateur", version: "0.1.0" });
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

    if (!VALID_TYPES.includes(type)) {
      return err("INVALID_INPUT", `type doit être ${VALID_TYPES.join("|")}`);
    }
    if (!VALID_UNIVERS.includes(univers)) {
      return err("INVALID_INPUT", `univers doit être ${VALID_UNIVERS.join("|")}`);
    }
    if (!VALID_MODELS.includes(modele)) {
      return err("INVALID_INPUT", `modele doit être ${VALID_MODELS.join("|")}`);
    }
    if (typeof contexte !== "string" || contexte.length > 1000) {
      return err("INVALID_INPUT", "contexte doit être une string ≤ 1000 chars");
    }

    // SCAFFOLD : on echo le body validé.
    // Commit #2 remplacera ce return par l'appel Anthropic + parsing JSON.
    return json({
      ok: true,
      stage: "scaffold",
      echo: { type, univers, contexte, modele, uid },
      modele_resolu: modele === "sonnet" ? env.SONNET_MODEL : env.DEFAULT_MODEL,
    });
  },
};
