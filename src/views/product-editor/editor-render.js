// Kookia — Fiche produit : affichage.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { categoryOptions, thumb } from '../../components/product-visuals.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { dateSection } from './editor-date-section.js';
import { priceField } from './editor-price.js';
import { quantityField } from './editor-quantity.js';
import { topActions } from './editor-top-actions.js';

/** Ajout : lire un code-barres, reconnaître le produit ou lire la date en photo. */
function captureButtons() {
  return html`
    <div class="capture">
      <button data-action="scan">${I.barcode}${t('editor.barcode')}</button>
      <button data-action="photo">${I.camera}${t('editor.productPhoto')}</button>
      <button data-action="date-photo">${I.calendar}${t('editor.readDate')}</button>
    </div>
    ${hasClaudeKey() ? '' : html`<p class="hint">${t('editor.noKeyHint')}</p>`}`;
}

/** Nom : avec la vignette pour un nouveau produit (elle suit la catégorie), en ligne de liste sinon. */
function nameField(ctx) {
  const { p, isNew } = ctx;
  const input = html`<input name="name" value="${p.name}" placeholder="${t(isNew ? 'editor.namePlaceholder' : 'editor.productName')}" autocomplete="off" enterkeyhint="done" aria-label="${t('editor.productName')}">`;
  return isNew ? html`<div class="name-row">${thumb(p)}${input}</div>` : html`<label class="field name-field"><span>${t('editor.name')}</span>${input}</label>`;
}

/** Fruits & légumes : au frigo ou hors du frigo (la durée estimée en dépend). */
function coldChoice(p) {
  if (p.location !== 'fruits') return '';
  const cold = S.keptCold(p);
  const item = S.produceFor(p.name);
  const hint = item ? t('cold.hint', { fridge: S.durationText(item.fridgeDays), room: S.durationText(item.roomDays) }) : '';
  return html`
    <div class="segmented cold-choice" role="group" aria-label="${t('cold.aria')}">
      ${[['frigo', 'cold.fridge'], ['ambiant', 'cold.room']].map(([value, key]) => html`
        <button data-action="set-cold" data-value="${value}" aria-pressed="${String(cold === (value === 'frigo'))}">${t(key)}</button>`)}
    </div>
    ${hint ? html`<p class="hint cold-hint">${hint}</p>` : ''}`;
}

export function renderEditor(ctx) {
  const { p, view, isNew } = ctx;
  return html`
    <header class="sheet-head editor-head">
      <button class="link" data-action="close">${t(isNew ? 'common.cancel' : 'common.close')}</button>
      ${isNew ? html`<h2>${t('editor.new')}</h2>` : html`<small class="saved-note">${t('editor.autosaved')}</small>`}
      <button class="link strong" data-action="save" ${p.name.trim() ? '' : raw('disabled')}>${t(isNew ? 'editor.add' : 'common.ok')}</button>
    </header>
    <div class="sheet-body editor-body">
      ${view.info ? html`<p class="note ok">${view.info}</p>` : ''}
      ${view.error ? html`<p class="note warn">${view.error}</p>` : ''}
      ${isNew ? html`${sameProductNote(ctx)}${captureButtons()}` : topActions(ctx)}
      <section class="group edit-list">
        ${nameField(ctx)}
        <label class="field"><span>${t('editor.category')}</span>
          <select name="category">${categoryOptions(p.category)}</select>
        </label>
        ${dateSection(ctx)}
        <div class="field"><span>${t('editor.count')}</span>
          <div class="stepper">
            <button data-action="count-minus" aria-label="${t('editor.oneLess')}" ${(p.count ?? 1) <= 1 ? raw('disabled') : ''}>−</button>
            <output aria-live="polite">${p.count ?? 1}</output>
            <button data-action="count-plus" aria-label="${t('editor.oneMore')}">+</button>
          </div>
        </div>
        ${quantityField(ctx)}
        ${(p.count ?? 1) > 1 && p.quantity.trim() ? html`<p class="hint inset">${t('editor.inStock', { qty: S.quantityLabel(p) })}</p>` : ''}
        ${priceField(ctx)}
        ${p.image || p.imageUrl ? html`<button class="row-button danger" data-action="remove-photo">${I.trash}${t('editor.removePhoto')}</button>` : ''}
      </section>
      <h2 class="section">${t('editor.storage')}</h2>
      <div class="location-grid" role="group" aria-label="${t('stock.place')}">
        ${R.LOCATIONS.map((loc) => html`<button data-action="set-loc" data-value="${loc.id}" aria-pressed="${String(p.location === loc.id)}">${S.placeName(loc.id)}</button>`)}
      </div>
      ${coldChoice(p)}
      ${!isNew && p.addedBy ? html`<p class="hint added-by">${t('editor.addedBy', { name: p.addedBy })}</p>` : ''}
    </div>
    ${view.busy ? html`<div class="busy"><span class="spinner"></span><p>${view.busy}</p></div>` : ''}`;
}

/** Produit identique (même code-barres) déjà en stock : proposer d'augmenter son nombre. */
export function sameProductNote(ctx) {
  const { p, view, isNew } = ctx;
  const same = isNew && view.sameProductId ? store.productById(view.sameProductId) : null;
  if (!same) return '';
  return html`
    <div class="note ok same-product">
      <span>${t('editor.same', { at: S.placeAt(same.location), name: same.name, qty: S.quantityLabel(same) || '1', short: S.stockShort(same) })}</span>
      <button class="secondary" data-action="add-to-same">${t('editor.addToSame', { n: p.count ?? 1 })}</button>
      <small>${t('editor.sameHint')}</small>
    </div>`;
}
