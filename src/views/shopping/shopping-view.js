// Kookia — Écran Courses.

import { html, setHTML } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { errorNote, syncLine } from '../../components/status.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { openEditor } from '../product-editor/product-editor.js';

export const shoppingView = {
  render() {
    return html`
      <header class="top"><div><h1>Courses</h1><p class="sync" id="sync-line"></p></div>
        <button class="link" data-action="clear-checked" id="clear-checked" hidden>Vider le panier</button></header>
      <form class="add-item" id="add-item">
        <input id="new-item" placeholder="Article à acheter" autocomplete="off" enterkeyhint="done" aria-label="Article à acheter">
        <input id="new-qty" class="qty" placeholder="Qté" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off" enterkeyhint="done" aria-label="Nombre à acheter (facultatif)">
        <button type="submit" aria-label="Ajouter">${I.plus}</button>
      </form>
      <p class="hint add-hint">Qté : un nombre, facultatif. Pour un poids, écrivez-le avec l'article (« Farine 1 kg »). Touchez un article pour le modifier.</p>
      <div id="shopping-list"></div>`;
  },
  mounted() {
    this.update();
  },
  update() {
    syncLine();
    const toBuy = state.shopping.filter((i) => !i.checked).sort((a, b) => a.createdAt - b.createdAt);
    const inCart = state.shopping.filter((i) => i.checked).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    const clear = document.getElementById('clear-checked');
    if (clear) clear.hidden = inCart.length === 0;
    setHTML('#shopping-list', [
      errorNote(),
      state.shopping.length ? '' : html`
        <div class="empty">
          <div class="emoji">🧺</div>
          <h2>Liste vide</h2>
          <p>Ajoutez des articles ici, depuis une recette, ou depuis la fiche d'un produit en stock.</p>
        </div>`,
      toBuy.length ? html`<h2 class="section">À acheter<small>${toBuy.length}</small></h2><div class="list">${toBuy.map(shoppingRow)}</div>` : '',
      inCart.length ? html`
        <h2 class="section">Dans le panier<small>${inCart.length}</small></h2>
        <div class="list">${inCart.map(shoppingRow)}</div>
        <p class="hint">Touchez l'icône de rangement d'un article pour l'ajouter au stock.</p>` : ''
    ]);
  }
};

/** « En stock : 2 au placard » : pour éviter d'acheter en double. */
export function stockNote(item) {
  const matches = store.stockMatches(item.name);
  if (!matches.length) return '';
  const count = matches.reduce((n, p) => n + (p.count ?? 1), 0);
  const places = [...new Set(matches.map((p) => R.locationOf(p.location).at))].join(' et ');
  return `En stock : ${count} ${places}`;
}

function shoppingRow(item) {
  const inStock = item.checked ? '' : stockNote(item);
  return html`
    <div class="shop-item ${item.checked ? 'checked' : ''}">
      <button class="tick" data-action="toggle-item" data-id="${item.id}" aria-pressed="${String(item.checked)}" aria-label="${item.checked ? 'Décocher' : 'Cocher'} ${item.name}"><span>${I.check}</span></button>
      <button class="shop-text" data-action="edit-item" data-id="${item.id}" aria-label="Modifier ${item.name}${item.quantity ? `, ${item.quantity}` : ''}">
        <span>${item.name}</span>${item.addedBy ? html`<small>par ${item.addedBy}</small>` : ''}${inStock ? html`<small class="in-stock">${inStock}</small>` : ''}
      </button>
      ${item.quantity ? html`<button class="qty-pill" data-action="edit-item" data-id="${item.id}" tabindex="-1">${item.quantity}</button>` : ''}
      ${item.checked
        ? html`<button class="icon-btn" data-action="item-to-fridge" data-id="${item.id}" aria-label="Ranger ${item.name} dans le stock">${I.jar}</button>`
        : html`<button class="icon-btn" data-action="delete-item" data-id="${item.id}" aria-label="Supprimer ${item.name}">${I.x}</button>`}
    </div>`;
}

/** Ranger un article acheté : la fiche produit s'ouvre avec le nom, le nombre et le poids. */
export function moveItemToFridge(item) {
  const { name, quantity, count } = S.fromShoppingEntry(item);
  openEditor({ draft: { name, quantity, count }, shoppingItemId: item.id });
}
