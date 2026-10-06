// Kookia — Ouverture de la caméra arrière.

/**
 * Ouvre la caméra arrière dans l'élément vidéo.
 * Gérée ici plutôt que par ZXing : si iOS refuse de lancer la vidéo, ZXing l'ignore
 * en silence et l'écran reste noir. Renvoie { stream, playing, stop }.
 */
export async function startCamera(video) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw Object.assign(new Error('Caméra non disponible dans ce navigateur.'), { name: 'NotSupportedError' });
  }
  const attempts = [
    { audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } },
    { audio: false, video: { facingMode: 'environment' } },
    { audio: false, video: true }
  ];
  let stream = null;
  let lastError = null;
  for (const constraints of attempts) {
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      break;
    } catch (error) {
      lastError = error;
      if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') throw error;
    }
  }
  if (!stream) throw lastError ?? new Error('Caméra indisponible.');

  // Indispensables sur iPhone pour lire la vidéo sans plein écran ni son.
  video.setAttribute('playsinline', '');
  video.setAttribute('muted', '');
  video.muted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.srcObject = stream;

  let playing = true;
  try {
    await video.play();
  } catch {
    playing = false; // iOS attend un toucher : l'interface proposera « Démarrer la caméra »
  }
  const stop = () => {
    stream.getTracks().forEach((track) => track.stop());
    video.pause?.();
    video.srcObject = null;
  };
  return { stream, playing, stop };
}
