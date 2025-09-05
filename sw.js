const CACHE_NAME = 'stocksee-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/index.tsx',
];

self.addEventListener('install', event => {
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        // Add all the assets to the cache
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // For API calls to the stock service, always go to the network to ensure data is fresh.
  if (event.request.url.includes('corsproxy.io')) {
    event.respondWith(fetch(event.request));
    return;
  }
  
  // For all other requests (the app shell), try the cache first for an offline-first experience.
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // If not in cache, go to the network.
        return fetch(event.request);
      }
    )
  );
});
