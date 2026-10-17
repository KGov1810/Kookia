// Kookia — Fiche produit : affichage.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { categoryOptions, thumb } from '../../components/product-visuals.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import * as S from '../../services/index.js';
import { dateSection } from './editor-date-section.js';
import { priceField } from './editor-price.js';
import { quantityField } from './editor-quantity.js';
import { topActions } from './editor-top-actions.js';

/** Ajout : lire un code-barres, reconnaître le produit ou lire la date en photo. */
function captureButtons() {
  return html`
    <div class="capture">
      <button data-action="scan">${I.barcode}Code-barres</button>
      <button data-action="photo">${I.camera}Photo du produit</button>
      <button data-action="date-photo">${I.calendar}Lire la date</button>
    </div>
    ${hasClaudeKey() ? '' : html`<p class="hint">Sans clé Claude (Réglages), la photo sert seulement à lire la date. Le code-barres reste le moyen le plus fiable d'identifier un produit.</p>`}`;
}

/** Nom : avec la vignette pour un nouveau produit (elle suit la catégorie), en ligne de liste sinon. */
function nameField(ctx) {
  const { p, isNew } = ctx;
  const input = html`<input name="name" value="${p.name}" placeholder="${isNew ? 'Nom (ex. Yaourt nature)' : 'Nom du produit'}" autocomplete="off" enterkeyhint="done" aria-label="Nom du produit">`;
  return isNew ? html`<div class="name-row">${thumb(p)}${input}</div>` : html`<label class="field name-field"><span>Nom</span>${input}</label>`;
}

export function renderEditor(ctx) {
  const { p, view, isNew } = ctx;
  return html`
    <header class="sheet-head editor-head">
      <button class="link" data-action="close">${isNew ? 'Annuler' : 'Fermer'}</button>
      ${isNew ? html`<h2>Nouveau produit</h2>` : html`<small class="saved-note">Enregistré automatiquement</small>`}
      <button class="link strong" data-action="save" ${p.name.trim() ? '' : raw('disabled')}>${isNew ? 'Ajouter' : 'OK'}</button>
    </header>
    <div class="sheet-body editor-body">
      ${view.info ? html`<p class="note ok">${view.info}</p>` : ''}
      ${view.error ? html`<p class="note warn">${view.error}</p>` : ''}
      ${isNew ? html`${sameProductNote(ctx)}${captureButtons()}` : topActions(ctx)}
      <section class="group edit-list">
        ${nameField(ctx)}
        <label class="field"><span>Catégorie</span>
          <select name="category">${categoryOptions(p.category)}</select>
        </label>
        ${dateSection(ctx)}
        <div class="field"><span>Nombre</span>
          <div class="stepper">
            <button data-action="count-minus" aria-label="Un de moins" ${(p.count ?? 1) <= 1 ? raw('disabled') : ''}>−</button>
            <output aria-live="polite">${p.count ?? 1}</output>
            <button data-action="count-plus" aria-label="Un de plus">+</button>
          </div>
        </div>
        ${quantityField(ctx)}
        ${(p.count ?? 1) > 1 && p.quantity.trim() ? html`<p class="hint inset">En stock : ${S.quantityLabel(p)}</p>` : ''}
        ${priceField(ctx)}
        ${p.image || p.imageUrl ? html`<button class="row-button danger" data-action="remove-photo">${I.trash}Retirer la photo</button>` : ''}
      </section>
      <h2 class="section">Rangement</h2>
      <div class="location-grid" role="group" aria-label="Lieu de rangement">
        ${R.LOCATIONS.map((loc) => html`<button data-action="set-loc" data-value="${loc.id}" aria-pressed="${String(p.location === loc.id)}">${loc.label}</button>`)}
      </div>
      ${!isNew && p.addedBy ? html`<p class="hint added-by">Ajouté par ${p.addedBy}</p>` : ''}
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
      <span>Déjà ${R.locationOf(same.location).at} : ${same.name} (${S.quantityLabel(same) || '1'}, ${S.stockShort(same)}).</span>
      <button class="secondary" data-action="add-to-same">Ajouter ${p.count ?? 1} à ce produit</button>
      <small>Même date de péremption ? Ajoutez-le à l'existant. Sinon, enregistrez-le à part.</small>
    </div>`;
}
