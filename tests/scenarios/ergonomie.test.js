// Scénario : ergonomie 2.8 — filtres de recettes mémorisés, glisser dans le stock, courses en un champ,
// « Tout ranger » le panier, réglages avancés repliés.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { iso } from '../helpers/dates.js';

test('Ergonomie : recettes, glisser, courses, réglages', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'ERGON-OMIE2';
  const F = `foyers/${CODE}/`;
  const prod = (name, extra) => ({ name, expiry: iso(8), category: 'laitier', categoryVersion: 2, quantity: '', count: 1, location: 'frigo', dateKind: 'dlc', frozenAt: '', barcode: '', addedBy: 'Kevin', createdAt: 1, image: '', imageUrl: '', ...extra });
  const recipe = (title, extra) => ({ title, summary: '', difficulty: 'facile', prepMinutes: 5, servings: 2, batchCooking: false, storageDays: 0, storageTips: '', createdAt: 5, favorite: false, steps: ['Cuire.'], usedProductIds: [], kcal: 450, ingredients: [{ name: 'Yaourts', quantity: '2', source: 'stock', productId: 'yaourt' }], ...extra });
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [F + 'produits/yaourt', prod('Yaourts', { count: 3, expiry: iso(1), unitPrice: 0.5 })],
    [F + 'produits/jambon', prod('Jambon blanc', { category: 'charcuterie', unitPrice: 2.9 })],
    [F + 'produits/lait', prod('Lait UHT', { quantity: '1 L', location: 'placard', dateKind: 'aucune', expiry: '' })],
    [F + 'recettes/veg', recipe('Raïta express', { diet: 'vegetarien', totalMinutes: 15 })],
    [F + 'recettes/viande', recipe('Poulet au yaourt', { diet: 'omnivore', totalMinutes: 50, createdAt: 9 })],
    [F + 'courses/c1', { name: 'Lait', quantity: '', checked: false, addedBy: 'Kevin', createdAt: 1 }],
    [F + 'courses/c2', { name: 'Pâtes 500 g', quantity: '2', checked: true, addedBy: 'Marie', createdAt: 2 }],
    [F + 'courses/c3', { name: 'Pommes', quantity: '', checked: true, addedBy: 'Kevin', createdAt: 3 }],
    [F + 'courses/c4', { name: 'Steak haché', quantity: '', checked: true, addedBy: 'Marie', createdAt: 4 }]
  ]), listeners: new Set(), writes: 0, network: [] };
  // Filtres mémorisés lors d'une ouverture précédente (l'envie, elle, n'est pas reprise).
  const recipeFilters = { diet: 'vegetarien', maxMinutes: 30, light: false, batchOnly: false, difficulty: '', origins: [], wish: 'curry' };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', householdCode: CODE, firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true, recipeFilters };
  const P = await createPhone('ergonomie', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, text, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const docs = (sub) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + sub + '/')).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  const product = (name) => docs('produits').find((d) => d.name === name);
  const row = (name) => $$('.product').find((r) => r.querySelector('.product-name').textContent === name);
  const pointer = (el, type, x) => el.dispatchEvent(new w.MouseEvent(type, { bubbles: true, clientX: x, clientY: 100 }));
  const swipe = async (name, dx) => {
    const front = row(name).querySelector('.product-front');
    pointer(front, 'pointerdown', 200);
    pointer(front, 'pointermove', 200 + dx / 2);
    pointer(front, 'pointermove', 200 + dx);
    pointer(front, 'pointerup', 200 + dx);
    front.querySelector('.product-main').dispatchEvent(new w.MouseEvent('click', { bubbles: true })); // fin du geste
    await tick(250);
  };
  await tick(80);

  console.log('\n— Recettes : filtres mémorisés —');
  await click('.tab[data-tab="recettes"]');
  log($('[data-action="quick-diet"]').getAttribute('aria-pressed') === 'true' && $('[data-action="quick-time"]').textContent.includes('30 min ou moins'), 'Filtres de la dernière fois repris : Végétarien, 30 min ou moins');
  log(!$('[data-action="more-filters"] i'), 'L\'envie (« curry ») n\'est pas reprise');
  const titles = () => $$('.list').at(-1).querySelectorAll('.recipe-card h3');
  log(titles().length === 1 && titles()[0].textContent.includes('Raïta'), 'Seule la recette végétarienne et rapide est affichée');
  log($('[data-action="recipe-tab"][aria-selected="true"]').dataset.value === 'realisables', 'Onglet « Réalisables » d\'abord (recette faisable avec le stock)');

  console.log('\n— Stock : bandeau compact et glisser —');
  await click('.tab[data-tab="frigo"]');
  log($('.alert-card').textContent.includes('1 produit à sauver') && !$('.alert-card').textContent.includes('Yaourts') && $('.alert-card').textContent.includes('Idées recettes'), 'Bandeau : un nombre et « Idées recettes », sans répéter les produits');
  log(row('Lait UHT').querySelector('.product-meta').textContent.trim() === '1 L, au placard' && row('Lait UHT').querySelector('.where'), 'Ligne courte : « 1 L, au placard »');
  await swipe('Yaourts', 130);
  log(product('Yaourts').count === 2 && $('#toast').textContent.includes('Yaourts : il en reste 2') && !sheet(), 'Glisser à droite : un yaourt consommé, Annuler proposé, pas de fiche ouverte');
  await click('#toast button', 40);
  log(product('Yaourts').count === 3, 'Annuler : 3 yaourts');
  // Cas réel (test raté sur GitHub) : juste après un glisser, un toucher ailleurs était ignoré pendant 0,45 s.
  await swipe('Yaourts', 130);
  await click('#toast button', 40);
  await click(row('Lait UHT').querySelector('.product-main'), 400);
  log(sheet()?.querySelector('.product-hero, h1, h2')?.textContent.includes('Lait UHT') || sheet()?.textContent.includes('Lait UHT'), 'Juste après un glisser, toucher une autre ligne ouvre bien sa fiche');
  if (sheet()) await click(sheet().querySelector('[data-action="close"]'), 350);
  await swipe('Jambon blanc', -100);
  log(row('Jambon blanc').classList.contains('open') && !sheet() && row('Jambon blanc').querySelectorAll('[data-action="swipe-rest"]').length === 3, 'Glisser à gauche : « Il reste ¾ ½ ¼ » et « Jeté » visibles');
  await click(row('Jambon blanc').querySelector('[data-action="swipe-discard"]'), 60);
  const moves = docs('mouvements');
  log(!product('Jambon blanc') && moves.some((m) => m.type === 'jete' && m.name === 'Jambon blanc' && m.unitPrice === 2.9) && $('#toast').textContent.includes('Jambon blanc : jeté, retiré du stock'), 'Jeté : retiré du stock, compté dans le gaspillage, Annuler proposé');
  await click('#toast button', 40);
  log(product('Jambon blanc'), 'Annuler : jambon remis');
  await swipe('Lait UHT', -100);
  await tick(500);
  await click(row('Yaourts').querySelector('.product-main'), 60);
  log(!sheet() && !$$('.product.open').length, 'Un toucher ailleurs referme les boutons sans ouvrir de fiche');
  await swipe('Lait UHT', -100);
  await click(row('Lait UHT').querySelector('[data-action="swipe-rest"][data-value="0.5"]'), 60);
  log(product('Lait UHT').remaining === 0.5 && !sheet() && $('#toast').textContent.includes('Lait UHT : entamé, reste ½'), `« ½ » en glissant : entamé, il en reste ½, sans ouvrir la fiche (${$('#toast').textContent})`);
  log(row('Lait UHT').querySelector('[data-action="swipe-rest"][data-value="0.5"]').disabled && row('Lait UHT').querySelector('[data-action="swipe-rest"][data-value="0.75"]').disabled && !row('Lait UHT').querySelector('[data-action="swipe-rest"][data-value="0.25"]').disabled, 'Ensuite : ¾ et ½ grisés, ¼ reste possible');
  await click('#toast button', 40);
  log(!product('Lait UHT').remaining || product('Lait UHT').remaining === 1, 'Annuler : lait remis entier');
  await swipe('Yaourts', 400);
  log(!product('Yaourts') && $('#toast').textContent.includes('Yaourts : tout consommé (3), retiré du stock'), `Glisser loin à droite : les 3 yaourts consommés (${$('#toast').textContent})`);
  await click('#toast button', 40);
  log(product('Yaourts')?.count === 3, 'Annuler : 3 yaourts remis');

  console.log('\n— Courses : un seul champ, « par X », Tout ranger —');
  await click('.tab[data-tab="courses"]');
  await type('#new-item', '3 beurre doux');
  $('#add-item').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  log(docs('courses').some((d) => d.name === 'Beurre doux' && d.quantity === '3'), '« 3 beurre doux » → Beurre doux, 3');
  log(text().includes('par Marie') && !text().includes('par Kevin'), '« par Marie » affiché, pas « par Kevin » (soi-même)');
  await click('[data-action="put-away-all"]', 350);
  const lines = () => [...sheet().querySelectorAll('.put-away-line')];
  const lineOf = (name) => lines().find((l) => l.textContent.includes(name));
  log(lines().length === 3 && lineOf('2 × Pâtes') && lineOf('Pâtes').querySelector('select').value === 'placard' && lineOf('Pommes').querySelector('select').value === 'fruits' && lineOf('Steak').querySelector('select').value === 'frigo',
    'Vérification : 2 × Pâtes au placard, pommes aux fruits et légumes, steak au frigo');
  const select = lineOf('Steak').querySelector('select');
  select.value = 'congelateur'; select.dispatchEvent(new w.Event('change', { bubbles: true })); await tick();
  await click(lineOf('Pommes').querySelector('[data-action="toggle-line"]'));
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  const pates = product('Pâtes');
  const steak = product('Steak haché');
  log(pates?.count === 2 && pates.quantity === '500 g' && pates.location === 'placard' && pates.dateKind === 'aucune', 'Pâtes : 2 × 500 g au placard, sans date');
  log(steak?.location === 'congelateur' && steak.dateKind === 'congele' && steak.frozenAt === iso(0), 'Steak haché : au congélateur, congelé aujourd\'hui');
  log(!product('Pommes') && docs('courses').some((d) => d.name === 'Pommes' && d.checked) && !docs('courses').some((d) => ['Pâtes 500 g', 'Steak haché'].includes(d.name)), 'Pommes décochées : restent au panier ; les autres quittent la liste');
  const history = docs('historique').sort((a, b) => a.clientAt - b.clientAt).at(-1);
  log(history.scope === 'courses' && history.action === 'rangement' && history.name === '2 produits', 'Historique : « a acheté et rangé 2 produits »');
  log(JSON.stringify(globalThis.__db.docs.get(F + 'prix/categories') ?? {}).includes('congelateur'), 'Rangement corrigé (steak au congélateur) retenu pour la prochaine fois');
  log($('h1').textContent === 'Stock', 'Retour au stock pour voir les produits rangés');

  console.log('\n— Réglages : Avancé replié —');
  await click('.tab[data-tab="frigo"]'); await click('[data-action="open-settings"]');
  log($('[data-action="open-advanced"]') && !$('#model'), 'Réglages : « Avancé » en une ligne, modèle et synchro à part');
  await click('[data-action="open-advanced"]');
  log($('h1').textContent === 'Avancé' && $('#model') && $('[data-action="reconnect"]') && $('[data-action="close-advanced"]'), 'Sous-page « Avancé » : modèle, synchronisation, à propos, retour');
  await click('[data-action="close-advanced"]');
  // Le prénom se modifie dans le bandeau.
  await click('[data-action="edit-name"]');
  $('#name-input').value = 'Kev';
  await click('[data-action="done-name"]');
  log(JSON.parse(w.localStorage.getItem('frigo.settings.v1')).userName === 'Kev' && $('#profile-card b').textContent === 'Kev', 'Prénom modifié depuis le bandeau');
  console.log('\n— Langue —');
  const setLang = async (value) => { $('#language').value = value; $('#language').dispatchEvent(new w.Event('change', { bubbles: true })); await tick(); };
  await setLang('en');
  log($('h1').textContent === 'Settings' && $('.tab[data-tab="courses"] span').textContent === 'Groceries' && w.document.documentElement.lang === 'en' && JSON.parse(w.localStorage.getItem('frigo.settings.v1')).language === 'en', 'Anglais : Réglages et barre du bas traduits, choix gardé sur l\'iPhone');
  await click('.tab[data-tab="frigo"]');
  log($('#search').placeholder === 'Search for a product' && $('h2.section.soon')?.textContent.startsWith('Use soon') && $$('.filter-chip').some((c) => c.textContent.startsWith('Fridge')), 'Anglais : Stock traduit (recherche, « Use soon », « Fridge »)');
  await click('.product[data-id="yaourt"] [data-action="edit"]');
  log(sheet().textContent.includes('Use by') && sheet().querySelector('.tile-consume').textContent === 'Used' && sheet().textContent.includes('Storage') && sheet().querySelector('.days').getAttribute('aria-label') === 'Expires tomorrow', 'Anglais : fiche produit traduite (« Use by », « Used », « Storage »)');
  await click('.sheet [data-action="close"]');
  await click('.tab[data-tab="recettes"]');
  log($('h1').textContent === 'Recipes' && text().includes('Use first') && text().includes('Suggest 5 recipes') && text().includes('My recipes') && $('[data-action="recipe-tab"][data-value="toutes"]')?.textContent.startsWith('All'), 'Anglais : Recettes traduites (« Use first », « Suggest 5 recipes », « My recipes »)');
  await click('[data-action="recipe-mode"][data-value="semaine"]');
  log(text().includes('Plan the week'), 'Anglais : Semaine traduite (« Plan the week »)');
  await click('[data-action="recipe-mode"][data-value="idees"]');
  await click('.tab[data-tab="courses"]');
  log($('h1').textContent === 'Groceries' && $('#new-item').placeholder.startsWith('Add (e.g.'), 'Anglais : Courses traduites');
  await click('.tab[data-tab="stats"]');
  log($('h1').textContent === 'Statistics', 'Anglais : Statistiques traduites');
  await click('.tab[data-tab="frigo"]');
  await click('[data-action="open-history"]');
  log(sheet().textContent.includes('History') && sheet().textContent.includes('bought and put away') && sheet().textContent.includes('2 products'), `Anglais : historique lu en anglais (${sheet().textContent.replace(/\s+/g, ' ').slice(0, 160)})`);
  await click('.sheet [data-action="close"]');
  await click('[data-action="open-settings"]');
  await setLang('pt');
  log($('h1').textContent === 'Ajustes' && $('.tab[data-tab="stock"], .tab[data-tab="frigo"]').textContent.includes('Estoque'), 'Portugais : « Ajustes », « Estoque »');
  await setLang('');
  log($('h1').textContent === 'Réglages' && $('#language').value === '' && $('#language').options[0].textContent === 'Comme l\'iPhone (Français)', 'Retour à la langue de l\'iPhone (français)');
  log(!P.errors.length, `Aucune erreur JS ${P.errors.join(' ')}`);
});
