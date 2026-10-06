// Kookia — Message éphémère avec « Annuler » facultatif.

import { fmt, html } from './html.js';

let toastTimer = null;

export function toast(message, actionLabel = null, onAction = null) {
  const element = document.getElementById('toast');
  if (!element) return;
  element.innerHTML = fmt(html`<span>${message}</span>${actionLabel ? html`<button type="button">${actionLabel}</button>` : ''}`);
  element.hidden = false;
  clearTimeout(toastTimer);
  const button = element.querySelector('button');
  if (button) {
    button.addEventListener('click', () => {
      element.hidden = true;
      onAction?.();
    }, { once: true });
  }
  toastTimer = setTimeout(() => { element.hidden = true; }, actionLabel ? 5000 : 2600);
}
