/* Cinemap service worker — minimal cache-first shell with network fallback */
const CACHE = 'cinemap-shell-v50';
const SHELL = [
  './',
  './index.html',
  './about.html',
  './privacy.html',
  './terms.html',
  './manifest.webmanifest',
  './assets/cinemap-logo.svg',
  './assets/cinemap-mark.svg',
  './assets/vendor/react.development.js',
  './assets/vendor/react-dom.development.js',
  './assets/vendor/babel.min.js',
  './assets/src/utils.js?v=50',
  './assets/src/analytics.js?v=50',
  './assets/src/tmdb-client.js?v=50',
  './assets/src/ui.js?v=50',
  './assets/src/calendar.js?v=50',
  './assets/src/featured.js?v=50',
  './assets/src/notify.js?v=50',
  './assets/src/rating.js?v=50',
  './assets/src/calpicker.js?v=50',
  './assets/src/sections.js?v=50',
  './assets/src/app.js?v=50',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Don't cache cross-origin (TMDB images, Formspree, Google Fonts CSS, YouTube)
  if (url.origin !== self.location.origin) return;

  // Stale-while-revalidate for shell + assets
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const network = fetch(req)
      .then((res) => {
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      })
      .catch(() => null);
    return cached || (await network) || new Response('', { status: 504 });
  })());
});
