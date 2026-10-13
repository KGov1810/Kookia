// Kookia — Planning de la semaine : un seul document partagé, foyers/{code}/prix/semaine.
// Rangé dans la collection « prix », déjà autorisée par les règles Firestore : rien à recoller dans Firebase.
// { start, servings, slots: [{ day, meal, recipeId, leftovers, done }], batch, shopping: [{ name, quantity, added }], strategy }

import { deleteDoc, setDoc } from 'firebase/firestore';
import { planDayIndex } from '../../services/claude/week-plan.js';
import { logChange } from './history.js';
import { saveRecipes } from './recipes.js';
import { addShoppingItem } from './shopping.js';
import { emit, state } from './state.js';
import { canWrite, ref, write } from './writes.js';

const planRef = () => ref('prix', 'semaine');

function writePlan(plan) {
  state.plan = plan; // affichage immédiat ; l'écoute confirme ensuite
  write(setDoc(planRef(), plan));
  emit('plan');
}

/** Enregistre un nouveau planning et ses recettes (le précédent est remplacé ; ses recettes restent dans « Mes recettes »). */
export function saveWeekPlan({ recipes, slots, batch, shopping, strategy, start, servings }) {
  if (!canWrite()) return null;
  saveRecipes(recipes, { log: false });
  const plan = {
    start, servings, strategy: strategy ?? '',
    slots: slots.map((s) => ({ day: s.day, meal: s.meal, recipeId: s.recipeId, leftovers: Boolean(s.leftovers), done: false })),
    batch: batch ?? null,
    shopping: (shopping ?? []).map((item) => ({ name: item.name, quantity: item.quantity ?? '', added: false })),
    createdAt: Date.now(),
    createdBy: state.settings.userName || ''
  };
  logChange({ scope: 'recettes', action: 'planning', name: `${plan.slots.length} repas`, details: [recipes.map((r) => r.title).join(', ')] });
  writePlan(plan);
  return plan;
}

/**
 * Remplace la recette d'un repas (autre recette de Claude ou choisie dans « Mes recettes »), ou retire le repas (null).
 * Les restes du lendemain suivent le dîner : nouvelle recette, ou repas vide si le dîner est retiré.
 */
export function setPlanSlot(index, recipeId) {
  const plan = state.plan;
  const target = plan?.slots[index];
  if (!target || !canWrite()) return;
  const dinner = target.leftovers ? null : target.recipeId;
  const slots = plan.slots.map((s, i) => {
    if (i === index) return recipeId ? { ...s, recipeId, leftovers: false, done: false } : null;
    if (dinner && s.leftovers && s.recipeId === dinner) return recipeId ? { ...s, recipeId, done: false } : { ...s, recipeId: null, leftovers: false, done: false };
    return s;
  }).filter(Boolean);
  writePlan({ ...plan, slots });
}

/** « J'ai cuisiné » : le repas où la recette est cuisinée est coché (les restes du lendemain, non). */
export function markPlanCooked(recipeId, done = true) {
  const plan = state.plan;
  if (!plan || !canWrite()) return;
  const index = plan.slots.findIndex((s) => s.recipeId === recipeId && !s.leftovers && Boolean(s.done) !== done);
  if (index < 0) return;
  writePlan({ ...plan, slots: plan.slots.map((s, i) => (i === index ? { ...s, done } : s)) });
}

/** Ajoute aux courses les articles choisis de la liste de la semaine ; renvoie le nombre ajouté. */
export function addPlanShopping(indexes) {
  const plan = state.plan;
  if (!plan || !canWrite()) return 0;
  let added = 0;
  const shopping = plan.shopping.map((item, i) => {
    if (!indexes.includes(i) || item.added) return item;
    if (addShoppingItem(item.name, item.quantity)) added += 1;
    return { ...item, added: true };
  });
  writePlan({ ...plan, shopping });
  return added;
}

export function clearWeekPlan() {
  if (!state.plan || !canWrite()) return;
  state.plan = null;
  write(deleteDoc(planRef()));
  emit('plan');
}

/**
 * Semaine terminée : le lendemain du dernier jour, le planning est effacé sur les deux iPhone
 * (ses recettes restent dans « Mes recettes »). Appelé à la réception du planning et au retour dans l'app.
 */
export function expireWeekPlan(today = new Date()) {
  const plan = state.plan;
  if (!plan?.start || planDayIndex(plan.start, today) < 7 || !canWrite()) return null;
  state.endedPlan = { start: plan.start };
  clearWeekPlan();
  return plan;
}
