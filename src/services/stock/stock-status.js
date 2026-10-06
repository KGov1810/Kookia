// Kookia — Statut, libellés et compteur d'un produit du stock.

import { locationOf } from '../../data/reference/locations.js';
import { daysUntil, expiryLabel, formatDate, hasDate } from '../dates/dates.js';
import { durationText } from '../text/text.js';
import { ageInDays, dateKindOf } from './stock-dates.js';

/** 'pending' (date à compléter) | 'expired' | 'soon' | 'old' (oublié depuis longtemps) | 'ok'. */
export function stockStatus(product, alertDays = 2, today = new Date()) {
  const kind = dateKindOf(product);
  if (kind === 'aucune') return ageInDays(product, today) >= 180 ? 'old' : 'ok';
  if (!hasDate(product.expiry)) return 'pending';
  const days = daysUntil(product.expiry, today);
  // Seule une date limite (DLC) dépassée rend un produit « périmé ».
  if (days < 0) return kind === 'dlc' ? 'expired' : 'soon';
  const window = kind === 'congele' ? 30 : kind === 'ddm' ? 14 : alertDays;
  return days <= Math.max(0, window) ? 'soon' : 'ok';
}

/** Phrase complète, ex. « Congelé le 3 mars, idéalement avant septembre 2027 ». */
export function stockLabel(product, today = new Date()) {
  const kind = dateKindOf(product);
  if (kind === 'aucune') {
    const age = ageInDays(product, today);
    return age === 0 ? `Ajouté aujourd'hui ${locationOf(product.location).at}` : `${locationOf(product.location).at.replace(/^./, (c) => c.toUpperCase())} depuis ${durationText(age)}`;
  }
  if (!hasDate(product.expiry)) return 'Date à compléter';
  const days = daysUntil(product.expiry, today);
  const long = formatDate(product.expiry, { day: 'numeric', month: 'long', year: 'numeric' });
  switch (kind) {
    case 'ddm':
      if (days < 0) return `Date « de préférence » dépassée depuis ${durationText(-days)} : souvent encore bon, à vérifier`;
      return days <= 30 ? `De préférence dans ${durationText(days)}` : `De préférence avant le ${long}`;
    case 'estimee':
      if (days < 0) return 'Date estimée dépassée : à vérifier';
      return days === 0 ? "À consommer aujourd'hui (estimation)" : `Se garde encore environ ${durationText(days)} (estimation)`;
    case 'congele': {
      const frozen = formatDate(product.frozenAt, { day: 'numeric', month: 'long' });
      if (days < 0) return `Congelé${frozen ? ` le ${frozen}` : ''} : durée conseillée dépassée, à consommer rapidement`;
      return `Congelé${frozen ? ` le ${frozen}` : ''}, idéalement avant ${formatDate(product.expiry, { month: 'long', year: 'numeric' })}`;
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
    return age === 0 ? "ajouté aujourd'hui" : `depuis ${durationText(age)}`;
  }
  if (!hasDate(product.expiry)) return 'date à compléter';
  const date = formatDate(product.expiry);
  switch (kind) {
    case 'ddm': return `de préférence avant le ${date}`;
    case 'estimee': return `estimé jusqu'au ${date}`;
    case 'congele': return `congelé le ${formatDate(product.frozenAt) || '?'}`;
    default: return `jusqu'au ${date}`;
  }
}

/** Compteur affiché sur la ligne : { number, label, approx, kind ('age' | 'pending' | statut) }. */
export function stockCounter(product, alertDays = 2, today = new Date()) {
  const kind = dateKindOf(product);
  const status = stockStatus(product, alertDays, today);
  if (kind === 'aucune') {
    const age = ageInDays(product, today);
    return age < 60
      ? { number: age, label: age > 1 ? 'jours ici' : 'jour ici', approx: false, cls: status === 'old' ? 'old' : 'age' }
      : { number: Math.round(age / 30.4), label: 'mois ici', approx: false, cls: status === 'old' ? 'old' : 'age' };
  }
  if (!hasDate(product.expiry)) return { number: '?', label: 'date', approx: false, cls: 'pending' };
  const days = daysUntil(product.expiry, today);
  const approx = kind === 'estimee' || kind === 'congele';
  if (days < 0) {
    const late = -days;
    return late > 60
      ? { number: Math.round(late / 30.4), label: 'mois passés', approx, cls: status }
      : { number: late, label: late > 1 ? 'jours passés' : 'jour passé', approx, cls: status };
  }
  if (days === 0) return { number: 0, label: 'dernier jour', approx, cls: status };
  if (days > 60) return { number: Math.round(days / 30.4), label: 'mois', approx, cls: status };
  return { number: days > 999 ? '999+' : days, label: days > 1 ? 'jours' : 'jour', approx, cls: status };
}

/** Situation transmise à Claude, ex. « au placard depuis 8 mois ». */
export function promptStock(product, today = new Date()) {
  const at = locationOf(product.location).at;
  const kind = dateKindOf(product);
  if (kind === 'aucune') return `${at} depuis ${durationText(ageInDays(product, today))} (pas de date)`;
  if (!hasDate(product.expiry)) return `${at}, date de péremption non renseignée`;
  const days = daysUntil(product.expiry, today);
  switch (kind) {
    case 'ddm':
      return days < 0 ? `${at}, DDM dépassée depuis ${days * -1} j (souvent encore consommable)` : `${at}, à consommer de préférence d'ici ${durationText(days)}`;
    case 'estimee':
      return days < 0 ? `${at}, date estimée dépassée : à vérifier avant usage` : `${at}, se garde encore environ ${durationText(days)}`;
    case 'congele':
      return `${at} depuis ${durationText(ageInDays(product, today))}, ${days < 0 ? 'durée conseillée dépassée : à utiliser au plus vite' : `à utiliser d'ici ${durationText(days)}`} (à décongeler)`;
    default:
      if (days < 0) return `${at}, date limite dépassée depuis ${-days} j`;
      if (days === 0) return `${at}, expire aujourd'hui`;
      return `${at}, expire dans ${days === 1 ? '1 j' : `${days} j`}`;
  }
}
