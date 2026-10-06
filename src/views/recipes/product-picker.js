// Kookia — Choix des produits à utiliser en priorité.

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { thumb } from '../../components/product-visuals.js';
import { openSheet } from '../../components/sheet.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';
import { rerenderIf } from '../app/router.js';
import { ui } from '../app/ui-state.js';

export function openProductPicker() {
  const sheet = openSheet({
    tall: true,
    render: () => html`
      <header class="sheet-head">
        <button class="link" data-action="none">Aucun</button>
        <h2>Produits à utiliser</h2>
        <button class="link strong" data-action="close">OK</button>
      </header>
      <div class="sheet-body">
        <section class="group">
          ${store.sortedProducts().map((p) => html`
            <button class="pick" role="checkbox" aria-checked="${String(ui.priority.has(p.id))}" data-action="toggle" data-id="${p.id}">
              <span class="box">${I.check}</span>
              ${thumb(p)}
              <span class="product-text"><span class="product-name">${p.name}</span><span class="product-meta">${S.stockLabel(p)}</span></span>
            </button>`)}
        </section>
      </div>`,
    actions: {
      toggle: (el) => {
        ui.customPriority = true;
        const id = el.dataset.id;
        if (ui.priority.has(id)) ui.priority.delete(id);
        else ui.priority.add(id);
        sheet.update();
      },
      none: () => {
        ui.customPriority = true;
        ui.priority.clear();
        sheet.update();
      }
    },
    onData: () => sheet.update(),
    onClose: () => rerenderIf('recettes')
  });
}
