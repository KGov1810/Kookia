// Tests : historique noté en français et en valeurs neutres, lu dans la langue de chaque iPhone ;
// barre du bas de index.html dans les mêmes langues que l'app ; prix saisis avec la virgule ou le point.
import { test, expect } from 'vitest';
import { STRINGS } from '../../src/data/reference/i18n/index.js';
import { readProjectFile } from '../helpers/files.js';
import { productDiff, productSummary } from '../../src/data/store/history.js';
import { restRich } from '../../src/data/store/opening.js';
import { priceInputValue, richFrench, richText, setLanguage } from '../../src/services/index.js';

test('Historique : français noté, chaque iPhone lit dans sa langue', () => {
  const check = (cond, msg) => expect.soft(Boolean(cond), msg).toBe(true);
  const [place] = productDiff({ location: 'frigo' }, { location: 'congelateur' });
  const [count] = productDiff({ count: 2 }, { count: 3 });
  const at = new Date(2026, 9, 20).getTime();
  const summary = productSummary({ count: 2, quantity: '500 g', location: 'placard', dateKind: 'aucune', createdAt: at - 3 * 86_400_000 });
  setLanguage('en');
  check(richFrench(place) === 'Lieu : Frigo → Congélateur' && richText(place) === 'Place: Fridge → Freezer', `EN : ${richText(place)}`);
  check(richText(count) === 'Quantity: 2 → 3', `EN : ${richText(count)}`);
  check(richText(summary, at) === '2 × 500 g, Cupboard, for 3 days' && richFrench(summary, at) === '2 × 500 g, Placard, depuis 3 jours', `EN : ${richText(summary, at)}`);
  check(richText(restRich({ whole: 2, opened: 0.5 })) === '2 left, plus ½ opened' && richFrench(restRich({ whole: 2, opened: null })) === 'il en reste 2', 'Reste : EN et FR');
  check(richText({ k: 'count.products', p: { n: 2 } }) === '2 products' && richText({ k: 'hist.recipe', p: { title: 'Gratin' } }) === 'recipe "Gratin"', 'Noms groupés et raisons');
  check(priceInputValue(2.5) === '2.50', 'Prix saisi avec le point en anglais');
  setLanguage('es');
  check(richText(place) === 'Lugar: Refrigerador → Congelador' && priceInputValue(2.5) === '2.50', `ES : ${richText(place)}`);
  setLanguage('pt');
  check(richText({ k: 'hist.freezeUndone' }) === 'congelamento desfeito' && priceInputValue(2.5) === '2,50', 'PT : détail, prix avec la virgule');
  setLanguage('fr');
  check(richText(place) === 'Lieu : Frigo → Congélateur' && priceInputValue(2.5) === '2,50' && richText('Yaourt') === 'Yaourt', 'FR inchangé ; texte tel quel gardé');
});

test('index.html : barre du bas dans les langues de l\'app avant le chargement', () => {
  const page = readProjectFile('index.html');
  const keys = ['tab.stock', 'tab.recipes', 'tab.shopping', 'tab.stats', 'nav.label', 'nav.add'];
  [['en', 1], ['es', 2], ['pt', 3]].forEach(([lang, index]) => {
    const line = new RegExp(`${lang}: \\[([^\\]]+)\\]`).exec(page.slice(page.indexOf('Barre du bas')))?.[1] ?? '';
    const labels = [...line.matchAll(/'([^']*)'/g)].map((m) => m[1]);
    expect(labels, `index.html (${lang})`).toEqual(keys.map((k) => STRINGS[k][index]));
  });
});
