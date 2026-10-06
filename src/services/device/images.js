// Kookia — Redimensionnement des photos.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Photo illisible.'));
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

/** Vignette légère (≈ 30 Ko) stockée avec le produit. */
export async function thumbnail(blob) {
  return (await resizeImage(blob, 400, 0.6)).dataUrl;
}
