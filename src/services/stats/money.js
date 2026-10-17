// Kookia — Prix : lecture d'une saisie (« 2,49 », « 2.49 € »), arrondi et affichage en euros.

import { localeTag } from '../i18n/i18n.js';

const formats = new Map();

/** Euros au format de la langue : « 2,49 € », « €2.49 »… */
function euroFormat() {
  const tag = localeTag();
  if (!formats.has(tag)) formats.set(tag, new Intl.NumberFormat(tag, { style: 'currency', currency: 'EUR' }));
  return formats.get(tag);
}

/** Prix enregistrable (nombre ≥ 0, au dixième de centime) ou null s'il est inconnu. */
export function cleanPrice(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n >= 100_000) return null;
  return Math.round(n * 1000) / 1000;
}

export function roundCents(value) {
  return Math.round(value * 100) / 100;
}

/** Saisie libre → prix, ou null (champ vide ou illisible). */
export function parsePrice(text) {
  const clean = String(text ?? '')
    .replace(/[€\s\u00a0\u202f]/g, '')
    .replace(/eur(os?)?$/i, '')
    .replace(',', '.');
  if (!clean || !/^\d+(\.\d+)?$/.test(clean)) return null;
  return cleanPrice(Number(clean));
}

/** « 2,49 € » (espaces insécables remplacés par des espaces simples). */
export function formatEuro(value) {
  return euroFormat().format(roundCents(Number(value) || 0)).replace(/[\u00a0\u202f]/g, ' ');
}

/** Valeur du champ de saisie : « 2,49 », ou vide si le prix est inconnu. */
export function priceInputValue(value) {
  const price = cleanPrice(value);
  if (price === null) return '';
  // Virgule ou point selon la langue : « 2,49 » en français, « 2.49 » en anglais.
  const mark = new Intl.NumberFormat(localeTag()).formatToParts(1.5).find((part) => part.type === 'decimal')?.value ?? ',';
  return roundCents(price).toFixed(2).replace('.', mark);
}

/** Montant d'un lot : prix unitaire × nombre (null si le prix est inconnu). */
export function lineAmount(unitPrice, count = 1) {
  const price = cleanPrice(unitPrice);
  const units = Number(count) > 0 ? Number(count) : 1; // fractions comprises (une moitié de produit entamé)
  return price === null ? null : roundCents(price * units);
}
