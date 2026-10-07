// Kookia — Unités qui sortent du stock (consommées, jetées) ou qui s'ajoutent à un produit existant.

import { cleanPrice } from '../../services/stats/money.js';
import { logChange } from './history.js';
import { recordMovement } from './movements.js';
import { removeProducts, saveProduct } from './products.js';
import { state } from './state.js';
import { canWrite } from './writes.js';

/**
 * Retire « units » unités de chaque produit ; un produit disparaît à sa dernière unité.
 * Renvoie l'état d'avant (pour « Annuler ») et ce qui a été retiré ou diminué.
 */
function takeUnits(ids, { units = 1, type, details, unitPrice }) {
  if (!canWrite()) return { before: [], removed: [], decremented: [] };
  const before = state.products.filter((p) => ids.includes(p.id)).map((p) => ({ ...p }));
  const taken = (p) => Math.min(units, p.count ?? 1);
  const priced = (p) => (unitPrice === undefined ? p : { ...p, unitPrice: cleanPrice(unitPrice) });
  const removed = before.filter((p) => (p.count ?? 1) <= taken(p));
  const decremented = before.filter((p) => (p.count ?? 1) > taken(p));
  before.forEach((p) => {
    const rest = (p.count ?? 1) - taken(p);
    logChange({
      scope: 'stock', action: type === 'jete' ? 'jete' : 'consommation', name: p.name, itemId: p.id,
      details: details(p, taken(p), rest)
    });
    recordMovement(type, priced(p), taken(p));
  });
  if (removed.length) removeProducts(removed.map((p) => p.id), { log: false });
  decremented.forEach((p) => saveProduct({ ...priced(p), count: p.count - taken(p) }, { log: false }));
  return { before, removed, decremented };
}

/** Consomme une unité de chaque produit (rond de la liste, recette cuisinée). */
export function consumeOne(ids, { reason = '' } = {}) {
  return takeUnits(ids, {
    units: 1,
    type: 'consomme',
    details: (_p, _taken, rest) => [rest > 0 ? `il en reste ${rest}` : 'plus en stock', reason]
  });
}

/** Jette « units » unités d'un produit (prix affiché dans la fiche, s'il a été saisi). */
export function discardUnits(id, units, { unitPrice } = {}) {
  return takeUnits([id], {
    units: Math.max(1, Math.round(Number(units) || 1)),
    type: 'jete',
    unitPrice,
    details: (p, taken, rest) => [(p.count ?? 1) > 1 ? `${taken} sur ${p.count}` : '', rest > 0 ? `il en reste ${rest}` : 'plus en stock']
  });
}

/** Ajoute des unités achetées à un produit déjà en stock (même code-barres). */
export function addUnits(product, units, unitPrice) {
  if (!canWrite()) return;
  const price = cleanPrice(unitPrice) ?? cleanPrice(product.unitPrice);
  const added = Math.max(1, Math.round(Number(units) || 1));
  saveProduct({ ...product, count: (product.count ?? 1) + added, unitPrice: price });
  recordMovement('achat', { ...product, unitPrice: price }, added);
}
