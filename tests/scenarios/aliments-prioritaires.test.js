// Scénario : choisir vite les aliments à utiliser en priorité (recherche et lieux).
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { iso } from '../helpers/dates.js';

test('Aliments prioritaires : recherche et filtre par lieu', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'PRIOR-ITE55';
  const F = `foyers/${CODE}/produits/`;
  const prod = (id, name, extra) => [F + id, { name, expiry: iso(8), category: 'autre', categoryVersion: 2, quantity: '', count: 1,
    location: 'frigo', dateKind: 'dlc', frozenAt: '', barcode: '', addedBy: 'Kevin', createdAt: 1, ...extra }];
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    prod('yaourt', 'Yaourts nature', { category: 'laitier', count: 4 }),
    prod('comte', 'Comté 18 mois', { category: 'fromage' }),
    prod('pates', 'Pâtes penne', { category: 'feculents', location: 'placard', dateKind: 'aucune', expiry: '' }),
    prod('pois', 'Petits pois', { category: 'surgele', location: 'congelateur', dateKind: 'congele', frozenAt: iso(-5), expiry: iso(80) }),
    prod('pommes', 'Pommes Gala', { category: 'fruits', count: 5, location: 'fruits', dateKind: 'estimee' })
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-sonnet-5-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('prio', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const names = () => [...sheet().querySelectorAll('.pick .product-name')].map((n) => n.textContent);
  const chip = (place) => sheet().querySelector(`[data-action="picker-place"][data-value="${place}"]`);
  const count = (place) => chip(place).querySelector('i').textContent;
  await tick(50);

  await click('.tab[data-tab="recettes"]');
  await click('[data-action="pick-products"]', 350);
  const search = sheet().querySelector('[name="picker-search"]');
  log(search && chip('') && chip('congelateur') && chip('fruits'), 'En haut : recherche et lieux (Tout, Frigo, Congélateur, Placard, Fruits & légumes)');
  log(names().length === 5 && count('') === '5' && count('frigo') === '2', 'Tout : 5 aliments, Frigo : 2');

  await type(search, 'pom');
  log(names().join() === 'Pommes Gala' && count('') === '1' && count('frigo') === '0', '« pom » : seulement les pommes, compteurs mis à jour');
  log(sheet().querySelector('[name="picker-search"]') === search, 'Champ gardé pendant la saisie : le clavier reste ouvert');
  await type(search, 'laitier');
  log(names().join() === 'Yaourts nature', 'Recherche par catégorie (« laitier ») : les yaourts');
  await type(search, 'xyz');
  log(sheet().textContent.includes('Aucun produit ne correspond à « xyz »'), 'Rien ne correspond : message clair');

  await type(search, '');
  await click(chip('congelateur'));
  log(names().join() === 'Petits pois' && chip('congelateur').getAttribute('aria-pressed') === 'true', 'Congélateur : seulement les petits pois');
  await click(sheet().querySelector('.pick[data-id="pois"]'));
  log(sheet().querySelector('.pick[data-id="pois"]').getAttribute('aria-checked') === 'true', 'Petits pois cochés');
  await click(chip(''));
  log(names().length === 5 && sheet().querySelector('.pick[data-id="pois"]').getAttribute('aria-checked') === 'true', 'Retour à Tout : les 5 aliments, petits pois toujours cochés');

  await click(sheet().querySelector('[data-action="close"]'), 350);
  log($('.screen, #screen')?.textContent.includes('Petits pois'), 'Écran Recettes : petits pois en priorité');
});
