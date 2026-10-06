// Scénario : Nombre d'unités et quantités des courses.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test("Nombre d'unités et quantités des courses", async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const CODE = 'QWERT-YUPAS';
  const P0 = `foyers/${CODE}/produits/`, C0 = `foyers/${CODE}/courses/`;
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Marie' }],
    // Ancien produit enregistré avant l'ajout du « nombre » : doit valoir 1
    [P0 + 'ancien', { name: 'Beurre doux', expiry: iso(10), category: 'laitier', quantity: '250 g', barcode: '', addedBy: 'Marie', createdAt: 1, image: '', imageUrl: '' }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Paul', alertDays: 2, claudeKey: '', model: 'claude-sonnet-5-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('qty', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, text, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const docs = (prefix) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(prefix)).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  await tick(50);

  console.log('\n— Nombre d\'unités au frigo —');
  log(text().includes('Beurre doux') && !$('.thumb .count'), 'Ancien produit : 1 unité, sans pastille');
  // Scan : 2 sachets de 2 kg de pommes de terre
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ status: 1, product: { product_name_fr: 'Pommes de terre de consommation', brands: 'Carrefour', quantity: '2 kg', categories_tags: ['en:potatoes', 'en:vegetables'] } }) });
  Object.defineProperty(w.navigator, 'mediaDevices', { configurable: true, value: undefined });
  await click('[data-action="add-menu"]'); await click('.menu [data-action="scan"]', 40);
  await type('.scan-manual input', '3270190207924');
  $('.scan-manual').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick(80);
  log(sheet().querySelector('[name="quantity"]').value === '2 kg' && sheet().querySelector('.stepper output').textContent === '1', 'Scan : poids « 2 kg », nombre 1');
  log(sheet().querySelector('[data-action="count-minus"]').disabled, 'Bouton − désactivé à 1');
  await click(sheet().querySelector('[data-action="count-plus"]'));
  log(sheet().querySelector('.stepper output').textContent === '2' && sheet().textContent.includes('En stock : 2 × 2 kg'), 'Nombre 2 → « En stock : 2 × 2 kg »');
  await type(sheet().querySelector('[name="name"]'), 'Pommes de terre');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  const pdt = docs(P0).find((d) => d.name === 'Pommes de terre');
  log(pdt?.count === 2 && pdt.quantity === '2 kg', `Enregistré : count ${pdt?.count}, quantité « ${pdt?.quantity} »`);
  const row = () => $$('.product').find((r) => r.textContent.includes('Pommes de terre'));
  log(row().textContent.includes('2 × 2 kg') && row().querySelector('.thumb .count').textContent === '×2', 'Liste : « 2 × 2 kg » et pastille ×2');

  // Rond « consommé » : une unité à la fois
  await click(row().querySelector('.consume'), 30);
  log(docs(P0).find((d) => d.name === 'Pommes de terre')?.count === 1 && text().includes('il en reste 1'), 'Consommé : il en reste 1 (le produit reste au frigo)');
  await click('#toast button', 30);
  log(docs(P0).find((d) => d.name === 'Pommes de terre')?.count === 2, 'Annuler : retour à 2');
  await click(row().querySelector('.consume'), 30);
  await click(row().querySelector('.consume'), 250);
  log(!docs(P0).some((d) => d.name === 'Pommes de terre'), 'Dernière unité consommée : produit retiré');
  await click('#toast button', 30);

  // Scanner le même produit une 2e fois : proposer d'ajouter au produit existant
  await click('[data-action="add-menu"]'); await click('.menu [data-action="scan"]', 40);
  await type('.scan-manual input', '3270190207924');
  $('.scan-manual').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick(80);
  log(sheet().textContent.includes('Déjà avec les fruits et légumes : Pommes de terre'), 'Même code-barres : « Déjà avec les fruits et légumes » proposé');
  await click(sheet().querySelector('[data-action="add-to-same"]'), 350);
  const merged = docs(P0).filter((d) => d.barcode === '3270190207924');
  log(merged.length === 1 && merged[0].count === 2, `Ajouté au produit existant (1 restauré + 1 scanné) : ${merged.length} produit, count ${merged[0]?.count}`);

  // Pack « 4 x 125 g » : 4 pots de 125 g
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ status: 1, product: { product_name_fr: 'Yaourt nature', brands: 'Danone', quantity: '4 x 125 g', categories_tags: ['en:yogurts'] } }) });
  await click('[data-action="add-menu"]'); await click('.menu [data-action="scan"]', 40);
  await type('.scan-manual input', '3033490004743');
  $('.scan-manual').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick(80);
  log(sheet().querySelector('.stepper output').textContent === '4' && sheet().querySelector('[name="quantity"]').value === '125 g', 'Pack « 4 x 125 g » → 4 pots de 125 g');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  console.log('\n— Quantités dans les courses —');
  await click('.tab[data-tab="courses"]');
  await type('#new-item', 'Farine 1 kg'); await type('#new-qty', '2 kg');
  log($('#new-qty').value === '2', 'Qté : « 2 kg » tapé → seul « 2 » est gardé');
  $('#add-item').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  log(docs(C0).find((d) => d.name === 'Farine 1 kg')?.quantity === '2', 'Ajout « Farine 1 kg », nombre 2');
  log($('#new-item').value === '' && $('#new-qty').value === '', 'Champs vidés après ajout');
  log($('.qty-pill')?.textContent === '2', 'Nombre affiché en pastille');
  await type('#new-qty', 'abc');
  log($('#new-qty').value === '', 'Lettres refusées dans « Qté »');
  await type('#new-item', 'Oeufs');
  $('#add-item').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  log(docs(C0).find((d) => d.name === 'Oeufs')?.quantity === '', 'Ajout sans quantité toujours possible');
  await type('#new-item', 'farine'); await type('#new-qty', '3');
  $('#add-item').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  log(docs(C0).filter((d) => d.name.toLowerCase().startsWith('farine')).length === 1 && docs(C0).find((d) => d.name === 'Farine 1 kg').quantity === '3' && text().includes('quantité mise à jour'), 'Même article (« farine » = « Farine 1 kg ») : quantité mise à jour, pas de doublon');
  // Modifier la quantité en touchant l'article
  await click($$('.shop-text').find((b) => b.textContent.includes('Oeufs')), 350);
  log(sheet()?.textContent.includes('Article'), 'Toucher l\'article ouvre sa fiche');
  await click(sheet().querySelector('[data-action="set-qty"][data-value="6"]'));
  log(sheet().querySelector('[name="quantity"]').value === '6', 'Raccourci « 6 »');
  await type(sheet().querySelector('[name="quantity"]'), '6 boîtes');
  log(sheet().querySelector('[name="quantity"]').value === '6', 'Fiche : lettres retirées de la quantité');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(docs(C0).find((d) => d.name === 'Oeufs')?.quantity === '6', 'Quantité enregistrée : 6');
  await click($$('.shop-text').find((b) => b.textContent.includes('Farine')), 350);
  await type(sheet().querySelector('[name="quantity"]'), '2');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(docs(C0).find((d) => d.name === 'Farine 1 kg')?.quantity === '2', 'Farine 1 kg : 2 à acheter');
  // Acheté → ranger au frigo : nombre et poids repris
  await click($$('.tick').find((b) => b.getAttribute('aria-label').includes('Farine')));
  await click($$('[data-action="item-to-fridge"]').find((b) => b.getAttribute('aria-label').includes('Farine')), 400);
  log(sheet().querySelector('.stepper output').textContent === '2' && sheet().querySelector('[name="quantity"]').value === '1 kg' && sheet().querySelector('[name="name"]').value === 'Farine', 'Rangé au frigo : « Farine 1 kg » × 2 → Farine, nombre 2, poids 1 kg');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(docs(P0).find((d) => d.name === 'Farine')?.count === 2 && !docs(C0).some((d) => d.name === 'Farine'), 'Produit créé (×2) et article retiré des courses');
  // « Ajouter à la liste de courses » depuis un produit : quantité reprise
  await click('.tab[data-tab="frigo"]');
  await click($$('.product-main').find((b) => b.textContent.includes('Farine')), 400);
  await click(sheet().querySelector('[data-action="to-shopping"]'));
  log(docs(C0).find((d) => d.name === 'Farine (1 kg)')?.quantity === '2', 'Racheter depuis le frigo : « Farine (1 kg) », nombre 2');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');

});
