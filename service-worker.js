const CACHE = 'aurelios-v1';
const ASSETS = [
  './',
  './index.html',
  './style.20251013.css',
  './app.20251013.js',
  './ui.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.map(k=>k===CACHE?null:caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=>r || fetch(e.request)));
});
