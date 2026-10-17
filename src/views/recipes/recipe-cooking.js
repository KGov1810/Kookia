// Kookia — « J'ai cuisiné » : retire du stock les quantités de la recette et coche le repas du planning.
// Depuis la fiche de la recette, une confirmation liste ce qui sort ; depuis Recettes ou la Semaine, c'est
// un seul toucher, avec « Annuler ».

import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';

/** « Courgettes, comté et crème », ou « 5 produits » au-delà de 3 noms. */
function namesText(products) {
  if (products.length > 3) return t('count.products', { n: products.length });
  return S.listText(products.map((p) => p.name));
}

/** Portions du planning de la semaine rapportées à celles de la recette (1 hors planning). */
export function planFactor(recipe) {
  const servings = state.plan?.servings;
  return servings ? servings / Math.max(1, recipe.servings || 2) : 1;
}

/** Ce que « J'ai cuisiné » retirera du stock (pour l'annoncer sous le bouton). */
export function cookedPreview(recipe, factor = planFactor(recipe)) {
  const uses = store.recipeUses(recipe, factor);
  return uses.length ? t('cook.preview', { names: namesText(uses.map((u) => u.product)) }) : '';
}

export function cookRecipe(recipe, { factor = planFactor(recipe), confirm = false } = {}) {
  // Quantités de la recette : 200 g d'un paquet de 500 g → le paquet est entamé.
  const uses = store.recipeUses(recipe, factor);
  if (!uses.length) {
    // Recette du planning sans produit du stock : on note seulement le repas comme cuisiné.
    store.markPlanCooked(recipe.id);
    toast(t('cook.noted'), t('common.cancel'), () => store.markPlanCooked(recipe.id, false));
    return;
  }
  if (confirm) {
    const list = uses.map((u) => `• ${u.product.name} : ${u.computed && u.quantity ? u.quantity : t('qty.units', { n: 1 })} → ${store.restText(S.splitAfter(u.product, u.amount))}`).join('\n');
    if (!window.confirm(`${t('cook.confirm')}\n${list}`)) return;
  }
  const done = store.consumeAmounts(uses.map((u) => ({ id: u.product.id, amount: u.amount })), { reason: { k: 'hist.recipe', p: { title: recipe.title } } });
  store.markPlanCooked(recipe.id); // repas coché dans le planning de la semaine
  const text = t('cook.updated', { n: done.before.length });
  toast(done.before.length <= 3 ? t('cook.detail', { text, names: namesText(done.before) }) : text, t('common.cancel'), () => {
    store.undoTake(done);
    store.markPlanCooked(recipe.id, false);
  });
}
