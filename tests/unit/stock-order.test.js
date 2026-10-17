// Tests : ordre des produits du stock (le plus urgent d'abord, les produits sans date à la fin).
import { test, expect } from 'vitest';
import { sortedProducts } from '../../src/data/store/selectors.js';
import { state } from '../../src/data/store/state.js';

test('Ordre du stock : date la plus proche d\'abord, puis sans date (les plus anciens d\'abord)', () => {
  const check = (cond, msg) => expect.soft(Boolean(cond), msg).toBe(true);
  const day = 86400000;
  const p = (name, extra) => ({ name, expiry: '', dateKind: 'dlc', createdAt: Date.now(), location: 'frigo', ...extra });
  state.products = [
    p('Curcuma', { dateKind: 'aucune', createdAt: Date.now() - 13 * day }),
    p('Basilic', { dateKind: 'aucune', createdAt: Date.now() - 13 * day }),
    p('Farine', { dateKind: 'aucune', createdAt: Date.now() - 7 * day }),
    p('Riz', { dateKind: 'aucune', createdAt: Date.now() - 240 * day }),
    p('Comté', { expiry: '2026-11-20' }),
    p('Yaourt', { expiry: '2026-10-18' }),
    p('Steak', { expiry: '2026-10-10' })
  ];
  const names = sortedProducts().map((x) => x.name);
  check(names.join(', ') === 'Steak, Yaourt, Comté, Riz, Basilic, Curcuma, Farine', `Ordre : ${names.join(', ')}`);
  state.products = [];
});
