// Kookia — Dates du stock : type de date, congélation, estimation, ancienneté.

import { FREEZER_MONTHS } from '../../data/reference/categories.js';
import { DAY, addMonths, parseISODate, startOfDay, toISODate } from '../dates/dates.js';
import { produceFor } from './categorization.js';

export function dateKindOf(product) {
  return product?.dateKind || 'dlc'; // anciens produits : date limite imprimée
}

/** Date limite conseillée d'un produit congelé maison. */
export function freezerLimit(category, frozenAtISO) {
  const frozen = parseISODate(frozenAtISO) ?? startOfDay();
  return toISODate(addMonths(frozen, FREEZER_MONTHS[category] ?? 6));
}

/** Durée de conservation estimée (jours) d'un produit frais sans date imprimée. */
export function estimateFreshDays(name, location = 'frigo') {
  return produceFor(name)?.days ?? (location === 'fruits' ? 7 : 5);
}

export function ageInDays(product, today = new Date()) {
  const since = product.dateKind === 'congele' && parseISODate(product.frozenAt)
    ? parseISODate(product.frozenAt)
    : new Date(product.createdAt || Date.now());
  return Math.max(0, Math.floor((startOfDay(today) - startOfDay(since)) / DAY));
}
