// Tests : quantités recalculées selon le nombre de portions, filtres régime et léger.
import { describe, it, test, expect } from 'vitest';
import * as Services from '../../src/services/index.js';
import * as Reference from '../../src/data/reference/index.js';

const S = { ...Services, ...Reference };

const cases = [
  [{ quantity: '250 g' }, 2, '500 g'], [{ quantity: '250 g' }, 1.5, '380 g'], [{ quantity: '1/2 oignon' }, 2, '1 oignon'],
  [{ quantity: '1/2 oignon' }, 3, '1 ½ oignon'], [{ quantity: '2 pots' }, 1.5, '3 pots'], [{ quantity: 'une pincée' }, 3, 'une pincée'],
  [{ quantity: '20 cl' }, 0.5, '10 cl'], [{ quantity: '1,5 L' }, 2, '3 L'], [{ quantity: '3' }, 2 / 3, '2'],
  [{ quantity: '1 ½ c. à soupe' }, 2, '3 c. à soupe'], [{ quantity: '2 œufs', amount: 2, unit: '' }, 2.5, '5'],
  [{ quantity: '300 g', amount: 300, unit: 'g' }, 4 / 3, '400 g'], [{ quantity: '0,5 kg' }, 3, '1,5 kg'],
  [{ quantity: 'selon le goût' }, 2, 'selon le goût'], [{ quantity: '250 g' }, 1, '250 g'], [{ quantity: '1 gousse d\'ail' }, 0.5, '½ gousse d\'ail']
];

test.each(cases)('scaleIngredient(%j, %f) → %j', (ingredient, factor, expected) => {
  expect(S.scaleIngredient(ingredient, factor)).toBe(expected);
});

test('date à compléter', () => {
  expect(S.statusOf('', 2)).toBe('pending');
  expect(S.expiryLabel('')).toBe('Date à compléter');
  expect(S.hasDate('')).toBe(false);
  expect(S.hasDate('2026-10-01')).toBe(true);
});

test('filtres régime et léger', () => {
  const recipe = { difficulty: 'facile', totalMinutes: 20, diet: 'vegetarien', kcal: 420, batchCooking: false, storageDays: 0 };
  expect(S.matchesFilters(recipe, { diet: 'vegetarien' })).toBe(true);
  expect(S.matchesFilters(recipe, { diet: 'vegan' })).toBe(false);
  expect(S.matchesFilters(recipe, { light: true, lightMax: 500 })).toBe(true);
  expect(S.matchesFilters(recipe, { light: true, lightMax: 400 })).toBe(false);
  expect(S.matchesFilters({ ...recipe, diet: undefined }, { diet: 'vegetarien' }), 'recette ancienne sans régime').toBe(false);
});
