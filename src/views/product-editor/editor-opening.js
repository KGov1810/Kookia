// Kookia — Fiche produit : « Entamé, il en reste ¾ · ½ · ¼ », en un toucher, en haut de la fiche.

import { html, raw } from '../../components/html.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { flushEdits } from './editor-save.js';
import { price } from './editor-units.js';

function stored(ctx) {
  return store.productById(ctx.p.id) ?? ctx.p;
}

/** Ce que l'ouverture change (date, rangement), en clair (aussi pour ¾ ½ ¼ en glissant une ligne du stock). */
export function openingEffect(product) {
  if (S.isOpened(product)) return '';
  const changes = S.openingChanges(product);
  return [
    changes.expiry ? t('opening.finishBy', { date: S.formatDate(changes.expiry, { day: 'numeric', month: 'long' }) }) : '',
    changes.location ? t('opening.storedAt', { at: S.placeAt(changes.location) }) : ''
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
  const effect = openingEffect(product);
  const note = [count > 1 && !opened ? t('opening.oneOf', { n: count }) : '', effect ? t('opening.effect', { effect }) : ''].filter(Boolean).join(' · ');
  return html`
    <div class="opening-row" role="group" aria-label="${t('opening.aria')}">
      <span class="opening-label">${t(opened ? 'opening.label' : 'opening.question')}</span>
      <span class="opening-choices">
        ${R.REMAINING_CHOICES.map((value) => html`<button class="chip" data-action="set-remaining" data-value="${value}" ${value >= remaining ? raw('disabled') : ''} aria-pressed="${String(opened && Math.abs(value - remaining) < 0.02)}" aria-label="${t('opening.choice', { rest: S.remainingLabel(value) })}">${S.remainingLabel(value)}</button>`)}
      </span>
      ${note ? html`<small class="opening-effect">${S.capitalize(note)}.</small>` : ''}
    </div>`;
}

export function openingActions(ctx) {
  return {
    'set-remaining': (el) => {
      flushEdits(ctx); // modifications de la fiche gardées avant le geste
      const product = stored(ctx);
      const remaining = Number(el.dataset.value);
      const effect = openingEffect(product);
      const done = store.openProduct(product.id, remaining, price(ctx));
      ctx.view.take = null;
      ctx.sheet.close();
      if (!done.before.length) return;
      const message = t('opening.toast', { name: product.name, rest: S.remainingLabel(remaining) });
      toast(`${message}${effect ? ` · ${effect}` : ''}`, t('common.cancel'), () => store.undoTake(done));
    }
  };
}
