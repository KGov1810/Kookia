// Tests : Stock et fiche produit traduits (états, compteurs, lieux, catégories, fruits et légumes) ; Claude reste en français.
import { test, expect } from 'vitest';
import {
  categoryName, durationText, placeAt, placeName, produceName, promptStock, quantityLabel, setLanguage,
  stockCounter, stockLabel, stockShort
} from '../../src/services/index.js';

const today = new Date(2026, 9, 20);
const iso = (days) => {
  const d = new Date(2026, 9, 20 + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const yaourt = { name: 'Yaourt', category: 'laitier', location: 'frigo', dateKind: 'dlc', expiry: iso(1), count: 3 };
const riz = { name: 'Riz', category: 'feculents', location: 'placard', dateKind: 'aucune', expiry: '', createdAt: today.getTime() - 9 * 86_400_000 };
const pates = { name: 'Pâtes', category: 'feculents', location: 'placard', dateKind: 'ddm', expiry: iso(-3) };

test('Stock en anglais, espagnol et portugais', () => {
  const check = (cond, msg) => expect.soft(Boolean(cond), msg).toBe(true);
  setLanguage('en');
  check(stockLabel(yaourt, today) === 'Expires tomorrow', `EN : ${stockLabel(yaourt, today)}`);
  check(stockLabel(riz, today) === 'In the cupboard for 9 days', `EN : ${stockLabel(riz, today)}`);
  check(stockShort(riz, today) === 'for 9 days' && stockCounter(riz, 2, today).label === 'days here', 'EN : « for 9 days », « days here »');
  check(stockCounter(pates, 2, today).label === 'days ago' && stockCounter(pates, 2, today).unit === 'past', 'EN : « days ago »');
  check(quantityLabel({ count: 3, quantity: '' }) === '3 units' && placeName('congelateur') === 'Freezer' && placeAt('frigo') === 'in the fridge', 'EN : unités, lieux');
  check(categoryName('laitier') === 'Dairy' && produceName('Pommes de terre') === 'Potatoes' && produceName('Kumquat') === 'Kumquat', 'EN : catégorie, fruits et légumes (nom inconnu gardé)');
  check(promptStock(riz, today) === 'au placard depuis 9 jours (pas de date)', `Claude reste en français : ${promptStock(riz, today)}`);
  setLanguage('es');
  check(stockLabel(yaourt, today) === 'Vence mañana' && durationText(90) === '3 meses' && placeName('frigo') === 'Refrigerador', `ES : ${stockLabel(yaourt, today)}, ${durationText(90)}`);
  setLanguage('pt');
  check(stockLabel(riz, today) === 'No armário há 9 dias' && categoryName('fromage') === 'Queijos' && produceName('Ananas') === 'Abacaxi', `PT : ${stockLabel(riz, today)}`);
  setLanguage('fr');
  check(stockLabel(riz, today) === 'Au placard depuis 9 jours' && stockCounter(riz, 2, today).label === 'jours ici' && durationText(1) === '1 jour', 'FR inchangé');
});
