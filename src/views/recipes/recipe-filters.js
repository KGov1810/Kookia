// Kookia — Filtres des recettes : pastilles rapides, fiche « Plus de filtres », mémorisation sur l'iPhone.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { servingsLabel } from '../../components/recipe-visuals.js';
import { openSheet } from '../../components/sheet.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { NO_FILTERS, ui } from '../app/ui-state.js';
import { openOriginPicker, originSummary } from './origin-picker.js';

/** Applique un changement de filtres et le mémorise sur cet iPhone (l'envie libre n'est pas gardée). */
export function applyFilters(patch = {}) {
  Object.assign(ui.filters, patch);
  ui.recipeNote = null;
  const { wish: _wish, ...kept } = ui.filters;
  store.updateSettings({ recipeFilters: { ...kept, origins: [...kept.origins] } }); // réaffiche l'écran
}

export function clearFilters() {
  applyFilters({ ...NO_FILTERS, origins: [] });
}

/** Filtres réglés seulement dans la fiche « Plus de filtres » (difficulté, origine, envie). */
function extraCount() {
  const f = ui.filters;
  return Number(Boolean(f.difficulty)) + Number(f.origins.length > 0) + Number(Boolean(f.wish.trim()));
}

export function hasFilters() {
  const f = ui.filters;
  return Boolean(f.maxMinutes || f.light || f.diet || f.batchOnly || extraCount());
}

const pill = (action, pressed, label) =>
  html`<button class="chip filter-chip" data-action="${action}" aria-pressed="${String(pressed)}">${label}</button>`;

/** Nombre de personnes et bouton « Filtres », puis pastilles Rapide, Léger, Végé, Batch. */
export function quickFilters() {
  const f = ui.filters;
  const servings = state.settings.servings || 2;
  const diet = R.DIETS.find((d) => d.id === f.diet);
  const extra = extraCount();
  return html`
    <div class="servings-row">
      <div class="stepper" role="group" aria-label="Nombre de personnes">
        <button data-action="servings-minus" aria-label="Une personne de moins" ${servings <= 1 ? raw('disabled') : ''}>−</button>
        <output>${servingsLabel(servings)}</output>
        <button data-action="servings-plus" aria-label="Une personne de plus" ${servings >= 12 ? raw('disabled') : ''}>+</button>
      </div>
      <button class="chip filter-chip more" data-action="more-filters" aria-pressed="${String(extra > 0)}">${I.sliders}Filtres${extra ? html`<i>${extra}</i>` : ''}</button>
    </div>
    <div class="quick-filters" role="group" aria-label="Filtres rapides">
      ${pill('quick-time', f.maxMinutes > 0, f.maxMinutes ? `≤ ${S.formatMinutes(f.maxMinutes)}` : 'Rapide')}
      ${pill('quick-light', f.light, f.light ? `Léger ≤ ${state.settings.lightMaxKcal || 500} kcal` : 'Léger')}
      ${pill('quick-diet', Boolean(f.diet), f.diet ? diet.label : 'Végé')}
      ${pill('quick-batch', f.batchOnly, 'Batch')}
    </div>`;
}

/** Actions des pastilles (écran Recettes). */
export const quickFilterActions = {
  'quick-time': () => applyFilters({ maxMinutes: ui.filters.maxMinutes ? 0 : 30 }),
  'quick-light': () => applyFilters({ light: !ui.filters.light }),
  'quick-diet': () => applyFilters({ diet: ui.filters.diet ? '' : 'vegetarien' }),
  'quick-batch': () => applyFilters({ batchOnly: !ui.filters.batchOnly }),
  'more-filters': () => openFiltersSheet(),
  'clear-filters': () => clearFilters()
};

function segmented(label, action, options, current) {
  return html`
    <span class="filter-label">${label}</span>
    <div class="segmented" role="group" aria-label="${label}">
      ${options.map(([value, text]) => html`<button data-action="${action}" data-value="${value}" aria-pressed="${String(String(current) === String(value))}">${text}</button>`)}
    </div>`;
}

/** Fiche « Plus de filtres » : régime, temps, difficulté, origine. Chaque choix s'applique tout de suite. */
export function openFiltersSheet() {
  const sheet = openSheet({
    tall: true,
    render: () => {
      const f = ui.filters;
      return html`
        <header class="sheet-head">
          <button class="link" data-action="clear">Effacer</button>
          <h2>Filtres</h2>
          <button class="link strong" data-action="close">OK</button>
        </header>
        <div class="sheet-body">
          <section class="group filters-group">
            ${segmented('Régime', 'set-diet', R.DIETS.map((d) => [d.id, d.label]), f.diet)}
            ${segmented('Temps total maximum', 'set-time', R.TIME_FILTERS.map((t) => [t.max, t.label]), f.maxMinutes)}
            ${segmented('Difficulté', 'set-difficulty', [['', 'Toutes'], ...R.DIFFICULTIES.map((d) => [d.id, d.label])], f.difficulty)}
          </section>
          <section class="group">
            <button class="field field-button" data-action="pick-origin">
              <span class="label-stack">Origine ou envie<small>${originSummary()}</small></span>
              <span class="chevron" aria-hidden="true">›</span>
            </button>
          </section>
          <p class="hint">Les filtres trient vos recettes et guident Claude. Ils restent mémorisés sur cet iPhone, sauf l'envie.</p>
        </div>`;
    },
    actions: {
      'set-diet': (el) => { applyFilters({ diet: el.dataset.value }); sheet.update(); },
      'set-time': (el) => { applyFilters({ maxMinutes: Number(el.dataset.value) }); sheet.update(); },
      'set-difficulty': (el) => { applyFilters({ difficulty: el.dataset.value }); sheet.update(); },
      'pick-origin': () => openOriginPicker((choice) => { applyFilters(choice); sheet.update(); }),
      clear: () => { clearFilters(); sheet.update(); }
    }
  });
  return sheet;
}
