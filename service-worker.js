// ✅ cinematic cache
const CACHE = "aurelios-v12";
const ASSETS = [
  "./",
  "./index.html",
  "./style.cinematic.css?v=12",
  "./app.cinematic.js?v=12",
  "./icon-192.png",
  "./icon-512.png"
];
self.addEventListener("install", e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener("activate", e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e=>{
  const req=e.request;
  e.respondWith(
    caches.match(req).then(r=>r||fetch(req).then(net=>{
      if(req.method==="GET"){const copy=net.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
      return net;
    }))
  );
});
