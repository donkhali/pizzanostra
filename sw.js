const CACHE_NAME = 'pizza-nostra-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './admin.html'
];

// Instalación del Service Worker y almacenamiento de assets locales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activación y limpieza de cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Intercepción de peticiones inteligentes
self.addEventListener('fetch', event => {
  // 🔥 REGLA DE ORO: Si la petición NO es un GET (como el POST de SQLite Cloud) 
  // o si va hacia un servidor externo de base de datos, NO la interceptes.
  // Déjala pasar directo a internet sin tocarla.
  if (event.request.method !== 'GET' || event.request.url.includes('sqlite.cloud')) {
    return; // Al salir con return, la petición sigue su curso normal por la red
  }

  // Manejo normal de caché para los archivos locales de la app
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
