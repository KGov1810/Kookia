// Kookia — Photo, copie, partage, mode écran d'accueil.

import { toast } from './toast.js';

export function pickImage({ camera = false } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (camera) input.setAttribute('capture', 'environment');
    input.hidden = true;
    const done = (file) => {
      resolve(file);
      input.remove();
    };
    input.addEventListener('change', () => done(input.files?.[0] ?? null), { once: true });
    input.addEventListener('cancel', () => done(null), { once: true });
    document.body.append(input);
    input.click();
  });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast('Copié');
  } catch {
    toast('Copie impossible : sélectionnez le texte et copiez-le à la main.');
  }
}

export async function shareText(text, title) {
  if (navigator.share) {
    try {
      await navigator.share(title ? { title, text } : { text });
      return;
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
  }
  await copyText(text);
}

export function isStandalone() {
  return window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches === true;
}
