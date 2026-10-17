// Kookia — Fiche d'un article de courses.

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { openSheet } from '../../components/sheet.js';
import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { moveItemToFridge } from './shopping-view.js';

/** Fiche d'un article de courses : nom et quantité modifiables. */
export function openShoppingItem(id) {
  const item = state.shopping.find((i) => i.id === id);
  if (!item) return;
  // Ancienne quantité libre (« 2 kg ») : convertie en nombre + poids dans le nom.
  const draft = /^\d*$/.test(item.quantity ?? '')
    ? { name: item.name, quantity: item.quantity ?? '' }
    : S.toShoppingEntry(item.name, item.quantity);
  const sheet = openSheet({
    render: () => html`
      <header class="sheet-head">
        <button class="link" data-action="close">${t('common.cancel')}</button>
        <h2>${t('item.title')}</h2>
        <button class="link strong" data-action="save">${t('common.ok')}</button>
      </header>
      <div class="sheet-body">
        <section class="group">
          <label class="field"><span>${t('item.title')}</span><input name="name" value="${draft.name}" autocomplete="off"></label>
          <label class="field"><span>${t('item.count')}</span><input name="quantity" value="${draft.quantity}" placeholder="—" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" enterkeyhint="done"></label>
        </section>
        <div class="quick">
          ${['1', '2', '3', '4', '6'].map((n) => html`<button data-action="set-qty" data-value="${n}">${n}</button>`)}
          <button data-action="set-qty" data-value="">${t('item.noCount')}</button>
        </div>
        <section class="group">
          <button class="row-button" data-action="to-fridge">${I.jar}${t('item.bought')}</button>
          <button class="row-button danger" data-action="delete">${I.trash}${t('item.remove')}</button>
        </section>
      </div>`,
    actions: {
      save: () => {
        if (!draft.name.trim()) return;
        store.updateShoppingItem(id, draft);
        sheet.close();
      },
      'set-qty': (el) => {
        draft.quantity = el.dataset.value;
        sheet.update();
      },
      'to-fridge': () => {
        store.updateShoppingItem(id, draft);
        sheet.close();
        moveItemToFridge({ ...item, ...draft });
      },
      delete: () => {
        store.deleteShoppingItems([id]);
        sheet.close();
        toast(t('shop.deleted', { name: item.name }), t('common.cancel'), () => store.addShoppingItem(item.name, item.quantity));
      }
    },
    onInput: (event) => {
      if (event.target.name === 'name') draft.name = event.target.value;
      if (event.target.name === 'quantity') {
        const clean = S.sanitizeCount(event.target.value);
        if (event.target.value !== clean) event.target.value = clean;
        draft.quantity = clean;
      }
    }
  });
}
