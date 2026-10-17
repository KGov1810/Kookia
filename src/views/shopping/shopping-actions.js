// Kookia — Actions de l'écran Courses : cocher, supprimer, ranger (un ou tout le panier), vider le panier, ticket.

import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { openTicket } from '../stock/add-menu.js';
import { openPutAway } from './put-away-sheet.js';
import { openShoppingItem } from './shopping-item-sheet.js';
import { moveItemToFridge } from './shopping-view.js';
import { t } from '../../services/i18n/i18n.js';

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
  'put-away-all': () => openPutAway(),
  'clear-checked': () => store.clearCheckedShopping(),
  'scan-ticket': () => openTicket()
};
