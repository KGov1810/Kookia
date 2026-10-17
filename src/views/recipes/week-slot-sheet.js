// Kookia — Semaine : changer un repas (autre recette de Claude, une de « Mes recettes », retirer) et séance de batch cooking.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { openSheet } from '../../components/sheet.js';
import * as store from '../../data/store/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { openRecipe } from './recipe-detail.js';
import { replaceSlot } from './week-generation.js';
import { slotTitle } from './week-view.js';

/** Mes recettes, les plus faciles à faire avec le stock d'abord. */
function pickList(currentId) {
  const doable = store.compatibleRecipes({ limit: Infinity }).map((c) => c.recipe);
  const rest = [...state.recipes].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)).filter((r) => !doable.includes(r));
  return [...doable, ...rest].filter((r) => r.id !== currentId);
}

export function openSlotSheet(index) {
  let picking = false;
  const slotNow = () => state.plan?.slots[index];
  const sheet = openSheet({
    tall: true,
    render: () => {
      const slot = slotNow();
      if (!slot) return html`<header class="sheet-head"><span></span><h2>${t('slot.title')}</h2><button class="link strong" data-action="close">${t('common.close')}</button></header>`;
      const recipe = S.localRecipe(state.recipes.find((r) => r.id === slot.recipeId));
      const plan = state.plan;
      return html`
        <header class="sheet-head">
          ${picking ? html`<button class="link" data-action="back">${t('slot.back')}</button>` : html`<span></span>`}
          <h2>${slotTitle(plan, slot)}</h2>
          <button class="link strong" data-action="close">${t('common.close')}</button>
        </header>
        <div class="sheet-body">
          ${picking ? html`
            <p class="hint">${t('slot.doableFirst')}</p>
            <div class="list">${pickList(slot.recipeId).map((r) => html`
              <button class="recipe-card" data-action="pick" data-id="${r.id}"><h3><span>${S.localRecipe(r).title}</span>${r.favorite ? I.star : ''}</h3>
                <span class="facts"><span>${I.clock}${S.formatMinutes(r.totalMinutes)}</span></span></button>`)}</div>` : html`
            <section class="group">
              ${recipe ? html`<div class="field"><span>${t(slot.leftovers ? 'slot.leftoversOf' : 'slot.onMenu')}</span><b class="slot-current">${recipe.title}</b></div>` : ''}
              ${recipe ? html`<button class="row-button" data-action="view">${I.check}${t('slot.view')}</button>` : ''}
              <button class="row-button" data-action="regenerate" ${hasClaudeKey() ? '' : raw('disabled')}>${I.sparkle}${t('slot.another')}</button>
              <button class="row-button" data-action="choose">${I.star}${t('slot.choose')}</button>
              <button class="row-button danger" data-action="remove">${I.trash}${t('slot.remove')}</button>
            </section>
            ${slot.leftovers ? html`<p class="hint">${t('slot.leftoversHint')}</p>` : ''}`}
        </div>`;
    },
    actions: {
      view: () => {
        const id = slotNow()?.recipeId;
        sheet.close();
        if (id) openRecipe(id);
      },
      regenerate: () => {
        sheet.close();
        replaceSlot(index);
      },
      choose: () => { picking = true; sheet.update(); },
      back: () => { picking = false; sheet.update(); },
      pick: (el) => {
        store.setPlanSlot(index, el.dataset.id);
        sheet.close();
      },
      remove: () => {
        store.setPlanSlot(index, null);
        sheet.close();
      }
    },
    onData: () => sheet.update()
  });
  return sheet;
}

/** Séance de batch cooking : étapes et recettes avancées. */
export function openBatchSheet() {
  const sheet = openSheet({
    tall: true,
    render: () => {
      const plan = S.localPlan(state.plan); // étapes du batch dans la langue de l'iPhone
      const batch = plan?.batch;
      const recipes = (batch?.recipeIds ?? []).map((id) => S.localRecipe(state.recipes.find((r) => r.id === id))).filter(Boolean);
      return html`
        <header class="sheet-head"><span></span><h2>${t('batch.title')}</h2><button class="link strong" data-action="close">${t('common.close')}</button></header>
        <div class="sheet-body">
          ${batch ? html`
            <p class="hint">${t('batch.about', { day: S.capitalize(S.weekDayLabel(plan.start, batch.day)), time: S.formatMinutes(batch.minutes) })}</p>
            <section class="group"><h2>${t('batch.steps')}</h2><ol class="steps">${batch.steps.map((step) => html`<li><span>${step}</span></li>`)}</ol></section>
            ${recipes.length ? html`<h2 class="section">${t('batch.recipes')}</h2>
              <div class="list">${recipes.map((r) => html`<button class="recipe-card" data-action="view" data-id="${r.id}"><h3><span>${r.title}</span></h3></button>`)}</div>` : ''}` : html`<p class="hint">${t('batch.none')}</p>`}
        </div>`;
    },
    actions: {
      view: (el) => {
        sheet.close();
        openRecipe(el.dataset.id);
      }
    },
    onData: () => sheet.update()
  });
  return sheet;
}
