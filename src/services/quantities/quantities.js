// Kookia — Quantités : nombre d'unités, poids, quantité des courses.

import { parseAmount } from './portions.js';

/** « 2 × 2 kg », « 3 unités », « 500 g » (une seule unité). */
export function quantityLabel(product) {
  const count = Math.max(1, Math.round(Number(product?.count) || 1));
  const size = String(product?.quantity ?? '').trim();
  if (count === 1) return size;
  return size ? `${count} × ${size}` : `${count} unités`;
}

const UNIT_WORDS = 'sachets?|paquets?|pots?|bo[iî]tes?|bouteilles?|briques?|packs?|filets?|barquettes?|unit[ée]s?|pi[eè]ces?|tranches?|canettes?|conserves?|bocaux|bocal';

/**
 * Sépare le nombre d'unités du poids : « 2 sachets de 2 kg » → { count: 2, quantity: '2 kg' },
 * « 4 x 125 g » → { 4, '125 g' }, « 3 » → { 3, '' }, « 2 kg » → { 1, '2 kg' }.
 */
export function splitCount(text) {
  const t = String(text ?? '').trim();
  let m = /^(\d{1,3})\s*[x×*]\s*(.+)$/i.exec(t);
  if (m) return { count: Number(m[1]), quantity: m[2].trim() };
  m = /^(\d{1,3})$/.exec(t);
  if (m) return { count: Number(m[1]), quantity: '' };
  m = new RegExp(`^(\\d{1,3})\\s+(?:${UNIT_WORDS})(?:\\s+(?:de\\s+|d')?(.+))?$`, 'i').exec(t);
  if (m) return { count: Number(m[1]), quantity: (m[2] ?? '').trim() };
  return { count: 1, quantity: t };
}

/** Ne garde que les chiffres (1 à 999) ; vide si rien de valable. */
export function sanitizeCount(value) {
  return String(value ?? '').replace(/\D/g, '').replace(/^0+/, '').slice(0, 3);
}

/** « Farine (1 kg) » ou « Farine 1 kg » → { base: 'Farine', size: '1 kg' }. */
export function splitItemName(name) {
  const text = String(name ?? '').trim();
  let m = /^(.*\S)\s*\(([^()]*\d[^()]*)\)$/.exec(text);
  if (m) return { base: m[1].trim(), size: m[2].trim() };
  m = /^(.*\S)\s+(\d+(?:[.,]\d+)?\s?(?:mg|g|kg|ml|cl|dl|l))$/i.exec(text);
  if (m) return { base: m[1].trim(), size: m[2].trim() };
  return { base: text, size: '' };
}

/**
 * Article de courses à partir d'une quantité libre (recette, produit du frigo) :
 * le nombre devient la quantité, le poids rejoint le nom.
 * « 2 × 1 kg » → { Farine (1 kg), '2' } ; « 400 g » → { Pâtes (400 g), '' } ; « 3 » → { Œufs, '3' }.
 */
export function toShoppingEntry(name, quantityText) {
  let { count, quantity: size } = splitCount(quantityText);
  const amount = parseAmount(size);
  if (size && amount && !amount.unit) {
    count = Math.max(1, Math.ceil(amount.value)); // « 1 ½ » → 2
    size = '';
  }
  const base = String(name ?? '').trim();
  return { name: size ? `${base} (${size})` : base, quantity: count > 1 ? String(count) : '' };
}

/** Article de courses → produit du frigo : { name, quantity (poids), count }. */
export function fromShoppingEntry(item) {
  const { base, size } = splitItemName(item.name);
  const q = String(item.quantity ?? '').trim();
  if (!q || /^\d+$/.test(q)) return { name: base, quantity: size, count: Math.max(1, Number(q) || 1) };
  const legacy = splitCount(q); // anciennes quantités libres (« 2 kg », « 2 paquets de 1 kg »)
  return { name: base, quantity: legacy.quantity || size, count: legacy.count };
}

const WEIGHT_UNIT = '(?:mg|g|kg|ml|cl|dl|l)\\b';

/**
 * Saisie libre de la liste de courses, en un seul champ : le nombre à acheter est repéré,
 * un poids reste dans le nom. « 2 lait » ou « lait x2 » → { name: 'Lait', quantity: '2' } ;
 * « Farine 1 kg » → { name: 'Farine 1 kg', quantity: '' } ; « 2 paquets de pâtes » → { 'Pâtes', '2' }.
 */
export function parseShoppingInput(text) {
  let rest = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (/^\d*$/.test(rest)) return { name: '', quantity: '' }; // un nombre seul : pas d'article
  let count = '';
  let m = new RegExp(`^(\\d{1,3})\\s*[x×*]?\\s+(?!${WEIGHT_UNIT})(?:(?:${UNIT_WORDS})\\s+(?:de\\s+|d'))?(.+)$`, 'i').exec(rest);
  if (!m) m = /^(\d{1,3})\s*[x×*]\s*(.+)$/i.exec(rest); // « 2x lait »
  if (m) {
    count = m[1];
    rest = m[2];
  } else {
    m = /^(.+?)\s*[x×*]\s?(\d{1,3})$/i.exec(rest); // « lait x2 », « lait ×2 »
    if (m) {
      rest = m[1];
      count = m[2];
    }
  }
  const name = rest.trim();
  const quantity = sanitizeCount(count);
  return { name: name ? name.charAt(0).toUpperCase() + name.slice(1) : '', quantity: quantity === '1' ? '' : quantity };
}
