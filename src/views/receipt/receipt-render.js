// Kookia — Ticket de caisse : affichage (photos, puis vérification des produits reconnus).

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { unitInput } from '../../components/unit-input.js';
import * as R from '../../data/reference/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';

export function selected(ctx) {
  const { view } = ctx;
  return view.items.filter((i) => i.selected && i.name.trim());
}

/** Articles de la liste de courses qui seront retirés (achetés, ajoutés au stock ou non). */
export function removals(ctx) {
  return ctx.view.items.filter((i) => i.shoppingId && i.removeFromList);
}

/** Total des prix lus sur les lignes cochées, à comparer au ticket. */
export function receiptTotal(ctx) {
  const kept = selected(ctx);
  const priced = kept.filter((i) => i.price !== null);
  if (!kept.length) return '';
  const missing = kept.length - priced.length;
  const total = priced.reduce((sum, i) => sum + i.price, 0);
  return t('ticket.total', { total: S.formatEuro(total), missing: missing ? t('ticket.noPrice', { n: missing }) : '' });
}

/** Bouton de validation : ajouter au stock, ou seulement retirer des articles de la liste. */
function confirmLabel(ctx) {
  const count = selected(ctx).length;
  if (count) return t('ticket.addN', { n: count });
  const listed = removals(ctx).length;
  return listed ? t('ticket.removeN', { n: listed }) : t('ticket.add');
}

export function renderReceipt(ctx) {
  const { view } = ctx;
  const head = view.stage === 'review'
    ? html`<button class="link strong" data-action="confirm" ${canConfirm(ctx) ? '' : raw('disabled')}>${t('common.ok')}</button>`
    : html`<span></span>`;
  return html`
    <header class="sheet-head">
      <button class="link" data-action="close">${t('common.cancel')}</button>
      <h2>${t('ticket.title')}</h2>
      ${head}
    </header>
    <div class="sheet-body">
      ${view.error ? html`<p class="note warn">${view.error}</p>` : ''}
      ${!hasClaudeKey()
        ? html`<p class="note warn">${t('ticket.needKey')}</p>`
        : view.stage === 'photos' ? photosStep(ctx) : reviewStep(ctx)}
    </div>
    ${view.busy ? html`<div class="busy"><span class="spinner"></span><p>${view.busy}</p></div>` : ''}`;
}

export function photosStep(ctx) {
  const { view } = ctx;
  return html`
    <p class="hint">${t('ticket.photoHint')}</p>
    ${view.photos.length ? html`
      <div class="receipt-photos">
        ${view.photos.map((photo, index) => html`
          <div class="receipt-photo"><img src="${photo.preview}" alt="${t('ticket.photoAlt', { n: index + 1 })}">
            <button class="icon-btn" data-action="remove-photo" data-index="${index}" aria-label="${t('ticket.removePhoto', { n: index + 1 })}">${I.x}</button>
          </div>`)}
      </div>` : ''}
    <div class="row-actions">
      <button class="${view.photos.length ? 'secondary' : 'primary'}" data-action="add-photo">${I.camera}${t(view.photos.length ? 'ticket.morePhoto' : 'ticket.takePhoto')}</button>
      ${view.photos.length ? html`<button class="primary" data-action="analyze">${I.sparkle}${t('ticket.read')}</button>` : ''}
    </div>
    <p class="hint">${t('ticket.privacy')}</p>`;
}

const canConfirm = (ctx) => selected(ctx).length > 0 || removals(ctx).length > 0;

/** Une ligne du ticket, et l'article de la liste de courses qu'elle achète (à retirer ou à garder). */
function receiptLine(item, index) {
  return html`
    <div class="receipt-item ${item.food ? '' : 'nonfood'}">
      <div class="receipt-line ${item.selected ? '' : 'off'}">
        <button class="pick-box" role="checkbox" aria-checked="${String(item.selected)}" data-action="toggle-line" data-index="${index}" aria-label="${t('ticket.lineAdd', { name: item.name })}"><span class="box">${I.check}</span></button>
        <span class="thumb">${item.food ? R.category(item.category).emoji : '🧴'}</span>
        <div class="receipt-fields">
          <input data-field="name" data-index="${index}" value="${item.name}" aria-label="${t('editor.productName')}" autocomplete="off">
          <small>${item.receiptText ? `« ${item.receiptText} »` : ''}</small>
          <div class="receipt-qty">
            <div class="stepper small">
              <button data-action="line-minus" data-index="${index}" aria-label="${t('editor.oneLess')}" ${item.count <= 1 ? raw('disabled') : ''}>−</button>
              <output>${item.count}</output>
              <button data-action="line-plus" data-index="${index}" aria-label="${t('editor.oneMore')}">+</button>
            </div>
            ${unitInput({ amount: item.qtyAmount ?? item.quantity, unit: item.qtyLegacy ? null : item.qtyUnit, units: S.unitsFor(item.category),
              dataset: { index }, inputData: { field: 'quantity' }, label: t('qty.fieldNumber'), placeholder: t('ticket.weight') })}
          </div>
          <div class="receipt-place">
            <select class="receipt-location" data-field="location" data-index="${index}" aria-label="${t('stock.place')}">
              ${R.LOCATIONS.map((loc) => html`<option value="${loc.id}" ${item.location === loc.id ? raw('selected') : ''}>${S.placeName(loc.id)}</option>`)}
            </select>
            <label class="receipt-price"><input data-field="price" data-index="${index}" value="${item.priceText}" inputmode="decimal" placeholder="${t('ticket.price')}" aria-label="${t('ticket.priceAria')}" autocomplete="off"><b aria-hidden="true">€</b></label>
          </div>
        </div>
      </div>
      ${item.shoppingId ? html`
        <button class="list-toggle" role="checkbox" data-action="toggle-list" data-index="${index}" aria-pressed="${String(item.removeFromList)}" aria-checked="${String(item.removeFromList)}">
          <span class="box">${I.check}</span>${t('ticket.fromList', { name: item.shoppingName })}
        </button>` : ''}
    </div>`;
}

export function reviewStep(ctx) {
  const { view } = ctx;
  if (!view.items.length) {
    return html`
      <p class="note warn">${t('ticket.nothing')}</p>
      <button class="secondary" data-action="back-to-photos">${t('ticket.retake')}</button>`;
  }
  const lines = view.items.map((item, index) => ({ item, index }));
  const food = lines.filter((l) => l.item.food);
  const other = lines.filter((l) => !l.item.food);
  const listed = removals(ctx);
  return html`
    <p class="note ok">${t('ticket.found', { n: food.length })}${other.length ? t('ticket.nonFood', { n: other.length }) : ''}${t('ticket.check')}</p>
    <p class="hint" id="receipt-total">${receiptTotal(ctx)}</p>
    ${food.length ? html`<section class="group">${food.map((l) => receiptLine(l.item, l.index))}</section>` : ''}
    ${other.length ? html`
      <h2 class="section">${t('ticket.nonFoodTitle')}<small>${other.length}</small></h2>
      <p class="hint">${t('ticket.nonFoodHint')}</p>
      <section class="group">${other.map((l) => receiptLine(l.item, l.index))}</section>` : ''}
    ${listed.length ? html`<p class="hint">${t('ticket.removedFromList', { names: listed.map((i) => i.shoppingName).join(', ') })}</p>` : ''}
    <button class="primary" data-action="confirm" ${canConfirm(ctx) ? '' : raw('disabled')}>${I.check}${confirmLabel(ctx)}</button>
    <button class="link" data-action="back-to-photos">${t('ticket.retake')}</button>`;
}
