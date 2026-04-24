const CACHE_NAME = 'mi-baseball-dashboards-v1';
const APP_SHELL = [
  '/',
  '/little-league',
  '/select-team',
  '/mill-majors',
  '/mi-11u',
  '/little-league.html',
  '/select-team.html',
  '/styles.css',
  '/little-league.css',
  '/little-league.js',
  '/little-league-data.js',
  '/little-league-data.json',
  '/dashboard-pwa.js',
  '/dashboard-sw.js',
  '/manifest-mill-majors.json',
  '/manifest-mi-11u.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        return caches.match(request) || caches.match('/little-league.html') || Response.error();
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      });
    })
  );
});
