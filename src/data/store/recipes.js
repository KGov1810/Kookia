// Kookia — Recettes enregistrées et lien avec le stock actuel.

import { deleteDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { scaleIngredient } from '../../services/quantities/portions.js';
import { splitItemName } from '../../services/quantities/quantities.js';
import { matchesFilters, maxPurchases } from '../../services/recipes/recipe-filters.js';
import { resolveIngredient } from '../../services/stock/matching.js';
import { db } from './connection.js';
import { logChange } from './history.js';
import { productStatus } from './selectors.js';
import { addShoppingItem } from './shopping.js';
import { state } from './state.js';
import { canWrite, ref, write } from './writes.js';

export function saveRecipes(recipes) {
  if (!canWrite() || !recipes.length) return;
  logChange({ scope: 'recettes', action: 'generation', name: `${recipes.length} recette${recipes.length > 1 ? 's' : ''}`, details: [recipes.map((r) => r.title).join(', ')] });
  const batch = writeBatch(db);
  recipes.forEach(({ id, ...data }) => batch.set(ref('recettes', id), data));
  // Garde les favoris + les 40 recettes les plus récentes.
  const all = [...recipes, ...state.recipes.filter((r) => !recipes.some((n) => n.id === r.id))];
  all.filter((r) => !r.favorite)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(40)
    .forEach((r) => batch.delete(ref('recettes', r.id)));
  write(batch.commit());
}

export function toggleFavorite(id) {
  const recipe = state.recipes.find((r) => r.id === id);
  if (!recipe || !canWrite()) return;
  logChange({ scope: 'recettes', action: recipe.favorite ? 'favori-retire' : 'favori', name: recipe.title, itemId: id });
  write(updateDoc(ref('recettes', id), { favorite: !recipe.favorite }));
}

export function deleteRecipe(id) {
  if (!canWrite()) return;
  const recipe = state.recipes.find((r) => r.id === id);
  if (recipe) logChange({ scope: 'recettes', action: 'suppression', name: recipe.title, itemId: id });
  write(deleteDoc(ref('recettes', id)));
}

/** Ajoute aux courses les ingrédients absents du frigo actuel (quantités ajustées). Renvoie le nombre ajouté. */
export function addMissingIngredients(recipe, factor = 1) {
  return recipeAvailability(recipe).missing
    .reduce((count, i) => count + (addShoppingItem(i.name, scaleIngredient(i, factor)) ? 1 : 0), 0); // chaque ajout est noté
}

/**
 * Mémorise dans les recettes le code-barres, le nom et la catégorie des produits
 * utilisés, pour les reconnaître s'ils sont rachetés après avoir été consommés.
 * N'écrit que ce qui manque (sans effet la deuxième fois).
 */
export function rememberRecipeLinks(products) {
  if (!canWrite() || !products.length || !state.recipes.length) return;
  const byId = new Map(products.map((p) => [p.id, p]));
  const updates = [];
  for (const recipe of state.recipes) {
    let changed = false;
    const ingredients = recipe.ingredients.map((ingredient) => {
      const product = ingredient.productId ? byId.get(ingredient.productId) : null;
      if (!product) return ingredient;
      const patch = {};
      if (product.barcode && !ingredient.barcode) patch.barcode = product.barcode;
      if (!ingredient.productName) patch.productName = product.name;
      if (!ingredient.category) patch.category = product.category;
      if (!Object.keys(patch).length) return ingredient;
      changed = true;
      return { ...ingredient, ...patch };
    });
    if (changed) {
      recipe.ingredients = ingredients;
      updates.push([recipe.id, ingredients]);
    }
  }
  if (!updates.length) return;
  const batch = writeBatch(db);
  updates.forEach(([id, ingredients]) => batch.update(ref('recettes', id), { ingredients }));
  write(batch.commit());
}

/**
 * Situation d'une recette par rapport au frigo actuel :
 * rows : chaque ingrédient avec le produit retrouvé (ou null) et la façon dont il l'a été ;
 * inFridge : produits du frigo utilisés (sans doublon) ; missing : ingrédients à se procurer.
 */
export function recipeAvailability(recipe, priorityIds = new Set()) {
  const rows = recipe.ingredients.map((ingredient) => {
    const match = resolveIngredient(ingredient, state.products);
    const inShopping = !match && ingredient.source !== 'placard' && state.shopping.some(
      (item) => splitItemName(item.name).base.localeCompare(ingredient.name, 'fr', { sensitivity: 'base' }) === 0
    );
    return { ingredient, product: match?.product ?? null, via: match?.via ?? null, inShopping };
  });
  const inFridge = [...new Map(rows.filter((r) => r.product).map((r) => [r.product.id, r.product])).values()];
  const missing = rows.filter((r) => !r.product && r.ingredient.source !== 'placard').map((r) => r.ingredient);
  const priorityUsed = inFridge.filter((p) => priorityIds.has(p.id)).length;
  const urgentUsed = inFridge.filter((p) => ['expired', 'soon'].includes(productStatus(p))).length;
  return { rows, inFridge, missing, priorityUsed, urgentUsed };
}

/**
 * Recettes enregistrées réalisables avec le frigo actuel : au moins un produit
 * du frigo et au plus deux ingrédients à se procurer (six avec une origine ou une envie).
 * Les mieux adaptées d'abord.
 */
export function compatibleRecipes({ priorityIds = new Set(), filters = {}, limit = 5 } = {}) {
  return state.recipes
    .filter((recipe) => matchesFilters(recipe, filters))
    .map((recipe) => ({ recipe, ...recipeAvailability(recipe, priorityIds) }))
    // Avec une origine ou une envie, une recette fidèle peut demander jusqu'à 6 achats.
    .filter((r) => r.inFridge.length > 0 && r.missing.length <= maxPurchases(filters))
    .sort((a, b) => (b.priorityUsed - a.priorityUsed)
      || (b.urgentUsed - a.urgentUsed)
      || (a.missing.length - b.missing.length)
      || (b.inFridge.length - a.inFridge.length)
      || (Number(Boolean(b.recipe.favorite)) - Number(Boolean(a.recipe.favorite)))
      || ((b.recipe.createdAt ?? 0) - (a.recipe.createdAt ?? 0)))
    .slice(0, limit);
}
