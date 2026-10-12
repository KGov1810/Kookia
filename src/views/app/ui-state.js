// Kookia — État de l'interface (onglet, filtres, recherche).

import { state } from '../../data/store/state.js';
import { DEFAULT_STATS_PERIOD } from '../../services/stats/periods.js';

export const screen = document.getElementById('screen');

/** Filtres de recettes par défaut (aucun). L'envie libre n'est pas mémorisée d'une ouverture à l'autre. */
export const NO_FILTERS = Object.freeze({ difficulty: '', maxMinutes: 0, batchOnly: false, diet: '', light: false, origins: [], wish: '' });

/** Filtres mémorisés sur cet iPhone (Réglages locaux), complétés par les valeurs par défaut. */
function savedFilters() {
  const saved = state.settings.recipeFilters ?? {};
  return { ...NO_FILTERS, ...saved, origins: Array.isArray(saved.origins) ? [...saved.origins] : [], wish: '' };
}

export const ui = {
  tab: 'frigo',
  search: '',
  location: '', // filtre de l'écran Stock ('' = tous les lieux)
  priority: new Set(),
  customPriority: false,
  filters: savedFilters(),
  recipeTab: '',        // '' = automatique (Réalisables s'il y en a, sinon Toutes)
  freshIds: new Set(),  // recettes de la dernière génération (badge « Nouvelle », en tête)
  generating: false,
  recipeNote: null,
  recipeMode: 'idees',  // écran Recettes : « idees » (5 recettes) ou « semaine » (planning)
  week: { busy: '', note: null, slotBusy: -1 }, // génération du planning, ou d'un repas remplacé
  stats: { period: DEFAULT_STATS_PERIOD, month: '', what: '', location: '', person: '' }, // écran Statistiques
  onboarding: { text: '', joinText: '', name: '', invite: '', message: null, busy: false }
};

/** Filtres de recettes + seuil « léger » choisi dans les Réglages. */
export function currentFilters() {
  return { ...ui.filters, lightMax: state.settings.lightMaxKcal || 500 };
}
