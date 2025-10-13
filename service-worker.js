const CACHE = "aurelios-v20251013";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll([
        "./",
        "index.html",
        "style.20251013.css",
        "app.20251013.js",
        "ui.js",
        "manifest.json",
        "icon-192.png",
        "icon-512.png"
      ])
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request, {ignoreSearch:true}).then((resp) => {
      return resp || fetch(event.request);
    })
  );
});
