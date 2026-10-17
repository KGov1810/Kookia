// Kookia — Statistiques : valeur du stock en ce moment (indépendante de la période et des filtres).

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';

/** « 12,40 € à consommer vite, sur 3 produits », le montant en gras. */
function soonText(value) {
  const [before, after] = t('sstock.soon', { n: value.soonCount }).split('{amount}');
  return html`${before}<b>${S.formatEuro(value.soon)}</b>${after}`;
}

export function stockCard() {
  const value = S.stockValue(state.products, state.settings.alertDays);
  if (!value.count) return html`<section class="stats-stock empty-stock"><p class="hint">${t('sstock.empty')}</p></section>`;
  const priced = value.count - value.unpriced;
  return html`
    <section class="stats-stock" aria-label="${t('sstock.aria')}">
      <p class="stock-total"><span>${t('sstock.now')}</span><strong>${S.formatEuro(value.total)}</strong></p>
      ${priced ? html`
        <div class="stock-places">
          ${value.places.map((place) => {
            return html`<p class="stock-place"><span>${S.placeName(place.location)}</span><b>${S.formatEuro(place.amount)}</b></p>`;
          })}
        </div>` : ''}
      ${value.soon > 0 ? html`
        <button class="stock-soon" data-action="stats-soon">
          <span>${soonText(value)}</span>${I.chevron}
        </button>` : ''}
      ${value.unpriced ? html`<p class="hint stock-unpriced">${priced ? t('sstock.unpriced', { n: value.unpriced }) : t('sstock.noPrice')}</p>` : ''}
    </section>`;
}
