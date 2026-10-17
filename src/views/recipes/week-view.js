// Kookia — Écran Semaine : le planning des repas, jour par jour, partagé avec l'autre iPhone.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { recipeThumb } from '../../components/recipe-visuals.js';
import * as store from '../../data/store/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';
import { planFactor } from './recipe-cooking.js';
import { missingWeekItems } from './week-shopping-sheet.js';

export const MEAL_LABEL = { midi: 'Midi', soir: 'Soir' };

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

export function slotTitle(plan, slot) {
  return `${capitalize(S.weekDayLabel(plan.start, slot.day, { weekday: 'long' }))} ${slot.meal}`;
}

/** « 40 min, avec 3 produits du stock » ou « 30 min, il manque sauce soja » */
function recipeFacts(recipe) {
  const { inFridge, missing } = store.recipeAvailability(recipe);
  const time = S.formatMinutes(recipe.totalMinutes);
  if (missing.length) return `${time}, il manque ${missing.slice(0, 2).map((i) => i.name.toLowerCase()).join(', ')}${missing.length > 2 ? '…' : ''}`;
  return inFridge.length ? `${time}, avec ${S.plural(inFridge.length, 'produit')} du stock` : time;
}

/** « Je l'ai cuisiné, retirer 3 produits » sur le repas du jour (ce que le bouton retire du stock). */
function cookedButton(recipe) {
  const uses = store.recipeUses(recipe, planFactor(recipe)).length;
  return html`<button class="slot-cooked" data-action="slot-cooked" data-id="${recipe.id}">${I.check}Je l'ai cuisiné${uses ? `, retirer ${S.plural(uses, 'produit')}` : ''}</button>`;
}

function slotRow(plan, slot, index) {
  const recipe = state.recipes.find((r) => r.id === slot.recipeId);
  const busy = ui.week.slotBusy === index;
  const change = html`<button class="icon-btn week-change" data-action="week-slot" data-index="${index}" aria-label="Changer le repas du ${slotTitle(plan, slot)}" ${busy ? raw('disabled') : ''}>${busy ? html`<span class="spinner"></span>` : I.refresh}</button>`;
  if (!recipe) {
    return html`
      <div class="week-slot missing"><div class="slot-line"><span class="meal">${MEAL_LABEL[slot.meal]}</span>
        <button class="week-recipe" data-action="week-slot" data-index="${index}"><span class="recipe-thumb empty" aria-hidden="true">?</span><span class="slot-text"><b>Pas de recette</b><small>Touchez pour en choisir une</small></span></button>${change}</div></div>`;
  }
  const today = slot.day === S.planDayIndex(plan.start) && !slot.done && !slot.leftovers;
  return html`
    <div class="week-slot ${slot.done ? 'done' : ''} ${slot.leftovers ? 'leftovers' : ''}"><div class="slot-line"><span class="meal">${MEAL_LABEL[slot.meal]}</span>
      <button class="week-recipe" data-action="open-recipe" data-id="${recipe.id}">
        ${recipeThumb(recipe)}
        <span class="slot-text">
          <b>${slot.done ? html`<span class="cooked">${I.check}</span>` : ''}${slot.leftovers ? 'Restes : ' : ''}${recipe.title}</b>
          <small>${slot.done ? 'Cuisiné · ' : ''}${slot.leftovers ? 'Cuisiné la veille, à réchauffer' : recipeFacts(recipe)}</small>
        </span>
      </button>${change}</div>
      ${today ? cookedButton(recipe) : ''}</div>`;
}

function batchCard(plan) {
  const titles = plan.batch.recipeIds.map((id) => state.recipes.find((r) => r.id === id)?.title.toLowerCase()).filter(Boolean);
  return html`
    <button class="week-batch" data-action="week-batch">
      <span class="batch-icon" aria-hidden="true">${I.box}</span>
      <span class="slot-text"><b>Batch cooking, ${S.formatMinutes(plan.batch.minutes)}</b>
        <small>${titles.length ? `Avance ${titles.join(' · ')}` : 'Préparations pour la semaine'}</small></span>
    </button>`;
}

function emptyWeek() {
  return html`
    <section class="group week-empty">
      <p>Claude prépare les repas de la semaine avec votre stock : ce qui périme d'abord, des achats partagés entre recettes, les restes du soir pour le midi et une séance de batch cooking si vous le voulez.</p>
      <button class="primary" data-action="week-setup" ${hasClaudeKey() ? '' : raw('disabled')}>${I.calendar}Préparer la semaine</button>
      ${hasClaudeKey() ? '' : html`<p class="hint">Ajoutez votre clé API Claude dans Réglages pour planifier la semaine.</p>`}
    </section>`;
}

