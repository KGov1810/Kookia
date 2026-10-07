// Kookia — Fiche produit : catégorie, lieu et date proposés d'après le nom.

import { fmt } from '../../components/html.js';
import { thumb } from '../../components/product-visuals.js';
import * as R from '../../data/reference/index.js';
import * as S from '../../services/index.js';
import { dateSection } from './editor-date-section.js';
import { suggestPrice } from './editor-price.js';
import { setKind, setLocation } from './editor-state.js';

/**
 * Après la saisie du nom : catégorie proposée (« Lentilles » → Légumineuses), lieu habituel
 * et date estimée. Seules les parties concernées sont redessinées, pour ne pas perdre
 * le toucher en cours (bouton « Ajouter », par exemple).
 */
export function suggestFromName(ctx) {
  const { p, view, isNew } = ctx;
  let changed = false;
  if (isNew && !view.categoryTouched) {
    const guess = S.guessCategory(p.name);
    if (guess && guess !== p.category) {
      p.category = guess;
      changed = true;
      const select = ctx.sheet.panel.querySelector('[name="category"]');
      if (select) select.value = guess;
      const thumbEl = ctx.sheet.panel.querySelector('.name-row .thumb');
      if (thumbEl && !p.image && !p.imageUrl) thumbEl.outerHTML = fmt(thumb(p));
      const place = view.locationTouched ? null : S.defaultLocationFor(guess, p.name);
      if (place && place !== p.location) {
        setLocation(ctx, place);
        ctx.sheet.panel.querySelectorAll('[data-action="set-loc"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === p.location)));
      }
      // Un fruit ou un légume n'a pas de date imprimée : date estimée ; l'inverse pour les autres produits.
      const produce = guess === 'fruits' || guess === 'legumes';
      const kinds = R.KINDS_BY_LOCATION[p.location] ?? [];
      if (!view.dateTouched && produce && S.dateKindOf(p) === 'dlc' && kinds.includes('estimee')) setKind(ctx, 'estimee');
      else if (!view.dateTouched && !produce && S.dateKindOf(p) === 'estimee' && kinds.includes('dlc')) setKind(ctx, 'dlc');
    }
  }
  if (S.dateKindOf(p) === 'estimee' && !view.dateTouched) {
    p.expiry = S.isoInDays(S.estimateFreshDays(p.name, p.location));
    changed = true;
  }
  if (S.dateKindOf(p) === 'congele') p.expiry = S.freezerLimit(p.category, p.frozenAt);
  const section = ctx.sheet.panel.querySelector('#date-section');
  if (changed && section) section.outerHTML = fmt(dateSection(ctx));
  suggestPrice(ctx);
}
