const CACHE_NAME = 'karaoke-latino-v20'; // Subí a v20 para asegurar limpieza
const urlsToCache = [
  '/',
  'index.html',
  'style.css',
  'app.js',
  'songs.js',
  'manifest.json',
  'logo.png'
];

// Instalación: Guarda los archivos en la memoria del teléfono
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// Activación: Borra cachés viejos que puedan tener errores
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Respuesta: Sirve los archivos desde la memoria
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});