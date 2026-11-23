// Tests : « Consommé » (tout) noté autrefois comme un retrait du stock s'affiche comme une consommation.
import { test, expect } from 'vitest';
import { historySentence, shownAction } from '../../src/views/history/history-format.js';

test('Ancienne entrée « a retiré … — tout consommé » : affichée « a consommé »', () => {
  const rich = { scope: 'stock', action: 'suppression', name: 'Boeuf', by: 'Kevin', details: ['tout consommé'], rich: [{ k: 'hist.allConsumed' }] };
  const french = { scope: 'stock', action: 'suppression', name: 'Boeuf', by: 'Kevin', details: ['tout consommé', '700 g'] };
  expect(shownAction(rich)).toBe('consommation');
  expect(shownAction(french)).toBe('consommation');
  expect(String(historySentence(rich))).toContain('a consommé');
});

test('Vrai retrait, autre écran ou autre action : inchangé', () => {
  expect(shownAction({ scope: 'courses', action: 'suppression', details: [] })).toBe('suppression');
  expect(shownAction({ scope: 'stock', action: 'suppression', details: ['200 g'] })).toBe('suppression');
  expect(shownAction({ scope: 'stock', action: 'jete', details: ['tout consommé'] })).toBe('jete');
});
