// Kookia — Affichage d'une recette : origine, ingrédients.

import * as R from '../data/reference/index.js';
import * as S from '../services/index.js';
import { html } from './html.js';
import { I } from './icons.js';
import { dayCounter } from './product-visuals.js';

export const DIFFICULTY_LABEL = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };

const SOURCE = {
  stock: { label: 'Au frigo', icon: I.fridge },
  courses: { label: 'Liste de courses', icon: I.cart },
  placard: { label: 'Placard', icon: I.cabinet },
  a_acheter: { label: 'À acheter', icon: I.cart }
};

export function originFact(recipe) {
  const origin = R.originOf(recipe.origin);
  return origin ? html`<span>${origin.emoji} ${origin.label}</span>` : '';
}

export function servingsLabel(n) {
  return `${n} personne${n > 1 ? 's' : ''}`;
}

/** « Au placard », « Au congélateur (même code-barres) », « Au frigo (produit similaire) »… */
function whereLabel(product, via) {
  const at = R.locationOf(product.location).at;
  const place = at.charAt(0).toUpperCase() + at.slice(1);
  if (via === 'code-barres') return `${place} (même code-barres)`;
  if (via === 'nom') return `${place} (produit similaire)`;
  return place;
}

export function ingredientRow({ ingredient, product, via, inShopping }, factor = 1) {
  const source = SOURCE[ingredient.source] ? ingredient.source : 'a_acheter';
  let where;
  if (product) where = whereLabel(product, via);
  else if (source === 'placard') where = SOURCE.placard.label;
  else if (inShopping) where = 'Sur la liste de courses';
  else if (ingredient.productId) where = 'Plus en stock';
  else where = 'À acheter';
  const detail = [S.scaleIngredient(ingredient, factor), where].filter(Boolean).join(', ');
  const iconSource = product ? 'stock' : (source === 'placard' ? 'placard' : (inShopping ? 'courses' : 'a_acheter'));
  const productNote = product && via !== 'origine' ? html`<small class="matched">${product.name}</small>` : '';
  return html`
    <div class="ingredient">
      <span class="src ${iconSource}">${SOURCE[iconSource].icon}</span>
      <div><span>${ingredient.name}</span><small>${detail}</small>${productNote}</div>
      ${product ? dayCounter(product) : ''}
    </div>`;
}
