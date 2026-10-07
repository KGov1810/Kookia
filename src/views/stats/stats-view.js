// Kookia — Écran Statistiques : dépensé, consommé et jeté, par mois et par catégorie.

import { html, setHTML } from '../../components/html.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';
import { categorySection, monthSection } from './stats-charts.js';
import { filterFields, periodPicker } from './stats-filters.js';
import { emptyState, summaryCard, unpricedNote, wastedSection } from './stats-summary.js';

// Changements qui modifient l'écran (les autres, comme le stock, ne le concernent pas).
const REDRAW = ['movements', 'filters', 'sync', 'time', 'settings'];

export const statsView = {
  render() {
    return html`
      <header class="top"><h1>Statistiques</h1></header>
      <div class="segmented stats-period" id="stats-period" role="group" aria-label="Période"></div>
      <div id="stats-body"></div>`;
  },
  mounted() {
    this.update();
  },
  update(what) {
    // Mouvements chargés à la demande, pour la période choisie seulement.
    store.watchMovements(S.periodStart(ui.stats.period));
    if (what && !REDRAW.includes(what)) return;
    setHTML('#stats-period', periodPicker());
    setHTML('#stats-body', body());
    showPickedMonth();
  }
};

/** Graphique plus large que l'écran : le mois sélectionné (le plus récent par défaut) reste visible. */
function showPickedMonth() {
  const chart = document.querySelector('.month-chart');
  const picked = chart?.querySelector('[aria-pressed="true"]');
  if (picked) chart.scrollLeft = Math.max(0, picked.offsetLeft + picked.offsetWidth - chart.clientWidth + 10);
}

function body() {
  const error = state.movementsError ? html`<p class="note warn">${state.movementsError}</p>` : '';
  if (!store.canWrite()) return html`<p class="hint">Les statistiques s'affichent une fois le foyer connecté.</p>`;
  if (!state.movementsLoaded) return [error, html`<div class="boot small"><span class="spinner"></span></div>`];
  const all = state.movements;
  if (!all.length) return [error, emptyState(false)];
  const list = S.filterMovements(all, ui.stats);
  const filters = filterFields(all);
  if (!list.length) return [error, filters, emptyState(true)];
  const summary = S.summarize(list);
  return [
    error,
    filters,
    summaryCard(summary),
    unpricedNote(summary),
    monthSection(list, all),
    categorySection(list),
    wastedSection(list)
  ];
}
