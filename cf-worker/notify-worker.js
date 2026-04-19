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
const TELEGRAM_BOT = '8629738673:AAHOU6Gq1pUE1h2K0QJ-edYcS2rw1snk_uI';
const TELEGRAM_CHAT = '897290762';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request) {
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

    const tgText = `<b>${escapeHtml(title)}</b>\n${escapeHtml(fullMsg)}`;
    const tgP = fetch(`https://api.telegram.org/bot${TELEGRAM_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT, text: tgText, parse_mode: 'HTML' }),
    }).catch(() => {});

    await Promise.allSettled([ntfyP, tgP]);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  },
};

function escapeHtml(s) {
  return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
}
