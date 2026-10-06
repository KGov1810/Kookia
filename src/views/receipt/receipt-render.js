// Kookia — Ticket de caisse : affichage (photos, puis vérification des produits reconnus).

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import * as R from '../../data/reference/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import * as S from '../../services/index.js';

export function selected(ctx) {
  const { view } = ctx;
  return view.items.filter((i) => i.selected && i.name.trim());
}

export function renderReceipt(ctx) {
  const { view } = ctx;
  const head = view.stage === 'review'
    ? html`<button class="link strong" data-action="confirm" ${selected(ctx).length ? '' : raw('disabled')}>Ajouter</button>`
    : html`<span></span>`;
  return html`
    <header class="sheet-head">
      <button class="link" data-action="close">Annuler</button>
      <h2>Ticket de caisse</h2>
      ${head}
    </header>
    <div class="sheet-body">
      ${view.error ? html`<p class="note warn">${view.error}</p>` : ''}
      ${!hasClaudeKey()
        ? html`<p class="note warn">La lecture d'un ticket nécessite une clé Claude : ajoutez-la dans Réglages → Recettes et photos.</p>`
        : view.stage === 'photos' ? photosStep(ctx) : reviewStep(ctx)}
    </div>
    ${view.busy ? html`<div class="busy"><span class="spinner"></span><p>${view.busy}</p></div>` : ''}`;
}

export function photosStep(ctx) {
  const { view } = ctx;
  return html`
    <p class="hint">Photographiez le ticket bien à plat, avec de la lumière. S'il est long, prenez plusieurs photos de haut en bas. Une capture d'écran de commande en ligne fonctionne aussi.</p>
    ${view.photos.length ? html`
      <div class="receipt-photos">
        ${view.photos.map((photo, index) => html`
          <div class="receipt-photo"><img src="${photo.preview}" alt="Photo ${index + 1} du ticket">
            <button class="icon-btn" data-action="remove-photo" data-index="${index}" aria-label="Retirer la photo ${index + 1}">${I.x}</button>
          </div>`)}
      </div>` : ''}
    <div class="row-actions">
      <button class="secondary" data-action="add-photo">${I.camera}${view.photos.length ? 'Ajouter une photo (suite du ticket)' : 'Photographier le ticket'}</button>
      ${view.photos.length ? html`<button class="primary" data-action="analyze">${I.sparkle}Lire le ticket</button>` : ''}
    </div>
    <p class="hint">La photo est envoyée à Claude pour être lue ; elle n'est pas conservée dans l'app.</p>`;
}

export function reviewStep(ctx) {
  const { view } = ctx;
  if (!view.items.length) {
    return html`
      <p class="note warn">Aucun produit alimentaire reconnu sur ce ticket.</p>
      <button class="secondary" data-action="back-to-photos">Reprendre les photos</button>`;
  }
  const onList = view.items.filter((i) => i.selected && i.shoppingId);
  return html`
    <p class="note ok">${S.plural(view.items.length, 'produit reconnu', 'produits reconnus')}. Vérifiez les noms, les nombres et le lieu ; décochez ce qui ne va pas en stock. Les dates du frigo seront à compléter ; placard, congélateur, fruits et légumes n'en ont pas besoin.</p>
    <section class="group">
      ${view.items.map((item, index) => html`
        <div class="receipt-line ${item.selected ? '' : 'off'}">
          <button class="pick-box" role="checkbox" aria-checked="${String(item.selected)}" data-action="toggle-line" data-index="${index}" aria-label="Garder ${item.name}"><span class="box">${I.check}</span></button>
          <span class="thumb">${R.category(item.category).emoji}</span>
          <div class="receipt-fields">
            <input data-field="name" data-index="${index}" value="${item.name}" aria-label="Nom du produit" autocomplete="off">
            <small>${item.receiptText ? `« ${item.receiptText} »` : ''}${item.shoppingId ? html` <b class="on-list">sur votre liste</b>` : ''}</small>
            <div class="receipt-qty">
              <div class="stepper small">
                <button data-action="line-minus" data-index="${index}" aria-label="Un de moins" ${item.count <= 1 ? raw('disabled') : ''}>−</button>
                <output>${item.count}</output>
                <button data-action="line-plus" data-index="${index}" aria-label="Un de plus">+</button>
              </div>
              <input data-field="quantity" data-index="${index}" value="${item.quantity}" placeholder="Poids" aria-label="Poids ou contenance" autocomplete="off">
            </div>
            <select class="receipt-location" data-field="location" data-index="${index}" aria-label="Lieu de rangement">
              ${R.LOCATIONS.map((loc) => html`<option value="${loc.id}" ${item.location === loc.id ? raw('selected') : ''}>${loc.label}</option>`)}
            </select>
          </div>
        </div>`)}
    </section>
    ${onList.length ? html`<p class="hint">Retirés de la liste de courses à l'ajout : ${onList.map((i) => i.shoppingName).join(', ')}.</p>` : ''}
    <button class="primary" data-action="confirm" ${selected(ctx).length ? '' : raw('disabled')}>${I.check}Ajouter ${S.plural(selected(ctx).length, 'produit')} au stock</button>
    <button class="link" data-action="back-to-photos">Reprendre les photos</button>`;
}
