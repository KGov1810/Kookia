// Kookia — Génération de recettes depuis l'écran Recettes.

import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { rerenderIf } from '../app/router.js';
import { currentFilters, ui } from '../app/ui-state.js';

export async function startRecipeGeneration() {
  if (ui.generating) return;
  ui.generating = true;
  ui.recipeNote = null;
  rerenderIf('recettes');
  try {
    const all = store.sortedProducts();
    const priority = all.filter((p) => ui.priority.has(p.id));
    const others = all.filter((p) => !ui.priority.has(p.id) && store.productStatus(p) !== 'expired');
    const filters = currentFilters();
    const recipes = await S.generateRecipes({
      key: state.settings.claudeKey,
      model: state.settings.model,
      priority,
      others,
      shopping: state.shopping,
      filters,
      servings: state.settings.servings || 2
    });
    store.saveRecipes(recipes);
    if (!recipes.length) {
      ui.recipeNote = { kind: 'warn', text: 'Aucune recette reçue, réessayez.' };
    } else if (!recipes.some((r) => S.matchesFilters(r, filters))) {
      ui.recipeNote = { kind: 'warn', text: 'Les recettes reçues ne respectent pas tous les filtres : assouplissez-les pour les voir, ou réessayez.' };
    } else {
      ui.recipeNote = { kind: 'ok', text: `${S.plural(recipes.length, 'nouvelle recette', 'nouvelles recettes')} ci-dessous.` };
    }
  } catch (error) {
    ui.recipeNote = { kind: 'error', text: error?.message || String(error) };
  } finally {
    ui.generating = false;
    rerenderIf('recettes');
  }
}
