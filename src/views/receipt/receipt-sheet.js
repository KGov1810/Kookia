// Kookia — Ticket de caisse : ouverture de la fiche et boutons.

import { lineActions } from '../../components/line-actions.js';
import { pickImages } from '../../components/platform.js';
import { openSheet } from '../../components/sheet.js';
import { markUnit } from '../../components/unit-input.js';
import * as S from '../../services/index.js';
import { addPhotos, analyze, confirmItems } from './receipt-analysis.js';
import { receiptTotal, renderReceipt } from './receipt-render.js';

/**
 * Photos du ticket → analyse par Claude → vérification → ajout au stock.
 * Pas de date sur un ticket : frigo « date à compléter », congélateur et fruits/légumes
 * en date estimée, placard sans date (ancienneté).
 */
export function openReceipt() {
  const ctx = { view: { stage: 'photos', photos: [], items: [], busy: '', error: '' }, sheet: null };
  ctx.sheet = openSheet({
    tall: true,
    render: () => renderReceipt(ctx),
    actions: {
      'add-photo': () => {
        pickImages().then((files) => addPhotos(ctx, files)); // plusieurs photos d'un coup (photothèque)
      },
      'remove-photo': (el) => {
        ctx.view.photos.splice(Number(el.dataset.index), 1);
        ctx.sheet.update();
      },
      analyze: () => analyze(ctx),
      ...lineActions(() => ctx.view.items, () => ctx.sheet.update()),
      'toggle-list': (el) => {
        const item = ctx.view.items[Number(el.dataset.index)];
        item.removeFromList = !item.removeFromList;
        ctx.sheet.update();
      },
      'back-to-photos': () => {
        ctx.view.stage = 'photos';
        ctx.view.items = [];
        ctx.sheet.update();
      },
      'set-unit': (el) => {
        const item = ctx.view.items[Number(el.dataset.index)];
        if (!item) return;
        item.qtyUnit = el.dataset.unit;
        if (item.qtyLegacy && S.amountValue(item.qtyAmount) !== null) item.qtyLegacy = false;
        if (!item.qtyLegacy) item.quantity = S.joinAmount(item.qtyAmount, item.qtyUnit) ?? item.qtyAmount.trim();
        markUnit(el.closest('.unit-input'), item.qtyUnit);
      },
      confirm: () => confirmItems(ctx)
    },
    onInput(event) {
      const t = event.target;
      const item = ctx.view.items[Number(t.dataset.index)];
      if (!item) return;
      if (t.dataset.field === 'name') item.name = t.value;
      if (t.dataset.field === 'quantity') {
        item.qtyAmount = t.value;
        item.qtyLegacy = false;
        item.quantity = S.joinAmount(t.value, item.qtyUnit ?? S.defaultUnit(item.category)) ?? t.value.trim();
      }
      if (t.dataset.field === 'location') {
        item.location = t.value;
        item.locationTouched = true; // lieu corrigé à la main : retenu pour la prochaine fois
      }
      if (t.dataset.field === 'price') {
        item.priceText = t.value;
        item.price = S.parsePrice(t.value);
        const total = ctx.sheet.panel.querySelector('#receipt-total');
        if (total) total.textContent = receiptTotal(ctx);
      }
    }
  });
  return ctx.sheet;
}
