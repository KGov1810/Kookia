// Tests : Origine des recettes : filtres et consignes.
import { describe, it, test, expect } from 'vitest';
import * as Services from '../../src/services/index.js';
import * as Reference from '../../src/data/reference/index.js';

const S = { ...Services, ...Reference };

test('Origine des recettes : filtres et consignes', async () => {
  const check = (cond, msg, extra = '') => expect.soft(Boolean(cond), `${msg} ${extra}`.trim()).toBe(true);
  const r = (origin, title = 'Plat', ings = []) => ({ title, summary: '', origin, difficulty: 'facile', totalMinutes: 20, ingredients: ings.map((name) => ({ name })) });
  check(S.matchesFilters(r('japonaise'), { origins: ['italienne', 'japonaise'] }), 'japonaise dans italienne+japonaise');
  check(!S.matchesFilters(r('chinoise'), { origins: ['italienne', 'japonaise'] }), 'chinoise exclue');
  check(!S.matchesFilters(r(undefined), { origins: ['italienne'] }), 'ancienne recette sans origine exclue');
  check(S.matchesFilters(r('thaie'), { origins: ['monde'] }) && !S.matchesFilters(r('francaise'), { origins: ['monde'] }), 'Tour du monde : hors cuisine française');
  check(S.matchesFilters(r('japonaise', 'Ramen aux nouilles de blé'), { wish: 'nouilles' }), 'envie « nouilles » trouvée dans le titre');
  check(S.matchesFilters(r('maghrebine', 'Tajine', ['Semoule de couscous']), { wish: 'couscous' }), 'envie « couscous » trouvée dans un ingrédient');
  check(!S.matchesFilters(r('italienne', 'Lasagnes'), { wish: 'nouilles' }), 'envie absente → exclue');
  check(S.matchesFilters(r(undefined, 'Couscous royal'), { wish: 'couscous' }), 'ancienne recette retrouvée par son titre');
  check(S.maxPurchases({}) === 2 && S.maxPurchases({ origins: ['indienne'] }) === 6 && S.maxPurchases({ wish: 'pho' }) === 6, 'achats : 2 par défaut, 6 avec origine ou envie');
  check(S.lacksTagsFor(r(undefined), { origins: ['indienne'] }) && !S.lacksTagsFor(r(undefined), {}), 'recette ancienne signalée seulement si filtre origine');
  let prompt = '';
  globalThis.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    prompt = body.messages[0].content[0].text;
    globalThis.__enum = body.tools[0].input_schema.properties.recettes.items.properties.origine.enum;
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: { recettes: [{ titre: 'Pad thaï', resume: '', difficulte: 'facile', temps_total_minutes: 25, temps_preparation_minutes: 10, portions: 2, regime: 'omnivore', origine: 'thaie', calories_par_portion: 550, batch_cooking: false, conservation_jours: 1, conseils_conservation: '', ingredients: [], etapes: [] }, { titre: 'X', resume: '', difficulte: 'facile', temps_total_minutes: 5, temps_preparation_minutes: 5, portions: 2, regime: 'omnivore', origine: 'inconnue', calories_par_portion: 100, batch_cooking: false, conservation_jours: 0, conseils_conservation: '', ingredients: [], etapes: [] }] } }] }) };
  };
  const out = await S.generateRecipes({ key: 'k', model: 'm', priority: [], others: [], shopping: [], filters: { origins: ['italienne', 'japonaise'], wish: 'nouilles' } });
  check(prompt.includes('Cuisines demandées : italienne, japonaise') && prompt.includes('« nouilles »') && prompt.includes('jusqu\'à 6 ingrédients à acheter'), 'consignes : origines, envie, 6 achats');
  check(!globalThis.__enum.includes('monde') && globalThis.__enum.includes('autre'), 'schéma : origines + « autre »');
  check(out[0].origin === 'thaie' && out[1].origin === 'autre', 'origine lue, inconnue → « autre »');
  await S.generateRecipes({ key: 'k', model: 'm', priority: [], others: [], shopping: [], filters: { origins: ['monde'] } });
  check(prompt.includes('Tour du monde') && !prompt.includes('Cuisines demandées'), 'consigne Tour du monde');
  await S.generateRecipes({ key: 'k', model: 'm', priority: [], others: [], shopping: [], filters: {} });
  check(!prompt.includes('jusqu\'à 6') && !prompt.includes('Envie'), 'sans origine : pas de consigne ni d\'achats en plus');

});
