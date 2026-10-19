// Kookia — Fiche produit : boutons (enregistrer, scanner, lieu, date, congeler…).

import { pickImage } from '../../components/platform.js';
import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { openScanner } from '../scanner/scanner.js';
import { openingActions } from './editor-opening.js';
import { setQuantityUnit } from './editor-quantity.js';
import { handleBarcode, handleDatePhoto, handleProductPhoto } from './editor-recognition.js';
import { persist } from './editor-save.js';
import { enterDate, setCold, setKind, setLocation } from './editor-state.js';
import { unitsActions } from './editor-units.js';

/** Actions des boutons de la fiche, liées au produit en cours. */
export function editorActions(ctx) {
  const { p, view, shoppingItemId } = ctx;
  return {
    save: () => save(ctx),
    scan: () => openScanner((code) => handleBarcode(ctx, code)),
    photo: () => {
      // Sans « capture » : iOS propose appareil photo OU photothèque.
      pickImage({ camera: false }).then((file) => file && handleProductPhoto(ctx, file));
    },
    'date-photo': () => {
      pickImage({ camera: true }).then((file) => file && handleDatePhoto(ctx, file));
    },
    quick: (el) => {
      enterDate(ctx, S.isoInDays(Number(el.dataset.days)));
      ctx.sheet.update();
    },
    'set-unit': (el) => setQuantityUnit(ctx, el.dataset.unit),
    'set-loc': (el) => {
      view.locationTouched = true;
      view.userLocation = true; // choisi à la main : retenu à l'enregistrement
      setLocation(ctx, el.dataset.value);
      ctx.sheet.update();
    },
    'set-cold': (el) => {
      setCold(ctx, el.dataset.value === 'frigo');
      ctx.sheet.update();
    },
    'set-kind': (el) => {
      view.dateTouched = false;
      setKind(ctx, el.dataset.value);
      ctx.sheet.update();
    },
    'remove-photo': () => {
      p.image = '';
      p.imageUrl = '';
      ctx.sheet.update();
    },
    'count-minus': () => {
      p.count = Math.max(1, (p.count ?? 1) - 1);
      ctx.sheet.update();
    },
    'count-plus': () => {
      p.count = Math.min(999, (p.count ?? 1) + 1);
      ctx.sheet.update();
    },
    'to-shopping': () => {
      view.info = store.addShoppingItem(p.name, S.quantityLabel(p)) ? t('editor.addedToList') : t('editor.alreadyInList');
      view.error = '';
      ctx.sheet.update();
    },
    'add-to-same': () => {
      const same = store.productById(view.sameProductId);
      if (!same) return;
      const count = (same.count ?? 1) + (p.count ?? 1);
      store.addUnits(same, p.count ?? 1, p.unitPrice);
      if (shoppingItemId) store.deleteShoppingItems([shoppingItemId], { reason: 'rangement' });
      toast(t('editor.nowInStock', { name: same.name, n: count }));
      ctx.sheet.close();
    },
    ...unitsActions(ctx),
    ...openingActions(ctx)
  };
}

/** « OK » ou « Ajouter » : enregistre puis ferme (rien ne se ferme si la fiche est incomplète). */
export function save(ctx) {
  if (persist(ctx)) ctx.sheet.close();
}
