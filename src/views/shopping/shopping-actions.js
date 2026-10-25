// Kookia — Actions de l'écran Courses : ajouter, cocher, supprimer, ranger (un ou tout le panier), vider le panier, ticket.

import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { openReceipt } from '../receipt/receipt-sheet.js';
import { openPutAway } from './put-away-sheet.js';
import { openShoppingItem } from './shopping-item-sheet.js';
import { moveItemToFridge, stockNote } from './shopping-view.js';

/** Actions des boutons (attribut data-action). */
export const shoppingActions = {
  'toggle-item': (el) => store.toggleShoppingItem(el.dataset.id),
  'delete-item': (el) => {
    const item = state.shopping.find((i) => i.id === el.dataset.id);
    if (!item) return;
    store.deleteShoppingItems([item.id]);
    toast(t('shop.deleted', { name: item.name }), t('common.cancel'), () => store.addShoppingItem(item.name, item.quantity));
  },
  'item-to-fridge': (el) => {
    const item = state.shopping.find((i) => i.id === el.dataset.id);
    if (item) moveItemToFridge(item);
  },
  'edit-item': (el) => openShoppingItem(el.dataset.id),
  restock: (el) => store.addShoppingItem(el.dataset.name), // « À racheter » : un toucher, l'article rejoint la liste
  'put-away-all': () => openPutAway(),
  'clear-checked': () => store.clearCheckedShopping(),
  'scan-ticket': () => openReceipt()
};

/** Champ « Ajouter » des Courses. Un seul champ : « 2 lait » ou « lait x2 » → 2 × Lait ; un poids reste dans le nom (« Farine 1 kg »). */
export function addFromInput(nameInput) {
  const { name, quantity } = S.parseShoppingInput(nameInput.value);
  if (!name) {
    if (nameInput.value.trim()) toast(t('shop.needName'));
    nameInput.focus();
    return;
  }
  const result = store.addShoppingItem(name, quantity, { updateQuantity: true });
  if (result) {
    nameInput.value = '';
    const inStock = stockNote({ name });
    if (result === 'updated') toast(t('shop.qtyUpdated', { name, qty: quantity }));
    else if (inStock) toast(t('shop.addedInStock', { name, left: inStock }));
  } else {
    toast(t('shop.already'));
  }
  nameInput.focus();
}
