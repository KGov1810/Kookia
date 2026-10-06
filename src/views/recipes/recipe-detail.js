// Kookia — Détail d'une recette.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { shareText } from '../../components/platform.js';
import { DIFFICULTY_LABEL, ingredientRow, originFact } from '../../components/recipe-visuals.js';
import { openSheet } from '../../components/sheet.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';

function recipeShareText(recipe, servings = recipe.servings) {
  const factor = servings / (recipe.servings || servings);
  const lines = [recipe.title];
  if (recipe.summary) lines.push(recipe.summary);
  const infos = [S.formatMinutes(recipe.totalMinutes), (DIFFICULTY_LABEL[recipe.difficulty] ?? '').toLowerCase(), `pour ${S.plural(servings, 'portion')}`];
  if (recipe.kcal > 0) infos.push(`environ ${recipe.kcal} kcal par portion`);
  const origin = R.originOf(recipe.origin);
  if (origin) infos.push(`cuisine ${origin.label.toLowerCase()}`);
  lines.push('', infos.join(', '));
  lines.push('', 'Ingrédients :', ...recipe.ingredients.map((i) => {
    const quantity = S.scaleIngredient(i, factor);
    return `- ${quantity ? `${quantity} ` : ''}${i.name}`;
  }));
  lines.push('', 'Préparation :', ...recipe.steps.map((s, n) => `${n + 1}. ${s}`));
  if (recipe.storageTips) lines.push('', `Conservation : ${recipe.storageTips}`);
  return lines.join('\n');
}

