// Kookia — Démarrage de l'application.

import './styles/index.css';
import * as store from './data/store/index.js';
import { wireEvents } from './views/app/events.js';
import { onStoreChange, render } from './views/app/router.js';

function boot() {
  wireEvents();
  store.subscribe(onStoreChange);
  render();
  store.start();
  markReady();
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
    // Cette version a démarré : le service worker peut effacer les anciennes.
    navigator.serviceWorker.ready.then((registration) => registration.active?.postMessage('cleanup')).catch(() => {});
  }
}

/** Démarrage réussi : pas de secours à afficher (voir le script de secours dans index.html). */
function markReady() {
  window.__kookiaReady = true;
  document.getElementById('boot-help')?.remove();
  try {
    sessionStorage.removeItem('kookia.reload');
  } catch {
    // Stockage indisponible (navigation privée) : sans importance.
  }
}

boot();
