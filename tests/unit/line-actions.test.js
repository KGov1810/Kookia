// Lignes à vérifier (ticket, scan, « Tout ranger ») : cocher, un de moins (pas sous 1), un de plus (pas au-delà de 99).
import { test, expect } from 'vitest';
import { lineActions } from '../../src/components/line-actions.js';

test('Boutons d\'une ligne à vérifier', () => {
  const lines = [{ selected: true, count: 2 }, { selected: false, count: 99 }];
  let updates = 0;
  const a = lineActions(() => lines, () => updates++);
  const at = (index) => ({ dataset: { index: String(index) } });
  a['line-minus'](at(0));
  a['line-minus'](at(0));
  expect(lines[0].count).toBe(1);
  expect(lines[0].countTouched).toBe(true);
  a['line-plus'](at(1));
  expect(lines[1].count).toBe(99);
  a['toggle-line'](at(1));
  expect(lines[1]).toMatchObject({ selected: true, selectedTouched: true });
  a['line-plus'](at(5)); // ligne disparue : rien ne se passe
  expect(updates).toBe(4);
});
