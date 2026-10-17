// Kookia — Semaine : les courses regroupées (tout ce qui manque pour la semaine), à ajouter en un toucher.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { openSheet } from '../../components/sheet.js';
import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';

/** Déjà dans la liste de courses (même produit, poids compris dans le nom ou non) ? */
function onList(item) {
  const base = S.splitItemName(item.name).base;
  return state.shopping.some((s) => !s.checked && S.splitItemName(s.name).base.localeCompare(base, 'fr', { sensitivity: 'base' }) === 0);
}

/** Articles de la semaine à ajouter : ni déjà ajoutés, ni déjà dans la liste (indices dans plan.shopping). */
export function missingWeekItems(plan = state.plan) {
  return (plan?.shopping ?? []).map((item, i) => (!item.added && !onList(item) ? i : -1)).filter((i) => i >= 0);
}

/** « Ajouter les 4 manquants aux courses » : sans passer par la liste détaillée. */
export function addWeekShopping() {
  const missing = missingWeekItems();
  if (!missing.length) return;
  const added = store.addPlanShopping(missing);
  toast(added ? t('wshop.added', { n: added }) : t('detail.already'));
}

export function openWeekShopping() {
  const plan = state.plan;
  if (!plan) return null;
  // Coché d'office : ce qui n'est ni déjà ajouté ni déjà dans la liste.
  const picked = new Set(missingWeekItems(plan));
  const sheet = openSheet({
    tall: true,
    render: () => {
      const items = state.plan?.shopping ?? [];
      return html`
        <header class="sheet-head">
          <button class="link" data-action="close">${t('common.close')}</button>
          <h2>${t('week.shopping')}</h2>
          <button class="link strong" data-action="add" ${picked.size ? '' : raw('disabled')}>${t('editor.add')}</button>
        </header>
        <div class="sheet-body">
          ${items.length ? html`
            <p class="hint">${t('wshop.hint')}</p>
            <section class="group">${items.map((item, i) => html`
              <button class="pick" role="checkbox" aria-checked="${String(picked.has(i))}" data-action="toggle" data-index="${i}" ${item.added ? raw('disabled') : ''}>
                <span class="box">${I.check}</span>
                <span class="product-text"><span class="product-name">${item.name}</span>
                  <span class="product-meta">${[item.quantity, item.added ? t('wshop.addedTag') : onList(item) ? t('wshop.onList') : ''].filter(Boolean).join(' · ')}</span></span>
              </button>`)}</section>
            <button class="primary" data-action="add" ${picked.size ? '' : raw('disabled')}>${I.cart}${t('week.addItems', { n: picked.size })}</button>`
            : html`<p class="hint">${t('wshop.nothing')}</p>`}
        </div>`;
    },
    actions: {
      toggle: (el) => {
        const i = Number(el.dataset.index);
        if (picked.has(i)) picked.delete(i);
        else picked.add(i);
        sheet.update();
      },
      add: () => {
        if (!picked.size) return;
        const added = store.addPlanShopping([...picked]);
        sheet.close();
        toast(added ? t('wshop.added', { n: added }) : t('detail.already'));
      }
    }
  });
  return sheet;
}
