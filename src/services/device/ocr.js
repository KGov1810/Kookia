// Kookia — Lecture de texte sur l'iPhone (Tesseract).

import { resizeImage } from './images.js';
import { TESSERACT_URL, loadScript } from './script-loader.js';

let ocrWorker = null;

export async function recognizeText(blob) {
  await loadScript(TESSERACT_URL);
  if (!ocrWorker) {
    ocrWorker = window.Tesseract.createWorker('fra').catch((error) => {
      ocrWorker = null;
      throw error;
    });
  }
  const worker = await ocrWorker;
  const { canvas } = await resizeImage(blob, 1800, 0.92);
  const { data } = await worker.recognize(canvas);
  return (data.text ?? '').split('\n').map((l) => l.trim()).filter(Boolean);
}
