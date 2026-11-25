// Kookia — Mémoire des corrections : catégorie, rangement et rayon du magasin choisis à la main pour un produit.
// Rangée avec la mémoire des prix (foyers/{code}/prix/categories) : les règles Firestore l'autorisent déjà.

import { setDoc } from 'firebase/firestore';
import { AISLE_IDS } from '../reference/aisles.js';
import { CATEGORY_IDS } from '../reference/categories.js';
import { LOCATIONS } from '../reference/locations.js';
import { reportMemoryError } from './errors.js';
import { priceKeys } from './prices.js';
import { state } from './state.js';
import { canWrite, ref } from './writes.js';

/** Catégorie, lieu et rayon retenus pour ce produit (code-barres d'abord, puis nom) : { category?, location?, aisle? }. */
export function rememberedPlacement(product) {
  const found = {};
  for (const key of priceKeys(product)) {
    const entry = state.placements[key];
    if (!entry) continue;
    if (!found.category && CATEGORY_IDS.includes(entry.category)) found.category = entry.category;
    if (!found.location && LOCATIONS.some((l) => l.id === entry.location)) found.location = entry.location;
    if (!found.aisle && AISLE_IDS.includes(entry.aisle)) found.aisle = entry.aisle;
  }
  return found;
}

/** Retient une correction (category, location et/ou aisle) pour la prochaine fois, sur les deux iPhone. */
export function rememberPlacement(product, { category, location, aisle } = {}) {
  if (!canWrite() || (!category && !location && !aisle)) return;
  const entries = {};
  for (const key of priceKeys(product)) {
    const entry = { ...(state.placements[key] ?? {}), at: Date.now() };
    if (category) entry.category = category;
    if (location) entry.location = location;
    if (aisle) entry.aisle = aisle;
    entries[key] = entry;
  }
  if (!Object.keys(entries).length) return;
  state.placements = { ...state.placements, ...entries };
  setDoc(ref('prix', 'categories'), { entries }, { merge: true }).catch(reportMemoryError);
}
