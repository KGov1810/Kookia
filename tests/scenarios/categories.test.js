// Scénario : Catégories détaillées et proposition automatique.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test("Catégories détaillées et proposition automatique", async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const CODE = 'CATEG-ORIES';
  const P0 = `foyers/${CODE}/produits/`, R0 = `foyers/${CODE}/recettes/`;
  const prod = (name, extra) => ({ name, expiry: iso(10), quantity: '', count: 1, barcode: '', addedBy: 'Kevin', createdAt: Date.now(), image: '', imageUrl: '', ...extra });
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [P0 + 'bananes', prod('Bananes', { category: 'fruits_legumes' })],
    [P0 + 'emmental', prod('Emmental râpé', { category: 'laitier' })],
    [P0 + 'jambon', prod('Jambon blanc', { category: 'viande' })],
    [P0 + 'lentilles', prod('Lentilles vertes', { category: 'epicerie', location: 'placard', dateKind: 'aucune', expiry: '' })],
    [P0 + 'choix', prod('Pois chiches', { category: 'epicerie', categoryVersion: 2, location: 'placard', dateKind: 'aucune', expiry: '' })],
    [P0 + 'courgette', prod('Courgette', { category: 'legumes', categoryVersion: 2 })],
    [R0 + 'ancienne', { title: 'Poêlée de courgettes', summary: '', difficulty: 'facile', totalMinutes: 20, prepMinutes: 5, servings: 2, batchCooking: false, storageDays: 0, storageTips: '', createdAt: 1, favorite: false, steps: [], usedProductIds: ['partie'],
      ingredients: [{ name: 'Courgettes', quantity: '2', source: 'stock', productId: 'partie', category: 'fruits_legumes' }] }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: '', model: 'claude-haiku-4-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('categories', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, text, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const doc = (id) => globalThis.__db.docs.get(P0 + id);
  const row = (name) => $$('.product').find((r) => r.querySelector('.product-name').textContent === name);
  await tick(50);

  console.log('\n— Anciens produits reclassés —');
  const emoji = (name) => row(name).querySelector('.thumb').textContent.trim();
  log(emoji('Bananes') === '🍎' && emoji('Emmental râpé') === '🧀' && emoji('Jambon blanc') === '🥓' && emoji('Lentilles vertes') === '🫘', 'Bananes → Fruits, Emmental → Fromages, Jambon → Charcuterie, Lentilles → Légumineuses');
  log(emoji('Pois chiches') === '🫙', 'Choix fait à la main (« Épicerie ») respecté');
  await click(row('Emmental râpé').querySelector('.product-main'), 400);
  const select = () => sheet().querySelector('[name="category"]');
  log(select().value === 'fromage', 'Fiche : catégorie « Fromages »');
  log(select().querySelectorAll('optgroup').length === 4 && select().querySelectorAll('option').length === 23, 'Liste : 23 catégories en 4 rayons');
  log([...select().querySelectorAll('optgroup')].map((g) => g.label).join(' | ') === 'Frais | Épicerie | Boissons et surgelés | Autre', 'Rayons : Frais | Épicerie | Boissons et surgelés | Autre');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(doc('emmental').category === 'fromage' && doc('emmental').categoryVersion === 2, 'Enregistré avec la nouvelle catégorie');
  await type('#search', 'légumineuses');
  log($$('.product').length === 1 && row('Lentilles vertes'), 'Recherche par catégorie « légumineuses »');
  await type('#search', '');

  console.log('\n— Proposition à la saisie —');
  await click('[data-action="add-menu"]'); await click(sheet().querySelector('[data-action="manual"]'), 400);
  const nameInput = () => sheet().querySelector('[name="name"]');
  await type(nameInput(), 'Lentilles corail'); await type(nameInput(), 'Lentilles corail', 'change');
  log(select().value === 'legumineuses', '« Lentilles corail » → Légumineuses');
  log(sheet().querySelector('[data-action="set-loc"][data-value="placard"]').getAttribute('aria-pressed') === 'true' && !sheet().querySelector('[name="expiry"]'), 'Lieu proposé : Placard, sans date');
  log(sheet().querySelector('.name-row .thumb').textContent.trim() === '🫘', 'Vignette mise à jour : 🫘');
  select().value = 'conserves'; select().dispatchEvent(new w.Event('change', { bubbles: true })); await tick();
  await type(sheet().querySelector('[name="name"]'), 'Lentilles cuisinées'); await type(sheet().querySelector('[name="name"]'), 'Lentilles cuisinées', 'change');
  log(select().value === 'conserves', 'Catégorie choisie à la main : plus remplacée');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  await click('[data-action="add-menu"]'); await click(sheet().querySelector('[data-action="manual"]'), 400);
  await type(nameInput(), 'Haricots verts'); await type(nameInput(), 'Haricots verts', 'change');
  log(select().value === 'legumes' && sheet().querySelector('[data-action="set-loc"][data-value="frigo"]').getAttribute('aria-pressed') === 'true' && sheet().querySelector('[name="expiry"]').value === iso(5), '« Haricots verts » → Légumes, frigo, ≈ 5 jours');
  await type(nameInput(), 'Yaourt nature'); await type(nameInput(), 'Yaourt nature', 'change');
  log(select().value === 'laitier' && sheet().querySelector('[data-action="set-kind"][data-value="dlc"]').getAttribute('aria-pressed') === 'true' && sheet().querySelector('[name="expiry"]').value === iso(7) && sheet().textContent.includes('dans 7 jours'), '« Yaourt nature » ensuite → Produits laitiers, date limite, défaut dans 7 jours (cohérent)');
  await type(nameInput(), 'Glace vanille'); await type(nameInput(), 'Glace vanille', 'change');
  log(select().value === 'surgele' && sheet().querySelector('[data-action="set-loc"][data-value="congelateur"]').getAttribute('aria-pressed') === 'true', '« Glace vanille » → Surgelés, congélateur');
  await type(nameInput(), 'Spaghetti');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(globalThis.__db.docs.size > 0 && [...globalThis.__db.docs.entries()].filter(([k]) => !k.includes('/historique/')).map(([, v]) => v).some((d) => d.name === 'Spaghetti'), 'Le bouton « Ajouter » reste fonctionnel juste après la saisie');

  console.log('\n— Fruits et légumes, recettes —');
  await click('[data-action="add-menu"]'); await click(sheet().querySelector('[data-action="produce"]'), 400);
  const chip = (n) => [...sheet().querySelectorAll('.produce-chip')].find((c) => c.dataset.name === n);
  await click(chip('Kiwis')); await click(chip('Poireaux'));
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  const all = [...globalThis.__db.docs.entries()].filter(([k]) => !k.includes('/historique/')).map(([, v]) => v);
  log(all.find((d) => d.name === 'Kiwis')?.category === 'fruits' && all.find((d) => d.name === 'Poireaux')?.category === 'legumes', 'Grille : Kiwis → Fruits, Poireaux → Légumes');
  await click('.tab[data-tab="recettes"]');
  await click($$('.recipe-card').find((c) => c.textContent.includes('Poêlée')), 400);
  log([...sheet().querySelectorAll('.ingredient')][0].textContent.includes('(produit similaire)'), 'Ancienne recette (« Fruits et légumes ») : courgette retrouvée malgré la nouvelle catégorie');
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');

});
