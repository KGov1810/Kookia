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

/** Mêmes durées en anglais, espagnol et portugais (noms saisis dans la langue de l'iPhone). */
export const OPENED_WORDS_INTL = [
  ['coconut milk', 3], ['leche de coco', 3], ['leite de coco', 3], ['condensed milk', 7], ['leche condensada', 7], ['leite condensado', 7],
  ['soy sauce', 90], ['salsa de soya', 90], ['molho de soja', 90], ['peanut butter', null], ['shredded cheese', 7], ['queso rallado', 7], ['queijo ralado', 7],
  ['milk', 4], ['leche', 4], ['leite', 4], ['cream', 4], ['crema', 4], ['nata', 4], ['yogurt', 2], ['yogur', 2], ['iogurte', 2],
  ['butter', 30], ['mantequilla', 30], ['manteiga', 30], ['juice', 4], ['jugo', 4], ['suco', 4], ['wine', 5], ['vino', 5], ['vinho', 5],
  ['beer', 1], ['cerveza', 1], ['cerveja', 1], ['jam', 30], ['mermelada', 30], ['geleia', 30], ['honey', null], ['mel', null], ['syrup', 90],
  ['salsa', 7], ['molho', 7], ['mayo', 60], ['mayonesa', 60], ['maionese', 60], ['mustard', 60], ['mostaza', 60], ['mostarda', 60],
  ['pickle', 60], ['coffee', 30], ['tuna', 2], ['atun', 2], ['atum', 2], ['ham', 3], ['jamon', 3], ['presunto', 3], ['salmon', 2], ['salmao', 2], ['hummus', 4]
];

/** Par catégorie, si aucun mot ne s'applique. */
export const OPENED_DAYS_BY_CATEGORY = {
  laitier: 4, fromage: 10, charcuterie: 3, viande: 2, volaille: 2, poisson: 1, traiteur: 2, conserves: 3,
  fruits: 3, legumes: 3, boisson: 5, condiments: 30
};

/** À ranger au frigo une fois ouvert (s'il était au placard ou avec les fruits et légumes). */
export const KEEP_COOL_CATEGORIES = ['laitier', 'fromage', 'charcuterie', 'viande', 'volaille', 'poisson', 'traiteur', 'conserves', 'fruits', 'legumes'];
export const KEEP_COOL_WORDS = 'lait crème jus nectar compote confiture sauce pesto mayonnaise moutarde cornichon vin'
  + ' milk leche leite cream crema nata juice jugo suco jam mermelada geleia salsa molho mayo mayonesa maionese mustard mostaza mostarda pickle wine vino vinho';

/** Parts restantes proposées (« Combien en reste-t-il ? »). */
export const REMAINING_CHOICES = [0.75, 0.5, 0.25];
