// Kookia — Produits du stock : enregistrer, consommer, retirer.

import { setDoc, writeBatch } from 'firebase/firestore';
import { isoInDays, toISODate } from '../../services/dates/dates.js';
import { quantityLabel } from '../../services/quantities/quantities.js';
import { dateKindOf, estimateFreshDays, freezerLimit } from '../../services/stock/stock-dates.js';
import { locationOf } from '../reference/locations.js';
import { db } from './connection.js';
import { logChange, productDiff, productSummary } from './history.js';
import { CATEGORY_VERSION } from './mappers.js';
import { rememberRecipeLinks } from './recipes.js';
import { state } from './state.js';
import { canWrite, ref, write } from './writes.js';

export function saveProduct(product, { log = true } = {}) {
  if (!canWrite()) return;
  const before = state.products.find((p) => p.id === product.id);
  if (log) {
    if (!before) {
      logChange({ scope: 'stock', action: 'ajout', name: product.name.trim(), itemId: product.id, details: [productSummary(product)] });
    } else {
      const changes = productDiff(before, { ...product, name: product.name.trim(), count: Math.max(1, Math.round(Number(product.count) || 1)), dateKind: dateKindOf(product) });
      if (changes.length) logChange({ scope: 'stock', action: 'modification', name: product.name.trim(), itemId: product.id, details: changes });
    }
  }
  write(setDoc(ref('produits', product.id), {
    name: (product.name ?? '').trim(),
    expiry: product.expiry,
    category: product.category || 'autre',
    categoryVersion: CATEGORY_VERSION,
    quantity: (product.quantity ?? '').trim(),
    count: Math.max(1, Math.round(Number(product.count) || 1)),
    location: product.location || 'frigo',
    dateKind: dateKindOf(product),
    frozenAt: product.frozenAt || '',
    barcode: product.barcode || '',
    addedBy: product.addedBy || state.settings.userName,
    createdAt: product.createdAt || Date.now(),
    image: product.image || '',
    imageUrl: product.imageUrl || ''
  }));
}

/** Retire des produits (consommés ou jetés). Renvoie les produits retirés, pour « Annuler ». */
export function removeProducts(ids, { log = true, reason = '' } = {}) {
  if (!canWrite()) return [];
  const removed = state.products.filter((p) => ids.includes(p.id));
  if (!removed.length) return [];
  if (log) {
    removed.forEach((p) => logChange({ scope: 'stock', action: 'suppression', name: p.name, itemId: p.id, details: [reason, quantityLabel(p)] }));
  }
  rememberRecipeLinks(removed);
  const batch = writeBatch(db);
  removed.forEach((p) => batch.delete(ref('produits', p.id)));
  write(batch.commit());
  return removed;
}

/** « Annuler » : remet les produits tels qu'ils étaient. */
export function restoreProducts(products) {
  products.forEach((p) => {
    logChange({ scope: 'stock', action: 'annulation', name: p.name, itemId: p.id, details: [quantityLabel(p) ? `remis en stock : ${quantityLabel(p)}` : 'remis en stock'] });
    saveProduct(p, { log: false });
  });
}

/**
 * Consomme une unité de chaque produit : le nombre diminue de 1,
 * et le produit n'est retiré du frigo qu'à la dernière unité.
 * Renvoie l'état d'avant (pour « Annuler ») et ce qui a été retiré ou diminué.
 */
export function consumeOne(ids, { reason = '' } = {}) {
  if (!canWrite()) return { before: [], removed: [], decremented: [] };
  const before = state.products.filter((p) => ids.includes(p.id)).map((p) => ({ ...p }));
  const removed = before.filter((p) => (p.count ?? 1) <= 1);
  const decremented = before.filter((p) => (p.count ?? 1) > 1);
  before.forEach((p) => logChange({
    scope: 'stock', action: 'consommation', name: p.name, itemId: p.id,
    details: [(p.count ?? 1) > 1 ? `il en reste ${p.count - 1}` : 'plus en stock', reason]
  }));
  if (removed.length) removeProducts(removed.map((p) => p.id), { log: false });
  decremented.forEach((p) => saveProduct({ ...p, count: p.count - 1 }, { log: false }));
  return { before, removed, decremented };
}

/**
 * Ajoute d'un coup les produits d'un ticket de caisse (date à compléter)
 * et retire de la liste de courses les articles achetés.
 */
export function addReceiptProducts(items, shoppingIdsToRemove = []) {
  if (!canWrite() || !items.length) return 0;
  const batch = writeBatch(db);
  const now = Date.now();
  const today = toISODate(new Date());
  items.forEach((item, index) => {
    const location = locationOf(item.location).id;
    const produce = ['fruits', 'legumes', 'fruits_legumes'].includes(item.category) || location === 'fruits';
    let dateKind = 'dlc';
    let expiry = ''; // frigo : date à compléter (elle est imprimée sur l'emballage)
    let frozenAt = '';
    if (location === 'congelateur') {
      dateKind = 'congele';
      frozenAt = today;
      expiry = freezerLimit(item.category, today);
    } else if (location === 'placard') {
      dateKind = 'aucune';
    } else if (produce) {
      dateKind = 'estimee';
      expiry = isoInDays(estimateFreshDays(item.name, location));
    }
    batch.set(ref('produits', crypto.randomUUID()), {
      name: item.name.trim(),
      expiry,
      location,
      dateKind,
      frozenAt,
      category: item.category || 'autre',
      categoryVersion: CATEGORY_VERSION,
      quantity: (item.quantity ?? '').trim(),
      count: Math.max(1, Math.round(Number(item.count) || 1)),
      barcode: '',
      addedBy: state.settings.userName,
      createdAt: now + index,
      image: '',
      imageUrl: ''
    });
  });
  shoppingIdsToRemove.forEach((id) => batch.delete(ref('courses', id)));
  write(batch.commit());
  const bought = state.shopping.filter((i) => shoppingIdsToRemove.includes(i.id)).map((i) => i.name);
  logChange({
    scope: 'stock', action: 'ticket', name: `${items.length} produit${items.length > 1 ? 's' : ''}`,
    details: [items.map((i) => (i.count > 1 ? `${i.name} ×${i.count}` : i.name)).join(', '), bought.length ? `retirés des courses : ${bought.join(', ')}` : '']
  });
  return items.length;
}
