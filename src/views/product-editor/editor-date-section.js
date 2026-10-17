// Kookia — Fiche produit : la date, dans la liste « Modifier » (type de date selon le lieu, date, raccourcis).

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import * as R from '../../data/reference/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';

// Libellés courts du choix du type de date (le libellé complet reste lu par VoiceOver).
const SHORT = { dlc: 'Jusqu\'au', ddm: 'De préférence', estimee: 'Estimée', congele: 'Congelé', aucune: 'Sans date' };

/** Ligne « Date limite … date » ; « Photo » lit la date sur l'emballage (produit déjà en stock). */
function dateField(ctx, kind) {
  const label = kind === 'dlc' ? 'Date limite' : R.DATE_KINDS[kind].field;
  const photo = !ctx.isNew && ['dlc', 'ddm'].includes(kind)
    ? html`<button class="pill-btn small" data-action="date-photo" aria-label="Lire la date sur l'emballage">${I.camera}Photo</button>`
    : '';
  return html`<div class="field date-field"><span>${label}</span><input type="date" name="expiry" value="${ctx.p.expiry}" aria-label="${label}">${photo}</div>`;
}

/** Raccourcis : « +3 j », « +1 sem »… ou en mois pour une date « de préférence ». */
function quickRow(kind) {
  const quick = kind === 'ddm'
    ? [[30, '+1 mois'], [91, '+3 mois'], [182, '+6 mois'], [365, '+1 an']]
    : [[3, '+3 j'], [7, '+1 sem'], [14, '+2 sem'], [30, '+1 mois']];
  return html`<div class="quick">${quick.map(([days, label]) => html`<button data-action="quick" data-days="${days}">${label}</button>`)}</div>`;
}

export function dateSection(ctx) {
  const { p, view, isNew } = ctx;
  const kind = S.dateKindOf(p);
  const kinds = R.KINDS_BY_LOCATION[p.location] ?? ['dlc'];
  const status = S.stockStatus(p, state.settings.alertDays);
  let fields;
  if (kind === 'aucune') {
    fields = html`<p class="hint inset">Pas de date : l'app suit depuis combien de temps il est ${R.locationOf(p.location).at}. Si le paquet porte une date, choisissez « De préférence (DDM) ».</p>`;
  } else if (kind === 'congele') {
    fields = html`<label class="field"><span>Congelé le</span><input type="date" name="frozenAt" value="${p.frozenAt}"></label>
      <p class="hint inset">Durée conseillée pour « ${R.category(p.category).label.toLowerCase()} » : ${R.FREEZER_MONTHS[p.category] ?? 6} mois (à ajuster avec la catégorie).</p>`;
  } else {
    fields = html`${dateField(ctx, kind)}${quickRow(kind)}`;
  }
  // Produit en stock : son état est déjà en haut de la fiche (et suit la date saisie).
  return html`
    <div class="date-block" id="date-section">
      ${kinds.length > 1 ? html`<div class="date-kinds"><div class="segmented" role="group" aria-label="Type de date">
        ${kinds.map((k) => html`<button data-action="set-kind" data-value="${k}" aria-pressed="${String(kind === k)}" aria-label="${R.DATE_KINDS[k].label}">${SHORT[k]}</button>`)}
      </div></div>` : ''}
      ${fields}
      ${isNew ? html`<p class="expiry-status ${status}">${S.stockLabel(p)}</p>` : ''}
      ${isNew && kind === 'dlc' && !view.dateTouched ? html`<p class="hint inset default-date">Date proposée par défaut : dans 7 jours. Vérifiez-la.</p>` : ''}
      ${kind === 'estimee' && !view.dateTouched ? html`<p class="hint inset default-date">Estimation selon le produit ; ajustez-la si besoin.</p>` : ''}
    </div>`;
}
