// Tests : nombre d'unités et poids (« 2 sachets de 2 kg »).
import { describe, it, test, expect } from 'vitest';
import * as Services from '../../src/services/index.js';
import * as Reference from '../../src/data/reference/index.js';

const S = { ...Services, ...Reference };

const cases = [
  ['2 sachets de 2 kg', 2, '2 kg'], ['4 x 125 g', 4, '125 g'], ['2x500g', 2, '500g'], ['3', 3, ''],
  ['2 kg', 1, '2 kg'], ['500 g', 1, '500 g'], ['6 bouteilles d\'1,5 L', 6, '1,5 L'], ['4 pots', 4, ''],
  ['1 L', 1, '1 L'], ['', 1, ''], ['2 × 2 kg', 2, '2 kg']
];

test.each(cases)('splitCount(%j) → %i × %j', (text, count, quantity) => {
  expect(S.splitCount(text)).toEqual({ count, quantity });
});

test('quantityLabel', () => {
  expect(S.quantityLabel({ count: 2, quantity: '2 kg' })).toBe('2 × 2 kg');
  expect(S.quantityLabel({ count: 3, quantity: '' })).toBe('3 unités');
  expect(S.quantityLabel({ quantity: '500 g' })).toBe('500 g');
  expect(S.quantityLabel({ count: 1, quantity: '' })).toBe('');
});
