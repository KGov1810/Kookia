// Kookia — Fiche produit : « Entamé » — combien en reste-t-il ? ¾ · ½ · ¼, en un toucher.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';
import { price } from './editor-units.js';

function stored(ctx) {
  return store.productById(ctx.p.id) ?? ctx.p;
}

/** Ce que l'ouverture change (date, rangement), en clair. */
function changesText(product) {
  if (S.isOpened(product)) return '';
  const changes = S.openingChanges(product);
  return [
    changes.expiry ? `à finir avant le ${S.formatDate(changes.expiry, { day: 'numeric', month: 'long' })}` : '',
    changes.location ? `rangé ${R.locationOf(changes.location).at}` : ''
  ].filter(Boolean).join(' · ');
}

export function openingSection(ctx) {
  const product = stored(ctx);
  const remaining = S.remainingOf(product);
  const opened = remaining < 1;
  const label = opened
    ? `Entamé : reste ${S.remainingLabel(remaining)}${product.openedAt ? `, ouvert le ${S.formatDate(product.openedAt, { day: 'numeric', month: 'short' })}` : ''}`
    : 'Entamé : il en reste une partie';
  const button = html`<button class="row-button" data-action="opening" aria-expanded="${String(Boolean(ctx.view.opening))}">${I.gauge}${label}</button>`;
  if (!ctx.view.opening) return button;
  const effect = changesText(product);
  return html`${button}
    <div class="units-box units-opening" role="group" aria-label="Combien en reste-t-il ?">
      <div class="field"><span>Combien en reste-t-il ?${(product.count ?? 1) > 1 ? ' (1 sur ' + product.count + ', mis à part)' : ''}</span>
        <span class="opening-choices">
          ${R.REMAINING_CHOICES.map((value) => html`<button class="chip" data-action="set-remaining" data-value="${value}" ${value >= remaining ? raw('disabled') : ''} aria-label="Il en reste ${S.remainingLabel(value)}">${S.remainingLabel(value)}</button>`)}
        </span>
      </div>
      <p class="hint inset">${effect ? `${effect.charAt(0).toUpperCase()}${effect.slice(1)}. ` : ''}La part en moins compte comme consommée dans les statistiques.</p>
    </div>`;
}

export function openingActions(ctx) {
  const { view } = ctx;
  return {
    opening: () => {
      view.opening = !view.opening;
      view.take = null;
      ctx.sheet.update();
    },
    'set-remaining': (el) => {
      const product = stored(ctx);
      const remaining = Number(el.dataset.value);
      const effect = changesText(product);
      const done = store.openProduct(product.id, remaining, price(ctx));
      view.opening = false;
      ctx.sheet.close();
      if (!done.before.length) return;
      toast(`${product.name} : entamé, reste ${S.remainingLabel(remaining)}${effect ? ` · ${effect}` : ''}`, 'Annuler', () => store.undoTake(done));
    }
  };
}
