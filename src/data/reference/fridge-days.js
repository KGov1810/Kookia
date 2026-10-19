// Kookia — Produits du frigo : date estimée en attendant celle de l'emballage (durées prudentes, en jours depuis l'achat).
// La viande, la volaille, le poisson, la charcuterie et les plats traiteur n'en ont pas : leur date reste à compléter.

export const MANUAL_DATE_CATEGORIES = ['viande', 'volaille', 'poisson', 'charcuterie', 'traiteur'];

/** Sans mot reconnu ni catégorie connue. */
export const FRIDGE_DEFAULT_DAYS = 5;

/**
 * Mots du nom (français, anglais, espagnol, portugais ; sans accents, au singulier). Le premier mot reconnu compte :
 * « Yaourt au lait entier » est un yaourt (14 j), « Riz au lait » reste à 5 jours.
 */
export const FRIDGE_WORDS = [
  [30, 'beurre butter mantequilla manteiga margarine margarina'],
  [21, 'oeuf egg huevo ovo'],
  [14, 'yaourt yogourt yogurt yoghurt yogur iogurte skyr kefir faisselle suisse fromage cheese queso queijo'],
  [10, 'creme cream crema nata natilla dessert postre sobremesa flan mousse pudding liegeoi panna'],
  [5, 'lait milk leche leite']
];

/** Selon la catégorie, quand aucun mot du nom n'est reconnu. */
export const FRIDGE_CATEGORY_DAYS = { oeufs: 21, fromage: 14 };
