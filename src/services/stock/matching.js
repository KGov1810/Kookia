// Kookia — Rapprochement d'un ingrédient de recette avec un produit du stock.

import { categoryFamily } from '../../data/reference/categories.js';
import { nameMatchScore, normalizeBarcode } from '../text/text.js';

/**
 * Retrouve le produit du frigo correspondant à un ingrédient :
 * 1. le produit d'origine (encore au frigo) ; 2. le même code-barres (produit racheté) ;
 * 3. un nom équivalent (anciennes recettes, produits saisis sans code-barres).
 * Renvoie { product, via: 'origine' | 'code-barres' | 'nom' } ou null.
 */
export function resolveIngredient(ingredient, products) {
  if (!ingredient || ingredient.source === 'placard') return null;
  if (ingredient.productId) {
    const original = products.find((p) => p.id === ingredient.productId);
    if (original) return { product: original, via: 'origine' };
  }
  const barcode = normalizeBarcode(ingredient.barcode);
  if (barcode) {
    const same = products.find((p) => normalizeBarcode(p.barcode) === barcode);
    if (same) return { product: same, via: 'code-barres' };
  }
  let best = null;
  let bestScore = 0;
  for (const product of products) {
    if (ingredient.category && ingredient.category !== 'autre' && product.category !== 'autre'
      && categoryFamily(product.category) !== categoryFamily(ingredient.category)) continue;
    const score = Math.max(
      nameMatchScore(ingredient.name, product.name),
      ingredient.productName ? nameMatchScore(ingredient.productName, product.name) : 0
    );
    if (score > bestScore || (score > 0 && score === bestScore && product.expiry < best.expiry)) {
      best = product;
      bestScore = score;
    }
  }
  return best ? { product: best, via: 'nom' } : null;
}
