// Kookia — Choix de l'origine des recettes.

import { html } from '../../components/html.js';
import { openSheet } from '../../components/sheet.js';
import * as R from '../../data/reference/index.js';
import { t } from '../../services/i18n/i18n.js';
import { originName } from '../../services/i18n/labels.js';
import { ui } from '../app/ui-state.js';

/** « Toutes », « 🇮🇹 Italienne, 🇯🇵 Japonaise », « « nouilles » »… */
export function originSummary() {
  const labels = ui.filters.origins.map((id) => R.ORIGINS.find((o) => o.id === id)).filter(Boolean)
    .map((o) => `${o.emoji} ${originName(o.id)}`);
  const shown = labels.length > 3 ? [...labels.slice(0, 2), `+${labels.length - 2}`] : labels;
  const parts = [...shown];
  if (ui.filters.wish) parts.push(t('origins.wishQuoted', { wish: ui.filters.wish }));
  return parts.length ? parts.join(', ') : t('origins.allCuisines');
}

/**
 * Cuisines à cocher (plusieurs possibles) + envie libre. « Tour du monde » exclut les autres.
 * onDone({ origins, wish }) reçoit le choix validé par « OK ».
 */
export function openOriginPicker(onDone) {
  const draft = { origins: new Set(ui.filters.origins), wish: ui.filters.wish };
  const sheet = openSheet({
    tall: true,
    render: () => html`
      <header class="sheet-head">
        <button class="link" data-action="clear">${t('filters.clear')}</button>
        <h2>${t('origins.title')}</h2>
        <button class="link strong" data-action="done">${t('common.ok')}</button>
      </header>
      <div class="sheet-body">
        <section class="group">
          <label class="field stack"><span>${t('origins.wish')}</span>
            <input name="wish" value="${draft.wish}" placeholder="${t('origins.wishPlaceholder')}" autocomplete="off" enterkeyhint="done">
          </label>
        </section>
        <h2 class="section">${t('origins.cuisines')}<small>${draft.origins.size ? t('origins.chosen', { n: draft.origins.size }) : t('origins.any')}</small></h2>
        <div class="origin-grid" role="group" aria-label="${t('origins.cuisines')}">
          ${R.ORIGINS.map((o) => html`<button class="origin-chip" data-action="toggle-origin" data-id="${o.id}" aria-pressed="${String(draft.origins.has(o.id))}"><span aria-hidden="true">${o.emoji}</span>${originName(o.id)}</button>`)}
        </div>
        <p class="hint">${t('origins.hint')}</p>
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
        sheet.close();
        onDone({ origins: [...draft.origins], wish: draft.wish.trim().slice(0, 80) });
      }
    },
    onInput: (event) => {
      if (event.target.name === 'wish') draft.wish = event.target.value;
    }
  });
}
