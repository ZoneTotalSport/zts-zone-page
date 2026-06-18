/**
 * ZTS Notify Worker — proxy ntfy + Telegram (webhook first-party).
 * Bypass des bloqueurs (Brave Shields, uBlock, etc.) car first-party.
 *
 * Étendu (juin 2026) : rapport de stats quotidien double canal.
 *
 * Routes :
 *   GET  /robots.txt          → robots.txt valide (Disallow, jamais indexé)
 *   GET  /test?key=TEST_KEY   → déclenche le rapport stats à la demande
 *   OPTIONS                   → CORS preflight
 *   POST /                    → webhook notif (visites / inscriptions / avis…)
 *                               + incrémente le compteur visites Firestore du jour
 *   cron "0 13 * * *" (UTC)   → scheduled() → rapport stats quotidien (≈9h Québec l'été)
 *
 * Body POST attendu (JSON) :
 *   { title: "...", message: "...", priority: 3, tags: "bell" }
 *
 * Secrets wrangler (AUCUN hardcodé — voir wrangler.toml) :
 *   TELEGRAM_BOT_TOKEN   token du bot (post-rotation BotFather)
 *   TELEGRAM_CHAT_ID     chat id destinataire
 *   NTFY_TOPIC           topic ntfy.sh secret
 *   TEST_KEY             clé du endpoint GET /test
 *   FIREBASE_SERVICE_ACCOUNT  JSON complet du service account (lecture+écriture Firestore)
 */

const FIREBASE_PROJECT_ID = 'zone-total-sport';
// Endpoint public (Firebase Auth) — pas un secret. Champs .today / .yesterday / .total
const SUBSCRIBER_COUNT_URL = 'https://zone-subscriber-count.zts-ccd.workers.dev';
const FUNNEL_COLLECTION = 'conversionFunnel';
const VISITS_COLLECTION = 'analyticsDaily';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  // ── Cron quotidien : rapport stats de la veille ──
  async scheduled(event, env, ctx) {
    ctx.waitUntil(runDailyReport(env));
  },

  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // robots.txt valide (webhook interne -> jamais indexé). Corrige l'erreur
    // critique GSC : auparavant le worker renvoyait 'OK' sur /robots.txt.
    if (request.method === 'GET' && url.pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    // Déclenchement manuel du rapport : GET /test?key=…
    if (request.method === 'GET' && url.pathname === '/test') {
      if (!env.TEST_KEY || url.searchParams.get('key') !== env.TEST_KEY) {
        return new Response('forbidden', { status: 403, headers: CORS });
      }
      const payload = await buildPayload(env);
      const result = await sendStats(payload, env);
      return new Response(JSON.stringify({ ok: true, payload, result }, null, 2), {
        headers: { 'Content-Type': 'application/json', ...CORS },
      });
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== 'POST') {
      return new Response('OK', { status: 200, headers: CORS });
    }

    // ── Webhook notif (comportement existant, creds désormais via env) ──
    let data = {};
    try { data = await request.json(); } catch (e) {}

    const title = (data.title || 'ZTS').slice(0, 200);
    const message = (data.message || '').slice(0, 4000);
    const priority = String(data.priority || 3);
    const tags = data.tags || '';

    const country = request.headers.get('CF-IPCountry') || '';
    const city = request.cf && request.cf.city ? request.cf.city : '';
    const region = request.cf && request.cf.region ? request.cf.region : '';
    const ua = request.headers.get('User-Agent') || '';
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);

    const geoLine = city || region || country
      ? `\n📍 ${[city, region, country].filter(Boolean).join(', ')}`
      : '';
    const devLine = `\n${isMobile ? '📱 Mobile' : '💻 Desktop'}`;

    const fullMsg = message + geoLine + devLine;

    // Envoi sur les 2 canaux (chacun avale ses erreurs — un canal HS ne bloque pas l'autre).
    const ntfyP = sendNtfy(env, { title, body: fullMsg, priority, tags }).catch(() => {});
    const tgP = sendTelegram(env, {
      html: `<b>${escapeHtml(title)}</b>\n${escapeHtml(fullMsg)}`,
    }).catch(() => {});

    // Compteur de visites du jour (Firestore) : une visite = title "…visiteur…".
    // Fire-and-forget ; n'impacte jamais la réponse au client.
    if (/visiteur/i.test(title)) {
      ctx.waitUntil(incrementVisit(env).catch(() => {}));
    }

    await Promise.allSettled([ntfyP, tgP]);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  },
};

