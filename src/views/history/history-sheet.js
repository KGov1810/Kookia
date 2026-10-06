// Kookia — Écran Historique.

import { html } from '../../components/html.js';
import { openSheet } from '../../components/sheet.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { HISTORY_ICON, historyDay, historySentence } from './history-format.js';

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
    const people = [...new Set(view.entries.map((e) => e.by || "Quelqu'un"))];
    const shown = view.entries.filter((e) => (!view.scope || e.scope === view.scope)
      && (!view.person || (e.by || "Quelqu'un") === view.person));
    const groups = [];
    for (const entry of shown) {
      const label = historyDay(entry.clientAt);
      if (groups.at(-1)?.label !== label) groups.push({ label, entries: [] });
      groups.at(-1).entries.push(entry);
    }
    return html`
      <header class="sheet-head"><span></span><h2>Historique</h2><button class="link strong" data-action="close">Fermer</button></header>
      <div class="sheet-body">
        <div class="segmented history-filter" role="group" aria-label="Type">
          ${[['', 'Tout'], ['stock', 'Stock'], ['courses', 'Courses'], ['recettes', 'Recettes']].map(([value, label]) => html`<button data-action="history-scope" data-value="${value}" aria-pressed="${String(view.scope === value)}">${label}</button>`)}
        </div>
        ${people.length > 1 ? html`<div class="chips history-people" role="group" aria-label="Personne">
          ${[['', 'Tout le monde'], ...people.map((p) => [p, p])].map(([value, label]) => html`<button class="chip filter-chip" data-action="history-person" data-value="${value}" aria-pressed="${String(view.person === value)}">${label}</button>`)}
        </div>` : ''}
        ${state.historyError ? html`<p class="note warn">${state.historyError}</p>` : ''}
        ${!view.loaded ? html`<div class="boot small"><span class="spinner"></span></div>`
          : !shown.length ? html`<p class="hint">${view.entries.length ? 'Aucune action pour ce filtre.' : 'Aucune action notée pour l\'instant. Les prochains ajouts, modifications, consommations et suppressions apparaîtront ici.'}</p>`
          : groups.map((group) => html`
            <h2 class="section">${group.label}</h2>
            <div class="group history-list">
              ${group.entries.map((entry) => html`
                <div class="history-item ${entry.action}">
                  <span class="history-icon" aria-hidden="true">${(HISTORY_ICON[entry.action] ?? HISTORY_ICON.modification)()}</span>
                  <div class="history-text">
                    <p>${historySentence(entry)}</p>
                    ${(entry.details ?? []).filter(Boolean).map((d) => html`<small>${d}</small>`)}
                  </div>
                  <time>${new Date(entry.clientAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</time>
                </div>`)}
            </div>`)}
        ${view.loaded && view.entries.length >= view.limit ? html`<button class="secondary" data-action="history-more">Afficher plus</button>` : ''}
        <p class="hint">Les ${store.HISTORY_DAYS} derniers jours. Cocher ou décocher les courses n'est pas noté.</p>
      </div>`;
  }

  subscribe();
  return sheet;
}
