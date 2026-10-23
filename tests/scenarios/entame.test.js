// Scénario : produit entamé (¾ ½ ¼), date et rangement après ouverture, statistiques, recette cuisinée.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { iso } from '../helpers/dates.js';

test('Produits entamés', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'ENTAM-ESTOK';
  const F = `foyers/${CODE}/`;
  const prod = (name, extra) => ({ name, expiry: iso(10), category: 'laitier', categoryVersion: 2, quantity: '', count: 1, location: 'frigo', dateKind: 'dlc', frozenAt: '', barcode: '', addedBy: 'Kevin', createdAt: 1, image: '', imageUrl: '', ...extra });
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [F + 'produits/lait', prod('Lait UHT', { quantity: '1 L', location: 'placard', dateKind: 'aucune', expiry: '', unitPrice: 1.2 })],
    [F + 'produits/lardons', prod('Lardons', { category: 'charcuterie', count: 3, expiry: iso(6), unitPrice: 1.5 })],
    [F + 'produits/pates', prod('Pâtes', { category: 'feculents', quantity: '500 g', location: 'placard', dateKind: 'aucune', expiry: '', unitPrice: 1 })],
    [F + 'produits/creme', prod('Crème fraîche', { quantity: '20 cl', unitPrice: 1.6 })],
    [F + 'produits/oeufs', prod('Œufs', { category: 'oeufs', count: 6, unitPrice: 0.3 })],
    [F + 'recettes/carbo', { title: 'Pâtes carbonara', summary: '', difficulty: 'facile', totalMinutes: 20, prepMinutes: 10, servings: 2, batchCooking: false,
      storageDays: 0, storageTips: '', createdAt: 5, favorite: false, steps: ['Cuire.'], usedProductIds: ['pates', 'creme', 'oeufs'], diet: 'vegetarien', kcal: 600,
      ingredients: [
        { name: 'Pâtes', quantity: '200 g', amount: 200, unit: 'g', source: 'stock', productId: 'pates' },
        { name: 'Crème fraîche', quantity: '10 cl', amount: 10, unit: 'cl', source: 'stock', productId: 'creme' },
        { name: 'Œufs', quantity: '3', amount: 3, unit: '', source: 'stock', productId: 'oeufs' }] }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, householdCode: CODE, firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('entame', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const docs = (sub) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + sub + '/')).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  const product = (name) => docs('produits').filter((d) => d.name === name);
  const one = (name) => product(name)[0];
  const moves = () => docs('mouvements').sort((a, b) => a.clientAt - b.clientAt);
  const lastMove = () => moves().at(-1);
  const history = () => docs('historique').sort((a, b) => a.clientAt - b.clientAt).at(-1);
  const row = (name, opened) => $$('.product').find((r) => r.querySelector('.product-name').textContent === name && (opened === undefined || r.textContent.includes('Entamé') === opened));
  const openFiche = (name, opened) => click(row(name, opened).querySelector('.product-main'), 400);
  const choose = (label) => click([...sheet().querySelectorAll('[data-action="set-remaining"]')].find((b) => b.textContent === label), 350);
  await tick(80);

  console.log('\n— Entamer un produit —');
  await openFiche('Lait UHT');
  const choices = [...sheet().querySelectorAll('[data-action="set-remaining"]')];
  log(choices.map((b) => b.textContent).join(' ') === '¾ ½ ¼' && sheet().textContent.includes('Entamé ? Il en reste'), 'Choix ¾ · ½ · ¼ visibles d\'emblée, en haut de la fiche');
  log(sheet().textContent.includes('À l\'ouverture : à finir avant le') && sheet().textContent.includes('rangé au frigo'), 'Annonce : date après ouverture et rangement au frigo');
  await click(choices.find((b) => b.textContent === '½'), 350);
  const lait = () => one('Lait UHT');
  log(lait().remaining === 0.5 && lait().location === 'frigo' && lait().dateKind === 'dlc' && lait().expiry === iso(4) && lait().openedAt === iso(0), 'Lait : reste ½, au frigo, à finir dans 4 jours');
  log(lastMove().type === 'consomme' && lastMove().count === 0.5 && lastMove().unitPrice === 1.2, 'Stats : la moitié consommée (0,5 × 1,20 €)');
  log(history().action === 'entame' && history().details.includes('reste ½'), 'Historique : « a entamé », « reste ½ »');
  log($('#toast').textContent.includes('Lait UHT : entamé, reste ½ · à finir avant le') && $('#toast').textContent.includes('rangé au frigo'), 'Message clair, avec Annuler');
  log(row('Lait UHT').querySelector('.product-meta').textContent.startsWith('Entamé, reste ½') && row('Lait UHT').querySelector('.opened-gauge'), 'Liste : « Entamé, reste ½ » en tête, et jauge');
  const count = moves().length;
  await click('#toast button', 40);
  log(lait().remaining === 1 && lait().location === 'placard' && moves().length === count - 1, 'Annuler : lait remis au placard, intact, mouvement effacé');
  await openFiche('Lait UHT');
  await choose('½');
  await openFiche('Lait UHT');
  const disabled = [...sheet().querySelectorAll('[data-action="set-remaining"]')].filter((b) => b.disabled).map((b) => b.textContent);
  const current = sheet().querySelector('[data-action="set-remaining"][aria-pressed="true"]')?.textContent;
  log(disabled.join(' ') === '¾ ½' && current === '½' && /Entamé le .+, il en reste ½/.test(sheet().textContent), 'Déjà à ½ (marqué) : seul ¼ est possible');
  await click([...sheet().querySelectorAll('[data-action="set-remaining"]')].find((b) => b.textContent === '¼'), 350);
  log(lait().remaining === 0.25 && lait().expiry === iso(4) && lastMove().count === 0.25, '½ → ¼ : 0,25 de plus consommé, date inchangée');
  await openFiche('Lait UHT');
  await click(sheet().querySelector('[data-action="discard"]'), 350);
  log(!lait() && lastMove().type === 'jete' && lastMove().count === 0.25, 'Jeté : seul le quart restant compte comme gaspillé');

  console.log('\n— Plusieurs exemplaires —');
  await openFiche('Lardons');
  await choose('¾');
  const lardons = product('Lardons');
  const intact = lardons.find((d) => (d.remaining ?? 1) === 1);
  const opened = lardons.find((d) => d.remaining === 0.75);
  log(lardons.length === 2 && intact.count === 2 && intact.expiry === iso(6) && opened?.count === 1 && opened.expiry === iso(3), 'Lardons : 2 intacts (date d\'origine) + 1 entamé mis à part (3 jours)');
  await click(row('Lardons', true).querySelector('.consume'), 300);
  log(product('Lardons').length === 1 && product('Lardons')[0].count === 2 && lastMove().count === 0.75, 'Le rond finit l\'unité entamée (0,75)');
  log($('#toast').textContent.includes('Lardons : fini, retiré du stock'), 'Message : « fini, retiré du stock »');

  console.log('\n— Recette cuisinée —');
  let asked = '';
  w.confirm = (message) => { asked = message; return true; };
  await click('.tab[data-tab="recettes"]');
  await click($$('.recipe-card').find((c) => c.textContent.includes('Pâtes carbonara')), 400);
  await click(sheet().querySelector('[data-action="cooked"]'), 80);
  log(asked.includes('• Pâtes : 200 g → il en reste 60 %') && asked.includes('• Crème fraîche : 10 cl → il en reste ½') && asked.includes('• Œufs : 3 → il en reste 3'), `Confirmation détaillée : ${asked.replace(/\n/g, ' | ')}`);
  log(one('Pâtes').remaining === 0.6 && one('Crème fraîche').remaining === 0.5 && one('Œufs').count === 3, 'Pâtes à 60 %, crème à ½, 3 œufs');
  log(one('Crème fraîche').expiry === iso(4) && one('Pâtes').expiry === '', 'Crème ouverte : à finir dans 4 jours ; pâtes : pas de date');
  const pastaMove = moves().find((m) => m.name === 'Pâtes');
  log(pastaMove?.type === 'consomme' && pastaMove.count === 0.4, 'Stats : 0,4 paquet de pâtes consommé (0,40 €)');
  await click('#toast button', 40);
  log(one('Pâtes').remaining === 1 && one('Œufs').count === 6 && !moves().some((m) => m.name === 'Pâtes'), 'Annuler la recette : tout est remis');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  console.log('\n— Statistiques —');
  await click('.tab[data-tab="stats"]', 80);
  // Consommé : lait 0,5 + 0,25 (0,90 €) + lardons 0,25 + 0,75 (1,50 €) ; jeté : lait 0,25 (0,30 €).
  log($('.stats-out.consumed b').textContent === '2,40 €' && $('.stats-out.wasted b').textContent === '0,30 €', `Consommé ${$('.stats-out.consumed b').textContent}, jeté ${$('.stats-out.wasted b').textContent}`);
  log($$('.waste-row').some((r) => r.textContent.replace(/\s+/g, ' ').includes('Lait UHT ×0,25 0,30 €')), 'Les plus jetés : « Lait UHT ×0,25 0,30 € »');
  log(!P.errors.length, `Aucune erreur JS ${P.errors.join(' ')}`);
});
