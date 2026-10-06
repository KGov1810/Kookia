// Kookia — Ticket de caisse : ouverture de la fiche et boutons.

import { pickImage } from '../../components/platform.js';
import { openSheet } from '../../components/sheet.js';
import { addPhoto, analyze, confirmItems } from './receipt-analysis.js';
import { renderReceipt } from './receipt-render.js';

/**
 * Photos du ticket → analyse par Claude → vérification → ajout au stock.
 * Pas de date sur un ticket : frigo « date à compléter », congélateur et fruits/légumes
 * en date estimée, placard sans date (ancienneté).
 */
export function openReceipt(firstFilePromise) {
  const ctx = { view: { stage: 'photos', photos: [], items: [], busy: '', error: '' }, sheet: null };
  ctx.sheet = openSheet({
    tall: true,
    render: () => renderReceipt(ctx),
    actions: {
      'add-photo': () => {
        pickImage({ camera: false }).then((file) => file && addPhoto(ctx, file));
      },
      'remove-photo': (el) => {
        ctx.view.photos.splice(Number(el.dataset.index), 1);
        ctx.sheet.update();
      },
      analyze: () => analyze(ctx),
      'toggle-line': (el) => {
        const item = ctx.view.items[Number(el.dataset.index)];
        item.selected = !item.selected;
        ctx.sheet.update();
      },
      'line-minus': (el) => {
        const item = ctx.view.items[Number(el.dataset.index)];
        item.count = Math.max(1, item.count - 1);
        ctx.sheet.update();
      },
      'line-plus': (el) => {
        const item = ctx.view.items[Number(el.dataset.index)];
        item.count = Math.min(99, item.count + 1);
        ctx.sheet.update();
      },
      'back-to-photos': () => {
        ctx.view.stage = 'photos';
        ctx.view.items = [];
        ctx.sheet.update();
      },
      confirm: () => confirmItems(ctx)
    },
    onInput(event) {
      const t = event.target;
      const item = ctx.view.items[Number(t.dataset.index)];
      if (!item) return;
      if (t.dataset.field === 'name') item.name = t.value;
      if (t.dataset.field === 'quantity') item.quantity = t.value;
      if (t.dataset.field === 'location') item.location = t.value;
    }
  });

  if (firstFilePromise) {
    firstFilePromise.then((file) => {
      if (file && ctx.sheet.isOpen) addPhoto(ctx, file);
    });
  }
  return ctx.sheet;
}
