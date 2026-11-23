// Tests : seuls les champs modifiés d'un produit partent vers Firestore, le nombre d'unités en écart.
import { test, expect } from 'vitest';
import { productPatch } from '../../src/data/store/product-fields.js';
import { toProduct } from '../../src/data/store/mappers.js';

const doc = { name: 'Yaourts', expiry: '2026-12-01', category: 'laitier', categoryVersion: 2, quantity: '125 g', count: 4,
  location: 'frigo', dateKind: 'dlc', frozenAt: '', barcode: '', addedBy: 'Marie', createdAt: 1, image: '', imageUrl: '', unitPrice: 0.5 };
const yaourt = toProduct('y', doc);

test('Rien de changé : rien à envoyer', () => {
  expect(productPatch(yaourt, { ...yaourt })).toEqual({});
});

test('Seuls les champs modifiés, le nombre en écart', () => {
  expect(productPatch(yaourt, { ...yaourt, expiry: '2026-12-05', count: 3 }))
    .toEqual({ expiry: '2026-12-05', count: { __increment: -1 } });
  expect(productPatch(yaourt, { ...yaourt, location: 'fruits', cold: true }).cold).toBe(true);
  expect(productPatch({ ...yaourt, location: 'fruits', cold: true }, yaourt).cold).toBe(null); // sorti des fruits et légumes
});

test('Ancien format : tout est réécrit, nombre compris', () => {
  const old = toProduct('j', { name: 'Jambon', category: 'viande', location: 'frigo' });
  expect(old.legacy).toBe(true);
  const patch = productPatch(old, { ...old, name: 'Jambon blanc' });
  expect(patch).toMatchObject({ name: 'Jambon blanc', count: 1, categoryVersion: 2, dateKind: 'dlc', location: 'frigo' });
});

test('Nombre tombé à 0 (les deux iPhone ont pris la dernière unité) : plus affiché', () => {
  expect(toProduct('y', { ...doc, count: 0 })).toBe(null);
  expect(toProduct('y', { ...doc, count: -1 })).toBe(null);
  expect(yaourt.legacy).toBe(false);
});
