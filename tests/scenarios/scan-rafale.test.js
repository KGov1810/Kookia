// Scénario : scanner plusieurs produits à la suite (menu +), puis vérifier et tout ajouter d'un coup.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test('Scanner plusieurs produits', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const CODE = 'RAFAL-ESCAN';
  const F = `foyers/${CODE}/`;
  globalThis.__db = { docs: new Map([[`foyers/${CODE}`, { createdBy: 'Kevin' }]]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: '', model: 'claude-sonnet-5-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('scan-rafale', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, tick, w } = P;
  const sheet = () => $$('.sheet').at(-1);
  const docs = (sub) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + sub + '/')).map(([, v]) => v);
  const product = (name) => docs('produits').find((d) => d.name === name);
  const OFF = {
    3017620422003: { product_name_fr: 'Pâte à tartiner', brands: 'Nutella', quantity: '400 g', categories_tags: ['en:spreads'], image_front_small_url: 'https://images.openfoodfacts.org/n.jpg' },
    3228021170015: { product_name_fr: 'Yaourt nature', brands: 'Danone', quantity: '4 x 125 g', categories_tags: ['en:yogurts'], image_front_small_url: 'https://images.openfoodfacts.org/y.jpg' },
    2000000000017: { product_name_fr: 'Escalopes de poulet', brands: '', quantity: '300 g', categories_tags: ['en:chickens'] }
  };
  globalThis.fetch = async (url) => {
    const code = Object.keys(OFF).find((c) => String(url).includes(c));
    if (code) return { ok: true, status: 200, json: async () => ({ status: 1, product: OFF[code] }) };
    return { ok: false, status: 404, json: async () => ({ status: 0 }) };
  };
  const scan = async (digits) => {
    await type('.scan-manual input', digits);
    $('.scan-manual').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
    await tick(60);
  };
  const tray = () => $$('.tray-line').map((l) => `${l.querySelector('.tray-name').textContent.trim()} ${l.querySelector('b').textContent.trim()}`);
  await tick(50);

  console.log('\n— Le même code relu par la caméra —');
  const { found } = await import('../../src/views/scanner/scanner.js');
  const seen = [];
  const fake = { continuous: true, seen: new Map(), onCode: (c) => seen.push(c) };
  found(fake, '111'); found(fake, '111'); found(fake, '222'); found(fake, '111', { manual: true });
  log(seen.join() === '111,222,111', `Relu tant qu'il est devant la caméra : compté une fois ; tapé à la main : compté (${seen.join()})`);

  console.log('\n— Rafale —');
  await click('[data-action="add-menu"]');
  log(sheet().textContent.includes('Scanner plusieurs produits') && sheet().textContent.includes('Un bip par produit, vérification à la fin'), 'Menu + : « Scanner plusieurs produits »');
  await click(sheet().querySelector('[data-action="scan-many"]'), 450);
  log($('.scanner.continuous') && $('.scan-done').hidden && $('.scan-top button').textContent === 'Terminer', 'Scanner ouvert en rafale ; « Vérifier » caché tant que rien n\'est scanné');
  await scan('3228021170015');
  log($('.scanner') && $('.scan-manual input').value === '' && tray()[0] === 'Yaourt nature (Danone) × 1', `Premier bip : le scanner reste ouvert, la ligne apparaît (${tray().join(' | ')})`);
  await scan('3228021170015');
  log(tray()[0] === 'Yaourt nature (Danone) × 2' && tray().length === 1, 'Même produit tapé deux fois : × 2');
  await scan('3017620422003');
  await click($$('.tray-line')[0].querySelector('[data-action="tray-plus"]'));
  log(tray()[0] === 'Pâte à tartiner (Nutella) × 2', '« + » sur la ligne : × 2');
  await scan('2000000000017');
  await scan('12345678');
  log(tray().length === 4 && tray()[0].startsWith('Code 12345678 inconnu') && $('.scan-done').textContent === 'Vérifier 4 produits' && !$('.scan-done').hidden, `Code inconnu signalé ; « Vérifier 4 produits » (${tray().join(' | ')})`);

  console.log('\n— Vérification —');
  await click('.scan-done', 400);
  log(!$('.scanner') && sheet().textContent.includes('Produits scannés'), 'Fiche « Produits scannés »');
  const lines = () => [...sheet().querySelectorAll('.batch-line')];
  const lineOf = (text) => lines().find((l) => l.querySelector('input').value.includes(text));
  log(lines().length === 4 && lines()[0].classList.contains('off') && lines()[0].querySelector('input').value === '', 'Code inconnu : ligne décochée, nom à taper');
  log(lineOf('Yaourt').querySelector('output').textContent === '8' && lineOf('Yaourt').querySelector('select').value === 'frigo', 'Yaourts : 2 packs de 4 = 8, au frigo');
  log(lineOf('Pâte à tartiner').querySelector('select').value === 'placard' && lineOf('Escalopes').querySelector('select').value === 'frigo', 'Pâte à tartiner au placard, escalopes au frigo');
  const unknown = lines()[0].querySelector('input');
  await type(unknown, 'Pesto frais');
  log(!lines()[0].classList.contains('off') && sheet().querySelector('#batch-confirm button').textContent.includes('Ajouter 4 produits au stock'), 'Nom tapé : la ligne se coche, « Ajouter 4 produits au stock »');
  await click(lineOf('Escalopes').querySelector('[data-action="line-plus"]'));
  await click(sheet().querySelector('#batch-confirm [data-action="confirm"]'), 400);

  console.log('\n— Ajoutés au stock —');
  const yaourt = product('Yaourt nature (Danone)');
  log(yaourt?.count === 8 && yaourt.quantity === '125 g' && yaourt.barcode === '3228021170015' && yaourt.imageUrl.includes('y.jpg') && yaourt.dateKind === 'estimee' && yaourt.expiry === iso(14), 'Yaourts : 8 × 125 g, code-barres et photo gardés, ≈ 14 jours');
  log(product('Pâte à tartiner (Nutella)')?.count === 2 && product('Pâte à tartiner (Nutella)').location === 'placard', 'Pâte à tartiner : 2, au placard');
  log(product('Escalopes de poulet')?.count === 2 && product('Escalopes de poulet').expiry === '', 'Escalopes : 2, date à compléter');
  log(product('Pesto frais')?.barcode === '12345678' && product('Pesto frais').location === 'frigo', 'Pesto frais : nom tapé, code-barres gardé');
  log($('#toast').textContent.includes('4 produits ajoutés au stock') && $('#toast').textContent.includes('dates à compléter'), `Message (${$('#toast').textContent})`);
  const history = docs('historique').sort((a, b) => a.clientAt - b.clientAt).at(-1);
  log(history?.scope === 'stock' && history.action === 'ajout' && history.name === '4 produits', 'Historique : « a ajouté 4 produits »');
  log(docs('mouvements').filter((m) => m.type === 'achat').length === 4, 'Statistiques : 4 achats notés');
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');
  log(!P.errors.length, 'Aucune erreur JS');
});
