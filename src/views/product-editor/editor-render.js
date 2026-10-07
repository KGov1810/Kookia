// Kookia — Fiche produit : affichage.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { LOCATION_ICON, categoryOptions, thumb } from '../../components/product-visuals.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import * as S from '../../services/index.js';
import { dateSection } from './editor-date-section.js';
import { priceField } from './editor-price.js';
import { unitsButton } from './editor-units.js';

export function renderEditor(ctx) {
  const { p, view, isNew } = ctx;
  return html`
    <header class="sheet-head">
      <button class="link" data-action="close">Annuler</button>
      <h2>${isNew ? 'Nouveau produit' : 'Modifier le produit'}</h2>
      <button class="link strong" data-action="save" ${p.name.trim() ? '' : raw('disabled')}>${isNew ? 'Ajouter' : 'Enregistrer'}</button>
    </header>
    <div class="sheet-body">
      ${view.info ? html`<p class="note ok">${view.info}</p>` : ''}
      ${view.error ? html`<p class="note warn">${view.error}</p>` : ''}
      ${sameProductNote(ctx)}
      <div class="capture">
        <button data-action="scan">${I.barcode}Code-barres</button>
        <button data-action="photo">${I.camera}Photo du produit</button>
        <button data-action="date-photo">${I.calendar}Lire la date</button>
      </div>
      ${hasClaudeKey() ? '' : html`<p class="hint">Sans clé Claude (Réglages), la photo sert seulement à lire la date. Le code-barres reste le moyen le plus fiable d'identifier un produit.</p>`}
      <section class="group">
        <div class="name-row">${thumb(p)}<input name="name" value="${p.name}" placeholder="Nom (ex. Yaourt nature)" autocomplete="off" enterkeyhint="done" aria-label="Nom du produit"></div>
        <label class="field"><span>Catégorie</span>
          <select name="category">${categoryOptions(p.category)}</select>
        </label>
        <div class="field"><span>Nombre</span>
          <div class="stepper">
            <button data-action="count-minus" aria-label="Un de moins" ${(p.count ?? 1) <= 1 ? raw('disabled') : ''}>−</button>
            <output aria-live="polite">${p.count ?? 1}</output>
            <button data-action="count-plus" aria-label="Un de plus">+</button>
          </div>
        </div>
        <label class="field"><span>Poids ou contenance</span><input name="quantity" value="${p.quantity}" placeholder="2 kg, 500 g, 1 L…" autocomplete="off"></label>
        ${(p.count ?? 1) > 1 && p.quantity.trim() ? html`<p class="hint inset">En stock : ${S.quantityLabel(p)}</p>` : ''}
        ${priceField(ctx)}
        ${p.image || p.imageUrl ? html`<button class="row-button danger" data-action="remove-photo">${I.trash}Retirer la photo</button>` : ''}
      </section>
      <section class="group">
        <h2>Rangement</h2>
        <div class="location-grid" role="group" aria-label="Lieu de rangement">
          ${R.LOCATIONS.map((loc) => html`<button data-action="set-loc" data-value="${loc.id}" aria-pressed="${String(p.location === loc.id)}">${LOCATION_ICON[loc.id]()}${loc.label}</button>`)}
        </div>
      </section>
      ${dateSection(ctx)}
      ${isNew ? '' : html`
        <section class="group">
          ${p.addedBy ? html`<div class="field"><span>Ajouté par</span><span class="muted">${p.addedBy}</span></div>` : ''}
          <button class="row-button" data-action="to-shopping">${I.cart}Ajouter à la liste de courses</button>
          ${p.location !== 'congelateur' && p.location !== 'placard' ? unitsButton(ctx, 'freeze') : ''}
          ${unitsButton(ctx, 'consume')}
          ${unitsButton(ctx, 'discard')}
        </section>`}
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
