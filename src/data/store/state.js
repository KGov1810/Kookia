// Kookia — État observable de l'app.

import { loadSettings } from './settings-storage.js';

export const state = {
  settings: loadSettings(),
  products: [],
  shopping: [],
  recipes: [],
  connected: false,
  reconnecting: false,
  fromCache: true,
  pending: false,
  error: null,
  historyError: null,   // historique refusé (règles Firestore pas encore mises à jour)
  movements: [],        // mouvements de la période affichée dans Stats (chargés à la demande)
  movementsLoaded: false,
  movementsError: null, // statistiques refusées (règles Firestore pas encore mises à jour)
  prices: {},           // dernier prix payé, par code-barres ou par nom
  lastSync: null
};

const subscribers = new Set();

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function emit(what) {
  for (const fn of subscribers) {
    try {
      fn(what);
    } catch (error) {
      console.error(error);
    }
  }
}
