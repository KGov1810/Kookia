// Kookia — Statistiques : valeur du stock en ce moment (indépendante de la période et des filtres).

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { LOCATION_ICON } from '../../components/product-visuals.js';
import * as R from '../../data/reference/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';

export function stockCard() {
  const value = S.stockValue(state.products, state.settings.alertDays);
  if (!value.count) return html`<section class="stats-stock empty-stock"><p class="hint">Le stock est vide pour l'instant.</p></section>`;
  const priced = value.count - value.unpriced;
  return html`
    <section class="stats-stock" aria-label="Valeur du stock en ce moment">
      <p class="stock-total"><span>En stock maintenant</span><strong>${S.formatEuro(value.total)}</strong></p>
      ${priced ? html`
        <div class="stock-places">
          ${value.places.map((place) => {
            const loc = R.locationOf(place.location);
            return html`<p class="stock-place">${LOCATION_ICON[loc.id]()}<span>${loc.label}</span><b>${S.formatEuro(place.amount)}</b></p>`;
          })}
        </div>` : ''}
      ${value.soon > 0 ? html`
        <button class="stock-soon" data-action="stats-soon">
          <span><b>${S.formatEuro(value.soon)}</b> à consommer vite (${S.plural(value.soonCount, 'produit')})</span>${I.chevron}
        </button>` : ''}
      ${value.unpriced ? html`<p class="hint stock-unpriced">${priced
        ? `${S.plural(value.unpriced, 'produit')} sans prix ${value.unpriced > 1 ? 'ne sont' : 'n\'est'} pas compté${value.unpriced > 1 ? 's' : ''}.`
        : 'Aucun produit en stock n\'a encore de prix : ajoutez-le dans leur fiche, ou scannez vos tickets de caisse.'}</p>` : ''}
    </section>`;
}
