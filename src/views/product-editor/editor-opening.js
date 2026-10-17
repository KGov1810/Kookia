// Kookia — Fiche produit : « Entamé, il en reste ¾ · ½ · ¼ », en un toucher, en haut de la fiche.

import { html, raw } from '../../components/html.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';
import { flushEdits } from './editor-save.js';
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

/**
 * Carte « Il en reste ¾ ½ ¼ » (les parts déjà dépassées sont grisées), et ce que l'ouverture change.
 * La date d'ouverture et la part restante sont rappelées dans la carte d'état, au-dessus.
 */
export function openingRow(ctx) {
  const product = stored(ctx);
  const remaining = S.remainingOf(product);
  const opened = remaining < 1;
  const count = product.count ?? 1;
  const effect = changesText(product);
  const note = [count > 1 && !opened ? `1 sur ${count}, mis à part` : '', effect ? `à l'ouverture : ${effect}` : ''].filter(Boolean).join(' · ');
  return html`
    <div class="opening-row" role="group" aria-label="Combien en reste-t-il ?">
      <span class="opening-label">${opened ? 'Il en reste' : 'Entamé ? Il en reste'}</span>
      <span class="opening-choices">
        ${R.REMAINING_CHOICES.map((value) => html`<button class="chip" data-action="set-remaining" data-value="${value}" ${value >= remaining ? raw('disabled') : ''} aria-pressed="${String(opened && Math.abs(value - remaining) < 0.02)}" aria-label="Il en reste ${S.remainingLabel(value)}">${S.remainingLabel(value)}</button>`)}
      </span>
      ${note ? html`<small class="opening-effect">${note.charAt(0).toUpperCase()}${note.slice(1)}.</small>` : ''}
    </div>`;
}

export function openingActions(ctx) {
  return {
    'set-remaining': (el) => {
      flushEdits(ctx); // modifications de la fiche gardées avant le geste
      const product = stored(ctx);
      const remaining = Number(el.dataset.value);
      const effect = changesText(product);
      const done = store.openProduct(product.id, remaining, price(ctx));
      ctx.view.take = null;
      ctx.sheet.close();
      if (!done.before.length) return;
      toast(`${product.name} : entamé, reste ${S.remainingLabel(remaining)}${effect ? ` · ${effect}` : ''}`, 'Annuler', () => store.undoTake(done));
    }
  };
}
