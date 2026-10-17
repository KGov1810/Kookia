// Kookia — Chargement à la demande des bibliothèques externes.

import { t } from '../i18n/i18n.js';

export const ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.2.1/umd/zxing-browser.min.js';

export const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';

const loadedScripts = new Map();

export function loadScript(src) {
  if (!loadedScripts.has(src)) {
    loadedScripts.set(src, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        loadedScripts.delete(src);
        reject(new Error(t('device.noLibrary')));
      };
      document.head.append(script);
    }));
  }
  return loadedScripts.get(src);
}
