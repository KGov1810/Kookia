// Kookia — Scanner de code-barres : ouverture, boutons et fermeture.

import { pickImage } from '../../components/platform.js';
import * as S from '../../services/index.js';
import { begin, stopCamera } from './scanner-camera.js';
import { createScannerOverlay, say, showActions } from './scanner-overlay.js';

/**
 * Plein écran caméra. L'app gère la caméra elle-même et surveille l'image :
 * si la vidéo ne démarre pas ou reste noire, elle le dit et propose des solutions
 * (toucher pour démarrer, réessayer, photographier le code, taper les chiffres).
 */
export function openScanner(onCode) {
  const sc = createScannerOverlay(onCode);
  document.body.append(sc.overlay);
  document.body.classList.add('scanning');
  // iOS coupe la caméra quand l'app passe en arrière-plan : on la relance au retour.
  sc.onVisibility = () => onVisibility(sc);
  document.addEventListener('visibilitychange', sc.onVisibility);

  sc.overlay.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'close') finish(sc, null);
    if (action === 'retry') begin(sc);
    if (action === 'start-video') {
      // Lancée dans le geste de l'utilisateur, la vidéo est toujours acceptée par iOS.
      sc.video.play().then(() => {
        showActions(sc, false, false);
        say(sc, 'Placez le code-barres dans le cadre');
      }).catch(() => {
        say(sc, 'La caméra ne démarre pas. Touchez « Réessayer » ou tapez les chiffres.');
        showActions(sc, false, true);
      });
    }
    if (action === 'photo') {
      stopCamera(sc); // libère la caméra pour l'appareil photo d'iOS
      pickImage({ camera: true }).then(async (file) => {
        if (!file) {
          say(sc, 'Photo annulée. Touchez « Réessayer » pour relancer la caméra, ou tapez les chiffres.');
          showActions(sc, false, true);
          return;
        }
        say(sc, 'Lecture du code-barres…');
        const code = await S.decodeBarcodeFromImage(file).catch(() => null);
        if (code) finish(sc, code);
        else {
          say(sc, 'Code-barres illisible sur la photo. Tapez les chiffres, ou touchez « Réessayer ».');
          showActions(sc, false, true);
        }
      });
    }
  });

  sc.overlay.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const digits = event.target.querySelector('input').value.replace(/\D/g, '');
    if (digits.length >= 8) finish(sc, digits);
    else say(sc, 'Un code-barres compte 8 ou 13 chiffres.');
  });

  begin(sc);
}

/** Ferme le scanner ; transmet le code lu (ou rien si l'utilisateur annule). */
export function finish(sc, code) {
  if (sc.finished) return;
  sc.finished = true;
  stopCamera(sc);
  document.removeEventListener('visibilitychange', sc.onVisibility);
  document.body.classList.remove('scanning');
  sc.overlay.remove();
  if (code) sc.onCode(code);
}

/** Caméra coupée en arrière-plan, relancée au retour. */
export function onVisibility(sc) {
  if (sc.finished) return;
  if (document.visibilityState === 'hidden') stopCamera(sc);
  else begin(sc);
}
