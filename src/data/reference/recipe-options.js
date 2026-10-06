// Kookia — Options des recettes : difficultés, régimes, temps.

export const DIFFICULTIES = [
  { id: 'facile', label: 'Facile' },
  { id: 'moyen', label: 'Moyen' },
  { id: 'difficile', label: 'Difficile' }
];

export const DIETS = [
  { id: '', label: 'Tous' },
  { id: 'vegetarien', label: 'Végétarien' },
  { id: 'vegan', label: 'Vegan' }
];

export const DIET_LABEL = { vegetarien: 'Végétarien', vegan: 'Vegan' };

export const TIME_FILTERS = [
  { max: 0, label: 'Peu importe' },
  { max: 15, label: '15 min' },
  { max: 30, label: '30 min' },
  { max: 60, label: '1 h' }
];
