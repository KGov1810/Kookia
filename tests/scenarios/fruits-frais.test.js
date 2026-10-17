// Scénario : fruits et légumes au frigo ou hors du frigo — la date estimée suit le rangement,
// sauf si elle a été changée à la main.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test('Fruits et légumes : durée selon le rangement au frais ou non', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'FRAIS-FRUIT';
  const F = `foyers/${CODE}/`;
  const day = 86_400_000;
  const iso = (days, from = new Date()) => { const d = new Date(from); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const added = Date.now() - 2 * day;
  const prod = (name, extra) => ({ name, category: 'legumes', categoryVersion: 2, quantity: '', count: 1, location: 'fruits', dateKind: 'estimee', frozenAt: '', barcode: '', addedBy: 'Kevin', createdAt: added, image: '', imageUrl: '', ...extra });
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [F + 'produits/carottes', prod('Carottes', { expiry: iso(21, added) })],           // estimation au frais (habitude)
    [F + 'produits/poireaux', prod('Poireaux', { expiry: iso(4, added) })],            // date changée à la main
    [F + 'produits/bananes', prod('Bananes', { category: 'fruits', expiry: iso(5, added) })]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, householdCode: CODE, firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('fruits-frais', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const doc = (id) => globalThis.__db.docs.get(F + 'produits/' + id);
  const pressed = () => sheet().querySelector('.cold-choice [aria-pressed="true"]')?.dataset.value;
  await tick(60);

  await click('.product[data-id="carottes"] [data-action="edit"]');
  log(pressed() === 'frigo' && sheet().textContent.includes('Se garde ≈ 21 jours au frigo, 5 jours hors du frigo.'), 'Carottes avec les fruits et légumes : « Au frigo » proposé, durées affichées');
  await click(sheet().querySelector('[data-action="set-cold"][data-value="ambiant"]'));
  log(pressed() === 'ambiant', '« Hors du frigo » choisi');
  await click(sheet().querySelector('.sheet-head [data-action="close"]'), 400);
  log(doc('carottes').cold === false && doc('carottes').expiry === iso(5, added), `Date recalculée depuis l'ajout : ${doc('carottes').expiry}`);

  await click('.product[data-id="poireaux"] [data-action="edit"]');
  await click(sheet().querySelector('[data-action="set-cold"][data-value="ambiant"]'));
  await click(sheet().querySelector('.sheet-head [data-action="close"]'), 400);
  log(doc('poireaux').cold === false && doc('poireaux').expiry === iso(4, added), `Date changée à la main : gardée (${JSON.stringify(doc('poireaux'))})`);

  await click('.product[data-id="bananes"] [data-action="edit"]');
  log(pressed() === 'ambiant', 'Bananes : « Hors du frigo » proposé');
  await click(sheet().querySelector('[data-action="set-loc"][data-value="frigo"]'));
  log(!sheet().querySelector('.cold-choice'), 'Au frigo : pas de choix à faire');
  await click(sheet().querySelector('.sheet-head [data-action="close"]'), 400);
  log(doc('bananes').location === 'frigo' && doc('bananes').expiry === iso(7, added) && doc('bananes').cold === undefined, `Bananes au frigo : 7 jours (${JSON.stringify(doc('bananes'))} attendu ${iso(7, added)})`);

  await click('.nav-add'); await click('.menu-item[data-action="manual"]', 80);
  const name = sheet().querySelector('[name="name"]');
  name.value = 'Fraises'; name.dispatchEvent(new P.w.Event('input', { bubbles: true })); await tick(80);
  await click(sheet().querySelector('[data-action="set-loc"][data-value="fruits"]'));
  log(pressed() === 'frigo', 'Nouvelles fraises avec les fruits et légumes : au frigo d\'office');
  await click(sheet().querySelector('[data-action="set-cold"][data-value="ambiant"]'));
  await click(sheet().querySelector('.sheet-head [data-action="save"]'), 80);
  const fraises = [...globalThis.__db.docs.entries()].find(([k, v]) => k.startsWith(F + 'produits/') && v.name === 'Fraises')?.[1];
  log(fraises?.location === 'fruits' && fraises.cold === false && fraises.expiry === iso(1), `Fraises hors du frigo : 1 jour (${fraises?.expiry})`);

  // Grille « Fruits et légumes » : un choix au frigo / hors du frigo par ligne.
  await click('.nav-add'); await click('.menu-item[data-action="produce"]', 80);
  await click(sheet().querySelector('.produce-chip[data-name="Pommes"]'));
  await click(sheet().querySelector('.produce-chip[data-name="Carottes"]'));
  const line = (name) => [...sheet().querySelectorAll('.produce-line')].find((l) => l.querySelector(`[data-name="${name}"]`));
  const linePressed = (name) => line(name).querySelector('.cold-choice [aria-pressed="true"]')?.dataset.value;
  log(linePressed('Pommes') === 'ambiant' && linePressed('Carottes') === 'frigo' && line('Pommes').textContent.includes('se garde ≈ 14 jours'), 'Grille : pommes hors du frigo (14 jours), carottes au frigo, d\'office');
  await click(line('Pommes').querySelector('[data-action="set-line-cold"][data-value="frigo"]'));
  await click(line('Carottes').querySelector('[data-action="set-line-cold"][data-value="ambiant"]'));
  log(line('Pommes').textContent.includes('se garde ≈ 45 jours') && line('Carottes').textContent.includes('Fruits & légumes, se garde ≈ 5 jours'), 'Choix changés : la durée affichée suit');
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  const saved = (name) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + 'produits/')).map(([, v]) => v).find((v) => v.name === name && v.createdAt > added + day);
  log(saved('Pommes')?.location === 'fruits' && saved('Pommes').cold === true && saved('Pommes').expiry === iso(45), `Pommes : fruits & légumes au frigo, 45 jours (${JSON.stringify(saved('Pommes'))})`);
  log(saved('Carottes')?.location === 'fruits' && saved('Carottes').cold === false && saved('Carottes').expiry === iso(5), 'Carottes : fruits & légumes hors du frigo, 5 jours');
  log(!P.errors.length, `Aucune erreur JS ${P.errors.join(' ')}`);
});
