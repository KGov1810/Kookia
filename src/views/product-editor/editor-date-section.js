// Kookia — Fiche produit : section « Date » selon le lieu et le type de date.

import { html } from '../../components/html.js';
import * as R from '../../data/reference/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';

export function dateSection(ctx) {
  const { p, view, isNew } = ctx;
  const kind = S.dateKindOf(p);
  const kinds = R.KINDS_BY_LOCATION[p.location] ?? ['dlc'];
  const status = S.stockStatus(p, state.settings.alertDays);
  const quick = kind === 'ddm'
    ? [[30, '+1 mois'], [91, '+3 mois'], [182, '+6 mois'], [365, '+1 an']]
    : [[3, '+3 j'], [7, '+1 sem'], [14, '+2 sem'], [30, '+1 mois']];
  let fields;
  if (kind === 'aucune') {
    fields = html`<p class="hint inset">Pas de date : l'app suit depuis combien de temps il est ${R.locationOf(p.location).at}. Si le paquet porte une date, choisissez « De préférence (DDM) ».</p>`;
  } else if (kind === 'congele') {
    fields = html`<label class="field"><span>Congelé le</span><input type="date" name="frozenAt" value="${p.frozenAt}"></label>
      <p class="hint inset">Durée conseillée pour « ${R.category(p.category).label.toLowerCase()} » : ${R.FREEZER_MONTHS[p.category] ?? 6} mois (à ajuster avec la catégorie).</p>`;
  } else {
    fields = html`<label class="field"><span>${R.DATE_KINDS[kind].field}</span><input type="date" name="expiry" value="${p.expiry}"></label>
      <div class="quick">${quick.map(([days, label]) => html`<button data-action="quick" data-days="${days}">${label}</button>`)}</div>`;
  }
  return html`
    <section class="group" id="date-section">
      <h2>Date</h2>
      ${kinds.length > 1 ? html`<div class="segmented" role="group" aria-label="Type de date">
        ${kinds.map((k) => html`<button data-action="set-kind" data-value="${k}" aria-pressed="${String(kind === k)}">${R.DATE_KINDS[k].label}</button>`)}
      </div>` : ''}
      ${fields}
      <p class="expiry-status ${status}">${S.stockLabel(p)}</p>
      ${isNew && kind === 'dlc' && !view.dateTouched ? html`<p class="hint inset default-date">Date proposée par défaut : dans 7 jours. Vérifiez-la.</p>` : ''}
      ${kind === 'estimee' && !view.dateTouched ? html`<p class="hint inset default-date">Estimation selon le produit ; ajustez-la si besoin.</p>` : ''}
    </section>`;
}
