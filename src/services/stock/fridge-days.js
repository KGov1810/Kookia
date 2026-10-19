// Kookia — Produits du frigo : lesquels reçoivent une date estimée en attendant celle de l'emballage, et pour combien de jours.

import { FRIDGE_CATEGORY_DAYS, FRIDGE_DEFAULT_DAYS, FRIDGE_WORDS, MANUAL_DATE_CATEGORIES } from '../../data/reference/fridge-days.js';
import { nameTokens } from '../text/text.js';

// Fruits, légumes et pain ont leur propre estimation (produce.js, bread.js).
const OWN_ESTIMATE = ['fruits', 'legumes', 'fruits_legumes', 'boulangerie'];

/** Viande, volaille, poisson, charcuterie, traiteur : la date se complète à la main, jamais estimée. */
export function manualDate(category) {
  return MANUAL_DATE_CATEGORIES.includes(category);
}

/** Produit du frigo dont la date est estimée tant qu'on ne l'a pas saisie (yaourts, beurre, fromage…). */
export function fridgeEstimable(category, location) {
  return (location || 'frigo') === 'frigo' && Boolean(category) && !manualDate(category) && !OWN_ESTIMATE.includes(category);
}

const WORDS = FRIDGE_WORDS.map(([days, words]) => [days, new Set(words.split(' '))]);

/**
 * Durée prudente d'un produit du frigo : d'après le premier mot reconnu de son nom (« Yaourt au lait » : un yaourt,
 * 14 j ; « Beurre doux » : 30 j), sinon sa catégorie, sinon 5 j.
 */
export function fridgeDays(name, category) {
  for (const token of nameTokens(name).flatMap((word) => word.split('-'))) {
    const found = WORDS.find(([, words]) => words.has(token));
    if (found) return found[0];
  }
  return FRIDGE_CATEGORY_DAYS[category] ?? FRIDGE_DEFAULT_DAYS;
}
