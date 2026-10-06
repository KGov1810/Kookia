// Scénario : Origine des recettes.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test("Origine des recettes", async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const CODE = 'ORIGN-EABCD';
  const P0 = `foyers/${CODE}/produits/`, R0 = `foyers/${CODE}/recettes/`;
  const base = { summary: '', difficulty: 'facile', totalMinutes: 20, prepMinutes: 10, servings: 2, batchCooking: false, storageDays: 0, storageTips: '', favorite: false, steps: ['Cuire.'], diet: 'omnivore', kcal: 500 };
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [P0 + 'poulet', { name: 'Filet de poulet', expiry: iso(1), category: 'viande', quantity: '', count: 1, barcode: '', addedBy: 'Kevin', createdAt: 1, image: '', imageUrl: '' }],
    [R0 + 'couscous', { ...base, title: 'Couscous au poulet', origin: 'maghrebine', createdAt: 10, usedProductIds: ['poulet'],
      ingredients: [{ name: 'Filet de poulet', quantity: '300 g', source: 'stock', productId: 'poulet' }, { name: 'Semoule', quantity: '200 g', source: 'a_acheter' }, { name: 'Pois chiches', quantity: '1 boîte', source: 'a_acheter' }, { name: 'Ras el hanout', quantity: '1 c. à soupe', source: 'a_acheter' }] }],
    [R0 + 'ancienne', { title: 'Poulet rôti', summary: '', difficulty: 'facile', totalMinutes: 40, prepMinutes: 10, servings: 2, batchCooking: false, storageDays: 0, storageTips: '', favorite: false, steps: [], createdAt: 5, usedProductIds: ['poulet'],
      ingredients: [{ name: 'Filet de poulet', quantity: '300 g', source: 'stock', productId: 'poulet' }] }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-haiku-4-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('origine', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, text, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  const mine = () => $$('.list').at(-1);
  await tick(50);
  let prompt = '';
  globalThis.fetch = async (url, opts) => {
    prompt = JSON.parse(opts.body).messages[0].content[0].text;
    const recipe = (titre, origine, ings) => ({ titre, resume: '', difficulte: 'facile', temps_total_minutes: 25, temps_preparation_minutes: 10, portions: 2, regime: 'omnivore', origine, calories_par_portion: 550, batch_cooking: false, conservation_jours: 1, conseils_conservation: '', ingredients: ings, etapes: ['Cuire.'] });
    const input = { recettes: [
      recipe('Ramen au poulet', 'japonaise', [{ nom: 'Filet de poulet', quantite: '300 g', valeur: 300, unite: 'g', source: 'stock', ref_stock: 'P1' }, { nom: 'Nouilles ramen', quantite: '200 g', valeur: 200, unite: 'g', source: 'a_acheter', ref_stock: '' }, { nom: 'Sauce soja', quantite: '3 c. à soupe', valeur: 3, unite: 'c. à soupe', source: 'a_acheter', ref_stock: '' }, { nom: 'Miso', quantite: '1 c. à soupe', valeur: 1, unite: 'c. à soupe', source: 'a_acheter', ref_stock: '' }]),
      recipe('Pâtes au poulet et pesto', 'italienne', [{ nom: 'Filet de poulet', quantite: '300 g', valeur: 300, unite: 'g', source: 'stock', ref_stock: 'P1' }, { nom: 'Nouilles fraîches', quantite: '250 g', valeur: 250, unite: 'g', source: 'a_acheter', ref_stock: '' }])
    ] };
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input }] }) };
  };

  await click('.tab[data-tab="recettes"]');
  const originRow = () => $('[data-action="pick-origin"]');
  log(originRow()?.textContent.includes('Toutes les cuisines'), 'Ligne « Origine » : toutes les cuisines par défaut');
  await click(originRow(), 350);
  log(sheet().querySelectorAll('.origin-chip').length === 17, 'Sélecteur : 17 choix (dont Tour du monde et Brésilienne)');
  const chip = (id) => sheet().querySelector(`[data-action="toggle-origin"][data-id="${id}"]`);
  await click(chip('italienne')); await click(chip('japonaise'));
  log(chip('italienne').getAttribute('aria-pressed') === 'true' && chip('japonaise').getAttribute('aria-pressed') === 'true', 'Plusieurs cuisines cochées : italienne + japonaise');
  await click(chip('monde'));
  log(chip('monde').getAttribute('aria-pressed') === 'true' && chip('italienne').getAttribute('aria-pressed') === 'false', '« Tour du monde » décoche les autres');
  await click(chip('italienne'));
  log(chip('monde').getAttribute('aria-pressed') === 'false', 'Choisir une cuisine décoche « Tour du monde »');
  await click(chip('japonaise'));
  await type(sheet().querySelector('[name="wish"]'), 'nouilles');
  await click(chip('coreenne')); await click(chip('coreenne'));
  log(sheet().querySelector('[name="wish"]').value === 'nouilles', 'Le texte « Envie de… » est conservé en cochant');
  await click(sheet().querySelector('[data-action="done"]'), 350);
  log(originRow().textContent.includes('🇮🇹 Italienne, 🇯🇵 Japonaise, « nouilles »'), `Résumé : ${originRow().querySelector('small').textContent}`);
  log(!mine().querySelector('.recipe-card') || ![...mine().querySelectorAll('.recipe-card')].some((c) => c.textContent.includes('Couscous')), 'Recettes enregistrées filtrées (couscous maghrébin masqué)');
  log(text().includes('1 recette ancienne (sans régime, calories ou origine) est masquée'), 'Ancienne recette sans origine : masquée, avec explication');
  await click('[data-action="generate"]', 80);
  log(prompt.includes('Cuisines demandées : italienne, japonaise') && prompt.includes('« nouilles »') && prompt.includes("jusqu'à 6 ingrédients à acheter"), 'Demande à Claude : 2 cuisines, envie « nouilles », jusqu\'à 6 achats');
  const cards = [...mine().querySelectorAll('.recipe-card')];
  log(cards.length === 2 && cards.some((c) => c.textContent.includes('🇯🇵 Japonaise')) && cards.some((c) => c.textContent.includes('🇮🇹 Italienne')), 'Cartes : origine affichée (🇯🇵, 🇮🇹)');
  const compat = $$('h2.section')[0];
  log(compat.textContent.includes('Déjà dans vos recettes') && compat.nextElementSibling.nextElementSibling.textContent.includes('Ramen au poulet'), 'Ramen (3 achats) proposé dans « Déjà dans vos recettes » grâce à la limite de 6');
  await click(cards.find((c) => c.textContent.includes('Ramen')), 400);
  log(sheet().textContent.includes('🇯🇵 Japonaise'), 'Fiche recette : origine affichée');
  w.navigator.share = async (data) => { globalThis.__shared = data.text; };
  await click(sheet().querySelector('[data-action="share"]'), 20);
  log(globalThis.__shared.includes('cuisine japonaise'), 'Partage : « cuisine japonaise »');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  // Envie « couscous » seule : retrouve le couscous enregistré sans générer
  await click(originRow(), 350);
  await click(sheet().querySelector('[data-action="clear"]'));
  await type(sheet().querySelector('[name="wish"]'), 'couscous');
  await click(sheet().querySelector('[data-action="done"]'), 350);
  log([...mine().querySelectorAll('.recipe-card')].map((c) => c.querySelector('h3').textContent.trim()).join() === 'Couscous au poulet', 'Envie « couscous » : le couscous enregistré est retrouvé');
  await click(originRow(), 350);
  await click(sheet().querySelector('[data-action="clear"]'));
  await click(sheet().querySelector('[data-action="done"]'), 350);
  log(originRow().textContent.includes('Toutes les cuisines') && mine().querySelectorAll('.recipe-card').length === 4, 'Effacer : toutes les recettes de nouveau visibles');
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');

});
