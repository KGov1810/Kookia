// Kookia — Fiche produit : « Jeté » (on choisit combien d'unités partent à la poubelle).

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';

/** Nombre d'unités réellement en stock (pas celui en cours de modification dans la fiche). */
function inStock(ctx) {
  return store.productById(ctx.p.id)?.count ?? 1;
}

export function discardSection(ctx) {
  const { view } = ctx;
  if (!view.discard) {
    return html`<button class="row-button danger" data-action="discard">${I.trash}Jeté : retirer du stock</button>`;
  }
  const total = inStock(ctx);
  const units = Math.min(view.discard.units, total);
  return html`
    <div class="discard-box" role="group" aria-label="Produits jetés">
      <div class="field"><span>Combien en jetez-vous ?</span>
        <div class="stepper">
          <button data-action="discard-minus" aria-label="Un de moins" ${units <= 1 ? raw('disabled') : ''}>−</button>
          <output aria-live="polite">${units} sur ${total}</output>
          <button data-action="discard-plus" aria-label="Un de plus" ${units >= total ? raw('disabled') : ''}>+</button>
        </div>
      </div>
      <div class="row-actions inline">
        <button class="secondary" data-action="discard-cancel">Annuler</button>
        <button class="danger-fill" data-action="discard-confirm">${I.trash}Jeter ${units}</button>
      </div>
    </div>`;
}

function discard(ctx, units) {
  const { p } = ctx;
  // Prix affiché dans la fiche : compte pour ce qui est jeté, même s'il vient d'être saisi.
  const { before } = store.discardUnits(p.id, units, ctx.view.priceTouched ? { unitPrice: p.unitPrice } : {});
  ctx.sheet.close();
  if (!before.length) return;
  const product = before[0];
  const taken = Math.min(units, product.count ?? 1);
  const rest = (product.count ?? 1) - taken;
  const message = rest > 0
    ? `${product.name} : ${taken} jeté${taken > 1 ? 's' : ''}, il en reste ${rest}`
    : `${product.name} : jeté, retiré du stock`;
  toast(message, 'Annuler', () => store.restoreProducts(before));
}

/** Boutons de la section « Jeté ». */
export function discardActions(ctx) {
  const { view } = ctx;
  return {
    discard: () => {
      if (inStock(ctx) <= 1) {
        discard(ctx, 1);
        return;
      }
      view.discard = { units: 1 };
      ctx.sheet.update();
    },
    'discard-minus': () => {
      view.discard.units = Math.max(1, view.discard.units - 1);
      ctx.sheet.update();
    },
    'discard-plus': () => {
      view.discard.units = Math.min(inStock(ctx), view.discard.units + 1);
      ctx.sheet.update();
    },
    'discard-cancel': () => {
      view.discard = null;
      ctx.sheet.update();
    },
    'discard-confirm': () => discard(ctx, view.discard.units)
  };
}
