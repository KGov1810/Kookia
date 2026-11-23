// Kookia — Produits du stock : enregistrer, consommer, retirer.

import { setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { quantityLabel } from '../../services/quantities/quantities.js';
import { cleanPrice } from '../../services/stats/money.js';
import { locationOf } from '../reference/locations.js';
import { db } from './connection.js';
import { initialDates } from './fridge-dates.js';
import { countName, logChange, productDiff, productSummary } from './history.js';
import { isEmptied } from './mappers.js';
import { cancelLastMovements, recordMovement } from './movements.js';
import { productFields, productPatch } from './product-fields.js';
import { rememberPrices } from './prices.js';
import { rememberRecipeLinks } from './recipes.js';
import { state } from './state.js';
import { canWrite, ref, write } from './writes.js';

/**
 * Enregistre un produit. Un produit nouveau est noté comme un achat (sauf « Annuler », sans log).
 * base : la version d'où part la modification (fiche ouverte plus tôt) ; par défaut, le produit tel qu'il est en stock.
 * Seul ce qui change par rapport à base est envoyé. Renvoie 'gone' si le produit a été retiré entre-temps par l'autre
 * iPhone (il n'est pas recréé).
 */
export function saveProduct(product, { log = true, purchase = log, base } = {}) {
  if (!canWrite()) return '';
  const current = state.products.find((p) => p.id === product.id);
  if (base && !current) return 'gone';
  const from = base ?? current;
  const fields = productFields(product);
  if (log) {
    if (!from) {
      logChange({ scope: 'stock', action: 'ajout', name: fields.name, itemId: product.id, details: [productSummary(product)] });
    } else {
      const changes = productDiff(from, { ...product, name: fields.name, count: fields.count, dateKind: fields.dateKind, unitPrice: fields.unitPrice });
      if (changes.length) logChange({ scope: 'stock', action: 'modification', name: fields.name, itemId: product.id, details: changes });
    }
  }
  if (!from) {
    write(setDoc(ref('produits', product.id), fields));
    if (purchase) recordMovement('achat', product, fields.count);
  } else {
    // updateDoc : un produit supprimé par l'autre iPhone (pas encore reçu ici) n'est pas recréé.
    const patch = productPatch(from, product);
    if (Object.keys(patch).length) write(updateDoc(ref('produits', product.id), patch));
  }
  if (log) rememberPrices([product]);
  return 'saved';
}

/** Produits tombés à 0 unité (les deux iPhone ont retiré la dernière en même temps) : supprimés. */
export function removeEmptied(docs) {
  const emptied = docs.filter((d) => isEmptied(d.data()));
  if (!emptied.length || !canWrite()) return;
  const batch = writeBatch(db);
  emptied.forEach((d) => batch.delete(ref('produits', d.id)));
  write(batch.commit());
}

/**
 * Retire des produits en entier, sans rien noter : la sortie elle-même (consommé, jeté) est notée par takeAmounts,
 * qui appelle cette fonction quand il ne reste plus rien. Renvoie les produits retirés.
 */
export function removeProducts(ids) {
  if (!canWrite()) return [];
  const removed = state.products.filter((p) => ids.includes(p.id));
  if (!removed.length) return [];
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
    const qty = { qty: { count: p.count ?? 1, quantity: p.quantity ?? '' } };
    logChange({ scope: 'stock', action: 'annulation', name: p.name, itemId: p.id, details: [quantityLabel(p) ? { k: 'hist.restockedQty', p: { qty } } : { k: 'hist.restocked' }] });
    saveProduct(p, { log: false });
  });
}

/**
 * Ajoute d'un coup les produits d'un ticket de caisse, du panier (« Tout ranger », source « courses ») ou d'un scan
 * de plusieurs produits (source « scan », avec code-barres et photo),
 * avec la date adaptée au lieu (frigo : estimée, sauf viande, poisson, charcuterie et traiteur, à compléter),
 * et retire de la liste de courses les articles achetés.
 */
export function addReceiptProducts(items, shoppingIdsToRemove = [], { source = 'ticket' } = {}) {
  if (!canWrite() || !items.length) return 0;
  const batch = writeBatch(db);
  const now = Date.now();
  const added = [];
  items.forEach((item, index) => {
    const location = locationOf(item.location).id;
    const { dateKind, expiry, frozenAt } = initialDates({ name: item.name, category: item.category, location, barcode: item.barcode });
    const id = crypto.randomUUID();
    const count = Math.max(1, Math.round(Number(item.count) || 1));
    added.push({ id, name: item.name.trim(), category: item.category || 'autre', location, unitPrice: cleanPrice(item.unitPrice), count, barcode: item.barcode || '' });
    batch.set(ref('produits', id), productFields({
      name: item.name,
      expiry,
      location,
      dateKind,
      frozenAt,
      category: item.category,
      quantity: item.quantity,
      count,
      barcode: item.barcode, // scan en rafale : code-barres et photo d'Open Food Facts
      createdAt: now + index,
      image: item.image, // ticket : image découpée sur la capture de commande en ligne
      imageUrl: item.imageUrl,
      unitPrice: item.unitPrice
    }));
  });
  shoppingIdsToRemove.forEach((id) => batch.delete(ref('courses', id)));
  write(batch.commit());
  // Statistiques : écrites à part, pour ne pas bloquer l'ajout si les règles ne les autorisent pas encore.
  added.forEach((product) => recordMovement('achat', product, product.count));
  rememberPrices(added);
  const bought = state.shopping.filter((i) => shoppingIdsToRemove.includes(i.id)).map((i) => i.name);
  const names = items.map((i) => (i.count > 1 ? `${i.name} ×${i.count}` : i.name)).join(', ');
  const name = countName('count.products', items.length);
  if (source === 'courses') logChange({ scope: 'courses', action: 'rangement', name, details: [names] });
  else if (source === 'scan') logChange({ scope: 'stock', action: 'ajout', name, details: [names] }); // « a ajouté 3 produits »
  else logChange({ scope: 'stock', action: 'ticket', name, details: [names, bought.length ? { k: 'hist.fromList', p: { names: bought.join(', ') } } : ''] });
  return items.length;
}
