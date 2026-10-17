// Kookia — Écran Historique.

import { html } from '../../components/html.js';
import { openSheet } from '../../components/sheet.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { HISTORY_ICON, historyDay, historyDetails, historySentence } from './history-format.js';

export function openHistory() {
  const view = { entries: [], loaded: false, limit: 100, scope: '', person: '' };
  let stop = () => {};
  const subscribe = () => {
    stop();
    stop = store.listenHistory(view.limit, (entries) => {
      view.entries = entries;
      view.loaded = true;
      if (sheet.isOpen) sheet.update();
    });
  };

  const sheet = openSheet({
    tall: true,
    render,
    actions: {
      'history-scope': (el) => {
        view.scope = el.dataset.value;
        sheet.update();
      },
      'history-person': (el) => {
        view.person = el.dataset.value;
        sheet.update();
      },
      'history-more': () => {
        view.limit += 100;
        subscribe();
      }
    },
    onClose: () => stop()
  });

  function render() {
    const someone = t('hist.someone');
    const people = [...new Set(view.entries.map((e) => e.by || someone))];
    const shown = view.entries.filter((e) => (!view.scope || e.scope === view.scope)
      && (!view.person || (e.by || someone) === view.person));
    const groups = [];
    for (const entry of shown) {
      const label = historyDay(entry.clientAt);
      if (groups.at(-1)?.label !== label) groups.push({ label, entries: [] });
      groups.at(-1).entries.push(entry);
    }
    return html`
      <header class="sheet-head"><span></span><h2>${t('hist.title')}</h2><button class="link strong" data-action="close">${t('common.close')}</button></header>
      <div class="sheet-body">
        <div class="segmented history-filter" role="group" aria-label="${t('hist.type')}">
          ${[['', t('hist.all')], ['stock', t('tab.stock')], ['courses', t('tab.shopping')], ['recettes', t('tab.recipes')]].map(([value, label]) => html`<button data-action="history-scope" data-value="${value}" aria-pressed="${String(view.scope === value)}">${label}</button>`)}
        </div>
        ${people.length > 1 ? html`<div class="chips history-people" role="group" aria-label="${t('sfilter.person')}">
          ${[['', t('sfilter.everyone')], ...people.map((p) => [p, p])].map(([value, label]) => html`<button class="chip filter-chip" data-action="history-person" data-value="${value}" aria-pressed="${String(view.person === value)}">${label}</button>`)}
        </div>` : ''}
        ${state.historyError ? html`<p class="note warn">${state.historyError}</p>` : ''}
        ${!view.loaded ? html`<div class="boot small"><span class="spinner"></span></div>`
          : !shown.length ? html`<p class="hint">${t(view.entries.length ? 'hist.noMatch' : 'hist.empty')}</p>`
          : groups.map((group) => html`
            <h2 class="section">${group.label}</h2>
            <div class="group history-list">
              ${group.entries.map((entry) => html`
                <div class="history-item ${entry.action}">
                  <span class="history-icon" aria-hidden="true">${(HISTORY_ICON[entry.action] ?? HISTORY_ICON.modification)()}</span>
                  <div class="history-text">
                    <p>${historySentence(entry)}</p>
                    ${historyDetails(entry).map((d) => html`<small>${d}</small>`)}
                  </div>
                  <time>${new Date(entry.clientAt).toLocaleTimeString(S.localeTag(), { hour: '2-digit', minute: '2-digit' })}</time>
                </div>`)}
            </div>`)}
        ${view.loaded && view.entries.length >= view.limit ? html`<button class="secondary" data-action="history-more">${t('hist.more')}</button>` : ''}
        <p class="hint">${t('hist.footer', { n: store.HISTORY_DAYS })}</p>
      </div>`;
  }

  subscribe();
  return sheet;
}
