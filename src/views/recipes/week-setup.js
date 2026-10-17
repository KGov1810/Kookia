// Kookia — Préparer la semaine : jours et repas à cocher, personnes, restes du soir, batch cooking.
// Les choix (repas cochés, options) sont repris la fois suivante ; les filtres sont ceux de l'écran Idées.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { servingsLabel } from '../../components/recipe-visuals.js';
import { openSheet } from '../../components/sheet.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';
import { startWeekGeneration } from './week-generation.js';

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const ALL_DINNERS = DAYS.map((d) => `${d}-soir`);

/** Libellé des filtres de l'écran Idées appliqués au planning. */
function filtersSummary() {
  const f = ui.filters;
  const parts = [];
  if (f.diet) parts.push(S.dietName(f.diet));
  if (f.maxMinutes) parts.push(`≤ ${S.formatMinutes(f.maxMinutes)}`);
  if (f.light) parts.push(t('filters.light'));
  if (f.batchOnly) parts.push(t('filters.batch'));
  if (f.difficulty) parts.push(S.difficultyName(f.difficulty));
  if (f.origins.length) parts.push(f.origins.map((id) => R.ORIGINS.find((o) => o.id === id)?.emoji).join(' '));
  return parts.filter(Boolean).join(', ');
}

/** Un midi suit-il un soir coché (restes possibles) ? */
const leftoversPossible = (slots) => DAYS.some((d) => d > 0 && slots.has(`${d}-midi`) && slots.has(`${d - 1}-soir`));

/** Midis du lendemain de chaque soir coché (le dernier soir n'a pas de lendemain dans la semaine). */
const lunchesAfterDinners = (slots) => DAYS.filter((d) => d > 0 && slots.has(`${d - 1}-soir`)).map((d) => `${d}-midi`);

/** Texte sous l'interrupteur des restes. */
function leftoversHint(draft) {
  if (!draft.leftovers) return t('setup.leftoversOff');
  const count = DAYS.filter((d) => d > 0 && draft.slots.has(`${d}-midi`) && draft.slots.has(`${d - 1}-soir`)).length;
  return count ? t('setup.leftoversOn', { n: count }) : t('setup.leftoversNone');
}

