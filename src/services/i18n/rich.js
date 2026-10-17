// Kookia — Textes « neutres » de l'historique : notés sans langue, lus dans la langue de chaque iPhone.
// Une valeur est un texte tel quel (nom d'un produit…), un nombre, ou un objet :
// { k, p } texte traduit (p : valeurs, elles-mêmes neutres) · { loc } lieu · { cat } catégorie · { kind } type de date ·
// { date, f } date ('dmy' : 3 oct. 2026, 'dm' : 3 oct.) · { euro } prix · { qty } nombre et poids ·
// { frac } part restante (½) · { short } état court d'un produit (« depuis 3 jours ») · { join } liste séparée par des virgules.

import { formatDate } from '../dates/dates.js';
import { quantityLabel } from '../quantities/quantities.js';
import { formatEuro } from '../stats/money.js';
import { remainingLabel } from '../stock/opened.js';
import { stockShort } from '../stock/stock-status.js';
import { inLanguage, t } from './i18n.js';
import { categoryName, kindName, placeName } from './labels.js';

const DATE_FORMATS = {
  dmy: { day: 'numeric', month: 'short', year: 'numeric' },
  dm: { day: 'numeric', month: 'short' }
};

function params(p = {}, at) {
  return Object.fromEntries(Object.entries(p).map(([name, value]) => [name, typeof value === 'number' ? value : richText(value, at)]));
}

/** Texte d'une valeur neutre dans la langue de cet iPhone ; at : moment de l'action (pour « depuis 3 jours »). */
export function richText(value, at = Date.now()) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map((v) => richText(v, at)).filter(Boolean).join(', ');
  if (value.k) return t(value.k, params(value.p, at));
  if (value.loc !== undefined) return placeName(value.loc);
  if (value.cat !== undefined) return categoryName(value.cat);
  if (value.kind !== undefined) return kindName(value.kind);
  if (value.date !== undefined) return formatDate(value.date, DATE_FORMATS[value.f] ?? DATE_FORMATS.dm);
  if (value.euro !== undefined) return formatEuro(value.euro);
  if (value.qty !== undefined) return quantityLabel(value.qty);
  if (value.frac !== undefined) return remainingLabel(value.frac);
  if (value.short !== undefined) return stockShort(value.short, new Date(at));
  if (value.join !== undefined) return richText(value.join, at);
  return '';
}

/** Même texte, en français : il est aussi noté tel quel (anciennes versions de l'app, recherche). */
export function richFrench(value, at = Date.now()) {
  return inLanguage('fr', () => richText(value, at));
}

/** Vrai si la valeur doit être traduite à l'affichage (autre chose qu'un texte tel quel). */
export function isRich(value) {
  return value !== null && typeof value === 'object';
}
