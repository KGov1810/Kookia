// Kookia — Fiches modales (glissent depuis le bas).

import { fmt } from './html.js';

export const openSheets = new Set();

/**
 * render : () => Html ; actions : { nom: (élément, événement) => void }
 * onInput : écouteur input/change ; onData : appelé quand les données partagées changent.
 */
export function openSheet({ render, actions = {}, onInput = null, onData = null, onClose = null, tall = false }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  const panel = document.createElement('div');
  panel.className = `sheet${tall ? ' tall' : ''}`;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  backdrop.append(panel);

  const sheet = {
    panel,
    isOpen: true,
    onData,
    update() {
      const scroll = panel.querySelector('.sheet-body')?.scrollTop ?? 0;
      panel.innerHTML = fmt(render());
      const body = panel.querySelector('.sheet-body');
      if (body) body.scrollTop = scroll;
    },
    close() {
      if (!sheet.isOpen) return;
      sheet.isOpen = false;
      openSheets.delete(sheet);
      backdrop.classList.remove('open');
      backdrop.classList.add('closing');
      setTimeout(() => backdrop.remove(), 300);
      onClose?.();
    }
  };

  panel.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target || !panel.contains(target)) return;
    const name = target.dataset.action;
    const handler = actions[name] ?? (name === 'close' ? () => sheet.close() : null);
    if (!handler) return;
    event.preventDefault();
    handler(target, event);
  });
  if (onInput) {
    panel.addEventListener('input', onInput);
    panel.addEventListener('change', onInput);
  }
  backdrop.addEventListener('click', (event) => {
    if (event.target === backdrop) sheet.close();
  });

  document.body.append(backdrop);
  sheet.update();
  openSheets.add(sheet);
  requestAnimationFrame(() => requestAnimationFrame(() => backdrop.classList.add('open')));
  return sheet;
}
