// Kookia — Catégorie et lieu proposés d'après le nom d'un produit.

import { CATEGORY_IDS, categoryFamily } from '../../data/reference/categories.js';
import { PRODUCE } from '../../data/reference/produce.js';
import { nameMatchScore, nameTokens } from '../text/text.js';

/** Fruit ou légume du catalogue correspondant à un nom (« tomates cerises » → Tomates). */
export function produceFor(name) {
  let best = null;
  let bestScore = 0;
  for (const item of PRODUCE) {
    const score = nameMatchScore(name, item.name);
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

// Mots-clés (sans accents, au singulier) par catégorie. Ordre de test important :
// d'abord le type de produit (« jus », « confiture », « sauce »…), puis l'aliment de base.
const TYPE_KEYWORDS = [
  ['boisson', ['jus', 'sirop', 'soda', 'eau', 'biere', 'vin', 'cafe', 'smoothie', 'tisane', 'infusion', 'cidre', 'limonade', 'cola', 'champagne', 'boisson']],
  ['surgele', ['glace', 'sorbet', 'surgele', 'esquimau']],
  ['sucre', ['confiture', 'compote', 'chocolat', 'biscuit', 'gateau', 'miel', 'cereale', 'pate-a-tartiner', 'nutella', 'bonbon', 'cookie', 'madeleine', 'muesli', 'granola']],
  ['traiteur', ['pizza', 'quiche', 'lasagne', 'gratin', 'taboule', 'sandwich', 'sushi', 'nem', 'samoussa', 'soupe', 'veloute', 'feuilletee', 'brisee', 'sablee', 'hachis']],
  ['condiments', ['sauce', 'huile', 'vinaigre', 'moutarde', 'ketchup', 'mayonnaise', 'pesto', 'bouillon', 'epice', 'harissa', 'cornichon', 'sel', 'poivre', 'curry', 'paprika', 'cumin', 'cannelle', 'soja', 'tabasco', 'capre']],
  ['snacks', ['chip', 'cracker', 'bretzel', 'popcorn', 'cacahuete', 'olive', 'apericube']],
  ['conserves', ['conserve', 'boite']],
  ['patisserie', ['farine', 'sucre', 'levure', 'maizena', 'fecule', 'cacao', 'vanille', 'gelatine', 'amidon']],
  ['boulangerie', ['pain', 'baguette', 'brioche', 'croissant', 'viennoiserie', 'biscotte', 'tortilla', 'wrap', 'bagel']]
];

const FOOD_KEYWORDS = [
  ['volaille', ['poulet', 'dinde', 'canard', 'pintade', 'volaille', 'caille', 'chapon']],
  ['charcuterie', ['jambon', 'saucisson', 'lardon', 'chorizo', 'bacon', 'rillette', 'salami', 'coppa', 'pancetta', 'mortadelle', 'saucisse', 'merguez', 'boudin', 'terrine', 'campagne', 'foie']],
  ['poisson', ['poisson', 'saumon', 'thon', 'cabillaud', 'colin', 'sardine', 'maquereau', 'truite', 'crevette', 'moule', 'crabe', 'surimi', 'merlu', 'dorade', 'calamar', 'huitre']],
  ['viande', ['boeuf', 'veau', 'porc', 'agneau', 'steak', 'bavette', 'entrecote', 'roti', 'escalope', 'viande', 'hache', 'cotelette']],
  ['oeufs', ['oeuf']],
  ['fromage', ['fromage', 'emmental', 'comte', 'camembert', 'brie', 'mozzarella', 'parmesan', 'chevre', 'roquefort', 'raclette', 'feta', 'gruyere', 'cheddar', 'ricotta', 'mascarpone', 'reblochon', 'gorgonzola', 'tomme', 'mimolette', 'burrata', 'halloumi']],
  ['laitier', ['lait', 'yaourt', 'yogourt', 'creme', 'beurre', 'skyr', 'kefir', 'faisselle']]
];

const STARCH_KEYWORDS = [
  ['feculents', ['pate', 'riz', 'semoule', 'quinoa', 'couscous', 'boulgour', 'nouille', 'spaghetti', 'tagliatelle', 'penne', 'macaroni', 'coquillette', 'farfalle', 'fusilli', 'polenta', 'vermicelle', 'gnocchi', 'flocon', 'avoine']],
  ['legumineuses', ['lentille', 'chiche', 'flageolet', 'feve', 'haricot']]
];

const NUT_KEYWORDS = ['noix', 'amande', 'noisette', 'pistache', 'cajou', 'datte', 'pruneau', 'graine', 'sesame', 'tournesol', 'chia'];

function keywordMatch(tokens, table) {
  for (const [id, words] of table) {
    if (words.some((w) => tokens.includes(w))) return id;
  }
  return null;
}

/** Catégorie proposée d'après le nom (« Lentilles » → légumineuses), ou null si rien de sûr. */
export function guessCategory(name) {
  const tokens = nameTokens(name);
  if (!tokens.length) return null;
  const dried = tokens.some((t) => ['sec', 'seche', 'deshydrate'].includes(t));
  if (NUT_KEYWORDS.some((w) => tokens.includes(w)) || (dried && produceFor(name))) return 'fruits_secs';
  return keywordMatch(tokens, TYPE_KEYWORDS)
    ?? keywordMatch(tokens, FOOD_KEYWORDS)
    ?? produceFor(name)?.type
    ?? keywordMatch(tokens, STARCH_KEYWORDS);
}

/**
 * Reclasse un produit enregistré avec une ancienne catégorie trop large
 * (« Fruits et légumes », « Produits laitiers et œufs », « Viande et charcuterie », « Épicerie »).
 */
export function normalizeCategory(id, name) {
  const guess = guessCategory(name);
  const sameFamily = guess && categoryFamily(guess) === categoryFamily(id);
  switch (id) {
    case 'fruits_legumes': return sameFamily ? guess : 'legumes';
    case 'laitier': case 'viande': case 'epicerie': return sameFamily ? guess : id;
    default: return CATEGORY_IDS.includes(id) ? id : (guess ?? 'autre');
  }
}

/** Lieu habituel selon la catégorie (null = garder le lieu choisi). */
export function defaultLocationFor(categoryId, name = '') {
  if (categoryId === 'surgele') return 'congelateur';
  if (categoryFamily(categoryId) === 'epicerie' || categoryId === 'boisson') return 'placard';
  if (categoryId === 'fruits' || categoryId === 'legumes') return produceFor(name)?.place ?? (categoryId === 'fruits' ? 'fruits' : 'frigo');
  return null;
}
