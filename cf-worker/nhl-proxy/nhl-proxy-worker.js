// =============================================================================
// zts-nhl-proxy — proxy CORS + cache edge pour l'API NHL (api-web.nhle.com)
// =============================================================================
// L'API NHL n'envoie pas d'en-têtes CORS, donc le front passe d'habitude par des
// proxies publics (codetabs, allorigins…) : lents et instables au 1er chargement.
//
// Ce worker :
//   1. Forwarde GET https://nhl.zonetotalsport.ca/v1/...  ->  https://api-web.nhle.com/v1/...
//   2. Ajoute Access-Control-Allow-Origin: * (CORS)
//   3. Met en cache au edge Cloudflare (caches.default) -> 1er chargement instantané
//      dès qu'un visiteur a réchauffé le cache de la région.
//
// Whitelist stricte : seul api-web.nhle.com est relayé.
// =============================================================================

const ORIGIN = 'https://api-web.nhle.com';

// TTL de cache (secondes) selon le type de ressource.
function ttlFor(pathname) {
  if (pathname.includes('/playoff-bracket/')) return 60;   // bracket : change peu
  if (pathname.includes('/score/'))           return 30;   // scores du jour : live
  if (pathname.includes('/gamecenter/'))       return 30;   // boxscore/landing : live
  if (pathname.includes('/schedule/'))         return 120;
  if (pathname.includes('-stats-leaders/'))    return 300;  // meneurs : lent à bouger
  return 60;
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS });
    }

    const url = new URL(request.url);

    // Seules les routes /v1/... sont relayées (mappe directement l'API NHL).
    if (!url.pathname.startsWith('/v1/')) {
      return new Response('Not Found', { status: 404, headers: CORS });
    }

    const ttl = ttlFor(url.pathname);

    // --- Cache edge : clé = URL normalisée du worker (sans query parasite) ---
    const cacheKey = new Request(url.toString(), { method: 'GET' });
    const cache = caches.default;
    let hit = await cache.match(cacheKey);
    if (hit) {
      const r = new Response(hit.body, hit);
      r.headers.set('X-ZTS-Cache', 'HIT');
      return r;
    }

    // --- Miss : on va chercher à la source NHL ---
    const originUrl = ORIGIN + url.pathname + url.search;
    let originResp;
    try {
      originResp = await fetch(originUrl, {
        // Cache aussi côté Cloudflare->origine pour amortir les rafales.
        cf: { cacheTtl: ttl, cacheEverything: true },
        headers: { 'Accept': 'application/json', 'User-Agent': 'zts-nhl-proxy' },
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: 'origin_fetch_failed' }), {
        status: 502,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    if (!originResp.ok) {
      return new Response(JSON.stringify({ error: 'origin_status', status: originResp.status }), {
        status: originResp.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    const body = await originResp.arrayBuffer();
    const resp = new Response(body, {
      status: 200,
      headers: {
        ...CORS,
        'Content-Type': originResp.headers.get('Content-Type') || 'application/json',
        'Cache-Control': `public, max-age=${ttl}`,
        'X-ZTS-Cache': 'MISS',
      },
    });

    // Stocke au edge sans bloquer la réponse.
    ctx.waitUntil(cache.put(cacheKey, resp.clone()));
    return resp;
  },
};
