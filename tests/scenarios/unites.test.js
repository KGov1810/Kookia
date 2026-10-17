// Scénario : poids et contenance en chiffre + unité (g | kg | cl | L) dans la fiche produit et au ticket.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test('Unités : fiche produit et ticket de caisse', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'UNITE-POIDS';
  const F = `foyers/${CODE}/`;
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };
  const prod = (name, extra) => ({ name, expiry: iso(5), category: 'laitier', categoryVersion: 2, quantity: '', count: 1, location: 'frigo', dateKind: 'dlc', frozenAt: '', barcode: '', addedBy: 'Kevin', createdAt: 1, image: '', imageUrl: '', ...extra });
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [F + 'produits/confiture', prod('Confiture', { category: 'sucre', quantity: '1 pot', location: 'placard', dateKind: 'aucune', expiry: '' })],
    [F + 'produits/jus', prod('Jus d\'orange', { category: 'boisson', quantity: '330 ml', location: 'placard', dateKind: 'aucune', expiry: '' })]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-sonnet-5-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('unites', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $$, click, type, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const product = (name) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + 'produits/')).map(([, v]) => v).find((d) => d.name === name);
  const amount = () => sheet().querySelector('[name="quantity"]');
  const unitButtons = () => [...sheet().querySelectorAll('.unit-field [data-action="set-unit"]')];
  const pressed = () => unitButtons().find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.unit ?? null;
  const tap = (u) => click(unitButtons().find((b) => b.dataset.unit === u));
  const manual = async (name) => {
    await click('[data-action="add-menu"]');
    await click(sheet().querySelector('[data-action="manual"]'), 400);
    if (name) {
      await type(sheet().querySelector('[name="name"]'), name);
      await type(sheet().querySelector('[name="name"]'), name, 'change');
    }
  };
  await tick(80);

  console.log('\n— Fiche produit —');
  await manual('Lait demi-écrémé');
  log(unitButtons().map((b) => b.dataset.unit).join('|') === 'g|kg|cl|L' && pressed() === 'g', 'Boutons g | kg | cl | L, gramme par défaut');
  log(amount().getAttribute('inputmode') === 'decimal', 'Clavier numérique pour le chiffre');
  await type(amount(), '1');
  await tap('L');
  log(pressed() === 'L' && amount().value === '1', 'Toucher « L » : le chiffre reste');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(product('Lait demi-écrémé')?.quantity === '1 L', 'Enregistré : « 1 L »');

  await manual('Pommes');
  log(pressed() === 'kg', 'Fruit : kilo par défaut');
  await type(amount(), '1,5');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(product('Pommes')?.quantity === '1,5 kg', 'Enregistré : « 1,5 kg »');

  await manual('');
  await type(amount(), '500');
  log(pressed() === 'g', 'Chiffre tapé avant le nom : gramme affiché');
  await type(sheet().querySelector('[name="name"]'), 'Carottes');
  await type(sheet().querySelector('[name="name"]'), 'Carottes', 'change');
  log(pressed() === 'g', 'Le nom (un légume) ne change plus l\'unité déjà vue : pas de « 500 kg »');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(product('Carottes')?.quantity === '500 g', 'Enregistré : « 500 g »');

  await click($$('.product-main').find((b) => b.textContent.includes('Confiture')), 400);
  log(amount().value === '1 pot' && pressed() === null, 'Ancien texte libre (« 1 pot ») : affiché tel quel, aucune unité');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(product('Confiture').quantity === '1 pot', 'Gardé tel quel s\'il n\'est pas modifié');
  await click($$('.product-main').find((b) => b.textContent.includes('Jus d\'orange')), 400);
  log(amount().value === '33' && pressed() === 'cl', '« 330 ml » affiché en 33 cl');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  console.log('\n— Ticket de caisse —');
  w.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, drawImage() {}, set fillStyle(v) {} });
  w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,VElDS0VU';
  globalThis.URL.createObjectURL = () => 'blob:fake'; globalThis.URL.revokeObjectURL = () => {};
  globalThis.Image = class { set src(v) { this.naturalWidth = 1200; this.naturalHeight = 3000; setTimeout(() => this.onload(), 1); } };
  const origCreate = w.document.createElement.bind(w.document);
  w.document.createElement = (tag) => {
    const el = origCreate(tag);
    if (tag === 'input') el.click = () => setTimeout(() => {
      Object.defineProperty(el, 'files', { value: [new w.File(['x'], 'ticket.jpg', { type: 'image/jpeg' })] });
      el.dispatchEvent(new w.Event('change'));
    }, 5);
    return el;
  };
  globalThis.fetch = async (_url, opts) => {
    const body = JSON.parse(opts.body);
    const input = { produits: [
      { nom: 'Crème liquide', texte_ticket: 'CREME LIQ 20CL', categorie: 'laitier', nombre: 1, contenance: '20 cl', lieu: 'frigo' },
      { nom: 'Tomates', texte_ticket: 'TOMATE GRAPPE', categorie: 'legumes', nombre: 1, contenance: '', lieu: 'fruits' },
      { nom: 'Riz basmati', texte_ticket: 'RIZ BASMATI 1KG', categorie: 'feculents', nombre: 1, contenance: '1 kg', lieu: 'placard' },
      { nom: 'Œufs', texte_ticket: 'OEUFS X6', categorie: 'oeufs', nombre: 1, contenance: 'boîte de 6', lieu: 'frigo' }] };
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: body.tools[0].name, input }] }) };
  };
  await click('[data-action="add-menu"]');
  await click(sheet().querySelector('[data-action="ticket"]'), 400);
  await click(sheet().querySelector('[data-action=\"add-photo\"]'), 60); // la fiche s'ouvre d'abord, puis la photo
  await click(sheet().querySelector('[data-action="analyze"]'), 80);
  const line = (name) => [...sheet().querySelectorAll('.receipt-line')].find((l) => l.querySelector('input').value === name);
  const lineUnits = (name) => [...line(name).querySelectorAll('[data-action="set-unit"]')];
  const linePressed = (name) => lineUnits(name).find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.unit ?? null;
  const lineAmount = (name) => line(name).querySelector('[data-field="quantity"]');
  log(lineAmount('Crème liquide').value === '20' && linePressed('Crème liquide') === 'cl', 'Ticket : « 20 cl » → 20, cl');
  log(lineUnits('Tomates').map((b) => b.dataset.unit).join('|') === 'g|kg' && linePressed('Tomates') === 'kg', 'Légume : boutons g | kg, kilo par défaut');
  log(lineAmount('Œufs').value === 'boîte de 6' && linePressed('Œufs') === null, 'Texte libre lu sur le ticket : gardé, aucune unité');
  await type(lineAmount('Tomates'), '750');
  await click(lineUnits('Tomates').find((b) => b.dataset.unit === 'g'));
  log(linePressed('Tomates') === 'g', 'Toucher « g » sur une ligne du ticket');
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  log(product('Tomates')?.quantity === '750 g' && product('Crème liquide')?.quantity === '20 cl' && product('Riz basmati')?.quantity === '1 kg', 'Enregistré : 750 g, 20 cl, 1 kg');
  log(product('Œufs')?.quantity === 'boîte de 6', 'Texte libre gardé tel quel');
  log(!P.errors.length, `Aucune erreur JS ${P.errors.join(' ')}`);
});