export function openWeekSetup() {
  const saved = state.settings.weekSetup ?? {};
  const draft = {
    start: 0,
    slots: new Set(saved.slots?.length ? saved.slots : ALL_DINNERS),
    servings: state.settings.servings || 2,
    leftovers: Boolean(saved.leftovers),
    autoLunches: new Set(), // midis cochés par l'interrupteur des restes (décochés s'il est désactivé)
    batch: Boolean(saved.batch),
    batchDay: 0
  };
  if (draft.leftovers) draft.autoLunches = new Set(lunchesAfterDinners(draft.slots).filter((k) => draft.slots.has(k)));
  const dayName = (d) => S.weekDayLabel(S.isoInDays(draft.start), d, { weekday: 'short', day: 'numeric' });
  const count = () => draft.slots.size;
  const sheet = openSheet({
    tall: true,
    render: () => html`
      <header class="sheet-head">
        <button class="link" data-action="close">${t('common.cancel')}</button>
        <h2>${t('week.prepare')}</h2>
        <button class="link strong" data-action="plan" ${count() ? '' : raw('disabled')}>${t('setup.plan')}</button>
      </header>
      <div class="sheet-body">
        <span class="filter-label">${t('setup.from')}</span>
        <div class="chips week-starts" role="group" aria-label="${t('setup.firstDay')}">
          ${DAYS.map((d) => html`<button class="chip filter-chip" data-action="set-start" data-value="${d}" aria-pressed="${String(draft.start === d)}">${d === 0 ? t('week.today') : d === 1 ? t('setup.tomorrow') : S.weekDayLabel(S.isoInDays(d), 0, { weekday: 'short', day: 'numeric' })}</button>`)}
        </div>
        <section class="group week-grid" role="group" aria-label="${t('setup.meals')}">
          <div class="week-grid-head"><span>${t('setup.mealsHead')}</span>
            <span class="quick">
              <button data-action="preset" data-value="soirs" aria-label="${t('setup.allDinners')}">${t('setup.dinners')}</button>
              <button data-action="preset" data-value="tous" aria-label="${t('setup.allMeals')}">${t('setup.all')}</button>
              <button data-action="preset" data-value="aucun">${t('setup.none')}</button>
            </span>
          </div>
          ${DAYS.map((d) => html`
            <div class="week-grid-row"><span>${dayName(d)}</span>
              ${['midi', 'soir'].map((meal) => html`<button class="chip filter-chip" data-action="toggle-slot" data-value="${d}-${meal}" aria-pressed="${String(draft.slots.has(`${d}-${meal}`))}">${t(`mealTitle.${meal}`)}</button>`)}
            </div>`)}
        </section>
        <section class="group">
          <div class="field"><span>${t('setup.for')}</span>
            <div class="stepper">
              <button data-action="servings-down" aria-label="${t('filters.lessPerson')}" ${draft.servings <= 1 ? raw('disabled') : ''}>−</button>
              <output>${servingsLabel(draft.servings)}</output>
              <button data-action="servings-up" aria-label="${t('filters.morePerson')}" ${draft.servings >= 12 ? raw('disabled') : ''}>+</button>
            </div>
          </div>
          <label class="field">
            <span class="label-stack">${t('setup.leftovers')}<small>${leftoversHint(draft)}</small></span>
            <input type="checkbox" class="switch" name="leftovers" ${draft.leftovers ? raw('checked') : ''}>
          </label>
          <label class="field">
            <span class="label-stack">${t('batch.title')}<small>${t('setup.batchHint')}</small></span>
            <input type="checkbox" class="switch" name="batch" ${draft.batch ? raw('checked') : ''}>
          </label>
          ${draft.batch ? html`
            <span class="filter-label">${t('setup.batchDay')}</span>
            <div class="chips">${DAYS.map((d) => html`<button class="chip filter-chip" data-action="batch-day" data-value="${d}" aria-pressed="${String(draft.batchDay === d)}">${dayName(d)}</button>`)}</div>` : ''}
        </section>
        <p class="hint">${t('setup.filters', { filters: filtersSummary() || t('setup.noFilters') })}</p>
        <button class="primary" data-action="plan" ${count() ? '' : raw('disabled')}>${I.sparkle}${t('setup.planN', { n: count() })}</button>
      </div>`,
    actions: {
      'set-start': (el) => { draft.start = Number(el.dataset.value); sheet.update(); },
      'toggle-slot': (el) => {
        const key = el.dataset.value;
        if (draft.slots.has(key)) draft.slots.delete(key);
        else draft.slots.add(key);
        draft.autoLunches.delete(key); // choisi à la main : l'interrupteur n'y touche plus
        sheet.update();
      },
      preset: (el) => {
        const value = el.dataset.value;
        draft.slots = new Set(value === 'soirs' ? ALL_DINNERS : value === 'tous' ? DAYS.flatMap((d) => [`${d}-midi`, `${d}-soir`]) : []);
        sheet.update();
      },
      'servings-down': () => { draft.servings = Math.max(1, draft.servings - 1); sheet.update(); },
      'servings-up': () => { draft.servings = Math.min(12, draft.servings + 1); sheet.update(); },
      'batch-day': (el) => { draft.batchDay = Number(el.dataset.value); sheet.update(); },
      plan: () => {
        if (!count()) return;
        if (state.plan && !window.confirm(t('setup.replace'))) return;
        const slots = [...draft.slots].map((key) => ({ day: Number(key.split('-')[0]), meal: key.split('-')[1] }));
        const leftovers = draft.leftovers && leftoversPossible(draft.slots);
        store.updateSettings({ servings: draft.servings, weekSetup: { slots: [...draft.slots], leftovers: draft.leftovers, batch: draft.batch } });
        sheet.close();
        startWeekGeneration({ start: S.isoInDays(draft.start), slots, servings: draft.servings, leftovers, batchDay: draft.batch ? draft.batchDay : null });
      }
    },
    onInput: (event) => {
      const { name, checked } = event.target;
      if (event.type !== 'change' || !['leftovers', 'batch'].includes(name)) return;
      draft[name] = checked;
      if (name === 'leftovers' && checked) {
        // Restes : le midi du lendemain de chaque soir coché est ajouté.
        lunchesAfterDinners(draft.slots).filter((k) => !draft.slots.has(k)).forEach((k) => {
          draft.slots.add(k);
          draft.autoLunches.add(k);
        });
      } else if (name === 'leftovers') {
        draft.autoLunches.forEach((k) => draft.slots.delete(k));
        draft.autoLunches.clear();
      }
      sheet.update();
    }
  });
  return sheet;
}
