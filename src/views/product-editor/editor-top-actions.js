// Kookia — Fiche d'un produit en stock : le produit en grand et son état, puis les gestes du quotidien
// (Consommé, Congeler, Jeté, Entamé, courses).

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { dayCounter, thumb } from '../../components/product-visuals.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { openingRow } from './editor-opening.js';
import { unitsBox, unitsTile } from './editor-units.js';

const DATE_LINE = ['dlc', 'ddm', 'estimee']; // date en toutes lettres : line.dlc, line.ddm, line.estimee

/** Vignette, nom en grand et étiquettes : lieu, catégorie, contenance. */
function hero(product) {
  const chips = [S.placeName(product.location), S.categoryName(product.category), S.quantityLabel(product)].filter(Boolean);
  return html`
    <div class="product-hero">
      ${thumb(product)}
      <div class="hero-text">
        <h1>${product.name}</h1>
        <p class="hero-chips">${chips.map((chip) => html`<span>${chip}</span>`)}</p>
      </div>
    </div>`;
}

function openedText(product) {
  const remaining = S.remainingOf(product);
  if (remaining >= 1) return '';
  const rest = S.remainingLabel(remaining);
  return product.openedAt
    ? t('editor.openedOn', { date: S.formatDate(product.openedAt, { day: 'numeric', month: 'short' }), rest })
    : t('editor.openedRest', { rest });
}

/**
 * Carte d'état : la date en toutes lettres (« À finir avant le jeudi 22 octobre »), le compteur de jours,
 * et dessous ce qu'il faut savoir (entamé, « souvent encore bon »…). Sans date : « Lire la date ».
 */
function statusCard(product) {
  const status = S.stockStatus(product, state.settings.alertDays);
  if (status === 'pending') {
    return html`
      <div class="status-card read-date">
        <div class="status-text"><p class="status-title">${t('editor.noDate')}</p><small class="expiry-status pending">${t('editor.onPackage')}</small></div>
        <button class="pill-btn strong" data-action="date-photo">${I.camera}${t('editor.readDate')}</button>
      </div>`;
  }
  const kind = S.dateKindOf(product);
  const opened = openedText(product);
  const dated = DATE_LINE.includes(kind) && S.hasDate(product.expiry);
  const date = dated ? S.formatDate(product.expiry, { weekday: 'long', day: 'numeric', month: 'long' }) : '';
  const title = dated ? t(opened && kind !== 'ddm' ? 'line.finish' : `line.${kind}`, { date }) : S.stockLabel(product);
  const detail = dated ? opened || S.stockLabel(product) : opened;
  return html`
    <div class="status-card">
      <div class="status-text">
        <p class="status-title ${dated ? '' : `expiry-status ${status}`}">${title}</p>
        ${dated ? html`<small class="expiry-status ${status}">${detail}</small>` : detail ? html`<small>${detail}</small>` : ''}
      </div>
      ${dayCounter(product)}
    </div>`;
}

/** Carte d'état du produit en stock, avec la date en cours de saisie dans la fiche. */
export function draftStatus(ctx) {
  const product = store.productById(ctx.p.id) ?? ctx.p;
  const { expiry, dateKind, frozenAt } = ctx.p;
  return statusCard({ ...product, expiry, dateKind, frozenAt });
}

export function topActions(ctx) {
  const product = store.productById(ctx.p.id) ?? ctx.p;
  const canFreeze = !['congelateur', 'placard'].includes(product.location);
  return html`
    <div class="product-actions">
      ${hero(product)}
      ${draftStatus(ctx)}
      <div class="action-tiles">
        ${unitsTile(ctx, 'consume')}
        ${canFreeze ? unitsTile(ctx, 'freeze') : ''}
        ${unitsTile(ctx, 'discard')}
      </div>
      ${unitsBox(ctx)}
      ${openingRow(ctx)}
      <button class="row-card" data-action="to-shopping">${I.cart}<span>${t('editor.backToList')}</span>${I.chevron}</button>
    </div>
    <h2 class="section">${t('editor.edit')}</h2>`;
}
