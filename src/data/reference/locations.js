// Kookia — Lieux de rangement et types de date.

export const LOCATIONS = [
  { id: 'frigo', label: 'Frigo', at: 'au frigo' },
  { id: 'congelateur', label: 'Congélateur', at: 'au congélateur' },
  { id: 'placard', label: 'Placard', at: 'au placard' },
  { id: 'fruits', label: 'Fruits & légumes', at: 'avec les fruits et légumes' }
];

export function locationOf(id) {
  return LOCATIONS.find((l) => l.id === id) ?? LOCATIONS[0];
}

/**
 * Type de date d'un produit :
 * 'dlc' date limite imprimée (stricte) · 'ddm' « de préférence avant » (souple) ·
 * 'estimee' estimée par l'app (fruits et légumes) · 'congele' congelé maison (durée conseillée) ·
 * 'aucune' pas de date : l'app suit l'ancienneté (produits secs).
 */
/** Types proposés selon le lieu (le premier est celui par défaut) ; libellés : kind.* et field.* (i18n). */
export const KINDS_BY_LOCATION = {
  frigo: ['dlc', 'ddm', 'estimee'],
  congelateur: ['congele', 'ddm'],
  placard: ['aucune', 'ddm', 'estimee'], // estimée : le pain
  fruits: ['estimee']
};
