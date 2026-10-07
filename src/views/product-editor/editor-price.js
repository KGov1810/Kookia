// Kookia — Fiche produit : prix à l'unité (facultatif) et dernier prix connu.

import { html, raw } from '../../components/html.js';
import { lastKnownPrice } from '../../data/store/prices.js';
import * as S from '../../services/index.js';

/** Texte sous le champ : origine du prix proposé et total pour plusieurs unités. */
export function priceHint(ctx) {
  const { p, view } = ctx;
  const parts = [];
  if (view.priceSuggested) parts.push('Dernier prix payé, à vérifier.');
  const count = p.count ?? 1;
  if (count > 1 && p.unitPrice !== null) parts.push(`Soit ${S.formatEuro(S.lineAmount(p.unitPrice, count))} pour ${count}.`);
  return parts.join(' ');
}

export function priceField(ctx) {
  const { view } = ctx;
  const hint = priceHint(ctx);
  return html`
    <label class="field price-field"><span>Prix à l'unité</span>
      <input name="price" value="${view.priceText}" inputmode="decimal" placeholder="Facultatif" autocomplete="off" enterkeyhint="done" aria-label="Prix à l'unité, en euros"><b aria-hidden="true">€</b>
    </label>
    <p class="hint inset price-hint" ${hint ? '' : raw('hidden')}>${hint}</p>`;
}

/** Saisie du prix : mise à jour sans tout redessiner (le clavier d'iOS resterait sinon bloqué). */
export function onPriceInput(ctx, value) {
  const { p, view } = ctx;
  view.priceText = value;
  view.priceTouched = true;
  view.priceSuggested = false;
  p.unitPrice = S.parsePrice(value);
  refreshPriceHint(ctx);
}

export function refreshPriceHint(ctx) {
  const element = ctx.sheet?.panel.querySelector('.price-hint');
  if (!element) return;
  const hint = priceHint(ctx);
  element.textContent = hint;
  element.hidden = !hint;
}

/**
 * Nouveau produit : propose le dernier prix payé (même code-barres, sinon même nom),
 * tant que le prix n'a pas été saisi à la main. Renvoie vrai si le prix a changé.
 */
export function applyKnownPrice(ctx) {
  const { p, view, isNew } = ctx;
  if (!isNew || view.priceTouched || (p.unitPrice !== null && !view.priceSuggested)) return false;
  const known = lastKnownPrice(p);
  if (known === p.unitPrice) return false;
  p.unitPrice = known;
  view.priceText = S.priceInputValue(known);
  view.priceSuggested = known !== null;
  return true;
}

/** Après la saisie du nom : met à jour le champ prix affiché. */
export function suggestPrice(ctx) {
  if (!applyKnownPrice(ctx)) return;
  const input = ctx.sheet?.panel.querySelector('[name="price"]');
  if (input) input.value = ctx.view.priceText;
  refreshPriceHint(ctx);
}

/** Vrai si un prix a été tapé mais n'est pas lisible (« 2,4x »). */
export function priceIsInvalid(ctx) {
  return ctx.view.priceText.trim() !== '' && ctx.p.unitPrice === null;
}
