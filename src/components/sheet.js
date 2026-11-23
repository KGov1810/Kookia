// Kookia — Fiches modales (glissent depuis le bas).

import { fmt } from './html.js';

export const openSheets = new Set();

let sheetCount = 0;
let escapeWired = false;

/** Échap (clavier branché à l'iPhone ou à l'iPad) : ferme la fiche du dessus (pas celle cachée sous le scanner). */
function closeTopSheet(event) {
  if (event.key !== 'Escape' || !openSheets.size || document.body.classList.contains('scanning')) return;
  [...openSheets].at(-1).close();
}

/** Fiche nommée par son titre : VoiceOver annonce « Modifier le produit, boîte de dialogue ». */
function nameAfterTitle(panel) {
  const title = panel.querySelector('h1, h2');
  if (!title) {
    panel.removeAttribute('aria-labelledby');
    return;
  }
  title.id ||= `${panel.id}-title`;
  panel.setAttribute('aria-labelledby', title.id);
}

/** Élément touché pour ouvrir la fiche, pour y revenir à la fermeture (pas un champ : le clavier s'ouvrirait). */
function focusBack(opener) {
  if (opener?.isConnected && !opener.matches('input, textarea, select')) opener.focus({ preventScroll: true });
}

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
  panel.id = `sheet-${++sheetCount}`;
  panel.tabIndex = -1; // reçoit le focus à l'ouverture (VoiceOver, clavier)
  backdrop.append(panel);
  const opener = document.activeElement;

  const sheet = {
    panel,
    isOpen: true,
    onData,
    update() {
      const scroll = panel.querySelector('.sheet-body')?.scrollTop ?? 0;
      const hadFocus = panel.contains(document.activeElement) && document.activeElement !== panel;
      panel.innerHTML = fmt(render());
      nameAfterTitle(panel);
      if (hadFocus && !panel.contains(document.activeElement)) panel.focus({ preventScroll: true }); // bouton redessiné
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
      pushPageBack();
      onClose?.();
      if (!panel.contains(document.activeElement) && document.activeElement !== document.body) return; // focus déjà ailleurs
      focusBack(opener);
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

  if (!escapeWired) {
    document.addEventListener('keydown', closeTopSheet);
    escapeWired = true;
  }
  document.body.append(backdrop);
  sheet.update();
  openSheets.add(sheet);
  pushPageBack();
  requestAnimationFrame(() => requestAnimationFrame(() => {
    backdrop.classList.add('open');
    if (!panel.contains(document.activeElement)) panel.focus({ preventScroll: true });
  }));
  return sheet;
}

/** Fiche ouverte : la page recule un peu derrière (à partir du haut de ce qui est visible). */
function pushPageBack() {
  const open = openSheets.size > 0;
  const page = document.getElementById('screen');
  if (open && page && !document.body.classList.contains('sheet-open')) page.style.transformOrigin = `50% ${window.scrollY}px`;
  document.body.classList.toggle('sheet-open', open);
}
