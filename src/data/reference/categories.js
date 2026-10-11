// Kookia — Catégories d'aliments, rayons et familles.

// Kookia — services sans interface : dates, lecture de date (OCR),
// Open Food Facts, Claude, images, scanner de code-barres.

export const CATEGORY_GROUPS = ['Frais', 'Épicerie', 'Boissons et surgelés', 'Autre'];

export const CATEGORIES = [
  { id: 'fruits', label: 'Fruits', emoji: '🍎', group: 'Frais', hint: 'pommes, bananes, fraises, citrons' },
  { id: 'legumes', label: 'Légumes', emoji: '🥕', group: 'Frais', hint: 'carottes, salade, tomates, oignons, herbes fraîches' },
  { id: 'viande', label: 'Viande', emoji: '🥩', group: 'Frais', hint: 'bœuf, porc, veau, agneau, lapin, steak haché' },
  { id: 'volaille', label: 'Volaille', emoji: '🍗', group: 'Frais', hint: 'poulet, dinde, canard, magret, nuggets' },
  { id: 'charcuterie', label: 'Charcuterie', emoji: '🥓', group: 'Frais', hint: 'jambon, saucisson, lardons, saucisses, pâté' },
  { id: 'poisson', label: 'Poisson et fruits de mer', emoji: '🐟', group: 'Frais', hint: 'saumon, cabillaud, crevettes, moules, surimi' },
  { id: 'oeufs', label: 'Œufs', emoji: '🥚', group: 'Frais', hint: 'œufs' },
  { id: 'laitier', label: 'Produits laitiers', emoji: '🥛', group: 'Frais', hint: 'lait, yaourts, crème, beurre, fromage blanc, desserts lactés' },
  { id: 'fromage', label: 'Fromages', emoji: '🧀', group: 'Frais', hint: 'emmental, comté, mozzarella, chèvre' },
  { id: 'traiteur', label: 'Traiteur et plats préparés', emoji: '🍱', group: 'Frais', hint: 'pizza, quiche, plats préparés, pâte feuilletée, houmous, tofu' },
  { id: 'boulangerie', label: 'Pain et viennoiseries', emoji: '🥖', group: 'Frais', hint: 'pain, baguette, brioche, croissants, crêpes' },
  { id: 'feculents', label: 'Pâtes, riz et céréales', emoji: '🍝', group: 'Épicerie', hint: 'pâtes, riz, semoule, quinoa, flocons d\'avoine' },
  { id: 'legumineuses', label: 'Légumineuses', emoji: '🫘', group: 'Épicerie', hint: 'lentilles, pois chiches, haricots secs' },
  { id: 'conserves', label: 'Conserves', emoji: '🥫', group: 'Épicerie', hint: 'boîtes et bocaux : thon en boîte, maïs doux, tomates pelées, lait de coco' },
  { id: 'condiments', label: 'Sauces, condiments et épices', emoji: '🧂', group: 'Épicerie', hint: 'sauces, huile, vinaigre, moutarde, sel, poivre, épices, bouillon' },
  { id: 'patisserie', label: 'Farine, sucre et pâtisserie', emoji: '🧁', group: 'Épicerie', hint: 'ingrédients pour cuisiner et pâtisser : farine, sucre, levure, maïzena, chocolat pâtissier' },
  { id: 'sucre', label: 'Biscuits, chocolat et petit-déjeuner', emoji: '🍪', group: 'Épicerie', hint: 'biscuits, chocolat, confiture, miel, céréales du petit-déjeuner, pâte à tartiner' },
  { id: 'snacks', label: 'Apéritif et snacks', emoji: '🥨', group: 'Épicerie', hint: 'chips, crackers, cacahuètes, olives' },
  { id: 'fruits_secs', label: 'Fruits secs et graines', emoji: '🥜', group: 'Épicerie', hint: 'amandes, noix, noisettes, raisins secs, graines' },
  { id: 'epicerie', label: 'Épicerie (autre)', emoji: '🫙', group: 'Épicerie', hint: 'autre produit sec du placard' },
  { id: 'boisson', label: 'Boissons', emoji: '🧃', group: 'Boissons et surgelés', hint: 'eau, jus, sodas, café, thé, vin, bière, laits végétaux' },
  { id: 'surgele', label: 'Surgelés et glaces', emoji: '🧊', group: 'Boissons et surgelés', hint: 'glaces, frites, légumes et plats surgelés' },
  { id: 'autre', label: 'Autre', emoji: '🛒', group: 'Autre', hint: 'seulement si rien d\'autre ne convient' }
];

/** Anciennes catégories, remplacées par des catégories plus précises (gardées pour l'affichage). */
const LEGACY_CATEGORIES = [{ id: 'fruits_legumes', label: 'Fruits et légumes', emoji: '🥗', group: 'Frais' }];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export function category(id) {
  return CATEGORIES.find((c) => c.id === id) ?? LEGACY_CATEGORIES.find((c) => c.id === id)
    ?? CATEGORIES[CATEGORIES.length - 1];
}

/** Grandes familles, pour comparer une ancienne catégorie à une nouvelle (recettes). */
const FAMILY = {
  fruits: 'vegetal', legumes: 'vegetal', fruits_legumes: 'vegetal',
  viande: 'viande', volaille: 'viande', charcuterie: 'viande',
  laitier: 'laitier', fromage: 'laitier', oeufs: 'laitier',
  feculents: 'epicerie', legumineuses: 'epicerie', conserves: 'epicerie', condiments: 'epicerie',
  patisserie: 'epicerie', sucre: 'epicerie', snacks: 'epicerie', fruits_secs: 'epicerie', epicerie: 'epicerie'
};

export function categoryFamily(id) {
  return FAMILY[id] ?? id;
}

/** Durée conseillée au congélateur, en mois, selon la catégorie. */
export const FREEZER_MONTHS = {
  viande: 6, volaille: 9, charcuterie: 2, poisson: 4, traiteur: 3, fruits: 10, legumes: 12, fruits_legumes: 12,
  boulangerie: 3, laitier: 4, fromage: 4, oeufs: 6, feculents: 6, legumineuses: 6, conserves: 6, condiments: 6,
  patisserie: 6, sucre: 6, snacks: 6, fruits_secs: 12, surgele: 6, epicerie: 6, boisson: 6, autre: 6
};
