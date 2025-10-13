// GitHub Pages (project site) scope: /aurelios/
const VERSION = 'aurelios-v20251013-7';
const ASSETS = [
  '/aurelios/',
  '/aurelios/index.html',
  '/aurelios/style.20251013.css',
  '/aurelios/app.20251013.js',
  '/aurelios/ui.js',
  '/aurelios/manifest.json'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    const resp = await fetch(req);
    if (req.method === 'GET' && new URL(req.url).origin === location.origin) {
      const c = await caches.open(VERSION);
      c.put(req, resp.clone());
    }
    return resp;
  })());
});
