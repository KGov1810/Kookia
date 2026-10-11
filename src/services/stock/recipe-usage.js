// Kookia — Part d'un produit utilisée par une recette : 200 g d'un paquet de 500 g = 0,4 unité.

import { parseAmount } from '../quantities/portions.js';
import { parseWeight } from '../quantities/weights.js';

const SPOONS = [[/^(c\.?\s*à\s*s(oupe)?\.?|cuill[eè]res?\s*à\s*soupe|cas)$/i, 15], [/^(c\.?\s*à\s*c(afé)?\.?|cuill[eè]res?\s*à\s*café|cac)$/i, 5]];
const MASS_VOLUME = [[/^(g|gr|grammes?)$/i, 'g', 1], [/^(kg|kilos?)$/i, 'g', 1000], [/^ml$/i, 'ml', 1], [/^cl$/i, 'ml', 10], [/^(l|litres?)$/i, 'ml', 1000]];

/**
 * Unités du produit utilisées par l'ingrédient (portions comprises), ou null si ce n'est pas calculable
 * (« une pincée », « 2 tranches », poids du produit inconnu) : l'appelant retire alors une unité entière.
 */
export function recipeUnits(ingredient, product, factor = 1) {
  const parsed = Number(ingredient.amount) > 0
    ? { value: Number(ingredient.amount), unit: String(ingredient.unit ?? '').trim() }
    : parseAmount(ingredient.quantity);
  if (!parsed || !(parsed.value > 0)) return null;
  const need = parsed.value * (factor || 1);
  const unit = parsed.unit.trim();
  if (!unit) return need; // « 3 » œufs : des pièces
  // « ½ citron », « 2 oignons » : l'unité est le produit lui-même.
  const word = unit.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/s$/, '');
  if (word.length >= 3 && product.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(word)) return need;
  const size = parseWeight(product.quantity); // poids ou volume d'une unité du produit
  if (!size) return null;
  const spoon = SPOONS.find(([pattern]) => pattern.test(unit));
  if (spoon) return (need * spoon[1]) / size.amount; // une cuillère ≈ 15 ou 5 g (ou ml)
  const known = MASS_VOLUME.find(([pattern]) => pattern.test(unit));
  if (!known) return null;
  return (need * known[2]) / size.amount; // g et ml confondus (densité proche de 1 : crème, lait, sauces)
}
