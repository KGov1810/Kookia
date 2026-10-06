// Kookia — Scanner : caméra, analyse de l'image et surveillance (image absente ou noire).

import * as S from '../../services/index.js';
import { say, showActions } from './scanner-overlay.js';
import { finish } from './scanner.js';

/** Coupe la caméra et invalide la session en cours (analyse, surveillance). */
export function stopCamera(sc) {
  sc.session += 1;
  clearTimeout(sc.loopTimer);
  clearTimeout(sc.watchdog);
  sc.camera?.stop();
  sc.camera = null;
}

/** Vrai si la vidéo affiche réellement une image. */
export function isShowingImage(sc) {
  return sc.video.readyState >= 2 && sc.video.videoWidth > 0 && !sc.video.paused;
}

/** Ouvre la caméra, surveille l'image et lance l'analyse. */
export async function begin(sc) {
  stopCamera(sc);
  const current = sc.session;
  showActions(sc, false, false);
  say(sc, 'Ouverture de la caméra…');
  try {
    const opened = await S.startCamera(sc.video);
    if (current !== sc.session || sc.finished) {
      opened.stop();
      return;
    }
    sc.camera = opened;
  } catch (error) {
    if (current !== sc.session || sc.finished) return;
    if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') {
      say(sc, "Accès à la caméra refusé. Autorisez-le dans Réglages de l'iPhone > Safari > Caméra, puis touchez « Réessayer ». Vous pouvez aussi taper les chiffres.");
    } else {
      say(sc, 'Caméra indisponible. Touchez « Réessayer », photographiez le code-barres ou tapez les chiffres.');
    }
    showActions(sc, false, true);
    return;
  }

  if (!sc.camera.playing) {
    say(sc, 'Touchez « Démarrer la caméra » pour afficher l\'image.');
    showActions(sc, true, false);
  } else {
    say(sc, 'Placez le code-barres dans le cadre');
  }

  // Surveillance : pas d'image au bout de 4 s → on le dit clairement.
  sc.watchdog = setTimeout(() => {
    if (current !== sc.session || sc.finished || isShowingImage(sc)) return;
    say(sc, "La caméra ne s'affiche pas. Touchez « Démarrer la caméra » ; si l'écran reste noir, « Réessayer », ou fermez complètement l'app et rouvrez-la.");
    showActions(sc, true, true);
  }, 4000);

  try {
    sc.decode = sc.decode ?? await S.createBarcodeDecoder();
  } catch {
    if (current === sc.session) {
      say(sc, 'Lecteur de code-barres non téléchargé (connexion ?). Tapez les chiffres sous le code-barres.');
    }
    return;
  }
  scanLoop(sc, current);
}

/** Analyse la bande centrale de l'image environ 6 fois par seconde. */
export async function scanLoop(sc, current) {
  if (current !== sc.session || sc.finished) return;
  if (isShowingImage(sc)) {
    const w = sc.video.videoWidth;
    const h = sc.video.videoHeight;
    const bandHeight = Math.round(h * 0.45);
    const scale = Math.min(1, 1000 / w);
    sc.canvas.width = Math.round(w * scale);
    sc.canvas.height = Math.round(bandHeight * scale);
    sc.context.drawImage(sc.video, 0, Math.round((h - bandHeight) / 2), w, bandHeight, 0, 0, sc.canvas.width, sc.canvas.height);

    // Image entièrement noire pendant plus de 3 s : caméra bloquée par iOS.
    const pixel = sc.context.getImageData(Math.floor(sc.canvas.width / 2), Math.floor(sc.canvas.height / 2), 1, 1).data;
    sc.darkFrames = pixel[0] + pixel[1] + pixel[2] < 6 ? sc.darkFrames + 1 : 0;
    if (sc.darkFrames === 20) {
      say(sc, "L'image reste noire. Touchez « Réessayer » ; si rien ne change, fermez complètement l'app (balayez-la vers le haut) et rouvrez-la.");
      showActions(sc, false, true);
    }

    const code = await sc.decode(sc.canvas);
    if (code && current === sc.session && !sc.finished) {
      finish(sc, code);
      return;
    }
  }
  sc.loopTimer = setTimeout(() => scanLoop(sc, current), 160);
}
