// Kookia — Écran Courses.

import { html, setHTML } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { errorNote } from '../../components/status.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { openEditor } from '../product-editor/product-editor.js';
import { proposal } from './put-away-sheet.js';

export const shoppingView = {
  render() {
    return html`
      <header class="top">
        <div class="top-row"><div><h1>Courses</h1><p class="sync summary" id="shop-summary"></p></div>
          <button class="head-pill" data-action="scan-ticket" aria-label="Scanner le ticket">${I.receipt}<span>Scanner le ticket</span></button></div>
        <form class="add-item" id="add-item">
          <input id="new-item" placeholder="Ajouter (ex. 2 lait, farine 1 kg)" autocomplete="off" enterkeyhint="done" aria-label="Article à acheter, avec le nombre devant si besoin">
          <button type="submit" aria-label="Ajouter">${I.plus}</button>
        </form>
      </header>
      <div id="shopping-list"></div>`;
  },
  mounted() {
    this.update();
  },
  update() {
    const toBuy = state.shopping.filter((i) => !i.checked).sort((a, b) => a.createdAt - b.createdAt);
    const inCart = state.shopping.filter((i) => i.checked).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
    summaryLine(toBuy.length, inCart.length);
    setHTML('#shopping-list', [
      errorNote(),
      state.shopping.length ? '' : html`
        <div class="empty">
          <div class="emoji">🧺</div>
          <h2>Liste vide</h2>
          <p>Ajoutez des articles ici, depuis une recette, ou depuis la fiche d'un produit en stock.</p>
        </div>`,
      toBuy.length ? html`<h2 class="section">À acheter<small>${toBuy.length}</small></h2><div class="shop-group">${toBuy.map(shoppingRow)}</div>` : '',
      inCart.length ? html`
        <div class="section-row"><h2 class="section">Dans le panier<small>${inCart.length}</small></h2>
          <button class="link" data-action="clear-checked" id="clear-checked">Vider le panier</button></div>
        <div class="shop-group">${inCart.map(shoppingRow)}</div>
        <button class="primary put-away" data-action="put-away-all">${I.jar}${inCart.length > 1 ? `Tout ranger dans le stock (${inCart.length})` : 'Ranger dans le stock'}</button>
        <p class="hint put-away-hint">Chaque article retrouve sa place habituelle. Le bocal d'un article le range seul, avec sa fiche.</p>` : ''
    ]);
  }
};

/**
 * Sous le titre : « 3 à acheter, 2 dans le panier ». Hors ligne ou en erreur, l'état de la synchronisation
 * prend la place (utile au magasin, quand le réseau manque).
 */
function summaryLine(toBuy, inCart) {
  const element = document.getElementById('shop-summary');
  if (!element) return;
  const sync = store.syncLabel();
  const synced = sync.startsWith('Synchronisé');
  const parts = [toBuy ? `${toBuy} à acheter` : '', inCart ? `${inCart} dans le panier` : ''].filter(Boolean);
  element.textContent = synced ? parts.join(', ') || 'Liste vide' : sync;
  element.dataset.state = state.error ? 'error' : synced ? '' : 'offline';
}

/** « Il en reste 2 au placard » : pour éviter d'acheter en double. */
export function stockNote(item) {
  const matches = store.stockMatches(item.name);
  if (!matches.length) return '';
  const count = matches.reduce((n, p) => n + (p.count ?? 1), 0);
  const places = [...new Set(matches.map((p) => R.locationOf(p.location).at))].join(' et ');
  return `Il en reste ${count} ${places}`;
}

/** Nombre à acheter : « × 2 » pour un nombre, sinon tel quel (« 500 g »). */
function quantityText(quantity) {
  return /^\d+$/.test(quantity.trim()) ? `× ${quantity.trim()}` : quantity;
}

function shoppingRow(item) {
  const inStock = item.checked ? '' : stockNote(item);
  const byOther = item.addedBy && item.addedBy !== state.settings.userName; // « Ajouté par Marie » : seulement l'autre personne
  const where = item.checked ? R.locationOf(proposal(item).location).label : '';
  return html`
    <div class="shop-item ${item.checked ? 'checked' : ''}">
      <button class="tick" data-action="toggle-item" data-id="${item.id}" aria-pressed="${String(item.checked)}" aria-label="${item.checked ? 'Décocher' : 'Cocher'} ${item.name}"><span>${I.check}</span></button>
      <button class="shop-text" data-action="edit-item" data-id="${item.id}" aria-label="Modifier ${item.name}${item.quantity ? `, ${item.quantity}` : ''}">
        <span>${item.name}${item.checked && item.quantity ? `, ${item.quantity}` : ''}</span>${inStock ? html`<small class="in-stock">${inStock}</small>` : ''}${byOther ? html`<small>Ajouté par ${item.addedBy}</small>` : ''}
      </button>
      ${item.quantity && !item.checked ? html`<button class="qty-pill" data-action="edit-item" data-id="${item.id}" tabindex="-1">${quantityText(item.quantity)}</button>` : ''}
      ${where ? html`<span class="shop-where">${where}</span>` : ''}
      ${item.checked
        ? html`<button class="icon-btn" data-action="item-to-fridge" data-id="${item.id}" aria-label="Ranger ${item.name} dans le stock (${where})">${I.jar}</button>`
        : html`<button class="icon-btn" data-action="delete-item" data-id="${item.id}" aria-label="Supprimer ${item.name}">${I.x}</button>`}
    </div>`;
}

/** Ranger un article acheté : la fiche produit s'ouvre avec le nom, le nombre et le poids. */
export function moveItemToFridge(item) {
  const { name, quantity, count } = S.fromShoppingEntry(item);
  openEditor({ draft: { name, quantity, count }, shoppingItemId: item.id });
}
