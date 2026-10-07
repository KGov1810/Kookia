// Kookia — Mémoire des prix : dernier prix payé pour un produit (par code-barres, sinon par nom).
// Un seul document (foyers/{code}/prix/memoire) : une lecture au lancement, quelle que soit sa taille.

import { collection, onSnapshot, setDoc } from 'firebase/firestore';
import { cleanPrice } from '../../services/stats/money.js';
import { nameTokens, simplify } from '../../services/text/text.js';
import { db } from './connection.js';
import { reportStatsDenied } from './movements.js';
import { state } from './state.js';
import { canWrite, ref } from './writes.js';

/**
 * Clés d'un produit : « ean:3017620422003 » et « nom:demi ecreme lait »
 * (mots sans accents ni pluriel, dans l'ordre alphabétique : « demi-écrémé » = « demi ecreme »).
 */
export function priceKeys({ name = '', barcode = '' } = {}) {
  const keys = [];
  const digits = String(barcode ?? '').replace(/\D/g, '');
  if (digits) keys.push(`ean:${digits}`);
  const tokens = [...new Set(nameTokens(name).flatMap((t) => t.split('-')).filter((t) => t.length >= 2 && t !== 'a'))];
  const words = tokens.sort().join(' ') || simplify(name).trim().replace(/[.~*/[\]]/g, '');
  if (words) keys.push(`nom:${words}`);
  return keys;
}

/** Dernier prix connu (code-barres d'abord), ou null. */
export function lastKnownPrice(product) {
  for (const key of priceKeys(product)) {
    const price = cleanPrice(state.prices[key]?.price);
    if (price !== null) return price;
  }
  return null;
}

/** Mémorise le prix de ces produits (seulement ce qui change). */
export function rememberPrices(products) {
  if (!canWrite()) return;
  const entries = {};
  for (const product of products) {
    const price = cleanPrice(product.unitPrice);
    if (price === null) continue;
    for (const key of priceKeys(product)) {
      if (cleanPrice(state.prices[key]?.price) !== price) entries[key] = { price, at: Date.now() };
    }
  }
  if (!Object.keys(entries).length) return;
  state.prices = { ...state.prices, ...entries };
  setDoc(ref('prix', 'memoire'), { prices: entries }, { merge: true }).catch(reportStatsDenied);
}

/** Écoute la mémoire des prix. Un refus des règles ne bloque pas le reste de l'app. */
export function listenPrices(code) {
  return onSnapshot(collection(db, 'foyers', code, 'prix'), (snapshot) => {
    const memo = snapshot.docs.find((d) => d.id === 'memoire');
    state.prices = memo?.data().prices ?? {};
  }, (error) => {
    reportStatsDenied(error);
  });
}
