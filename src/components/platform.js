// Kookia — Photo, copie, partage, mode écran d'accueil.

import { t } from '../services/i18n/i18n.js';
import { toast } from './toast.js';

/** Ouvre le choix de photos de l'iPhone ; renvoie les fichiers choisis (aucun si annulé). */
function pickFiles({ camera = false, multiple = false } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (camera) input.setAttribute('capture', 'environment');
    input.multiple = multiple;
    input.hidden = true;
    const done = (files) => {
      resolve(files);
      input.remove();
    };
    input.addEventListener('change', () => done([...(input.files ?? [])]), { once: true });
    input.addEventListener('cancel', () => done([]), { once: true });
    document.body.append(input);
    input.click();
  });
}

/** Une photo (camera : appareil photo directement), ou null. */
export function pickImage({ camera = false } = {}) {
  return pickFiles({ camera }).then((files) => files[0] ?? null);
}

/** Plusieurs photos d'un coup (sélection multiple dans la photothèque), dans l'ordre choisi. */
export function pickImages() {
  return pickFiles({ multiple: true });
}

export async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    toast(t('common.copied'));
  } catch {
    toast(t('common.copyFailed'));
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
