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
export const DATE_KINDS = {
  dlc: { label: 'Jusqu\'au (DLC)', field: 'À consommer jusqu\'au' },
  ddm: { label: 'De préférence (DDM)', field: 'De préférence avant le' },
  estimee: { label: 'Estimée', field: 'Se garde jusqu\'au (estimé)' },
  congele: { label: 'Congelé maison', field: 'Congelé le' },
  aucune: { label: 'Sans date', field: '' }
};

/** Types proposés selon le lieu (le premier est celui par défaut). */
export const KINDS_BY_LOCATION = {
  frigo: ['dlc', 'ddm', 'estimee'],
  congelateur: ['congele', 'ddm'],
  placard: ['aucune', 'ddm'],
  fruits: ['estimee']
};
