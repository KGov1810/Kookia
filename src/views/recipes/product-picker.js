// Kookia — Choix des produits à utiliser en priorité.

import { fmt, html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { thumb } from '../../components/product-visuals.js';
import { openSheet } from '../../components/sheet.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { rerenderIf } from '../app/navigation.js';
import { ui } from '../app/ui-state.js';

export function openProductPicker() {
  let query = ''; // recherche : nom ou catégorie, comme dans le Stock
  let place = ''; // lieu : '' (tout), frigo, congelateur, placard, fruits

  const sheet = openSheet({
    tall: true,
    render: () => html`
      <header class="sheet-head">
        <button class="link" data-action="none">${t('picker.none')}</button>
        <h2>${t('picker.title')}</h2>
        <button class="link strong" data-action="close">${t('common.ok')}</button>
      </header>
      <div class="sheet-body">
        <div class="picker-filters">
          <label class="search">${I.search}<input name="picker-search" type="search" placeholder="${t('stock.search')}" value="${query}" autocomplete="off" enterkeyhint="search" aria-label="${t('stock.search')}"></label>
          <div class="chips location-filter" id="picker-places" role="group" aria-label="${t('stock.place')}">${places()}</div>
        </div>
        <div id="picker-list">${list()}</div>
      </div>`,
    actions: {
      toggle: (el) => {
        ui.customPriority = true;
        const id = el.dataset.id;
        if (ui.priority.has(id)) ui.priority.delete(id);
        else ui.priority.add(id);
        refresh();
      },
      none: () => {
        ui.customPriority = true;
        ui.priority.clear();
        refresh();
      },
      'picker-place': (el) => {
        place = el.dataset.value;
        refresh();
      }
    },
    // Sur place, sans redessiner le champ : le clavier reste ouvert pendant la saisie.
    onInput: (event) => {
      if (event.target.name !== 'picker-search') return;
      query = event.target.value;
      refresh();
    },
    onData: () => refresh(),
    onClose: () => rerenderIf('recettes')
  });

  function refresh() {
    const set = (id, markup) => { const el = sheet.panel.querySelector(id); if (el) el.innerHTML = fmt(markup); };
    set('#picker-places', places());
    set('#picker-list', list());
  }

  /** Tout, Frigo, Congélateur, Placard, Fruits & légumes, avec le nombre de produits trouvés. */
  function places() {
    const chips = [{ id: '', label: t('stock.all') }, ...R.LOCATIONS.map((l) => ({ id: l.id, label: S.placeName(l.id) }))];
    return chips.map((loc) => {
      const count = store.productsIn(loc.id).filter((p) => S.matchesSearch(p, query)).length;
      return html`<button class="chip filter-chip" data-action="picker-place" data-value="${loc.id}" aria-pressed="${String(place === loc.id)}">${loc.label}<i>${count}</i></button>`;
    });
  }

  function list() {
    const items = store.productsIn(place).filter((p) => S.matchesSearch(p, query));
    if (!items.length) {
      return html`<p class="hint">${query.trim() ? t('stock.noMatch', { query: query.trim() }) : t('stock.nothingAt', { at: S.placeAt(place) })}</p>`;
    }
    return html`
      <section class="group">
        ${items.map((p) => html`
          <button class="pick" role="checkbox" aria-checked="${String(ui.priority.has(p.id))}" data-action="toggle" data-id="${p.id}">
            <span class="box">${I.check}</span>
            ${thumb(p)}
            <span class="product-text"><span class="product-name">${p.name}</span><span class="product-meta">${S.stockLabel(p)}</span></span>
          </button>`)}
      </section>`;
  }
}
