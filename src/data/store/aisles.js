// Kookia — Rayons de la liste de courses : rayon de chaque article et ordre des rayons, partagés entre les deux iPhone.
// L'ordre est rangé avec les mémoires du foyer (foyers/{code}/prix/rayons) : les règles Firestore l'autorisent déjà.

import { setDoc } from 'firebase/firestore';
import { fromShoppingEntry } from '../../services/quantities/quantities.js';
import { aisleOfCategory, orderedAisles } from '../../services/stock/aisles.js';
import { guessCategory } from '../../services/stock/categorization.js';
import { reportMemoryError } from './errors.js';
import { rememberedPlacement, rememberPlacement } from './placements.js';
import { emit, state } from './state.js';
import { canWrite, ref } from './writes.js';

/** Ordre des rayons du foyer (ordre type tant que personne ne l'a changé). */
export function aisleOrder() {
  return orderedAisles(state.aisleOrder);
}

/** Enregistre un nouvel ordre des rayons, pour les deux iPhone. */
export function saveAisleOrder(order) {
  if (!canWrite()) return;
  state.aisleOrder = orderedAisles(order);
  emit('aisles');
  setDoc(ref('prix', 'rayons'), { order: state.aisleOrder, at: Date.now() }).catch(reportMemoryError);
}

/** Nom de l'article sans le poids (« Farine (1 kg) » → « Farine ») : la clé des mémoires. */
const baseName = (item) => fromShoppingEntry(item).name;

/**
 * Rayon d'un article de courses : celui choisi à la main pour ce produit, sinon celui de sa catégorie (corrigée
 * auparavant, sinon devinée d'après le nom) ; « autre » pour un nom inconnu (hygiène, entretien…).
 */
export function shoppingAisle(item) {
  const memo = rememberedPlacement({ name: baseName(item) });
  return memo.aisle ?? aisleOfCategory(memo.category ?? guessCategory(baseName(item)));
}

/** Rayon choisi à la main dans la fiche d'un article : retenu pour ce produit, sur les deux iPhone. */
export function rememberAisle(item, aisle) {
  if (aisle === shoppingAisle(item)) return;
  rememberPlacement({ name: baseName(item) }, { aisle });
  emit('aisles');
}
