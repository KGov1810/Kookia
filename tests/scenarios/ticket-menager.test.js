// Scénario : ticket de caisse avec articles non alimentaires, rapprochement de la liste de courses par Claude,
// date estimée du pain, long ticket (plafond relevé).
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test('Ticket : non alimentaire, liste de courses, pain', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'TICKE-TMENA';
  const F = `foyers/${CODE}/`;
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const item = (name, n) => [F + 'courses/' + name, { name, quantity: '', checked: false, addedBy: 'Kevin', createdAt: n }];
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    item('Glace', 1), item('Steak haché', 2), item('Pommes', 3), item('Liquide vaisselle', 4), item('Papier toilette', 5), item('Lait', 6)
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-sonnet-5-5', householdCode: CODE, firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('ticket-menager', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const docs = (sub) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + sub + '/')).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  const product = (name) => docs('produits').find((d) => d.name === name);
  const listNames = () => docs('courses').map((c) => c.name).sort();

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
  let answer = [];
  let request = null;
  globalThis.fetch = async (_url, opts) => {
    request = JSON.parse(opts.body);
    const prompt = request.messages[0].content.find((c) => c.type === 'text').text;
    // Comme Claude : l'identifiant vient de la liste numérotée envoyée (« L3 : Papier toilette »).
    const produits = answer.map((l) => (l.liste?.startsWith('=') ? { ...l, liste: new RegExp(`(L\\d+) : ${l.liste.slice(1)}\\n`).exec(prompt)?.[1] ?? '' } : l));
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: { produits } }] }) };
  };
  const line = (nom, texte, categorie, nombre, contenance, lieu, prix, alimentaire, liste) => ({ nom, texte_ticket: texte, categorie, nombre, contenance, lieu, prix, alimentaire, liste });
  const scan = async () => {
    await click('.tab[data-tab="frigo"]');
    await click('[data-action="add-menu"]');
    await click(sheet().querySelector('[data-action="ticket"]'), 400);
    await click(sheet().querySelector('[data-action=\"add-photo\"]'), 60); // la fiche s'ouvre d'abord, puis la photo
    await click(sheet().querySelector('[data-action="analyze"]'), 120);
  };
  const items = () => [...sheet().querySelectorAll('.receipt-item')];
  const itemOf = (name) => items().find((i) => i.querySelector('[data-field="name"]').value === name);
  await tick(60);

  console.log('\n— Ticket mixte : alimentaire, non alimentaire, liste de courses —');
  answer = [
    line('Glace Nutella en pot', '230G POT GLACE NUT', 'surgele', 2, '230 g', 'congelateur', 8.98, true, '=Glace'),
    line('Viande hachée 5 %', '800G HACHE VRAC 5%', 'viande', 2, '800 g', 'frigo', 28.38, true, '=Steak haché'),
    line('Pommes de terre', 'PDT CONSO 2,5KG', 'legumes', 1, '2,5 kg', 'fruits', 2.99, true, ''),
    line('Baguette tradition', 'BAGUETTE TRADI', 'boulangerie', 2, '', 'placard', 2.4, true, ''),
    line('Pain de mie complet', 'PAIN MIE COMPLET 500G', 'boulangerie', 1, '500 g', 'placard', 1.89, true, ''),
    line('Biscottes', 'BISCOTTES X36', 'boulangerie', 1, '', 'placard', 1.65, true, ''),
    line('Liquide vaisselle citron', 'LIQ VAISS CITRON 750ML', 'autre', 1, '750 ml', 'placard', 1.89, false, '=Liquide vaisselle'),
    line('Croquettes pour chat', 'CROQ CHAT 2KG', 'autre', 1, '2 kg', 'placard', 7.9, false, '')
  ];
  await scan();
  const text = request.messages[0].content.find((c) => c.type === 'text').text;
  const schema = request.tools[0].input_schema.properties.produits.items;
  log(request.max_tokens === 16000 && schema.required.includes('alimentaire') && schema.required.includes('liste'), 'Demande : 16 000 jetons au plus, champs « alimentaire » et « liste » obligatoires');
  log(text.includes('L1 : Glace') && text.includes('L6 : Lait') && text.includes('« Pommes » ≠ « Pommes de terre »') && text.includes('nourriture et litière pour animaux'), 'Consigne : liste de courses numérotée, homonymes à éviter, non alimentaire détaillé');
  log($$('.sheet h2.section').some((h) => h.textContent.includes('Non alimentaire2')) && sheet().textContent.includes('6 produits reconnus, et 2 articles non alimentaires (grisés, non ajoutés)'), 'Section « Non alimentaire » (2), annoncée en haut');
  log(itemOf('Liquide vaisselle citron').querySelector('.receipt-line').classList.contains('off') && itemOf('Croquettes pour chat').querySelector('[data-action="toggle-line"]').getAttribute('aria-checked') === 'false', 'Non alimentaire : grisé et décoché');
  log(itemOf('Glace Nutella en pot').querySelector('.list-toggle').textContent.includes('Retirer « Glace » de la liste') && itemOf('Viande hachée 5 %').querySelector('.list-toggle').textContent.includes('« Steak haché »'), 'Claude rapproche « Glace » et « Steak haché » de leurs produits précis');
  log(!itemOf('Pommes de terre').querySelector('.list-toggle'), '« Pommes de terre » ne retire pas « Pommes »');
  log(itemOf('Liquide vaisselle citron').querySelector('.list-toggle[aria-pressed="true"]'), 'Le liquide vaisselle acheté sera retiré de la liste, même s\'il ne va pas au stock');
  await click(itemOf('Viande hachée 5 %').querySelector('[data-action="toggle-list"]'));
  log(itemOf('Viande hachée 5 %').querySelector('.list-toggle').getAttribute('aria-checked') === 'false', 'Un toucher : « Steak haché » reste sur la liste (case décochée)');
  log(sheet().textContent.includes('Retirés de la liste de courses : Glace, Liquide vaisselle.'), 'Récapitulatif : Glace et Liquide vaisselle retirés');
  await click(itemOf('Croquettes pour chat').querySelector('[data-action="toggle-line"]'));
  log(sheet().querySelector('#receipt-total').textContent.startsWith('Total des lignes cochées : 54,19 €'), `Total des lignes cochées (croquettes comprises) : ${sheet().querySelector('#receipt-total').textContent}`);
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 400);
  log(product('Croquettes pour chat')?.category === 'autre' && !product('Liquide vaisselle citron'), 'Croquettes cochées : ajoutées ; liquide vaisselle : non');
  log(JSON.stringify(listNames()) === JSON.stringify(['Lait', 'Papier toilette', 'Pommes', 'Steak haché']), `Liste de courses : ${listNames().join(', ')}`);
  const achats = docs('mouvements').filter((m) => m.type === 'achat').map((m) => m.name);
  log(!achats.includes('Liquide vaisselle citron') && achats.includes('Glace Nutella en pot'), 'Statistiques : le non alimentaire décoché n\'est pas compté');
  log(product('Baguette tradition')?.dateKind === 'estimee' && product('Baguette tradition').expiry === iso(2) && product('Pain de mie complet')?.expiry === iso(7) && product('Biscottes')?.dateKind === 'aucune', 'Pain : baguette 2 jours, pain de mie 7 jours, biscottes sans date');
  log($$('.product').some((r) => r.textContent.includes('Baguette tradition')) && $$('h2.section').some((h) => h.textContent.startsWith('À consommer vite')), 'Baguette « à consommer vite » dans le stock');

  console.log('\n— Ticket de droguerie : seulement du non alimentaire —');
  answer = [line('Papier toilette', 'PQ DOUX X12', 'autre', 1, '', 'placard', 5.49, false, '=Papier toilette')];
  await scan();
  const before = docs('produits').length;
  log(sheet().querySelector('.sheet-body [data-action="confirm"]').textContent.includes('Retirer 1 article de la liste'), 'Rien à ajouter : « Retirer 1 article de la liste »');
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 400);
  log(!listNames().includes('Papier toilette') && docs('produits').length === before && $('#toast').textContent.includes('1 article retiré de la liste'), 'Papier toilette retiré de la liste, rien ajouté au stock');

  console.log('\n— Réponse sans rapprochement (ancien format) : rapprochement local —');
  answer = [
    { nom: 'Pommes de terre', texte_ticket: 'PDT 2,5KG', categorie: 'legumes', nombre: 1, contenance: '2,5 kg', lieu: 'fruits', prix: 2.99 },
    { nom: 'Lait demi-écrémé UHT', texte_ticket: 'LAIT 1/2 ECR UHT', categorie: 'laitier', nombre: 6, contenance: '1 L', lieu: 'placard', prix: 5.94 }
  ];
  await scan();
  log(!itemOf('Pommes de terre').querySelector('.list-toggle') && itemOf('Lait demi-écrémé UHT').querySelector('.list-toggle')?.textContent.includes('« Lait »'), 'Local : « Lait » retrouvé, « Pommes » non');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  console.log('\n— Fiche : pain saisi à la main —');
  await click('[data-action="add-menu"]');
  await click(sheet().querySelector('[data-action="manual"]'), 400);
  const name = sheet().querySelector('[name="name"]');
  name.value = 'Baguette'; name.dispatchEvent(new w.Event('input', { bubbles: true })); name.dispatchEvent(new w.Event('change', { bubbles: true }));
  await tick(80);
  log(sheet().querySelector('[data-action="set-kind"][data-value="estimee"]')?.getAttribute('aria-pressed') === 'true' && sheet().querySelector('[name="expiry"]').value === iso(2), 'Fiche : « Baguette » → au placard, date estimée dans 2 jours');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  log(!P.errors.length, `Aucune erreur JS ${P.errors.join(' ')}`);
});
