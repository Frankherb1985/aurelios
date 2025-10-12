// one-time hard reset to clear old SW caches
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(async regs => {
    for (const r of regs) {
      try { await r.unregister(); } catch {}
    }
    if (caches && caches.keys) {
      const keys = await caches.keys();
      for (const k of keys) { try { await caches.delete(k); } catch {} }
    }
  });
}
self.addEventListener('install', e=>{
  e.waitUntil(caches.open('aurelios-v2').then(c=>c.addAll(['./','./index.html','./style.css','./app.js','./manifest.json'])))
})
self.addEventListener('fetch', e=>{
  e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request)))
})