// ════════════════════════════════════════════════════════════════════
// Envoi — fonctions factorisées (réutilisées par le webhook ET sendStats)
// ════════════════════════════════════════════════════════════════════

async function sendNtfy(env, { title, body, priority = '3', tags = '' }) {
  if (!env.NTFY_TOPIC) throw new Error('NTFY_TOPIC manquant');
  const headers = { 'Title': title, 'Priority': String(priority), 'Tags': tags };
  // Auth ntfy : les Workers sortent par IP partagées que ntfy.sh rate-limite (429).
  // Un token (compte gratuit) authentifie la requête → limites par compte, pas par IP.
  if (env.NTFY_TOKEN) headers['Authorization'] = `Bearer ${env.NTFY_TOKEN}`;
  const r = await fetch(`https://ntfy.sh/${env.NTFY_TOPIC}`, { method: 'POST', headers, body });
  if (!r.ok) throw new Error('ntfy ' + r.status);
}

async function sendTelegram(env, { html }) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    throw new Error('secrets Telegram manquants');
  }
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: html, parse_mode: 'HTML' }),
  });
  if (!r.ok) throw new Error('telegram ' + r.status);
}

/**
 * Envoie le rapport stats sur les 2 canaux. try/catch SÉPARÉ par canal :
 * si Telegram plante, ntfy part quand même (et inversement).
 */
async function sendStats(payload, env) {
  const result = {};
  const tg = sendTelegram(env, { html: payload.html })
    .then(() => { result.telegram = 'ok'; })
    .catch((e) => { result.telegram = 'err: ' + e.message; });
  const nt = sendNtfy(env, { title: payload.title, body: payload.text, priority: '3', tags: 'bar_chart' })
    .then(() => { result.ntfy = 'ok'; })
    .catch((e) => { result.ntfy = 'err: ' + e.message; });
  await Promise.allSettled([tg, nt]);
  return result;
}

// ════════════════════════════════════════════════════════════════════
// Construction du rapport (Firestore + endpoint inscrits) — la VEILLE
// ════════════════════════════════════════════════════════════════════

async function runDailyReport(env) {
  const payload = await buildPayload(env);
  return sendStats(payload, env);
}

/**
 * Lit les métriques de la veille (jour UTC complet) et formate le message.
 *   TOTAL    : visiteurs (Firestore analyticsDaily) + inscriptions (endpoint Auth)
 *   ENTONNOIR: locked_view → locked_click_signup → signup_complete (conversionFunnel)
 */
async function buildPayload(env) {
  const { dateStr, startIso, endIso } = yesterdayUtc();

  // 1) Inscriptions de la veille + total membres (endpoint public, lit Firebase Auth)
  let inscriptions = null;
  let totalMembres = null;
  try {
    const r = await fetch(SUBSCRIBER_COUNT_URL);
    if (r.ok) {
      const d = await r.json();
      inscriptions = typeof d.yesterday === 'number' ? d.yesterday : null;
      totalMembres = typeof d.total === 'number' ? d.total : null;
    }
  } catch (e) { /* garde null */ }

  // 2) Visiteurs de la veille (compteur Firestore alimenté par le webhook)
  let visiteurs = null;
  try { visiteurs = await readVisits(env, dateStr); } catch (e) { /* null */ }

  // 3) Entonnoir de la veille (Firestore conversionFunnel)
  let funnel = { locked_view: 0, locked_click_signup: 0, signup_complete: 0 };
  try { funnel = await readFunnel(env, startIso, endIso); } catch (e) { /* zéros */ }

  const nd = (v) => (v === null || v === undefined ? 'n/d' : String(v));
  const totalSuffix = totalMembres !== null ? ` (total ${totalMembres})` : '';

  // Format mobile : emoji + 1 ligne par métrique. Identique ntfy / Telegram.
  const lines = [
    `👀 Visiteurs : ${nd(visiteurs)}`,
    `✍️ Inscriptions : ${nd(inscriptions)}${totalSuffix}`,
    '— Entonnoir —',
    `🔒 Vues verrou : ${funnel.locked_view}`,
    `👉 Clics inscription : ${funnel.locked_click_signup}`,
    `✅ Inscriptions complétées : ${funnel.signup_complete}`,
  ];

  const title = `📊 ZTS — Hier ${dateStr}`;
  const text = lines.join('\n');
  const html = `<b>${escapeHtml(title)}</b>\n${escapeHtml(text)}`;

  return { title, text, html, dateStr, metrics: { visiteurs, inscriptions, totalMembres, funnel } };
}

