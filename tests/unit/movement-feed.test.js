// Une seule écoute Firestore des mouvements, partagée par les statistiques et « À racheter ».
import { expect, test, vi } from 'vitest';

vi.mock('../../src/data/store/connection.js', () => ({ db: { mock: true } }));
const { readMovements, stopReading } = await import('../../src/data/store/movement-feed.js');

const DAY = 86_400_000;
const now = Date.now();
const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const listeners = () => [...globalThis.__db.listeners].filter((l) => l.path === 'foyers/F1/mouvements').length;

test('statistiques et « À racheter » : une écoute, chacun sa période', async () => {
  const seed = { a: ['achat', 10], b: ['achat', 60], c: ['consomme', 5], d: ['achat', 200] };
  for (const [id, [type, days]] of Object.entries(seed)) {
    globalThis.__db.docs.set(`foyers/F1/mouvements/${id}`, { type, name: id, clientAt: now - days * DAY });
  }
  const got = {};
  const reader = (name) => (movements) => { got[name] = movements.map((m) => m.name).sort().join(); };
  readMovements('F1', 'purchases', now - 90 * DAY, reader('purchases'), () => {});
  readMovements('F1', 'stats', now - 30 * DAY, reader('stats'), () => {});
  await flush();
  expect(listeners()).toBe(1);
  expect(got).toEqual({ purchases: 'a,b,c', stats: 'a,c' });

  readMovements('F1', 'stats', 0, reader('stats'), () => {}); // Stats : « Tout »
  await flush();
  expect(listeners()).toBe(1);
  expect(got).toEqual({ purchases: 'a,b,c', stats: 'a,b,c,d' });

  readMovements('F1', 'stats', now - 30 * DAY, reader('stats'), () => {}); // retour à « Mois » : servi aussitôt
  expect(got.stats).toBe('a,c');

  stopReading('stats');
  expect(listeners()).toBe(1); // « À racheter » écoute encore
  stopReading('purchases');
  expect(listeners()).toBe(0);
});

test('refus des règles : chaque nouvelle demande réessaie et reçoit le refus', async () => {
  globalThis.__denyStats = true;
  const errors = [];
  readMovements('F2', 'purchases', now - 90 * DAY, () => {}, (e) => errors.push(`purchases:${e.code}`));
  await flush();
  readMovements('F2', 'stats', now - 30 * DAY, () => {}, (e) => errors.push(`stats:${e.code}`));
  await flush();
  globalThis.__denyStats = false;
  expect(errors).toContain('stats:permission-denied');
  stopReading('stats');
  stopReading('purchases');
});
