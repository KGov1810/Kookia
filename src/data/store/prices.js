// Kookia — Mémoire des prix : dernier prix payé pour un produit (par code-barres, sinon par nom).
// Un seul document (foyers/{code}/prix/memoire) : une lecture au lancement, quelle que soit sa taille.

import { collection, onSnapshot, setDoc } from 'firebase/firestore';
import { cleanPrice } from '../../services/stats/money.js';
import { nameKey } from '../../services/text/text.js';
import { db } from './connection.js';
import { reportStatsDenied } from './movements.js';
import { emit, state } from './state.js';
import { expireWeekPlan } from './week-plan.js';
import { canWrite, ref } from './writes.js';

/**
 * Clés d'un produit : « ean:3017620422003 » et « nom:demi ecreme lait »
 * (mots sans accents ni pluriel, dans l'ordre alphabétique : « demi-écrémé » = « demi ecreme »).
 */
export function priceKeys({ name = '', barcode = '' } = {}) {
  const keys = [];
  const digits = String(barcode ?? '').replace(/\D/g, '');
  if (digits) keys.push(`ean:${digits}`);
  const words = nameKey(name);
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

/**
 * Écoute les mémoires du foyer (prix, catégories, dates). Un refus des règles ne bloque pas le reste de l'app.
 * onLoaded : appelé après chaque mise à jour (dates estimées des produits restés sans date).
 */
export function listenPrices(code, onLoaded = () => {}) {
  return onSnapshot(collection(db, 'foyers', code, 'prix'), (snapshot) => {
    const memo = snapshot.docs.find((d) => d.id === 'memoire');
    state.prices = memo?.data().prices ?? {};
    // Même collection : la mémoire des catégories et rangements corrigés (placements.js).
    state.placements = snapshot.docs.find((d) => d.id === 'categories')?.data().entries ?? {};
    // Et les durées retenues entre l'achat et la date des produits du frigo (fridge-dates.js).
    state.shelfDays = snapshot.docs.find((d) => d.id === 'dates')?.data().entries ?? {};
    state.shelfDaysLoaded = true;
    // Et les langues des iPhone du foyer (languages.js) : Claude écrit dans chacune.
    state.languages = snapshot.docs.find((d) => d.id === 'langues')?.data().members ?? {};
    // Et le planning de la semaine (week-plan.js) : l'écran se met à jour sur les deux iPhone.
    const plan = snapshot.docs.find((d) => d.id === 'semaine')?.data() ?? null;
    if (JSON.stringify(plan) !== JSON.stringify(state.plan)) {
      state.plan = plan;
      emit('plan');
      expireWeekPlan(); // semaine terminée : effacée
    }
    onLoaded();
  }, (error) => {
    reportStatsDenied(error);
  });
}
