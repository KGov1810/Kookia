// Kookia — Stock : ce que font les gestes d'une ligne, tous avec « Annuler ».
// Rond ou glisser à droite : une unité ; glisser loin à droite : tout ; à gauche : « Il reste ¾ ½ ¼ » ou Jeté ;
// « +3 j · +1 sem · +2 sem » sur une ligne sans date.

import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { screen } from '../app/ui-state.js';
import { openingEffect } from '../product-editor/editor-opening.js';

const rowOf = (id) => screen.querySelector(`.product[data-id="${CSS.escape(id)}"]`);

/** La ligne s'efface avant que le produit quitte le stock (sinon elle disparaîtrait d'un coup). */
function leaving(id, take) {
  const row = rowOf(id);
  row?.classList.add('leaving');
  setTimeout(() => {
    if (!take()) row?.classList.remove('leaving');
  }, 180);
}

/** Le rond d'un produit consomme une unité ; le produit disparaît à la dernière. */
export function consume(id) {
  const product = store.productById(id);
  if (!product) return;
  const last = (product.count ?? 1) <= 1;
  const take = () => {
    const done = store.consumeOne([id]);
    if (!done.before.length) return false;
    const message = last
      ? t(S.isOpened(product) ? 'toast.finished' : 'toast.removed', { name: product.name })
      : t('toast.left', { name: product.name, n: product.count - 1 });
    toast(message, t('common.cancel'), () => store.undoTake(done));
    return true;
  };
  if (last) leaving(id, take);
  else take();
}

/** Glisser loin vers la droite : toutes les unités consommées d'un coup. */
export function consumeAll(id) {
  const product = store.productById(id);
  if (!product) return;
  const count = product.count ?? 1;
  if (count <= 1) return consume(id);
  leaving(id, () => {
    const done = store.consumeUnits(id, count);
    if (!done.before.length) return false;
    toast(t('toast.allConsumed', { name: product.name, n: count }), t('common.cancel'), () => store.undoTake(done));
    return true;
  });
}

/** Glisser vers la gauche, ¾ ½ ¼ : entamé, il en reste cette part (date et rangement d'après ouverture). */
export function openPart(id, remaining) {
  const product = store.productById(id);
  if (!product) return;
  const effect = openingEffect(product);
  const done = store.openProduct(id, remaining);
  if (!done.before.length) return;
  const message = t('opening.toast', { name: product.name, rest: S.remainingLabel(remaining) });
  toast(`${message}${effect ? ` · ${effect}` : ''}`, t('common.cancel'), () => store.undoTake(done));
}

/** Jeté (glisser vers la gauche) : une unité, ou la part qui reste d'un produit entamé. */
export function discard(id) {
  const product = store.productById(id);
  if (!product) return;
  const done = store.discardUnits(id, 1);
  if (!done.before.length) return;
  const rest = (product.count ?? 1) - 1;
  toast(t(rest > 0 ? 'toast.thrownLeft' : 'toast.thrown', { name: product.name, n: rest }), t('common.cancel'), () => store.undoTake(done));
}

/** Un toucher sur « +3 j », « +1 sem »… : la date de l'emballage, retenue pour la prochaine fois. */
export function quickDate(id, days) {
  const product = store.productById(id);
  if (!product) return;
  const before = { ...product };
  const next = { ...product, expiry: S.isoInDays(days) };
  store.saveProduct(next);
  store.rememberShelfLife(next);
  const date = S.formatDate(next.expiry, { day: 'numeric', month: 'long' });
  toast(t('quickDate.done', { name: product.name, date }), t('common.cancel'), () => store.saveProduct(before));
}
