// Kookia — Écran Recettes : produits prioritaires, filtres rapides et bouton principal, puis « Mes recettes » en onglets.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { shortExpiry } from '../../components/product-visuals.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { rerenderKeepScroll } from '../app/router.js';
import { currentFilters, ui } from '../app/ui-state.js';
import { recipeCard } from './recipe-card.js';
import { hasFilters, quickFilters } from './recipe-filters.js';

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
    realisables: { label: 'Réalisables', items: doable.map((c) => [c.recipe, c]), empty: 'Aucune recette enregistrée n\'est réalisable avec le stock actuel : demandez-en à Claude.' },
    favoris: { label: 'Favoris', items: all.filter((r) => r.favorite).map((r) => [r]), empty: 'Pas encore de favori : touchez l\'étoile dans une recette pour la garder ici.' },
    toutes: { label: 'Toutes', items: all.map((r) => [r]), empty: 'Aucune recette ne correspond à ces filtres.' }
  };
}

/** Onglet affiché : celui choisi, sinon Réalisables s'il y en a, sinon Toutes. */
function activeTab(tabs) {
  if (tabs[ui.recipeTab]) return ui.recipeTab;
  return tabs.realisables.items.length ? 'realisables' : 'toutes';
}

function priorityBlock() {
  const priority = store.sortedProducts().filter((p) => ui.priority.has(p.id));
  return html`
    <div class="group-head">
      <h2>À utiliser en priorité</h2>
      <button class="link" data-action="pick-products" ${state.products.length ? '' : raw('disabled')}>${priority.length ? 'Modifier' : 'Choisir'}</button>
    </div>
    ${priority.length
      ? html`<div class="chips">${priority.map((p) => html`<span class="chip">${R.category(p.category).emoji} ${p.name} <i class="${store.productStatus(p)}">${shortExpiry(p)}</i></span>`)}</div>`
      : html`<p class="hint inset">${state.products.length ? 'Rien d\'urgent : Claude pioche dans tout le stock.' : 'Stock vide : Claude part de la liste de courses.'}</p>`}`;
}

function generateBlock() {
  const hasKey = hasClaudeKey();
  const canGenerate = hasKey && !ui.generating && (state.products.length > 0 || state.shopping.length > 0);
  return html`
    <div class="start-action">
      <button class="primary generate" data-action="generate" ${canGenerate ? '' : raw('disabled')}>
        ${ui.generating ? html`<span class="spinner"></span>Claude cuisine… (environ 30 s)` : html`${I.sparkle}Proposer 5 recettes`}
      </button>
      ${ui.recipeNote
        ? html`<p class="note ${ui.recipeNote.kind}">${ui.recipeNote.text}</p>`
        : !hasKey ? html`<p class="hint">Ajoutez votre clé API Claude dans Réglages pour générer des recettes.</p>` : ''}
    </div>`;
}

export const recipesView = {
  render() {
    applyDefaultPriority();
    const filters = currentFilters();
    const tabs = recipeTabs(filters);
    const current = activeTab(tabs);
    const { items, empty } = tabs[current];
    const cards = items.map(([recipe, availability]) => recipeCard(recipe, availability));
    const hiddenOld = state.recipes.filter((r) => S.lacksTagsFor(r, filters)).length;

    return html`
      <header class="top"><h1>Recettes</h1></header>

      <section class="group recipe-start">
        ${priorityBlock()}
        ${quickFilters()}
        ${generateBlock()}
      </section>

      <h2 class="section">Mes recettes</h2>
      <div class="segmented recipe-tabs" role="tablist" aria-label="Mes recettes">
        ${Object.entries(tabs).map(([id, tab]) => html`
          <button role="tab" data-action="recipe-tab" data-value="${id}" aria-selected="${String(id === current)}" aria-pressed="${String(id === current)}">${tab.label}<i>${tab.items.length}</i></button>`)}
      </div>
      <div class="list">
        ${cards.length
          ? cards
          : html`<p class="hint">${!state.recipes.length ? 'Aucune recette pour l\'instant. Les recettes générées sont partagées avec l\'autre iPhone.' : empty}</p>`}
      </div>
      ${hiddenOld ? html`<p class="hint">${S.plural(hiddenOld, 'recette ancienne', 'recettes anciennes')} (sans régime, calories ou origine) ${hiddenOld > 1 ? 'sont masquées' : 'est masquée'} avec ces filtres.</p>` : ''}
      ${!cards.length && hasFilters() && state.recipes.length ? html`<button class="secondary" data-action="clear-filters">Effacer les filtres</button>` : ''}`;
  },
  update() {
    rerenderKeepScroll();
  }
};
