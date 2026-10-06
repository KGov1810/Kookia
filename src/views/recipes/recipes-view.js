// Kookia — Écran Recettes.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { shortExpiry } from '../../components/product-visuals.js';
import { servingsLabel } from '../../components/recipe-visuals.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { rerenderKeepScroll } from '../app/router.js';
import { currentFilters, ui } from '../app/ui-state.js';
import { originSummary } from './origin-picker.js';
import { recipeCard } from './recipe-card.js';

function applyDefaultPriority() {
  const ids = new Set(state.products.map((p) => p.id));
  if (!ui.customPriority) {
    ui.priority = new Set(store.soonProducts().map((p) => p.id));
  } else {
    ui.priority = new Set([...ui.priority].filter((id) => ids.has(id)));
  }
}

export const recipesView = {
  render() {
    applyDefaultPriority();
    const hasKey = hasClaudeKey();
    const priority = store.sortedProducts().filter((p) => ui.priority.has(p.id));
    const canGenerate = hasKey && !ui.generating && (state.products.length > 0 || state.shopping.length > 0);
    const recipes = [...state.recipes]
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .filter((r) => S.matchesFilters(r, currentFilters()) && (!ui.favoritesOnly || r.favorite));
    const compatible = store.compatibleRecipes({ priorityIds: ui.priority, filters: currentFilters() });
    const servings = state.settings.servings || 2;
    const hiddenOld = state.recipes.filter((r) => S.lacksTagsFor(r, currentFilters())).length;

    return html`
      <header class="top">
        <h1>Recettes</h1>
        <button class="icon-btn" data-action="toggle-favorites" aria-pressed="${String(ui.favoritesOnly)}" aria-label="Afficher seulement les favoris">${I.star}</button>
      </header>

      <section class="group">
        <h2>À utiliser en priorité</h2>
        ${priority.length
          ? html`<div class="chips">${priority.map((p) => html`<span class="chip">${R.category(p.category).emoji} ${p.name} <i class="${store.productStatus(p)}">${shortExpiry(p)}</i></span>`)}</div>`
          : html`<p class="hint inset">${state.products.length
            ? 'Aucun produit ne périme bientôt. Choisissez-en, ou laissez Claude piocher dans tout le stock.'
            : 'Le stock est vide : Claude partira de la liste de courses.'}</p>`}
        <button class="row-button" data-action="pick-products" ${state.products.length ? '' : raw('disabled')}>${I.check}Choisir les produits</button>
      </section>

      <section class="group">
        <div class="field"><span>Pour</span>
          <div class="stepper">
            <button data-action="servings-minus" aria-label="Une personne de moins" ${servings <= 1 ? raw('disabled') : ''}>−</button>
            <output>${servingsLabel(servings)}</output>
            <button data-action="servings-plus" aria-label="Une personne de plus" ${servings >= 12 ? raw('disabled') : ''}>+</button>
          </div>
        </div>
        <span class="filter-label">Régime</span>
        <div class="segmented" role="group" aria-label="Régime">
          ${R.DIETS.map((d) => html`<button data-action="set-diet" data-value="${d.id}" aria-pressed="${String(ui.filters.diet === d.id)}">${d.label}</button>`)}
        </div>
        <button class="field field-button" data-action="pick-origin">
          <span class="label-stack">Origine<small>${originSummary()}</small></span>
          <span class="chevron" aria-hidden="true">›</span>
        </button>
        <span class="filter-label">Difficulté</span>
        <div class="segmented" role="group" aria-label="Difficulté">
          ${[['', 'Toutes'], ...R.DIFFICULTIES.map((d) => [d.id, d.label])].map(([value, label]) => html`<button data-action="set-difficulty" data-value="${value}" aria-pressed="${String(ui.filters.difficulty === value)}">${label}</button>`)}
        </div>
        <span class="filter-label">Temps total maximum</span>
        <div class="segmented" role="group" aria-label="Temps total maximum">
          ${R.TIME_FILTERS.map((t) => html`<button data-action="set-time" data-value="${t.max}" aria-pressed="${String(ui.filters.maxMinutes === t.max)}">${t.label}</button>`)}
        </div>
        <label class="field">
          <span class="label-stack">Batch cooking<small>Se prépare en avance et se garde plusieurs jours</small></span>
          <input type="checkbox" class="switch" id="batch-toggle" ${ui.filters.batchOnly ? raw('checked') : ''}>
        </label>
        <label class="field">
          <span class="label-stack">Léger<small>${state.settings.lightMaxKcal || 500} kcal maximum par portion</small></span>
          <input type="checkbox" class="switch" id="light-toggle" ${ui.filters.light ? raw('checked') : ''}>
        </label>
      </section>

      ${compatible.length ? html`
        <h2 class="section">Déjà dans vos recettes<small>${compatible.length}</small></h2>
        <p class="hint">Réalisables avec votre stock actuel, sans nouvelle génération (gratuit).</p>
        <div class="list">${compatible.map((c) => recipeCard(c.recipe, c))}</div>` : ''}

      <button class="${compatible.length ? 'secondary' : 'primary'} generate" data-action="generate" ${canGenerate ? '' : raw('disabled')}>
        ${ui.generating ? html`<span class="spinner"></span>Claude cuisine… (environ 30 s)` : html`${I.sparkle}${compatible.length ? 'Proposer 5 nouvelles recettes' : 'Proposer 5 recettes'}`}
      </button>
      ${ui.recipeNote
        ? html`<p class="note ${ui.recipeNote.kind}">${ui.recipeNote.text}</p>`
        : !hasKey
          ? html`<p class="hint">Ajoutez votre clé API Claude dans Réglages pour générer des recettes.</p>`
          : ''}

      <h2 class="section">${ui.favoritesOnly ? 'Recettes favorites' : 'Mes recettes'}<small>${recipes.length || ''}</small></h2>
      <div class="list">
        ${!state.recipes.length
          ? html`<p class="hint">Aucune recette pour l'instant. Les recettes générées sont partagées avec l'autre iPhone.</p>`
          : !recipes.length
            ? html`<p class="hint">Aucune recette ne correspond à ces filtres.</p>`
            : recipes.map((recipe) => recipeCard(recipe))}
      </div>
      ${hiddenOld ? html`<p class="hint">${S.plural(hiddenOld, 'recette ancienne', 'recettes anciennes')} (sans régime, calories ou origine) ${hiddenOld > 1 ? 'sont masquées' : 'est masquée'} avec ces filtres.</p>` : ''}`;
  },
  update() {
    rerenderKeepScroll();
  }
};
