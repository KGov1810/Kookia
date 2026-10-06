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
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  }
}

boot();
