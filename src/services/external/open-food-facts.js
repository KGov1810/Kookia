// Kookia — Recherche d'un produit par code-barres (Open Food Facts).

import { guessCategory } from '../stock/categorization.js';

// Étiquettes Open Food Facts (« en:dry-pastas ») → catégorie. On teste la fin de l'étiquette
// (mot entier), de la plus précise à la plus générale.
const OFF_RULES = [
  ['boisson', /(^|-)(beverages|drinks|waters|juices|sodas|wines|beers|teas|coffees|syrups|ciders)$/],
  ['fromage', /(^|-)cheeses$/],
  ['oeufs', /(^|-)eggs$/],
  ['laitier', /(^|-)(dairies|yogurts|milks|butters|creams|dairy-desserts|fermented-milk-products)$/],
  ['volaille', /(^|-)(poultries|poultry|chickens|turkeys|ducks)$/],
  ['charcuterie', /(^|-)(hams|sausages|charcuteries|bacons|salamis|prepared-meats|cured-meats|chorizos)$/],
  ['viande', /(^|-)(meats|beef|pork|veal|lamb|steaks)$/],
  ['poisson', /(^|-)(fishes|seafood|smoked-salmons|crustaceans|shellfish|tunas|salmons|sardines)$/],
  ['boulangerie', /(^|-)(breads|viennoiseries|pastries|brioches|baguettes|crispbreads|rusks)$/],
  ['traiteur', /(^|-)(meals|prepared-salads|pizzas|sandwiches|quiches|fresh-pastas|dips|soups)$/],
  ['fruits_secs', /(^|-)(nuts|dried-fruits|seeds|almonds|walnuts|hazelnuts|pistachios|cashew-nuts)$/],
  ['legumineuses', /(^|-)(legumes|pulses|lentils|chickpeas|dried-beans|kidney-beans|white-beans)$/],
  ['feculents', /(^|-)(pastas|rices|semolinas|quinoa|cereal-grains|couscous|noodles|breakfast-oats|oat-flakes)$/],
  ['condiments', /(^|-)(condiments|sauces|spices|oils|vinegars|salts|mustards|ketchups|mayonnaises|seasonings|broths)$/],
  ['patisserie', /(^|-)(flours|sugars|yeasts|baking-aids|cooking-chocolates|cocoa-powders)$/],
  ['sucre', /(^|-)(biscuits|cookies|chocolates|candies|confectioneries|jams|spreads|honeys|breakfast-cereals|cakes|desserts|compotes)$/],
  ['snacks', /(^|-)(chips|crisps|salty-snacks|crackers|appetizers|popcorn|olives)$/],
  ['conserves', /(^|-)(canned-foods|canned-vegetables|canned-meals)$/],
  ['fruits', /(^|-)(fruits|apples|bananas|citrus|berries|pears|oranges)$/],
  ['legumes', /(^|-)(vegetables|tomatoes|potatoes|carrots|leafy-vegetables|mushrooms)$/]
];

const OFF_GENERIC = new Set(['plant-based-foods-and-beverages', 'plant-based-foods', 'foods', 'groceries']);

/**
 * Catégorie d'après les étiquettes Open Food Facts, de la plus précise à la plus générale, ou null.
 * Les étiquettes restées en français (« fr:viandes-hachees ») sont lues comme un nom de produit.
 */
export function categoryFromTags(tags = []) {
  const names = tags.map((t) => String(t).toLowerCase()).filter((t) => !OFF_GENERIC.has(t.replace(/^[a-z]{2}:/, '')));
  if (names.some((t) => t.includes('frozen') || t.endsWith('ice-creams') || /^fr:.*surgel/.test(t))) return 'surgele';
  for (const tag of [...names].reverse()) { // la plus précise en dernier chez Open Food Facts
    const name = tag.replace(/^[a-z]{2}:/, '');
    const rule = OFF_RULES.find(([, pattern]) => pattern.test(name));
    if (rule) return rule[0];
    if (tag.startsWith('fr:')) {
      const guess = guessCategory(name.replace(/-/g, ' '));
      if (guess) return guess;
    }
  }
  return null;
}

/** Renvoie { name, quantity, category, imageUrl } ou null si le code est inconnu. */
export async function lookupBarcode(code) {
  const digits = String(code).replace(/\D/g, '');
  if (digits.length < 6) return null;
  const fields = 'product_name,product_name_fr,generic_name_fr,brands,quantity,image_front_small_url,categories_tags';
  const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${digits}.json?fields=${fields}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Open Food Facts indisponible (${response.status}).`);
  const json = await response.json();
  const product = json.product;
  if (json.status !== 1 || !product) return null;

  const baseName = [product.product_name_fr, product.product_name, product.generic_name_fr]
    .map((s) => (s ?? '').trim()).find(Boolean);
  if (!baseName) return null;
  const brand = (product.brands ?? '').split(',')[0].trim();
  const name = brand && !baseName.toLowerCase().includes(brand.toLowerCase())
    ? `${baseName} (${brand})` : baseName;

  return {
    name,
    quantity: (product.quantity ?? '').trim(),
    // Sans catégorie utile chez Open Food Facts : celle que suggère le nom.
    category: categoryFromTags(product.categories_tags ?? []) ?? guessCategory(baseName) ?? ((product.categories_tags ?? []).length ? 'epicerie' : 'autre'),
    imageUrl: product.image_front_small_url ?? ''
  };
}
