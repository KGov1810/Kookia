// Kookia — Fruits et légumes : lignes de la sélection (nombre, poids total, prix payé).
// Le poids et le prix tapés valent pour toute la ligne ; ils sont enregistrés par pièce.

import { html, raw } from '../../components/html.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';

export function newEntry(item) {
  return { item, count: 0, weight: '', priceText: '', priceTouched: false, suggested: false };
}

/** Prix proposé : dernier prix payé par pièce × nombre, tant que le prix n'a pas été tapé. */
export function suggestLinePrice(entry) {
  if (entry.priceTouched) return;
  const last = store.lastKnownPrice({ name: entry.item.name });
  entry.priceText = last === null ? '' : S.priceInputValue(last * entry.count);
  entry.suggested = last !== null;
}

/** Ligne d'aide : poids et prix par pièce, origine du prix, ou saisie illisible. */
export function lineHint(entry) {
  const parts = [];
  const weight = S.parseWeight(entry.weight);
  if (entry.weight.trim() && !weight && entry.count > 1) parts.push('poids illisible : écrivez par exemple 1,2 kg ou 800 g');
  else if (weight && entry.count > 1) parts.push(`${S.formatWeight(weight)} au total, ≈ ${S.weightPerPiece(entry.weight, entry.count)} pièce`);
  const price = S.parsePrice(entry.priceText);
  if (entry.priceText.trim() && price === null) parts.push('prix illisible : écrivez par exemple 3,58');
  else if (price !== null && entry.count > 1) parts.push(`${S.formatEuro(price / entry.count)} pièce`);
  if (entry.suggested && price !== null) parts.push('dernier prix payé, à vérifier');
  const text = parts.join(' · ');
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
}

export function selectionLines(entries) {
  return entries.map((entry) => {
    const { item, count } = entry;
    const hint = lineHint(entry);
    return html`
      <div class="produce-line">
        <div class="field"><span class="label-stack">${item.emoji} ${item.name}<small>${R.locationOf(item.place).label}, se garde ≈ ${S.durationText(item.days)}</small></span>
          <div class="stepper small">
            <button data-action="minus" data-name="${item.name}" aria-label="Un ${item.name} de moins">−</button>
            <output>${count}</output>
            <button data-action="plus" data-name="${item.name}" aria-label="Un ${item.name} de plus">+</button>
          </div>
        </div>
        <div class="produce-extra">
          <input data-field="weight" data-name="${item.name}" value="${entry.weight}" placeholder="Poids total" autocomplete="off" enterkeyhint="next" aria-label="Poids total de ${item.name}, par exemple 1,2 kg">
          <label class="produce-price"><input data-field="price" data-name="${item.name}" value="${entry.priceText}" inputmode="decimal" placeholder="Prix payé" autocomplete="off" enterkeyhint="done" aria-label="Prix payé pour ${item.name}, en euros"><b aria-hidden="true">€</b></label>
        </div>
        <p class="hint produce-hint" data-hint="${item.name}" ${hint ? '' : raw('hidden')}>${hint}</p>
      </div>`;
  });
}

/** Saisie dans une ligne : sans tout redessiner (le clavier d'iOS se fermerait). */
export function onSelectionInput(entry, field, value, panel) {
  if (field === 'weight') entry.weight = value;
  if (field === 'price') {
    entry.priceText = value;
    entry.priceTouched = true;
    entry.suggested = false;
  }
  const element = [...panel.querySelectorAll('[data-hint]')].find((e) => e.dataset.hint === entry.item.name);
  if (!element) return;
  const hint = lineHint(entry);
  element.textContent = hint;
  element.hidden = !hint;
}

/** Première saisie illisible, ou '' si tout va bien. */
export function selectionError(entries) {
  for (const entry of entries) {
    if (entry.priceText.trim() && S.parsePrice(entry.priceText) === null) {
      return `Prix illisible pour ${entry.item.name} : écrivez par exemple 3,58 (ou laissez vide).`;
    }
    if (S.weightPerPiece(entry.weight, entry.count) === null) {
      return `Poids illisible pour ${entry.item.name} : écrivez par exemple 1,2 kg ou 800 g (ou laissez vide).`;
    }
  }
  return '';
}

/** Produit à enregistrer : poids et prix ramenés à une pièce. */
export function toProduct(entry) {
  const { item, count } = entry;
  const price = S.parsePrice(entry.priceText);
  return {
    id: crypto.randomUUID(),
    name: item.name,
    category: item.type ?? S.guessCategory(item.name) ?? 'legumes',
    quantity: S.weightPerPiece(entry.weight, count) ?? '',
    count,
    location: item.place,
    dateKind: 'estimee',
    expiry: S.isoInDays(item.days),
    frozenAt: '',
    unitPrice: price === null ? null : S.cleanPrice(price / count)
  };
}
