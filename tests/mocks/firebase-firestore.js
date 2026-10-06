// Simulation de firebase/firestore pour les tests (base en mémoire partagée via globalThis.__db).
// Faux Firestore en mémoire, partagé entre « iPhones » simulés via globalThis.__db.
const db = globalThis.__db ??= { docs: new Map(), listeners: new Set(), writes: 0 };
db.network ??= [];
export const persistentLocalCache = () => ({});
export const memoryLocalCache = () => ({});
export function initializeFirestore() { return { mock: true }; }
export const serverTimestamp = () => ({ __ts: Date.now() });
export function collection(_db, ...path) { return { path: path.join('/') }; }
export function doc(_db, ...path) { return { path: path.join('/'), id: path[path.length - 1] }; }
function parentOf(path) { return path.split('/').slice(0, -1).join('/'); }
function notify(path, fromCache = false) {
  const parent = parentOf(path);
  for (const l of globalThis.__db.listeners) if (l.path === parent) fire(l, fromCache);
}
function docsIn(path, constraints = []) {
  let docs = [...globalThis.__db.docs.entries()].filter(([p]) => parentOf(p) === path)
    .map(([p, data]) => ({ id: p.split('/').pop(), ref: { path: p, id: p.split('/').pop() }, data: () => structuredClone(data) }));
  for (const c of constraints) {
    if (c.type === 'where') docs = docs.filter((d) => (c.op === '<' ? d.data()[c.field] < c.value : d.data()[c.field] === c.value));
  }
  const order = constraints.find((c) => c.type === 'orderBy');
  if (order) docs.sort((a, b) => (a.data()[order.field] - b.data()[order.field]) * (order.dir === 'desc' ? -1 : 1));
  const lim = constraints.find((c) => c.type === 'limit');
  return lim ? docs.slice(0, lim.n) : docs;
}
function fire(l, fromCache = false) {
  l.cb({ docs: docsIn(l.path, l.constraints), metadata: { fromCache, hasPendingWrites: false } });
}
export function query(ref, ...constraints) { return { path: ref.path, constraints }; }
export const where = (field, op, value) => ({ type: 'where', field, op, value });
export const orderBy = (field, dir = 'asc') => ({ type: 'orderBy', field, dir });
export const limit = (n) => ({ type: 'limit', n });
export async function getDocs(q) { return { docs: docsIn(q.path, q.constraints) }; }
function check(data) {
  for (const [k, v] of Object.entries(data)) if (v === undefined) throw new Error(`undefined field ${k}`);
}
const notFound = () => Object.assign(new Error('No document to update'), { code: 'not-found' });
export async function setDoc(ref, data, options) {
  if (globalThis.__denyHistory && ref.path.includes('/historique/')) throw Object.assign(new Error('denied'), { code: 'permission-denied' });
  check(data); globalThis.__db.writes++;
  const prev = globalThis.__db.docs.get(ref.path);
  globalThis.__db.docs.set(ref.path, options?.merge && prev ? { ...prev, ...data } : { ...data });
  notify(ref.path);
}
export async function updateDoc(ref, data) {
  check(data);
  const prev = globalThis.__db.docs.get(ref.path);
  if (!prev) throw notFound();
  globalThis.__db.docs.set(ref.path, { ...prev, ...data });
  notify(ref.path);
}
export async function deleteDoc(ref) { globalThis.__db.docs.delete(ref.path); notify(ref.path); }
export async function getDoc(ref) { return { exists: () => globalThis.__db.docs.has(ref.path), data: () => globalThis.__db.docs.get(ref.path) }; }
export function onSnapshot(ref, ...args) {
  // Comme le vrai Firestore : onSnapshot(ref, options?, onNext, onError?)
  if (typeof args[0] === 'function') args.unshift({});
  const [, cb, errCb] = args;
  if (globalThis.__denyHistory && ref.path.endsWith('/historique')) {
    queueMicrotask(() => errCb?.(Object.assign(new Error('denied'), { code: 'permission-denied' })));
    return () => {};
  }
  const l = { path: ref.path, constraints: ref.constraints ?? [], cb, errCb };
  globalThis.__db.listeners.add(l);
  queueMicrotask(() => fire(l));
  return () => globalThis.__db.listeners.delete(l);
}
export function writeBatch() {
  const ops = [];
  return {
    set(ref, data) { check(data); ops.push(() => globalThis.__db.docs.set(ref.path, { ...data })); },
    update(ref, data) { check(data); ops.push(() => {
      const prev = globalThis.__db.docs.get(ref.path); if (!prev) throw notFound();
      globalThis.__db.docs.set(ref.path, { ...prev, ...data }); }); },
    delete(ref) { ops.push(() => globalThis.__db.docs.delete(ref.path)); },
    async commit() { ops.forEach((o) => o()); globalThis.__db.writes++;
      for (const l of globalThis.__db.listeners) fire(l); }
  };
}
export async function disableNetwork() {
  globalThis.__db.network.push('off');
  for (const l of globalThis.__db.listeners) fire(l, true);
}
export async function enableNetwork() {
  globalThis.__db.network.push('on');
  await new Promise((r) => setTimeout(r, 5));
  for (const l of globalThis.__db.listeners) fire(l, false);
}
