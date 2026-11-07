// Kookia — Recadrage serré d'une vignette de produit : le blanc autour et le texte voisin sont écartés.

const INK = 235; // un pixel plus sombre que ça (sur 255) fait partie de l'emballage
const DENSITY = 0.25; // une ligne ou colonne compte si elle a au moins ce quart de la plus chargée
const GAP = 3; // trous tolérés (px) à l'intérieur de l'emballage

/** Bande [début, fin[ la plus chargée parmi les lignes (ou colonnes) assez denses, ou null si tout est blanc. */
function band(counts) {
  const min = Math.max(...counts) * DENSITY;
  if (!(min > 0)) return null;
  let best = null;
  let run = null;
  counts.forEach((count, i) => {
    if (count < min) return;
    if (run && i - run.end <= GAP) { run.end = i; run.sum += count; } else run = { start: i, end: i, sum: count };
    if (!best || run.sum > best.sum) best = run;
  });
  return best && [best.start, best.end + 1];
}

/**
 * Rectangle { x, y, w, h } de l'emballage dans des pixels RGBA : l'ensemble dense de pixels non blancs, sans le texte
 * isolé (un prix, un nom) autour. Toute l'image si elle est vide.
 */
export function productBounds(pixels, width, height) {
  const inked = (x, y) => {
    const i = (y * width + x) * 4;
    return pixels[i + 3] > 0 && (pixels[i] < INK || pixels[i + 1] < INK || pixels[i + 2] < INK);
  };
  const rows = Array(height).fill(0);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (inked(x, y)) rows[y]++;
  const vertical = band(rows);
  if (!vertical) return { x: 0, y: 0, w: width, h: height };
  const cols = Array(width).fill(0);
  for (let y = vertical[0]; y < vertical[1]; y++) for (let x = 0; x < width; x++) if (inked(x, y)) cols[x]++;
  const horizontal = band(cols) ?? [0, width];
  return { x: horizontal[0], y: vertical[0], w: horizontal[1] - horizontal[0], h: vertical[1] - vertical[0] };
}

/** Le produit seul, centré dans un carré blanc avec une petite marge ; le canvas d'origine si la lecture échoue. */
export function fitSquare(canvas) {
  try {
    const context = canvas.getContext('2d');
    const { x, y, w, h } = productBounds(context.getImageData(0, 0, canvas.width, canvas.height).data, canvas.width, canvas.height);
    const side = Math.round(Math.max(w, h) * 1.12);
    const square = document.createElement('canvas');
    square.width = side;
    square.height = side;
    const target = square.getContext('2d');
    target.fillStyle = '#fff';
    target.fillRect(0, 0, side, side);
    target.drawImage(canvas, x, y, w, h, Math.round((side - w) / 2), Math.round((side - h) / 2), w, h);
    return square;
  } catch {
    return canvas;
  }
}

/**
 * Images de produits d'une capture de commande en ligne, repérées dans la colonne de gauche : les bandes hautes de
 * pixels non blancs (une ligne de texte, prix ou remise, est trop basse pour compter). → [{ left, top, right, bottom }]
 * en fractions, de haut en bas ; [] pour une photo qui n'est pas une capture d'écran (ticket papier).
 */
export function imageBands(pixels, width, height) {
  const [x0, x1] = [Math.floor(width * 0.02), Math.ceil(width * 0.27)];
  const gap = width * 0.02;
  const runs = [];
  let blank = 0;
  for (let y = 0; y < height; y++) {
    let ink = 0;
    for (let x = x0; x < x1; x++) {
      const i = (y * width + x) * 4;
      if (pixels[i] < INK || pixels[i + 1] < INK || pixels[i + 2] < INK) ink++;
    }
    if (ink < Math.max(2, width * 0.005)) { blank++; continue; }
    const last = runs.at(-1);
    if (last && y - last.end <= gap) last.end = y; else runs.push({ start: y, end: y });
  }
  // Une capture d'écran a un fond blanc entre les produits ; une photo de ticket papier, non : rien n'y est repéré.
  if (blank < height * 0.4) return [];
  return runs.filter((r) => r.end - r.start >= width * 0.08)
    .map((r) => ({ left: x0 / width, top: r.start / height, right: x1 / width, bottom: (r.end + 1) / height }));
}

const middle = (box) => (box.top + box.bottom) / 2;

/**
 * Cadre de chaque article parmi les images repérées sur les photos (blocks[photo] = images de haut en bas).
 * Autant d'images que d'articles : dans l'ordre (le ticket se lit de haut en bas, photo après photo). Sinon, photo par
 * photo : dans l'ordre si les nombres concordent, au plus proche du cadre estimé par Claude sinon. Sans image
 * repérée sur une photo, le cadre de Claude reste.
 */
export function assignBlocks(items, blocks) {
  const all = blocks.flatMap((list, photo) => list.map((box) => ({ ...box, photo })));
  if (all.length && all.length === items.length) return all;
  const result = items.map((item) => item.box ?? null);
  blocks.forEach((list, photo) => {
    if (!list.length) return;
    const mine = items.flatMap((item, i) => (item.box?.photo === photo ? [i] : []));
    if (mine.length === list.length) {
      mine.forEach((i, k) => { result[i] = { ...list[k], photo }; });
      return;
    }
    const free = new Set(list.keys());
    for (const i of mine) {
      const y = middle(items[i].box);
      const k = [...free].sort((a, b) => Math.abs(middle(list[a]) - y) - Math.abs(middle(list[b]) - y))[0];
      if (k === undefined) { result[i] = null; continue; }
      free.delete(k);
      result[i] = { ...list[k], photo };
    }
  });
  return result;
}
