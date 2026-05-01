/* Cinemap service worker — minimal cache-first shell with network fallback */
const CACHE = 'cinemap-shell-v8';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/cinemap-logo.svg',
  './assets/cinemap-mark.svg',
  './assets/vendor/react.development.js',
  './assets/vendor/react-dom.development.js',
  './assets/vendor/babel.min.js',
  './assets/src/utils.js',
  './assets/src/tmdb-client.js',
  './assets/src/ui.js',
  './assets/src/calendar.js',
  './assets/src/featured.js',
  './assets/src/notify.js',
  './assets/src/rating.js',
  './assets/src/sections.js',
  './assets/src/app.js',
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
