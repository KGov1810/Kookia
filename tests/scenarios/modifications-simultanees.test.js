// Scénario : les deux iPhone modifient le même produit en même temps (ou l'un était hors ligne).
// Seul ce qui a changé est envoyé, et le nombre d'unités en écart : rien de ce que fait l'autre iPhone n'est perdu.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { iso } from '../helpers/dates.js';

test('Modifications simultanées : rien de ce que fait l\'autre iPhone n\'est perdu', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'MEMET-EMPS2';
  const F = `foyers/${CODE}/produits/`;
  const prod = (id, name, extra) => [F + id, { name, expiry: iso(8), category: 'laitier', categoryVersion: 2, quantity: '', count: 5,
    location: 'frigo', dateKind: 'dlc', frozenAt: '', barcode: '', addedBy: 'Marie', createdAt: 1, ...extra }];
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Marie' }],
    prod('yaourt', 'Yaourts nature'),
    prod('creme', 'Crème fraîche', { count: 1 }),
    prod('beurre', 'Beurre doux', { count: 3 }),
    prod('lait', 'Lait demi-écrémé', { count: 2 }),
    // Ancien format : catégorie d'avant la version 2, sans nombre d'unités ni type de date.
    [F + 'ancien', { name: 'Jambon blanc', expiry: iso(3), category: 'viande', location: 'frigo', addedBy: 'Marie', createdAt: 1 }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-sonnet-5-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('simultane', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, tick, text } = P;
  const sheet = () => $$('.sheet').at(-1);
  const stored = (id) => globalThis.__db.docs.get(F + id);
  // L'autre iPhone, par le même Firestore (cet iPhone reçoit le changement)…
  const firestore = await import('firebase/firestore');
  const otherPhone = (id, data) => firestore.updateDoc(firestore.doc(null, 'foyers', CODE, 'produits', id), data);
  // … ou hors ligne : le changement arrive au serveur, cet iPhone ne l'a pas encore reçu.
  const unseenChange = (id, data) => globalThis.__db.docs.set(F + id, { ...stored(id), ...data });
  const edit = (id) => click(`[data-action="edit"][data-id="${id}"]`, 350);
  await tick(50);

  // ---- Fiche ouverte ici, l'autre iPhone consomme un yaourt, puis OK
  await edit('yaourt');
  await type(sheet().querySelector('[name="name"]'), 'Yaourts nature bio');
  await otherPhone('yaourt', { count: 4 });
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(stored('yaourt').name === 'Yaourts nature bio' && stored('yaourt').count === 4, `Nom changé ici, yaourt consommé là-bas : les deux gardés (${stored('yaourt').count})`);

  // ---- Les deux changent le nombre : + 1 ici dans la fiche, − 1 là-bas
  await edit('yaourt');
  await click(sheet().querySelector('[data-action="count-plus"]'));
  await otherPhone('yaourt', { count: 3 });
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(stored('yaourt').count === 4, `+ 1 ici, − 1 là-bas : 4 yaourts (${stored('yaourt').count})`);

  // ---- Fiche ouverte ici, l'autre iPhone retire le produit : il n'est pas recréé
  await edit('creme');
  await type(sheet().querySelector('[name="name"]'), 'Crème fraîche épaisse');
  await firestore.deleteDoc(firestore.doc(null, 'foyers', CODE, 'produits', 'creme'));
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(!stored('creme'), 'Produit retiré là-bas pendant la modification ici : pas recréé');
  log(text().includes('Crème fraîche épaisse a été retiré du stock entre-temps'), 'Message : retiré du stock entre-temps');

  // ---- Hors ligne : l'autre iPhone a consommé 1 beurre, cet iPhone ne le sait pas encore et en consomme 1
  unseenChange('beurre', { count: 2 });
  await click('[data-action="consume"][data-id="beurre"]', 350);
  log(stored('beurre').count === 1, `1 consommé là-bas, 1 ici : il en reste 1 sur 3 (${stored('beurre').count})`);

  // ---- La dernière unité retirée des deux côtés : le produit disparaît (pas de ligne à 0)
  unseenChange('lait', { count: 1 });
  await click('[data-action="consume"][data-id="lait"]', 350);
  log(!stored('lait') && !$('[data-id="lait"]'), 'Dernière bouteille de lait prise des deux côtés : produit supprimé');

  // ---- Ancien format : réécrit en entier, une fois, au format actuel
  await edit('ancien');
  await type(sheet().querySelector('[name="name"]'), 'Jambon blanc supérieur');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  const ancien = stored('ancien');
  log(ancien.name === 'Jambon blanc supérieur' && ancien.categoryVersion === 2 && ancien.count === 1 && ancien.dateKind, 'Ancien produit : remis au format actuel (version, nombre, type de date)');
  log(P.errors.length === 0, `Aucune erreur JavaScript (${P.errors.join(' | ')})`);
});
