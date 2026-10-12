// Tests : lecture du ticket (non alimentaire, liste de courses, prix), rapprochement local, pain.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { analyzeReceipt } from '../../src/services/claude/receipt.js';
import { matchesShoppingItem } from '../../src/services/stock/matching.js';
import { breadDays, estimatedByDefault, estimateFreshDays } from '../../src/services/stock/stock-dates.js';

describe('pain', () => {
  it.each([
    ['Baguette tradition', 2], ['Croissants', 2], ['Pains au chocolat', 2], ['Pain de campagne', 2],
    ['Pain de mie complet', 7], ['Brioche tranchée', 7], ['Wraps de blé', 7], ['Pains au lait', 7], ['Pains burger', 7],
    ['Biscottes', null], ['Pain grillé', null], ['Pain d’épices', null], ['Chapelure', null]
  ])('%s → %s', (name, days) => {
    expect(breadDays(name)).toBe(days);
  });

  it('date estimée par défaut : fruits, légumes, pain (pas les biscottes)', () => {
    expect(estimatedByDefault('boulangerie', 'Baguette')).toBe(true);
    expect(estimatedByDefault('boulangerie', 'Biscottes')).toBe(false);
    expect(estimatedByDefault('legumes', 'Tomates')).toBe(true);
    expect(estimatedByDefault('laitier', 'Lait')).toBe(false);
    expect(estimateFreshDays('Pain de mie', 'placard', 'boulangerie')).toBe(7);
  });
});

describe('liste de courses : rapprochement local (repli)', () => {
  it.each([
    ['Lait', 'Lait demi-écrémé UHT', 'laitier', true],
    ['Oeufs', 'Œufs plein air', 'oeufs', true],
    ['Glace', 'Glace Nutella en pot', 'surgele', true],
    ['Farine', 'Farine de blé', 'epicerie', true],
    ['Liquide vaisselle', 'Liquide vaisselle citron', 'autre', true],
    ['Pommes', 'Pommes de terre', 'legumes', false],
    ['Lait', 'Lait de coco', 'conserves', false],
    ['Oranges', 'Jus d\'orange', 'boisson', false],
    ['Pâtes', 'Pâte feuilletée', 'traiteur', false]
  ])('%s ↔ %s : %s', (list, name, category, expected) => {
    expect(matchesShoppingItem(list, { name, receiptText: '', category })).toBe(expected);
  });
});

describe('lecture du ticket', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('non alimentaire, article de la liste par son repère, prix en texte, réponse sans repère', async () => {
    let body = null;
    vi.stubGlobal('fetch', async (_url, opts) => {
      body = JSON.parse(opts.body);
      return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: { produits: [
        { nom: 'Glace', texte_ticket: 'GLACE', categorie: 'surgele', nombre: 1, contenance: '', lieu: 'congelateur', prix: '2,49', alimentaire: true, liste: 'L2' },
        { nom: 'Lessive', texte_ticket: 'LESSIVE', categorie: 'autre', nombre: 1, contenance: '', lieu: 'placard', prix: 7.9, alimentaire: false, liste: '' },
        { nom: 'Pain', texte_ticket: 'PAIN', categorie: 'boulangerie', nombre: 1, contenance: '', lieu: 'placard', prix: 1 }
      ] } }] }) };
    });
    const items = await analyzeReceipt({ key: 'k', model: 'm', images: ['x'], shopping: [{ id: 'a', name: 'Lait' }, { id: 'b', name: 'Glace' }] });
    expect(body.max_tokens).toBe(16000);
    expect(body.messages[0].content.at(-1).text).toContain('L1 : Lait\nL2 : Glace');
    expect(items.map((i) => [i.food, i.shoppingId, i.price])).toEqual([[true, 'b', 2.49], [false, null, 7.9], [true, undefined, 1]]);
  });
});
