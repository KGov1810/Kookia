// Tests : rayons du magasin (catégorie → rayon, ordre du foyer, liste rangée par rayon).
import { test, expect } from 'vitest';
import { AISLE_IDS, AISLES, CATEGORY_IDS } from '../../src/data/reference/index.js';
import { aisleOfCategory, groupByAisle, isDefaultAisleOrder, moveAisle, orderedAisles } from '../../src/services/index.js';

test('Chaque catégorie a son rayon, une seule fois', () => {
  const all = AISLES.flatMap((a) => a.categories);
  expect(CATEGORY_IDS.filter((id) => !all.includes(id))).toEqual([]);
  expect(new Set(all).size).toBe(all.length);
  expect(aisleOfCategory('fromage')).toBe('cremerie');
  expect(aisleOfCategory('volaille')).toBe('boucherie');
  expect(aisleOfCategory('fruits_legumes')).toBe('fruits_legumes'); // ancienne catégorie
  expect(aisleOfCategory(null)).toBe('autre');
  expect(aisleOfCategory('inconnue')).toBe('autre');
});

test('Ordre des rayons : celui du foyer, complété et nettoyé', () => {
  expect(orderedAisles(null)).toEqual(AISLE_IDS);
  const custom = orderedAisles(['cremerie', 'inconnu', 'cremerie', 'boissons']);
  expect(custom.slice(0, 2)).toEqual(['cremerie', 'boissons']);
  expect(custom).toHaveLength(AISLE_IDS.length);
  expect(new Set(custom).size).toBe(AISLE_IDS.length);
  expect(isDefaultAisleOrder(null) && isDefaultAisleOrder(AISLE_IDS) && !isDefaultAisleOrder(custom)).toBe(true);
});

test('Monter et descendre un rayon', () => {
  expect(moveAisle(null, 'boulangerie', -1).slice(0, 2)).toEqual(['boulangerie', 'fruits_legumes']);
  expect(moveAisle(null, 'fruits_legumes', 1).slice(0, 2)).toEqual(['boulangerie', 'fruits_legumes']);
  expect(moveAisle(null, 'fruits_legumes', -1)).toEqual(AISLE_IDS); // déjà en haut
  expect(moveAisle(null, 'autre', 1)).toEqual(AISLE_IDS); // déjà en bas
  expect(moveAisle(null, 'inconnu', 1)).toEqual(AISLE_IDS);
});

test('Liste rangée par rayon, dans l\'ordre choisi, sans rayon vide', () => {
  const items = [{ n: 'Lait', a: 'cremerie' }, { n: 'Pommes', a: 'fruits_legumes' }, { n: 'Beurre', a: 'cremerie' }, { n: 'X', a: 'bizarre' }];
  const groups = groupByAisle(items, (i) => i.a, ['cremerie']);
  expect(groups.map((g) => g.aisle)).toEqual(['cremerie', 'fruits_legumes', 'autre']);
  expect(groups[0].items.map((i) => i.n)).toEqual(['Lait', 'Beurre']); // ordre d'ajout gardé
  expect(groupByAisle([], (i) => i.a, null)).toEqual([]);
});
