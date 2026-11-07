import { describe, expect, it } from 'vitest';
import { productBounds } from '../../src/services/device/image-trim.js';

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
