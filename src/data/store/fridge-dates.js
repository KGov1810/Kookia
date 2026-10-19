// Kookia — Dates du frigo : la durée retenue pour un produit (écart entre l'achat et la date saisie), partagée entre
// les deux iPhone (foyers/{code}/prix/dates), et la date estimée des produits restés sans date.

import { setDoc, writeBatch } from 'firebase/firestore';
import { DAY, addDays, hasDate, parseISODate, startOfDay, toISODate } from '../../services/dates/dates.js';
import { fridgeEstimable } from '../../services/stock/fridge-days.js';
import { remainingOf } from '../../services/stock/opened.js';
import { dateKindOf, estimateFreshDays, keptCold } from '../../services/stock/stock-dates.js';
import { db } from './connection.js';
import { reportStatsDenied } from './movements.js';
import { priceKeys } from './prices.js';
import { state } from './state.js';
import { canWrite, ref, write } from './writes.js';

const MAX_DAYS = 365;

/** Durée retenue pour ce produit (code-barres d'abord, puis nom), en jours depuis l'achat ; null si aucune. */
export function learnedShelfDays(product) {
  for (const key of priceKeys(product)) {
    const days = Number(state.shelfDays[key]?.days);
    if (Number.isInteger(days) && days >= 1 && days <= MAX_DAYS) return days;
  }
  return null;
}

/**
 * Jours jusqu'à la date estimée : pour un produit du frigo (hors viande, poisson…), la durée retenue la dernière fois,
 * sinon une durée prudente ; pour les fruits, légumes et le pain, leur propre estimation.
 */
export function estimatedDays(product) {
  const learned = fridgeEstimable(product.category, product.location) ? learnedShelfDays(product) : null;
  return learned ?? estimateFreshDays(product.name, product.location || 'frigo', product.category || '', keptCold(product));
}

/** Date saisie à la main pour un produit du frigo pas encore entamé : sa durée depuis l'achat est retenue. */
export function rememberShelfLife(product) {
  if (!canWrite() || (product.location || 'frigo') !== 'frigo') return;
  if (!['dlc', 'ddm'].includes(dateKindOf(product)) || !hasDate(product.expiry)) return;
  if (remainingOf(product) < 1 || product.openedAt) return; // date raccourcie à l'ouverture : pas celle de l'emballage
  const bought = startOfDay(new Date(product.createdAt || Date.now()));
  const days = Math.round((parseISODate(product.expiry) - bought) / DAY);
  if (days < 1 || days > MAX_DAYS) return;
  const entries = {};
  for (const key of priceKeys(product)) {
    if (state.shelfDays[key]?.days !== days) entries[key] = { days, at: Date.now() };
  }
  if (!Object.keys(entries).length) return;
  state.shelfDays = { ...state.shelfDays, ...entries };
  setDoc(ref('prix', 'dates'), { entries }, { merge: true }).catch(reportStatsDenied);
}

const estimated = new Set(); // produits déjà traités pendant cette session

/**
 * Produits du frigo restés sans date (ajoutés avant cette version, ou par un iPhone pas encore à jour), hors viande,
 * poisson, charcuterie et traiteur : date estimée depuis leur ajout. Attend le stock et la mémoire des dates.
 */
export function estimateMissingDates() {
  if (!canWrite() || !state.productsLoaded || !state.shelfDaysLoaded) return;
  const todo = state.products.filter((p) => !estimated.has(p.id) && !hasDate(p.expiry)
    && !['aucune', 'congele'].includes(dateKindOf(p)) && fridgeEstimable(p.category, p.location));
  if (!todo.length) return;
  const batch = writeBatch(db);
  todo.forEach((p) => {
    estimated.add(p.id);
    const added = startOfDay(new Date(p.createdAt || Date.now()));
    batch.update(ref('produits', p.id), { dateKind: 'estimee', expiry: toISODate(addDays(added, estimatedDays(p))) });
  });
  write(batch.commit());
}
