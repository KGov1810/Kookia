// Kookia — Fiche produit : enregistrement. Un produit déjà en stock s'enregistre tout seul à la fermeture
// (Fermer, OK ou toucher hors de la fiche), avec « Annuler » ; un nouveau produit attend « Ajouter ».

import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';
import { priceIsInvalid } from './editor-price.js';

/** État de la fiche à l'ouverture : sert à savoir si quelque chose a changé. */
export function markClean(ctx) {
  ctx.initial = JSON.stringify(ctx.p);
  ctx.saved = false;
}

function changed(ctx) {
  return ctx.isNew || ctx.view.priceTouched || JSON.stringify(ctx.p) !== ctx.initial;
}

/** Ce qui empêche d'enregistrer, en clair (vide si tout va bien). */
function problemOf(ctx) {
  const { p } = ctx;
  if (!p.name.trim()) return 'Indiquez un nom.';
  if (p.expiry && !S.parseISODate(p.expiry)) return 'Indiquez une date de péremption valide.';
  if (priceIsInvalid(ctx)) return 'Indiquez un prix valide, par exemple 2,49 (ou laissez le champ vide).';
  return '';
}

/**
 * Enregistre la fiche. Renvoie false si elle est incomplète (le message s'affiche dans la fiche).
 * « OK » enregistre toujours (un ancien produit est ainsi remis au format actuel) ; la fermeture, seulement s'il a changé.
 */
export function persist(ctx, { force = true } = {}) {
  const { p, view, isNew, shoppingItemId } = ctx;
  if (!p.name.trim() || view.busy) return false;
  if (S.dateKindOf(p) === 'congele' && !S.hasDate(p.frozenAt)) p.frozenAt = S.isoInDays(0);
  const problem = problemOf(ctx);
  if (problem) {
    view.error = problem;
    ctx.sheet.update();
    return false;
  }
  ctx.saved = true;
  if (!force && !changed(ctx)) return true;
  const stored = isNew ? null : store.productById(p.id);
  const previous = stored ? { ...stored } : null;
  store.saveProduct(p);
  rememberChoices(ctx);
  if (shoppingItemId) store.deleteShoppingItems([shoppingItemId], { reason: 'rangement' });
  if (isNew) toast(`${p.name.trim()} : ajouté ${R.locationOf(p.location).at}`);
  else toast('Modifications enregistrées', 'Annuler', () => previous && store.saveProduct(previous));
  return true;
}

/** Fermeture d'un produit déjà en stock : ce qui a été modifié est gardé. */
export function autoSave(ctx) {
  if (ctx.isNew || ctx.saved || !changed(ctx)) return;
  const problem = problemOf(ctx);
  if (problem) {
    ctx.saved = true;
    toast(`Modification non enregistrée : ${problem.charAt(0).toLowerCase()}${problem.slice(1)}`);
    return;
  }
  persist(ctx, { force: false });
}

/** Avant un geste qui change le stock (Consommé, Congeler, Jeté, Entamé) : on garde d'abord les modifications. */
export function flushEdits(ctx) {
  autoSave(ctx);
  ctx.saved = true;
}

/**
 * Catégorie ou lieu choisis à la main : retenus pour la prochaine fois (les deux iPhone).
 * Déplacer un produit existant au congélateur, c'est le congeler, pas changer son rangement habituel.
 */
function rememberChoices(ctx) {
  const { p, view, isNew } = ctx;
  const location = view.userLocation && (isNew || p.location !== 'congelateur') ? p.location : '';
  store.rememberPlacement(p, { category: view.userCategory ? p.category : '', location });
}
