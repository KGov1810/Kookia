// Scénario : Stock de toute la maison : lieux, dates, congélation, ticket.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { readAllCss, readProjectFile } from '../helpers/files.js';

test("Stock de toute la maison : lieux, dates, congélation, ticket", async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const monthsAgo = (m) => { const d = new Date(); d.setMonth(d.getMonth() - m); return d.getTime(); };
  const CODE = 'KOOKI-ABCDE';
  const P0 = `foyers/${CODE}/produits/`, C0 = `foyers/${CODE}/courses/`;
  const prod = (name, extra) => ({ name, expiry: '', category: 'autre', quantity: '', count: 1, barcode: '', addedBy: 'Kevin', createdAt: Date.now(), image: '', imageUrl: '', ...extra });
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [P0 + 'poulet', prod('Filet de poulet', { expiry: iso(1), category: 'viande' })],                       // ancien produit : sans lieu ni type
    [P0 + 'riz', prod('Riz basmati', { location: 'placard', dateKind: 'aucune', category: 'epicerie', createdAt: monthsAgo(8) })],
    [P0 + 'pates', prod('Pâtes', { location: 'placard', dateKind: 'ddm', expiry: iso(-10), category: 'epicerie' })],
    [P0 + 'yaourt', prod('Yaourt', { location: 'frigo', dateKind: 'dlc', expiry: iso(-2), category: 'laitier' })]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-haiku-4-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('kookia', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, text, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const docs = (prefix) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(prefix)).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  const row = (name) => $$('.product').find((r) => r.querySelector('.product-name').textContent === name);
  const sections = () => $$('h2.section').map((h) => h.childNodes[0].textContent.trim());
  await tick(50);

  console.log('\n— Nom, onglet et lieux —');
  const manifest = JSON.parse(readProjectFile('public/manifest.json'));
  const indexHtml = readProjectFile('index.html');
  log(manifest.name === 'Kookia' && manifest.short_name === 'Kookia' && indexHtml.includes('<title>Kookia</title>') && indexHtml.includes('content="Kookia"'), 'Nom Kookia : manifeste, titre et écran d\'accueil');
  log($('.tab[data-tab="frigo"] span').textContent === 'Stock' && $('h1').textContent === 'Stock', 'Onglet et écran « Stock »');
  const chips = $$('.filter-chip').map((c) => c.textContent.replace(/\s+/g, ' ').trim());
  log(chips.join(' | ') === 'Tout4 | Frigo2 | Congélateur0 | Placard2 | Fruits & légumes0', `Filtre par lieu : ${chips.join(' | ')}`);
  log(row('Filet de poulet').textContent.includes('Frigo'), 'Ancien produit (sans lieu) rangé au frigo');

  console.log('\n— Types de date —');
  log(sections().join(' | ') === 'Périmés | À consommer vite | Oubliés depuis longtemps', `Sections : ${sections().join(' | ')}`);
  log(row('Yaourt').querySelector('.days').classList.contains('expired'), 'Yaourt (DLC dépassée) : « Périmés »');
  log(row('Pâtes').querySelector('.days').classList.contains('soon') && row('Pâtes').closest('.list').previousElementSibling?.textContent !== 'Périmés', 'Pâtes (DDM dépassée) : « À consommer vite », pas périmées');
  log(row('Riz basmati').querySelector('.days b').textContent === '8' && row('Riz basmati').querySelector('.days small').textContent === 'mois ici', 'Riz sans date : « 8 mois ici », section oubliés');
  await click(row('Pâtes').querySelector('.product-main'), 400);
  log(sheet().querySelector('.expiry-status').textContent.includes('dépassée depuis 10 jours : souvent encore bon'), 'Pâtes : « de préférence » dépassée, souvent encore bonne');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  console.log('\n— Filtre par lieu —');
  await click('[data-action="set-location"][data-value="placard"]');
  log($$('.product').length === 2 && !row('Yaourt'), 'Filtre Placard : riz et pâtes seulement');
  log(!row('Riz basmati').textContent.includes('Placard,'), 'Lieu non répété quand on filtre');
  await click('[data-action="set-location"][data-value=""]');

  console.log('\n— Congeler —');
  await click(row('Filet de poulet').querySelector('.product-main'), 400);
  await click(sheet().querySelector('[data-action="freeze"]'), 350);
  const poulet = docs(P0).find((d) => d.name === 'Filet de poulet');
  const sixMonths = (() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth() + 9, d.getDate()); })();
  log(poulet.location === 'congelateur' && poulet.dateKind === 'congele' && poulet.frozenAt === iso(0) && poulet.expiry === `${sixMonths.getFullYear()}-${String(sixMonths.getMonth() + 1).padStart(2, '0')}-${String(sixMonths.getDate()).padStart(2, '0')}`, 'Poulet congelé : au congélateur, 9 mois conseillés (reclassé en volaille)');
  log(row('Filet de poulet').querySelector('.days b').textContent === '≈9' && row('Filet de poulet').querySelector('.days small').textContent === 'mois', 'Compteur : « ≈9 mois »');
  log(text().includes('au congélateur, idéalement avant'), 'Message de confirmation');

  console.log('\n— Fruits et légumes sans code-barres —');
  await click('[data-action="add-menu"]');
  await click(sheet().querySelector('[data-action="produce"]'), 400);
  const pick = (name) => [...sheet().querySelectorAll('.produce-chip')].find((c) => c.dataset.name === name);
  log(sheet().querySelectorAll('.produce-chip').length === 46, 'Grille : 46 fruits et légumes');
  await click(pick('Bananes')); await click(pick('Bananes')); await click(pick('Carottes'));
  log(pick('Bananes').querySelector('b').textContent === '2', 'Bananes touchées 2 fois → 2');
  await type(sheet().querySelector('[name="produce-search"]'), 'topinambour');
  log(sheet().querySelectorAll('.produce-chip').length === 1 && sheet().querySelector('.produce-chip.custom'), 'Recherche sans résultat : « Ajouter « topinambour » »');
  await click(sheet().querySelector('.produce-chip.custom'));
  await click([...sheet().querySelectorAll('[data-action="minus"]')].find((b) => b.dataset.name === 'Carottes'));
  log(!sheet().textContent.includes('Carottes') || ![...sheet().querySelectorAll('.field')].some((f) => f.textContent.includes('Carottes')), 'Bouton − : carottes retirées de la sélection');
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  const bananes = docs(P0).find((d) => d.name === 'Bananes');
  const topi = docs(P0).find((d) => d.name === 'topinambour');
  log(bananes?.count === 2 && bananes.location === 'fruits' && bananes.dateKind === 'estimee' && bananes.expiry === iso(5), 'Bananes : 2, fruits & légumes, date estimée (5 jours)');
  log(topi?.location === 'fruits' && topi.expiry === iso(7) && !docs(P0).some((d) => d.name === 'Carottes'), 'Topinambour : 7 jours par défaut ; carottes non ajoutées');
  log(row('Bananes').querySelector('.days b').textContent === '≈5', 'Compteur estimé : « ≈5 »');

  console.log('\n— Saisie : lieu et type de date —');
  await click('[data-action="set-location"][data-value="placard"]');
  await click('.fab', 0); await click(sheet().querySelector('[data-action="manual"]'), 400);
  log(sheet().querySelector('[data-action="set-loc"][data-value="placard"]').getAttribute('aria-pressed') === 'true', 'Ajout depuis le filtre Placard : lieu Placard présélectionné');
  log(!sheet().querySelector('[name="expiry"]') && sheet().textContent.includes("l'app suit depuis combien de temps"), 'Placard : sans date par défaut (ancienneté)');
  await type(sheet().querySelector('[name="name"]'), 'Lentilles');
  await click(sheet().querySelector('[data-action="set-kind"][data-value="ddm"]'));
  log(sheet().querySelector('[name="expiry"]') && sheet().textContent.includes('De préférence avant le') && sheet().textContent.includes('+6 mois'), 'Option « Date sur le paquet (DDM) » : champ et raccourcis en mois');
  await click(sheet().querySelector('[data-action="set-kind"][data-value="aucune"]'));
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(docs(P0).find((d) => d.name === 'Lentilles')?.dateKind === 'aucune' && text().includes('Lentilles : ajouté au placard'), 'Lentilles enregistrées au placard, sans date');
  await click('[data-action="set-location"][data-value=""]');
  await click('.fab', 0); await click(sheet().querySelector('[data-action="manual"]'), 400);
  await click(sheet().querySelector('[data-action="set-loc"][data-value="fruits"]'));
  await type(sheet().querySelector('[name="name"]'), 'Avocat');
  await type(sheet().querySelector('[name="name"]'), 'Avocat', 'change');
  log(sheet().querySelector('[name="expiry"]').value === iso(4), 'Fruits & légumes : « Avocat » → 4 jours estimés');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  console.log('\n— Code-barres d\'un surgelé —');
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ status: 1, product: { product_name_fr: 'Frites au four', brands: 'McCain', quantity: '1 kg', categories_tags: ['en:frozen-foods', 'en:fries'] } }) });
  Object.defineProperty(w.navigator, 'mediaDevices', { configurable: true, value: undefined });
  await click('[data-action="add-menu"]'); await click(sheet().querySelector('[data-action="scan"]'), 40);
  await type('.scan-manual input', '8710438000000');
  $('.scan-manual').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick(80);
  log(sheet().querySelector('[data-action="set-loc"][data-value="congelateur"]').getAttribute('aria-pressed') === 'true' && sheet().querySelector('[name="frozenAt"]'), 'Frites surgelées scannées : congélateur, « Congelé le »');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  console.log('\n— Courses : déjà en stock —');
  await click('.tab[data-tab="courses"]');
  await type('#new-item', 'Riz');
  $('#add-item').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  log(text().includes('Riz : ajouté. En stock : 1 au placard, à vérifier avant d\'acheter.'), 'Ajout « Riz » : avertissement « déjà 1 au placard »');
  log($$('.shop-item').find((r) => r.textContent.includes('Riz'))?.querySelector('.in-stock')?.textContent === 'En stock : 1 au placard', 'Article : « En stock : 1 au placard »');

  console.log('\n— Recettes : tout le stock —');
  let prompt = '';
  globalThis.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    prompt = body.messages[0].content[0].text;
    globalThis.__system = body.system;
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: { recettes: [] } }] }) };
  };
  await click('.tab[data-tab="recettes"]');
  await click('[data-action="generate"]', 80);
  log(prompt.includes('Riz basmati – pâtes, riz et céréales – au placard depuis 8 mois (pas de date)') && prompt.includes('au congélateur depuis') && prompt.includes('(à décongeler)'), 'Claude reçoit le placard (ancienneté) et le congélateur');
  log(prompt.includes('À LA MAISON (frigo, congélateur, placard, fruits et légumes)') && globalThis.__system.includes('date limite (DLC) dépassée interdit le produit'), 'Consignes : toute la maison, DLC vs DDM');
  log(!prompt.includes('[P') || !prompt.includes('Yaourt'), 'Yaourt périmé (DLC) exclu des recettes');

  console.log('\n— Ticket : chaque produit à sa place —');
  w.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, drawImage() {}, set fillStyle(v) {} });
  w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,VA==';
  globalThis.URL.createObjectURL = () => 'blob:x'; globalThis.URL.revokeObjectURL = () => {};
  globalThis.Image = class { set src(v) { this.naturalWidth = 800; this.naturalHeight = 1600; setTimeout(() => this.onload(), 1); } };
  const origCreate = w.document.createElement.bind(w.document);
  w.document.createElement = (tag) => { const el = origCreate(tag); if (tag === 'input') el.click = () => setTimeout(() => { Object.defineProperty(el, 'files', { value: [new w.File(['x'], 't.jpg', { type: 'image/jpeg' })] }); el.dispatchEvent(new w.Event('change')); }, 5); return el; };
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: { produits: [
    { nom: 'Steaks hachés surgelés', texte_ticket: 'STEAK HACHE SURG', categorie: 'surgele', nombre: 1, contenance: '1 kg', lieu: 'congelateur' },
    { nom: 'Spaghetti', texte_ticket: 'SPAGHETTI 500G', categorie: 'epicerie', nombre: 2, contenance: '500 g', lieu: 'placard' },
    { nom: 'Pommes de terre', texte_ticket: 'PDT 2KG', categorie: 'fruits_legumes', nombre: 1, contenance: '2 kg', lieu: 'fruits' },
    { nom: 'Crème fraîche', texte_ticket: 'CREME FR', categorie: 'laitier', nombre: 1, contenance: '20 cl', lieu: 'frigo' }] } }] }) });
  await click('.tab[data-tab="frigo"]');
  await click('[data-action="add-menu"]'); await click(sheet().querySelector('[data-action="ticket"]'), 400);
  await click(sheet().querySelector('[data-action="analyze"]'), 80);
  log([...sheet().querySelectorAll('.receipt-location')].map((s) => s.value).join() === 'congelateur,placard,fruits,frigo', 'Vérification : lieu proposé pour chaque ligne');
  const sel = [...sheet().querySelectorAll('.receipt-location')][3];
  sel.value = 'frigo'; sel.dispatchEvent(new w.Event('change', { bubbles: true }));
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  const get = (n) => docs(P0).find((d) => d.name === n);
  log(get('Steaks hachés surgelés')?.dateKind === 'congele' && get('Steaks hachés surgelés').expiry, 'Surgelés : congélateur, durée conseillée');
  log(get('Spaghetti')?.dateKind === 'aucune' && get('Spaghetti').location === 'placard' && get('Spaghetti').count === 2, 'Spaghetti : placard, sans date, ×2');
  log(get('Pommes de terre')?.dateKind === 'estimee' && get('Pommes de terre').expiry === iso(45), 'Pommes de terre : fruits & légumes, ≈ 45 jours');
  log(get('Crème fraîche')?.dateKind === 'dlc' && get('Crème fraîche').expiry === '', 'Crème fraîche : frigo, date à compléter');
  log(sections()[0] === 'Date à compléter' && $$('.product').filter((r) => r.querySelector('.days.pending')).length === 1, 'Seule la crème fraîche demande une date');
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');

});
