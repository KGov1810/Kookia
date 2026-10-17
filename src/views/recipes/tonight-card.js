// Kookia — Recettes : le repas prévu aujourd'hui dans le planning, avec « Je l'ai cuisiné » (un toucher)
// et « Pas ce soir » (choisir un autre repas).

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { recipeThumb } from '../../components/recipe-visuals.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { cookedPreview } from './recipe-cooking.js';

/** Repas d'aujourd'hui encore à cuisiner (le midi jusqu'à 15 h, puis le soir) : { slot, index, recipe } ou null. */
export function todayMeal(now = new Date()) {
  const plan = state.plan;
  if (!plan) return null;
  const today = S.planDayIndex(plan.start);
  const open = plan.slots
    .map((slot, index) => ({ slot, index, recipe: state.recipes.find((r) => r.id === slot.recipeId) }))
    .filter(({ slot, recipe }) => slot.day === today && !slot.done && !slot.leftovers && recipe);
  if (!open.length) return null;
  const prefer = now.getHours() < 15 ? 'midi' : 'soir';
  return open.find((m) => m.slot.meal === prefer) ?? open.find((m) => m.slot.meal === 'soir') ?? open[0];
}

export function tonightCard() {
  const meal = todayMeal();
  if (!meal) return '';
  const { slot, index, recipe } = meal;
  const { inFridge } = store.recipeAvailability(recipe);
  const facts = [S.formatMinutes(recipe.totalMinutes), inFridge.length ? t('tonight.withStock', { n: inFridge.length }) : ''].filter(Boolean).join(', ');
  const preview = cookedPreview(recipe);
  const lunch = slot.meal === 'midi';
  const planned = t(lunch ? 'tonight.lunch' : 'tonight.dinner');
  return html`
    <section class="group tonight" aria-label="${planned}">
      <button class="tonight-head" data-action="open-recipe" data-id="${recipe.id}">
        ${recipeThumb(recipe)}
        <span class="tonight-text"><small>${planned}</small><b>${recipe.title}</b><span>${facts}</span></span>
      </button>
      <div class="tonight-actions">
        <button class="primary" data-action="tonight-cooked" data-id="${recipe.id}">${I.check}${t('tonight.cooked')}</button>
        <button class="secondary" data-action="week-slot" data-index="${index}">${t(lunch ? 'tonight.notLunch' : 'tonight.notDinner')}</button>
      </div>
      ${preview ? html`<p class="hint inset">${preview}</p>` : ''}
    </section>`;
}
