// Kookia — Fiche produit : saisie dans les champs (nom, quantité, catégorie, dates).

import * as S from '../../services/index.js';
import { onPriceInput } from './editor-price.js';
import { onQuantityInput, refreshQuantityUnit } from './editor-quantity.js';
import { refreshStatus } from './editor-state.js';
import { suggestFromName } from './editor-suggestions.js';

export function handleEditorInput(ctx, event) {
  const { p, view } = ctx;
    const t = event.target;
    if (t.name === 'name') {
      p.name = t.value;
      const button = ctx.sheet.panel.querySelector('[data-action="save"]');
      if (button) button.disabled = !p.name.trim();
      if (event.type === 'change') suggestFromName(ctx);
    } else if (t.name === 'quantity') {
      if (event.type === 'input') onQuantityInput(ctx, t.value);
    } else if (t.name === 'price') {
      if (event.type === 'input') onPriceInput(ctx, t.value);
    } else if (t.name === 'category' && event.type === 'change') {
      p.category = t.value;
      view.categoryTouched = true;
      view.userCategory = true; // choisie à la main : retenue à l'enregistrement
      refreshQuantityUnit(ctx); // l'unité par défaut suit la catégorie
      if (S.dateKindOf(p) === 'congele') p.expiry = S.freezerLimit(p.category, p.frozenAt);
      ctx.sheet.update();
    } else if (t.name === 'expiry' && event.type === 'change') {
      p.expiry = t.value; // vide = « date à compléter »
      view.dateTouched = true;
      refreshStatus(ctx);
      ctx.sheet.panel.querySelector('.default-date')?.remove();
    } else if (t.name === 'frozenAt' && event.type === 'change' && t.value) {
      p.frozenAt = t.value;
      p.expiry = S.freezerLimit(p.category, p.frozenAt);
      refreshStatus(ctx);
    }
}
