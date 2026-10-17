// Kookia — Actions de l'écran Recettes : filtres, portions, onglets, génération, ouverture, planning de la semaine.

import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { rerenderKeepScroll } from '../app/router.js';
import { ui } from '../app/ui-state.js';
import { openProductPicker } from './product-picker.js';
import { cookRecipe } from './recipe-cooking.js';
import { openRecipe } from './recipe-detail.js';
import { quickFilterActions } from './recipe-filters.js';
import { startRecipeGeneration } from './recipe-generation.js';
import { openWeekSetup } from './week-setup.js';
import { addWeekShopping, openWeekShopping } from './week-shopping-sheet.js';
import { openBatchSheet, openSlotSheet } from './week-slot-sheet.js';

function cook(id) {
  const recipe = S.localRecipe(state.recipes.find((r) => r.id === id));
  if (recipe) cookRecipe(recipe);
}

/** Actions des boutons (attribut data-action). */
export const recipesActions = {
  ...quickFilterActions,
  'pick-products': () => openProductPicker(),
  'recipe-tab': (el) => {
    ui.recipeTab = el.dataset.value;
    rerenderKeepScroll();
  },
  generate: () => startRecipeGeneration(),
  'servings-minus': () => store.updateSettings({ servings: Math.max(1, (state.settings.servings || 2) - 1) }),
  'servings-plus': () => store.updateSettings({ servings: Math.min(12, (state.settings.servings || 2) + 1) }),
  'open-recipe': (el) => openRecipe(el.dataset.id),
  'recipe-mode': (el) => {
    ui.recipeMode = el.dataset.value;
    rerenderKeepScroll();
  },
  'week-setup': () => openWeekSetup(),
  'week-slot': (el) => openSlotSheet(Number(el.dataset.index)),
  'week-batch': () => openBatchSheet(),
  'week-shopping': () => openWeekShopping(),
  'week-shopping-add': () => addWeekShopping(),
  // « Je l'ai cuisiné » en un toucher (Recettes et Semaine), avec « Annuler ».
  'tonight-cooked': (el) => cook(el.dataset.id),
  'slot-cooked': (el) => cook(el.dataset.id),
  'week-past': () => {
    ui.week.showPast = !ui.week.showPast;
    rerenderKeepScroll();
  }
};
