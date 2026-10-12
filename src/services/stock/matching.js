// Kookia — Rapprochement d'un ingrédient de recette avec un produit du stock.

import { categoryFamily } from '../../data/reference/categories.js';
import { nameMatchScore, nameTokens, normalizeBarcode } from '../text/text.js';
import { guessCategory } from './categorization.js';

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

/**
 * Article de la liste de courses acheté ? Repli quand Claude n'a pas rapproché le ticket de la liste.
 * Tous les mots de l'article (« Lait ») doivent figurer dans le produit (« Lait demi-écrémé UHT »),
 * et la catégorie devinée de l'article doit être celle du produit (en épicerie, la même famille) : « Pommes » ≠ « Pommes de terre »,
 * « Lait » ≠ « Lait de coco », « Oranges » ≠ « Jus d'orange ». Sans catégorie devinée : ressemblance des noms.
 * product : { name, receiptText, category }.
 */
export function matchesShoppingItem(listName, product) {
  const wanted = nameTokens(listName);
  if (!wanted.length) return false;
  const names = [product.name, product.receiptText].filter(Boolean);
  const contained = names.some((name) => {
    const have = new Set(nameTokens(name));
    return wanted.every((t) => have.has(t));
  });
  if (!contained) return false;
  const guess = guessCategory(listName);
  if (!guess) return names.some((name) => nameMatchScore(listName, name) > 0);
  // Épicerie : sous-catégories proches (« Farine » en épicerie ou en pâtisserie). Ailleurs, la même catégorie.
  return guess === product.category || (categoryFamily(guess) === 'epicerie' && categoryFamily(product.category) === 'epicerie');
}
