// Kookia — Écran Recettes : repas du jour, produits prioritaires, filtres en pastilles, gros bouton, puis « Mes recettes » en onglets.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { shortExpiry, thumbTint } from '../../components/product-visuals.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { rerenderKeepScroll } from '../app/router.js';
import { currentFilters, ui } from '../app/ui-state.js';
import { recipeCard } from './recipe-card.js';
import { tonightCard } from './tonight-card.js';
import { hasFilters, quickFilters } from './recipe-filters.js';
import { weekView } from './week-view.js';

function recipesHeader() {
  return html`<header class="top"><div class="top-row"><h1>${t('tab.recipes')}</h1></div>${modeSwitch()}</header>`;
}

/** Idées (5 recettes) ou Semaine (planning des repas). */
function modeSwitch() {
  return html`
    <div class="segmented mode-switch" role="tablist" aria-label="${t('tab.recipes')}">
      ${[['idees', t('recipes.ideas')], ['semaine', t('recipes.week')]].map(([id, label]) => html`
        <button role="tab" data-action="recipe-mode" data-value="${id}" aria-selected="${String(ui.recipeMode === id)}" aria-pressed="${String(ui.recipeMode === id)}">${id === 'semaine' ? I.calendar : I.sparkle}${label}</button>`)}
    </div>`;
}

function applyDefaultPriority() {
  const ids = new Set(state.products.map((p) => p.id));
  if (!ui.customPriority) {
    ui.priority = new Set(store.soonProducts().map((p) => p.id));
  } else {
    ui.priority = new Set([...ui.priority].filter((id) => ids.has(id)));
  }
}

/** Recettes de chaque onglet, filtres appliqués. Réalisables : faisables avec le stock, les mieux adaptées d'abord. */
function recipeTabs(filters) {
  const fresh = (r) => Number(ui.freshIds.has(r.id));
  const all = [...state.recipes]
    .sort((a, b) => (fresh(b) - fresh(a)) || ((b.createdAt ?? 0) - (a.createdAt ?? 0)))
    .filter((r) => S.matchesFilters(r, filters));
  const doable = store.compatibleRecipes({ priorityIds: ui.priority, filters, limit: Infinity });
  return {
    realisables: { label: t('recipes.doable'), items: doable.map((c) => [c.recipe, c]), empty: t('recipes.emptyDoable') },
    favoris: { label: t('recipes.favorites'), items: all.filter((r) => r.favorite).map((r) => [r]), empty: t('recipes.emptyFavorites') },
    toutes: { label: t('recipes.all'), items: all.map((r) => [r]), empty: t('recipes.emptyFiltered') }
  };
}

/** Onglet affiché : celui choisi, sinon Réalisables s'il y en a, sinon Toutes. */
function activeTab(tabs) {
  if (tabs[ui.recipeTab]) return ui.recipeTab;
  return tabs.realisables.items.length ? 'realisables' : 'toutes';
}

/** Carte « À utiliser en priorité » : les produits choisis, avec leur emoji et le temps qui reste. */
function priorityCard() {
  const priority = store.sortedProducts().filter((p) => ui.priority.has(p.id));
  return html`
    <section class="group priority-card">
      <div class="group-head">
        <h2>${t('recipes.priority')}</h2>
        <button class="link" data-action="pick-products" ${state.products.length ? '' : raw('disabled')}>${t(priority.length ? 'common.edit' : 'recipes.choose')}</button>
      </div>
      ${priority.length
        ? html`<div class="prio-chips">${priority.map((p) => html`<span class="prio-chip"><span class="prio-icon ${thumbTint(p)}" aria-hidden="true">${R.category(p.category).emoji}</span>${p.name}<b class="${store.productStatus(p)}">${shortExpiry(p)}</b></span>`)}</div>`
        : html`<p class="hint">${t(state.products.length ? 'recipes.nothingUrgent' : 'recipes.emptyStock')}</p>`}
    </section>`;
}

/** Le gros bouton mangue « Proposer 5 recettes », et ce que Claude a répondu. */
function generateBlock() {
  const hasKey = hasClaudeKey();
  const canGenerate = hasKey && !ui.generating && (state.products.length > 0 || state.shopping.length > 0);
  return html`
    <div class="start-action">
      <button class="primary generate" data-action="generate" ${canGenerate ? '' : raw('disabled')}>
        ${ui.generating ? html`<span class="spinner"></span>${t('recipes.cooking')}` : html`${I.sparkle}${t('recipes.propose')}`}
      </button>
      ${ui.recipeNote
        ? html`<p class="note ${ui.recipeNote.kind}">${ui.recipeNote.text}</p>`
        : !hasKey ? html`<p class="hint">${t('recipes.needKey')}</p>` : ''}
    </div>`;
}

export const recipesView = {
  render() {
    if (ui.recipeMode === 'semaine') return html`${recipesHeader()}${weekView()}`;
    applyDefaultPriority();
    const filters = currentFilters();
    const tabs = recipeTabs(filters);
    const current = activeTab(tabs);
    const { items, empty } = tabs[current];
    const cards = items.map(([recipe, availability]) => recipeCard(recipe, availability));
    const hiddenOld = state.recipes.filter((r) => S.lacksTagsFor(r, filters)).length;

    return html`
      ${recipesHeader()}
      ${tonightCard()}

      ${priorityCard()}
      ${quickFilters()}
      ${generateBlock()}

      <h2 class="section recipes-title">${t('recipes.mine')}</h2>
      <div class="recipe-tabs" role="tablist" aria-label="${t('recipes.mine')}">
        ${Object.entries(tabs).map(([id, tab]) => html`
          <button role="tab" data-action="recipe-tab" data-value="${id}" aria-selected="${String(id === current)}" aria-pressed="${String(id === current)}">${tab.label}<i>${tab.items.length}</i></button>`)}
      </div>
      <div class="list">
        ${cards.length
          ? cards
          : html`<p class="hint">${!state.recipes.length ? t('recipes.none') : empty}</p>`}
      </div>
      ${hiddenOld ? html`<p class="hint">${t('recipes.hiddenOld', { n: hiddenOld })}</p>` : ''}
      ${!cards.length && hasFilters() && state.recipes.length ? html`<button class="secondary" data-action="clear-filters">${t('recipes.clearFilters')}</button>` : ''}`;
  },
  update() {
    rerenderKeepScroll();
  }
};
