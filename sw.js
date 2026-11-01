// =========================================================
// SERVICE WORKER OPTIMIZADO - HUERTO HIDROPÓNICO ESH (v8)
// =========================================================

const CACHE_NAME = 'huerto-iot-v8';

// Lista completa y actualizada de assets locales y CDNs para soporte offline total
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './css/sidebar.css',
  './css/header.css',
  './css/sensores.css',
  './css/actuadores.css',
  './css/modals-auth.css',
  './css/formularios.css',
  './css/bitacora.css',
  './css/trackers.css',
  './css/reportes.css',
  './css/animations.css',
  './css/optimizations.css',
  './js/config.js',
  './js/auth.js',
  './js/sensors.js',
  './js/charts.js',
  './js/trackers.js',
  './js/cuadrillas.js',
  './js/weather-integration.js',
  './js/excel-export.js',
  './js/ui-ags-shell.js',
  './js/diagram-flow.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

// Instalación del Service Worker y almacenamiento inicial en caché
self.addEventListener('install', event => {
  console.log('👷 SW [v8]: Instalando y precacheando recursos del sistema...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

// Activación y purga automática de versiones anteriores de caché
self.addEventListener('activate', event => {
  console.log('🚀 SW [v8]: Activado con éxito');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ SW: Limpiando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptación de peticiones HTTP: Red primero -> Fallback a caché si no hay red
self.addEventListener('fetch', event => {
  // Ignorar peticiones a la base de datos Firebase para no interferir con WebSockets y auth
  if (
    event.request.url.includes('firebaseio.com') || 
    event.request.url.includes('googleapis.com/identitytoolkit') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        console.warn('📶 Red no disponible. Serviendo desde la caché:', event.request.url);
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});