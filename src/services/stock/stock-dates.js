// Kookia — Dates du stock : type de date, congélation, estimation, ancienneté.

import { BREAD_DAYS, LONG_LIFE_BREAD_WORDS, PACKAGED_BREAD_WORDS } from '../../data/reference/bread.js';
import { FREEZER_MONTHS } from '../../data/reference/categories.js';
import { UNKNOWN_PRODUCE_DAYS } from '../../data/reference/produce.js';
import { DAY, addDays, addMonths, parseISODate, startOfDay, toISODate } from '../dates/dates.js';
import { produceFor } from './categorization.js';
import { fridgeDays, fridgeEstimable } from './fridge-days.js';

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

/**
 * Au frais : au frigo, ou rangé avec les fruits et légumes dans le frigo. Pour « Fruits & légumes », le choix
 * fait dans la fiche (cold), sinon l'habitude du produit (carottes au frigo, bananes hors du frigo).
 */
export function keptCold(product) {
  if (product.location === 'frigo') return true;
  if (product.location !== 'fruits') return false;
  return typeof product.cold === 'boolean' ? product.cold : produceFor(product.name)?.place === 'frigo';
}

/**
 * Durée de conservation estimée (jours) d'un produit sans date imprimée, au frais ou non ; pour un produit du frigo
 * (yaourts, beurre…), durée prudente en attendant la date de l'emballage.
 */
export function estimateFreshDays(name, location = 'frigo', category = '', cold = keptCold({ name, location })) {
  if (category === 'boulangerie' && breadDays(name) !== null) return breadDays(name);
  if (fridgeEstimable(category, location)) return fridgeDays(name, category);
  const item = produceFor(name);
  if (item) return cold ? item.fridgeDays : item.roomDays;
  return cold ? UNKNOWN_PRODUCE_DAYS.fridge : UNKNOWN_PRODUCE_DAYS.room;
}

/** Date estimée d'un produit en stock, comptée depuis son ajout, pour son rangement actuel. */
export function estimatedExpiry(product) {
  const added = startOfDay(new Date(product.createdAt || Date.now()));
  return toISODate(addDays(added, estimateFreshDays(product.name, product.location, product.category, keptCold(product))));
}

export function ageInDays(product, today = new Date()) {
  const since = product.dateKind === 'congele' && parseISODate(product.frozenAt)
    ? parseISODate(product.frozenAt)
    : new Date(product.createdAt || Date.now());
  return Math.max(0, Math.floor((startOfDay(today) - startOfDay(since)) / DAY));
}
