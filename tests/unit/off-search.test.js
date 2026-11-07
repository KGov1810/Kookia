import { afterEach, describe, expect, it, vi } from 'vitest';
import { searchProductImage } from '../../src/services/external/open-food-facts.js';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('searchProductImage', () => {
  it('après une connexion refusée, retente une fois, et la recherche suivante attend la pause', async () => {
    vi.useFakeTimers({ now: 0 });
    const calls = [];
    let refuse = 1;
    vi.stubGlobal('fetch', async () => {
      calls.push(Date.now());
      if (refuse-- > 0) throw new TypeError('Load failed');
      return { ok: true, json: async () => ({ products: [] }) };
    });
    const first = searchProductImage('Petits pois carottes', 'Cassegrain');
    await vi.advanceTimersByTimeAsync(6500);
    expect(await first).toBe('');
    const second = searchProductImage('Lentilles préparées', 'Cassegrain');
    await vi.advanceTimersByTimeAsync(6500);
    await second;
    expect(calls).toEqual([0, 6500, 13000]);
  });
});
