// Kookia — Sorties du stock en quantités, fractions comprises : produit entamé (¾ ½ ¼), recette cuisinée,
// unités consommées ou jetées. L'unité qu'on ouvre devient une ligne à part si d'autres restent intactes.

import { toISODate } from '../../services/dates/dates.js';
import { t } from '../../services/i18n/i18n.js';
import { cleanPrice } from '../../services/stats/money.js';
import { openingChanges, remainingLabel, remainingOf, splitAfter } from '../../services/stock/opened.js';
import { logChange } from './history.js';
import { recordMovement } from './movements.js';
import { removeProducts, restoreProducts, saveProduct } from './products.js';
import { state } from './state.js';
import { canWrite } from './writes.js';

/** Unité entamée : part restante ; si elle vient d'être ouverte, date et rangement après ouverture. */
function openedUnit(product, remaining) {
  const fresh = remainingOf(product) >= 1;
  return {
    ...product, count: 1, remaining,
    ...(fresh ? { openedAt: toISODate(new Date()), ...openingChanges(product) } : {})
  };
}

/** Enregistre ce qui reste ; renvoie les lignes créées (unité entamée mise à part). */
function applyRest(product, { whole, opened }) {
  if (!whole && opened === null) {
    removeProducts([product.id], { log: false });
    return [];
  }
  const intact = { ...product, count: whole, remaining: 1, openedAt: '' };
  if (opened === null) {
    saveProduct(intact, { log: false });
    return [];
  }
  if (!whole) {
    saveProduct(openedUnit(product, opened), { log: false });
    return [];
  }
  const id = crypto.randomUUID();
  saveProduct(intact, { log: false });
  saveProduct({ ...openedUnit(intact, opened), id, createdAt: Date.now() }, { log: false, purchase: false });
  return [id];
}

/** « il en reste 2 », « il en reste ½ », « il en reste 2 + ½ entamé », « plus en stock » (lang : 'fr' pour l'historique). */
export function restText({ whole, opened }, lang) {
  if (!whole && opened === null) return t('rest.none', {}, lang);
  if (opened === null) return t('rest.whole', { n: whole }, lang);
  const rest = remainingLabel(opened);
  return whole ? t('rest.both', { n: whole, rest }, lang) : t('rest.opened', { rest }, lang);
}

/**
 * Retire des quantités : entries [{ product, amount }] (en unités, 0,4 = 40 % d'une unité).
 * type 'consomme' ou 'jete' (statistiques) ; details(produit, reste) pour l'historique.
 * Renvoie { before, created } pour « Annuler » (undoTake).
 */
export function takeAmounts(entries, { type, details, unitPrice, action }) {
  const done = { before: [], created: [] };
  if (!canWrite()) return done;
  for (const { product, amount } of entries) {
    const stored = state.products.find((p) => p.id === product.id);
    if (!stored || !(amount > 0)) continue;
    const rest = splitAfter(stored, amount);
    if (!(rest.taken > 0)) continue;
    done.before.push({ ...stored });
    const priced = unitPrice === undefined ? stored : { ...stored, unitPrice: cleanPrice(unitPrice) };
    logChange({
      scope: 'stock', action: action ?? (type === 'jete' ? 'jete' : 'consommation'),
      name: stored.name, itemId: stored.id, details: details(stored, rest).filter(Boolean)
    });
    recordMovement(type, priced, rest.taken);
    done.created.push(...applyRest(priced, rest));
  }
  return done;
}

/** « Annuler » : produits remis comme avant (mouvements effacés), unités mises à part supprimées. */
export function undoTake({ before = [], created = [] } = {}) {
  if (!canWrite()) return;
  if (created.length) removeProducts(created, { log: false });
  restoreProducts(before);
}

/** Entamé : il reste « remaining » (¾, ½, ¼) de l'unité ouverte ; la part en moins compte comme consommée. */
export function openProduct(id, remaining, { unitPrice } = {}) {
  const product = state.products.find((p) => p.id === id);
  if (!product || remaining >= remainingOf(product)) return { before: [], created: [] };
  return takeAmounts([{ product, amount: remainingOf(product) - remaining }], {
    type: 'consomme',
    unitPrice,
    action: 'entame',
    details: (p) => [(p.count ?? 1) > 1 ? `1 sur ${p.count}` : '', `reste ${remainingLabel(remaining)}`]
  });
}
