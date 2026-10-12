// Kookia — Dates du stock : type de date, congélation, estimation, ancienneté.

import { BREAD_DAYS, LONG_LIFE_BREAD_WORDS, PACKAGED_BREAD_WORDS } from '../../data/reference/bread.js';
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

/** Nom sans accents, mots au singulier : « Pains au lait » → « pain au lait ». */
function breadText(name) {
  const words = String(name ?? '').replace(/’/g, "'").normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .split(/[^a-z']+/).filter(Boolean).map((w) => (w.length > 3 ? w.replace(/[sx]$/, '') : w));
  return ` ${words.join(' ')} `;
}

const hasWord = (text, word) => text.includes(` ${word} `);

/**
 * Pain et viennoiseries : 2 jours frais (baguette, croissants), 7 jours emballé (pain de mie, brioche, wraps),
 * null pour ce qui se garde longtemps (biscottes, pain grillé, chapelure) : pas de date estimée.
 */
export function breadDays(name) {
  const text = breadText(name);
  if (LONG_LIFE_BREAD_WORDS.some((w) => hasWord(text, w))) return null;
  return PACKAGED_BREAD_WORDS.some((w) => hasWord(text, w)) ? BREAD_DAYS.packaged : BREAD_DAYS.fresh;
}

/** Date estimée par défaut : fruits, légumes, et pain (sauf longue conservation). */
export function estimatedByDefault(category, name) {
  if (category === 'fruits' || category === 'legumes' || category === 'fruits_legumes') return true;
  return category === 'boulangerie' && breadDays(name) !== null;
}

/** Durée de conservation estimée (jours) d'un produit frais sans date imprimée. */
export function estimateFreshDays(name, location = 'frigo', category = '') {
  if (category === 'boulangerie' && breadDays(name) !== null) return breadDays(name);
  return produceFor(name)?.days ?? (location === 'fruits' ? 7 : 5);
}

export function ageInDays(product, today = new Date()) {
  const since = product.dateKind === 'congele' && parseISODate(product.frozenAt)
    ? parseISODate(product.frozenAt)
    : new Date(product.createdAt || Date.now());
  return Math.max(0, Math.floor((startOfDay(today) - startOfDay(since)) / DAY));
}
