// Kookia — Ticket de caisse : affichage (photos, puis vérification des produits reconnus).

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { unitInput } from '../../components/unit-input.js';
import * as R from '../../data/reference/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import * as S from '../../services/index.js';

export function selected(ctx) {
  const { view } = ctx;
  return view.items.filter((i) => i.selected && i.name.trim());
}

/** Articles de la liste de courses qui seront retirés (achetés, ajoutés au stock ou non). */
export function removals(ctx) {
  return ctx.view.items.filter((i) => i.shoppingId && i.removeFromList);
}

/** Total des prix lus sur les lignes cochées, à comparer au ticket. */
export function receiptTotal(ctx) {
  const kept = selected(ctx);
  const priced = kept.filter((i) => i.price !== null);
  if (!kept.length) return '';
  const missing = kept.length - priced.length;
  const total = priced.reduce((sum, i) => sum + i.price, 0);
  return `Total des lignes cochées : ${S.formatEuro(total)}${missing ? ` (${S.plural(missing, 'produit')} sans prix)` : ''}.`;
}

/** Bouton de validation : ajouter au stock, ou seulement retirer des articles de la liste. */
function confirmLabel(ctx) {
  const count = selected(ctx).length;
  if (count) return `Ajouter ${S.plural(count, 'produit')} au stock`;
  const listed = removals(ctx).length;
  return listed ? `Retirer ${S.plural(listed, 'article')} de la liste` : 'Ajouter au stock';
}

export function renderReceipt(ctx) {
  const { view } = ctx;
  const head = view.stage === 'review'
    ? html`<button class="link strong" data-action="confirm" ${canConfirm(ctx) ? '' : raw('disabled')}>OK</button>`
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
      <button class="${view.photos.length ? 'secondary' : 'primary'}" data-action="add-photo">${I.camera}${view.photos.length ? 'Ajouter une photo (suite du ticket)' : 'Photographier le ticket'}</button>
      ${view.photos.length ? html`<button class="primary" data-action="analyze">${I.sparkle}Lire le ticket</button>` : ''}
    </div>
    <p class="hint">La photo est envoyée à Claude pour être lue ; elle n'est pas conservée dans l'app.</p>`;
}

const canConfirm = (ctx) => selected(ctx).length > 0 || removals(ctx).length > 0;

/** Une ligne du ticket, et l'article de la liste de courses qu'elle achète (à retirer ou à garder). */
function receiptLine(item, index) {
  return html`
    <div class="receipt-item ${item.food ? '' : 'nonfood'}">
      <div class="receipt-line ${item.selected ? '' : 'off'}">
        <button class="pick-box" role="checkbox" aria-checked="${String(item.selected)}" data-action="toggle-line" data-index="${index}" aria-label="Ajouter ${item.name} au stock"><span class="box">${I.check}</span></button>
        <span class="thumb">${item.food ? R.category(item.category).emoji : '🧴'}</span>
        <div class="receipt-fields">
          <input data-field="name" data-index="${index}" value="${item.name}" aria-label="Nom du produit" autocomplete="off">
          <small>${item.receiptText ? `« ${item.receiptText} »` : ''}</small>
          <div class="receipt-qty">
            <div class="stepper small">
              <button data-action="line-minus" data-index="${index}" aria-label="Un de moins" ${item.count <= 1 ? raw('disabled') : ''}>−</button>
              <output>${item.count}</output>
              <button data-action="line-plus" data-index="${index}" aria-label="Un de plus">+</button>
            </div>
            ${unitInput({ amount: item.qtyAmount ?? item.quantity, unit: item.qtyLegacy ? null : item.qtyUnit, units: S.unitsFor(item.category),
              dataset: { index }, inputData: { field: 'quantity' }, label: 'Poids ou contenance (chiffre)', placeholder: 'Poids' })}
          </div>
          <div class="receipt-place">
            <select class="receipt-location" data-field="location" data-index="${index}" aria-label="Lieu de rangement">
              ${R.LOCATIONS.map((loc) => html`<option value="${loc.id}" ${item.location === loc.id ? raw('selected') : ''}>${loc.label}</option>`)}
            </select>
            <label class="receipt-price"><input data-field="price" data-index="${index}" value="${item.priceText}" inputmode="decimal" placeholder="Prix" aria-label="Prix payé pour la ligne, en euros" autocomplete="off"><b aria-hidden="true">€</b></label>
          </div>
        </div>
      </div>
      ${item.shoppingId ? html`
        <button class="list-toggle" role="checkbox" data-action="toggle-list" data-index="${index}" aria-pressed="${String(item.removeFromList)}" aria-checked="${String(item.removeFromList)}">
          <span class="box">${I.check}</span>Retirer « ${item.shoppingName} » de la liste
        </button>` : ''}
    </div>`;
}

export function reviewStep(ctx) {
  const { view } = ctx;
  if (!view.items.length) {
    return html`
      <p class="note warn">Aucun article reconnu sur ce ticket.</p>
      <button class="secondary" data-action="back-to-photos">Reprendre les photos</button>`;
  }
  const lines = view.items.map((item, index) => ({ item, index }));
  const food = lines.filter((l) => l.item.food);
  const other = lines.filter((l) => !l.item.food);
  const listed = removals(ctx);
  return html`
    <p class="note ok">${S.plural(food.length, 'produit reconnu', 'produits reconnus')}${other.length ? `, et ${S.plural(other.length, 'article non alimentaire', 'articles non alimentaires')} (grisés, non ajoutés)` : ''}. Vérifiez les noms, les nombres, les prix et le lieu. Les dates du frigo seront à compléter.</p>
    <p class="hint" id="receipt-total">${receiptTotal(ctx)}</p>
    ${food.length ? html`<section class="group">${food.map((l) => receiptLine(l.item, l.index))}</section>` : ''}
    ${other.length ? html`
      <h2 class="section">Non alimentaire<small>${other.length}</small></h2>
      <p class="hint">Pas ajoutés au stock ni aux statistiques. Cochez une ligne si c'est une erreur.</p>
      <section class="group">${other.map((l) => receiptLine(l.item, l.index))}</section>` : ''}
    ${listed.length ? html`<p class="hint">Retirés de la liste de courses : ${listed.map((i) => i.shoppingName).join(', ')}.</p>` : ''}
    <button class="primary" data-action="confirm" ${canConfirm(ctx) ? '' : raw('disabled')}>${I.check}${confirmLabel(ctx)}</button>
    <button class="link" data-action="back-to-photos">Reprendre les photos</button>`;
}
