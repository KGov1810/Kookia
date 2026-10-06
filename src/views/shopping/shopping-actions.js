// Kookia — Actions de l'écran Courses : cocher, supprimer, ranger, vider le panier.

import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { openShoppingItem } from './shopping-item-sheet.js';
import { moveItemToFridge } from './shopping-view.js';

/** Actions des boutons (attribut data-action). */
export const shoppingActions = {
  'toggle-item': (el) => store.toggleShoppingItem(el.dataset.id),
  'delete-item': (el) => {
    const item = state.shopping.find((i) => i.id === el.dataset.id);
    if (!item) return;
    store.deleteShoppingItems([item.id]);
    toast(`${item.name} : supprimé`, 'Annuler', () => store.addShoppingItem(item.name, item.quantity));
  },
  'item-to-fridge': (el) => {
    const item = state.shopping.find((i) => i.id === el.dataset.id);
    if (item) moveItemToFridge(item);
  },
  'edit-item': (el) => openShoppingItem(el.dataset.id),
  'clear-checked': () => store.clearCheckedShopping()
};
