// Kookia — Fiche d'un produit en stock : les gestes du quotidien en haut (Consommé, Congeler, Jeté, Entamé, courses).

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { openingRow } from './editor-opening.js';
import { unitsBox, unitsTile } from './editor-units.js';

export function topActions(ctx) {
  const product = store.productById(ctx.p.id) ?? ctx.p;
  const canFreeze = !['congelateur', 'placard'].includes(product.location);
  const status = S.stockStatus(product, state.settings.alertDays);
  return html`
    <section class="group product-actions">
      <p class="action-status expiry-status ${status}">${[S.quantityLabel(product), S.stockLabel(product)].filter(Boolean).join(' · ')}</p>
      <div class="action-tiles">
        ${unitsTile(ctx, 'consume')}
        ${canFreeze ? unitsTile(ctx, 'freeze') : ''}
        ${unitsTile(ctx, 'discard')}
      </div>
      ${unitsBox(ctx)}
      ${openingRow(ctx)}
      <button class="row-button" data-action="to-shopping">${I.cart}Ajouter à la liste de courses</button>
    </section>
    <h2 class="section">Modifier</h2>`;
}
