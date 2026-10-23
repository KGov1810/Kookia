// Tests : service worker (mises à jour sans page cassée) et script de secours de index.html.
// Cas réel : juste après une mise en ligne, l'iPhone affichait une ancienne page dont les fichiers
// avaient disparu (ni style ni code). L'ancienne version doit rester en cache jusqu'au démarrage de la nouvelle.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const VERSION = 'kookia-nouvelle';

/** Charge le modèle de service worker dans un bac à sable, avec des caches et un réseau simulés. */
function loadWorker({ cached = {}, libs = {} } = {}) {
  const stores = new Map(Object.entries({ 'kookia-ancienne': cached, [VERSION]: {}, 'kookia-libs': libs }));
  const calls = { addAll: [], fetch: [], deleted: [], put: [] };
  const listeners = {};
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (key) => { calls.deleted.push(key); return stores.delete(key); },
    open: async (key) => ({
      addAll: async (requests) => { calls.addAll.push(...requests); },
      put: async (request, response) => { calls.put.push({ key, url: request.url ?? request, response }); },
      match: async (request) => stores.get(key)?.[request.url ?? request]
    }),
    match: async (request) => {
      const url = typeof request === 'string' ? request : request.url;
      for (const store of stores.values()) if (store[url]) return store[url];
      return undefined;
    }
  };
  const sandbox = {
    self: {
      location: { origin: 'https://exemple.github.io' },
      addEventListener: (type, fn) => { listeners[type] = fn; },
      skipWaiting: async () => {},
      clients: { claim: async () => {} }
    },
    caches,
    fetch: async (request, init) => { calls.fetch.push({ url: request.url ?? request, init }); return { ok: true, type: 'cors', clone() { return this; } }; },
    // Comme dans un navigateur : adresses relatives résolues par rapport au site.
    Request: class extends Request {
      constructor(input, init) {
        super(typeof input === 'string' ? new URL(input, 'https://exemple.github.io/kookia/').href : input, init);
      }
    },
    URL,
    Promise
  };
  const source = readFileSync('src/sw/service-worker.js', 'utf8')
    .replaceAll('__VERSION__', VERSION)
    .replaceAll('__PRECACHE__', JSON.stringify(['./', './index.html', './assets/index-abc.js']));
  vm.runInNewContext(source, sandbox);
  const run = async (type, event) => {
    let pending = null;
    listeners[type]({ ...event, waitUntil: (p) => { pending = p; }, respondWith: (p) => { pending = p; } });
    return pending;
  };
  return { run, calls, stores };
}

describe('service worker', () => {
  it('installation : fichiers pris sur le serveur, jamais dans le cache HTTP de Safari', async () => {
    const sw = loadWorker();
    await sw.run('install', {});
    expect(sw.calls.addAll.map((r) => r.cache)).toEqual(['reload', 'reload', 'reload']);
  });

  it('activation : l\'ancienne version reste en cache ; effacée au démarrage de la nouvelle (« cleanup »)', async () => {
    const sw = loadWorker();
    await sw.run('activate', {});
    expect(sw.calls.deleted).toEqual([]);
    await sw.run('message', { data: 'cleanup' });
    expect(sw.calls.deleted).toEqual(['kookia-ancienne']); // les bibliothèques (kookia-libs) restent
  });

  it('bibliothèques : gardées d\'une version à l\'autre, jamais reprises d\'un ancien cache', async () => {
    const url = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.2.1/umd/zxing-browser.min.js';
    const opaque = { ok: false, type: 'opaque' };
    const sw = loadWorker({ cached: { [url]: opaque } });
    const response = await sw.run('fetch', { request: new Request(url) });
    expect(response).not.toBe(opaque); // une copie « opaque » ne passerait pas la vérification d'empreinte
    expect(sw.calls.fetch.map((f) => f.url)).toEqual([url]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sw.calls.put.map((p) => p.key)).toEqual(['kookia-libs']);
    const kept = { ok: true, type: 'cors' };
    const again = loadWorker({ libs: { [url]: kept } });
    expect(await again.run('fetch', { request: new Request(url) })).toBe(kept);
    expect(again.calls.fetch).toEqual([]);
  });

  it('une ancienne page retrouve ses fichiers dans l\'ancien cache', async () => {
    const oldScript = { ok: true, body: 'ancien code' };
    const sw = loadWorker({ cached: { 'https://exemple.github.io/kookia/assets/index-ancien.js': oldScript } });
    const response = await sw.run('fetch', { request: new Request('https://exemple.github.io/kookia/assets/index-ancien.js') });
    expect(response).toBe(oldScript);
    expect(sw.calls.fetch).toEqual([]);
  });

  it('la page est redemandée au serveur (revalidation), pas reprise telle quelle du cache HTTP', async () => {
    const sw = loadWorker();
    await sw.run('fetch', { request: new Request('https://exemple.github.io/kookia/') });
    expect(sw.calls.fetch[0].init).toEqual({ cache: 'no-cache' });
  });
});

describe('secours au démarrage', () => {
  const index = readFileSync('index.html', 'utf8');
  const main = readFileSync('src/main.js', 'utf8');

  it('index.html : script de secours avant le code de l\'app (rechargement unique, puis bouton)', () => {
    expect(index.indexOf("var KEY = 'kookia.reload'")).toBeGreaterThan(0);
    expect(index.indexOf("var KEY = 'kookia.reload'")).toBeLessThan(index.indexOf('src="./src/main.js"'));
    expect(index).toContain('Recharger l\\u2019app');
    expect(index).toContain('navigator.serviceWorker.getRegistrations()');
  });

  it('main.js : démarrage signalé (pas de secours) et nettoyage des anciennes versions demandé', () => {
    expect(main).toContain('window.__kookiaReady = true');
    expect(main).toContain("postMessage('cleanup')");
  });
});
