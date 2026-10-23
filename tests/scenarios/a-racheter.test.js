// Scénario : Courses, « À racheter » — ce que le foyer achète souvent et qui n'est plus en stock ni sur la liste.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { frequentPurchases } from '../../src/services/stats/purchases.js';

test('Courses : À racheter', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(12, 0, 0, 0); return d.getTime(); };
  const CODE = 'RACHA-TERRR';
  const F = `foyers/${CODE}/`;
  let n = 0;
  const move = (type, name, ago, extra = {}) => [F + `mouvements/m${n++}`, { type, name, clientAt: daysAgo(ago), count: 1, category: 'autre', location: 'frigo', unitPrice: null, by: 'Kevin', ...extra }];

  console.log('\n— Achats fréquents —');
  const unit = frequentPurchases([
    { type: 'achat', name: 'Yaourts nature', clientAt: daysAgo(9) }, { type: 'achat', name: 'Yaourt nature', clientAt: daysAgo(2) },
    { type: 'achat', name: 'Œufs', clientAt: daysAgo(3) }, { type: 'achat', name: 'Œufs', clientAt: daysAgo(3) + 60000 },
    { type: 'consomme', name: 'Pommes', clientAt: daysAgo(1) }, { type: 'consomme', name: 'Pommes', clientAt: daysAgo(5) }]);
  log(unit.length === 1 && unit[0].name === 'Yaourt nature' && unit[0].times === 2, `« Yaourts nature » et « Yaourt nature » : le même produit, nom du dernier achat (${JSON.stringify(unit)})`);

  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    move('achat', 'Lait demi-écrémé', 40), move('achat', 'Lait demi-écrémé', 20), move('achat', 'Lait demi-écrémé', 5),
    move('achat', 'Yaourts nature', 30), move('achat', 'Yaourts nature', 10),
    move('achat', 'Beurre doux', 25), move('achat', 'Beurre doux', 4),             // encore en stock
    move('achat', 'Pâtes penne', 12),                                             // une seule fois
    move('achat', 'Café moulu', 30), move('achat', 'Café moulu', 8),               // déjà sur la liste (« Café »)
    move('achat', 'Œufs plein air', 28), move('achat', 'Œufs plein air', 14),      // « Œufs, 12 » dans le panier
    move('achat', 'Œufs', 6), move('achat', 'Œufs', 6),                            // le même jour : une fois
    move('achat', 'Jambon blanc', 130), move('achat', 'Jambon blanc', 120),        // il y a plus de 3 mois
    move('achat', 'Crème dessert chocolat', 60), move('achat', 'Crème dessert chocolat', 50), // un mot en commun avec le stock
    move('consomme', 'Pommes', 3), move('consomme', 'Pommes', 9), move('jete', 'Pommes', 15),
    [F + 'produits/beurre', { name: 'Beurre doux', expiry: '', category: 'laitier', quantity: '250 g', count: 1, location: 'frigo', dateKind: 'estimee', barcode: '', addedBy: 'Kevin', createdAt: daysAgo(4), image: '', imageUrl: '' }],
    [F + 'courses/cafe', { name: 'Café', quantity: '', checked: false, addedBy: 'Kevin', createdAt: 1 }],
    [F + 'courses/oeufs', { name: 'Œufs, 12', quantity: '', checked: true, addedBy: 'Kevin', createdAt: 2 }],
    [F + 'courses/moutarde', { name: 'Moutarde', quantity: '', checked: true, addedBy: 'Kevin', createdAt: 3 }],
    [F + 'produits/chocolat', { name: 'Chocolat noir', expiry: '', category: 'sucre', quantity: '200 g', count: 1, location: 'placard', dateKind: 'aucune', barcode: '', addedBy: 'Kevin', createdAt: daysAgo(4), image: '', imageUrl: '' }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: '', model: 'claude-sonnet-5-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('a-racheter', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, tick, text, type, w } = P;
  const chips = () => $$('.restock-chip').map((c) => c.textContent.trim());
  const shopping = () => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + 'courses/')).map(([, v]) => v);
  await tick(50);

  console.log('\n— Écran Courses —');
  await click('.tab[data-tab="courses"]', 120);
  log(text().includes('À racheter') && text().includes('souvent achetés, plus en stock'), 'Section « À racheter »');
  log(chips().join(' | ') === 'Lait demi-écrémé | Yaourts nature | Crème dessert chocolat', `Pastilles : le lait (3 fois), puis les yaourts et la crème dessert (2 fois, la plus récente d'abord) (${chips().join(' | ')})`);
  log(chips().includes('Crème dessert chocolat'), '« Chocolat noir » en stock n\'écarte pas « Crème dessert chocolat » (un seul mot en commun)');
  log($$('.restock-chip')[0].getAttribute('aria-label') === 'Ajouter Lait demi-écrémé à la liste', 'VoiceOver : « Ajouter Lait demi-écrémé à la liste »');
  await click($$('.restock-chip')[0], 60);
  log(shopping().some((i) => i.name === 'Lait demi-écrémé' && !i.checked), 'Un toucher : le lait rejoint la liste');
  log(chips().join(' | ') === 'Yaourts nature | Crème dessert chocolat', 'Sa pastille disparaît');
  await click($$('.restock-chip')[0], 60);
  await click($$('.restock-chip')[0], 60);
  log(!$$('.restock-chip').length && !text().includes('À racheter'), 'Plus rien à racheter : la section disparaît');

  console.log('\n— Un article déjà dans le panier —');
  await type('#new-item', 'Moutarde');
  $('#add-item').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick(60);
  log(shopping().filter((i) => i.name === 'Moutarde').map((i) => i.checked).sort().join() === 'false,true', 'Moutarde déjà achetée (dans le panier) : une nouvelle à acheter est ajoutée');
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');
  log(!P.errors.length, 'Aucune erreur JS');
});
