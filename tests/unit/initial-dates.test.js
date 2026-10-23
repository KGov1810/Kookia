// Tests : date d'un produit ajouté sans sa fiche (ticket, « Tout ranger », scan en rafale, grille des fruits et
// légumes) — une seule règle pour tous ces ajouts.
import { test, expect } from 'vitest';
import { initialDates } from '../../src/data/store/fridge-dates.js';
import { isoInDays } from '../../src/services/dates/dates.js';

test('Une règle pour tous les ajouts sans fiche', () => {
  const at = (name, category, location, extra = {}) => initialDates({ name, category, location, ...extra });
  expect(at('Steak haché', 'viande', 'frigo')).toEqual({ dateKind: 'dlc', expiry: '', frozenAt: '' });
  expect(at('Yaourt nature', 'laitier', 'frigo')).toEqual({ dateKind: 'estimee', expiry: isoInDays(14), frozenAt: '' });
  expect(at('Spaghetti', 'feculents', 'placard')).toEqual({ dateKind: 'aucune', expiry: '', frozenAt: '' });
  expect(at('Petits pois', 'surgele', 'congelateur')).toMatchObject({ dateKind: 'congele', frozenAt: isoInDays(0) });
  expect(at('Baguette', 'boulangerie', 'placard')).toEqual({ dateKind: 'estimee', expiry: isoInDays(2), frozenAt: '' });
  expect(at('Biscottes', 'boulangerie', 'placard').dateKind).toBe('aucune');
  // Fruits et légumes : estimés partout, même au placard (comme dans la grille), au frais ou non.
  expect(at('Oignons', 'legumes', 'placard').dateKind).toBe('estimee');
  expect(at('Pommes', 'fruits', 'fruits', { cold: true }).expiry).toBe(isoInDays(45));
  expect(at('Pommes', 'fruits', 'fruits', { cold: false }).expiry).toBe(isoInDays(14));
  // Nom inconnu tapé dans la grille, rangé avec les fruits et légumes : estimé lui aussi (5 jours hors du frigo).
  expect(at('Physalis', 'autre', 'fruits')).toEqual({ dateKind: 'estimee', expiry: isoInDays(5), frozenAt: '' });
});