/** « Du 14 au 20 octobre », ou « Du 28 septembre au 4 octobre » sur deux mois. */
function weekRange(plan) {
  const first = S.weekDayLabel(plan.start, 0, { day: 'numeric', month: 'long' });
  const last = S.weekDayLabel(plan.start, 6, { day: 'numeric', month: 'long' });
  const sameMonth = first.split(' ').slice(1).join(' ') === last.split(' ').slice(1).join(' ');
  return `Du ${sameMonth ? first.split(' ')[0] : first} au ${last}`;
}

/** En-tête : dates, repas cuisinés (barre), stratégie de Claude, courses de la semaine. */
function weekHead(plan) {
  const cooked = plan.slots.filter((s) => s.done).length;
  const total = plan.slots.length;
  const toBuy = plan.shopping.filter((i) => !i.added).length;
  const missing = missingWeekItems(plan).length;
  const intro = [`Pour ${plan.servings} personne${plan.servings > 1 ? 's' : ''}.`, plan.strategy].filter(Boolean).join(' ');
  return html`
    <section class="group week-head">
      <div class="week-title"><h2>${weekRange(plan)}</h2><b>${cooked} repas sur ${total}</b></div>
      <p class="week-intro">${intro}</p>
      <div class="week-progress" role="progressbar" aria-label="Repas cuisinés" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="${cooked}"><i style="${raw(`width: ${total ? Math.round((cooked / total) * 100) : 0}%`)}"></i></div>
      ${missing
        ? html`<button class="outline-btn" data-action="week-shopping-add">${I.cart}Ajouter ${S.plural(missing, 'article')} aux courses</button>
          <button class="link" data-action="week-shopping">Voir la liste de la semaine</button>`
        : html`<button class="outline-btn" data-action="week-shopping">${I.cart}Courses de la semaine${toBuy ? html` <i>${toBuy}</i>` : ''}</button>`}
    </section>`;
}

function planView(plan) {
  const today = S.planDayIndex(plan.start);
  const days = [...new Set([...plan.slots.map((s) => s.day), ...(plan.batch ? [plan.batch.day] : [])])].sort((a, b) => a - b);
  // Jours passés repliés pendant la semaine (sauf si on demande à les voir).
  const past = today <= 6 ? days.filter((d) => d < today) : [];
  const shown = ui.week.showPast ? days : days.filter((d) => !past.includes(d));
  return html`
    ${weekHead(plan)}
    ${today > 6 ? html`<p class="note warn">Cette semaine est terminée : préparez la suivante.</p>
      <button class="primary" data-action="week-setup">${I.calendar}Préparer la semaine suivante</button>` : ''}
    ${past.length ? html`<button class="link week-past" data-action="week-past" aria-expanded="${String(ui.week.showPast)}">${ui.week.showPast ? 'Masquer les jours passés' : `Voir ${past.length > 1 ? `les ${past.length} jours passés` : 'le jour passé'}`}${I.chevron}</button>` : ''}
    ${shown.map((day) => html`
      <h2 class="section week-day-title ${day === today ? 'today' : ''}">${capitalize(S.weekDayLabel(plan.start, day, { weekday: 'long', day: 'numeric', month: 'long' }))}${day === today ? html`<small class="today-badge">Aujourd'hui</small>` : ''}</h2>
      <div class="list week-day">
        ${plan.batch?.day === day ? batchCard(plan) : ''}
        ${plan.slots.map((slot, index) => (slot.day === day ? slotRow(plan, slot, index) : ''))}
      </div>`)}
    ${today > 6 ? '' : html`<button class="link week-new" data-action="week-setup">${I.refresh}Préparer une nouvelle semaine</button>`}`;
}

export function weekView() {
  const plan = state.plan;
  return html`
    ${ui.week.busy ? html`<section class="group week-busy"><span class="spinner"></span><p>${ui.week.busy}</p></section>` : ''}
    ${ui.week.note ? html`<p class="note ${ui.week.note.kind}">${ui.week.note.text}</p>` : ''}
    ${!plan && state.endedPlan && !ui.week.busy ? html`<p class="note ok">La semaine du ${S.weekDayLabel(state.endedPlan.start, 0, { weekday: 'long', day: 'numeric', month: 'long' })} est terminée : son planning a été effacé, ses recettes restent dans « Mes recettes ».</p>` : ''}
    ${plan ? planView(plan) : ui.week.busy ? '' : emptyWeek()}`;
}
