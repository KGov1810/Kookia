// Kookia — Message éphémère avec « Annuler » facultatif.

import { fmt, html } from './html.js';

let toastTimer = null;

export function toast(message, actionLabel = null, onAction = null) {
  const element = document.getElementById('toast');
  if (!element) return;
  element.innerHTML = fmt(html`<span>${message}</span>${actionLabel ? html`<button type="button">${actionLabel}</button>` : ''}`);
  element.hidden = false;
  show(element, true);
  clearTimeout(toastTimer);
  const button = element.querySelector('button');
  if (button) {
    button.addEventListener('click', () => {
      show(element, false);
      onAction?.();
    }, { once: true });
  }
  toastTimer = setTimeout(() => show(element, false), actionLabel ? 5000 : 2600);
}

/** Le message glisse depuis le bas et repart par le bas (voir toast.css). */
function show(element, visible) {
  element.dataset.show = String(visible);
  element.setAttribute('aria-hidden', String(!visible));
}
