const CACHE="aurelios-v20251015";
const FILES=["/aurelios/","/aurelios/index.html","/aurelios/style.20251015.css","/aurelios/app.20251015.js","/aurelios/manifest.json"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(k=>k!==CACHE&&caches.delete(k)))));self.clients.claim();});
self.addEventListener("fetch",e=>{e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});
