// Kookia — État de la synchronisation et erreurs.

import * as store from '../data/store/index.js';
import { state } from '../data/store/state.js';
import { html } from './html.js';

export function syncLine() {
  const element = document.getElementById('sync-line');
  if (!element) return;
  element.textContent = store.syncLabel();
  element.dataset.state = state.error ? 'error' : (state.fromCache && state.connected ? 'offline' : '');
}

export function errorNote() {
  return state.error ? html`<p class="note error">${state.error}</p>` : '';
}
