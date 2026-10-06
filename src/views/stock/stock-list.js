// Kookia — Liste des produits du stock.

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { dayCounter, thumb } from '../../components/product-visuals.js';
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

function productRow(product) {
  const status = store.productStatus(product);
  const meta = [
    ui.location ? '' : R.locationOf(product.location).label,
    S.quantityLabel(product),
    S.stockShort(product),
    product.addedBy ? `par ${product.addedBy}` : ''
  ].filter(Boolean).join(', ');
  return html`
    <div class="product" data-id="${product.id}">
      <button class="consume" data-action="consume" data-id="${product.id}" aria-label="${(product.count ?? 1) > 1 ? `Consommé : un ${product.name} de moins (il en reste ${product.count - 1})` : `Consommé : retirer ${product.name} du stock`}"></button>
      <button class="product-main" data-action="edit" data-id="${product.id}">
        ${thumb(product)}
        <span class="product-text"><span class="product-name">${product.name}</span><span class="product-meta">${meta}</span></span>
        ${dayCounter(product)}
      </button>
    </div>`;
}

/** Le rond d'un produit consomme une unité ; le produit disparaît à la dernière. */
export function consume(id) {
  const product = store.productById(id);
  if (!product) return;
  const last = (product.count ?? 1) <= 1;
  const row = screen.querySelector(`.product[data-id="${CSS.escape(id)}"]`);
  if (last) row?.classList.add('leaving');
  setTimeout(() => {
    const { before } = store.consumeOne([id]);
    if (!before.length) {
      row?.classList.remove('leaving');
      return;
    }
    const message = last
      ? `${product.name} : retiré du stock`
      : `${product.name} : il en reste ${product.count - 1}`;
    toast(message, 'Annuler', () => store.restoreProducts(before));
  }, last ? 180 : 0);
}
