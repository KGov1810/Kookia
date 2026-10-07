// Scénario : Historique des changements.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { readAllCss, readProjectFile } from '../helpers/files.js';

test("Historique des changements", async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const CODE = 'HISTO-RIQUE';
  const P0 = `foyers/${CODE}/produits/`, C0 = `foyers/${CODE}/courses/`, R0 = `foyers/${CODE}/recettes/`, H0 = `foyers/${CODE}/historique/`;
  const prod = (name, extra) => ({ name, expiry: iso(5), category: 'laitier', categoryVersion: 2, quantity: '', count: 1, location: 'frigo', dateKind: 'dlc', frozenAt: '', barcode: '', addedBy: 'Kevin', createdAt: 1, image: '', imageUrl: '', ...extra });
  const DAY = 86_400_000;
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [P0 + 'yaourt', prod('Yaourt', { count: 2 })],
    [P0 + 'steak', prod('Steak haché', { category: 'viande' })],
    [P0 + 'creme', prod('Crème fraîche')],
    [C0 + 'lait', { name: 'Lait', quantity: '2', checked: false, addedBy: 'Kevin', createdAt: 1 }],
    [C0 + 'farine', { name: 'Farine', quantity: '', checked: true, addedBy: 'Kevin', createdAt: 2 }],
    [C0 + 'sucre', { name: 'Sucre', quantity: '', checked: false, addedBy: 'Kevin', createdAt: 3 }],
    [R0 + 'gratin', { title: 'Gratin au yaourt', summary: '', difficulty: 'facile', totalMinutes: 20, prepMinutes: 5, servings: 2, batchCooking: false, storageDays: 0, storageTips: '', createdAt: 5, favorite: false, steps: [], usedProductIds: ['yaourt'], ingredients: [{ name: 'Yaourt', quantity: '1', source: 'stock', productId: 'yaourt' }] }],
    [H0 + 'ancienne', { scope: 'stock', action: 'ajout', name: 'Très vieux', details: [], by: 'Marie', clientAt: Date.now() - 100 * DAY }],
    [H0 + 'recente', { scope: 'stock', action: 'ajout', name: 'Récent', details: [], by: 'Marie', clientAt: Date.now() - 2 * DAY }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-haiku-4-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('historique', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, text, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const row = (name) => $$('.product').find((r) => r.querySelector('.product-name').textContent === name);
  const entries = () => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(H0)).map(([, v]) => v).sort((a, b) => a.clientAt - b.clientAt);
  const last = () => entries().at(-1);
  const count = () => entries().length;
  await tick(80);

  console.log('\n— Nettoyage automatique —');
  log(!globalThis.__db.docs.has(H0 + 'ancienne') && globalThis.__db.docs.has(H0 + 'recente'), 'Entrée de plus de 90 jours supprimée, entrée récente gardée');
  log(JSON.parse(w.localStorage.getItem('frigo.settings.v1')).historyPurgedAt > 0, 'Nettoyage mémorisé (une fois par jour au plus)');

  console.log('\n— Stock —');
  await click(row('Yaourt').querySelector('.product-main'), 400);
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(count() === 1, 'Enregistrer sans rien changer : rien de noté');
  await click(row('Yaourt').querySelector('.product-main'), 400);
  await click(sheet().querySelector('[data-action="count-plus"]'));
  await click(sheet().querySelector('[data-action="quick"][data-days="14"]'));
  await click(sheet().querySelector('[data-action="save"]'), 350);
  const fmt = (d) => new Date(...d.split('-').map((x, i) => (i === 1 ? x - 1 : +x))).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  log(last().action === 'modification' && last().name === 'Yaourt' && last().details.includes('Nombre : 2 → 3') && last().details.includes(`Date : ${fmt(iso(5))} → ${fmt(iso(14))}`) && last().by === 'Kevin', `Modification détaillée : ${last().details.join(' ; ')}`);
  await click(row('Yaourt').querySelector('.consume'), 40);
  log(last().action === 'consommation' && last().details[0] === 'il en reste 2', 'Consommation : « il en reste 2 »');
  await click('#toast button', 40);
  log(last().action === 'annulation' && last().details[0] === 'remis en stock : 3 unités', 'Annuler : noté « remis en stock »');
  await click(row('Steak haché').querySelector('.product-main'), 400);
  await click(sheet().querySelector('[data-action="freeze"]'), 350);
  log(last().action === 'modification' && last().details.some((d) => d === 'Lieu : Frigo → Congélateur'), 'Congeler : « Lieu : Frigo → Congélateur »');
  await click(row('Crème fraîche').querySelector('.product-main'), 400);
  await click(sheet().querySelector('[data-action="consume"]'), 350);
  log(last().action === 'suppression' && last().details[0] === 'tout consommé', 'Tout retirer : suppression « tout consommé »');
  await click('[data-action="add-menu"]'); await click(sheet().querySelector('[data-action="produce"]'), 400);
  await click([...sheet().querySelectorAll('.produce-chip')].find((c) => c.dataset.name === 'Bananes'));
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  log(last().action === 'ajout' && last().name === 'Bananes' && last().details[0].includes('Fruits & légumes'), `Ajout : « ${last().details[0]} »`);

  console.log('\n— Courses —');
  await click('.tab[data-tab="courses"]');
  const before = count();
  await click($$('.tick').find((b) => b.getAttribute('aria-label').endsWith('Sucre')), 30);
  log(count() === before, 'Cocher un article : rien de noté');
  await type('#new-item', 'Riz'); await type('#new-qty', '3');
  $('#add-item').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  log(last().scope === 'courses' && last().action === 'ajout' && last().details[0] === 'quantité : 3', 'Ajout aux courses avec quantité');
  await click($$('.shop-text').find((b) => b.textContent.includes('Lait')), 350);
  await click(sheet().querySelector('[data-action="set-qty"][data-value="4"]'));
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(last().action === 'modification' && last().details[0] === 'Quantité : 2 → 4', 'Modification : « Quantité : 2 → 4 »');
  await click('[data-action="clear-checked"]', 30);
  log(last().action === 'panier' && last().name === '2 articles' && last().details[0] === 'Farine, Sucre', 'Panier vidé : un seul résumé « Farine, Sucre »');
  await click($$('[data-action="delete-item"]').find((b) => b.getAttribute('aria-label').includes('Riz')), 30);
  log(last().action === 'suppression' && last().name === 'Riz', 'Suppression d\'un article');
  await click($$('.tick').find((b) => b.getAttribute('aria-label').endsWith('Lait')), 30);
  await click($$('[data-action="item-to-fridge"]').find((b) => b.getAttribute('aria-label').includes('Lait')), 400);
  await click(sheet().querySelector('[data-action="save"]'), 350);
  const two = entries().slice(-2);
  log(two.some((e) => e.scope === 'stock' && e.action === 'ajout' && e.name === 'Lait') && two.some((e) => e.scope === 'courses' && e.action === 'rangement'), 'Rangé dans le stock : ajout au stock + « acheté et rangé »');

  console.log('\n— Recettes —');
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: { recettes: [{ titre: 'Riz cantonais', resume: '', difficulte: 'facile', temps_total_minutes: 20, temps_preparation_minutes: 10, portions: 2, regime: 'omnivore', origine: 'chinoise', calories_par_portion: 500, batch_cooking: false, conservation_jours: 1, conseils_conservation: '', ingredients: [], etapes: [] }] } }] }) });
  await click('.tab[data-tab="recettes"]');
  await click('[data-action="generate"]', 80);
  log(last().scope === 'recettes' && last().action === 'generation' && last().details[0] === 'Riz cantonais', 'Génération : titres des recettes');
  await click($$('.recipe-card').find((c) => c.textContent.includes('Gratin')), 400);
  await click(sheet().querySelector('[data-action="favorite"]'), 30);
  log(last().action === 'favori' && last().name === 'Gratin au yaourt', 'Mise en favori');
  await click(sheet().querySelector('[data-action="cooked"]'), 50);
  log(last().action === 'consommation' && last().details.includes('recette « Gratin au yaourt »'), 'J\'ai cuisiné : consommation avec le nom de la recette');
  await click(sheet().querySelector('[data-action="delete"]'), 350);
  log(last().action === 'suppression' && last().scope === 'recettes', 'Suppression de recette');
  log(entries().filter((e) => e.name !== 'Récent').every((e) => e.by && e.clientAt && e.at), 'Chaque entrée notée par l\'app : prénom, heure');

  console.log('\n— Écran Historique —');
  await click('.tab[data-tab="frigo"]');
  await click('[data-action="open-history"]', 400);
  const items = () => [...sheet().querySelectorAll('.history-item')];
  log(sheet().querySelector('h2.section')?.textContent === "Aujourd'hui" && items().length === count() && [...sheet().querySelectorAll('h2.section')].length === 2, `Groupé par jour : « Aujourd'hui » (${items().length} actions) puis « ${[...sheet().querySelectorAll('h2.section')].at(-1).textContent} »`);
  log(items()[0].querySelector('p').textContent === 'Kevin a supprimé la recette Gratin au yaourt' && /^\d{2}:\d{2}$/.test(items()[0].querySelector('time').textContent), 'Plus récent en premier, avec l\'heure');
  log(items().some((i) => i.textContent.includes('Kevin a modifié Yaourt') && i.textContent.includes('Nombre : 2 → 3')), 'Détail des modifications affiché');
  await click(sheet().querySelector('[data-action="history-scope"][data-value="courses"]'));
  log(items().length > 0 && items().every((i) => /courses|panier|rangé/.test(i.querySelector('p').textContent)), 'Filtre « Courses »');
  await click(sheet().querySelector('[data-action="history-scope"][data-value=""]'));
  log(sheet().querySelectorAll('[data-action="history-person"]').length === 3, 'Filtre par personne : Tout le monde, Kevin, Marie');
  await click([...sheet().querySelectorAll('[data-action="history-person"]')].find((b) => b.dataset.value === 'Marie'));
  log(items().length === 1 && items()[0].textContent.includes('Marie a ajouté Récent'), 'Filtre « Marie »');
  const { setDoc, doc } = await import('firebase/firestore');
  await setDoc(doc(null, 'foyers', CODE, 'historique', 'direct'), { scope: 'stock', action: 'consommation', name: 'Pommes', details: ['plus en stock'], by: 'Marie', clientAt: Date.now() });
  await tick();
  log(items().length === 2 && items()[0].textContent.includes('Marie a consommé Pommes'), 'Mise à jour en direct (action de l\'autre iPhone)');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  await click('.tab[data-tab="reglages"]');
  log($$('[data-action="open-history"]').length === 0, 'Plus d\'accès à l\'historique depuis les Réglages');

  console.log('\n— Règles Firebase pas encore mises à jour —');
  globalThis.__denyHistory = true;
  await click('.tab[data-tab="frigo"]');
  await click(row('Bananes').querySelector('.product-main'), 400);
  await click(sheet().querySelector('[data-action="count-plus"]'));
  await click(sheet().querySelector('[data-action="save"]'), 350);
  const bananes = [...globalThis.__db.docs.entries()].find(([k, v]) => k.startsWith(P0) && v.name === 'Bananes')[1];
  log(bananes.count === 2, 'La modification réussit quand même');
  log(!$('.note.error'), 'Pas d\'erreur de synchronisation affichée');
  await click('[data-action="open-history"]', 400);
  log(sheet().textContent.includes("L'historique n'est pas encore autorisé : recollez les règles Firestore"), 'Écran Historique : explication claire');
  globalThis.__denyHistory = false;
  const rules = readProjectFile('firestore.rules');
  log(/match \/historique\/\{entryId\}[\s\S]*allow read, create, delete/.test(rules) && !/historique[\s\S]*allow[^;]*update/.test(rules.slice(rules.indexOf('match /historique'))), 'Règles : historique lisible, ajout et nettoyage, jamais modifiable');
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');

});
