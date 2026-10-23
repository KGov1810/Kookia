// Scénario : langues du foyer — chaque iPhone note sa langue, Claude écrit les recettes dans toutes les langues
// du foyer, chaque iPhone les lit dans la sienne, et une ancienne recette est traduite à l'ouverture.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { iso } from '../helpers/dates.js';

test('Langues du foyer : recettes de Claude dans la langue de chaque iPhone', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'LANGU-ESFOY';
  const F = `foyers/${CODE}/`;
  const prod = (name, extra) => ({ name, expiry: iso(2), category: 'laitier', categoryVersion: 2, quantity: '', count: 1, location: 'frigo', dateKind: 'dlc', frozenAt: '', barcode: '', addedBy: 'Kevin', createdAt: 1, image: '', imageUrl: '', ...extra });
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [F + 'prix/langues', { members: { 'anon-marie': { lang: 'en', name: 'Marie', at: Date.now() - 86_400_000 } } }],
    [F + 'produits/oeufs', prod('Œufs', { category: 'oeufs', count: 6 })],
    [F + 'produits/jambon', prod('Jambon blanc', { category: 'charcuterie' })],
    [F + 'recettes/ancienne', { title: 'Omelette au jambon', summary: 'Rapide.', difficulty: 'facile', totalMinutes: 15, prepMinutes: 5, servings: 2, batchCooking: false, storageDays: 0, storageTips: '', createdAt: 1, favorite: false, steps: ['Battre les œufs.', 'Cuire.'], usedProductIds: ['oeufs'], diet: 'omnivore', kcal: 400,
      ingredients: [{ name: 'Œufs', quantity: '4', amount: 4, unit: '', source: 'stock', productId: 'oeufs' }, { name: 'Sel', quantity: 'une pincée', source: 'placard', productId: null }] }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-sonnet-5-5', householdCode: CODE, firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('langues', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const docs = (sub) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + sub + '/')).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  const members = () => globalThis.__db.docs.get(F + 'prix/langues')?.members ?? {};

  const requests = [];
  globalThis.fetch = async (_url, opts) => {
    const request = JSON.parse(opts.body);
    requests.push(request);
    const tool = request.tools[0].name;
    const input = tool === 'traduire_recette'
      ? { traduction: { langue: 'xx', titre: 'Ham omelette', resume: 'Quick.', conseils_conservation: '', ingredients: [{ nom: 'Eggs', quantite: '4', unite: '' }, { nom: 'Salt', quantite: 'a pinch', unite: '' }], etapes: ['Beat the eggs.', 'Cook.'] } }
      : { recettes: [{ titre: 'Œufs cocotte au jambon', resume: 'Fondant.', difficulte: 'facile', temps_total_minutes: 20, temps_preparation_minutes: 10, portions: 2, regime: 'omnivore', origine: 'francaise', calories_par_portion: 380, batch_cooking: false, conservation_jours: 0, conseils_conservation: '',
        ingredients: [{ nom: 'Œufs', quantite: '4', valeur: 4, unite: '', source: 'stock', ref_stock: 'P1' }, { nom: 'Crème fraîche', quantite: '2 c. à soupe', valeur: 2, unite: 'c. à soupe', source: 'a_acheter', ref_stock: '' }],
        etapes: ['Beurrer les ramequins.', 'Cuire au four.'],
        traductions: [{ langue: 'en', titre: 'Baked eggs with ham', resume: 'Melting.', conseils_conservation: '', ingredients: [{ nom: 'Eggs', quantite: '4', unite: '' }, { nom: 'Heavy cream', quantite: '2 tbsp', unite: 'tbsp' }], etapes: ['Butter the ramekins.', 'Bake.'] }] }] };
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input }] }) };
  };
  await tick(60);

  console.log('\n— Langue de chaque iPhone —');
  log(members()['anon-1']?.lang === 'fr' && members()['anon-1']?.name === 'Kevin' && members()['anon-marie']?.lang === 'en', `Langue de cet iPhone notée dans le foyer : ${JSON.stringify(members())}`);

  console.log('\n— Recettes écrites dans les langues du foyer —');
  await click('.tab[data-tab="recettes"]');
  await click('[data-action="generate"]', 120);
  const prompt = requests.at(-1).messages[0].content[0].text;
  log(prompt.includes('Langue : écris tous les textes') && prompt.includes('en français') && prompt.includes('Traductions : le foyer lit aussi anglais'), 'Demande : recettes en français, traduites en anglais');
  log(requests.at(-1).tools[0].input_schema.properties.recettes.items.properties.traductions, 'Outil : champ traductions');
  const created = docs('recettes').find((r) => r.title === 'Œufs cocotte au jambon');
  log(created?.lang === 'fr' && created.translations?.en?.title === 'Baked eggs with ham' && created.translations.en.ingredients[1].name === 'Heavy cream', 'Recette enregistrée en français, avec sa traduction anglaise');

  console.log('\n— L\'iPhone passe en anglais —');
  await click('.tab[data-tab="frigo"]'); await click('[data-action="open-settings"]');
  $('#language').value = 'en'; $('#language').dispatchEvent(new w.Event('change', { bubbles: true })); await tick(60);
  log(members()['anon-1']?.lang === 'en', 'Nouvelle langue notée dans le foyer');
  await click('.tab[data-tab="recettes"]');
  await click('[data-action="recipe-tab"][data-value="toutes"]');
  log(P.text().includes('Baked eggs with ham') && !P.text().includes('Œufs cocotte au jambon'), 'Carte de la recette en anglais');
  await click(`.recipe-card[data-id="${created.id}"]`, 60);
  log(sheet().textContent.includes('Butter the ramekins.') && sheet().textContent.includes('Heavy cream') && !sheet().textContent.includes('Claude is translating'), 'Fiche en anglais (étapes, ingrédients), sans traduction à faire');
  await click('.sheet [data-action="close"]');
  const before = requests.length;
  await click('.recipe-card[data-id="ancienne"]', 120);
  log(requests.length === before + 1 && requests.at(-1).tools[0].name === 'traduire_recette' && requests.at(-1).messages[0].content[0].text.includes('anglais'), 'Ancienne recette (française) : Claude la traduit à l\'ouverture');
  log(sheet().textContent.includes('Ham omelette') && sheet().textContent.includes('Beat the eggs.'), 'Traduction affichée tout de suite');
  log(globalThis.__db.docs.get(F + 'recettes/ancienne').translations?.en?.steps[0] === 'Beat the eggs.' && globalThis.__db.docs.get(F + 'recettes/ancienne').title === 'Omelette au jambon', 'Traduction gardée pour le foyer, la recette française intacte');
  await click('.sheet [data-action="close"]');
  await click('.recipe-card[data-id="ancienne"]', 60);
  log(requests.length === before + 1, 'Rouverte : pas de nouvelle traduction');
  log(!P.errors.length, `Aucune erreur JS ${P.errors.join(' ')}`);
});
