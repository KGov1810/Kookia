// Kookia — Liste des produits du stock.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { dayCounter, thumb } from '../../components/product-visuals.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { simplify } from '../../services/text/text.js';
import { screen, ui } from '../app/ui-state.js';

export function fridgeList() {
  if (!state.products.length) {
    return html`
      <div class="empty">
        <div class="emoji">🧺</div>
        <h2>${t('stock.emptyTitle')}</h2>
        <p>${t('stock.emptyText')}</p>
        <button class="primary" data-action="add-scan">${I.barcode}${t('add.scan')}</button>
        <button class="secondary" data-action="add-produce">${I.apple}${t('add.produce')}</button>
        <button class="secondary" data-action="add-manual">${I.pencil}${t('add.manual')}</button>
      </div>`;
  }
  const query = simplify(ui.search.trim());
  const items = store.productsIn(ui.location).filter((p) => !query
    || simplify(p.name).includes(query)
    || simplify(R.category(p.category).label).includes(query)
    || simplify(S.categoryName(p.category)).includes(query));
  if (!items.length) {
    if (query) return html`<p class="hint">${t('stock.noMatch', { query: ui.search.trim() })}</p>`;
    return html`<div class="empty small"><p>${t('stock.nothingAt', { at: S.placeAt(ui.location) })}</p>
      <button class="secondary" data-action="add-menu">${I.plus}${t('stock.addProduct')}</button></div>`;
  }

  return ['pending', 'expired', 'check', 'soon', 'old', 'ok'].map((status) => {
    const title = t(`section.${status}`);
    const list = items.filter((p) => store.productStatus(p) === status);
    if (!list.length) return '';
    const hint = status === 'old' ? html`<p class="hint">${t('stock.oldHint')}</p>` : '';
    const head = status === 'pending'
      ? html`<div class="section-row"><h2 class="section ${status}">${title}<small>${list.length}</small></h2>
          <button class="pill-btn" data-action="read-dates" data-id="${list[0].id}">${I.camera}${t('stock.readDates')}</button></div>`
      : html`<h2 class="section ${status}">${title}<small>${list.length}</small></h2>`;
    return html`${head}${hint}<div class="list">${list.map(productRow)}</div>`;
  });
}

// Lieu en toutes lettres sur la ligne, en vue « Tout » : « 250 g, au frigo » (« fruits et légumes » sans « avec les »).
const where = (location) => (location === 'fruits' ? t('where.fruits') : S.placeAt(location));

/** Ligne d'un produit : l'essentiel seulement (entamé, quantité, lieu en vue « Tout ») ; la date est dans le compteur. */
function productRow(product) {
  const opened = S.isOpened(product);
  const location = product.location || 'frigo';
  const parts = [
    opened ? t('opened.rest', { rest: S.remainingLabel(S.remainingOf(product)) }) : '', // en tête : ne pas le couper
    S.quantityLabel(product)
  ].filter(Boolean);
  const place = ui.location ? '' : html`<span class="where" title="${S.placeName(location)}">${parts.length ? ', ' : ''}${where(location)}</span>`;
  const meta = parts.join(', ');
  return html`
    <div class="product" data-id="${product.id}">
      <div class="swipe-under" aria-hidden="true">
        <span class="swipe-consume">${I.check}${t('swipe.consumed')}</span>
        <span class="swipe-buttons">
          <button class="swipe-open" data-action="swipe-open" data-id="${product.id}" tabindex="-1">${I.gauge}${t('swipe.opened')}</button>
          <button class="swipe-discard" data-action="swipe-discard" data-id="${product.id}" tabindex="-1">${I.trash}${t('swipe.thrown')}</button>
        </span>
      </div>
      <div class="product-front">
        <button class="consume" data-action="consume" data-id="${product.id}" aria-label="${consumeLabel(product, opened)}"></button>
        <button class="product-main" data-action="edit" data-id="${product.id}">
          ${thumb(product)}
          <span class="product-text"><span class="product-name">${product.name}</span>${meta || place ? html`<span class="product-meta">${opened ? openedGauge(product) : ''}${meta}${place}</span>` : ''}</span>
          ${dayCounter(product)}
        </button>
      </div>
    </div>`;
}

function consumeLabel(product, opened) {
  if ((product.count ?? 1) > 1) return t('consume.one', { name: product.name, n: product.count - 1 });
  return t(opened ? 'consume.finish' : 'consume.remove', { name: product.name });
}

/** Petite jauge d'un produit entamé : la part qui reste. */
function openedGauge(product) {
  return html`<i class="opened-gauge" style="${raw(`--left: ${Math.round(S.remainingOf(product) * 100)}%`)}" aria-hidden="true"></i>`;
}

/** Le rond d'un produit consomme une unité ; le produit disparaît à la dernière. */
export function consume(id) {
  const product = store.productById(id);
  if (!product) return;
  const last = (product.count ?? 1) <= 1;
  const row = screen.querySelector(`.product[data-id="${CSS.escape(id)}"]`);
  if (last) row?.classList.add('leaving');
  setTimeout(() => {
    const done = store.consumeOne([id]);
    if (!done.before.length) {
      row?.classList.remove('leaving');
      return;
    }
    const message = last
      ? t(S.isOpened(product) ? 'toast.finished' : 'toast.removed', { name: product.name })
      : t('toast.left', { name: product.name, n: product.count - 1 });
    toast(message, t('common.cancel'), () => store.undoTake(done));
  }, last ? 180 : 0);
}

/** Jeté (glisser vers la gauche) : une unité, ou la part qui reste d'un produit entamé. */
export function discard(id) {
  const product = store.productById(id);
  if (!product) return;
  const done = store.discardUnits(id, 1);
  if (!done.before.length) return;
  const rest = (product.count ?? 1) - 1;
  toast(t(rest > 0 ? 'toast.thrownLeft' : 'toast.thrown', { name: product.name, n: rest }), t('common.cancel'), () => store.undoTake(done));
}
