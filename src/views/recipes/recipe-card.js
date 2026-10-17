// Kookia — Carte d'une recette : vignette du plat, titre, temps, origine, et ce qui manque.

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { recipeThumb } from '../../components/recipe-visuals.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';

/** « Tout est dans le stock », « Il manque gruyère râpé, crème… » (rien si la recette n'utilise pas le stock). */
function stockLine(inFridge, missing) {
  if (!inFridge.length) return '';
  const names = missing.slice(0, 2).map((i) => i.name.toLowerCase()).join(', ');
  return html`<span class="fit">${missing.length ? t('card.missing', { names: `${names}${missing.length > 2 ? '…' : ''}` }) : t('card.allInStock')}</span>`;
}

/** Carte d'une recette : grande vignette du plat, titre, temps, origine, produits à consommer vite, ce qui manque. */
export function recipeCard(recipe, availability = store.recipeAvailability(recipe, ui.priority)) {
  const { inFridge, missing, urgentUsed } = availability;
  const origin = R.originOf(recipe.origin);
  return html`
    <button class="recipe-card" data-action="open-recipe" data-id="${recipe.id}">
      ${recipeThumb(recipe)}
      <span class="recipe-card-text">
        <h3><span>${recipe.title}</span>${ui.freshIds.has(recipe.id) ? html`<b class="badge">${t('card.new')}</b>` : ''}${recipe.favorite ? I.star : ''}</h3>
        <span class="facts">
          <span>${I.clock}${S.formatMinutes(recipe.totalMinutes)}</span>
          ${origin ? html`<span class="flag" title="${S.originName(origin.id)}" aria-label="${t('card.cuisine', { origin: S.inSentence(S.originName(origin.id)) })}">${origin.emoji}</span>` : ''}
          ${urgentUsed ? html`<span class="urgent">${t('card.urgent', { n: urgentUsed })}</span>` : ''}
        </span>
        ${stockLine(inFridge, missing)}
      </span>
    </button>`;
}
