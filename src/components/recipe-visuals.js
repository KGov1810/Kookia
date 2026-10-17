// Kookia — Affichage d'une recette : vignette du plat, origine, ingrédients.

import * as R from '../data/reference/index.js';
import * as S from '../services/index.js';
import { simplify } from '../services/text/text.js';
import { html } from './html.js';
import { I } from './icons.js';
import { dayCounter } from './product-visuals.js';

// Vignette d'une recette : l'emoji du plat, d'après les mots du titre (le premier qui correspond), et sa teinte.
const DISHES = [
  ['soupe|veloute|potage|bouillon|minestrone|gaspacho', '🥣', 'cream'],
  ['salade|taboule|bowl', '🥗', 'green'],
  ['pizza', '🍕', 'cream'],
  ['quiche|tarte|tourte|feuillete', '🥧', 'cream'],
  ['burger', '🍔', 'cream'],
  ['wrap|tacos|fajita|burrito|quesadilla', '🌮', 'cream'],
  ['sandwich|croque|panini|tartine|bruschetta', '🥪', 'cream'],
  ['sushi|maki|poke', '🍣', 'blue'],
  ['nouilles|ramen|pad thai|wok|udon|soba', '🍜', 'cream'],
  ['pates|penne|spaghetti|tagliatelle|lasagne|macaroni|gnocchi|ravioli|carbonara|bolognaise|fusilli|linguine', '🍝', 'cream'],
  ['risotto|paella', '🍚', 'cream'],
  ['curry|dhal|chili', '🍛', 'cream'],
  ['tajine|couscous|mijote|ragout|bourguignon|blanquette|daube|pot-au-feu', '🍲', 'cream'],
  ['gratin|hachis|parmentier|moussaka|tian', '🥘', 'cream'],
  ['omelette|oeuf|œuf|frittata|shakshuka', '🍳', 'cream'],
  ['crepe|pancake|gaufre', '🥞', 'cream'],
  ['gateau|cake|muffin|cookie|brownie|crumble|clafoutis|mousse|compote|flan|fondant', '🍰', 'cream'],
  ['saumon|poisson|cabillaud|thon|crevette|moules|colin|truite|sardine|maquereau|dorade', '🐟', 'blue'],
  ['poulet|dinde|volaille|canard', '🍗', 'pink'],
  ['boeuf|bœuf|steak|porc|veau|agneau|saucisse|jambon|lardons|boulettes|filet mignon', '🥩', 'pink'],
  ['riz', '🍚', 'cream'],
  ['legume|ratatouille|poelee|courgette|aubergine|brocoli|chou|epinard|haricot|lentille|pois chiche|falafel|tofu', '🥦', 'green']
].map(([words, emoji, tint]) => [new RegExp(`\\b(${words})`), emoji, tint]);

export function recipeThumb(recipe) {
  const title = simplify(recipe.title || '');
  const [, emoji, tint] = DISHES.find(([re]) => re.test(title)) ?? [null, '🍽️', 'cream'];
  return html`<span class="recipe-thumb tint-${tint}" aria-hidden="true">${emoji}</span>`;
}

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
