// Kookia — Préparer la semaine : jours et repas à cocher, personnes, restes du soir, batch cooking.
// Les choix (repas cochés, options) sont repris la fois suivante ; les filtres sont ceux de l'écran Idées.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { servingsLabel } from '../../components/recipe-visuals.js';
import { openSheet } from '../../components/sheet.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';
import { startWeekGeneration } from './week-generation.js';

const DAYS = [0, 1, 2, 3, 4, 5, 6];
const ALL_DINNERS = DAYS.map((d) => `${d}-soir`);

/** Libellé des filtres de l'écran Idées appliqués au planning. */
function filtersSummary() {
  const f = ui.filters;
  const parts = [];
  if (f.diet) parts.push(R.DIETS.find((d) => d.id === f.diet)?.label);
  if (f.maxMinutes) parts.push(`≤ ${S.formatMinutes(f.maxMinutes)}`);
  if (f.light) parts.push('Léger');
  if (f.batchOnly) parts.push('Batch');
  if (f.difficulty) parts.push(R.DIFFICULTIES.find((d) => d.id === f.difficulty)?.label);
  if (f.origins.length) parts.push(f.origins.map((id) => R.ORIGINS.find((o) => o.id === id)?.emoji).join(' '));
  return parts.filter(Boolean).join(', ');
}

/** Un midi suit-il un soir coché (restes possibles) ? */
const leftoversPossible = (slots) => DAYS.some((d) => d > 0 && slots.has(`${d}-midi`) && slots.has(`${d - 1}-soir`));

export function openWeekSetup() {
  const saved = state.settings.weekSetup ?? {};
  const draft = {
    start: 0,
    slots: new Set(saved.slots?.length ? saved.slots : ALL_DINNERS),
    servings: state.settings.servings || 2,
    leftovers: Boolean(saved.leftovers),
    batch: Boolean(saved.batch),
    batchDay: 0
  };
  const dayName = (d) => S.weekDayLabel(S.isoInDays(draft.start), d, { weekday: 'short', day: 'numeric' });
  const count = () => draft.slots.size;
  const sheet = openSheet({
    tall: true,
    render: () => html`
      <header class="sheet-head">
        <button class="link" data-action="close">Annuler</button>
        <h2>Préparer la semaine</h2>
        <button class="link strong" data-action="plan" ${count() ? '' : raw('disabled')}>Planifier</button>
      </header>
      <div class="sheet-body">
        <span class="filter-label">À partir de</span>
        <div class="chips week-starts" role="group" aria-label="Premier jour">
          ${DAYS.map((d) => html`<button class="chip filter-chip" data-action="set-start" data-value="${d}" aria-pressed="${String(draft.start === d)}">${d === 0 ? "Aujourd'hui" : d === 1 ? 'Demain' : S.weekDayLabel(S.isoInDays(d), 0, { weekday: 'short', day: 'numeric' })}</button>`)}
        </div>
        <section class="group week-grid" role="group" aria-label="Repas à planifier">
          <div class="week-grid-head"><span>Repas</span>
            <span class="quick">
              <button data-action="preset" data-value="soirs" aria-label="Tous les soirs">Soirs</button>
              <button data-action="preset" data-value="tous" aria-label="Midis et soirs">Tout</button>
              <button data-action="preset" data-value="aucun">Aucun</button>
            </span>
          </div>
          ${DAYS.map((d) => html`
            <div class="week-grid-row"><span>${dayName(d)}</span>
              ${['midi', 'soir'].map((meal) => html`<button class="chip filter-chip" data-action="toggle-slot" data-value="${d}-${meal}" aria-pressed="${String(draft.slots.has(`${d}-${meal}`))}">${meal === 'midi' ? 'Midi' : 'Soir'}</button>`)}
            </div>`)}
        </section>
        <section class="group">
          <div class="field"><span>Pour</span>
            <div class="stepper">
              <button data-action="servings-down" aria-label="Une personne de moins" ${draft.servings <= 1 ? raw('disabled') : ''}>−</button>
              <output>${servingsLabel(draft.servings)}</output>
              <button data-action="servings-up" aria-label="Une personne de plus" ${draft.servings >= 12 ? raw('disabled') : ''}>+</button>
            </div>
          </div>
          <label class="field">
            <span class="label-stack">Restes du soir le lendemain midi<small>${leftoversPossible(draft.slots) ? 'Le dîner est cuisiné en double quand le plat s\'y prête' : 'Cochez un midi après un soir pour en profiter'}</small></span>
            <input type="checkbox" class="switch" name="leftovers" ${draft.leftovers ? raw('checked') : ''} ${leftoversPossible(draft.slots) ? '' : raw('disabled')}>
          </label>
          <label class="field">
            <span class="label-stack">Batch cooking<small>Une séance pour avancer plusieurs repas</small></span>
            <input type="checkbox" class="switch" name="batch" ${draft.batch ? raw('checked') : ''}>
          </label>
          ${draft.batch ? html`
            <span class="filter-label">Séance le</span>
            <div class="chips">${DAYS.map((d) => html`<button class="chip filter-chip" data-action="batch-day" data-value="${d}" aria-pressed="${String(draft.batchDay === d)}">${dayName(d)}</button>`)}</div>` : ''}
        </section>
        <p class="hint">Filtres de l'écran Idées : ${filtersSummary() || 'aucun'}. Claude utilise d'abord ce qui périme, partage les achats entre les recettes et regroupe les courses.</p>
        <button class="primary" data-action="plan" ${count() ? '' : raw('disabled')}>${I.sparkle}Planifier ${S.plural(count(), 'repas', 'repas')}</button>
      </div>`,
    actions: {
      'set-start': (el) => { draft.start = Number(el.dataset.value); sheet.update(); },
      'toggle-slot': (el) => {
        const key = el.dataset.value;
        if (draft.slots.has(key)) draft.slots.delete(key);
        else draft.slots.add(key);
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
        if (state.plan && !window.confirm('Remplacer le planning actuel ? Ses recettes restent dans « Mes recettes ».')) return;
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
      sheet.update();
    }
  });
  return sheet;
}
