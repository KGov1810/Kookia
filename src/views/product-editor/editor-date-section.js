// Kookia — Fiche produit : la date, dans la liste « Modifier » (type de date selon le lieu, date, raccourcis).

import { fmt, html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { draftStatus } from './editor-top-actions.js';

// Choix du type de date : libellé court (kindShort.*), le libellé complet (kind.*) reste lu par VoiceOver.

/** Date en toutes lettres (« 27 octobre 2026 »), ou « Choisir la date » tant qu'il n'y en a pas. */
export function dateText(iso) {
  return S.hasDate(iso) ? S.formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' }) : t('date.choose');
}

/**
 * Un vrai bouton de date (vide, le champ de date d'iOS n'affiche rien) ; le champ, invisible, est posé dessus et
 * ouvre le calendrier. refreshStatus met le texte à jour.
 */
function datePick(name, value, label) {
  return html`<label class="date-pick${S.hasDate(value) ? '' : ' missing'}">${I.calendar}<span class="date-text">${dateText(value)}</span>
    <input type="date" name="${name}" value="${value}" aria-label="${label}"></label>`;
}

/** Ligne « Date limite » ; « Photo » lit la date sur l'emballage (produit déjà en stock). */
function dateField(ctx, kind) {
  const label = t(`field.${kind}`);
  const photo = !ctx.isNew && ['dlc', 'ddm'].includes(kind)
    ? html`<button class="pill-btn small" data-action="date-photo" aria-label="${t('date.readPackage')}">${I.camera}${t('date.photo')}</button>`
    : '';
  return html`<div class="field date-field"><span>${label}</span>${datePick('expiry', ctx.p.expiry, label)}${photo}</div>`;
}

/** Raccourcis : « +3 j », « +1 sem »… ou en mois pour une date « de préférence ». */
function quickRow(kind) {
  const quick = kind === 'ddm'
    ? [[30, t('date.plusMonths', { n: 1 })], [91, t('date.plusMonths', { n: 3 })], [182, t('date.plusMonths', { n: 6 })], [365, t('date.plusYear')]]
    : [[3, t('date.plusDays', { n: 3 })], [7, t('date.plusWeeks', { n: 1 })], [14, t('date.plusWeeks', { n: 2 })], [30, t('date.plusMonths', { n: 1 })]];
  return html`<div class="quick">${quick.map(([days, label]) => html`<button data-action="quick" data-days="${days}">${label}</button>`)}</div>`;
}

/** Fruits, légumes, pain : estimation selon le produit. Frigo : la durée retenue la dernière fois, ou prudente. */
function estimateHint(p) {
  if (!S.fridgeEstimable(p.category, p.location)) return t('date.estimateHint');
  const learned = store.learnedShelfDays(p);
  return learned ? t('date.learnedHint', { duration: S.durationText(learned) }) : t('date.fridgeHint');
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
    fields = html`<div class="field date-field"><span>${t('field.congele')}</span>${datePick('frozenAt', p.frozenAt, t('field.congele'))}</div>
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
      ${kind === 'estimee' && !view.dateTouched ? html`<p class="hint inset default-date">${estimateHint(p)}</p>` : ''}
    </div>`;
}

/** Mise à jour du statut sans tout redessiner (le sélecteur de date d'iOS resterait sinon bloqué). */
export function refreshStatus(ctx) {
  const { p } = ctx;
  // Date de l'emballage saisie sur un produit estimé : le type affiché devient « DLC ».
  const kind = S.dateKindOf(p);
  ctx.sheet.panel.querySelectorAll('#date-section [data-action="set-kind"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === kind)));
  ctx.sheet.panel.querySelectorAll('#date-section .date-pick').forEach((pick) => {
    const value = p[pick.querySelector('input').name]; // date limite, ou date de congélation
    pick.classList.toggle('missing', !S.hasDate(value));
    pick.querySelector('.date-text').textContent = dateText(value);
  });
  const label = ctx.sheet.panel.querySelector('#date-section .date-field > span');
  if (label && ['dlc', 'ddm', 'estimee'].includes(kind)) {
    label.textContent = t(`field.${kind}`);
    ctx.sheet.panel.querySelector('#date-section [name="expiry"]')?.setAttribute('aria-label', t(`field.${kind}`));
  }
  const card = ctx.sheet.panel.querySelector('.status-card');
  if (card) {
    card.outerHTML = fmt(draftStatus(ctx)); // produit en stock : la carte d'état du haut suit la date
    return;
  }
  const status = ctx.sheet.panel.querySelector('#date-section .expiry-status');
  if (status) {
    status.className = `expiry-status ${S.stockStatus(p, state.settings.alertDays)}`;
    status.textContent = S.stockLabel(p);
  }
}
