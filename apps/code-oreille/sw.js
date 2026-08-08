/* CODE OREILLE — service worker minimal.
   Objectif : l'app doit s'ouvrir dans un gymnase ou un boisé, sans réseau. */
const CACHE = 'code-oreille-v3';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

/* respondWith() exige une Response. Rendre undefined fait échouer le handler
   et le navigateur retombe sur le réseau — précisément ce qui manque hors
   ligne. On répond donc toujours quelque chose. */
function horsLigne() {
  return new Response('', {
    status: 504,
    statusText: 'Hors ligne',
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
}

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Navigation : réseau d'abord, cache en filet de sécurité.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put('./index.html', copy)).catch(() => {});
          return r;
        })
        .catch(() => caches.match('./index.html').then(hit => hit || horsLigne()))
    );
    return;
  }

  // Reste (dont les polices Google) : cache d'abord, puis réseau + mise en cache.
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req)
        .then(r => {
          if (r && (r.ok || r.type === 'opaque')) {
            const copy = r.clone();
            caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
          return r;
        })
        // Réseau mort et rien en cache : on rend une vraie Response, pas undefined.
        .catch(() => horsLigne());
    })
  );
});
