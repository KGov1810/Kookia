// Kookia — Décodage des codes-barres (détecteur natif ou ZXing).

import { resizeImage } from './images.js';
import { ZXING_URL, loadScript } from './script-loader.js';

const TRY_HARDER = 3;

// valeur de DecodeHintType.TRY_HARDER dans ZXing

async function barcodeReader() {
  await loadScript(ZXING_URL);
  return new window.ZXingBrowser.BrowserMultiFormatOneDReader(
    new Map([[TRY_HARDER, true]]),
    { delayBetweenScanAttempts: 120, tryPlayVideoTimeout: 8000 }
  );
}

/**
 * Renvoie une fonction (canvas) => code | null.
 * Utilise le détecteur natif du navigateur s'il existe, sinon ZXing.
 */
export async function createBarcodeDecoder() {
  if ('BarcodeDetector' in window) {
    try {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      const formats = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128'].filter((f) => supported.includes(f));
      if (formats.length) {
        const detector = new window.BarcodeDetector({ formats });
        return async (canvas) => (await detector.detect(canvas))[0]?.rawValue ?? null;
      }
    } catch {
      // on passe à ZXing
    }
  }
  const reader = await barcodeReader();
  return async (canvas) => {
    try {
      return reader.decodeFromCanvas(canvas).getText();
    } catch {
      return null; // aucun code dans cette image
    }
  };
}

export async function decodeBarcodeFromImage(blob) {
  const reader = await barcodeReader();
  const { dataUrl } = await resizeImage(blob, 1600, 0.95);
  try {
    return (await reader.decodeFromImageUrl(dataUrl)).getText();
  } catch {
    return null;
  }
}
