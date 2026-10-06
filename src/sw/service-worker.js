// Kookia — service worker : l'app s'ouvre même sans réseau.
// Ce fichier est un modèle : au build, la version et la liste exacte des fichiers
// produits sont insérées ci-dessous (voir build/service-worker-plugin.js).
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const LIBRARY_HOSTS = ['cdn.jsdelivr.net'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    // Fichiers de Vite (nom avec empreinte, jamais modifiés) : cache d'abord.
    if (url.pathname.includes('/assets/')) {
      event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
      return;
    }
    // Page et fichiers publics : réseau d'abord (dernière version), cache si hors ligne.
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(async () => (await caches.match(request, { ignoreSearch: true }))
          ?? (request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
    );
    return;
  }

  // Bibliothèques chargées à la demande (code-barres, lecture de texte) : cache d'abord.
  if (LIBRARY_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.match(request).then((cached) => cached ?? fetch(request).then((response) => {
        if (response.ok || response.type === 'opaque') {
          const copy = response.clone();
          caches.open(VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      }))
    );
  }
  // Tout le reste (Firebase, Claude, Open Food Facts) passe directement par le réseau.
});
