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
  purchases: [],        // achats des 3 derniers mois, pour « À racheter » (purchases.js)
  prices: {},           // dernier prix payé, par code-barres ou par nom
  placements: {},       // catégorie et rangement corrigés à la main, par code-barres ou par nom
  shelfDays: {},        // durée retenue entre l'achat et la date d'un produit du frigo (fridge-dates.js)
  shelfDaysLoaded: false,
  productsLoaded: false, // stock reçu du serveur au moins une fois
  languages: {},        // langue de chaque iPhone du foyer (foyers/{code}/prix/langues), par identifiant
  plan: null,           // planning de la semaine (foyers/{code}/prix/semaine), partagé entre les iPhone
  endedPlan: null,      // planning terminé, effacé automatiquement pendant cette session ({ start })
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
