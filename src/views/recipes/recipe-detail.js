// Kookia — Détail d'une recette.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { shareText } from '../../components/platform.js';
import { ingredientRow, originFact } from '../../components/recipe-visuals.js';
import { openSheet } from '../../components/sheet.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { cookRecipe } from './recipe-cooking.js';
import { translateIfNeeded, translationNote } from './recipe-translation.js';

function recipeShareText(recipe, servings = recipe.servings) {
  const factor = servings / (recipe.servings || servings);
  const lines = [recipe.title];
  if (recipe.summary) lines.push(recipe.summary);
  const infos = [S.formatMinutes(recipe.totalMinutes), recipe.difficulty ? S.difficultyName(recipe.difficulty).toLocaleLowerCase() : '', t('share.servings', { n: servings })].filter(Boolean);
  if (recipe.kcal > 0) infos.push(t('share.kcal', { kcal: recipe.kcal }));
  const origin = R.originOf(recipe.origin);
  if (origin) infos.push(t('share.cuisine', { origin: S.inSentence(S.originName(origin.id)) }));
  lines.push('', infos.join(', '));
  lines.push('', t('share.ingredients'), ...recipe.ingredients.map((i) => {
    const quantity = S.scaleIngredient(i, factor);
    return `- ${quantity ? `${quantity} ` : ''}${i.name}`;
  }));
  lines.push('', t('share.steps'), ...recipe.steps.map((s, n) => `${n + 1}. ${s}`));
  if (recipe.storageTips) lines.push('', t('share.storage', { tips: recipe.storageTips }));
  return lines.join('\n');
}

/** « mardi soir, mercredi midi (restes) » si la recette est au planning de la semaine, sinon ''. */
function planned(recipe) {
  const plan = state.plan;
  return (plan?.slots ?? []).filter((s) => s.recipeId === recipe.id)
    .map((s) => {
      const slot = t('week.slotTitle', { day: S.weekDayLabel(plan.start, s.day, { weekday: 'long' }), meal: t(`meal.${s.meal}`) });
      return s.leftovers ? t('detail.leftovers', { slot }) : slot;
    }).join(', ');
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
        toast(added ? t('detail.added', { n: added }) : t('detail.already'));
      },
      cooked: () => {
        const recipe = findRecipe();
        if (recipe) cookRecipe(recipe, { factor: factorFor(recipe), confirm: true });
      },
      share: () => {
        const recipe = findRecipe();
        if (recipe) shareText(recipeShareText(recipe, shownServings(recipe)), recipe.title);
      },
      delete: () => {
        if (!window.confirm(t('detail.confirmDelete'))) return;
        store.deleteRecipe(id);
        sheet.close();
      }
    }
  });
  // Pas encore dans la langue de cet iPhone : Claude la traduit (bandeau pendant la traduction).
  translateIfNeeded(id, () => sheet.isOpen && sheet.update());

  function findRecipe() {
    return S.localRecipe(state.recipes.find((r) => r.id === id)) ?? null; // textes dans la langue de l'iPhone
  }

  function render() {
    const recipe = findRecipe();
    if (!recipe) {
      return html`
        <header class="sheet-head"><span></span><h2>${t('detail.title')}</h2><button class="link strong" data-action="close">${t('common.close')}</button></header>
        <div class="sheet-body"><p class="hint">${t('detail.deleted')}</p></div>`;
    }
    const availability = store.recipeAvailability(recipe);
    const used = availability.inFridge;
    const missing = availability.missing;
    const prep = recipe.prepMinutes && recipe.prepMinutes < recipe.totalMinutes
      ? t('detail.prep', { time: S.formatMinutes(recipe.prepMinutes) }) : '';
    return html`
      <header class="sheet-head">
        <button class="icon-btn" data-action="favorite" aria-pressed="${String(Boolean(recipe.favorite))}" aria-label="${t(recipe.favorite ? 'detail.unfavorite' : 'detail.favorite')}">${I.star}</button>
        <h2>${t('detail.title')}</h2>
        <button class="link strong" data-action="close">${t('common.close')}</button>
      </header>
      <div class="sheet-body">
        ${translationNote(recipe)}
        <div class="recipe-hero">
          ${planned(recipe) ? html`<p class="planned-on">${I.calendar}${t('detail.onMenu', { when: planned(recipe) })}</p>` : ''}
          <h2>${recipe.title}</h2>
          ${recipe.summary ? html`<p>${recipe.summary}</p>` : ''}
          <div class="facts">
            <span>${I.clock}${S.formatMinutes(recipe.totalMinutes)}${prep}</span>
            <span>${I.gauge}${S.difficultyName(recipe.difficulty)}</span>
            ${R.DIET_LABEL[recipe.diet] ? html`<span class="diet">${I.leaf}${S.dietName(recipe.diet)}</span>` : ''}
            ${originFact(recipe)}
          </div>
          <p class="kcal">${recipe.kcal > 0
            ? html`${I.flame}${t('detail.kcal', { kcal: recipe.kcal })} <small>${t('detail.estimate')}</small>`
            : html`<small>${t('detail.noKcal')}</small>`}</p>
        </div>

        <section class="group">
          <h2>${t('detail.ingredients')}</h2>
          <div class="field"><span>${t('detail.portions')}</span>
            <div class="stepper">
              <button data-action="portions-minus" aria-label="${t('detail.lessPortion')}" ${shownServings(recipe) <= 1 ? raw('disabled') : ''}>−</button>
              <output aria-live="polite">${shownServings(recipe)}</output>
              <button data-action="portions-plus" aria-label="${t('detail.morePortion')}">+</button>
            </div>
          </div>
          ${shownServings(recipe) !== baseServings(recipe) ? html`<p class="hint inset">${t('detail.rescaled', { n: baseServings(recipe) })}</p>` : ''}
          ${availability.rows.map((row) => ingredientRow(row, factorFor(recipe)))}
          ${missing.length ? html`<button class="row-button" data-action="add-missing">${I.cart}${t('detail.addMissing', { n: missing.length })}</button>` : ''}
        </section>

        <section class="group">
          <h2>${t('detail.steps')}</h2>
          <ol class="steps">${recipe.steps.map((step) => html`<li><span>${step}</span></li>`)}</ol>
        </section>

        ${recipe.storageDays > 0 || recipe.storageTips ? html`
          <section class="group">
            <h2>${t('detail.storage')}</h2>
            <p class="plain">${[recipe.storageDays > 0 ? t('detail.keeps', { n: recipe.storageDays }) : '', recipe.storageTips].filter(Boolean).join(' ')}</p>
          </section>` : ''}

        <section class="group">
          ${used.length || planned(recipe) ? html`<button class="row-button" data-action="cooked">${I.check}${t('detail.cooked')}</button>` : ''}
          <button class="row-button" data-action="share">${I.share}${t('detail.share')}</button>
          <button class="row-button danger" data-action="delete">${I.trash}${t('detail.delete')}</button>
        </section>
        ${used.length ? html`<p class="hint">${t('detail.removes', { names: used.map((p) => p.name).join(', ') })}</p>` : ''}
      </div>`;
  }
}
