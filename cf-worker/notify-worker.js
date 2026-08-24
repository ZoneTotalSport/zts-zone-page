/**
 * ZTS Notify Worker - server-side proxy vers ntfy + Telegram
 * Bypass des bloqueurs (Brave Shields, uBlock, etc.) car first-party.
 *
 * Deploy : Cloudflare Dashboard > Workers & Pages > Create Worker
 * Route   : zonetotalsport.ca/api/notify*
 *
 * Body POST attendu (JSON) :
 *   { type: "visit"|"signup"|"login"|"click"|"review"|"summary",
 *     title: "...", message: "...", priority: 3, tags: "bell" }
 */

const NTFY_TOPIC = 'zts-joey-9k3mq7xv4p';

// LE JETON N'EST PLUS DANS LE CODE. Il vit dans un secret Cloudflare, meme
// patron qu'ANTHROPIC_API_KEY pour zts-generateur :
//
//     wrangler secret put TELEGRAM_BOT_TOKEN
//     wrangler secret put TELEGRAM_CHAT_ID
//
// Avant le 24 aout 2026 il etait ecrit ici EN CLAIR, dans un fichier commite
// — et pire, la meme valeur etait dans telegram-notify.js, servi en
// JavaScript de navigateur sur les pages du site. N'importe quel visiteur
// pouvait le lire dans la source et prendre la main sur le bot. Le jeton a ete
// revoque aupres de @BotFather ; celui qui le remplace ne doit JAMAIS
// reapparaitre dans le depot.
//
// Le motif <chiffres>:<35 caracteres base64url> a ete ajoute a
// _scripts/verifie-secrets.sh le meme jour : un jeton Telegram recolle ici
// bloquerait desormais le commit.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // robots.txt valide (webhook interne -> jamais indexé). Corrige l'erreur
    // critique GSC : auparavant le worker renvoyait 'OK' sur /robots.txt.
    if (request.method === 'GET' && new URL(request.url).pathname === '/robots.txt') {
      return new Response('User-agent: *\nDisallow: /\n', {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== 'POST') {
      return new Response('OK', { status: 200, headers: CORS });
    }

    let data = {};
    try { data = await request.json(); } catch (e) {}

    const title = (data.title || 'ZTS').slice(0, 200);
    const message = (data.message || '').slice(0, 4000);
    const priority = String(data.priority || 3);
    const tags = data.tags || '';

    const ip = request.headers.get('CF-Connecting-IP') || '';
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

    const ntfyP = fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: 'POST',
      headers: { 'Title': title, 'Priority': priority, 'Tags': tags },
      body: fullMsg,
    }).catch(() => {});

    // Sans secret configure, on ne tente rien vers Telegram — et on le DIT en
    // journal plutot que de laisser un `fetch` partir vers `/botundefined/`,
    // qui repondrait 404 en silence.
    const jeton = env && env.TELEGRAM_BOT_TOKEN;
    const salon = env && env.TELEGRAM_CHAT_ID;
    let tgP = Promise.resolve();
    if (jeton && salon) {
      const tgText = `<b>${escapeHtml(title)}</b>\n${escapeHtml(fullMsg)}`;
      tgP = fetch(`https://api.telegram.org/bot${jeton}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: salon, text: tgText, parse_mode: 'HTML' }),
      }).catch(() => {});
    } else {
      console.warn('[notify] TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID absent — ntfy seul.');
    }

    await Promise.allSettled([ntfyP, tgP]);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  },
};

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
