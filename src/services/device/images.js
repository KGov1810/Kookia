// Kookia — Redimensionnement des photos.

import { t } from '../i18n/i18n.js';
import { fitSquare, imageBands } from './image-trim.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(t('device.badPhoto')));
    img.src = src;
  });
}

/** Redimensionne une photo (l'orientation de l'appareil est respectée par Safari). */
export async function resizeImage(blob, maxDimension = 1568, quality = 0.8) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    return { canvas, dataUrl, base64: dataUrl.slice(dataUrl.indexOf(',') + 1) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Vignettes découpées dans une photo (images des produits d'une capture de commande en ligne) : un cadre en fractions
 * de la photo { left, top, right, bottom }, élargi d'une petite marge, puis resserré sur l'emballage → une image JPEG carrée (data URL).
 */
export async function cropImages(blob, boxes, size = 320) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url); // décodée une seule fois pour toutes les vignettes
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    return boxes.map((box) => {
      const padX = (box.right - box.left) * 0.06;
      const padY = (box.bottom - box.top) * 0.06;
      const sx = Math.max(0, box.left - padX) * w;
      const sy = Math.max(0, box.top - padY) * h;
      const sw = Math.min(w, (box.right + padX) * w) - sx;
      const sh = Math.min(h, (box.bottom + padY) * h) - sy;
      const scale = Math.min(1, size / Math.max(sw, sh));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(sw * scale));
      canvas.height = Math.max(1, Math.round(sh * scale));
      const context = canvas.getContext('2d');
      context.fillStyle = '#fff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      return fitSquare(canvas).toDataURL('image/jpeg', 0.8);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Vignette légère (≈ 30 Ko) stockée avec le produit. */
export async function thumbnail(blob) {
  return (await resizeImage(blob, 400, 0.6)).dataUrl;
}

/** Images de produits repérées sur une capture de commande en ligne (analysée en petit : 400 px de large). */
export async function findImageBlocks(blob) {
  const url = URL.createObjectURL(blob);
  try {
    const img = await loadImage(url);
    const width = 400;
    const height = Math.max(1, Math.round(img.naturalHeight * (width / img.naturalWidth)));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, width, height);
    context.drawImage(img, 0, 0, width, height);
    return imageBands(context.getImageData(0, 0, width, height).data, width, height);
  } finally {
    URL.revokeObjectURL(url);
  }
}
