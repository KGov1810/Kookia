// Kookia — Actions de l'écran Recettes : filtres, portions, génération, ouverture.

import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { rerenderKeepScroll } from '../app/router.js';
import { ui } from '../app/ui-state.js';
import { openOriginPicker } from './origin-picker.js';
import { openProductPicker } from './product-picker.js';
import { openRecipe } from './recipe-detail.js';
import { startRecipeGeneration } from './recipe-generation.js';

/** Actions des boutons (attribut data-action). */
export const recipesActions = {
  'toggle-favorites': () => {
    ui.favoritesOnly = !ui.favoritesOnly;
    rerenderKeepScroll();
  },
  'pick-products': () => openProductPicker(),
  'pick-origin': () => openOriginPicker(),
  'set-difficulty': (el) => {
    ui.filters.difficulty = el.dataset.value;
    ui.recipeNote = null;
    rerenderKeepScroll();
  },
  'set-time': (el) => {
    ui.filters.maxMinutes = Number(el.dataset.value);
    ui.recipeNote = null;
    rerenderKeepScroll();
  },
  generate: () => startRecipeGeneration(),
  'servings-minus': () => {
    store.updateSettings({ servings: Math.max(1, (state.settings.servings || 2) - 1) });
    rerenderKeepScroll();
  },
  'servings-plus': () => {
    store.updateSettings({ servings: Math.min(12, (state.settings.servings || 2) + 1) });
    rerenderKeepScroll();
  },
  'set-diet': (el) => {
    ui.filters.diet = el.dataset.value;
    ui.recipeNote = null;
    rerenderKeepScroll();
  },
  'open-recipe': (el) => openRecipe(el.dataset.id)
};
