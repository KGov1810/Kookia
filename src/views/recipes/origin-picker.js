// Kookia — Choix de l'origine des recettes.

import { html } from '../../components/html.js';
import { openSheet } from '../../components/sheet.js';
import * as R from '../../data/reference/index.js';
import { rerenderIf } from '../app/router.js';
import { ui } from '../app/ui-state.js';

/** « Toutes », « 🇮🇹 Italienne, 🇯🇵 Japonaise », « « nouilles » »… */
export function originSummary() {
  const labels = ui.filters.origins.map((id) => R.ORIGINS.find((o) => o.id === id)).filter(Boolean)
    .map((o) => `${o.emoji} ${o.label}`);
  const shown = labels.length > 3 ? [...labels.slice(0, 2), `+${labels.length - 2}`] : labels;
  const parts = [...shown];
  if (ui.filters.wish) parts.push(`« ${ui.filters.wish} »`);
  return parts.length ? parts.join(', ') : 'Toutes les cuisines';
}

/** Cuisines à cocher (plusieurs possibles) + envie libre. « Tour du monde » exclut les autres. */
export function openOriginPicker() {
  const draft = { origins: new Set(ui.filters.origins), wish: ui.filters.wish };
  const sheet = openSheet({
    tall: true,
    render: () => html`
      <header class="sheet-head">
        <button class="link" data-action="clear">Effacer</button>
        <h2>Origine</h2>
        <button class="link strong" data-action="done">OK</button>
      </header>
      <div class="sheet-body">
        <section class="group">
          <label class="field stack"><span>Envie de…</span>
            <input name="wish" value="${draft.wish}" placeholder="nouilles, couscous, ramen, curry…" autocomplete="off" enterkeyhint="done">
          </label>
        </section>
        <h2 class="section">Cuisines<small>${draft.origins.size ? `${draft.origins.size} choisie${draft.origins.size > 1 ? 's' : ''}` : 'toutes'}</small></h2>
        <div class="origin-grid" role="group" aria-label="Cuisines">
          ${R.ORIGINS.map((o) => html`<button class="origin-chip" data-action="toggle-origin" data-id="${o.id}" aria-pressed="${String(draft.origins.has(o.id))}"><span aria-hidden="true">${o.emoji}</span>${o.label}</button>`)}
        </div>
        <p class="hint">Plusieurs choix possibles. Avec une cuisine ou une envie, Claude peut prévoir jusqu'à 6 ingrédients à acheter par recette pour rester fidèle à l'originale.</p>
      </div>`,
    actions: {
      'toggle-origin': (el) => {
        const id = el.dataset.id;
        if (draft.origins.has(id)) {
          draft.origins.delete(id);
        } else {
          if (id === 'monde') draft.origins.clear();
          else draft.origins.delete('monde');
          draft.origins.add(id);
        }
        sheet.update();
      },
      clear: () => {
        draft.origins.clear();
        draft.wish = '';
        sheet.update();
      },
      done: () => {
        ui.filters.origins = [...draft.origins];
        ui.filters.wish = draft.wish.trim().slice(0, 80);
        ui.recipeNote = null;
        sheet.close();
        rerenderIf('recettes');
      }
    },
    onInput: (event) => {
      if (event.target.name === 'wish') draft.wish = event.target.value;
    }
  });
}
