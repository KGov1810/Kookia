// Kookia — Scanner : écran plein (vidéo, cadre, messages, saisie des chiffres).

import { fmt, html } from '../../components/html.js';
import { t } from '../../services/i18n/i18n.js';

/** Crée l'écran du scanner et renvoie ses éléments, avec l'état de la caméra (rafale : options.continuous). */
export function createScannerOverlay(onCode, { continuous = false, tray = () => '', doneLabel = () => '', onDone = null, actions = {} } = {}) {
  const overlay = document.createElement('div');
  overlay.className = `scanner${continuous ? ' continuous' : ''}`;
  overlay.innerHTML = fmt(html`
    <video playsinline muted autoplay></video>
    <div class="scan-frame" aria-hidden="true"></div>
    <div class="scan-top"><button data-action="close">${t(continuous ? 'multi.close' : 'common.cancel')}</button></div>
    <div class="scan-bottom">
      ${continuous ? html`<div class="scan-tray" aria-live="polite"></div>` : ''}
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
      ${continuous ? html`<button class="scan-done" data-action="done" hidden></button>` : ''}
    </div>`);

  const video = overlay.querySelector('video');
  const hint = overlay.querySelector('.scan-hint');
  const actionsBox = overlay.querySelector('.scan-actions');
  const startButton = overlay.querySelector('.scan-start');
  const canvas = document.createElement('canvas');
  return {
    onCode, overlay, video, hint, actions: actionsBox, startButton, canvas,
    continuous, renderTray: tray, doneLabel, onDone, trayActions: actions, seen: new Map(),
    tray: overlay.querySelector('.scan-tray'), doneButton: overlay.querySelector('.scan-done'),
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
