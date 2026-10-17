// Kookia — Unités qui sortent du stock (consommées, jetées), qu'on congèle, ou qui s'ajoutent à un produit existant.

import { isoInDays } from '../../services/dates/dates.js';
import { cleanPrice } from '../../services/stats/money.js';
import { freezerLimit } from '../../services/stock/stock-dates.js';
import { unitsAmount } from '../../services/stock/opened.js';
import { logChange } from './history.js';
import { recordMovement } from './movements.js';
import { restText, takeAmounts } from './opening.js';
import { removeProducts, saveProduct } from './products.js';
import { state } from './state.js';
import { canWrite } from './writes.js';

const byIds = (ids) => state.products.filter((p) => ids.includes(p.id));

/** Consomme une unité de chaque produit (rond de la liste) ; l'unité entamée compte pour ce qu'il en reste. */
export function consumeOne(ids, { reason = '' } = {}) {
  return takeAmounts(byIds(ids).map((product) => ({ product, amount: unitsAmount(product, 1) })), {
    type: 'consomme',
    details: (_p, rest) => [restText(rest, 'fr'), reason]
  });
}

/** « 2 sur 10 » : unités choisies à la main dans la fiche (prix affiché dans la fiche, s'il a été saisi). */
function takeChosen(id, units, type, unitPrice) {
  const n = Math.max(1, Math.round(Number(units) || 1));
  return takeAmounts(byIds([id]).map((product) => ({ product, amount: unitsAmount(product, n) })), {
    type,
    unitPrice,
    details: (p, rest) => [(p.count ?? 1) > 1 ? `${Math.min(n, p.count)} sur ${p.count}` : '', restText(rest, 'fr')]
  });
}

export function consumeUnits(id, units, { unitPrice } = {}) {
  return takeChosen(id, units, 'consomme', unitPrice);
}

export function discardUnits(id, units, { unitPrice } = {}) {
  return takeChosen(id, units, 'jete', unitPrice);
}

/** Recette cuisinée : uses [{ id, amount }] en unités (0,4 = 200 g d'un paquet de 500 g). */
export function consumeAmounts(uses, { reason = '' } = {}) {
  const entries = uses.map(({ id, amount }) => ({ product: state.products.find((p) => p.id === id), amount })).filter((e) => e.product);
  return takeAmounts(entries, { type: 'consomme', details: (_p, rest) => [restText(rest, 'fr'), reason] });
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
