// Kookia — Champs enregistrés d'un produit, et ce qui change d'une version à l'autre.
// Un produit déjà en stock n'est jamais réécrit en entier : seuls les champs modifiés partent, et le nombre d'unités
// en écart. Ainsi, ce que l'autre iPhone a changé entre-temps (ou pendant que celui-ci était hors ligne) est gardé.

import { increment } from 'firebase/firestore';
import { toISODate } from '../../services/dates/dates.js';
import { cleanPrice } from '../../services/stats/money.js';
import { remainingOf } from '../../services/stock/opened.js';
import { dateKindOf } from '../../services/stock/stock-dates.js';
import { CATEGORY_VERSION } from './mappers.js';
import { state } from './state.js';

/** Part restante (une ligne entamée n'a qu'un exemplaire) et date d'ouverture. */
function openedFields(product, count) {
  const remaining = count > 1 ? 1 : remainingOf(product);
  return { remaining, openedAt: remaining < 1 ? product.openedAt || toISODate(new Date()) : '' };
}

/** Document complet d'un produit. */
export function productFields(product) {
  const count = Math.max(1, Math.round(Number(product.count) || 1));
  return {
    name: (product.name ?? '').trim(),
    expiry: product.expiry ?? '',
    category: product.category || 'autre',
    categoryVersion: CATEGORY_VERSION,
    quantity: (product.quantity ?? '').trim(),
    count,
    location: product.location || 'frigo',
    // Fruits & légumes : rangés au frigo ou non, si on l'a choisi (sinon l'habitude du produit ; null ailleurs).
    cold: product.location === 'fruits' && typeof product.cold === 'boolean' ? product.cold : null,
    dateKind: dateKindOf(product),
    frozenAt: product.frozenAt || '',
    barcode: product.barcode || '',
    addedBy: product.addedBy || state.settings.userName,
    createdAt: product.createdAt || Date.now(),
    image: product.image || '',
    imageUrl: product.imageUrl || '',
    unitPrice: cleanPrice(product.unitPrice),
    ...openedFields(product, count)
  };
}

const FIXED = ['addedBy', 'createdAt']; // ne changent plus une fois le produit ajouté

/**
 * Champs à envoyer pour passer de base (la version d'où part la modification) à product. Le nombre d'unités part en
 * écart : deux iPhone qui retirent chacun une unité en retirent bien deux. Ancien document (champ manquant, anciennes
 * catégories) : tout est réécrit, une fois, au format actuel.
 */
export function productPatch(base, product) {
  const after = productFields(product);
  if (base.legacy) return after;
  const before = productFields(base);
  const patch = {};
  for (const [key, value] of Object.entries(after)) {
    if (key !== 'count' && !FIXED.includes(key) && before[key] !== value) patch[key] = value;
  }
  if (after.count !== before.count) patch.count = increment(after.count - before.count);
  return patch;
}
