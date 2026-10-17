// Kookia — Fiche produit : poids ou contenance, chiffre et unité séparés (g | kg | cl | L).

import { html } from '../../components/html.js';
import { markUnit, unitInput } from '../../components/unit-input.js';
import * as S from '../../services/index.js';
import { t } from '../../services/i18n/i18n.js';

/**
 * État du champ, recalculé si le poids a changé ailleurs (code-barres, photo) :
 * { text, amount, unit (choisie, ou null = défaut selon la catégorie), legacy (ancien texte libre, ex. « 1 pot ») }.
 */
function qty(ctx) {
  const { p, view } = ctx;
  if (view.qty?.text !== p.quantity) {
    const split = S.splitAmount(p.quantity, S.QUANTITY_UNITS);
    view.qty = split
      ? { text: p.quantity, amount: split.amount, unit: split.unit, legacy: false }
      : { text: p.quantity, amount: p.quantity, unit: null, legacy: true };
  }
  return view.qty;
}

function unitOf(ctx) {
  return qty(ctx).unit ?? S.defaultUnit(ctx.p.category);
}

/** Poids enregistré : « 1,5 kg » ; un texte qui n'est pas un nombre est gardé tel quel (« 4 pots »). */
function store(ctx) {
  const state = qty(ctx);
  ctx.p.quantity = state.legacy ? state.amount : S.joinAmount(state.amount, unitOf(ctx)) ?? state.amount.trim();
  state.text = ctx.p.quantity;
}

export function quantityField(ctx) {
  const state = qty(ctx);
  return html`
    <div class="field unit-field"><span>${t('qty.field')}</span>
      ${unitInput({ name: 'quantity', amount: state.amount, unit: state.legacy ? null : unitOf(ctx), units: S.QUANTITY_UNITS,
        dataset: { unitfor: 'quantity' }, label: t('qty.fieldNumber'), placeholder: '500' })}
    </div>`;
}

export function onQuantityInput(ctx, value) {
  const state = qty(ctx);
  // L'unité affichée quand on tape le chiffre est celle qu'on a vue : elle ne change plus avec la catégorie.
  if (!state.unit && value.trim()) state.unit = unitOf(ctx);
  state.amount = value;
  state.legacy = false;
  store(ctx);
  markUnit(ctx.sheet.panel.querySelector('.unit-field'), unitOf(ctx));
}

export function setQuantityUnit(ctx, unit) {
  const state = qty(ctx);
  state.unit = unit;
  if (state.legacy && S.amountValue(state.amount) !== null) state.legacy = false;
  if (!state.legacy) store(ctx);
  markUnit(ctx.sheet.panel.querySelector('.unit-field'), unit);
}

/** Catégorie changée : l'unité par défaut suit, tant qu'aucun chiffre n'est tapé ni aucune unité choisie. */
export function refreshQuantityUnit(ctx) {
  const state = qty(ctx);
  if (state.unit || state.legacy) return;
  store(ctx);
  markUnit(ctx.sheet.panel.querySelector('.unit-field'), unitOf(ctx));
}
