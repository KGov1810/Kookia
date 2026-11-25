// Kookia — Catalogue des fruits et légumes courants.

const FRUIT_NAMES = new Set(['Bananes', 'Pommes', 'Poires', 'Oranges', 'Clémentines', 'Citrons', 'Kiwis', 'Avocats',
  'Mangues', 'Ananas', 'Melon', 'Pastèque', 'Pêches', 'Fraises', 'Framboises', 'Myrtilles', 'Raisin', 'Cerises',
  'Prunes', 'Abricots', 'Nectarines', 'Pamplemousse', 'Kakis', 'Figues', 'Grenade', 'Litchis', 'Fruits de la passion']);

/**
 * Fruits et légumes courants : où on les range d'habitude, et combien de jours ils se gardent environ
 * hors du frigo (à température ambiante) et au frigo. Repères prudents : la date reste modifiable.
 */
export const PRODUCE = [
  // nom, emoji, rangement habituel, jours hors du frigo, jours au frigo
  ['Bananes', '🍌', 'fruits', 5, 7], ['Pommes', '🍎', 'fruits', 14, 45], ['Poires', '🍐', 'fruits', 5, 10],
  ['Oranges', '🍊', 'fruits', 14, 30], ['Clémentines', '🍊', 'fruits', 10, 21], ['Citrons', '🍋', 'fruits', 21, 30],
  ['Kiwis', '🥝', 'fruits', 7, 28], ['Avocats', '🥑', 'fruits', 4, 7], ['Mangues', '🥭', 'fruits', 5, 7],
  ['Ananas', '🍍', 'fruits', 4, 6], ['Melon', '🍈', 'fruits', 5, 7], ['Pastèque', '🍉', 'fruits', 7, 14],
  ['Pêches', '🍑', 'fruits', 3, 5], ['Prunes', '🍑', 'fruits', 3, 7], ['Abricots', '🍑', 'fruits', 3, 7],
  ['Nectarines', '🍑', 'fruits', 3, 5], ['Pamplemousse', '🍊', 'fruits', 14, 30], ['Kakis', '🍅', 'fruits', 5, 10],
  ['Grenade', '🍎', 'fruits', 14, 30], ['Fruits de la passion', '🟣', 'fruits', 7, 14], ['Tomates', '🍅', 'fruits', 5, 10], ['Pommes de terre', '🥔', 'fruits', 45, 30],
  ['Patates douces', '🍠', 'fruits', 21, 14], ['Oignons', '🧅', 'fruits', 60, 60], ['Échalotes', '🧅', 'fruits', 60, 60],
  ['Ail', '🧄', 'fruits', 90, 60], ['Potiron', '🎃', 'fruits', 60, 30], ['Courge butternut', '🎃', 'fruits', 60, 30],
  ['Potimarron', '🎃', 'fruits', 60, 30],
  ['Salade', '🥬', 'frigo', 1, 4], ['Carottes', '🥕', 'frigo', 5, 21], ['Courgettes', '🥒', 'frigo', 3, 7],
  ['Concombre', '🥒', 'frigo', 3, 7], ['Poivrons', '🫑', 'frigo', 4, 10], ['Aubergines', '🍆', 'frigo', 3, 7],
  ['Brocoli', '🥦', 'frigo', 1, 5], ['Chou-fleur', '🥦', 'frigo', 2, 7], ['Chou', '🥬', 'frigo', 5, 30],
  ['Champignons', '🍄', 'frigo', 1, 5], ['Haricots verts', '🫛', 'frigo', 1, 5], ['Épinards', '🥬', 'frigo', 1, 3],
  ['Poireaux', '🥬', 'frigo', 3, 14], ['Céleri', '🥬', 'frigo', 2, 14], ['Fenouil', '🌿', 'frigo', 3, 7],
  ['Radis', '🌱', 'frigo', 2, 7], ['Maïs', '🌽', 'frigo', 1, 3], ['Gingembre', '🫚', 'frigo', 14, 21],
  ['Endives', '🥬', 'frigo', 2, 7], ['Navets', '🥔', 'frigo', 5, 14], ['Betteraves', '🍠', 'frigo', 5, 14],
  ['Panais', '🥕', 'frigo', 5, 21], ['Céleri-rave', '🥔', 'frigo', 7, 21], ['Topinambours', '🥔', 'frigo', 3, 14],
  ['Choux de Bruxelles', '🥬', 'frigo', 2, 10], ['Blettes', '🥬', 'frigo', 1, 5], ['Mâche', '🥬', 'frigo', 1, 4],
  ['Roquette', '🥬', 'frigo', 1, 4], ['Asperges', '🌱', 'frigo', 1, 4], ['Artichauts', '🌿', 'frigo', 2, 7],
  ['Pois gourmands', '🫛', 'frigo', 1, 5], ['Oignons nouveaux', '🧅', 'frigo', 2, 7],
  ['Piments', '🌶️', 'frigo', 4, 10], ['Herbes fraîches', '🌿', 'frigo', 2, 5], ['Persil', '🌿', 'frigo', 1, 7],
  ['Coriandre', '🌿', 'frigo', 1, 5], ['Fraises', '🍓', 'frigo', 1, 3],
  ['Framboises', '🍓', 'frigo', 1, 2], ['Myrtilles', '🫐', 'frigo', 2, 7], ['Raisin', '🍇', 'frigo', 3, 7],
  ['Cerises', '🍒', 'frigo', 2, 5], ['Figues', '🟣', 'frigo', 1, 3], ['Litchis', '🍒', 'frigo', 3, 10]
].map(([name, emoji, place, roomDays, fridgeDays]) => ({
  name, emoji, place, roomDays, fridgeDays,
  days: place === 'frigo' ? fridgeDays : roomDays, // à son rangement habituel
  type: FRUIT_NAMES.has(name) ? 'fruits' : 'legumes'
}));

/** Fruit ou légume d'un nom inconnu : jours estimés hors du frigo et au frigo. */
export const UNKNOWN_PRODUCE_DAYS = { room: 5, fridge: 7 };
