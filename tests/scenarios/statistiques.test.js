// Scénario : prix des produits, « Jeté », mouvements et onglet Stats.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { readAllCss, readProjectFile } from '../helpers/files.js';
import { monthKey, monthLabel } from '../../src/services/stats/periods.js';

test('Prix, produits jetés et statistiques', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const CODE = 'STATS-KOOKI';
  const F = `foyers/${CODE}/`;
  const prod = (name, extra) => ({ name, expiry: iso(5), category: 'laitier', categoryVersion: 2, quantity: '', count: 1, location: 'frigo', dateKind: 'dlc', frozenAt: '', barcode: '', addedBy: 'Kevin', createdAt: 1, image: '', imageUrl: '', ...extra });
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 15).getTime();
  const longAgo = new Date(now.getFullYear(), now.getMonth() - 14, 15).getTime();
  const old = (type, name, category, unitPrice, count, by, clientAt) => ({ type, name, category, location: 'frigo', count, unitPrice, by, clientAt, productId: '' });
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [F + 'produits/yaourt', prod('Yaourt', { count: 4, unitPrice: 0.5 })],
    [F + 'produits/steak', prod('Steak haché', { category: 'viande', unitPrice: 3.5 })],
    [F + 'produits/comte', prod('Comté', { category: 'fromage', count: 2 })],
    [F + 'mouvements/m-mois-dernier', old('achat', 'Lait', 'laitier', 1, 20, 'Marie', lastMonth)],
    [F + 'mouvements/m-ancien', old('achat', 'Riz', 'feculents', 2.5, 4, 'Kevin', longAgo)],
    [F + 'mouvements/m-pain', old('jete', 'Pain', 'boulangerie', null, 1, 'Kevin', Date.now() - 1000)]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-haiku-4-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('statistiques', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, text, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const row = (name) => $$('.product').find((r) => r.querySelector('.product-name').textContent === name);
  const docs = (sub) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + sub + '/')).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  const product = (name) => docs('produits').find((d) => d.name === name);
  const moves = () => docs('mouvements').filter((m) => !m.id.startsWith('m-')).sort((a, b) => a.clientAt - b.clientAt);
  const lastMove = () => moves().at(-1);
  const memory = () => globalThis.__db.docs.get(F + 'prix/memoire')?.prices ?? {};
  const history = () => docs('historique').sort((a, b) => a.clientAt - b.clientAt).at(-1);
  await tick(80);

  console.log('\n— Prix dans la fiche produit —');
  await click('[data-action="add-menu"]'); await click(sheet().querySelector('[data-action="manual"]'), 400);
  await type(sheet().querySelector('[name="name"]'), 'Lait demi-écrémé');
  await type(sheet().querySelector('[name="name"]'), 'Lait demi-écrémé', 'change');
  log(sheet().querySelector('[name="price"]').value === '' && sheet().textContent.includes('Prix à l\'unité'), 'Champ « Prix à l\'unité » vide pour un produit jamais acheté');
  await type(sheet().querySelector('[name="price"]'), '1,15');
  await click(sheet().querySelector('[data-action="count-plus"]'));
  log(sheet().querySelector('.price-hint').textContent === 'Soit 2,30 € pour 2.', `Total affiché : « ${sheet().querySelector('.price-hint').textContent} »`);
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(product('Lait demi-écrémé')?.unitPrice === 1.15, 'Prix enregistré sur le produit (1,15 €)');
  log(lastMove()?.type === 'achat' && lastMove().count === 2 && lastMove().unitPrice === 1.15 && lastMove().by === 'Kevin', 'Achat noté : 2 × 1,15 €, par Kevin');
  log(memory()['nom:demi ecreme lait']?.price === 1.15, 'Prix mémorisé pour ce nom');

  await click('[data-action="add-menu"]'); await click(sheet().querySelector('[data-action="manual"]'), 400);
  await type(sheet().querySelector('[name="name"]'), 'lait demi ecreme');
  await type(sheet().querySelector('[name="name"]'), 'lait demi ecreme', 'change');
  log(sheet().querySelector('[name="price"]').value === '1,15' && sheet().textContent.includes('Dernier prix payé, à vérifier.'), 'Même produit : dernier prix payé proposé');
  await type(sheet().querySelector('[name="price"]'), '2,4x');
  const before = moves().length;
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(sheet().textContent.includes('Indiquez un prix valide') && moves().length === before, 'Prix illisible : message clair, rien d\'enregistré');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  await click(row('Lait demi-écrémé').querySelector('.product-main'), 400);
  await type(sheet().querySelector('[name="price"]'), '1,25');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(history().action === 'modification' && history().details.includes('Prix : 1,15 € → 1,25 €'), 'Historique : « Prix : 1,15 € → 1,25 € »');
  log(memory()['nom:demi ecreme lait']?.price === 1.25 && moves().length === before, 'Prix mis à jour en mémoire, sans nouvel achat');

  console.log('\n— Consommé et Annuler —');
  await click(row('Yaourt').querySelector('.consume'), 40);
  log(lastMove().type === 'consomme' && lastMove().count === 1 && lastMove().unitPrice === 0.5, 'Rond : consommation de 1 × 0,50 € notée');
  const consumed = moves().length;
  await click('#toast button', 40);
  log(moves().length === consumed - 1 && product('Yaourt').count === 4, 'Annuler : le mouvement disparaît, 4 yaourts');
  await click(row('Yaourt').querySelector('.consume'), 40);

  console.log('\n— Jeté —');
  await click(row('Yaourt').querySelector('.product-main'), 400);
  await click(sheet().querySelector('[data-action="discard"]'));
  const box = () => sheet().querySelector('.discard-box');
  log(box()?.textContent.includes('Combien en jetez-vous ?') && box().querySelector('output').textContent === '1 sur 3', 'Plusieurs unités : on choisit combien (1 sur 3)');
  await click(box().querySelector('[data-action="discard-plus"]'));
  await click(box().querySelector('[data-action="discard-plus"]'));
  log(box().querySelector('[data-action="discard-plus"]').disabled && box().querySelector('output').textContent === '3 sur 3', 'Pas plus que le stock (3 sur 3)');
  await click(box().querySelector('[data-action="discard-minus"]'));
  await click(box().querySelector('[data-action="discard-confirm"]'), 350);
  log(product('Yaourt').count === 1, '2 yaourts jetés : il en reste 1');
  log(lastMove().type === 'jete' && lastMove().count === 2 && lastMove().unitPrice === 0.5, 'Mouvement « jeté » : 2 × 0,50 €');
  log(history().action === 'jete' && history().details.includes('2 sur 3') && history().details.includes('il en reste 1'), 'Historique : « a jeté », « 2 sur 3 », « il en reste 1 »');
  log($('#toast').textContent.includes('Yaourt : 2 jetés, il en reste 1'), 'Message : « Yaourt : 2 jetés, il en reste 1 »');
  await click(row('Steak haché').querySelector('.product-main'), 400);
  await click(sheet().querySelector('[data-action="discard"]'), 350);
  log(!product('Steak haché') && lastMove().type === 'jete' && lastMove().unitPrice === 3.5, 'Une seule unité : jetée directement');
  await click('#toast button', 40);
  log(product('Steak haché') && !moves().some((m) => m.name === 'Steak haché'), 'Annuler : steak remis en stock, mouvement effacé');
  await click(row('Steak haché').querySelector('.product-main'), 400);
  await click(sheet().querySelector('[data-action="discard"]'), 350);
  await click(row('Comté').querySelector('.product-main'), 400);
  await type(sheet().querySelector('[name="price"]'), '6');
  await click(sheet().querySelector('[data-action="consume"]'), 350);
  log(!product('Comté') && lastMove().type === 'consomme' && lastMove().count === 2 && lastMove().unitPrice === 6, 'Consommé (tout) : 2 × 6 € avec le prix saisi dans la fiche');

  console.log('\n— Ticket de caisse avec prix —');
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
  let prompt = '';
  globalThis.fetch = async (_url, opts) => {
    const body = JSON.parse(opts.body);
    prompt = body.messages[0].content.find((c) => c.type === 'text').text;
    const schema = body.tools[0].input_schema.properties.produits.items.properties;
    globalThis.__priceInSchema = Boolean(schema.prix);
    const input = { produits: [
      { nom: 'Pommes', texte_ticket: 'POMME GALA', categorie: 'fruits', nombre: 2, contenance: '', lieu: 'fruits', prix: 3.58 },
      { nom: 'Beurre doux', texte_ticket: 'BEURRE DX 250G', categorie: 'laitier', nombre: 1, contenance: '250 g', lieu: 'frigo' }] };
    return { ok: true, status: 200, json: async () => ({ content: [{ type: 'tool_use', name: body.tools[0].name, input }], stop_reason: 'tool_use' }) };
  };
  await click('[data-action="add-menu"]');
  await click(sheet().querySelector('[data-action="ticket"]'), 400);
  await click(sheet().querySelector('[data-action="analyze"]'), 80);
  log(globalThis.__priceInSchema && prompt.includes('prix : montant payé pour ce produit'), 'Claude doit relever le prix de chaque ligne');
  const line = (name) => [...sheet().querySelectorAll('.receipt-line')].find((l) => l.querySelector('input').value === name);
  log(line('Pommes').querySelector('[data-field="price"]').value === '3,58' && line('Beurre doux').querySelector('[data-field="price"]').value === '', 'Prix lus : Pommes 3,58 €, Beurre sans prix');
  log(sheet().querySelector('#receipt-total').textContent.startsWith('Total des prix : 3,58 € (1 produit sans prix)'), 'Total lu affiché, produit sans prix signalé');
  await type(line('Beurre doux').querySelector('[data-field="price"]'), '2,10');
  log(sheet().querySelector('#receipt-total').textContent.startsWith('Total des prix : 5,68 €.'), 'Prix complété : total mis à jour (5,68 €)');
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  log(product('Pommes')?.unitPrice === 1.79 && product('Beurre doux')?.unitPrice === 2.1, 'Prix à l\'unité : Pommes 3,58 € ÷ 2 = 1,79 €, Beurre 2,10 €');
  log(moves().filter((m) => m.type === 'achat' && ['Pommes', 'Beurre doux'].includes(m.name)).length === 2, 'Deux achats notés');

  console.log('\n— Fruits et légumes : dernier prix connu —');
  await click('[data-action="add-menu"]'); await click(sheet().querySelector('[data-action="produce"]'), 400);
  await click([...sheet().querySelectorAll('.produce-chip')].find((c) => c.dataset.name === 'Pommes'));
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  log(lastMove().name === 'Pommes' && lastMove().unitPrice === 1.79 && lastMove().count === 1, 'Pommes de la grille : 1,79 € repris du ticket');

  console.log('\n— Onglet Stats —');
  log($$('.tab').length === 5 && $('.tab[data-tab="stats"] span').textContent === 'Stats', '5 onglets, dont « Stats »');
  await click('.tab[data-tab="stats"]', 80);
  log($('h1').textContent === 'Statistiques' && $('[data-action="stats-period"][aria-pressed="true"]').textContent === '12 mois', 'Écran Statistiques, « 12 mois » par défaut');
  const spent = () => $('.stats-spent strong').textContent;
  // 2 × 1,15 + 3,58 + 2,10 + 1,79 + 20 (mois dernier) = 29,77 ; le riz d'il y a 14 mois n'est pas compté.
  log(spent() === '29,77 €', `Dépensé sur 12 mois : ${spent()}`);
  log($('.stats-out.consumed b').textContent === '12,50 €' && $('.stats-out.wasted b').textContent === '4,50 €', 'Consommé 12,50 € (yaourt + comté), jeté 4,50 € (yaourts + steak)');
  log(text().includes('26 % de ce qui est sorti du stock a été jeté.'), 'Part jetée : 26 %');
  log(text().includes('Sans prix, non comptés : 1 produit jeté.'), 'Produit sans prix signalé (pain)');
  log($$('.month-col').length === 12 && $('.month-col[aria-pressed="true"]').dataset.value === monthKey(now), '12 mois, le mois en cours sélectionné');
  log($('.month-detail').textContent === `${monthLabel(monthKey(now), { long: true })} : 9,77 € dépensés et 4,50 € jetés.`, `Détail du mois : ${$('.month-detail').textContent}`);
  await click($$('.month-col').at(-2));
  log($('.month-detail').textContent.includes('20,00 € dépensés et 0,00 € jetés'), 'Toucher le mois dernier : 20,00 € dépensés');
  const cats = () => $$('.cat-row').map((r) => r.querySelector('.cat-head span').textContent);
  log(cats()[0].includes('Produits laitiers') && cats()[1].includes('Fruits'), `Catégories, de la plus grosse dépense : ${cats().join(' | ')}`);
  log($$('.cat-row').find((r) => r.textContent.includes('Viande')).textContent.includes('Jeté : 3,50 €'), 'Viande : « Jeté : 3,50 € »');
  const wasted = $$('.waste-row').map((r) => r.textContent.replace(/\s+/g, ' ').trim());
  log(wasted[0] === 'Steak haché 3,50 €' && wasted[1] === 'Yaourt ×2 1,00 €' && wasted[2] === 'Pain prix inconnu', `Les plus jetés : ${wasted.join(' | ')}`);

  console.log('\n— Filtres —');
  await click($$('.cat-row').find((r) => r.textContent.includes('Fruits')));
  log($('[data-stats-filter="what"]').value === 'cat:fruits' && spent() === '5,37 €', 'Toucher une catégorie : filtre « Fruits », 5,37 €');
  await click('[data-action="stats-reset"]');
  await type('[data-stats-filter="person"]', 'Marie', 'change');
  log(spent() === '20,00 €', 'Personne : Marie, 20,00 €');
  await type('[data-stats-filter="person"]', '', 'change');
  await type('[data-stats-filter="what"]', 'rayon:Frais', 'change');
  log(spent() === '29,77 €', 'Rayon Frais : tout est frais ici');
  await type('[data-stats-filter="location"]', 'congelateur', 'change');
  log(text().includes('Rien pour ces filtres sur cette période.'), 'Aucun résultat : message et bouton pour retirer les filtres');
  await click('[data-action="stats-reset"]');
  await click('[data-action="stats-period"][data-value="tout"]', 60);
  log(spent() === '39,77 €' && $$('.month-col').length === 15, 'Tout : le riz d\'il y a 14 mois compté (39,77 €), 15 mois');
  await click('[data-action="stats-period"][data-value="mois"]', 60);
  log(spent() === '9,77 €' && !text().includes('Mois par mois'), 'Ce mois : 9,77 €, pas de graphique sur un seul mois');

  console.log('\n— Règles Firebase pas encore mises à jour —');
  globalThis.__denyStats = true;
  await click('.tab[data-tab="frigo"]');
  await click(row('Yaourt').querySelector('.consume'), 300);
  log(!product('Yaourt') && !$('.note.error'), 'Le stock fonctionne quand même, sans erreur de synchronisation');
  await click('.tab[data-tab="stats"]');
  await click('[data-action="stats-period"][data-value="3mois"]', 60);
  log(text().includes('Les statistiques ne sont pas encore autorisées : recollez les règles Firestore'), 'Onglet Stats : explication claire');
  globalThis.__denyStats = false;

  const rules = readProjectFile('firestore.rules');
  const movesRule = rules.slice(rules.indexOf('match /mouvements'), rules.indexOf('match /historique'));
  log(/allow read, create, delete/.test(movesRule) && !/update/.test(movesRule), 'Règles : mouvements lisibles, ajout et suppression, jamais modifiables');
  log(/collection in \['produits', 'courses', 'recettes', 'prix'\]/.test(rules), 'Règles : mémoire des prix autorisée');
  log(/repeat\(5, 1fr\)/.test(readAllCss()), 'Barre d\'onglets sur 5 colonnes');
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');
  log(!P.errors.length, 'Aucune erreur JS');
});
