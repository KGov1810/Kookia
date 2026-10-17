// Kookia — Recette et planning dans la langue de l'iPhone : la traduction de Claude si elle existe,
// sinon la langue dans laquelle ils ont été écrits (lang, français pour les anciennes recettes).

import { language } from '../i18n/i18n.js';

export function recipeLanguage(recipe) {
  return recipe?.lang || 'fr';
}

/** Vrai si la recette n'existe pas encore dans cette langue (à traduire à l'ouverture). */
export function lacksLanguage(recipe, lang = language()) {
  return Boolean(recipe) && recipeLanguage(recipe) !== lang && !recipe.translations?.[lang];
}

/**
 * Recette avec ses textes dans la langue de l'iPhone. Les liens au stock (produit, code-barres), les valeurs
 * des quantités et le reste ne changent pas : seuls les textes sont pris dans la traduction.
 */
export function localRecipe(recipe, lang = language()) {
  if (!recipe || recipeLanguage(recipe) === lang) return recipe;
  const tr = recipe.translations?.[lang];
  if (!tr) return recipe;
  return {
    ...recipe,
    title: tr.title || recipe.title,
    summary: tr.summary ?? recipe.summary,
    storageTips: tr.storageTips ?? recipe.storageTips,
    steps: tr.steps?.length ? tr.steps : recipe.steps,
    ingredients: (recipe.ingredients ?? []).map((ingredient, i) => {
      const local = tr.ingredients?.[i];
      return local?.name ? { ...ingredient, name: local.name, quantity: local.quantity || ingredient.quantity, unit: local.unit ?? ingredient.unit } : ingredient;
    })
  };
}

/** Planning avec sa stratégie, les étapes du batch et les courses dans la langue de l'iPhone. */
export function localPlan(plan, lang = language()) {
  if (!plan || (plan.lang || 'fr') === lang) return plan;
  const tr = plan.translations?.[lang];
  if (!tr) return plan;
  return {
    ...plan,
    strategy: tr.strategy || plan.strategy,
    batch: plan.batch ? { ...plan.batch, steps: tr.batchSteps?.length ? tr.batchSteps : plan.batch.steps } : plan.batch,
    shopping: (plan.shopping ?? []).map((item, i) => {
      const local = tr.shopping?.[i];
      return local?.name ? { ...item, name: local.name, quantity: local.quantity || item.quantity } : item;
    })
  };
}
