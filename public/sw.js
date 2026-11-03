/* Service Worker produzione - nessun build step: copiato verbatim da public/
 * Strategia:
 *  - /api/*        -> mai intercettate (nessun respondWith)
 *  - navigation    -> network-first, copia run-time in cache su /index.html,
 *                     fallback offline su /index.html
 *  - altri GET     -> cache-first, run-time cache solo su risposta ok same-origin
 */
var CACHE_NAME = 'task-time-tracker-cache-v2';
var PRECACHE = ['/', '/index.html', '/manifest.json', '/vite.svg'];

/* put in cache non bloccante: una scrittura fallita (es. quota) non deve
 * diventare un unhandled rejection né rompere la risposta al client */
function cachePut(request, response) {
  return caches.open(CACHE_NAME)
    .then(function (cache) { return cache.put(request, response); })
    .catch(function () { /* scrittura cache ignorata */ });
}

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(PRECACHE); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (keys) {
        return Promise.all(keys.filter(function (k) { return k !== CACHE_NAME; })
          .map(function (k) { return caches.delete(k); }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var url = new URL(event.request.url);

  if (url.pathname.indexOf('/api/') === 0) return;                 // mai cache le API
  if (event.request.method !== 'GET') return;

  if (event.request.mode === 'navigate') {                         // HTML: network-first
    event.respondWith(
      fetch(event.request)
        .then(function (res) {
          var copy = res.clone();
          cachePut('/index.html', copy);
          return res;
        })
        .catch(function () {
          return caches.match('/index.html').then(function (r) { return r || Response.error(); });
        })
    );
    return;
  }

  // statici: cache-first, caching run-time
  event.respondWith(
    caches.match(event.request).then(function (cached) {
      return cached || fetch(event.request).then(function (res) {
        if (res.ok && url.origin === self.location.origin) {
          var copy = res.clone();
          cachePut(event.request, copy);
        }
        return res;
      });
    }).catch(function () { return Response.error(); })
  );
});
