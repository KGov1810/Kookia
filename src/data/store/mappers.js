// Kookia — Conversion des documents Firestore.

import { cleanPrice } from '../../services/stats/money.js';
import { normalizeCategory } from '../../services/stock/categorization.js';

/** Version des catégories : 2 = catégories détaillées (fruits, légumes, fromages…). */
export const CATEGORY_VERSION = 2;

export function toProduct(id, d) {
  if (!d.name) return null; // document incomplet (une date vide = « date à compléter »)
  return {
    id,
    name: d.name ?? '',
    expiry: d.expiry ?? '',
    // Anciens produits : catégorie trop large reclassée d'après le nom (enregistrée à la prochaine modification).
    category: (d.categoryVersion ?? 1) >= CATEGORY_VERSION ? (d.category ?? 'autre') : normalizeCategory(d.category ?? 'autre', d.name),
    quantity: d.quantity ?? '',
    count: Number(d.count) >= 1 ? Math.round(Number(d.count)) : 1, // nombre d'unités (anciens produits : 1)
    location: d.location || 'frigo',   // anciens produits : au frigo
    dateKind: d.dateKind || 'dlc',     // anciens produits : date limite imprimée
    frozenAt: d.frozenAt ?? '',
    barcode: d.barcode ?? '',
    addedBy: d.addedBy ?? '',
    createdAt: d.createdAt ?? 0,
    image: d.image ?? '',
    imageUrl: d.imageUrl ?? '',
    unitPrice: cleanPrice(d.unitPrice) // prix d'une unité, en euros (null = inconnu)
  };
}

const MOVEMENT_TYPES = ['achat', 'consomme', 'jete'];

/** Mouvement du stock (statistiques). */
export function toMovement(id, d) {
  if (!MOVEMENT_TYPES.includes(d.type) || !Number.isFinite(d.clientAt)) return null;
  return {
    id,
    type: d.type,
    name: d.name ?? '',
    category: d.category || 'autre',
    location: d.location || 'frigo',
    count: Number(d.count) >= 1 ? Math.round(Number(d.count)) : 1,
    unitPrice: cleanPrice(d.unitPrice),
    by: d.by ?? '',
    clientAt: d.clientAt
  };
}

export function toShoppingItem(id, d) {
  if (!d.name) return null; // document incomplet (ancien bug de l'article « fantôme »)
  return {
    id,
    name: d.name ?? '',
    quantity: d.quantity ?? '',
    checked: Boolean(d.checked),
    addedBy: d.addedBy ?? '',
    createdAt: d.createdAt ?? 0
  };
}

export function toRecipe(id, d) {
  if (!d.title) return null; // document incomplet
  return { ...d, id, ingredients: d.ingredients ?? [], steps: d.steps ?? [], usedProductIds: d.usedProductIds ?? [] };
}
