// Tests : durée des fruits et légumes selon le rangement (au frigo ou non), et date qui suit le rangement.
import { test, expect } from 'vitest';
import { estimatedExpiry, estimateFreshDays, keptCold, promptStock } from '../../src/services/index.js';

test('Fruits et légumes : au frigo ou hors du frigo', () => {
  const check = (cond, msg) => expect.soft(Boolean(cond), msg).toBe(true);
  check(estimateFreshDays('Pommes', 'fruits') === 14 && estimateFreshDays('Pommes', 'frigo') === 45, 'Pommes : 14 jours hors du frigo, 45 au frigo');
  check(estimateFreshDays('Fraises', 'frigo') === 3 && estimateFreshDays('Fraises', 'fruits', '', false) === 1, 'Fraises : 3 jours au frigo, 1 hors du frigo');
  check(estimateFreshDays('Pommes de terre', 'placard') === 45, 'Placard : hors du frigo');
  // « Fruits & légumes » : le choix de la fiche, sinon l'habitude du produit.
  check(keptCold({ name: 'Carottes', location: 'fruits' }) && !keptCold({ name: 'Bananes', location: 'fruits' }), 'Habitude : carottes au frais, bananes non');
  check(keptCold({ name: 'Bananes', location: 'fruits', cold: true }) && !keptCold({ name: 'Carottes', location: 'fruits', cold: false }), 'Choix de la fiche');
  check(keptCold({ name: 'Bananes', location: 'frigo', cold: false }) && !keptCold({ name: 'Carottes', location: 'placard' }), 'Frigo toujours au frais, placard jamais');
  const added = new Date(2026, 9, 10).getTime();
  check(estimatedExpiry({ name: 'Carottes', location: 'fruits', cold: false, createdAt: added }) === '2026-10-15', 'Date estimée comptée depuis l\'ajout (carottes hors du frigo : 5 jours)');
  check(estimatedExpiry({ name: 'Carottes', location: 'fruits', createdAt: added }) === '2026-10-31', 'Carottes au frais : 21 jours');
  check(promptStock({ name: 'Bananes', location: 'fruits', dateKind: 'estimee', expiry: '2026-10-20', createdAt: added }, new Date(2026, 9, 12)).startsWith('avec les fruits et légumes (hors du frigo)'), 'Claude sait si c\'est au frais');
});

test('Catalogue : légumes et fruits de saison, chacun avec ses deux durées', async () => {
  const check = (cond, msg) => expect.soft(Boolean(cond), msg).toBe(true);
  const { produceFor, guessCategory, produceName } = await import('../../src/services/index.js');
  const { PRODUCE } = await import('../../src/data/reference/produce.js');
  // Avant : absents du catalogue, 5 jours hors du frigo et 7 au frigo quel que soit le légume.
  for (const [name, room, fridge] of [['Endives', 2, 7], ['Navets', 5, 14], ['Betteraves', 5, 14], ['Panais', 5, 21], ['Céleri-rave', 7, 21], ['Litchis', 3, 10]]) {
    check(produceFor(name)?.name === name, `${name} reconnu`);
    check(estimateFreshDays(name, 'fruits', '', false) === room && estimateFreshDays(name, 'frigo') === fridge, `${name} : ${room} jours hors du frigo, ${fridge} au frigo`);
  }
  check(produceFor('Choux de Bruxelles')?.name === 'Choux de Bruxelles' && estimateFreshDays('Choux de Bruxelles', 'frigo') === 10, 'Choux de Bruxelles : plus confondus avec le chou (30 jours)');
  check(produceFor('Chou rouge')?.name === 'Chou' && produceFor('Céleri branche')?.name === 'Céleri', 'Chou rouge et céleri branche : inchangés');
  check(produceFor('Oignons rouges')?.name === 'Oignons' && produceFor('Oignons nouveaux')?.name === 'Oignons nouveaux', 'Oignons rouges ≠ oignons nouveaux');
  check(produceFor('Potimarron')?.place === 'fruits' && estimateFreshDays('Potimarron', 'frigo') < estimateFreshDays('Potimarron', 'fruits', '', false), 'Potimarron : mieux hors du frigo');
  check(guessCategory('Mâche') === 'legumes' && guessCategory('Fruits de la passion') === 'fruits', 'Catégorie devinée d\'après le catalogue');
  check(produceName('Navets', 'en') === 'Turnips' && produceFor('Turnips')?.name === 'Navets', 'Nom traduit, reconnu dans la langue de l\'iPhone');
  const { FOODS } = await import('../../src/data/reference/i18n/foods.js');
  check(PRODUCE.every((x) => x.fridgeDays > 0 && x.roomDays > 0 && FOODS[`fv.${x.name}`]?.length === 4), 'Chaque produit a ses durées et ses traductions');
});
