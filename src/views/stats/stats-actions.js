// Kookia — Actions de l'écran Statistiques : période, mois touché, filtres.

import { showTab } from '../app/router.js';
import { ui } from '../app/ui-state.js';
import { statsView } from './stats-view.js';

function redraw() {
  statsView.update('filters');
}

/** Actions des boutons (attribut data-action). */
export const statsActions = {
  'stats-period': (el) => {
    ui.stats.period = el.dataset.value;
    ui.stats.month = '';
    redraw();
  },
  'stats-month': (el) => {
    ui.stats.month = el.dataset.value;
    redraw();
  },
  'stats-category': (el) => {
    ui.stats.what = el.dataset.value;
    redraw();
    window.scrollTo(0, 0);
  },
  'stats-soon': () => showTab('frigo'),
  'stats-reset': () => {
    Object.assign(ui.stats, { what: '', location: '', person: '' });
    redraw();
  }
};

/** Choix dans une liste de filtres (attribut data-stats-filter). */
export function setStatsFilter(name, value) {
  if (!['what', 'location', 'person'].includes(name)) return;
  ui.stats[name] = value;
  redraw();
}
