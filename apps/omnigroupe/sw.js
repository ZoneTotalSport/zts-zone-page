const CACHE='omnigroupe-v3';
const ASSETS=[
  './',
  './index.html',
  './manifest.json',
  './i18n.js',
  './i18n-data-en.js',
  './img/sos-hero.jpg',
  './img/bruit.jpg',
  './img/opposition.jpg',
  './img/panique.jpg',
  './img/conflit.jpg',
  './img/refus.jpg',
  './img/materiel.jpg',
  './img/blessure.jpg',
  './img/attente.jpg',
  './img/tricherie.jpg',
  './img/canicule.jpg',
  './img/bucheron-tni.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Bangers&family=Fredoka:wght@400;500;600;700&display=swap'
];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',e=>{
  e.respondWith(
    caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
      if(resp.ok&&e.request.method==='GET'){
        const clone=resp.clone();
        caches.open(CACHE).then(c=>c.put(e.request,clone));
      }
      return resp;
    }).catch(()=>caches.match('./index.html')))
  );
});
