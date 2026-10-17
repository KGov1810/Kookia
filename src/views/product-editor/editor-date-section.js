// Kookia — Fiche produit : la date, dans la liste « Modifier » (type de date selon le lieu, date, raccourcis).

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import * as R from '../../data/reference/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';

// Choix du type de date : libellé court (kindShort.*), le libellé complet (kind.*) reste lu par VoiceOver.

/** Ligne « Date limite … date » ; « Photo » lit la date sur l'emballage (produit déjà en stock). */
function dateField(ctx, kind) {
  const label = t(`field.${kind}`);
  const photo = !ctx.isNew && ['dlc', 'ddm'].includes(kind)
    ? html`<button class="pill-btn small" data-action="date-photo" aria-label="${t('date.readPackage')}">${I.camera}${t('date.photo')}</button>`
    : '';
  return html`<div class="field date-field"><span>${label}</span><input type="date" name="expiry" value="${ctx.p.expiry}" aria-label="${label}">${photo}</div>`;
}

/** Raccourcis : « +3 j », « +1 sem »… ou en mois pour une date « de préférence ». */
function quickRow(kind) {
  const quick = kind === 'ddm'
    ? [[30, t('date.plusMonths', { n: 1 })], [91, t('date.plusMonths', { n: 3 })], [182, t('date.plusMonths', { n: 6 })], [365, t('date.plusYear')]]
    : [[3, t('date.plusDays', { n: 3 })], [7, t('date.plusWeeks', { n: 1 })], [14, t('date.plusWeeks', { n: 2 })], [30, t('date.plusMonths', { n: 1 })]];
  return html`<div class="quick">${quick.map(([days, label]) => html`<button data-action="quick" data-days="${days}">${label}</button>`)}</div>`;
}

export function dateSection(ctx) {
  const { p, view, isNew } = ctx;
  const kind = S.dateKindOf(p);
  const kinds = R.KINDS_BY_LOCATION[p.location] ?? ['dlc'];
  const status = S.stockStatus(p, state.settings.alertDays);
  let fields;
  if (kind === 'aucune') {
    fields = html`<p class="hint inset">${t('date.noneHint', { at: S.placeAt(p.location) })}</p>`;
  } else if (kind === 'congele') {
    fields = html`<label class="field"><span>${t('field.congele')}</span><input type="date" name="frozenAt" value="${p.frozenAt}"></label>
      <p class="hint inset">${t('date.freezerHint', { category: S.categoryName(p.category).toLocaleLowerCase(), n: R.FREEZER_MONTHS[p.category] ?? 6 })}</p>`;
  } else {
    fields = html`${dateField(ctx, kind)}${quickRow(kind)}`;
  }
  // Produit en stock : son état est déjà en haut de la fiche (et suit la date saisie).
  return html`
    <div class="date-block" id="date-section">
      ${kinds.length > 1 ? html`<div class="date-kinds"><div class="segmented" role="group" aria-label="${t('date.kind')}">
        ${kinds.map((k) => html`<button data-action="set-kind" data-value="${k}" aria-pressed="${String(kind === k)}" aria-label="${S.kindName(k)}">${t(`kindShort.${k}`)}</button>`)}
      </div></div>` : ''}
      ${fields}
      ${isNew ? html`<p class="expiry-status ${status}">${S.stockLabel(p)}</p>` : ''}
      ${isNew && kind === 'dlc' && !view.dateTouched ? html`<p class="hint inset default-date">${t('date.defaultHint')}</p>` : ''}
      ${kind === 'estimee' && !view.dateTouched ? html`<p class="hint inset default-date">${t('date.estimateHint')}</p>` : ''}
    </div>`;
}
