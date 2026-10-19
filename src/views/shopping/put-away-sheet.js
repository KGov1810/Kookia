// Kookia — Courses : « Tout ranger » — les articles du panier passent au stock d'un coup, après un coup d'œil.
// Catégorie et rangement : ceux retenus pour ce produit, sinon devinés d'après le nom. Dernier prix payé repris.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { openSheet } from '../../components/sheet.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { showTab } from '../app/router.js';

/** Ce que « Tout ranger » propose pour un article : catégorie, lieu habituel, dernier prix. */
export function proposal(item) {
  const { name, quantity, count } = S.fromShoppingEntry(item);
  const memo = store.rememberedPlacement({ name });
  const category = memo.category ?? S.guessCategory(name) ?? 'autre';
  const location = memo.location ?? S.defaultLocationFor(category, name, 'frigo') ?? 'frigo';
  return { shoppingId: item.id, name, quantity, count, category, location, unitPrice: store.lastKnownPrice({ name }), selected: true, locationTouched: false };
}

function line(item, index) {
  const details = [item.quantity, item.unitPrice !== null ? t('away.unit', { price: S.formatEuro(item.unitPrice) }) : ''].filter(Boolean).join(' · ');
  return html`
    <div class="receipt-line put-away-line ${item.selected ? '' : 'off'}">
      <button class="pick-box" role="checkbox" aria-checked="${String(item.selected)}" data-action="toggle-line" data-index="${index}" aria-label="${t('away.line', { name: item.name })}"><span class="box">${I.check}</span></button>
      <span class="thumb">${R.category(item.category).emoji}</span>
      <div class="receipt-fields">
        <span class="put-away-name">${item.count > 1 ? html`<b>${item.count} ×</b> ` : ''}${item.name}</span>
        ${details ? html`<small>${details}</small>` : ''}
        <select class="receipt-location" data-index="${index}" aria-label="${t('away.place', { name: item.name })}">
          ${R.LOCATIONS.map((loc) => html`<option value="${loc.id}" ${item.location === loc.id ? raw('selected') : ''}>${S.placeName(loc.id)}</option>`)}
        </select>
      </div>
    </div>`;
}

/** Fiche de vérification des articles cochés, puis ajout au stock et retrait de la liste. */
export function openPutAway() {
  const items = state.shopping.filter((i) => i.checked && i.name).sort((a, b) => a.name.localeCompare(b.name, S.localeTag())).map(proposal);
  if (!items.length) return null;
  const kept = () => items.filter((i) => i.selected);
  // Viande, poisson, charcuterie, traiteur au frigo : date à compléter (les autres produits du frigo sont estimés).
  const fridge = () => kept().filter((i) => i.location === 'frigo' && S.manualDate(i.category)).length;
  const sheet = openSheet({
    tall: true,
    render: () => html`
      <header class="sheet-head">
        <button class="link" data-action="close">${t('common.cancel')}</button>
        <h2>${t('away.title')}</h2>
        <button class="link strong" data-action="confirm" ${kept().length ? '' : raw('disabled')}>${t('away.confirm')}</button>
      </header>
      <div class="sheet-body">
        <p class="hint">${t('away.hint')}</p>
        <section class="group">${items.map(line)}</section>
        ${fridge() ? html`<p class="hint">${t('away.fridgeHint')}</p>` : ''}
        <button class="primary" data-action="confirm" ${kept().length ? '' : raw('disabled')}>${I.check}${t('away.putN', { n: kept().length })}</button>
      </div>`,
    actions: {
      'toggle-line': (el) => {
        const item = items[Number(el.dataset.index)];
        item.selected = !item.selected;
        sheet.update();
      },
      confirm: () => {
        const chosen = kept();
        if (!chosen.length) return;
        const added = store.addReceiptProducts(chosen, chosen.map((i) => i.shoppingId), { source: 'courses' });
        chosen.filter((i) => i.locationTouched).forEach((i) => store.rememberPlacement(i, { location: i.location }));
        sheet.close();
        if (!added) return;
        toast(`${t('away.done', { n: added })}${fridge() ? t('away.datesToFill') : ''}`);
        showTab('frigo');
      }
    },
    onInput: (event) => {
      const item = items[Number(event.target.dataset.index)];
      if (!item || event.type !== 'change') return;
      item.location = event.target.value;
      item.locationTouched = true; // retenu pour la prochaine fois
      sheet.update();
    }
  });
  return sheet;
}
