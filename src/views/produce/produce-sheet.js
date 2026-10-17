// Kookia — Fruits et légumes sans code-barres.

import { fmt, html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { openSheet } from '../../components/sheet.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';
import { t } from '../../services/i18n/i18n.js';
import { simplify } from '../../services/text/text.js';
import { newEntry, onSelectionInput, selectionError, selectionLines, setEntryUnit, suggestLinePrice, toProduct } from './produce-selection.js';

/** Grille de fruits et légumes courants : chaque toucher ajoute 1 ; lieu et date estimée automatiques, poids et prix facultatifs. */
export function openProduceSheet() {
  const picked = new Map(); // nom → { item, count, weight, priceText… }
  let query = '';
  let error = '';
  const setCount = (entry, count) => {
    entry.count = Math.max(0, Math.min(99, count));
    if (entry.count <= 0) picked.delete(entry.item.name);
    else suggestLinePrice(entry);
    sheet.update();
  };

  const sheet = openSheet({
    tall: true,
    render,
    actions: {
      add: (el) => {
        const item = R.PRODUCE.find((x) => x.name === el.dataset.name)
          ?? { name: el.dataset.name, emoji: '🥬', place: 'fruits', days: S.estimateFreshDays(el.dataset.name, 'fruits') };
        const entry = picked.get(item.name) ?? newEntry(item);
        picked.set(item.name, entry);
        setCount(entry, entry.count + 1);
      },
      minus: (el) => {
        const entry = picked.get(el.dataset.name);
        if (entry) setCount(entry, entry.count - 1);
      },
      plus: (el) => {
        const entry = picked.get(el.dataset.name);
        if (entry) setCount(entry, entry.count + 1);
      },
      'set-unit': (el) => {
        const entry = picked.get(el.dataset.name);
        if (entry) setEntryUnit(entry, el.dataset.unit, sheet.panel);
      },
      confirm: () => {
        const entries = [...picked.values()];
        if (!entries.length) return;
        error = selectionError(entries);
        if (error) {
          sheet.update();
          return;
        }
        entries.forEach((entry) => store.saveProduct(toProduct(entry)));
        sheet.close();
        toast(t('produce.added', { n: entries.length }));
      }
    },
    onInput: (event) => {
      const field = event.target.dataset.field;
      if (field && event.type === 'input') {
        const entry = picked.get(event.target.dataset.name);
        if (entry) onSelectionInput(entry, field, event.target.value, sheet.panel);
        return;
      }
      if (event.target.name !== 'produce-search') return;
      query = event.target.value;
      const results = sheet.panel.querySelector('#produce-results');
      if (results) results.innerHTML = fmt(grid());
    }
  });

  function grid() {
    const q = simplify(query.trim());
    const names = (x) => [simplify(x.name), simplify(S.produceName(x.name))]; // français ou langue de l'iPhone
    const items = R.PRODUCE.filter((x) => !q || names(x).some((n) => n.includes(q)));
    const custom = q && !R.PRODUCE.some((x) => names(x).includes(q))
      ? html`<button class="produce-chip custom" data-action="add" data-name="${query.trim()}">${I.plus}${t('produce.addCustom', { name: query.trim() })}</button>` : '';
    return html`${items.map((x) => {
      const name = S.produceName(x.name);
      return html`<button class="produce-chip" data-action="add" data-name="${x.name}" aria-label="${t('produce.addItem', { name })}"><span aria-hidden="true">${x.emoji}</span>${name}${picked.get(x.name) ? html`<b>${picked.get(x.name).count}</b>` : ''}</button>`;
    })}${custom}`;
  }

  function render() {
    const entries = [...picked.values()];
    const total = entries.length;
    return html`
      <header class="sheet-head">
        <button class="link" data-action="close">${t('common.cancel')}</button>
        <h2>${t('produce.title')}</h2>
        <button class="link strong" data-action="confirm" ${total ? '' : raw('disabled')}>${t('editor.add')}</button>
      </header>
      <div class="sheet-body">
        ${error ? html`<p class="note warn">${error}</p>` : ''}
        ${total ? html`
          <section class="group">
            <h2>${t('produce.selection')}</h2>
            <p class="hint inset">${t('produce.weightHint')}</p>
            ${selectionLines(entries)}
          </section>
          <button class="primary" data-action="confirm">${I.check}${t('produce.addN', { n: total })}</button>` : html`
          <p class="hint">${t('produce.tapHint')}</p>`}
        <label class="search produce-search">${I.search}<input name="produce-search" type="search" placeholder="${t('produce.search')}" value="${query}" autocomplete="off" aria-label="${t('produce.searchAria')}"></label>
        <div class="produce-grid" id="produce-results">${grid()}</div>
      </div>`;
  }
}
