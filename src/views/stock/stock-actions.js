// Kookia — Actions de l'écran Stock : ajout, lieu, consommation, ouverture d'un produit.

import * as store from '../../data/store/index.js';
import { showTab } from '../app/router.js';
import { ui } from '../app/ui-state.js';
import { openProduceSheet } from '../produce/produce-sheet.js';
import { openEditor } from '../product-editor/product-editor.js';
import { openAddMenu, scanThenEdit } from './add-menu.js';
import { consume, discard, openPart, quickDate } from './stock-gestures.js';
import { closeSwipedRow } from './stock-swipe.js';
import { fridgeView } from './stock-view.js';

/** Actions des boutons (attribut data-action). */
export const stockActions = {
  'add-menu': () => openAddMenu(),
  'add-scan': () => scanThenEdit(),
  'add-produce': () => openProduceSheet(),
  'set-location': (el) => {
    ui.location = el.dataset.value;
    fridgeView.update();
  },
  'add-manual': () => openEditor({ mode: 'manual' }),
  consume: (el) => consume(el.dataset.id),
  'quick-date': (el) => quickDate(el.dataset.id, Number(el.dataset.days)), // date à compléter, en un toucher
  // Boutons révélés en glissant une ligne vers la gauche
  'swipe-rest': (el) => {
    closeSwipedRow();
    openPart(el.dataset.id, Number(el.dataset.value)); // entamé : il en reste ¾, ½ ou ¼
  },
  'swipe-discard': (el) => {
    closeSwipedRow();
    discard(el.dataset.id);
  },
  edit: (el) => {
    const product = store.productById(el.dataset.id);
    if (product) openEditor({ product });
  },
  // Date à compléter : la fiche du premier produit, avec « Lire la date » en haut.
  'read-dates': (el) => {
    const product = store.productById(el.dataset.id);
    if (product) openEditor({ product });
  },
  'go-recipes': () => showTab('recettes')
};
