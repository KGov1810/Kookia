// Scénario : dates du frigo estimées (durée prudente ou retenue la dernière fois), viande et poisson à compléter
// en un toucher sur la ligne, produits déjà sans date estimés à l'ouverture.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { iso } from '../helpers/dates.js';
import { fridgeDays } from '../../src/services/stock/fridge-days.js';

test('Dates du frigo : estimation, mémoire, boutons sur la ligne', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); d.setHours(12, 0, 0, 0); return d.getTime(); };
  const CODE = 'DATES-FRIGO';
  const F = `foyers/${CODE}/`;
  const prod = (name, extra) => ({ name, expiry: '', category: 'autre', quantity: '', count: 1, location: 'frigo', dateKind: 'dlc', barcode: '', addedBy: 'Kevin', createdAt: Date.now(), image: '', imageUrl: '', ...extra });

  console.log('\n— Durées prudentes —');
  const cases = [['Yaourt au lait entier', 'laitier', 14], ['Beurre doux', 'laitier', 30], ['Crème fraîche épaisse', 'laitier', 10], ['Lait demi-écrémé', 'laitier', 5],
    ['Riz au lait', 'laitier', 5], ['Œufs plein air', 'oeufs', 21], ['Comté 18 mois', 'fromage', 14], ['Greek yogurt', 'laitier', 14], ['Pesto frais', 'condiments', 5]];
  cases.forEach(([name, category, days]) => log(fridgeDays(name, category) === days, `${name} : ${days} jours (${fridgeDays(name, category)})`));

  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    // Produits restés sans date avant cette version : estimés depuis leur ajout ; viande et charcuterie : à compléter.
    [F + 'produits/yaourt', prod('Yaourts nature', { category: 'laitier', count: 4, createdAt: daysAgo(3) })],
    [F + 'produits/beurre', prod('Beurre doux', { category: 'laitier' })],
    [F + 'produits/poulet', prod('Escalopes de poulet', { category: 'volaille' })],
    [F + 'produits/jambon', prod('Jambon blanc', { category: 'charcuterie' })],
    [F + 'produits/comte', prod('Comté', { category: 'fromage', expiry: iso(20) })],
    // Crème déjà entamée : sa date a été raccourcie à l'ouverture, ce n'est pas celle de l'emballage.
    [F + 'produits/creme', prod('Crème liquide', { category: 'laitier', expiry: iso(3), remaining: 0.5, openedAt: iso(-1) })],
    // Durée retenue sur l'autre iPhone : yaourt grec, 21 jours après l'achat.
    [F + 'prix/dates', { entries: { 'nom:grec yaourt': { days: 21, at: 1 } } }],
    [F + 'courses/c1', { name: 'Yaourt grec', quantity: '', checked: true, addedBy: 'Kevin', createdAt: 1 }],
    [F + 'courses/c2', { name: 'Crème fraîche', quantity: '', checked: true, addedBy: 'Kevin', createdAt: 2 }],
    [F + 'courses/c3', { name: 'Saumon fumé', quantity: '', checked: true, addedBy: 'Kevin', createdAt: 3 }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: '', model: 'claude-sonnet-5-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('dates-frigo', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const docs = (sub) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + sub + '/')).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  const product = (name) => docs('produits').find((d) => d.name === name);
  const memory = () => globalThis.__db.docs.get(F + 'prix/dates')?.entries ?? {};
  const row = (name) => $$('.product').find((r) => r.querySelector('.product-name').textContent === name);
  const sections = () => $$('h2.section').map((h) => h.childNodes[0].textContent.trim());
  await tick(80);

  console.log('\n— Produits déjà sans date —');
  log(product('Yaourts nature').dateKind === 'estimee' && product('Yaourts nature').expiry === iso(11), `Yaourts ajoutés il y a 3 jours : ≈ 14 jours depuis l'achat (${product('Yaourts nature').expiry})`);
  log(product('Beurre doux').dateKind === 'estimee' && product('Beurre doux').expiry === iso(30), 'Beurre : ≈ 30 jours');
  log(product('Escalopes de poulet').expiry === '' && product('Jambon blanc').expiry === '' && product('Comté').expiry === iso(20), 'Poulet et jambon restent à compléter ; le comté garde sa date');
  log(!docs('historique').some((h) => h.name === 'Yaourts nature'), 'Estimation silencieuse : rien dans l\'historique');
  log(sections()[0] === 'Date à compléter' && $$('.date-quick').length === 2, `Date à compléter : 2 lignes avec boutons (${sections().join(' | ')})`);
  log(row('Yaourts nature').querySelector('.days b').textContent === '≈11' && !row('Yaourts nature').querySelector('.date-quick'), 'Yaourts : « ≈11 », sans boutons de date');

  console.log('\n— Date en un toucher sur la ligne —');
  const quick = (name, days) => row(name).querySelector(`[data-action="quick-date"][data-days="${days}"]`);
  log(['+3 j', '+1 sem', '+2 sem'].every((label, i) => row('Escalopes de poulet').querySelectorAll('.date-quick button')[i]?.textContent === label), 'Boutons « +3 j · +1 sem · +2 sem »');
  await click(quick('Escalopes de poulet', 3), 60);
  log(product('Escalopes de poulet').expiry === iso(3) && product('Escalopes de poulet').dateKind === 'dlc', 'Poulet : date limite dans 3 jours, sans ouvrir la fiche');
  log($('#toast').textContent.includes('Escalopes de poulet : jusqu\'au'), `Message avec Annuler (${$('#toast').textContent})`);
  log(!$$('.sheet').length, 'Aucune fiche ouverte');
  await click('#toast button', 60);
  log(product('Escalopes de poulet').expiry === '', 'Annuler : le poulet redevient « date à compléter »');
  await click(quick('Jambon blanc', 7), 60);
  log(product('Jambon blanc').expiry === iso(7) && $$('.date-quick').length === 1, 'Jambon : +1 sem ; il ne reste que le poulet à compléter');

  console.log('\n— Nouveau produit : estimation, puis date de l\'emballage retenue —');
  const manual = async (name) => {
    await click('[data-action="add-menu"]');
    await click(sheet().querySelector('[data-action="manual"]'), 400);
    await type(sheet().querySelector('[name="name"]'), name);
    await type(sheet().querySelector('[name="name"]'), name, 'change');
  };
  const pressed = () => sheet().querySelector('[data-action="set-kind"][aria-pressed="true"]')?.dataset.value;
  await manual('Beurre demi-sel');
  log(pressed() === 'estimee' && sheet().querySelector('[name="expiry"]').value === iso(30) && sheet().textContent.includes('Estimation prudente'), 'Beurre demi-sel : estimée ≈ 30 jours, « Estimation prudente »');
  await click(sheet().querySelector('[data-action="quick"][data-days="14"]'));
  log(pressed() === 'dlc' && sheet().querySelector('[name="expiry"]').value === iso(14), 'Date choisie : le type passe en date limite (DLC)');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(product('Beurre demi-sel')?.dateKind === 'dlc' && memory()['nom:beurre demi sel']?.days === 14, 'Enregistré en DLC ; 14 jours retenus pour « Beurre demi-sel »');
  await manual('Beurre demi-sel');
  log(pressed() === 'estimee' && sheet().querySelector('[name="expiry"]').value === iso(14) && sheet().textContent.includes('Comme la dernière fois : 14 jours après l\'achat'), 'La fois suivante : ≈ 14 jours, « Comme la dernière fois »');
  const input = sheet().querySelector('[name="expiry"]');
  input.value = iso(12); await type(input, iso(12), 'change');
  log(pressed() === 'dlc' && sheet().querySelector('#date-section .date-field > span').textContent === 'Date limite', 'Date tapée : DLC, libellé « Date limite » (sans tout redessiner)');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  await manual('Filet de cabillaud');
  log(pressed() === 'dlc' && sheet().textContent.includes('dans 7 jours'), 'Poisson : pas d\'estimation, date limite proposée à vérifier (comme avant)');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  console.log('\n— Produit entamé : sa date n\'est pas retenue —');
  await click(row('Crème liquide').querySelector('.product-main'), 400);
  const cremeDate = sheet().querySelector('[name="expiry"]');
  cremeDate.value = iso(4); await type(cremeDate, iso(4), 'change');
  await click(sheet().querySelector('.sheet-head [data-action="close"]'), 400);
  log(product('Crème liquide').expiry === iso(4) && !Object.keys(memory()).some((k) => k.includes('creme')), 'Crème entamée : date modifiée, mais pas apprise pour la prochaine crème');

  console.log('\n— Tout ranger : durée retenue, prudente, ou à compléter —');
  await click('.tab[data-tab="courses"]');
  await click('[data-action="put-away-all"]', 350);
  log(sheet().textContent.includes('Viande, poisson, charcuterie et traiteur au frigo'), 'Fiche : seuls viande, poisson… restent à compléter');
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  log(product('Yaourt grec')?.dateKind === 'estimee' && product('Yaourt grec').expiry === iso(21), 'Yaourt grec : 21 jours, retenus sur l\'autre iPhone');
  log(product('Crème fraîche')?.dateKind === 'estimee' && product('Crème fraîche').expiry === iso(10), 'Crème fraîche : ≈ 10 jours');
  log(product('Saumon fumé')?.expiry === '' && $('#toast').textContent.includes('dates à compléter : viande, poisson'), 'Saumon fumé : à compléter, annoncé dans le message');
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');
  log(!P.errors.length, 'Aucune erreur JS');
});
