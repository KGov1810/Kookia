// Scénario : catégorie et rangement proposés, Claude en dernier recours, mémoire des corrections.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test('Catégories : proposition, Claude, mémoire des corrections', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'RANGE-MOIRE';
  const F = `foyers/${CODE}/`;
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    // L'autre iPhone a déjà corrigé le rangement des tomates : au frigo.
    [F + 'prix/categories', { entries: { 'nom:tomate': { location: 'frigo', at: 1 } } }],
    [F + 'courses/lardons', { name: 'Lardons', quantity: '', checked: true, addedBy: 'Kevin', createdAt: 1 }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-sonnet-5-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('categories-memoire', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $$, click, type, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const docs = (sub) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + sub + '/')).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  const product = (name) => docs('produits').find((d) => d.name === name);
  const memory = () => globalThis.__db.docs.get(F + 'prix/categories')?.entries ?? {};
  const category = () => sheet().querySelector('[name="category"]').value;
  const place = () => sheet().querySelector('[data-action="set-loc"][aria-pressed="true"]')?.dataset.value;

  // Faux Claude : rangement d'un nom inconnu, ou lecture d'un ticket.
  const calls = [];
  globalThis.fetch = async (_url, opts) => {
    const body = JSON.parse(opts.body);
    const tool = body.tools[0].name;
    calls.push({ tool, model: body.model, text: body.messages[0].content.find((c) => c.type === 'text')?.text ?? '' });
    const input = tool === 'ranger_produit' ? { categorie: 'condiments', lieu: 'placard' } : { produits: [
      { nom: 'Gnocchis', texte_ticket: 'GNOCCHI', categorie: 'feculents', nombre: 1, contenance: '500 g', lieu: 'placard' },
      { nom: 'Steak haché', texte_ticket: 'STEAK HACHE', categorie: 'viande', nombre: 2, contenance: '', lieu: 'frigo' }] };
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', name: tool, input }] }) };
  };
  const manual = async (name) => {
    await click('[data-action="add-menu"]');
    await click(sheet().querySelector('[data-action="manual"]'), 400);
    await type(sheet().querySelector('[name="name"]'), name);
    await type(sheet().querySelector('[name="name"]'), name, 'change');
    await tick(30);
  };
  const close = () => click(sheet().querySelector('[data-action="close"]'), 350);
  await tick(80);

  console.log('\n— Proposition d\'après le nom —');
  await manual('Farine de blé fluide spéciale sauces');
  log(category() === 'patisserie' && place() === 'placard', `« Farine… spéciale sauces » : ${category()}, ${place()}`);
  await close();
  await manual('Lapin');
  log(category() === 'viande' && place() === 'frigo', `« Lapin » : ${category()}, ${place()}`);
  await close();
  log(!calls.length, 'Noms reconnus : aucun appel à Claude');

  console.log('\n— Nom inconnu : Claude —');
  await manual('Gomasio');
  log(category() === 'condiments' && place() === 'placard', `« Gomasio » : proposé par Claude (${category()}, ${place()})`);
  log(calls.length === 1 && calls[0].tool === 'ranger_produit' && calls[0].model === 'claude-haiku-4-5', 'Un seul appel, modèle économique');
  await close();
  await manual('Gomasio');
  log(calls.length === 1 && category() === 'condiments', 'Même nom : réponse réutilisée, pas de nouvel appel');
  await close();

  console.log('\n— Mémoire des corrections —');
  await manual('Gnocchis');
  log(category() === 'feculents' && place() === 'placard', 'Gnocchis : proposés en féculents, au placard');
  await type(sheet().querySelector('[name="category"]'), 'traiteur', 'change');
  await click(sheet().querySelector('[data-action="set-loc"][data-value="frigo"]'));
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(memory()['nom:gnocchi']?.category === 'traiteur' && memory()['nom:gnocchi']?.location === 'frigo', 'Correction retenue (partagée avec l\'autre iPhone) : traiteur, frigo');
  await manual('gnocchi');
  log(category() === 'traiteur' && place() === 'frigo', 'Même produit plus tard : la correction est reprise');
  await close();
  await manual('Steak haché');
  log(category() === 'viande' && !memory()['nom:hache steak'], 'Sans correction : rien n\'est retenu');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  await click($$('.product-main').find((b) => b.textContent.includes('Steak haché')), 400);
  await click(sheet().querySelector('[data-action="set-loc"][data-value="congelateur"]'));
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(product('Steak haché').location === 'congelateur' && !memory()['nom:hache steak'], 'Déplacer un produit existant au congélateur (le congeler) n\'est pas retenu');

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
  await click('[data-action="add-menu"]');
  await click(sheet().querySelector('[data-action="ticket"]'), 400);
  await click(sheet().querySelector('[data-action="analyze"]'), 80);
  log(calls.at(-1).text.includes('- patisserie : Farine, sucre et pâtisserie'), 'Claude reçoit le sens de chaque catégorie');
  const line = (name) => [...sheet().querySelectorAll('.receipt-line')].find((l) => l.querySelector('input').value === name);
  log(line('Gnocchis').querySelector('[data-field="location"]').value === 'frigo', 'Ticket : la correction passe avant Claude (gnocchis au frigo)');
  await type(line('Steak haché').querySelector('[data-field="location"]'), 'congelateur', 'change');
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  const gnocchis = docs('produits').filter((d) => d.name === 'Gnocchis').at(-1);
  log(gnocchis?.category === 'traiteur' && gnocchis.location === 'frigo', 'Gnocchis du ticket : traiteur, frigo');
  log(memory()['nom:hache steak']?.location === 'congelateur', 'Lieu changé à la vérification du ticket : retenu');

  console.log('\n— Fruits et légumes, liste de courses —');
  await click('[data-action="add-menu"]');
  await click(sheet().querySelector('[data-action="produce"]'), 400);
  await click([...sheet().querySelectorAll('.produce-chip')].find((c) => c.dataset.name === 'Tomates'));
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  log(product('Tomates')?.location === 'frigo' && product('Tomates').dateKind === 'estimee', 'Tomates : au frigo, comme corrigé sur l\'autre iPhone');
  await click('.tab[data-tab="courses"]');
  await click($$('[data-action="item-to-fridge"]').find((b) => b.getAttribute('aria-label').includes('Lardons')), 400);
  log(category() === 'charcuterie' && place() === 'frigo', `Lardons rangés depuis les courses : ${category()}, ${place()}`);
  await close();
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');
  log(!P.errors.length, 'Aucune erreur JS');
});
