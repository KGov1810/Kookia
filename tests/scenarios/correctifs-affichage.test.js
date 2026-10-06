// Scénario : Quantité numérique, réglages et styles.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { readAllCss, readProjectFile } from '../helpers/files.js';

test("Quantité numérique, réglages et styles", async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'HJKLM-NPQRS';
  const C0 = `foyers/${CODE}/courses/`;
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [C0 + 'sucre', { name: 'Sucre', quantity: '2 kg', checked: false, addedBy: 'Kevin', createdAt: 1 }],   // ancienne quantité en texte
    [C0 + 'concombre', { name: 'Concombre', quantity: '2', checked: false, addedBy: 'Kevin', createdAt: 2 }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: '', model: 'claude-haiku-4-5', householdCode: CODE, lightMaxKcal: 400,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('fix', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, text, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const doc = (id) => globalThis.__db.docs.get(C0 + id);
  await tick(50);

  console.log('\n— Quantité numérique —');
  await click('.tab[data-tab="courses"]');
  const qty = $('#new-qty');
  log(qty.getAttribute('inputmode') === 'numeric' && qty.getAttribute('maxlength') === '3', 'Champ « Qté » : clavier numérique, 3 chiffres max');
  await type('#new-qty', '12 paquets');
  log(qty.value === '12', '« 12 paquets » collé → « 12 »');
  await click($$('.shop-text').find((b) => b.textContent.includes('Sucre')), 350);
  log(sheet().querySelector('[name="name"]').value === 'Sucre (2 kg)' && sheet().querySelector('[name="quantity"]').value === '', 'Ancien article « 2 kg » : poids déplacé dans le nom, nombre vide');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(doc('sucre').name === 'Sucre (2 kg)' && doc('sucre').quantity === '', 'Enregistré au nouveau format');
  await click($$('[data-action="delete-item"]').find((b) => b.getAttribute('aria-label').includes('Concombre')), 30);
  await click('#toast button', 30);
  const restored = [...globalThis.__db.docs.entries()].filter(([k]) => !k.includes('/historique/')).map(([, v]) => v).find((d) => d.name === 'Concombre');
  log(restored?.quantity === '2', 'Suppression annulée : quantité 2 conservée');

  console.log('\n— Réglages et styles —');
  await click('.tab[data-tab="reglages"]');
  log($('#kcal-max').textContent === '400 kcal', 'Recette légère : « 400 kcal » (plus de texte coupé)');
  log([...$('#model').options].map((o) => o.textContent).join(' | ') === 'Sonnet 5.5 (conseillé) | Haiku 4.5 (économique)', 'Noms de modèles raccourcis');
  const css = readAllCss();
  const rule = (sel) => { const i = css.lastIndexOf(`${sel} {`); return i < 0 ? '' : css.slice(i, css.indexOf('}', i)); };
  log(/flex: none/.test(rule('.field input.switch')) && /width: 51px/.test(rule('.field input.switch')) && /min-height: 0/.test(rule('.field input.switch')), 'Interrupteurs : taille fixe 51 × 31 px, plus étirés');
  log(/background: var\(--herb\)/.test(rule('.field input.switch:checked')), 'Interrupteur activé : fond vert conservé');
  log(/flex: 1 1 auto/.test(rule('.field > .label-stack')) && /min-width: 0/.test(rule('.field > .label-stack')), 'Libellés longs : passage à la ligne autorisé');
  await click('.tab[data-tab="recettes"]');
  log($('#batch-toggle').classList.contains('switch') && $('#light-toggle').closest('.field') !== null, 'Batch cooking et Léger utilisent bien ces interrupteurs');
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');

});
