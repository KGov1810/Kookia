// Tests : produits entamés (part restante, date après ouverture) et quantités utilisées par une recette.
import { describe, it, expect } from 'vitest';
import { isoInDays } from '../../src/services/dates/dates.js';
import { lineAmount } from '../../src/services/stats/money.js';
import { stockValue } from '../../src/services/stats/stock-value.js';
import { openedDays, openingChanges, remainingLabel, remainingOf, splitAfter, stockAmount, unitsAmount } from '../../src/services/stock/opened.js';
import { recipeUnits } from '../../src/services/stock/recipe-usage.js';

const today = new Date(2026, 9, 11);
const p = (name, extra) => ({ name, count: 1, remaining: 1, category: 'laitier', location: 'frigo', dateKind: 'dlc', expiry: '', ...extra });

describe('part restante', () => {
  it('quantité en stock, unités choisies à la main', () => {
    expect(remainingOf(p('Lait', { remaining: 0.5 }))).toBe(0.5);
    expect(remainingOf(p('Lait', { remaining: 0 }))).toBe(1);
    expect(stockAmount(p('Lardons', { count: 3 }))).toBe(3);
    expect(stockAmount(p('Lait', { remaining: 0.25 }))).toBe(0.25);
    expect(unitsAmount(p('Lait', { remaining: 0.5 }), 1)).toBe(0.5); // le rond finit l'unité entamée
    expect(unitsAmount(p('Lardons', { count: 3 }), 2)).toBe(2);
  });

  it.each([
    [{ count: 1 }, 0.5, { taken: 0.5, whole: 0, opened: 0.5 }],
    [{ count: 3 }, 0.25, { taken: 0.25, whole: 2, opened: 0.75 }], // l'unité ouverte est mise à part
    [{ count: 3 }, 1, { taken: 1, whole: 2, opened: null }],
    [{ count: 1, remaining: 0.5 }, 0.25, { taken: 0.25, whole: 0, opened: 0.25 }],
    [{ count: 1, remaining: 0.25 }, 0.25, { taken: 0.25, whole: 0, opened: null }],
    [{ count: 1 }, 5, { taken: 1, whole: 0, opened: null }],
    [{ count: 2 }, 0.4, { taken: 0.4, whole: 1, opened: 0.6 }]
  ])('splitAfter(%j, %s)', (extra, amount, expected) => {
    expect(splitAfter(p('X', extra), amount)).toEqual(expected);
  });

  it('libellés', () => {
    expect([0.75, 0.5, 0.25, 0.6].map(remainingLabel)).toEqual(['¾', '½', '¼', '60 %']);
  });

  it('prix d\'une part, valeur du stock', () => {
    expect(lineAmount(1.2, 0.5)).toBe(0.6);
    const v = stockValue([p('Lait', { unitPrice: 1.2, remaining: 0.5 }), p('Lardons', { unitPrice: 1.5, count: 3 })], 2, today);
    expect(v.total).toBe(5.1); // 0,60 + 4,50
  });
});

describe('après ouverture', () => {
  it('jours après ouverture : le mot du nom, sinon la catégorie', () => {
    expect(openedDays(p('Lait demi-écrémé'))).toBe(4);
    expect(openedDays(p('Lait de coco', { category: 'conserves' }))).toBe(3);
    expect(openedDays(p('Confiture de fraises', { category: 'sucre' }))).toBe(30);
    expect(openedDays(p('Comté', { category: 'fromage' }))).toBe(10);
    expect(openedDays(p('Pâtes', { category: 'feculents' }))).toBe(null);
  });

  it('lait UHT au placard : au frigo, date limite dans 4 jours', () => {
    expect(openingChanges(p('Lait UHT', { location: 'placard', dateKind: 'aucune' }), today))
      .toEqual({ location: 'frigo', expiry: isoInDays(4, today), dateKind: 'dlc' });
  });

  it('confiture : au frigo, « de préférence » dans 30 jours ; café moulu : reste au placard', () => {
    expect(openingChanges(p('Confiture', { category: 'sucre', location: 'placard', dateKind: 'aucune' }), today))
      .toEqual({ location: 'frigo', expiry: isoInDays(30, today), dateKind: 'ddm' });
    expect(openingChanges(p('Café moulu', { category: 'boisson', location: 'placard', dateKind: 'aucune' }), today))
      .toEqual({ expiry: isoInDays(30, today), dateKind: 'ddm' });
  });

  it('date jamais repoussée ; melon coupé au frigo ; rien au congélateur ni pour les pâtes', () => {
    expect(openingChanges(p('Crème', { expiry: isoInDays(2, today) }), today)).toEqual({});
    expect(openingChanges(p('Melon', { category: 'fruits', location: 'fruits', dateKind: 'estimee', expiry: isoInDays(5, today) }), today))
      .toEqual({ location: 'frigo', expiry: isoInDays(3, today) });
    expect(openingChanges(p('Petits pois', { category: 'surgele', location: 'congelateur', dateKind: 'congele' }), today)).toEqual({});
    expect(openingChanges(p('Pâtes', { category: 'feculents', location: 'placard', dateKind: 'aucune' }), today)).toEqual({});
  });
});

describe('quantité utilisée par une recette', () => {
  const ing = (quantity, amount = 0, unit = '') => ({ quantity, amount, unit });
  it.each([
    ['200 g de pâtes (paquet de 500 g)', ing('200 g', 200, 'g'), p('Pâtes', { quantity: '500 g' }), 1, 0.4],
    ['10 cl de crème (brique de 20 cl)', ing('10 cl', 10, 'cl'), p('Crème', { quantity: '20 cl' }), 1, 0.5],
    ['0,5 L de lait (brique de 1 L)', ing('0,5 L'), p('Lait', { quantity: '1 L' }), 1, 0.5],
    ['3 œufs', ing('3', 3, ''), p('Œufs', { count: 6 }), 1, 3],
    ['½ citron', ing('½ citron'), p('Citrons', { count: 4 }), 1, 0.5],
    ['portions doublées', ing('200 g', 200, 'g'), p('Pâtes', { quantity: '500 g' }), 2, 0.8],
    ['1 c. à soupe de moutarde (pot de 300 g)', ing('1 c. à soupe', 1, 'c. à soupe'), p('Moutarde', { quantity: '300 g' }), 1, 0.05]
  ])('%s', (_label, ingredient, product, factor, expected) => {
    expect(recipeUnits(ingredient, product, factor)).toBeCloseTo(expected, 5);
  });

  it('pas calculable : une unité entière (l\'appelant)', () => {
    expect(recipeUnits(ing('une pincée'), p('Sel', { quantity: '1 kg' }))).toBe(null);
    expect(recipeUnits(ing('2 tranches'), p('Jambon'))).toBe(null);
    expect(recipeUnits(ing('100 g', 100, 'g'), p('Fromage'))).toBe(null); // poids du produit inconnu
  });
});
