// Kookia — Carte d'une recette.

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { DIFFICULTY_LABEL, originFact } from '../../components/recipe-visuals.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';

export function recipeCard(recipe, availability = store.recipeAvailability(recipe, ui.priority)) {
  const { inFridge, missing, urgentUsed } = availability;
  let fit = '';
  if (inFridge.length) {
    const missingText = missing.length === 0
      ? 'tout est en stock'
      : `manque ${missing.slice(0, 2).map((i) => i.name.toLowerCase()).join(', ')}${missing.length > 2 ? '…' : ''}`;
    fit = html`<span class="uses">Utilise ${S.plural(inFridge.length, 'produit')} en stock${urgentUsed ? html`, <b class="urgent">dont ${urgentUsed} à consommer vite</b>` : ''}, ${missingText}</span>`;
  }
  return html`
    <button class="recipe-card" data-action="open-recipe" data-id="${recipe.id}">
      <h3><span>${recipe.title}</span>${recipe.favorite ? I.star : ''}</h3>
      ${recipe.summary ? html`<p>${recipe.summary}</p>` : ''}
      <span class="facts">
        <span>${I.clock}${S.formatMinutes(recipe.totalMinutes)}</span>
        <span>${I.gauge}${DIFFICULTY_LABEL[recipe.difficulty] ?? recipe.difficulty}</span>
        ${S.isBatchFriendly(recipe) ? html`<span>${I.box}Se garde ${S.plural(recipe.storageDays, 'jour')}</span>` : ''}
        ${recipe.kcal > 0 ? html`<span>${I.flame}≈ ${recipe.kcal} kcal</span>` : ''}
        ${R.DIET_LABEL[recipe.diet] ? html`<span class="diet">${I.leaf}${R.DIET_LABEL[recipe.diet]}</span>` : ''}
        ${originFact(recipe)}
      </span>
      ${fit}
    </button>`;
}
