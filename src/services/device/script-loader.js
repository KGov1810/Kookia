// Kookia — Chargement à la demande des bibliothèques externes.

import { t } from '../i18n/i18n.js';

export const ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/browser@0.2.1/umd/zxing-browser.min.js';

export const TESSERACT_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@7.0.0/dist/tesseract.min.js';

// Empreintes (SRI) des fichiers publiés sur npm, vérifiées par le navigateur avant exécution : un fichier modifié
// sur le CDN est refusé (il pourrait sinon lire la clé Claude). Changer de version = recalculer l'empreinte :
// openssl dgst -sha384 -binary fichier.js | openssl base64 -A
export const SCRIPT_INTEGRITY = {
  [ZXING_URL]: 'sha384-HRtzk9lZgkbSgvUyQrnfC/GxiXZgwaNyD7hC9wcXlsBpDhkS80ISl73juef2FRuf',
  [TESSERACT_URL]: 'sha384-2BQ3U3OdKOb0Uczxqr41I9UvZkzr4V9Hv8uSzMMZAlmhsFClvdZX5wi5fDCzG+tM'
};

const loadedScripts = new Map();

export function loadScript(src) {
  if (!loadedScripts.has(src)) {
    loadedScripts.set(src, new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.setAttribute('integrity', SCRIPT_INTEGRITY[src] ?? '');
      script.setAttribute('crossorigin', 'anonymous'); // nécessaire à la vérification de l'empreinte
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
