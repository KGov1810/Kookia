// Kookia — Affichage d'un produit : vignette, compteur, catégories.

import * as R from '../data/reference/index.js';
import * as store from '../data/store/index.js';
import { state } from '../data/store/state.js';
import * as S from '../services/index.js';
import { html, raw } from './html.js';
import { I } from './icons.js';

export const LOCATION_ICON = { frigo: () => I.fridge, congelateur: () => I.snow, placard: () => I.cabinet, fruits: () => I.apple };

/** Teinte de la vignette selon le rayon : vert (fruits, légumes), rose (viandes, poissons), bleu (frais, froid). */
const TINT = {
  fruits: 'green', legumes: 'green', legumineuses: 'green', fruits_legumes: 'green',
  viande: 'pink', volaille: 'pink', charcuterie: 'pink', poisson: 'pink',
  laitier: 'blue', boisson: 'blue', surgele: 'blue'
};

/** Classe de teinte d'un produit (« tint-green »…), ou '' pour la teinte crème par défaut. */
export function thumbTint(product) {
  return TINT[product.category] ? `tint-${TINT[product.category]}` : '';
}

/** Vignette : la photo du produit, sinon l'emoji de sa catégorie sur une tuile teintée (le nombre est écrit à côté). */
export function thumb(product) {
  const src = product.image || product.imageUrl;
  const tint = thumbTint(product);
  return src
    ? html`<span class="thumb"><img src="${src}" alt="" loading="lazy"></span>`
    : html`<span class="thumb ${tint}">${R.category(product.category).emoji}</span>`;
}

/** Catégories regroupées par rayon (une ancienne catégorie reste affichée si le produit l'a encore). */
export function categoryOptions(current) {
  const legacy = R.CATEGORY_IDS.includes(current) ? '' : html`<option value="${current}" selected>${R.category(current).emoji} ${S.categoryName(current)}</option>`;
  return html`${legacy}${R.CATEGORY_GROUPS.map((group) => html`<optgroup label="${S.groupName(group)}">${R.CATEGORIES
    .filter((c) => c.group === group)
    .map((c) => html`<option value="${c.id}" ${c.id === current ? raw('selected') : ''}>${c.emoji} ${S.categoryName(c.id)}</option>`)}</optgroup>`)}`;
}

/** Le compteur façon magnet de frigo : jours ou mois restants, ou ancienneté pour les produits secs. */
export function dayCounter(product) {
  const c = S.stockCounter(product, state.settings.alertDays);
  return html`<span class="days ${c.cls}" role="img" aria-label="${S.stockLabel(product)}"><b>${c.approx ? '≈' : ''}${c.number}</b><small>${c.label}</small></span>`;
}

/** Version très courte, pour les pastilles : « J-3 », « auj. », « 8 mois ici »… */
export function shortExpiry(product) {
  const c = S.stockCounter(product, state.settings.alertDays);
  const approx = c.approx ? '≈' : '';
  if (c.unit === 'date') return S.t('chip.dateUnknown');
  if (c.unit === 'here') return `${c.number} ${c.label}`;
  if (c.unit === 'past') return S.t(store.productStatus(product) === 'expired' ? 'chip.expired' : 'chip.check');
  if (c.unit === 'last') return S.t('chip.today');
  if (c.unit === 'months') return S.t('chip.months', { approx, n: c.number });
  return S.t('chip.days', { approx, n: c.number });
}

export function longDate(iso) {
  return S.formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
