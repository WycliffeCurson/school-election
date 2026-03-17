const CACHE_NAME = "heshima-election-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/vote.html",
  "/results.html",
  "/admin-panel.html",
  "/admin-register.html",
  "/summary.html",
  "/css/style.css",
  "/css/vote.css",
  "/css/results.css",
  "/css/admin.css",
  "/css/admin-register.css",
  "/css/summary.css",
  "/js/auth.js",
  "/js/vote.js",
  "/js/results.js",
  "/js/admin-panel.js",
  "/js/admin-auth.js",
  "/js/sounds.js",
  "/firebase/config.js"
];

// Install — cache all assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch — network first, fall back to cache
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});