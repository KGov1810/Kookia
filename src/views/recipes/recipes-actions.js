// Kookia — Actions de l'écran Recettes : filtres, portions, onglets, génération, ouverture.

import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { rerenderKeepScroll } from '../app/router.js';
import { ui } from '../app/ui-state.js';
import { openProductPicker } from './product-picker.js';
import { openRecipe } from './recipe-detail.js';
import { quickFilterActions } from './recipe-filters.js';
import { startRecipeGeneration } from './recipe-generation.js';

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
  'open-recipe': (el) => openRecipe(el.dataset.id)
};
