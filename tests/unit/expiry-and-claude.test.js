// Tests : lecture de la date de péremption, formats, génération de recettes et erreurs Claude.
import { describe, it, test, expect } from 'vitest';
import * as Services from '../../src/services/index.js';
import * as Reference from '../../src/data/reference/index.js';

const S = { ...Services, ...Reference };

const today = new Date(2026, 8, 29);
const cases = [
  [["À consommer jusqu'au 12/10/2026", 'LOT 4521'], '2026-10-12'],
  [['Emballé le 25/09/2026', "À consommer jusqu'au : 05.10.26"], '2026-10-05'],
  [['DDM : 03/2027'], '2027-03-31'],
  [['À consommer de préférence avant le', '1er mars 2027'], '2027-03-01'],
  [['EXP 15 OCT 2026'], '2026-10-15'],
  [['12 10 2026 L1234'], '2026-10-12'],
  [['Best before 2026-11-30'], '2026-11-30'],
  [['poids net 500 g', '10/10/26 14:32'], '2026-10-10'],
  [['A CONSOMMER JUSQU AU 1O/1l/26'], '2026-11-10'],
  [['DLC 31/02/2026'], null],
  [['Fabriqué le 01/09/2026', 'DLUO 01/09/2027'], '2027-09-01'],
  [['rien ici', '250 g'], null],
];

test.each(cases)('parseExpiryDate(%j) → %s', (lines, expected) => {
  expect(S.parseExpiryDate(lines, today)).toBe(expected);
});

test('dates, durées et pluriels', () => {
  expect(S.daysUntil('2026-10-01', today)).toBe(2);
  expect([S.statusOf('2026-10-01', 2, today), S.statusOf('2026-09-28', 2, today), S.statusOf('2026-10-10', 2, today)]).toEqual(['soon', 'expired', 'ok']);
  expect([S.formatMinutes(45), S.formatMinutes(75), S.formatMinutes(120)]).toEqual(['45 min', '1 h 15', '2 h']);
  expect([S.plural(1, 'jour'), S.plural(3, 'jour')]).toEqual(['1 jour', '3 jours']);
});

test('génération de recettes : références au stock et ingrédients à acheter', async () => {
  globalThis.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    expect(body.messages[0].content[0].text).toContain('[P1] Yaourt');
    expect(opts.headers['anthropic-dangerous-direct-browser-access']).toBe('true');
    const input = { recettes: [{
      titre: 'Gratin', resume: 'Bon', difficulte: 'facile', temps_total_minutes: 40, temps_preparation_minutes: 15, portions: 4,
      batch_cooking: true, conservation_jours: 3, conseils_conservation: 'Boîte', etapes: ['a', 'b'],
      ingredients: [
        { nom: 'Yaourt', quantite: '2', source: 'stock', ref_stock: '[P1]' },
        { nom: 'Courgette', quantite: '1', source: 'stock', ref_stock: '' },
        { nom: 'Crème', quantite: '20 cl', source: 'a_acheter', ref_stock: '' }
      ]
    }] };
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: 'proposer_recettes', input }] }) };
  };
  const recipes = await S.generateRecipes({
    key: 'k', model: 'm',
    priority: [{ id: 'p1', name: 'Yaourt nature', quantity: '', category: 'laitier', expiry: '2026-09-30' }],
    others: [{ id: 'p2', name: 'Courgettes', quantity: '', category: 'fruits_legumes', expiry: '2026-10-09' }],
    shopping: [{ name: 'Tomates', quantity: '1 kg', checked: false }],
    filters: { difficulty: 'facile', maxMinutes: 30, batchOnly: false }
  });
  const r = recipes[0];
  expect(r.title).toBe('Gratin');
  expect(r.usedProductIds).toEqual(['p1', 'p2']);
  expect(r.ingredients.map((i) => `${i.source}:${i.productId}`)).toEqual(['stock:p1', 'stock:p2', 'a_acheter:null']);
  expect(S.isBatchFriendly(r)).toBe(true);
  expect(S.matchesFilters(r, { difficulty: 'facile', maxMinutes: 30 })).toBe(false);
  expect(S.matchesFilters(r, { batchOnly: true })).toBe(true);
});

test('clé Claude refusée : message clair', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 401, json: async () => ({ error: { message: 'invalid x-api-key' } }) });
  await expect(S.analyzeProduct({ key: 'k', model: 'm', base64: 'x' })).rejects.toThrow('Clé API Claude refusée : vérifiez-la dans Réglages.');
});
