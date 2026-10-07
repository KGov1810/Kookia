// Kookia — Unités qui sortent du stock (consommées, jetées), qu'on congèle, ou qui s'ajoutent à un produit existant.

import { isoInDays } from '../../services/dates/dates.js';
import { cleanPrice } from '../../services/stats/money.js';
import { freezerLimit } from '../../services/stock/stock-dates.js';
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

/** « 2 sur 10 », « il en reste 8 » : détails de l'historique quand on choisit un nombre d'unités. */
function unitDetails(p, taken, rest) {
  return [(p.count ?? 1) > 1 ? `${taken} sur ${p.count}` : '', rest > 0 ? `il en reste ${rest}` : 'plus en stock'];
}

/** Consomme « units » unités d'un produit (fiche produit ; prix affiché dans la fiche, s'il a été saisi). */
export function consumeUnits(id, units, { unitPrice } = {}) {
  return takeUnits([id], {
    units: Math.max(1, Math.round(Number(units) || 1)),
    type: 'consomme',
    unitPrice,
    details: unitDetails
  });
}

/** Jette « units » unités d'un produit (prix affiché dans la fiche, s'il a été saisi). */
export function discardUnits(id, units, { unitPrice } = {}) {
  return takeUnits([id], {
    units: Math.max(1, Math.round(Number(units) || 1)),
    type: 'jete',
    unitPrice,
    details: unitDetails
  });
}

/**
 * Congèle « units » unités. Tout le produit : il change de lieu. Une partie : les unités congelées
 * deviennent une ligne à part au congélateur (pas un achat), le reste ne bouge pas.
 * product : la fiche en cours (modifications comprises). Renvoie de quoi annuler.
 */
export function freezeUnits(product, units) {
  if (!canWrite()) return null;
  const stored = state.products.find((p) => p.id === product.id);
  if (!stored) return null;
  const total = stored.count ?? 1;
  const taken = Math.min(total, Math.max(1, Math.round(Number(units) || 1)));
  const frozenAt = isoInDays(0);
  const frozen = { location: 'congelateur', dateKind: 'congele', frozenAt, expiry: freezerLimit(product.category, frozenAt) };
  const before = { ...stored };
  if (taken >= total) {
    saveProduct({ ...product, ...frozen, count: total });
    return { before, frozenId: '', product: { ...product, ...frozen } };
  }
  const frozenId = crypto.randomUUID();
  logChange({ scope: 'stock', action: 'congelation', name: product.name, itemId: product.id, details: [`${taken} sur ${total}`, `il en reste ${total - taken}`] });
  saveProduct({ ...product, count: total - taken }, { log: false });
  saveProduct({ ...product, ...frozen, id: frozenId, count: taken, createdAt: Date.now() }, { log: false, purchase: false });
  return { before, frozenId, product: { ...product, ...frozen } };
}

/** « Annuler » une congélation : produit remis comme avant, ligne congelée à part supprimée. */
export function undoFreeze({ before, frozenId }) {
  if (!canWrite()) return;
  if (frozenId) removeProducts([frozenId], { log: false });
  logChange({ scope: 'stock', action: 'annulation', name: before.name, itemId: before.id, details: ['congélation annulée'] });
  saveProduct(before, { log: false });
}

/** Ajoute des unités achetées à un produit déjà en stock (même code-barres). */
export function addUnits(product, units, unitPrice) {
  if (!canWrite()) return;
  const price = cleanPrice(unitPrice) ?? cleanPrice(product.unitPrice);
  const added = Math.max(1, Math.round(Number(units) || 1));
  saveProduct({ ...product, count: (product.count ?? 1) + added, unitPrice: price });
  recordMovement('achat', { ...product, unitPrice: price }, added);
}
