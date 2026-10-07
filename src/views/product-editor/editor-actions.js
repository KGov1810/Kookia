// Kookia — Fiche produit : boutons (enregistrer, scanner, lieu, date, congeler…).

import { pickImage } from '../../components/platform.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';
import { openScanner } from '../scanner/scanner.js';
import { priceIsInvalid } from './editor-price.js';
import { handleBarcode, handleDatePhoto, handleProductPhoto } from './editor-recognition.js';
import { setKind, setLocation } from './editor-state.js';
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
      p.expiry = S.isoInDays(Number(el.dataset.days));
      view.dateTouched = true;
      ctx.sheet.update();
    },
    'set-loc': (el) => {
      view.locationTouched = true;
      setLocation(ctx, el.dataset.value);
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
      view.info = store.addShoppingItem(p.name, S.quantityLabel(p)) ? 'Ajouté à la liste de courses.' : 'Déjà dans la liste de courses.';
      view.error = '';
      ctx.sheet.update();
    },
    'add-to-same': () => {
      const same = store.productById(view.sameProductId);
      if (!same) return;
      const count = (same.count ?? 1) + (p.count ?? 1);
      store.addUnits(same, p.count ?? 1, p.unitPrice);
      if (shoppingItemId) store.deleteShoppingItems([shoppingItemId], { reason: 'rangement' });
      toast(`${same.name} : ${count} en stock`);
      ctx.sheet.close();
    },
    ...unitsActions(ctx)
  };
}

export function save(ctx) {
  const { p, view, isNew, shoppingItemId } = ctx;
  if (!p.name.trim() || view.busy) return;
  if (S.dateKindOf(p) === 'congele' && !S.hasDate(p.frozenAt)) p.frozenAt = S.isoInDays(0);
  if (p.expiry && !S.parseISODate(p.expiry)) {
    view.error = 'Indiquez une date de péremption valide.';
    ctx.sheet.update();
    return;
  }
  if (priceIsInvalid(ctx)) {
    view.error = 'Indiquez un prix valide, par exemple 2,49 (ou laissez le champ vide).';
    ctx.sheet.update();
    return;
  }
  store.saveProduct(p);
  if (shoppingItemId) store.deleteShoppingItems([shoppingItemId], { reason: 'rangement' });
  toast(isNew ? `${p.name.trim()} : ajouté ${R.locationOf(p.location).at}` : 'Modifications enregistrées');
  ctx.sheet.close();
}
