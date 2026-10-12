// Kookia — Planning de la semaine : génération par Claude, et remplacement d'un repas.

import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { rerenderIf } from '../app/router.js';
import { currentFilters, ui } from '../app/ui-state.js';

const URGENCY = { soon: 0, ok: 1, old: 2, pending: 3 };

/** Stock utilisable, du plus urgent au moins urgent (sans les produits périmés). */
function stockByUrgency() {
  return store.sortedProducts()
    .filter((p) => store.productStatus(p) !== 'expired')
    .map((p) => ({ p, rank: URGENCY[store.productStatus(p)] ?? 4 }))
    .sort((a, b) => a.rank - b.rank || (a.p.expiry || '9999').localeCompare(b.p.expiry || '9999'))
    .map((x) => x.p);
}

/** start : AAAA-MM-JJ ; slots : [{ day, meal }] ; batchDay : jour de la séance ou null. */
export async function startWeekGeneration({ start, slots, servings, leftovers, batchDay }) {
  if (ui.week.busy) return;
  ui.week.busy = `Claude prépare ${S.plural(slots.length, 'repas', 'repas')} avec votre stock… (1 à 3 minutes)`;
  ui.week.note = null;
  rerenderIf('recettes');
  try {
    const plan = await S.generateWeekPlan({
      key: state.settings.claudeKey, model: state.settings.model,
      products: stockByUrgency(), shopping: state.shopping, filters: currentFilters(),
      servings, slots, start, leftovers, batchDay
    });
    if (!plan.slots.length) {
      ui.week.note = { kind: 'warn', text: 'Aucun repas reçu, réessayez.' };
      return;
    }
    // Repas demandés sans recette reçue : gardés vides, à compléter avec « Changer ».
    const missing = slots.filter((s) => !plan.slots.some((p) => p.day === s.day && p.meal === s.meal))
      .map((s) => ({ ...s, recipeId: null, leftovers: false }));
    const all = [...plan.slots, ...missing].sort((a, b) => a.day - b.day || S.MEALS.indexOf(a.meal) - S.MEALS.indexOf(b.meal));
    store.saveWeekPlan({ ...plan, slots: all, start, servings });
    ui.week.note = { kind: 'ok', text: `${S.plural(plan.slots.length, 'repas planifié', 'repas planifiés')}${missing.length ? ` ; ${S.plural(missing.length, 'repas', 'repas')} sans recette, à compléter` : ''}.` };
  } catch (error) {
    ui.week.note = { kind: 'error', text: error?.message || String(error) };
  } finally {
    ui.week.busy = '';
    rerenderIf('recettes');
  }
}

/** Remplace la recette d'un repas par une nouvelle de Claude, différente des autres repas de la semaine. */
export async function replaceSlot(index) {
  const plan = state.plan;
  const slot = plan?.slots[index];
  if (!slot || ui.week.slotBusy >= 0) return;
  ui.week.slotBusy = index;
  rerenderIf('recettes');
  try {
    const others = plan.slots.filter((s, i) => i !== index && s.recipeId && s.recipeId !== slot.recipeId)
      .map((s) => state.recipes.find((r) => r.id === s.recipeId)).filter(Boolean);
    const taken = new Set(others.flatMap((r) => r.usedProductIds ?? []));
    const stock = stockByUrgency();
    const withLeftovers = !slot.leftovers && plan.slots.some((s) => s.leftovers && s.recipeId === slot.recipeId);
    const [recipe] = await S.generateRecipes({
      key: state.settings.claudeKey, model: state.settings.model,
      priority: stock.filter((p) => !taken.has(p.id) && store.productStatus(p) === 'soon'),
      others: stock.filter((p) => taken.has(p.id) || store.productStatus(p) !== 'soon'),
      shopping: state.shopping, filters: currentFilters(), count: 1,
      servings: withLeftovers ? plan.servings * 2 : plan.servings,
      extraLines: [
        `Une seule recette, pour le ${S.weekDayLabel(plan.start, slot.day)} (${slot.meal}).`,
        ...(others.length ? [`Déjà au menu cette semaine, à ne pas refaire : ${[...new Set(others.map((r) => r.title))].join(', ')}.`] : []),
        ...(withLeftovers ? ['Le plat sera aussi mangé en restes le lendemain midi : il doit se réchauffer ou se manger froid.'] : [])
      ]
    });
    if (!recipe) throw new Error('Aucune recette reçue, réessayez.');
    store.saveRecipes([recipe], { log: false });
    store.setPlanSlot(index, recipe.id);
    toast(`Nouveau repas : ${recipe.title}`);
  } catch (error) {
    toast(error?.message || String(error));
  } finally {
    ui.week.slotBusy = -1;
    rerenderIf('recettes');
  }
}
