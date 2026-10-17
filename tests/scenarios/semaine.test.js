// Scénario : planning de la semaine — préparation, demande à Claude (stock, restes, batch cooking),
// écran Semaine, courses regroupées, « J'ai cuisiné », changer / remplacer / retirer un repas.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test('Planning de la semaine', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'SEMAI-NEPLA';
  const F = `foyers/${CODE}/`;
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const prod = (name, extra) => ({ name, expiry: iso(8), category: 'autre', categoryVersion: 2, quantity: '', count: 1, location: 'frigo', dateKind: 'dlc', frozenAt: '', barcode: '', addedBy: 'Kevin', createdAt: 1, image: '', imageUrl: '', ...extra });
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [F + 'produits/riz', prod('Riz basmati', { category: 'feculents', location: 'placard', dateKind: 'aucune', expiry: '', quantity: '1 kg' })],
    [F + 'produits/jambon', prod('Jambon blanc', { category: 'charcuterie' })],
    [F + 'produits/poulet', prod('Filet de poulet', { category: 'volaille', expiry: iso(1), quantity: '400 g' })],
    [F + 'produits/creme', prod('Crème fraîche', { category: 'laitier', expiry: iso(2), quantity: '20 cl' })],
    [F + 'courses/lait', { name: 'Lait', quantity: '', checked: false, addedBy: 'Kevin', createdAt: 1 }],
    [F + 'recettes/omelette', { title: 'Omelette au jambon', summary: '', difficulty: 'facile', totalMinutes: 15, prepMinutes: 5, servings: 2, batchCooking: false, storageDays: 0, storageTips: '', createdAt: 1, favorite: false, steps: ['Battre.'], usedProductIds: ['jambon'], diet: 'omnivore', kcal: 400,
      ingredients: [{ name: 'Jambon blanc', quantity: '2 tranches', source: 'stock', productId: 'jambon' }] }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-sonnet-5-5', householdCode: CODE, firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('semaine', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const docs = (sub) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + sub + '/')).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  const plan = () => globalThis.__db.docs.get(F + 'prix/semaine');
  const recipeTitle = (id) => docs('recettes').find((r) => r.id === id)?.title;

  // Faux Claude : planning de la semaine, ou une recette de remplacement
  const recette = (ref, titre, portions, ings) => ({ ref, titre, resume: '', difficulte: 'facile', temps_total_minutes: 30, temps_preparation_minutes: 10, portions, regime: 'omnivore', origine: 'francaise', calories_par_portion: 550, batch_cooking: false, conservation_jours: 2, conseils_conservation: '', ingredients: ings, etapes: ['Cuire.'] });
  const ing = (nom, ref) => ({ nom, quantite: '1', valeur: 1, unite: '', source: ref ? 'stock' : 'a_acheter', ref_stock: ref ?? '' });
  let request = null;
  globalThis.fetch = async (_url, opts) => {
    request = JSON.parse(opts.body);
    const tool = request.tools[0].name;
    const input = tool === 'planifier_semaine' ? {
      strategie: 'Le poulet et la crème partent en premier ; le riz du batch sert deux fois.',
      recettes: [
        recette('R1', 'Poulet à la crème', 6, [ing('Filet de poulet', 'P1'), ing('Crème fraîche', 'P2')]),
        recette('R2', 'Riz cantonais', 3, [ing('Riz basmati', 'P4'), ing('Jambon blanc', 'P3')]),
        recette('R3', 'Gratin de pâtes', 3, [ing('Pâtes')]),
        recette('R4', 'Salade composée', 3, [ing('Salade')]),
        recette('R5', 'Soupe de légumes', 3, [ing('Poireaux')]),
        recette('R6', 'Quiche lorraine', 3, [ing('Pâte brisée')])
      ],
      repas: [
        { jour: 'J1', repas: 'soir', recette: 'R1', restes: false },
        { jour: 'J2', repas: 'midi', recette: 'R1', restes: true },
        { jour: 'J2', repas: 'soir', recette: 'R2', restes: false },
        { jour: 'J3', repas: 'soir', recette: 'R3', restes: false },
        { jour: 'J4', repas: 'soir', recette: 'R4', restes: false },
        { jour: 'J6', repas: 'soir', recette: 'R5', restes: false },
        { jour: 'J7', repas: 'soir', recette: 'R6', restes: false },
        { jour: 'J9', repas: 'soir', recette: 'R3', restes: false } // jamais demandé : ignoré
      ],
      batch: { jour: 'J1', duree_minutes: 120, etapes: ['Cuire le riz.', 'Préparer la pâte.'], recettes: ['R2', 'R6'] },
      courses: [{ nom: 'Pâtes', quantite: '500 g' }, { nom: 'Persil plat', quantite: '1 botte' }, { nom: 'Lait', quantite: '1 L' }]
    } : { recettes: [recette('X', 'Curry de légumes', 3, [ing('Lait de coco')])] };
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input }] }) };
  };
  await tick(60);

  console.log('\n— Écran Semaine et préparation —');
  await click('.tab[data-tab="recettes"]');
  await click('[data-action="recipe-mode"][data-value="semaine"]');
  log($('.week-empty') && $('.week-empty [data-action="week-setup"]'), 'Semaine vide : « Préparer la semaine »');
  await click('.week-empty [data-action="week-setup"]', 350);
  const pressed = () => [...sheet().querySelectorAll('[data-action="toggle-slot"][aria-pressed="true"]')].map((b) => b.dataset.value);
  log(pressed().length === 7 && pressed().every((k) => k.endsWith('-soir')), 'Par défaut : les 7 soirs');
  const leftovers = async (on) => {
    const el = sheet().querySelector('[name="leftovers"]');
    el.checked = on; el.dispatchEvent(new w.Event('change', { bubbles: true })); await tick();
  };
  log(!sheet().querySelector('[name="leftovers"]').disabled, 'Restes activables dès le départ (7 soirs)');
  await leftovers(true);
  log(pressed().length === 13 && pressed().includes('1-midi') && pressed().includes('6-midi') && !pressed().includes('0-midi') && sheet().textContent.includes('6 midis avec les restes de la veille'), 'Restes activés : le midi du lendemain de chaque soir est coché (6 midis)');
  await leftovers(false);
  log(pressed().length === 7 && pressed().every((k) => k.endsWith('-soir')), 'Restes désactivés : les midis ajoutés sont décochés');
  await click(sheet().querySelector('[data-action="toggle-slot"][data-value="1-midi"]'));
  await click(sheet().querySelector('[data-action="toggle-slot"][data-value="4-soir"]'));
  await click(sheet().querySelector('[data-action="toggle-slot"][data-value="4-soir"]'));
  await leftovers(true);
  for (const d of [2, 3, 4, 5, 6]) await click(sheet().querySelector(`[data-action="toggle-slot"][data-value="${d}-midi"]`));
  log(pressed().length === 8 && sheet().querySelector('[name="leftovers"]').checked, 'Midis décochés à la main ; restes toujours actifs (mardi midi)');
  const batch = sheet().querySelector('[name="batch"]');
  batch.checked = true; batch.dispatchEvent(new w.Event('change', { bubbles: true })); await tick();
  await click(sheet().querySelector('[data-action="servings-up"]'));
  log(sheet().textContent.includes('Planifier 8 repas') && sheet().textContent.includes('Séance le'), '8 repas, séance de batch cooking à choisir');
  await click(sheet().querySelector('.sheet-body [data-action="plan"]'), 150);

  console.log('\n— Demande à Claude —');
  const prompt = request.messages[0].content[0].text;
  log(request.tools[0].name === 'planifier_semaine' && request.max_tokens === 16000, 'Outil planifier_semaine, 16 000 jetons au plus');
  log(prompt.includes('REPAS À PLANIFIER (8') && /J2 \(.+\) : midi et soir/.test(prompt) && prompt.includes('Pour 3 personnes'), 'Repas demandés (J2 midi et soir), 3 personnes');
  const stockStart = prompt.indexOf('STOCK DE LA MAISON');
  log(prompt.indexOf('Filet de poulet', stockStart) < prompt.indexOf('Riz basmati', stockStart), 'Stock du plus urgent au moins urgent (poulet avant riz)');
  log(prompt.includes("Ce qui périme d'abord") && prompt.includes('Ingrédients partagés') && prompt.includes('préparé pour 6 portions') && prompt.includes('Batch cooking : prévois une séance de préparation le J1'), 'Stratégies : périme d\'abord, achats partagés, restes (6 portions), batch J1');
  log(prompt.includes('regroupé et additionné'), 'Courses regroupées demandées');

  console.log('\n— Planning enregistré et affiché —');
  log(plan()?.start === iso(0) && plan().servings === 3 && plan().slots.length === 8, `Planning partagé : ${plan()?.slots.length} repas, pour 3`);
  const slots = () => plan().slots;
  log(slots()[1].leftovers && slots()[1].recipeId === slots()[0].recipeId && slots()[5].recipeId === null, 'J2 midi = restes du J1 soir ; J5 soir sans recette (oublié par Claude)');
  log(!slots().some((s) => s.day === 8), 'Repas non demandé (J9) ignoré');
  log(docs('recettes').filter((r) => r.title !== 'Omelette au jambon').length === 6 && docs('historique').some((h) => h.action === 'planning' && h.name === '8 repas'), '6 recettes enregistrées ; historique « a planifié la semaine »');
  log($('.note.ok')?.textContent.includes('7 repas planifiés ; 1 repas sans recette, à compléter'), 'Message : 7 planifiés, 1 à compléter');
  log($('.week-head').textContent.includes('Le poulet et la crème partent en premier') && $$('.week-slot').length === 8 && $('.week-batch')?.textContent.toLowerCase().includes('avance riz cantonais'), 'Stratégie, 8 repas, carte batch cooking');
  log($$('.week-slot.leftovers').length === 1 && $('.week-slot.leftovers').textContent.includes('Restes : Poulet à la crème') && $('.week-slot.missing'), 'Ligne « Restes : Poulet à la crème » et repas vide');
  log($('h2.section.today')?.textContent.includes("Aujourd'hui"), 'Aujourd\'hui mis en avant');

  console.log('\n— Courses de la semaine —');
  await click('[data-action="week-shopping"]', 350);
  const items = () => [...sheet().querySelectorAll('.pick')];
  log(items().length === 3 && items()[2].getAttribute('aria-checked') === 'false' && items()[2].textContent.includes('déjà dans la liste'), 'Lait déjà dans la liste : décoché');
  await click(sheet().querySelector('.sheet-body [data-action="add"]'), 350);
  log(docs('courses').some((c) => c.name.startsWith('Pâtes')) && docs('courses').some((c) => c.name.startsWith('Persil plat')) && plan().shopping.filter((i) => i.added).length === 2, 'Pâtes et persil ajoutés aux courses');

  console.log('\n— J\'ai cuisiné —');
  await click($$('.week-slot').find((r) => r.textContent.includes('Riz cantonais')).querySelector('.week-recipe'), 400);
  log(sheet().querySelector('.planned-on')?.textContent.includes('soir'), 'Fiche recette : « Au menu : … soir »');
  await click(sheet().querySelector('[data-action="cooked"]'), 80);
  log(slots()[2].done && !docs('produits').some((p) => p.name === 'Jambon blanc' && p.count === 1 && !p.remaining), 'Repas coché, stock mis à jour');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  log($('.week-head').textContent.includes('1 repas sur 8') && $('.week-progress[aria-valuenow="1"]'), 'En-tête : 1 repas sur 8, barre de progression');

  console.log('\n— Changer un repas —');
  await click($('.week-slot.missing [data-action="week-slot"]'), 350);
  await click(sheet().querySelector('[data-action="choose"]'));
  await click([...sheet().querySelectorAll('[data-action="pick"]')].find((b) => b.textContent.includes('Omelette')), 350);
  log(slots()[5].recipeId === 'omelette', 'Repas vide : Omelette choisie dans Mes recettes');
  await click($$('.week-change')[3], 350);
  await click(sheet().querySelector('[data-action="regenerate"]'), 150);
  const replacePrompt = request.messages[0].content[0].text;
  log(request.tools[0].name === 'proposer_recettes' && replacePrompt.includes('Une seule recette, pour le') && replacePrompt.includes('Déjà au menu cette semaine, à ne pas refaire : ') && replacePrompt.includes('Poulet à la crème'), 'Une autre recette : Claude évite les plats déjà au menu');
  log(recipeTitle(slots()[3].recipeId) === 'Curry de légumes', 'J3 soir : Curry de légumes');
  await click($$('.week-change')[0], 350);
  await click(sheet().querySelector('[data-action="choose"]'));
  await click([...sheet().querySelectorAll('[data-action="pick"]')].find((b) => b.textContent.includes('Omelette')), 350);
  log(slots()[0].recipeId === 'omelette' && slots()[1].leftovers && slots()[1].recipeId === 'omelette', 'Dîner remplacé : les restes du lendemain suivent');
  await click($$('.week-change').at(-1), 350);
  await click(sheet().querySelector('[data-action="remove"]'), 350);
  log(slots().length === 7, 'Repas retiré : 7 repas');
  await click('[data-action="week-batch"]', 350);
  log(sheet().textContent.includes('Cuire le riz.') && sheet().textContent.includes('Recettes avancées'), 'Batch cooking : étapes et recettes avancées');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  log(!P.errors.length, `Aucune erreur JS ${P.errors.join(' ')}`);
});
