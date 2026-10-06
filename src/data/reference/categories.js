// Kookia — Catégories d'aliments, rayons et familles.

// Kookia — services sans interface : dates, lecture de date (OCR),
// Open Food Facts, Claude, images, scanner de code-barres.

export const CATEGORY_GROUPS = ['Frais', 'Épicerie', 'Boissons et surgelés', 'Autre'];

export const CATEGORIES = [
  { id: 'fruits', label: 'Fruits', emoji: '🍎', group: 'Frais' },
  { id: 'legumes', label: 'Légumes', emoji: '🥕', group: 'Frais' },
  { id: 'viande', label: 'Viande', emoji: '🥩', group: 'Frais' },
  { id: 'volaille', label: 'Volaille', emoji: '🍗', group: 'Frais' },
  { id: 'charcuterie', label: 'Charcuterie', emoji: '🥓', group: 'Frais' },
  { id: 'poisson', label: 'Poisson et fruits de mer', emoji: '🐟', group: 'Frais' },
  { id: 'oeufs', label: 'Œufs', emoji: '🥚', group: 'Frais' },
  { id: 'laitier', label: 'Produits laitiers', emoji: '🥛', group: 'Frais' },
  { id: 'fromage', label: 'Fromages', emoji: '🧀', group: 'Frais' },
  { id: 'traiteur', label: 'Traiteur et plats préparés', emoji: '🍱', group: 'Frais' },
  { id: 'boulangerie', label: 'Pain et viennoiseries', emoji: '🥖', group: 'Frais' },
  { id: 'feculents', label: 'Pâtes, riz et céréales', emoji: '🍝', group: 'Épicerie' },
  { id: 'legumineuses', label: 'Légumineuses', emoji: '🫘', group: 'Épicerie' },
  { id: 'conserves', label: 'Conserves', emoji: '🥫', group: 'Épicerie' },
  { id: 'condiments', label: 'Sauces, condiments et épices', emoji: '🧂', group: 'Épicerie' },
  { id: 'patisserie', label: 'Farine, sucre et pâtisserie', emoji: '🧁', group: 'Épicerie' },
  { id: 'sucre', label: 'Biscuits, chocolat et petit-déjeuner', emoji: '🍪', group: 'Épicerie' },
  { id: 'snacks', label: 'Apéritif et snacks', emoji: '🥨', group: 'Épicerie' },
  { id: 'fruits_secs', label: 'Fruits secs et graines', emoji: '🥜', group: 'Épicerie' },
  { id: 'epicerie', label: 'Épicerie (autre)', emoji: '🫙', group: 'Épicerie' },
  { id: 'boisson', label: 'Boissons', emoji: '🧃', group: 'Boissons et surgelés' },
  { id: 'surgele', label: 'Surgelés et glaces', emoji: '🧊', group: 'Boissons et surgelés' },
  { id: 'autre', label: 'Autre', emoji: '🛒', group: 'Autre' }
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
