const CACHE_NAME = 'white-label-delivery-v1';

// 1. Instalar el Service Worker y tomar el control de inmediato
self.addEventListener('install', event => {
    self.skipWaiting();
});

// 2. Limpiar cachés antiguas al actualizar la aplicación
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
});

// 3. Estrategia: Network-First (Intentar red primero, si falla usar caché)
// Es ideal para delivery porque necesitamos que el stock y precios estén siempre al día.
self.addEventListener('fetch', event => {
    // IMPORTANTE: No interceptamos las peticiones API de PocketBase para no romper el tiempo real
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Si la respuesta es exitosa, guardamos una copia en caché
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Si no hay conexión a internet, servimos el archivo guardado en caché
                return caches.match(event.request);
            })
    );
});