export function openRecipe(id) {
  let servings = null; // nombre de portions affiché (null = celui de la recette)
  const baseServings = (recipe) => Math.max(1, recipe.servings || 2);
  const shownServings = (recipe) => servings ?? baseServings(recipe);
  const factorFor = (recipe) => shownServings(recipe) / baseServings(recipe);

  const sheet = openSheet({
    tall: true,
    render,
    onData: () => sheet.update(),
    actions: {
      favorite: () => store.toggleFavorite(id),
      'portions-minus': () => {
        const recipe = findRecipe();
        if (!recipe) return;
        servings = Math.max(1, shownServings(recipe) - 1);
        sheet.update();
      },
      'portions-plus': () => {
        const recipe = findRecipe();
        if (!recipe) return;
        servings = Math.min(24, shownServings(recipe) + 1);
        sheet.update();
      },
      'add-missing': () => {
        const recipe = findRecipe();
        if (!recipe) return;
        const added = store.addMissingIngredients(recipe, factorFor(recipe));
        toast(added ? `${S.plural(added, 'ingrédient')} ajouté${added > 1 ? 's' : ''} aux courses` : 'Déjà dans la liste de courses');
      },
      cooked: () => {
        const recipe = findRecipe();
        if (!recipe) return;
        const used = store.recipeAvailability(recipe).inFridge;
        if (!used.length) return;
        const list = used.map((p) => ((p.count ?? 1) > 1 ? `${p.name} (1 sur ${p.count})` : p.name)).join(', ');
        if (!window.confirm(`Retirer une unité du stock : ${list} ?`)) return;
        const { before } = store.consumeOne(used.map((p) => p.id), { reason: `recette « ${recipe.title} »` });
        toast(`${S.plural(before.length, 'produit')} mis à jour dans le stock`, 'Annuler', () => store.restoreProducts(before));
      },
      share: () => {
        const recipe = findRecipe();
        if (recipe) shareText(recipeShareText(recipe, shownServings(recipe)), recipe.title);
      },
      delete: () => {
        if (!window.confirm('Supprimer cette recette sur les deux iPhone ?')) return;
        store.deleteRecipe(id);
        sheet.close();
      }
    }
  });

  function findRecipe() {
    return state.recipes.find((r) => r.id === id) ?? null;
  }

  function render() {
    const recipe = findRecipe();
    if (!recipe) {
      return html`
        <header class="sheet-head"><span></span><h2>Recette</h2><button class="link strong" data-action="close">Fermer</button></header>
        <div class="sheet-body"><p class="hint">Cette recette a été supprimée.</p></div>`;
    }
    const availability = store.recipeAvailability(recipe);
    const used = availability.inFridge;
    const missing = availability.missing;
    const prep = recipe.prepMinutes && recipe.prepMinutes < recipe.totalMinutes
      ? `, dont ${S.formatMinutes(recipe.prepMinutes)} de préparation` : '';
    return html`
      <header class="sheet-head">
        <button class="icon-btn" data-action="favorite" aria-pressed="${String(Boolean(recipe.favorite))}" aria-label="${recipe.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${I.star}</button>
        <h2>Recette</h2>
        <button class="link strong" data-action="close">Fermer</button>
      </header>
      <div class="sheet-body">
        <div class="recipe-hero">
          <h2>${recipe.title}</h2>
          ${recipe.summary ? html`<p>${recipe.summary}</p>` : ''}
          <div class="facts">
            <span>${I.clock}${S.formatMinutes(recipe.totalMinutes)}${prep}</span>
            <span>${I.gauge}${DIFFICULTY_LABEL[recipe.difficulty] ?? recipe.difficulty}</span>
            ${R.DIET_LABEL[recipe.diet] ? html`<span class="diet">${I.leaf}${R.DIET_LABEL[recipe.diet]}</span>` : ''}
            ${originFact(recipe)}
          </div>
          <p class="kcal">${recipe.kcal > 0
            ? html`${I.flame}≈ ${recipe.kcal} kcal par portion <small>(estimation)</small>`
            : html`<small>Calories non estimées (recette créée avant cette fonction).</small>`}</p>
        </div>

        <section class="group">
          <h2>Ingrédients</h2>
          <div class="field"><span>Portions</span>
            <div class="stepper">
              <button data-action="portions-minus" aria-label="Une portion de moins" ${shownServings(recipe) <= 1 ? raw('disabled') : ''}>−</button>
              <output aria-live="polite">${shownServings(recipe)}</output>
              <button data-action="portions-plus" aria-label="Une portion de plus">+</button>
            </div>
          </div>
          ${shownServings(recipe) !== baseServings(recipe) ? html`<p class="hint inset">Quantités recalculées (recette prévue pour ${baseServings(recipe)}). Les temps de cuisson restent indicatifs.</p>` : ''}
          ${availability.rows.map((row) => ingredientRow(row, factorFor(recipe)))}
          ${missing.length ? html`<button class="row-button" data-action="add-missing">${I.cart}${missing.length > 1 ? `Ajouter les ${missing.length} ingrédients qui manquent aux courses` : "Ajouter l'ingrédient qui manque aux courses"}</button>` : ''}
        </section>

        <section class="group">
          <h2>Préparation</h2>
          <ol class="steps">${recipe.steps.map((step) => html`<li><span>${step}</span></li>`)}</ol>
        </section>

        ${recipe.storageDays > 0 || recipe.storageTips ? html`
          <section class="group">
            <h2>Conservation</h2>
            <p class="plain">${recipe.storageDays > 0 ? `Se garde ${S.plural(recipe.storageDays, 'jour')} au réfrigérateur. ` : ''}${recipe.storageTips}</p>
          </section>` : ''}

        <section class="group">
          ${used.length ? html`<button class="row-button" data-action="cooked">${I.check}J'ai cuisiné cette recette</button>` : ''}
          <button class="row-button" data-action="share">${I.share}Partager la recette</button>
          <button class="row-button danger" data-action="delete">${I.trash}Supprimer la recette</button>
        </section>
        ${used.length ? html`<p class="hint">« J'ai cuisiné » retire une unité de : ${used.map((p) => p.name).join(', ')}.</p>` : ''}
      </div>`;
  }
}
