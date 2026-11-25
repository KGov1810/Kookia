// Scénario : la liste « À acheter » rangée par rayon, un rayon corrigé dans la fiche d'un article (retenu pour ce
// produit), l'ordre des rayons changé dans les Réglages et reçu de l'autre iPhone.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test('Courses rangées par rayon, dans l\'ordre du foyer', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'RAYON-COURS';
  const C = `foyers/${CODE}/courses/`;
  const item = (id, name, at, extra) => [C + id, { name, quantity: '', checked: false, addedBy: 'Kevin', createdAt: at, ...extra }];
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    item('lait', 'Lait', 1),
    item('pommes', 'Pommes', 2),
    item('lessive', 'Lessive', 3),
    item('farine', 'Farine (1 kg)', 4),
    item('tofu', 'Tofu', 5),
    item('beurre', 'Beurre', 6),
    item('pain', 'Pain', 7, { checked: true })
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, householdCode: CODE, firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('rayons', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, tick, w } = P;
  const sheet = () => $$('.sheet').at(-1);
  const titles = () => $$('.aisle-title').map((h) => h.textContent.replace(/\d+$/, '').trim());
  const aisleOf = (name) => $$('.aisle-title').find((h) => h.nextElementSibling.textContent.includes(name))?.textContent.replace(/\d+$/, '').trim();
  const doc = (id) => globalThis.__db.docs.get(`foyers/${CODE}/prix/${id}`);
  await tick(60);

  await click('.tab[data-tab="courses"]', 120);
  log(titles().join(' | ') === '🥕Fruits et légumes | 🥓Charcuterie et traiteur | 🧀Crèmerie, œufs et fromages | 🍪Épicerie sucrée | 🛒Autres (maison, hygiène…)',
    `Rayons dans l'ordre type : ${titles().join(' | ')}`);
  const cremerie = $$('.aisle-title').find((h) => h.textContent.includes('Crèmerie'));
  log(cremerie.querySelector('small').textContent === '2' && cremerie.nextElementSibling.textContent.indexOf('Lait') < cremerie.nextElementSibling.textContent.indexOf('Beurre'), 'Crèmerie : lait puis beurre (ordre d\'ajout), avec le nombre');
  log(aisleOf('Farine') === '🍪Épicerie sucrée' && aisleOf('Lessive') === '🛒Autres (maison, hygiène…)', 'Farine (1 kg) : épicerie sucrée (pâtisserie) ; lessive : autres');
  log(!$$('.aisle-title').some((h) => h.nextElementSibling.textContent.includes('Pain')) && $('.shop-item.checked')?.textContent.includes('Pain'), 'Panier : pas rangé par rayon');

  // Le tofu est au rayon frais végétal de la crèmerie dans ce magasin : corrigé dans sa fiche.
  await click('[data-action="edit-item"][data-id="tofu"]', 80);
  const select = sheet().querySelector('[name="aisle"]');
  log(select?.value === 'charcuterie' && sheet().textContent.includes('retenu pour ce produit'), 'Fiche : rayon proposé (charcuterie et traiteur), modifiable');
  await type(select, 'cremerie', 'change');
  await click(sheet().querySelector('[data-action="save"]'), 120);
  log(aisleOf('Tofu') === '🧀Crèmerie, œufs et fromages', 'Tofu rangé en crèmerie');
  log(Object.values(doc('categories')?.entries ?? {}).some((e) => e.aisle === 'cremerie'), 'Rayon retenu pour le foyer (mémoire partagée)');
  const remembered = Object.keys(doc('categories').entries).length;
  await click('[data-action="edit-item"][data-id="lait"]', 80);
  await click(sheet().querySelector('[data-action="save"]'), 80);
  log(Object.keys(doc('categories').entries).length === remembered, 'Fiche enregistrée sans changer le rayon : rien de plus n\'est retenu');

  // Réglages → Ordre des rayons : la crèmerie monte en tête.
  await click('.tab[data-tab="frigo"]'); await click('[data-action="open-settings"]', 80);
  log($('[data-action="open-aisles"]')?.textContent.includes('Ordre type d\'un supermarché'), 'Réglages : « Ordre des rayons », ordre type');
  await click('[data-action="open-aisles"]', 80);
  const rows = () => $$('#aisle-order .aisle-row').map((r) => r.querySelector('[data-id]').dataset.id);
  log(rows()[0] === 'fruits_legumes' && $('#aisle-order [data-action="aisle-up"]').disabled && $('[data-action="aisles-reset"]').disabled, 'Premier rayon : pas de « monter » ; ordre type : rien à remettre');
  for (let i = 0; i < 5; i += 1) await click(`#aisle-order [data-action="aisle-up"][data-id="cremerie"]`, 30);
  log(rows()[0] === 'cremerie' && doc('rayons')?.order?.[0] === 'cremerie', `Crèmerie en tête, enregistrée pour le foyer (${rows().join(', ')})`);
  log(w.document.activeElement?.dataset?.id === 'cremerie' && w.document.activeElement.dataset.action === 'aisle-down', 'En haut : le focus passe sur « descendre »');
  log(!$('[data-action="aisles-reset"]').disabled, '« Remettre l\'ordre type » possible');
  await click('[data-action="close-advanced"]', 80);
  log($('[data-action="open-aisles"]')?.textContent.includes('Ordre de votre magasin'), 'Réglages : « Ordre de votre magasin »');

  await click('.tab[data-tab="courses"]', 120);
  log(titles()[0] === '🧀Crèmerie, œufs et fromages', 'Courses : la crèmerie d\'abord');

  // L'autre iPhone met « Autres » puis les fruits et légumes en tête : la liste suit.
  const firestore = await import('firebase/firestore');
  await firestore.setDoc(firestore.doc(null, 'foyers', CODE, 'prix', 'rayons'), { order: ['autre', 'fruits_legumes'], at: Date.now() });
  await tick(80);
  log(titles()[0] === '🛒Autres (maison, hygiène…)' && titles()[1] === '🥕Fruits et légumes', `Ordre reçu de l'autre iPhone : ${titles().join(' | ')}`);

  // Remettre l'ordre type.
  await click('.tab[data-tab="frigo"]'); await click('[data-action="open-settings"]', 80);
  await click('[data-action="open-aisles"]', 80);
  await click('[data-action="aisles-reset"]', 80);
  log(rows()[0] === 'fruits_legumes' && $('[data-action="aisles-reset"]').disabled, 'Ordre type remis');
  log(!P.errors.length, `Aucune erreur JS ${P.errors.join(' ')}`);
});
