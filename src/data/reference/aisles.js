// Kookia — Rayons du magasin, pour ranger la liste de courses. L'ordre ci-dessous est celui d'un supermarché
// classique ; le foyer peut le changer (Réglages → Ordre des rayons). Les noms sont dans i18n/shopping.js (aisle.*).

export const AISLES = [
  { id: 'fruits_legumes', emoji: '🥕', categories: ['fruits', 'legumes', 'fruits_legumes'] },
  { id: 'boulangerie', emoji: '🥖', categories: ['boulangerie'] },
  { id: 'boucherie', emoji: '🥩', categories: ['viande', 'volaille'] },
  { id: 'poissonnerie', emoji: '🐟', categories: ['poisson'] },
  { id: 'charcuterie', emoji: '🥓', categories: ['charcuterie', 'traiteur'] },
  { id: 'cremerie', emoji: '🧀', categories: ['laitier', 'fromage', 'oeufs'] },
  { id: 'epicerie_salee', emoji: '🍝', categories: ['feculents', 'legumineuses', 'conserves', 'condiments', 'snacks', 'epicerie'] },
  { id: 'epicerie_sucree', emoji: '🍪', categories: ['patisserie', 'sucre', 'fruits_secs'] },
  { id: 'boissons', emoji: '🧃', categories: ['boisson'] },
  { id: 'surgeles', emoji: '🧊', categories: ['surgele'] },
  { id: 'autre', emoji: '🛒', categories: ['autre'] }
];

export const AISLE_IDS = AISLES.map((a) => a.id);
