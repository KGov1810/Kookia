// Kookia — Fruits et légumes : lignes de la sélection (nombre, poids total, prix payé).
// Le poids et le prix tapés valent pour toute la ligne ; ils sont enregistrés par pièce.

import { html, raw } from '../../components/html.js';
import { unitInput } from '../../components/unit-input.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';

export function newEntry(item) {
  return { item, count: 0, weight: '', unit: 'kg', priceText: '', priceTouched: false, suggested: false };
}

/** Poids total tapé, avec son unité (« 1,2 kg ») ; '' si vide ; null si le chiffre est illisible. */
function weightText(entry) {
  return S.joinAmount(entry.weight, entry.unit);
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
  const weight = weightText(entry);
  if (weight === null) parts.push('poids illisible : tapez un nombre, par exemple 1,2');
  else if (weight && entry.count > 1) parts.push(`${S.formatWeight(S.parseWeight(weight))} au total, ≈ ${S.weightPerPiece(weight, entry.count)} pièce`);
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
          ${unitInput({ amount: entry.weight, unit: entry.unit, units: S.PRODUCE_UNITS, dataset: { name: item.name }, inputData: { field: 'weight' },
            label: `Poids total de ${item.name} (chiffre)`, placeholder: 'Poids total' })}
          <label class="produce-price"><input data-field="price" data-name="${item.name}" value="${entry.priceText}" inputmode="decimal" placeholder="Prix payé" autocomplete="off" enterkeyhint="done" aria-label="Prix payé pour ${item.name}, en euros"><b aria-hidden="true">€</b></label>
        </div>
        <p class="hint produce-hint" data-hint="${item.name}" ${hint ? '' : raw('hidden')}>${hint}</p>
      </div>`;
  });
}

function refreshHint(entry, panel) {
  const element = [...panel.querySelectorAll('[data-hint]')].find((e) => e.dataset.hint === entry.item.name);
  if (!element) return;
  const hint = lineHint(entry);
  element.textContent = hint;
  element.hidden = !hint;
}

/** Saisie dans une ligne : sans tout redessiner (le clavier d'iOS se fermerait). */
export function onSelectionInput(entry, field, value, panel) {
  if (field === 'weight') entry.weight = value;
  if (field === 'price') {
    entry.priceText = value;
    entry.priceTouched = true;
    entry.suggested = false;
  }
  refreshHint(entry, panel);
}

/** Bouton g | kg d'une ligne. */
export function setEntryUnit(entry, unit, panel) {
  entry.unit = unit;
  panel.querySelectorAll('[data-action="set-unit"]').forEach((b) => {
    if (b.dataset.name === entry.item.name) b.setAttribute('aria-pressed', String(b.dataset.unit === unit));
  });
  refreshHint(entry, panel);
}

/** Première saisie illisible, ou '' si tout va bien. */
export function selectionError(entries) {
  for (const entry of entries) {
    if (entry.priceText.trim() && S.parsePrice(entry.priceText) === null) {
      return `Prix illisible pour ${entry.item.name} : écrivez par exemple 3,58 (ou laissez vide).`;
    }
    if (weightText(entry) === null) {
      return `Poids illisible pour ${entry.item.name} : tapez un nombre, par exemple 1,2 (ou laissez vide).`;
    }
  }
  return '';
}

/** Date selon le lieu : estimée d'ordinaire ; congelée ou sans date si le rangement retenu l'impose. */
function dates(location, category, days) {
  const kinds = R.KINDS_BY_LOCATION[location] ?? ['estimee'];
  if (kinds.includes('estimee')) return { dateKind: 'estimee', expiry: S.isoInDays(days), frozenAt: '' };
  if (kinds[0] === 'congele') {
    const frozenAt = S.isoInDays(0);
    return { dateKind: 'congele', frozenAt, expiry: S.freezerLimit(category, frozenAt) };
  }
  return { dateKind: kinds[0], expiry: '', frozenAt: '' };
}

/** Produit à enregistrer : poids et prix ramenés à une pièce, rangement corrigé auparavant s'il existe. */
export function toProduct(entry) {
  const { item, count } = entry;
  const price = S.parsePrice(entry.priceText);
  const memo = store.rememberedPlacement({ name: item.name });
  const location = memo.location ?? item.place;
  const category = memo.category ?? item.type ?? S.guessCategory(item.name) ?? 'legumes';
  return {
    id: crypto.randomUUID(),
    name: item.name,
    category,
    quantity: S.weightPerPiece(weightText(entry) ?? '', count) ?? '',
    count,
    location,
    ...dates(location, category, item.days),
    unitPrice: price === null ? null : S.cleanPrice(price / count)
  };
}
