// Kookia — Scanner : écran plein (vidéo, cadre, messages, saisie des chiffres).

import { fmt, html } from '../../components/html.js';

/** Crée l'écran du scanner et renvoie ses éléments, avec l'état de la caméra. */
export function createScannerOverlay(onCode) {
  const overlay = document.createElement('div');
  overlay.className = 'scanner';
  overlay.innerHTML = fmt(html`
    <video playsinline muted autoplay></video>
    <div class="scan-frame" aria-hidden="true"></div>
    <div class="scan-top"><button data-action="close">Annuler</button></div>
    <div class="scan-bottom">
      <p class="scan-hint" role="status">Ouverture de la caméra…</p>
      <div class="scan-actions" hidden>
        <button class="scan-start" data-action="start-video">Démarrer la caméra</button>
        <button class="scan-retry" data-action="retry">Réessayer</button>
      </div>
      <form class="scan-manual">
        <input inputmode="numeric" pattern="[0-9]*" placeholder="Ou tapez les chiffres" autocomplete="off" aria-label="Chiffres du code-barres">
        <button type="submit">OK</button>
      </form>
      <button class="scan-photo" data-action="photo">Photographier le code-barres</button>
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