/** Compte les events conversionFunnel sur [startIso, endIso) et agrège par étape.
 *  Range sur le seul champ `timestamp` → index simple, aucun index composite requis. */
async function readFunnel(env, startIso, endIso) {
  const token = await getAccessToken(env);
  const body = {
    structuredQuery: {
      from: [{ collectionId: FUNNEL_COLLECTION }],
      where: {
        compositeFilter: {
          op: 'AND',
          filters: [
            { fieldFilter: { field: { fieldPath: 'timestamp' }, op: 'GREATER_THAN_OR_EQUAL', value: { timestampValue: startIso } } },
            { fieldFilter: { field: { fieldPath: 'timestamp' }, op: 'LESS_THAN', value: { timestampValue: endIso } } },
          ],
        },
      },
    },
  };
  const r = await fetch(firestoreUrl(':runQuery'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('runQuery ' + r.status);
  const rows = await r.json();
  const out = { locked_view: 0, locked_click_signup: 0, signup_complete: 0 };
  for (const row of rows) {
    const ev = row.document && row.document.fields && row.document.fields.event
      ? row.document.fields.event.stringValue : null;
    if (ev && Object.prototype.hasOwnProperty.call(out, ev)) out[ev]++;
  }
  return out;
}

/** Lit analyticsDaily/{dateStr}.visits (0 si le doc n'existe pas encore). */
async function readVisits(env, dateStr) {
  const token = await getAccessToken(env);
  const r = await fetch(firestoreUrl(`/${VISITS_COLLECTION}/${dateStr}`), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 404) return 0;
  if (!r.ok) throw new Error('getDoc ' + r.status);
  const d = await r.json();
  const v = d.fields && d.fields.visits ? d.fields.visits.integerValue : '0';
  return Number(v) || 0;
}

/** Incrémente analyticsDaily/{aujourd'hui}.visits de 1 (upsert atomique). */
async function incrementVisit(env) {
  const token = await getAccessToken(env);
  const dateStr = ymd(new Date());
  const docName = `projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents/${VISITS_COLLECTION}/${dateStr}`;
  const body = {
    writes: [{
      update: { name: docName, fields: { date: { stringValue: dateStr } } },
      updateMask: { fieldPaths: ['date'] },
      updateTransforms: [{ fieldPath: 'visits', increment: { integerValue: '1' } }],
    }],
  };
  const r = await fetch(firestoreUrl(':commit'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error('commit ' + r.status);
}

// ════════════════════════════════════════════════════════════════════
// Firestore REST + OAuth Service Account (JWT RS256 via WebCrypto)
// Pattern réutilisé de cf-worker/generateur/src/firestore.js (testé en prod).
// ════════════════════════════════════════════════════════════════════

let _tokenCache = { token: null, exp: 0 };

async function getAccessToken(env) {
  const now = Math.floor(Date.now() / 1000);
  if (_tokenCache.token && _tokenCache.exp > now + 60) return _tokenCache.token;

  const raw = env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT manquant');
  const sa = typeof raw === 'string' ? JSON.parse(raw) : raw;

  const header = { alg: 'RS256', typ: 'JWT', kid: sa.private_key_id };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  };
  const unsigned = `${b64urlStr(JSON.stringify(header))}.${b64urlStr(JSON.stringify(payload))}`;
  const key = await importKey(sa.private_key);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${b64urlBytes(sig)}`;

  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  if (!r.ok) throw new Error('OAuth Google ' + r.status + ' ' + (await r.text()));
  const data = await r.json();
  _tokenCache = { token: data.access_token, exp: now + (data.expires_in || 3600) };
  return _tokenCache.token;
}

function firestoreUrl(suffix) {
  // suffix commence par '/' (doc) ou ':' (runQuery / commit)
  return `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents${suffix}`;
}

async function importKey(pem) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\\n/g, '')
    .replace(/\s/g, '');
  const der = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', der.buffer, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

// ── Utilitaires ──
function b64urlBytes(bytes) {
  const s = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlStr(s) { return b64urlBytes(new TextEncoder().encode(s)); }

function ymd(d) { return d.toISOString().slice(0, 10); }

/** Bornes UTC de la veille : { dateStr, startIso (00:00 veille), endIso (00:00 aujourd'hui) }. */
function yesterdayUtc() {
  const today0 = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');
  const yest0 = new Date(today0.getTime() - 86400000);
  return { dateStr: ymd(yest0), startIso: yest0.toISOString(), endIso: today0.toISOString() };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
