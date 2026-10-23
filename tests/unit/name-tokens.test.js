// Tests : découpage des noms en mots, mémorisé (les Courses le recalculent à chaque rafraîchissement).
// Le résultat est partagé : personne ne doit pouvoir le modifier, sinon les appels suivants seraient faussés.
import { test, expect } from 'vitest';
import { nameKey, nameTokens } from '../../src/services/text/text.js';
import { fridgeDays } from '../../src/services/stock/fridge-days.js';
import { topWasted } from '../../src/services/stats/stats.js';

test('Mots d\'un nom : même résultat à chaque appel, figé', () => {
  const first = nameTokens('Yaourt au lait entier');
  expect(first).toEqual(['yaourt', 'lait', 'entier']);
  expect(nameTokens('Yaourt au lait entier')).toBe(first); // mémorisé
  expect(Object.isFrozen(first)).toBe(true);
  expect(() => first.sort()).toThrow();
});

test('Les statistiques ne déforment plus les mots d\'un nom (cas réel : « Yaourt au lait » à 5 jours)', () => {
  const day = 86_400_000;
  topWasted([{ type: 'jete', name: 'Yaourt au lait', count: 1, unitPrice: null, clientAt: Date.now() - day }]);
  expect(fridgeDays('Yaourt au lait', 'laitier')).toBe(14);
});

test('Clé d\'un nom : mots triés, partagée par les prix, « À racheter » et les statistiques', () => {
  expect(nameKey('Lait demi-écrémé')).toBe('demi ecreme lait');
  expect(nameKey('Yaourts nature')).toBe(nameKey('nature yaourt'));
  expect(nameKey('Pâte à tartiner (Nutella)')).toBe('pate tartiner');
  expect(nameKey('A.B')).toBe('ab'); // sans mot : caractères interdits dans une clé Firestore retirés
});
