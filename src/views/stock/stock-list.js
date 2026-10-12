// Kookia — Liste des produits du stock.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { LOCATION_ICON, dayCounter, thumb } from '../../components/product-visuals.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { simplify } from '../../services/text/text.js';
import { screen, ui } from '../app/ui-state.js';

export function fridgeList() {
  if (!state.products.length) {
    return html`
      <div class="empty">
        <div class="emoji">🧺</div>
        <h2>Rien en stock pour l'instant</h2>
        <p>Ajoutez ce que vous avez au frigo, au congélateur, au placard, et vos fruits et légumes : scannez un code-barres ou un ticket de caisse, choisissez dans la liste des fruits et légumes, ou tapez un nom.</p>
        <button class="primary" data-action="add-scan">${I.barcode}Scanner un code-barres</button>
        <button class="secondary" data-action="add-produce">${I.apple}Fruits et légumes</button>
        <button class="secondary" data-action="add-manual">${I.pencil}Saisir à la main</button>
      </div>`;
  }
  const query = simplify(ui.search.trim());
  const items = store.productsIn(ui.location).filter((p) => !query
    || simplify(p.name).includes(query)
    || simplify(R.category(p.category).label).includes(query));
  if (!items.length) {
    if (query) return html`<p class="hint">Aucun produit ne correspond à « ${ui.search.trim()} ».</p>`;
    return html`<div class="empty small"><p>Rien ${R.locationOf(ui.location).at} pour l'instant.</p>
      <button class="secondary" data-action="add-menu">${I.plus}Ajouter un produit</button></div>`;
  }

  const groups = [['pending', 'Date à compléter'], ['expired', 'Périmés'], ['soon', 'À consommer vite'],
    ['old', 'Oubliés depuis longtemps'], ['ok', 'En stock']];
  return groups.map(([status, title]) => {
    const list = items.filter((p) => store.productStatus(p) === status);
    if (!list.length) return '';
    const hint = status === 'pending'
      ? html`<p class="hint">Touchez un produit pour indiquer sa date (ou « Lire la date » pour la photographier).</p>`
      : status === 'old' ? html`<p class="hint">Au placard depuis plus de 6 mois : pensez-y pour vos prochaines recettes.</p>` : '';
    return html`<h2 class="section ${status}">${title}<small>${list.length}</small></h2>${hint}<div class="list">${list.map(productRow)}</div>`;
  });
}

/** Ligne d'un produit : l'essentiel seulement (entamé, lieu en vue « Tout », quantité) ; la date est dans le compteur. */
function productRow(product) {
  const opened = S.isOpened(product);
  const meta = [
    opened ? `Entamé, reste ${S.remainingLabel(S.remainingOf(product))}` : '', // en tête : ne pas le couper
    S.quantityLabel(product)
  ].filter(Boolean).join(' · ');
  const where = ui.location ? '' : html`<span class="where" title="${R.locationOf(product.location).label}">${LOCATION_ICON[product.location]?.() ?? ''}</span>`;
  return html`
    <div class="product" data-id="${product.id}">
      <div class="swipe-under" aria-hidden="true">
        <span class="swipe-consume">${I.check}Consommé</span>
        <span class="swipe-buttons">
          <button class="swipe-open" data-action="swipe-open" data-id="${product.id}" tabindex="-1">${I.gauge}Entamé</button>
          <button class="swipe-discard" data-action="swipe-discard" data-id="${product.id}" tabindex="-1">${I.trash}Jeté</button>
        </span>
      </div>
      <div class="product-front">
        <button class="consume" data-action="consume" data-id="${product.id}" aria-label="${(product.count ?? 1) > 1 ? `Consommé : un ${product.name} de moins (il en reste ${product.count - 1})` : `Consommé : ${opened ? 'finir' : 'retirer'} ${product.name} du stock`}"></button>
        <button class="product-main" data-action="edit" data-id="${product.id}">
          ${thumb(product)}
          <span class="product-text"><span class="product-name">${product.name}</span>${meta || where ? html`<span class="product-meta">${where}${opened ? openedGauge(product) : ''}${meta}</span>` : ''}</span>
          ${dayCounter(product)}
        </button>
      </div>
    </div>`;
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
      ? `${product.name} : ${S.isOpened(product) ? 'fini, ' : ''}retiré du stock`
      : `${product.name} : il en reste ${product.count - 1}`;
    toast(message, 'Annuler', () => store.undoTake(done));
  }, last ? 180 : 0);
}

/** Jeté (glisser vers la gauche) : une unité, ou la part qui reste d'un produit entamé. */
export function discard(id) {
  const product = store.productById(id);
  if (!product) return;
  const done = store.discardUnits(id, 1);
  if (!done.before.length) return;
  const rest = (product.count ?? 1) - 1;
  toast(rest > 0 ? `${product.name} : 1 jeté, il en reste ${rest}` : `${product.name} : jeté, retiré du stock`, 'Annuler', () => store.undoTake(done));
}
