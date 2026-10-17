// Kookia — Produits entamés : part restante, quantité en stock, date et rangement après ouverture.
// Une ligne entamée a toujours un seul exemplaire : on met à part l'unité qu'on ouvre.

import * as O from '../../data/reference/opening.js';
import { hasDate, isoInDays } from '../dates/dates.js';
import { categoryTokens } from './categorization.js';

const round3 = (n) => Math.round(n * 1000) / 1000;

/** Part restante de l'unité entamée (1 : intacte). */
export function remainingOf(product) {
  const r = Number(product?.remaining);
  return r > 0 && r < 1 ? round3(r) : 1;
}

export function isOpened(product) {
  return remainingOf(product) < 1;
}

/** Quantité en stock, en unités : 3 pots dont un à moitié = 2,5. */
export function stockAmount(product) {
  return Math.max(1, Math.round(Number(product?.count) || 1)) - 1 + remainingOf(product);
}

/** « n unités » choisies à la main : l'unité entamée compte pour ce qu'il en reste. */
export function unitsAmount(product, units) {
  return round3(Math.min(stockAmount(product), remainingOf(product) + Math.max(1, Math.round(units)) - 1));
}

/**
 * Retire « amount » unités (fractions comprises). Renvoie la quantité retirée et ce qui reste :
 * whole unités intactes et, s'il y a lieu, une unité entamée (part restante opened).
 */
export function splitAfter(product, amount) {
  const total = stockAmount(product);
  const left = round3(total - Math.max(0, amount));
  if (left <= 0.02) return { taken: total, whole: 0, opened: null };
  const whole = Math.floor(left + 1e-9);
  const fraction = round3(left - whole);
  if (fraction < 0.02) return { taken: round3(total - whole), whole, opened: null };
  if (fraction > 0.98) return { taken: round3(total - whole - 1), whole: whole + 1, opened: null };
  return { taken: round3(total - left), whole, opened: fraction };
}

/** ¾, ½, ¼, ou un pourcentage. */
export function remainingLabel(remaining) {
  const marks = { 0.75: '¾', 0.5: '½', 0.25: '¼' };
  const near = Object.keys(marks).map(Number).find((m) => Math.abs(m - remaining) < 0.02);
  return near ? marks[near] : `${Math.round(remaining * 100)} %`;
}

function contains(tokens, phrase) {
  return tokens.some((_, i) => phrase.every((t, k) => tokens[i + k] === t));
}

// Toutes les langues ; les expressions d'abord (« sauce soja » avant « sauce »), sinon dans l'ordre des listes.
const OPENED_WORDS = [...O.OPENED_WORDS, ...O.OPENED_WORDS_INTL]
  .map(([text, days]) => [categoryTokens(text), days])
  .sort((a, b) => b[0].length - a[0].length);

/** Jours de conservation après ouverture (null : pas de date à raccourcir). */
export function openedDays(product) {
  const tokens = categoryTokens(product.name);
  const word = OPENED_WORDS.find(([text]) => contains(tokens, text));
  if (word) return word[1];
  return O.OPENED_DAYS_BY_CATEGORY[product.category] ?? null;
}

const COOL_WORDS = O.KEEP_COOL_WORDS.split(' ').map((w) => categoryTokens(w)[0]);

/**
 * Ce qui change quand on ouvre une unité : rangée au frigo si elle doit être au frais,
 * date raccourcie (jamais repoussée) et type de date adapté. {} si rien ne change.
 */
export function openingChanges(product, today = new Date()) {
  const changes = {};
  if (product.location === 'congelateur') return changes;
  const tokens = categoryTokens(product.name);
  const cool = O.KEEP_COOL_CATEGORIES.includes(product.category) || COOL_WORDS.some((w) => tokens.includes(w));
  const location = cool && ['placard', 'fruits'].includes(product.location) ? 'frigo' : product.location;
  if (location !== product.location) changes.location = location;
  const days = openedDays(product);
  if (days === null) return changes;
  const limit = isoInDays(days, today);
  const expiry = hasDate(product.expiry) && product.expiry < limit ? product.expiry : limit;
  if (expiry !== product.expiry) changes.expiry = expiry;
  // Type de date compatible avec le lieu : « de préférence » au placard, estimée pour un fruit ou un légume,
  // date limite au frigo pour un produit frais qui se garde peu (sinon « de préférence »).
  const produce = product.category === 'fruits' || product.category === 'legumes';
  let dateKind = product.dateKind;
  if (location === 'placard') dateKind = 'ddm';
  else if (location === 'fruits' || produce) dateKind = 'estimee';
  else if (changes.location || ['aucune', 'estimee', ''].includes(dateKind ?? '')) dateKind = days <= 7 ? 'dlc' : 'ddm';
  if (dateKind !== product.dateKind) changes.dateKind = dateKind;
  return changes;
}
