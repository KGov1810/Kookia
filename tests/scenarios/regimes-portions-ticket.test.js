// Scénario : Régimes, portions, calories, ticket de caisse.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test("Régimes, portions, calories, ticket de caisse", async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const CODE = 'ZXCVB-NMKLP';
  const P0 = `foyers/${CODE}/produits/`, R0 = `foyers/${CODE}/recettes/`, C0 = `foyers/${CODE}/courses/`;
  const product = (name, days, extra = {}) => ({ name, expiry: iso(days), category: 'autre', quantity: '', count: 1, barcode: '', addedBy: 'Marie', createdAt: 1, image: '', imageUrl: '', ...extra });
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Marie' }],
    [P0 + 'courgette', product('Courgettes', 1, { category: 'fruits_legumes' })],
    [P0 + 'poulet', product('Filet de poulet', 4, { category: 'viande' })],
    [R0 + 'ancienne', { title: 'Omelette aux courgettes', summary: '', difficulty: 'facile', totalMinutes: 15, prepMinutes: 5, servings: 2, batchCooking: false, storageDays: 0, storageTips: '', createdAt: 5, favorite: false, steps: ['Battre.'], usedProductIds: ['courgette'],
      ingredients: [{ name: 'Courgettes', quantity: '1', source: 'stock', productId: 'courgette' }, { name: 'Oignon', quantity: '1/2 oignon', source: 'placard', productId: null }] }],
    [C0 + 'lait', { name: 'Lait', quantity: '2', checked: false, addedBy: 'Marie', createdAt: 1 }],
    [C0 + 'farine', { name: 'Farine', quantity: '', checked: false, addedBy: 'Marie', createdAt: 2 }],
    [C0 + 'sel', { name: 'Sel', quantity: '', checked: false, addedBy: 'Marie', createdAt: 3 }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Paul', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-sonnet-5-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('v4', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, text, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const docs = (prefix) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(prefix)).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  const mine = () => $$('.list').at(-1);
  await tick(50);

  // Faux Claude : recettes ou ticket selon l'outil demandé
  let lastPrompt = '';
  globalThis.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    const tool = body.tools[0].name;
    lastPrompt = body.messages[0].content.find((c) => c.type === 'text')?.text ?? '';
    globalThis.__images = body.messages[0].content.filter((c) => c.type === 'image').length;
    const input = tool === 'lister_produits'
      ? { produits: [
          { nom: 'Lait demi-écrémé', texte_ticket: 'LAIT 1/2 ECR 1L', categorie: 'laitier', nombre: 2, contenance: '1 L' },
          { nom: 'Farine de blé', texte_ticket: 'FARINE T45 1KG', categorie: 'epicerie', nombre: 1, contenance: '1 kg' },
          { nom: 'Tomates', texte_ticket: 'TOMATE GRAPPE', categorie: 'fruits_legumes', nombre: 1, contenance: '' }] }
      : { recettes: [
          { titre: 'Gratin de courgettes', resume: 'Fondant.', difficulte: 'facile', temps_total_minutes: 35, temps_preparation_minutes: 10, portions: 3, regime: 'vegetarien', calories_par_portion: 420, batch_cooking: false, conservation_jours: 2, conseils_conservation: '',
            ingredients: [
              { nom: 'Courgettes', quantite: '3', valeur: 3, unite: '', source: 'stock', ref_stock: 'P1' },
              { nom: 'Pâtes', quantite: '300 g', valeur: 300, unite: 'g', source: 'a_acheter', ref_stock: '' },
              { nom: 'Crème', quantite: '20 cl', valeur: 20, unite: 'cl', source: 'a_acheter', ref_stock: '' },
              { nom: 'Sel', quantite: 'une pincée', valeur: 0, unite: '', source: 'placard', ref_stock: '' }], etapes: ['Cuire.'] },
          { titre: 'Poulet rôti', resume: 'Classique.', difficulte: 'facile', temps_total_minutes: 30, temps_preparation_minutes: 10, portions: 3, regime: 'omnivore', calories_par_portion: 650, batch_cooking: false, conservation_jours: 2, conseils_conservation: '',
            ingredients: [{ nom: 'Filet de poulet', quantite: '450 g', valeur: 450, unite: 'g', source: 'stock', ref_stock: 'P2' }], etapes: ['Rôtir.'] }] };
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input }] }) };
  };

  console.log('\n— Personnes, régime, léger —');
  await click('.tab[data-tab="recettes"]');
  const servingsOut = () => $$('.stepper output').find((o) => o.textContent.includes('personne'));
  log(servingsOut()?.textContent === '2 personnes', 'Par défaut : 2 personnes');
  await click('[data-action="servings-plus"]');
  log(servingsOut().textContent === '3 personnes' && JSON.parse(w.localStorage.getItem('frigo.settings.v1')).servings === 3, '3 personnes, choix mémorisé');
  log(mine().textContent.includes('Omelette'), 'Ancienne recette visible sans filtre');
  await click('[data-action="set-diet"][data-value="vegetarien"]');
  log(!mine().textContent.includes('Omelette') && text().includes('1 recette ancienne (sans régime, calories ou origine) est masquée'), 'Végétarien : ancienne recette masquée, avec explication');
  const light = $('#light-toggle'); light.checked = true; light.dispatchEvent(new w.Event('change', { bubbles: true })); await tick();
  log(text().includes('500 kcal maximum par portion'), 'Léger : 500 kcal maximum par portion');
  await click('[data-action="generate"]', 80);
  log(lastPrompt.includes('Pour 3 personnes') && lastPrompt.includes('végétariennes') && lastPrompt.includes('au plus 500 kcal'), 'Demande à Claude : 3 personnes, végétarien, 500 kcal max');
  const cards = [...mine().querySelectorAll('.recipe-card')];
  log(cards.length === 1 && cards[0].textContent.includes('Gratin de courgettes'), 'Filtres appliqués : seul le gratin végétarien et léger est affiché');
  log(cards[0].textContent.includes('≈ 420 kcal') && cards[0].textContent.includes('Végétarien'), 'Carte : « ≈ 420 kcal » et « Végétarien »');
  await click('[data-action="set-diet"][data-value="vegan"]');
  log(!mine().querySelector('.recipe-card'), 'Vegan : le gratin végétarien (avec crème) disparaît');
  await click('[data-action="set-diet"][data-value=""]');
  light.checked = false; $('#light-toggle').checked = false; $('#light-toggle').dispatchEvent(new w.Event('change', { bubbles: true })); await tick();
  log([...mine().querySelectorAll('.recipe-card')].length === 3, 'Sans filtre : les 3 recettes');

  console.log('\n— Portions et calories dans une recette —');
  await click([...mine().querySelectorAll('.recipe-card')].find((c) => c.textContent.includes('Gratin')), 400);
  const portionOut = () => sheet().querySelector('.stepper output');
  const ing = (name) => [...sheet().querySelectorAll('.ingredient')].find((r) => r.textContent.includes(name))?.querySelector('small').textContent;
  log(portionOut().textContent === '3' && ing('Pâtes').startsWith('300 g'), 'Recette pour 3 : 300 g de pâtes');
  log(sheet().textContent.includes('≈ 420 kcal par portion') && sheet().textContent.includes('Végétarien'), 'Calories par portion et régime affichés');
  await click(sheet().querySelector('[data-action="portions-plus"]'));
  log(portionOut().textContent === '4' && ing('Pâtes').startsWith('400 g') && ing('Crème').startsWith('27 cl') && ing('Courgettes').startsWith('4'), '4 portions : 400 g de pâtes, 27 cl de crème, 4 courgettes');
  log(ing('Sel').startsWith('une pincée'), '« une pincée » inchangée');
  log(sheet().textContent.includes('Quantités recalculées (recette prévue pour 3)'), 'Mention « Quantités recalculées »');
  await click(sheet().querySelector('[data-action="add-missing"]'));
  log(docs(C0).some((d) => d.name === 'Pâtes (400 g)' && d.quantity === ''), 'Aux courses : « Pâtes (400 g) » (poids ajusté, dans le nom)');
  w.navigator.share = async (data) => { globalThis.__shared = data.text; };
  await click(sheet().querySelector('[data-action="share"]'), 20);
  log(globalThis.__shared.includes('pour 4 portions') && globalThis.__shared.includes('- 400 g Pâtes') && globalThis.__shared.includes('environ 420 kcal'), 'Partage : quantités pour 4 et calories');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  await click([...mine().querySelectorAll('.recipe-card')].find((c) => c.textContent.includes('Omelette')), 400);
  log(sheet().textContent.includes('Calories non estimées'), 'Ancienne recette : « Calories non estimées »');
  await click(sheet().querySelector('[data-action="portions-plus"]'));
  log(ing('Oignon').startsWith('1 oignon'), 'Ancienne recette recalculée : « 1/2 oignon » pour 3 au lieu de 2 → ¾ arrondi à « 1 oignon »');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  await click('.tab[data-tab="reglages"]');
  await click('[data-action="kcal-minus"]');
  log($('#kcal-max').textContent === '450 kcal', 'Réglages : seuil léger « 450 kcal »');
  await click('.tab[data-tab="recettes"]');
  log(text().includes('450 kcal maximum par portion'), 'Écran Recettes : « 450 kcal maximum »');

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
  await click('.tab[data-tab="frigo"]');
  await click('[data-action="add-menu"]');
  log(sheet().textContent.includes('Scanner un ticket de caisse'), 'Menu + : « Scanner un ticket de caisse »');
  await click(sheet().querySelector('[data-action="ticket"]'), 400);
  log(sheet().querySelectorAll('.receipt-photo').length === 1, 'Photo du ticket ajoutée');
  await click(sheet().querySelector('[data-action="add-photo"]'), 60);
  log(sheet().querySelectorAll('.receipt-photo').length === 2 && sheet().textContent.includes('Ajouter une photo (suite du ticket)'), 'Deuxième photo (ticket long)');
  await click(sheet().querySelector('[data-action="analyze"]'), 80);
  log(globalThis.__images === 2, 'Les 2 photos envoyées à Claude');
  const lines = () => [...sheet().querySelectorAll('.receipt-line')];
  log(lines().length === 3, '3 produits reconnus');
  const laitLine = lines().find((l) => l.querySelector('input').value === 'Lait demi-écrémé');
  log(laitLine.textContent.includes('« LAIT 1/2 ECR 1L »') && laitLine.textContent.includes('sur votre liste') && laitLine.querySelector('output').textContent === '2', 'Lait : libellé du ticket, « sur votre liste », nombre 2');
  log(lines().find((l) => l.querySelector('input').value === 'Farine de blé').textContent.includes('sur votre liste'), 'Farine reconnue sur la liste de courses');
  log(sheet().textContent.includes('Retirés de la liste de courses à l\'ajout : Lait, Farine'), 'Annonce : Lait et Farine retirés de la liste');
  await click(lines().find((l) => l.querySelector('input').value === 'Tomates').querySelector('[data-action="toggle-line"]'));
  log(lines().find((l) => l.querySelector('input').value === 'Tomates').classList.contains('off') && sheet().textContent.includes('Ajouter 2 produits au stock'), 'Tomates décochées : 2 produits à ajouter');
  await click(lines().find((l) => l.querySelector('input').value === 'Farine de blé').querySelector('[data-action="line-plus"]'));
  await type(lines().find((l) => l.querySelector('input').value === 'Lait demi-écrémé').querySelector('input'), 'Lait');
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  const added = docs(P0).filter((d) => ['Lait', 'Farine de blé'].includes(d.name));
  log(added.length === 2 && added.every((d) => d.expiry === ''), 'Produits ajoutés sans date (« date à compléter »)');
  log(added.find((d) => d.name === 'Lait').count === 2 && added.find((d) => d.name === 'Lait').quantity === '1 L' && added.find((d) => d.name === 'Farine de blé').count === 2, 'Nombres et contenances repris (Lait 2 × 1 L, Farine × 2)');
  log(!docs(C0).some((d) => ['Lait', 'Farine'].includes(d.name)) && docs(C0).some((d) => d.name === 'Sel'), 'Lait et Farine retirés des courses, Sel conservé');
  log(!docs(P0).some((d) => d.name === 'Tomates'), 'Produit décoché non ajouté');

  console.log('\n— Produits « date à compléter » —');
  const titles = $$('h2.section').map((h) => h.childNodes[0].textContent.trim());
  log(titles[0] === 'Date à compléter', `Section « Date à compléter » en premier (${titles.join(' | ')})`);
  const laitRow = $$('.product').find((r) => r.textContent.includes('Lait'));
  log(laitRow.querySelector('.days.pending b').textContent === '?' && laitRow.textContent.includes('date à compléter'), 'Compteur « ? » et mention « date à compléter »');
  log($('[data-badge="frigo"]').textContent === '1' && text().includes('1 produit à consommer vite'), 'Pastille et bannière ne comptent pas les produits sans date');
  await click(laitRow.querySelector('.product-main'), 400);
  log(sheet().textContent.includes('Date à compléter : saisissez-la') && sheet().querySelector('[name="expiry"]').value === '', 'Fiche : date vide et invitation à la compléter');
  await click(sheet().querySelector('[data-action="quick"][data-days="7"]'));
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(docs(P0).find((d) => d.name === 'Lait').expiry === iso(7) && $$('.product').find((r) => r.textContent.includes('Lait')).querySelector('.days b').textContent === '7', 'Date complétée : le lait rejoint le frigo (7 jours)');

  console.log('\n— Sans clé Claude —');
  await click('.tab[data-tab="reglages"]');
  await click('[data-action="delete-key"]');
  await click('.tab[data-tab="frigo"]');
  await click('[data-action="add-menu"]');
  log(sheet().textContent.includes('Nécessite une clé Claude'), 'Menu : « Nécessite une clé Claude »');
  await click(sheet().querySelector('[data-action="ticket"]'), 400);
  log(sheet().textContent.includes("nécessite une clé Claude : ajoutez-la dans Réglages"), 'Fiche ticket : explication claire');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');

});
