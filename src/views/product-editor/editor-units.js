// Kookia — Fiche produit : « Consommé », « Congeler » et « Jeté ».
// Un seul exemplaire : le bouton agit tout de suite. Plusieurs : on choisit combien (à partir de 1).

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';

const KINDS = {
  consume: { icon: 'check', label: 'Consommé', question: 'Combien en consommez-vous ?', verb: 'Consommer', style: 'primary-fill' },
  freeze: { icon: 'snow', label: 'Congeler', question: 'Combien en congelez-vous ?', verb: 'Congeler', style: 'primary-fill' },
  discard: { icon: 'trash', label: 'Jeté', question: 'Combien en jetez-vous ?', verb: 'Jeter', style: 'danger-fill' }
};

/** Nombre d'unités réellement en stock (pas celui en cours de modification dans la fiche). */
function inStock(ctx) {
  return store.productById(ctx.p.id)?.count ?? 1;
}

/** Gros bouton « Consommé », « Congeler » ou « Jeté » en haut de la fiche. */
export function unitsTile(ctx, kind) {
  const def = KINDS[kind];
  return html`<button class="tile tile-${kind}" data-action="${kind}" aria-expanded="${String(ctx.view.take?.kind === kind)}">${I[def.icon]}<span>${def.label}</span></button>`;
}

/** Choix du nombre (plusieurs exemplaires), sous les gros boutons. */
export function unitsBox(ctx) {
  const kind = ctx.view.take?.kind;
  if (!kind) return '';
  const def = KINDS[kind];
  const total = inStock(ctx);
  const units = Math.min(ctx.view.take.units, total);
  return html`
    <div class="units-box units-${kind}" role="group" aria-label="${def.question}">
      <div class="field"><span>${def.question}</span>
        <div class="stepper">
          <button data-action="units-minus" aria-label="Un de moins" ${units <= 1 ? raw('disabled') : ''}>−</button>
          <output aria-live="polite">${units} sur ${total}</output>
          <button data-action="units-plus" aria-label="Un de plus" ${units >= total ? raw('disabled') : ''}>+</button>
        </div>
        <button class="chip" data-action="units-all" aria-pressed="${String(units === total)}">Tout (${total})</button>
      </div>
      <div class="row-actions inline">
        <button class="secondary" data-action="units-cancel">Annuler</button>
        <button class="${def.style}" data-action="units-confirm">${def.verb} ${units}</button>
      </div>
    </div>`;
}

/** Prix affiché dans la fiche : il compte pour ce qui sort du stock, même s'il vient d'être saisi. */
export function price(ctx) {
  return ctx.view.priceTouched ? { unitPrice: ctx.p.unitPrice } : {};
}

function outMessage(product, taken, verb) {
  const rest = (product.count ?? 1) - taken;
  if (rest <= 0) return `${product.name} : ${verb}, retiré du stock`;
  return `${product.name} : ${taken} ${verb}${taken > 1 ? 's' : ''}, il en reste ${rest}`;
}

const RUN = {
  consume(ctx, units) {
    const { p } = ctx;
    const total = inStock(ctx);
    // Tout d'un coup : « tout consommé » dans l'historique ; une partie : « 2 sur 10, il en reste 8 ».
    if (units >= total) {
      const before = store.removeProducts([p.id], { reason: 'tout consommé', movement: 'consomme', ...price(ctx) });
      if (before.length) toast(outMessage(before[0], total, 'consommé'), 'Annuler', () => store.restoreProducts(before));
      return;
    }
    const done = store.consumeUnits(p.id, units, price(ctx));
    if (done.before.length) toast(outMessage(done.before[0], units, 'consommé'), 'Annuler', () => store.undoTake(done));
  },
  freeze(ctx, units) {
    const done = store.freezeUnits(ctx.p, units);
    if (!done) return;
    const when = S.formatDate(done.product.expiry, { month: 'long', year: 'numeric' });
    const what = done.frozenId ? `${Math.min(units, done.before.count)} au congélateur` : 'au congélateur';
    toast(`${ctx.p.name} : ${what}, idéalement avant ${when}`, 'Annuler', () => store.undoFreeze(done));
  },
  discard(ctx, units) {
    const done = store.discardUnits(ctx.p.id, units, price(ctx));
    if (done.before.length) toast(outMessage(done.before[0], Math.min(units, done.before[0].count ?? 1), 'jeté'), 'Annuler', () => store.undoTake(done));
  }
};

function run(ctx, kind, units) {
  ctx.view.take = null;
  ctx.sheet.close();
  RUN[kind](ctx, units);
}

/** Boutons « Consommé », « Congeler », « Jeté » et ceux du choix du nombre. */
export function unitsActions(ctx) {
  const { view } = ctx;
  const open = (kind) => () => {
    if (inStock(ctx) <= 1) {
      run(ctx, kind, 1);
      return;
    }
    view.take = view.take?.kind === kind ? null : { kind, units: 1 };
    ctx.sheet.update();
  };
  const set = (units) => {
    view.take.units = Math.max(1, Math.min(inStock(ctx), units));
    ctx.sheet.update();
  };
  return {
    consume: open('consume'),
    freeze: open('freeze'),
    discard: open('discard'),
    'units-minus': () => set(view.take.units - 1),
    'units-plus': () => set(view.take.units + 1),
    'units-all': () => set(inStock(ctx)),
    'units-cancel': () => {
      view.take = null;
      ctx.sheet.update();
    },
    'units-confirm': () => run(ctx, view.take.kind, view.take.units)
  };
}
