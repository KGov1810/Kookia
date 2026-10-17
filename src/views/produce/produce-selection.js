// Kookia — Fruits et légumes : lignes de la sélection (nombre, poids total, prix payé).
// Le poids et le prix tapés valent pour toute la ligne ; ils sont enregistrés par pièce.

import { html, raw } from '../../components/html.js';
import { unitInput } from '../../components/unit-input.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { t } from '../../services/i18n/i18n.js';
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
  const last = store.lastKnownPrice({ name: S.produceName(entry.item.name) });
  entry.priceText = last === null ? '' : S.priceInputValue(last * entry.count);
  entry.suggested = last !== null;
}

/** Ligne d'aide : poids et prix par pièce, origine du prix, ou saisie illisible. */
export function lineHint(entry) {
  const parts = [];
  const weight = weightText(entry);
  if (weight === null) parts.push(t('produce.badWeight'));
  else if (weight && entry.count > 1) parts.push(t('produce.totalWeight', { total: S.formatWeight(S.parseWeight(weight)), each: S.weightPerPiece(weight, entry.count) }));
  const price = S.parsePrice(entry.priceText);
  if (entry.priceText.trim() && price === null) parts.push(t('produce.badPrice'));
  else if (price !== null && entry.count > 1) parts.push(t('produce.each', { price: S.formatEuro(price / entry.count) }));
  if (entry.suggested && price !== null) parts.push(t('produce.lastPrice'));
  return S.capitalize(parts.join(' · '));
}

export function selectionLines(entries) {
  return entries.map((entry) => {
    const { item, count } = entry;
    const name = S.produceName(item.name);
    const hint = lineHint(entry);
    return html`
      <div class="produce-line">
        <div class="field"><span class="label-stack">${item.emoji} ${name}<small>${t('produce.keeps', { place: S.placeName(item.place), duration: S.durationText(item.days) })}</small></span>
          <div class="stepper small">
            <button data-action="minus" data-name="${item.name}" aria-label="${t('produce.less', { name })}">−</button>
            <output>${count}</output>
            <button data-action="plus" data-name="${item.name}" aria-label="${t('produce.more', { name })}">+</button>
          </div>
        </div>
        <div class="produce-extra">
          ${unitInput({ amount: entry.weight, unit: entry.unit, units: S.PRODUCE_UNITS, dataset: { name: item.name }, inputData: { field: 'weight' },
            label: t('produce.weightAria', { name }), placeholder: t('produce.weight') })}
          <label class="produce-price"><input data-field="price" data-name="${item.name}" value="${entry.priceText}" inputmode="decimal" placeholder="${t('produce.price')}" autocomplete="off" enterkeyhint="done" aria-label="${t('produce.priceAria', { name })}"><b aria-hidden="true">€</b></label>
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
      return t('produce.badPriceFor', { name: S.produceName(entry.item.name) });
    }
    if (weightText(entry) === null) {
      return t('produce.badWeightFor', { name: S.produceName(entry.item.name) });
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
  const name = S.produceName(item.name); // enregistré dans la langue de l'iPhone ; la catégorie se devine du nom français
  const price = S.parsePrice(entry.priceText);
  const memo = store.rememberedPlacement({ name });
  const location = memo.location ?? item.place;
  const category = memo.category ?? item.type ?? S.guessCategory(item.name) ?? 'legumes';
  return {
    id: crypto.randomUUID(),
    name,
    category,
    quantity: S.weightPerPiece(weightText(entry) ?? '', count) ?? '',
    count,
    location,
    ...dates(location, category, item.days),
    unitPrice: price === null ? null : S.cleanPrice(price / count)
  };
}
