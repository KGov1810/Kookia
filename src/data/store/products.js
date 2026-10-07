// Kookia — Produits du stock : enregistrer, consommer, retirer.

import { setDoc, writeBatch } from 'firebase/firestore';
import { isoInDays, toISODate } from '../../services/dates/dates.js';
import { quantityLabel } from '../../services/quantities/quantities.js';
import { cleanPrice } from '../../services/stats/money.js';
import { dateKindOf, estimateFreshDays, freezerLimit } from '../../services/stock/stock-dates.js';
import { locationOf } from '../reference/locations.js';
import { db } from './connection.js';
import { logChange, productDiff, productSummary } from './history.js';
import { CATEGORY_VERSION } from './mappers.js';
import { cancelLastMovements, recordMovement } from './movements.js';
import { rememberPrices } from './prices.js';
import { rememberRecipeLinks } from './recipes.js';
import { state } from './state.js';
import { canWrite, ref, write } from './writes.js';

/** Enregistre un produit. Un produit nouveau est noté comme un achat (sauf « Annuler », sans log). */
export function saveProduct(product, { log = true, purchase = log } = {}) {
  if (!canWrite()) return;
  const before = state.products.find((p) => p.id === product.id);
  const count = Math.max(1, Math.round(Number(product.count) || 1));
  if (log) {
    if (!before) {
      logChange({ scope: 'stock', action: 'ajout', name: product.name.trim(), itemId: product.id, details: [productSummary(product)] });
    } else {
      const changes = productDiff(before, { ...product, name: product.name.trim(), count, dateKind: dateKindOf(product), unitPrice: cleanPrice(product.unitPrice) });
      if (changes.length) logChange({ scope: 'stock', action: 'modification', name: product.name.trim(), itemId: product.id, details: changes });
    }
  }
  write(setDoc(ref('produits', product.id), {
    name: (product.name ?? '').trim(),
    expiry: product.expiry,
    category: product.category || 'autre',
    categoryVersion: CATEGORY_VERSION,
    quantity: (product.quantity ?? '').trim(),
    count,
    location: product.location || 'frigo',
    dateKind: dateKindOf(product),
    frozenAt: product.frozenAt || '',
    barcode: product.barcode || '',
    addedBy: product.addedBy || state.settings.userName,
    createdAt: product.createdAt || Date.now(),
    image: product.image || '',
    imageUrl: product.imageUrl || '',
    unitPrice: cleanPrice(product.unitPrice)
  }));
  if (!before && purchase) recordMovement('achat', product, count);
  if (log) rememberPrices([product]);
}

/**
 * Retire des produits en entier. movement : 'consomme' ou 'jete' pour les statistiques
 * (unitPrice : prix affiché dans la fiche, s'il diffère). Renvoie les produits retirés, pour « Annuler ».
 */
export function removeProducts(ids, { log = true, reason = '', movement = '', unitPrice } = {}) {
  if (!canWrite()) return [];
  const removed = state.products.filter((p) => ids.includes(p.id));
  if (!removed.length) return [];
  if (log) {
    removed.forEach((p) => logChange({ scope: 'stock', action: 'suppression', name: p.name, itemId: p.id, details: [reason, quantityLabel(p)] }));
  }
  if (movement) {
    removed.forEach((p) => recordMovement(movement, unitPrice === undefined ? p : { ...p, unitPrice }, p.count ?? 1));
  }
  rememberRecipeLinks(removed);
  const batch = writeBatch(db);
  removed.forEach((p) => batch.delete(ref('produits', p.id)));
  write(batch.commit());
  return removed;
}

/** « Annuler » : remet les produits tels qu'ils étaient. */
export function restoreProducts(products, { movements = true } = {}) {
  if (movements) cancelLastMovements(products.map((p) => p.id));
  products.forEach((p) => {
    logChange({ scope: 'stock', action: 'annulation', name: p.name, itemId: p.id, details: [quantityLabel(p) ? `remis en stock : ${quantityLabel(p)}` : 'remis en stock'] });
    saveProduct(p, { log: false });
  });
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
  const added = [];
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
    const id = crypto.randomUUID();
    const count = Math.max(1, Math.round(Number(item.count) || 1));
    added.push({ id, name: item.name.trim(), category: item.category || 'autre', location, unitPrice: cleanPrice(item.unitPrice), count });
    batch.set(ref('produits', id), {
      name: item.name.trim(),
      expiry,
      location,
      dateKind,
      frozenAt,
      category: item.category || 'autre',
      categoryVersion: CATEGORY_VERSION,
      quantity: (item.quantity ?? '').trim(),
      count,
      barcode: '',
      addedBy: state.settings.userName,
      createdAt: now + index,
      image: '',
      imageUrl: '',
      unitPrice: cleanPrice(item.unitPrice)
    });
  });
  shoppingIdsToRemove.forEach((id) => batch.delete(ref('courses', id)));
  write(batch.commit());
  // Statistiques : écrites à part, pour ne pas bloquer l'ajout si les règles ne les autorisent pas encore.
  added.forEach((product) => recordMovement('achat', product, product.count));
  rememberPrices(added);
  const bought = state.shopping.filter((i) => shoppingIdsToRemove.includes(i.id)).map((i) => i.name);
  logChange({
    scope: 'stock', action: 'ticket', name: `${items.length} produit${items.length > 1 ? 's' : ''}`,
    details: [items.map((i) => (i.count > 1 ? `${i.name} ×${i.count}` : i.name)).join(', '), bought.length ? `retirés des courses : ${bought.join(', ')}` : '']
  });
  return items.length;
}
