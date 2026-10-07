// Tests : prix (saisie, affichage), périodes et calculs des statistiques.
import { describe, it, expect } from 'vitest';
import { cleanPrice, formatEuro, lineAmount, parsePrice, priceInputValue } from '../../src/services/stats/money.js';
import { monthKey, monthLabel, periodMonths, periodStart } from '../../src/services/stats/periods.js';
import { categoryTotals, filterMovements, monthlyTotals, peopleIn, summarize, topWasted } from '../../src/services/stats/stats.js';
import { priceKeys } from '../../src/data/store/prices.js';

describe('prix', () => {
  it.each([
    ['2,49', 2.49], ['2.49', 2.49], ['2,49 €', 2.49], ['2,49€', 2.49], [' 12 ', 12], ['0', 0],
    ['1 234,50', 1234.5], ['3 euros', 3], ['', null], ['abc', null], ['2,4x', null], ['-1', null], ['2,,4', null]
  ])('« %s » → %s', (text, expected) => {
    expect(parsePrice(text)).toBe(expected);
  });

  it('arrondit au dixième de centime et refuse les valeurs absurdes', () => {
    expect(cleanPrice(2.38 / 3)).toBe(0.793);
    expect(cleanPrice(null)).toBe(null);
    expect(cleanPrice(Number.NaN)).toBe(null);
    expect(cleanPrice(-2)).toBe(null);
    expect(cleanPrice(500000)).toBe(null);
  });

  it('affiche en euros, à la française', () => {
    expect(formatEuro(2.49)).toBe('2,49 €');
    expect(formatEuro(1234.5)).toBe('1 234,50 €');
    expect(formatEuro(0)).toBe('0,00 €');
    expect(priceInputValue(0.793)).toBe('0,79');
    expect(priceInputValue(null)).toBe('');
  });

  it('montant d\'un lot = prix unitaire × nombre (arrondi au centime)', () => {
    expect(lineAmount(0.793, 3)).toBe(2.38);
    expect(lineAmount(1.19, 2)).toBe(2.38);
    expect(lineAmount(null, 4)).toBe(null);
  });
});

describe('périodes', () => {
  const now = new Date(2026, 9, 7, 15, 0); // 7 octobre 2026
  it('début de période : 1er du mois, minuit', () => {
    expect(periodStart('mois', now)).toBe(new Date(2026, 9, 1).getTime());
    expect(periodStart('3mois', now)).toBe(new Date(2026, 7, 1).getTime());
    expect(periodStart('12mois', now)).toBe(new Date(2025, 10, 1).getTime());
    expect(periodStart('tout', now)).toBe(0);
  });

  it('mois de la période (passage d\'année compris)', () => {
    expect(periodMonths('3mois', [], now)).toEqual(['2026-08', '2026-09', '2026-10']);
    expect(periodMonths('12mois', [], now)).toHaveLength(12);
    expect(periodMonths('12mois', [], now)[0]).toBe('2025-11');
    const first = { clientAt: new Date(2025, 11, 20).getTime() };
    expect(periodMonths('tout', [first], now)).toEqual(['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10']);
    expect(periodMonths('tout', [], now)).toEqual(['2026-10']);
  });

  it('clés et libellés de mois', () => {
    expect(monthKey(new Date(2026, 0, 31, 23, 59))).toBe('2026-01');
    expect(monthLabel('2026-10', { long: true })).toBe('Octobre 2026');
    expect(monthLabel('2026-10')).toBe('oct');
    expect(monthLabel('2026-02')).toBe('févr');
    expect(monthLabel('2026-10', { narrow: true })).toBe('O');
  });
});

describe('statistiques', () => {
  const at = (month, day = 10) => new Date(2026, month - 1, day).getTime();
  const m = (type, name, category, unitPrice, count = 1, extra = {}) => ({ type, name, category, unitPrice, count, location: 'frigo', by: 'Kevin', clientAt: at(10), ...extra });
  const list = [
    m('achat', 'Yaourt nature', 'laitier', 0.5, 4),
    m('achat', 'Comté', 'fromage', 4.2, 1, { by: 'Marie' }),
    m('achat', 'Salade', 'legumes', 1.1, 2, { location: 'fruits', clientAt: at(9) }),
    m('achat', 'Pain', 'boulangerie', null, 1),
    m('consomme', 'Yaourt nature', 'laitier', 0.5, 3),
    m('jete', 'Yaourt nature', 'laitier', 0.5, 1),
    m('jete', 'Salade', 'legumes', 1.1, 1, { location: 'fruits', by: 'Marie' }),
    m('jete', 'Salades', 'legumes', 1.1, 1, { location: 'fruits', clientAt: at(9) }),
    m('consomme', 'Pain', 'boulangerie', null, 1)
  ];

  it('résumé : dépensé, consommé, jeté, part jetée, mouvements sans prix', () => {
    const s = summarize(list);
    expect(s.spent).toBe(8.4); // 2 + 4,20 + 2,20 (le pain n'a pas de prix)
    expect(s.consumed).toBe(1.5);
    expect(s.wasted).toBe(2.7);
    expect(s.wasteShare).toBeCloseTo(2.7 / 4.2);
    expect(s.unpriced).toEqual({ achat: 1, consomme: 1, jete: 0 });
    expect(summarize([]).wasteShare).toBe(null);
  });

  it('filtres : rayon, catégorie, lieu, personne', () => {
    expect(filterMovements(list, { what: 'rayon:Frais' })).toHaveLength(list.length);
    expect(filterMovements(list, { what: 'cat:fromage' }).map((x) => x.name)).toEqual(['Comté']);
    expect(filterMovements(list, { location: 'fruits' })).toHaveLength(3);
    expect(filterMovements(list, { person: 'Marie' })).toHaveLength(2);
    expect(filterMovements(list, { what: 'rayon:Épicerie' })).toHaveLength(0);
  });

  it('mois par mois', () => {
    expect(monthlyTotals(list, ['2026-08', '2026-09', '2026-10'])).toEqual([
      { month: '2026-08', spent: 0, consumed: 0, wasted: 0 },
      { month: '2026-09', spent: 2.2, consumed: 0, wasted: 1.1 },
      { month: '2026-10', spent: 6.2, consumed: 1.5, wasted: 1.6 }
    ]);
  });

  it('par catégorie, de la plus grosse dépense à la plus petite', () => {
    expect(categoryTotals(list).map((r) => [r.category, r.spent, r.wasted])).toEqual([
      ['fromage', 4.2, 0], ['legumes', 2.2, 2.2], ['laitier', 2, 0.5]
    ]);
  });

  it('les plus jetés, regroupés par nom (« Salade » = « Salades »)', () => {
    expect(topWasted(list)).toEqual([
      { name: 'Salade', count: 2, amount: 2.2, priced: true },
      { name: 'Yaourt nature', count: 1, amount: 0.5, priced: true }
    ]);
  });

  it('prénoms présents', () => {
    expect(peopleIn(list)).toEqual(['Kevin', 'Marie']);
  });
});

describe('mémoire des prix', () => {
  it('clé par code-barres, puis par nom (sans accents, pluriels ni traits d\'union)', () => {
    expect(priceKeys({ name: 'Lait demi-écrémé', barcode: '3017620422003' })).toEqual(['ean:3017620422003', 'nom:demi ecreme lait']);
    expect(priceKeys({ name: 'lait DEMI ecreme' })).toEqual(['nom:demi ecreme lait']);
    expect(priceKeys({ name: 'Pommes' })).toEqual(priceKeys({ name: 'pomme' }));
    expect(priceKeys({ name: '' })).toEqual([]);
  });
});
