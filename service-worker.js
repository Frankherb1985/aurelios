const CACHE='aurelios-final-v1';
self.addEventListener('install',e=>{
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll([
    './','./index.html','./style.css?v=final','./app.js?v=final','./manifest.json'
  ])));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(/\.(html|css|js)$/.test(url.pathname))
    e.respondWith(fetch(e.request).then(r=>{
      const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy));return r;
    }).catch(()=>caches.match(e.request)));
  else
    e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
