// Kookia — « À racheter » : les achats des 3 derniers mois (mouvements « achat »), lus à l'ouverture des Courses,
// et ce que le foyer achète souvent qui n'est plus en stock ni sur la liste.

import { DAY } from '../../services/dates/dates.js';
import { splitItemName } from '../../services/quantities/quantities.js';
import { frequentPurchases, sameItem } from '../../services/stats/purchases.js';
import { db } from './connection.js';
import { readMovements, stopReading } from './movement-feed.js';
import { emit, state } from './state.js';

const WINDOW_DAYS = 90;
const MAX_SUGGESTIONS = 8;

let watched = null; // code du foyer écouté

/**
 * Écoute les achats récents du foyer (une fois par session), sur l'écoute des mouvements partagée avec les
 * statistiques. Un refus des règles laisse simplement la liste vide.
 */
export function watchPurchases() {
  const code = state.settings.householdCode;
  if (!db || !code || watched === code) return;
  watched = code;
  readMovements(code, 'purchases', Date.now() - WINDOW_DAYS * DAY, (movements) => {
    state.purchases = movements.filter((m) => m.type === 'achat');
    emit('purchases');
  }, () => {
    state.purchases = [];
  });
}

export function stopPurchases() {
  stopReading('purchases');
  watched = null;
  state.purchases = [];
}

/** Achetés au moins 2 fois en 3 mois, plus en stock ni sur la liste (panier compris) : 8 au plus. */
export function restockSuggestions() {
  const known = [...state.products.map((p) => p.name), ...state.shopping.map((i) => splitItemName(i.name).base)];
  return frequentPurchases(state.purchases)
    .filter((p) => !known.some((name) => sameItem(name, p.name)))
    .slice(0, MAX_SUGGESTIONS);
}
