// Kookia — Affichage d'une recette : vignette du plat, origine, ingrédients.

import * as R from '../data/reference/index.js';
import { t } from '../services/i18n/i18n.js';
import * as S from '../services/index.js';
import { simplify } from '../services/text/text.js';
import { html } from './html.js';
import { I } from './icons.js';
import { dayCounter } from './product-visuals.js';

// Vignette d'une recette : l'emoji du plat, d'après les mots du titre (le premier qui correspond), et sa teinte.
// Mots en français, puis en anglais, espagnol et portugais (recettes écrites dans la langue de l'iPhone).
const DISHES = [
  ['soupe|veloute|potage|bouillon|minestrone|gaspacho|soup|sopa|caldo|crema de', '🥣', 'cream'],
  ['salade|taboule|bowl|salad|ensalada|salada', '🥗', 'green'],
  ['pizza', '🍕', 'cream'],
  ['quiche|tarte|tourte|feuillete|pie|tart|tarta|empanada', '🥧', 'cream'],
  ['burger|hamburguesa|hamburguer', '🍔', 'cream'],
  ['wrap|tacos|fajita|burrito|quesadilla|enchilada', '🌮', 'cream'],
  ['sandwich|croque|panini|tartine|bruschetta|toast|tostada', '🥪', 'cream'],
  ['sushi|maki|poke', '🍣', 'blue'],
  ['nouilles|ramen|pad thai|wok|udon|soba|noodle|fideos|lamen|yakisoba', '🍜', 'cream'],
  ['pates|penne|spaghetti|tagliatelle|lasagne|macaroni|gnocchi|ravioli|carbonara|bolognaise|fusilli|linguine|pasta|espagueti|macarrao|lasanha|lasana', '🍝', 'cream'],
  ['risotto|paella', '🍚', 'cream'],
  ['curry|dhal|chili', '🍛', 'cream'],
  ['tajine|couscous|mijote|ragout|bourguignon|blanquette|daube|pot-au-feu|stew|guiso|estofado|ensopado|feijoada|cozido|moqueca', '🍲', 'cream'],
  ['gratin|hachis|parmentier|moussaka|tian|casserole|gratinado|escondidinho', '🥘', 'cream'],
  ['omelette|oeuf|œuf|frittata|shakshuka|omelet|egg|huevo|ovo|omelete', '🍳', 'cream'],
  ['crepe|pancake|gaufre|waffle|panqueca|hotcake', '🥞', 'cream'],
  ['gateau|cake|muffin|cookie|brownie|crumble|clafoutis|mousse|compote|flan|fondant|pastel|bolo|pudim', '🍰', 'cream'],
  ['saumon|poisson|cabillaud|thon|crevette|moules|colin|truite|sardine|maquereau|dorade|fish|salmon|tuna|cod|shrimp|pescado|atun|bacalao|camaron|peixe|salmao|atum|bacalhau|camarao', '🐟', 'blue'],
  ['poulet|dinde|volaille|canard|chicken|turkey|duck|pollo|pavo|frango|galinha', '🍗', 'pink'],
  ['boeuf|bœuf|steak|porc|veau|agneau|saucisse|jambon|lardons|boulettes|filet mignon|beef|pork|lamb|meatball|carne|cerdo|albondiga|picanha|porco|bife|almondega', '🥩', 'pink'],
  ['riz|rice|arroz', '🍚', 'cream'],
  ['legume|ratatouille|poelee|courgette|aubergine|brocoli|chou|epinard|haricot|lentille|pois chiche|falafel|tofu|vegetable|veggie|verdura|zucchini|calabacita|abobrinha|broccoli|spinach|espinaca|espinafre|lentil|lenteja|lentilha|bean|frijol|feijao|chickpea|garbanzo', '🥦', 'green']
].map(([words, emoji, tint]) => [new RegExp(`\\b(${words})`), emoji, tint]);

export function recipeThumb(recipe) {
  const title = simplify(recipe.title || '');
  const [, emoji, tint] = DISHES.find(([re]) => re.test(title)) ?? [null, '🍽️', 'cream'];
  return html`<span class="recipe-thumb tint-${tint}" aria-hidden="true">${emoji}</span>`;
}

const SOURCE_ICON = { stock: I.fridge, courses: I.cart, placard: I.cabinet, a_acheter: I.cart };

export function originFact(recipe) {
  const origin = R.originOf(recipe.origin);
  return origin ? html`<span>${origin.emoji} ${S.originName(origin.id)}</span>` : '';
}

export function servingsLabel(n) {
  return t('servings', { n });
}

/** « Au placard », « Au congélateur (même code-barres) », « Au frigo (produit similaire) »… */
function whereLabel(product, via) {
  const place = S.capitalize(S.placeAt(product.location));
  if (via === 'code-barres') return t('ing.sameBarcode', { place });
  if (via === 'nom') return t('ing.similar', { place });
  return place;
}

export function ingredientRow({ ingredient, product, via, inShopping }, factor = 1) {
  const source = SOURCE_ICON[ingredient.source] ? ingredient.source : 'a_acheter';
  let where;
  if (product) where = whereLabel(product, via);
  else if (source === 'placard') where = S.placeName('placard');
  else if (inShopping) where = t('ing.onList');
  else if (ingredient.productId) where = t('ing.noMore');
  else where = t('ing.toBuy');
  const detail = [S.scaleIngredient(ingredient, factor), where].filter(Boolean).join(', ');
  const iconSource = product ? 'stock' : (source === 'placard' ? 'placard' : (inShopping ? 'courses' : 'a_acheter'));
  const productNote = product && via !== 'origine' ? html`<small class="matched">${product.name}</small>` : '';
  return html`
    <div class="ingredient">
      <span class="src ${iconSource}">${SOURCE_ICON[iconSource]}</span>
      <div><span>${ingredient.name}</span><small>${detail}</small>${productNote}</div>
      ${product ? dayCounter(product) : ''}
    </div>`;
}
