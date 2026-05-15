/* Cinemap service worker — network-first for app shell, cache-first for static assets */
const CACHE = 'cinemap-shell-v52';
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
  './assets/src/utils.js?v=67',
  './assets/src/analytics.js?v=67',
  './assets/src/tmdb-client.js?v=67',
  './assets/src/ui.js?v=67',
  './assets/src/calendar.js?v=67',
  './assets/src/featured.js?v=67',
  './assets/src/notify.js?v=67',
  './assets/src/rating.js?v=67',
  './assets/src/calpicker.js?v=67',
  './assets/src/sections.js?v=67',
  './assets/src/app.js?v=67',
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

// Allow the page to tell a waiting worker to take over immediately.
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Don't cache cross-origin (TMDB images, Formspree, Google Fonts CSS, YouTube)
  if (url.origin !== self.location.origin) return;

  const path = url.pathname;
  const isNetworkFirst =
    req.mode === 'navigate' ||
    path.endsWith('.html') ||
    path.endsWith('.js') ||
    path.endsWith('.json') ||
    path.endsWith('.webmanifest');

  if (isNetworkFirst) {
    // Network-first: always try fresh, fall back to cache when offline.
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch (_) {
        const cached = await cache.match(req);
        return cached || new Response('', { status: 504 });
      }
    })());
    return;
  }

  // Cache-first for everything else same-origin (SVG, CSS, fonts, png/jpg, vendor JS).
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    } catch (_) {
      return new Response('', { status: 504 });
    }
  })());
});
