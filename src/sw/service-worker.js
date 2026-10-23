// Kookia — service worker : l'app s'ouvre même sans réseau.
// Ce fichier est un modèle : au build, la version et la liste exacte des fichiers
// produits sont insérées ci-dessous (voir build/service-worker-plugin.js).
const VERSION = '__VERSION__';
const PRECACHE = __PRECACHE__;
const LIBRARY_HOSTS = ['cdn.jsdelivr.net'];
// Bibliothèques (code-barres, lecture de texte) : adresses à version figée, gardées d'une mise à jour de l'app à
// l'autre (sinon plusieurs Mo retéléchargés à chaque version).
const LIBRARY_CACHE = 'kookia-libs';

// Mise en cache depuis le serveur, jamais depuis le cache HTTP de Safari (il peut garder
// quelques minutes une ancienne page index.html qui demanderait des fichiers disparus).
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION)
    .then((cache) => cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

// Les anciennes versions restent en cache : une page encore ouverte (ou servie en retard)
// y retrouve ses fichiers. Elles sont effacées quand la nouvelle version a démarré (message « cleanup »).
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data !== 'cleanup') return;
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k.startsWith('kookia-') && k !== VERSION && k !== LIBRARY_CACHE)
      .map((k) => caches.delete(k)))));
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
    // Page et fichiers publics : réseau d'abord, en revalidant auprès du serveur (dernière version), cache si hors ligne.
    event.respondWith(
      fetch(request, { cache: 'no-cache' })
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

  // Bibliothèques chargées à la demande : leur cache d'abord (pas les anciens caches, qui peuvent garder une copie
  // « opaque » d'avant la vérification d'empreinte). Seules les réponses lisibles et complètes sont gardées.
  if (LIBRARY_HOSTS.includes(url.hostname)) {
    event.respondWith(caches.open(LIBRARY_CACHE).then((cache) => cache.match(request).then((cached) => cached
      ?? fetch(request).then((response) => {
        if (response.ok) cache.put(request, response.clone());
        return response;
      }))));
  }
  // Tout le reste (Firebase, Claude, Open Food Facts) passe directement par le réseau.
});
