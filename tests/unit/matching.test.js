// Tests : ressemblance de noms et rapprochement ingrédient ↔ produit du stock.
import { describe, it, test, expect } from 'vitest';
import * as Services from '../../src/services/index.js';
import * as Reference from '../../src/data/reference/index.js';

const S = { ...Services, ...Reference };

const cases = [
  ['Yaourt nature', 'Yaourt nature (Danone)', true],
  ['Yaourt', 'Yaourt nature', true],
  ['Yaourt nature', 'Yaourt aux fruits', false],
  ['Crème', 'Crème dessert au chocolat', false],
  ['Crème fraîche', 'Crème fraîche épaisse', true],
  ['Courgettes', 'Courgette', true],
  ['Tomates', 'Tomates cerises', true],
  ['Poulet', 'Filet de poulet', true],
  ['Œufs', 'Oeufs frais', true],
  ['Lait', 'Lait demi-écrémé', true],
  ['Riz', 'Riz basmati', true],
  ['Gruyère râpé', 'Emmental râpé', false],
  ['Pâtes', 'Pâte à tartiner (Nutella)', false],
];

test.each(cases)('« %s » / « %s » → %s', (a, b, expected) => {
  expect(S.nameMatchScore(a, b) > 0).toBe(expected);
});

describe('resolveIngredient', () => {
  const products = [
    { id: 'new1', name: 'Yaourt nature (Danone)', barcode: '03033490004743', category: 'laitier', expiry: '2026-10-05' },
    { id: 'new2', name: 'Yaourt aux fruits', barcode: '111', category: 'laitier', expiry: '2026-10-01' }
  ];
  it('retrouve un produit racheté par son code-barres (zéros de tête ignorés)', () => {
    expect(S.resolveIngredient({ name: 'Yaourt', source: 'stock', productId: 'old', barcode: '3033490004743' }, products))
      .toEqual({ product: products[0], via: 'code-barres' });
  });
  it('retrouve un produit par son nom', () => {
    expect(S.resolveIngredient({ name: 'Yaourt nature', source: 'stock', productId: 'old' }, products)?.via).toBe('nom');
  });
  it('ignore les basiques du placard', () => {
    expect(S.resolveIngredient({ name: 'Sel', source: 'placard' }, products)).toBeNull();
  });
  it('refuse une autre famille de catégorie', () => {
    expect(S.resolveIngredient({ name: 'Yaourt nature', source: 'stock', category: 'viande' }, products)).toBeNull();
  });
});
