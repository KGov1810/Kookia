// Kookia — Catalogue des fruits et légumes courants.

const FRUIT_NAMES = new Set(['Bananes', 'Pommes', 'Poires', 'Oranges', 'Clémentines', 'Citrons', 'Kiwis', 'Avocats',
  'Mangues', 'Ananas', 'Melon', 'Pastèque', 'Pêches', 'Fraises', 'Framboises', 'Myrtilles', 'Raisin', 'Cerises']);

/** Fruits et légumes courants : où on les range et combien de jours ils se gardent environ. */
export const PRODUCE = [
  ['Bananes', '🍌', 'fruits', 5], ['Pommes', '🍎', 'fruits', 14], ['Poires', '🍐', 'fruits', 5],
  ['Oranges', '🍊', 'fruits', 14], ['Clémentines', '🍊', 'fruits', 10], ['Citrons', '🍋', 'fruits', 21],
  ['Kiwis', '🥝', 'fruits', 7], ['Avocats', '🥑', 'fruits', 4], ['Mangues', '🥭', 'fruits', 5],
  ['Ananas', '🍍', 'fruits', 4], ['Melon', '🍈', 'fruits', 5], ['Pastèque', '🍉', 'fruits', 7],
  ['Pêches', '🍑', 'fruits', 3], ['Tomates', '🍅', 'fruits', 5], ['Pommes de terre', '🥔', 'fruits', 45],
  ['Patates douces', '🍠', 'fruits', 21], ['Oignons', '🧅', 'fruits', 60], ['Échalotes', '🧅', 'fruits', 60],
  ['Ail', '🧄', 'fruits', 90], ['Potiron', '🎃', 'fruits', 60], ['Courge butternut', '🎃', 'fruits', 60],
  ['Salade', '🥬', 'frigo', 4], ['Carottes', '🥕', 'frigo', 21], ['Courgettes', '🥒', 'frigo', 7],
  ['Concombre', '🥒', 'frigo', 7], ['Poivrons', '🫑', 'frigo', 10], ['Aubergines', '🍆', 'frigo', 7],
  ['Brocoli', '🥦', 'frigo', 5], ['Chou-fleur', '🥦', 'frigo', 7], ['Chou', '🥬', 'frigo', 30],
  ['Champignons', '🍄', 'frigo', 5], ['Haricots verts', '🫛', 'frigo', 5], ['Épinards', '🥬', 'frigo', 3],
  ['Poireaux', '🥬', 'frigo', 14], ['Céleri', '🥬', 'frigo', 14], ['Fenouil', '🌿', 'frigo', 7],
  ['Radis', '🌱', 'frigo', 7], ['Maïs', '🌽', 'frigo', 3], ['Gingembre', '🫚', 'frigo', 21],
  ['Piments', '🌶️', 'frigo', 10], ['Herbes fraîches', '🌿', 'frigo', 5], ['Fraises', '🍓', 'frigo', 3],
  ['Framboises', '🍓', 'frigo', 2], ['Myrtilles', '🫐', 'frigo', 7], ['Raisin', '🍇', 'frigo', 7],
  ['Cerises', '🍒', 'frigo', 5]
].map(([name, emoji, place, days]) => ({ name, emoji, place, days, type: FRUIT_NAMES.has(name) ? 'fruits' : 'legumes' }));
