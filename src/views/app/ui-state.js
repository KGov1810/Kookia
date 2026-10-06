// Kookia — État de l'interface (onglet, filtres, recherche).

import { state } from '../../data/store/state.js';

export const screen = document.getElementById('screen');

export const ui = {
  tab: 'frigo',
  search: '',
  location: '', // filtre de l'écran Stock ('' = tous les lieux)
  priority: new Set(),
  customPriority: false,
  filters: { difficulty: '', maxMinutes: 0, batchOnly: false, diet: '', light: false, origins: [], wish: '' },
  favoritesOnly: false,
  generating: false,
  recipeNote: null,
  onboarding: { text: '', joinText: '', name: '', invite: '', message: null, busy: false }
};

/** Filtres de recettes + seuil « léger » choisi dans les Réglages. */
export function currentFilters() {
  return { ...ui.filters, lightMax: state.settings.lightMaxKcal || 500 };
}
