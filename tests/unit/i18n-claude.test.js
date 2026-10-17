// Tests : textes de Claude dans les langues du foyer (planning, affichage), mots reconnus en 4 langues.
import { test, expect } from 'vitest';
import { householdLanguages } from '../../src/data/store/languages.js';
import { state } from '../../src/data/store/state.js';
import {
  generateWeekPlan, guessCategory, languageLines, localPlan, localRecipe, openedDays, setLanguage
} from '../../src/services/index.js';
import { recipeUnits } from '../../src/services/stock/recipe-usage.js';

test('Planning : stratégie, batch et courses traduits, alignés sur les articles', async () => {
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: {
    strategie: 'La crème part en premier.',
    recettes: [{ ref: 'R1', titre: 'Pâtes à la crème', resume: '', difficulte: 'facile', temps_total_minutes: 20, temps_preparation_minutes: 5, portions: 2, regime: 'vegetarien', origine: 'italienne', calories_par_portion: 600, batch_cooking: false, conservation_jours: 0, conseils_conservation: '', ingredients: [], etapes: ['Cuire.'],
      traductions: [{ langue: 'en', titre: 'Creamy pasta', resume: '', conseils_conservation: '', ingredients: [], etapes: ['Cook.'] }] }],
    repas: [{ jour: 'J1', repas: 'soir', recette: 'R1', restes: false }],
    batch: { jour: 'J1', duree_minutes: 60, etapes: ['Cuire les pâtes.'], recettes: ['R1'] },
    courses: [{ nom: 'Persil', quantite: '1 botte' }, { nom: '', quantite: '' }, { nom: 'Parmesan', quantite: '100 g' }],
    traductions: [{ langue: 'en', strategie: 'The cream goes first.', batch_etapes: ['Cook the pasta.'], courses: [{ nom: 'Parsley', quantite: '1 bunch' }, { nom: '', quantite: '' }, { nom: 'Parmesan', quantite: '3.5 oz' }] }, { langue: 'de', strategie: 'x', batch_etapes: [], courses: [] }]
  } }] }) });
  const plan = await generateWeekPlan({ key: 'k', model: 'm', products: [], shopping: [], filters: {}, slots: [{ day: 0, meal: 'soir' }], start: '2026-10-19', batchDay: 0, langs: ['fr', 'en'] });
  expect(plan.lang).toBe('fr');
  expect(Object.keys(plan.translations)).toEqual(['en']);
  expect(plan.recipes[0].translations.en.title).toBe('Creamy pasta');
  const local = localPlan({ ...plan, shopping: plan.shopping.map((i) => ({ ...i, added: false })) }, 'en');
  expect([local.strategy, local.batch.steps[0], local.shopping.map((i) => i.name).join(', ')]).toEqual(['The cream goes first.', 'Cook the pasta.', 'Parsley, Parmesan']);
  expect(localPlan(plan, 'fr').strategy).toBe('La crème part en premier.');
  expect(localRecipe(plan.recipes[0], 'es').title).toBe('Pâtes à la crème'); // pas de traduction : langue d'origine
});

test('Langues du foyer, consignes, mots en 4 langues', () => {
  const check = (cond, msg) => expect.soft(Boolean(cond), msg).toBe(true);
  setLanguage('pt');
  state.languages = { a: { lang: 'fr', at: Date.now() }, b: { lang: 'en', at: Date.now() - 90 * 86_400_000 }, c: { lang: 'xx', at: Date.now() } };
  check(householdLanguages().join(',') === 'pt,fr', `Langues du foyer : ${householdLanguages()} (cet iPhone d'abord, iPhone ancien ignoré)`);
  setLanguage('fr');
  check(languageLines(['fr']).length === 1 && languageLines(['es', 'fr'])[1].includes('français') && languageLines(['es', 'fr'])[0].includes('espagnol'), 'Consignes de langue');
  check(guessCategory('Chicken breast') === 'volaille' && guessCategory('Leche entera') === 'laitier' && guessCategory('Queijo minas') === 'fromage' && guessCategory('Thé vert') === 'boisson' && guessCategory('The Laughing Cow') !== 'boisson', 'Catégories en anglais, espagnol, portugais ; « The » n\'est pas du thé');
  check(guessCategory('Bananas') === 'fruits' && guessCategory('Frijoles refritos') === 'conserves' && guessCategory('Pâté de campagne') === 'charcuterie', 'Fruits du catalogue traduits, expressions');
  check(openedDays({ name: 'Leite integral', category: 'autre' }) === 4 && openedDays({ name: 'Soy sauce', category: 'autre' }) === 90, 'Entamé : lait, sauce soja');
  check(recipeUnits({ amount: 2, unit: 'tbsp' }, { name: 'Cream', quantity: '20 cl' }) === 0.15 && recipeUnits({ amount: 200, unit: 'gramos' }, { name: 'Arroz', quantity: '1 kg' }) === 0.2, 'Cuillères et grammes en anglais et espagnol');
});
