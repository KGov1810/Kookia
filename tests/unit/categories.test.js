// Tests : catégorie proposée d'après le nom, reclassement, Open Food Facts, lieu habituel.
import { describe, it, test, expect } from 'vitest';
import * as Services from '../../src/services/index.js';
import * as Reference from '../../src/data/reference/index.js';

const S = { ...Services, ...Reference };

const cases = {
  'Bananes': 'fruits', 'Tomates cerises': 'legumes', 'Pommes de terre': 'legumes', 'Haricots verts': 'legumes', 'Pommes': 'fruits',
  'Filet de poulet': 'volaille', 'Escalope de dinde': 'volaille', 'Jambon blanc': 'charcuterie', 'Lardons fumés': 'charcuterie', 'Pâté de campagne': 'charcuterie',
  'Steak haché': 'viande', 'Rôti de porc': 'viande', 'Saumon fumé': 'poisson', 'Thon': 'poisson', 'Crevettes': 'poisson',
  'Oeufs': 'oeufs', 'Œufs bio': 'oeufs', 'Emmental râpé': 'fromage', 'Comté': 'fromage', 'Mozzarella': 'fromage',
  'Lait demi-écrémé': 'laitier', 'Crème fraîche': 'laitier', 'Beurre doux': 'laitier', 'Yaourt nature': 'laitier',
  'Pizza margherita': 'traiteur', 'Quiche lorraine': 'traiteur', 'Soupe de légumes': 'traiteur', 'Pâte feuilletée': 'traiteur',
  'Baguette': 'boulangerie', 'Pain de mie': 'boulangerie', 'Croissants': 'boulangerie',
  'Pâtes': 'feculents', 'Spaghetti': 'feculents', 'Riz basmati': 'feculents', 'Semoule': 'feculents', 'Quinoa': 'feculents', 'Flocons d\'avoine': 'feculents',
  'Lentilles vertes': 'legumineuses', 'Pois chiches': 'legumineuses', 'Haricots rouges': 'legumineuses',
  'Conserve de maïs': 'conserves', 'Sauce tomate': 'condiments', 'Huile d\'olive': 'condiments', 'Moutarde': 'condiments', 'Sel': 'condiments', 'Curry': 'condiments',
  'Farine de blé': 'patisserie', 'Sucre en poudre': 'patisserie', 'Levure chimique': 'patisserie',
  'Confiture de fraises': 'sucre', 'Compote de pommes': 'sucre', 'Chocolat noir': 'sucre', 'Pâte à tartiner': 'sucre', 'Céréales': 'sucre',
  'Chips': 'snacks', 'Cacahuètes': 'snacks', 'Olives vertes': 'snacks',
  'Amandes': 'fruits_secs', 'Noix de cajou': 'fruits_secs', 'Raisins secs': 'fruits_secs',
  'Jus d\'orange': 'boisson', 'Eau gazeuse': 'boisson', 'Bière': 'boisson', 'Café moulu': 'boisson',
  'Glace vanille': 'surgele', 'Sorbet citron': 'surgele'
};
const norm = [['fruits_legumes', 'Bananes', 'fruits'], ['fruits_legumes', 'Courgettes', 'legumes'], ['fruits_legumes', 'Topinambour', 'legumes'],
  ['laitier', 'Emmental', 'fromage'], ['laitier', 'Oeufs frais', 'oeufs'], ['laitier', 'Yaourt', 'laitier'], ['laitier', 'Riz au lait', 'laitier'],
  ['viande', 'Jambon', 'charcuterie'], ['viande', 'Filet de poulet', 'volaille'], ['viande', 'Steak', 'viande'],
  ['epicerie', 'Pâtes', 'feculents'], ['epicerie', 'Pâte à tartiner (Nutella)', 'sucre'], ['epicerie', 'Truc', 'epicerie'], ['epicerie', 'Jambon', 'epicerie'],
  ['poisson', 'Saumon', 'poisson'], ['inconnue', 'Lentilles', 'legumineuses']];
const off = [
  [['en:plant-based-foods-and-beverages','en:plant-based-foods','en:cereals-and-potatoes','en:cereals-and-their-products','en:pastas','en:dry-pastas','en:spaghetti'], 'feculents'],
  [['en:plant-based-foods-and-beverages','en:plant-based-foods','en:legumes-and-their-products','en:legumes','en:pulses','en:lentils'], 'legumineuses'],
  [['en:breakfasts','en:spreads','en:sweet-spreads','en:hazelnut-spreads','en:cocoa-and-hazelnuts-spreads'], 'sucre'],
  [['en:dairies','en:fermented-foods','en:fermented-milk-products','en:cheeses','en:cow-cheeses','fr:emmentals'], 'fromage'],
  [['en:meats','en:poultries','en:chickens','en:chicken-breasts'], 'volaille'],
  [['en:plant-based-foods-and-beverages','en:beverages','en:plant-based-beverages','en:fruit-based-beverages','en:juices-and-nectars','en:fruit-juices','en:orange-juices'], 'boisson'],
  [['en:plant-based-foods-and-beverages','en:plant-based-foods','en:frozen-foods','en:frozen-fried-potatoes','en:french-fries'], 'surgele'],
  [['en:dairies','en:milks'], 'laitier'], [['en:spreads'], 'sucre'], [['en:potatoes','en:vegetables'], 'legumes'],
  [['en:condiments','en:sauces','en:tomato-sauces'], 'condiments'], [['en:snacks','en:salty-snacks','en:appetizers','en:chips-and-fries','en:crisps','en:potato-crisps'], 'snacks'],
  [['en:canned-foods','en:canned-vegetables','en:canned-corn'], 'conserves'], [['en:plant-based-foods'], 'epicerie'], [[], 'autre']
];

test.each(Object.entries(cases))('guessCategory(%j) → %s', (name, expected) => {
  expect(S.guessCategory(name)).toBe(expected);
});

test('nom inconnu : aucune proposition', () => {
  expect(S.guessCategory('Truc mystère')).toBeNull();
});

test.each(norm)('normalizeCategory(%s, %j) → %s', (id, name, expected) => {
  expect(S.normalizeCategory(id, name)).toBe(expected);
});

test.each(off.map(([tags, expected]) => [tags.at(-1) ?? '(aucune)', tags, expected]))('Open Food Facts : %s', (_label, tags, expected) => {
  expect(S.categoryFromTags(tags)).toBe(expected);
});

test('lieu habituel selon la catégorie', () => {
  expect(S.defaultLocationFor('feculents')).toBe('placard');
  expect(S.defaultLocationFor('surgele')).toBe('congelateur');
  expect(S.defaultLocationFor('legumes', 'Pommes de terre')).toBe('fruits');
  expect(S.defaultLocationFor('legumes', 'Carottes')).toBe('frigo');
  expect(S.defaultLocationFor('viande')).toBeNull();
});
