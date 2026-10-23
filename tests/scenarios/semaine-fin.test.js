// Scénario : planning de la semaine dans le temps — jours passés repliés, semaine terminée effacée automatiquement.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { iso } from '../helpers/dates.js';

test('Semaine : jours passés et fin de semaine', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'SEMAI-NEFIN';
  const F = `foyers/${CODE}/`;
  const recipe = (title) => ({ title, summary: '', difficulty: 'facile', totalMinutes: 20, prepMinutes: 5, servings: 2, batchCooking: false, storageDays: 0, storageTips: '', createdAt: 5, favorite: false, steps: ['Cuire.'], usedProductIds: [], diet: 'omnivore', kcal: 500, ingredients: [] });
  const plan = (start) => ({ start, servings: 2, strategy: '', createdAt: 1, createdBy: 'Kevin', batch: null, shopping: [],
    slots: [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, meal: 'soir', recipeId: day % 2 ? 'gratin' : 'curry', leftovers: false, done: false })) });
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [F + 'recettes/gratin', recipe('Gratin dauphinois')],
    [F + 'recettes/curry', recipe('Curry de lentilles')],
    [F + 'prix/semaine', plan(iso(-3))]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', householdCode: CODE, firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('semaine-fin', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, tick } = P;
  const fs = await import('firebase/firestore');
  const store = await import('../../src/data/store/index.js');
  await tick(60);

  console.log('\n— Jours passés repliés —');
  await click('.tab[data-tab="recettes"]');
  await click('[data-action="recipe-mode"][data-value="semaine"]');
  const sections = () => $$('h2.section').length;
  log(sections() === 4 && $('h2.section.today') && $('[data-action="week-past"]')?.textContent.includes('Voir les 3 jours passés'), 'Aujourd\'hui (J4) et les jours suivants ; « Voir les 3 jours passés »');
  await click('[data-action="week-past"]');
  log(sections() === 7 && $('[data-action="week-past"]').textContent.includes('Masquer les jours passés'), 'Jours passés affichés, puis « Masquer »');
  await click('[data-action="week-past"]');
  log(sections() === 4, 'Jours passés de nouveau repliés');

  console.log('\n— Dernier jour : le planning reste —');
  await fs.setDoc(fs.doc(null, 'foyers', CODE, 'prix', 'semaine'), plan(iso(-6)));
  await tick(40);
  log(globalThis.__db.docs.has(F + 'prix/semaine') && sections() === 1 && $('[data-action="week-past"]').textContent.includes('6 jours passés'), 'Dernier jour de la semaine : planning toujours là');

  console.log('\n— Lendemain : effacé automatiquement —');
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  store.expireWeekPlan(tomorrow); // comme au retour dans l'app le lendemain
  await tick(40);
  log(!globalThis.__db.docs.has(F + 'prix/semaine') && $('.week-empty [data-action="week-setup"]') && $('.note.ok')?.textContent.includes('est terminée : son planning a été effacé'), 'Planning effacé, écran « Préparer la semaine » et message');
  log(globalThis.__db.docs.has(F + 'recettes/gratin') && globalThis.__db.docs.has(F + 'recettes/curry'), 'Les recettes restent dans « Mes recettes »');

  console.log('\n— Planning déjà terminé à l\'ouverture (autre iPhone) —');
  await fs.setDoc(fs.doc(null, 'foyers', CODE, 'prix', 'semaine'), plan(iso(-9)));
  await tick(60);
  log(!globalThis.__db.docs.has(F + 'prix/semaine') && $('.week-empty'), 'Reçu terminé : effacé aussitôt');
  log(!P.errors.length, `Aucune erreur JS ${P.errors.join(' ')}`);
});
