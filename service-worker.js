self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open("aurelios-cache").then((cache) => {
      return cache.addAll([
        "./",
        "index.html",
        "style.20251013.css",
        "app.20251013.js",
        "ui.js",
        "manifest.json"
      ]);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((response) => response || fetch(e.request))
  );
});
