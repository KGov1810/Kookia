// Kookia — Après ouverture : combien de jours un produit entamé se garde, et s'il doit aller au frais.
// Durées indicatives (au réfrigérateur, emballage refermé) ; la date reste modifiable dans la fiche.

/** Mots du nom (les expressions d'abord) → jours après ouverture ; null : pas de date à raccourcir. */
export const OPENED_WORDS = [
  ['lait de coco', 3], ['lait concentré', 7], ['crème de marrons', 7], ['pâte à tartiner', null], ['sauce soja', 90], ['fromage râpé', 7],
  ['lait', 4], ['crème', 4], ['yaourt', 2], ['beurre', 30], ['jus', 4], ['nectar', 4], ['smoothie', 2], ['vin', 5], ['cidre', 3],
  ['bière', 1], ['soda', 3], ['compote', 7], ['confiture', 30], ['miel', null], ['sirop', 90], ['sauce', 7], ['pesto', 5],
  ['mayonnaise', 60], ['ketchup', 60], ['moutarde', 60], ['cornichon', 60], ['olive', 14], ['café', 30], ['thon', 2],
  ['jambon', 3], ['lardon', 3], ['saumon', 2], ['tofu', 4], ['houmous', 4], ['mozzarella', 2]
];

/** Par catégorie, si aucun mot ne s'applique. */
export const OPENED_DAYS_BY_CATEGORY = {
  laitier: 4, fromage: 10, charcuterie: 3, viande: 2, volaille: 2, poisson: 1, traiteur: 2, conserves: 3,
  fruits: 3, legumes: 3, boisson: 5, condiments: 30
};

/** À ranger au frigo une fois ouvert (s'il était au placard ou avec les fruits et légumes). */
export const KEEP_COOL_CATEGORIES = ['laitier', 'fromage', 'charcuterie', 'viande', 'volaille', 'poisson', 'traiteur', 'conserves', 'fruits', 'legumes'];
export const KEEP_COOL_WORDS = 'lait crème jus nectar compote confiture sauce pesto mayonnaise moutarde cornichon vin';

/** Parts restantes proposées (« Combien en reste-t-il ? »). */
export const REMAINING_CHOICES = [0.75, 0.5, 0.25];
