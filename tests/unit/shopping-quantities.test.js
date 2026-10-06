// Tests : quantité numérique des courses (le poids rejoint le nom de l'article).
import { describe, it, test, expect } from 'vitest';
import * as Services from '../../src/services/index.js';
import * as Reference from '../../src/data/reference/index.js';

const S = { ...Services, ...Reference };

const cases = [
  [S.sanitizeCount('2 kg'), '2'], [S.sanitizeCount('abc'), ''], [S.sanitizeCount('0'), ''], [S.sanitizeCount('12a3'), '123'], [S.sanitizeCount('1234'), '123'],
  [S.toShoppingEntry('Pâtes', '400 g'), { name: 'Pâtes (400 g)', quantity: '' }],
  [S.toShoppingEntry('Farine', '2 × 1 kg'), { name: 'Farine (1 kg)', quantity: '2' }],
  [S.toShoppingEntry('Œufs', '3'), { name: 'Œufs', quantity: '3' }],
  [S.toShoppingEntry('Courgettes', '1 ½'), { name: 'Courgettes', quantity: '2' }],
  [S.toShoppingEntry('Pâtes', ''), { name: 'Pâtes', quantity: '' }],
  [S.toShoppingEntry('Yaourts', '4 pots'), { name: 'Yaourts', quantity: '4' }],
  [S.fromShoppingEntry({ name: 'Farine (1 kg)', quantity: '2' }), { name: 'Farine', quantity: '1 kg', count: 2 }],
  [S.fromShoppingEntry({ name: 'Riz 500 g', quantity: '' }), { name: 'Riz', quantity: '500 g', count: 1 }],
  [S.fromShoppingEntry({ name: 'Farine', quantity: '2 paquets de 1 kg' }), { name: 'Farine', quantity: '1 kg', count: 2 }],
  [S.fromShoppingEntry({ name: 'Concombre', quantity: '2' }), { name: 'Concombre', quantity: '', count: 2 }],
  [S.splitItemName('Tomates cerises (250 g)'), { base: 'Tomates cerises', size: '250 g' }],
  [S.splitItemName('Papiers'), { base: 'Papiers', size: '' }]
];

test.each(cases.map(([got, expected], index) => [index, got, expected]))('cas %i', (_index, got, expected) => {
  expect(got).toEqual(expected);
});
