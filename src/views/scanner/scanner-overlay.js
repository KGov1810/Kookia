// Kookia — Scanner : écran plein (vidéo, cadre, messages, saisie des chiffres).

import { fmt, html } from '../../components/html.js';
import { t } from '../../services/i18n/i18n.js';

/** Crée l'écran du scanner et renvoie ses éléments, avec l'état de la caméra. */
export function createScannerOverlay(onCode) {
  const overlay = document.createElement('div');
  overlay.className = 'scanner';
  overlay.innerHTML = fmt(html`
    <video playsinline muted autoplay></video>
    <div class="scan-frame" aria-hidden="true"></div>
    <div class="scan-top"><button data-action="close">${t('common.cancel')}</button></div>
    <div class="scan-bottom">
      <p class="scan-hint" role="status">${t('scan.opening')}</p>
      <div class="scan-actions" hidden>
        <button class="scan-start" data-action="start-video">${t('scan.start')}</button>
        <button class="scan-retry" data-action="retry">${t('scan.retry')}</button>
      </div>
      <form class="scan-manual">
        <input inputmode="numeric" pattern="[0-9]*" placeholder="${t('scan.typeDigits')}" autocomplete="off" aria-label="${t('scan.digits')}">
        <button type="submit">${t('common.ok')}</button>
      </form>
      <button class="scan-photo" data-action="photo">${t('scan.photo')}</button>
    </div>`);

  const video = overlay.querySelector('video');
  const hint = overlay.querySelector('.scan-hint');
  const actions = overlay.querySelector('.scan-actions');
  const startButton = overlay.querySelector('.scan-start');
  const canvas = document.createElement('canvas');
  return {
    onCode, overlay, video, hint, actions, startButton, canvas,
    context: canvas.getContext('2d', { willReadFrequently: true }),
    camera: null, decode: null, loopTimer: null, watchdog: null, finished: false, session: 0, darkFrames: 0
  };
}

/** Message affiché sous le cadre. */
export function say(sc, text) {
  sc.hint.textContent = text;
}

/** Affiche les boutons « Démarrer la caméra » et/ou « Réessayer ». */
export function showActions(sc, start, retry) {
  sc.actions.hidden = !start && !retry;
  sc.startButton.hidden = !start;
  sc.overlay.querySelector('.scan-retry').hidden = !retry;
}
