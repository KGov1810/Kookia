// Kookia — Scanner de code-barres : ouverture, boutons et fermeture.

import { fmt } from '../../components/html.js';
import { pickImage } from '../../components/platform.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { begin, stopCamera } from './scanner-camera.js';
import { createScannerOverlay, say, showActions } from './scanner-overlay.js';

const SAME_CODE_MS = 2500; // rafale : le même code relu tant qu'il reste devant la caméra ne compte qu'une fois

/**
 * Plein écran caméra. L'app gère la caméra elle-même et surveille l'image :
 * si la vidéo ne démarre pas ou reste noire, elle le dit et propose des solutions
 * (toucher pour démarrer, réessayer, photographier le code, taper les chiffres).
 * options.continuous : le scanner reste ouvert (plusieurs produits) ; options.tray() : la liste affichée en bas,
 * options.doneLabel() : le bouton « Terminer (N) », options.onDone : à la fermeture, options.actions : boutons de la liste.
 */
export function openScanner(onCode, options = {}) {
  const sc = createScannerOverlay(onCode, options);
  document.body.append(sc.overlay);
  document.body.classList.add('scanning');
  // iOS coupe la caméra quand l'app passe en arrière-plan : on la relance au retour.
  sc.onVisibility = () => onVisibility(sc);
  document.addEventListener('visibilitychange', sc.onVisibility);

  sc.overlay.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    if (action === 'close' || action === 'done') {
      finish(sc, null);
      if (sc.continuous) sc.onDone?.(); // rafale : rien n'est perdu, la vérification suit
    }
    sc.trayActions[action]?.(target); // rafale : « + » sur une ligne de la liste
    if (action === 'retry') begin(sc);
    if (action === 'start-video') {
      // Lancée dans le geste de l'utilisateur, la vidéo est toujours acceptée par iOS.
      sc.video.play().then(() => {
        showActions(sc, false, false);
        say(sc, t('scan.place'));
      }).catch(() => {
        say(sc, t('scan.wontStart'));
        showActions(sc, false, true);
      });
    }
    if (action === 'photo') {
      stopCamera(sc); // libère la caméra pour l'appareil photo d'iOS
      pickImage({ camera: true }).then(async (file) => {
        if (!file) {
          say(sc, t('scan.photoCancelled'));
          showActions(sc, false, true);
          return;
        }
        say(sc, t('scan.reading'));
        const code = await S.decodeBarcodeFromImage(file).catch(() => null);
        if (code) found(sc, code, { manual: true });
        if (code && sc.continuous) begin(sc); // caméra relancée pour le produit suivant
        else if (!code) {
          say(sc, t('scan.unreadable'));
          showActions(sc, false, true);
        }
      });
    }
  });

  sc.overlay.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    const digits = event.target.querySelector('input').value.replace(/\D/g, '');
    if (digits.length >= 8) {
      found(sc, digits, { manual: true });
      event.target.querySelector('input').value = '';
    } else say(sc, t('scan.length'));
  });

  begin(sc);
  refreshTray(sc);
  return sc;
}

/** Code lu : un seul produit, le scanner se ferme ; en rafale, il s'ajoute à la liste et le scanner reste ouvert. */
export function found(sc, code, { manual = false } = {}) {
  if (!sc.continuous) {
    finish(sc, code);
    return;
  }
  const now = Date.now();
  const last = sc.seen.get(code);
  sc.seen.set(code, now);
  if (!manual && last && now - last < SAME_CODE_MS) return;
  sc.onCode(code);
}

/** Rafale : redessine la liste du bas et le bouton « Terminer (N) ». */
export function refreshTray(sc) {
  if (!sc.continuous || sc.finished) return;
  sc.tray.innerHTML = fmt(sc.renderTray());
  const label = sc.doneLabel();
  sc.doneButton.hidden = !label;
  sc.doneButton.textContent = label;
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
