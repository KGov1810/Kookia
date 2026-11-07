import { describe, expect, it } from 'vitest';
import { assignBlocks, imageBands, productBounds } from '../../src/services/device/image-trim.js';

/** Pixels RGBA blancs, avec des rectangles sombres { x, y, w, h }. */
function picture(width, height, blocks) {
  const pixels = new Uint8ClampedArray(width * height * 4).fill(255);
  for (const b of blocks) {
    for (let y = b.y; y < b.y + b.h; y++) {
      for (let x = b.x; x < b.x + b.w; x++) pixels.set([20, 90, 40, 255], (y * width + x) * 4);
    }
  }
  return pixels;
}

describe('productBounds', () => {
  it("garde l'emballage et écarte le blanc autour", () => {
    const pixels = picture(100, 100, [{ x: 20, y: 30, w: 60, h: 40 }]);
    expect(productBounds(pixels, 100, 100)).toEqual({ x: 20, y: 30, w: 60, h: 40 });
  });

  it('écarte un texte isolé (prix de la ligne voisine) au-dessus du produit', () => {
    const pixels = picture(100, 100, [{ x: 20, y: 30, w: 60, h: 40 }, { x: 5, y: 2, w: 12, h: 4 }]);
    expect(productBounds(pixels, 100, 100)).toEqual({ x: 20, y: 30, w: 60, h: 40 });
  });

  it("rend toute l'image quand elle est blanche", () => {
    expect(productBounds(picture(50, 40, []), 50, 40)).toEqual({ x: 0, y: 0, w: 50, h: 40 });
  });
});

describe('imageBands', () => {
  it("repère les images de la colonne de gauche, pas les lignes de prix ni de remise", () => {
    // 400 px de large : deux images hautes, une ligne de prix et une remise (basses) entre elles.
    const pixels = picture(400, 600, [
      { x: 20, y: 20, w: 80, h: 70 }, { x: 20, y: 120, w: 60, h: 14 }, { x: 20, y: 160, w: 90, h: 14 },
      { x: 20, y: 300, w: 80, h: 80 }, { x: 150, y: 300, w: 200, h: 20 }]);
    const bands = imageBands(pixels, 400, 600);
    expect(bands.map((b) => [Math.round(b.top * 600), Math.round(b.bottom * 600)])).toEqual([[20, 90], [300, 380]]);
  });
});

describe('assignBlocks', () => {
  const block = (top) => ({ left: 0.02, top, right: 0.27, bottom: top + 0.1 });

  it("autant d'images que d'articles : dans l'ordre, photo après photo, même sans numéro de photo fiable", () => {
    const items = [{ box: null }, { box: { photo: 0, top: 0.9, bottom: 0.95 } }, { box: null }];
    const boxes = assignBlocks(items, [[block(0.1), block(0.5)], [block(0.2)]]);
    expect(boxes.map((b) => [b.photo, b.top])).toEqual([[0, 0.1], [0, 0.5], [1, 0.2]]);
  });

  it('nombres différents : chaque cadre de Claude rejoint l\'image la plus proche sur sa photo', () => {
    const items = [{ box: { photo: 0, top: 0.42, bottom: 0.52 } }, { box: null }];
    const boxes = assignBlocks(items, [[block(0.1), block(0.5), block(0.8)]]);
    expect(boxes[0].top).toBe(0.5);
    expect(boxes[1]).toBeNull();
  });
});
