// Kookia — Statut, libellés et compteur d'un produit du stock.

import { locationOf } from '../../data/reference/locations.js';
import { daysUntil, expiryLabel, formatDate, hasDate } from '../dates/dates.js';
import { t } from '../i18n/i18n.js';
import { capitalize, placeAt } from '../i18n/labels.js';
import { durationText } from '../text/text.js';
import { ageInDays, dateKindOf, keptCold } from './stock-dates.js';

/**
 * 'pending' (date à compléter) | 'expired' (date limite dépassée) | 'check' (date estimée ou « de préférence »
 * dépassée : à vérifier) | 'soon' | 'old' (oublié depuis longtemps) | 'ok'.
 */
export function stockStatus(product, alertDays = 2, today = new Date()) {
  const kind = dateKindOf(product);
  if (kind === 'aucune') return ageInDays(product, today) >= 180 ? 'old' : 'ok';
  if (!hasDate(product.expiry)) return 'pending';
  const days = daysUntil(product.expiry, today);
  // Date limite (DLC) dépassée : périmé. Date estimée ou « de préférence » dépassée : à vérifier (souvent encore bon).
  // Congelé au-delà de la durée conseillée : à consommer vite.
  if (days < 0) return kind === 'dlc' ? 'expired' : kind === 'congele' ? 'soon' : 'check';
  const window = kind === 'congele' ? 30 : kind === 'ddm' ? 14 : alertDays;
  return days <= Math.max(0, window) ? 'soon' : 'ok';
}

/** Phrase complète, ex. « Congelé le 3 mars, idéalement avant septembre 2027 ». */
export function stockLabel(product, today = new Date()) {
  const kind = dateKindOf(product);
  if (kind === 'aucune') {
    const age = ageInDays(product, today);
    const at = placeAt(product.location);
    return age === 0 ? t('status.addedToday', { at }) : t('status.since', { at: capitalize(at), duration: durationText(age) });
  }
  if (!hasDate(product.expiry)) return t('status.pending');
  const days = daysUntil(product.expiry, today);
  const long = formatDate(product.expiry, { day: 'numeric', month: 'long', year: 'numeric' });
  switch (kind) {
    case 'ddm':
      if (days < 0) return t('status.ddmPassed', { duration: durationText(-days) });
      return days <= 30 ? t('status.ddmSoon', { duration: durationText(days) }) : t('line.ddm', { date: long });
    case 'estimee':
      if (days < 0) return t('status.estimatePassed');
      return days === 0 ? t('status.estimateToday') : t('status.estimateKeeps', { duration: durationText(days) });
    case 'congele': {
      const date = formatDate(product.frozenAt, { day: 'numeric', month: 'long' });
      const frozen = date ? t('status.frozenOn', { date }) : t('status.frozen');
      if (days < 0) return t('status.frozenPassed', { frozen });
      return t('status.frozenUntil', { frozen, month: formatDate(product.expiry, { month: 'long', year: 'numeric' }) });
    }
    default:
      return expiryLabel(product.expiry, today);
  }
}

/** Version courte pour les listes. */
export function stockShort(product, today = new Date()) {
  const kind = dateKindOf(product);
  if (kind === 'aucune') {
    const age = ageInDays(product, today);
    return age === 0 ? t('short.addedToday') : t('short.since', { duration: durationText(age) });
  }
  if (!hasDate(product.expiry)) return t('short.pending');
  const date = formatDate(product.expiry);
  switch (kind) {
    case 'ddm': return t('short.ddm', { date });
    case 'estimee': return t('short.estimee', { date });
    case 'congele': return t('short.congele', { date: formatDate(product.frozenAt) || '?' });
    default: return t('short.dlc', { date });
  }
}

/**
 * Compteur affiché sur la ligne : { number, label, approx, cls ('age' | 'old' | 'pending' | statut),
 * unit ('here' | 'date' | 'past' | 'last' | 'months' | 'days') }.
 */
export function stockCounter(product, alertDays = 2, today = new Date()) {
  const kind = dateKindOf(product);
  const status = stockStatus(product, alertDays, today);
  if (kind === 'aucune') {
    const age = ageInDays(product, today);
    const cls = status === 'old' ? 'old' : 'age';
    return age < 60
      ? { number: age, label: t('counter.daysHere', { n: age }), approx: false, cls, unit: 'here' }
      : { number: Math.round(age / 30.4), label: t('counter.monthsHere'), approx: false, cls, unit: 'here' };
  }
  if (!hasDate(product.expiry)) return { number: '?', label: t('counter.date'), approx: false, cls: 'pending', unit: 'date' };
  const days = daysUntil(product.expiry, today);
  const approx = kind === 'estimee' || kind === 'congele';
  if (days < 0) {
    const late = -days;
    return late > 60
      ? { number: Math.round(late / 30.4), label: t('counter.monthsPast'), approx, cls: status, unit: 'past' }
      : { number: late, label: t('counter.daysPast', { n: late }), approx, cls: status, unit: 'past' };
  }
  if (days === 0) return { number: 0, label: t('counter.lastDay'), approx, cls: status, unit: 'last' };
  if (days > 60) return { number: Math.round(days / 30.4), label: t('counter.months'), approx, cls: status, unit: 'months' };
  return { number: days > 999 ? '999+' : days, label: t('counter.days', { n: days }), approx, cls: status, unit: 'days' };
}

/** Situation transmise à Claude, ex. « au placard depuis 8 mois ». */
export function promptStock(product, today = new Date()) {
  const fruits = product.location === 'fruits';
  const at = `${locationOf(product.location).at}${fruits ? (keptCold(product) ? ' (au frigo)' : ' (hors du frigo)') : ''}`;
  const kind = dateKindOf(product);
  if (kind === 'aucune') return `${at} depuis ${durationText(ageInDays(product, today), 'fr')} (pas de date)`;
  if (!hasDate(product.expiry)) return `${at}, date de péremption non renseignée`;
  const days = daysUntil(product.expiry, today);
  switch (kind) {
    case 'ddm':
      return days < 0 ? `${at}, DDM dépassée depuis ${days * -1} j (souvent encore consommable)` : `${at}, à consommer de préférence d'ici ${durationText(days, 'fr')}`;
    case 'estimee':
      return days < 0 ? `${at}, date estimée dépassée : à vérifier avant usage` : `${at}, se garde encore environ ${durationText(days, 'fr')}`;
    case 'congele':
      return `${at} depuis ${durationText(ageInDays(product, today), 'fr')}, ${days < 0 ? 'durée conseillée dépassée : à utiliser au plus vite' : `à utiliser d'ici ${durationText(days, 'fr')}`} (à décongeler)`;
    default:
      if (days < 0) return `${at}, date limite dépassée depuis ${-days} j`;
      if (days === 0) return `${at}, expire aujourd'hui`;
      return `${at}, expire dans ${days === 1 ? '1 j' : `${days} j`}`;
  }
}
