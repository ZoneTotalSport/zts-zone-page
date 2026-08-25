/**
 * ZTS Notify Worker — sert notify.zonetotalsport.ca et zonetotalsport.ca/api/notify*
 *
 * ⚠ RAPATRIE DEPUIS LA PRODUCTION LE 24 AOUT 2026. CE FICHIER EST LE CODE QUI
 *   TOURNE, pas une version de travail.
 *
 * CE QU'IL Y AVAIT ICI AVANT, ET POURQUOI C'ETAIT DANGEREUX. Le depot portait
 * un instantane de juin 2026 : 90 lignes, un seul handler `fetch`, le jeton
 * Telegram et le topic ntfy ECRITS EN DUR. Le worker deploye, lui, avait
 * continue d'evoluer par le tableau de bord — 287 lignes, un handler
 * `scheduled` pour le rapport quotidien de 13 h UTC, un acces Firestore par
 * compte de service, un compteur de visites, et tous ses secrets en bindings.
 *
 * Un `wrangler deploy` depuis le depot aurait donc REMPLACE le worker vivant
 * par la vieille version : rapport quotidien supprime, statistiques Firestore
 * supprimees, compteur de visites supprime — et le jeton Telegram REMIS en
 * clair dans le code. Le deploiement a ete arrete a temps par Joey, qui a vu
 * l'avertissement de divergence sur la route et le cron.
 *
 * C'est la meme discipline que `firestore.rules` : le depot est la source de
 * verite, et une modification faite au tableau de bord se rapatrie
 * IMMEDIATEMENT. Elle ne l'avait pas ete depuis le 18 juin.
 *
 * CE FICHIER EST LA SORTIE D'ESBUILD, PAS LA SOURCE D'ORIGINE. Les aides
 * `__defProp` / `__name` en tete le montrent. La vraie source vivait dans
 * `cf-worker/notif-stats/`, signale comme non commite dans CLAUDE.md — ce
 * dossier N'EXISTE PLUS sur ce Mac. Le code ci-dessous est donc tout ce qui
 * reste, et il est fidele a ce qui tourne. Le rapatrier vaut mieux que de
 * laisser le depot mentir ; si la source d'origine reapparait, c'est elle
 * qu'il faudra committer a la place.
 *
 * SECRETS (aucun n'est dans ce fichier, et aucun ne doit y revenir) :
 *   TELEGRAM_BOT_TOKEN   TELEGRAM_CHAT_ID   NTFY_TOPIC
 *   FIREBASE_SERVICE_ACCOUNT               TEST_KEY
 * Ils se posent a `wrangler secret put`. Voir cf-worker/DEPLOY.md.
 *
 * DECLENCHEURS, tous les trois declares dans wrangler.toml depuis ce commit :
 *   domaine   notify.zonetotalsport.ca
 *   route     zonetotalsport.ca/api/notify*
 *   cron      0 13 * * *   (rapport quotidien, handler `scheduled`)
 */

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// notify-worker.js
var FIREBASE_PROJECT_ID = "zone-total-sport";
var SUBSCRIBER_COUNT_URL = "https://zone-subscriber-count.zts-ccd.workers.dev";
var FUNNEL_COLLECTION = "conversionFunnel";
var VISITS_COLLECTION = "analyticsDaily";
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
var notify_worker_default = {
  // ── Cron quotidien : rapport stats de la veille ──
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDailyReport(env));
  },
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", {
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }
    if (request.method === "GET" && url.pathname === "/test") {
      if (!env.TEST_KEY || url.searchParams.get("key") !== env.TEST_KEY) {
        return new Response("forbidden", { status: 403, headers: CORS });
      }
      const payload = await buildPayload(env);
      const result = await sendStats(payload, env);
      return new Response(JSON.stringify({ ok: true, payload, result }, null, 2), {
        headers: { "Content-Type": "application/json", ...CORS }
      });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== "POST") {
      return new Response("OK", { status: 200, headers: CORS });
    }
    let data = {};
    try {
      data = await request.json();
    } catch (e) {
    }
    const title = (data.title || "ZTS").slice(0, 200);
    const message = (data.message || "").slice(0, 4e3);
    const priority = String(data.priority || 3);
    const tags = data.tags || "";
    const country = request.headers.get("CF-IPCountry") || "";
    const city = request.cf && request.cf.city ? request.cf.city : "";
    const region = request.cf && request.cf.region ? request.cf.region : "";
    const ua = request.headers.get("User-Agent") || "";
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
    const geoLine = city || region || country ? `
\u{1F4CD} ${[city, region, country].filter(Boolean).join(", ")}` : "";
    const devLine = `
${isMobile ? "\u{1F4F1} Mobile" : "\u{1F4BB} Desktop"}`;
    const fullMsg = message + geoLine + devLine;
    const ntfyP = sendNtfy(env, { title, body: fullMsg, priority, tags }).catch(() => {
    });
    const tgP = sendTelegram(env, {
      html: `<b>${escapeHtml(title)}</b>
${escapeHtml(fullMsg)}`
    }).catch(() => {
    });
    if (/visiteur/i.test(title)) {
      ctx.waitUntil(incrementVisit(env).catch(() => {
      }));
    }
    await Promise.allSettled([ntfyP, tgP]);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json", ...CORS }
    });
  }
};
async function sendNtfy(env, { title, body, priority = "3", tags = "" }) {
  if (!env.NTFY_TOPIC) throw new Error("NTFY_TOPIC manquant");
  const headers = { "Title": title, "Priority": String(priority), "Tags": tags };
  if (env.NTFY_TOKEN) headers["Authorization"] = `Bearer ${env.NTFY_TOKEN}`;
  const r = await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, { method: "POST", headers, body });
  if (!r.ok) throw new Error("ntfy " + r.status);
}
__name(sendNtfy, "sendNtfy");
async function sendTelegram(env, { html }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    throw new Error("secrets Telegram manquants");
  }
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: html, parse_mode: "HTML" })
  });
  if (!r.ok) throw new Error("telegram " + r.status);
}
__name(sendTelegram, "sendTelegram");
async function sendStats(payload, env) {
  const result = {};
  const tg = sendTelegram(env, { html: payload.html }).then(() => {
    result.telegram = "ok";
  }).catch((e) => {
    result.telegram = "err: " + e.message;
  });
  const nt = sendNtfy(env, { title: payload.title, body: payload.text, priority: "3", tags: "bar_chart" }).then(() => {
    result.ntfy = "ok";
  }).catch((e) => {
    result.ntfy = "err: " + e.message;
  });
  await Promise.allSettled([tg, nt]);
  return result;
}
__name(sendStats, "sendStats");
async function runDailyReport(env) {
  const payload = await buildPayload(env);
  return sendStats(payload, env);
}
__name(runDailyReport, "runDailyReport");
async function buildPayload(env) {
  const { dateStr, startIso, endIso } = yesterdayUtc();
  let inscriptions = null;
  let totalMembres = null;
  try {
    const r = await fetch(SUBSCRIBER_COUNT_URL);
    if (r.ok) {
      const d = await r.json();
      inscriptions = typeof d.yesterday === "number" ? d.yesterday : null;
      totalMembres = typeof d.total === "number" ? d.total : null;
    }
  } catch (e) {
  }
  let visiteurs = null;
  try {
    visiteurs = await readVisits(env, dateStr);
  } catch (e) {
  }
  let funnel = { locked_view: 0, locked_click_signup: 0, signup_complete: 0 };
  try {
    funnel = await readFunnel(env, startIso, endIso);
  } catch (e) {
  }
  const nd = /* @__PURE__ */ __name((v) => v === null || v === void 0 ? "n/d" : String(v), "nd");
  const totalSuffix = totalMembres !== null ? ` (total ${totalMembres})` : "";
  const lines = [
    `\u{1F440} Visiteurs : ${nd(visiteurs)}`,
    `\u270D\uFE0F Inscriptions : ${nd(inscriptions)}${totalSuffix}`,
    "\u2014 Entonnoir \u2014",
    `\u{1F512} Vues verrou : ${funnel.locked_view}`,
    `\u{1F449} Clics inscription : ${funnel.locked_click_signup}`,
    `\u2705 Inscriptions compl\xE9t\xE9es : ${funnel.signup_complete}`
  ];
  const title = `\u{1F4CA} ZTS \u2014 Hier ${dateStr}`;
  const text = lines.join("\n");
  const html = `<b>${escapeHtml(title)}</b>
${escapeHtml(text)}`;
  return { title, text, html, dateStr, metrics: { visiteurs, inscriptions, totalMembres, funnel } };
}
__name(buildPayload, "buildPayload");
async function readFunnel(env, startIso, endIso) {
  const token = await getAccessToken(env);
  const body = {
    structuredQuery: {
      from: [{ collectionId: FUNNEL_COLLECTION }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            { fieldFilter: { field: { fieldPath: "timestamp" }, op: "GREATER_THAN_OR_EQUAL", value: { timestampValue: startIso } } },
            { fieldFilter: { field: { fieldPath: "timestamp" }, op: "LESS_THAN", value: { timestampValue: endIso } } }
          ]
        }
      }
    }
  };
  const r = await fetch(firestoreUrl(":runQuery"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error("runQuery " + r.status);
  const rows = await r.json();
  const out = { locked_view: 0, locked_click_signup: 0, signup_complete: 0 };
  for (const row of rows) {
    const ev = row.document && row.document.fields && row.document.fields.event ? row.document.fields.event.stringValue : null;
    if (ev && Object.prototype.hasOwnProperty.call(out, ev)) out[ev]++;
  }
  return out;
}
__name(readFunnel, "readFunnel");
async function readVisits(env, dateStr) {
  const token = await getAccessToken(env);
  const r = await fetch(firestoreUrl(`/${VISITS_COLLECTION}/${dateStr}`), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (r.status === 404) return 0;
  if (!r.ok) throw new Error("getDoc " + r.status);
  const d = await r.json();
  const v = d.fields && d.fields.visits ? d.fields.visits.integerValue : "0";
  return Number(v) || 0;
}
__name(readVisits, "readVisits");
async function incrementVisit(env) {
  const token = await getAccessToken(env);
  const dateStr = ymd(/* @__PURE__ */ new Date());
  const docName = `projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${VISITS_COLLECTION}/${dateStr}`;
  const body = {
    writes: [{
      update: { name: docName, fields: { date: { stringValue: dateStr } } },
      updateMask: { fieldPaths: ["date"] },
      updateTransforms: [{ fieldPath: "visits", increment: { integerValue: "1" } }]
    }]
  };
  const r = await fetch(firestoreUrl(":commit"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error("commit " + r.status);
}
__name(incrementVisit, "incrementVisit");
var _tokenCache = { token: null, exp: 0 };
async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1e3);
  if (_tokenCache.token && _tokenCache.exp > now + 60) return _tokenCache.token;
  const raw = env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT manquant");
  const sa = typeof raw === "string" ? JSON.parse(raw) : raw;
  const header = { alg: "RS256", typ: "JWT", kid: sa.private_key_id };
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  };
  const unsigned = `${b64urlStr(JSON.stringify(header))}.${b64urlStr(JSON.stringify(payload))}`;
  const key = await importKey(sa.private_key);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64urlBytes(sig)}`;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt })
  });
  if (!r.ok) throw new Error("OAuth Google " + r.status + " " + await r.text());
  const data = await r.json();
  _tokenCache = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return _tokenCache.token;
}
__name(getAccessToken, "getAccessToken");
function firestoreUrl(suffix) {
  return `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents${suffix}`;
}
__name(firestoreUrl, "firestoreUrl");
async function importKey(pem) {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/, "").replace(/-----END PRIVATE KEY-----/, "").replace(/\\n/g, "").replace(/\s/g, "");
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der.buffer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}
__name(importKey, "importKey");
function b64urlBytes(bytes) {
  const s = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(b64urlBytes, "b64urlBytes");
function b64urlStr(s) {
  return b64urlBytes(new TextEncoder().encode(s));
}
__name(b64urlStr, "b64urlStr");
function ymd(d) {
  return d.toISOString().slice(0, 10);
}
__name(ymd, "ymd");
function yesterdayUtc() {
  const today0 = /* @__PURE__ */ new Date((/* @__PURE__ */ new Date()).toISOString().slice(0, 10) + "T00:00:00.000Z");
  const yest0 = new Date(today0.getTime() - 864e5);
  return { dateStr: ymd(yest0), startIso: yest0.toISOString(), endIso: today0.toISOString() };
}
__name(yesterdayUtc, "yesterdayUtc");
function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}
__name(escapeHtml, "escapeHtml");
export {
  notify_worker_default as default
};
//# sourceMappingURL=notify-worker.js.map
