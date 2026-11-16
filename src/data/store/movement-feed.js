// Kookia — Une seule écoute des mouvements du foyer, partagée par les statistiques et « À racheter ».
// Elle remonte assez loin pour les deux ; chacun garde ensuite sa période.

import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from './connection.js';
import { toMovement } from './mappers.js';

const readers = new Map(); // nom → { since, onData, onError }
let feed = null; // { code, since, stop }
let last = null; // derniers mouvements reçus (tous ceux de la période écoutée)

function deliver(reader) {
  if (last) reader.onData(last.filter((m) => m.clientAt >= reader.since));
}

function listen(code) {
  const since = Math.min(...[...readers.values()].map((r) => r.since));
  if (feed && feed.code === code && feed.since <= since) return; // l'écoute en cours remonte déjà assez loin
  feed?.stop();
  last = null;
  const q = query(collection(db, 'foyers', code, 'mouvements'), where('clientAt', '>=', since));
  const stop = onSnapshot(q, (snapshot) => {
    last = snapshot.docs.map((d) => toMovement(d.id, d.data())).filter(Boolean);
    readers.forEach(deliver);
  }, (error) => {
    last = null;
    feed = null; // la prochaine demande (autre période, retour sur l'écran) réessaie
    readers.forEach((reader) => reader.onError(error));
  });
  feed = { code, since, stop };
}

/**
 * Lecteur name des mouvements depuis since (ms) : onData(mouvements de sa période) à chaque changement,
 * onError(erreur) si Firestore refuse. Le même nom remplace sa demande précédente.
 */
export function readMovements(code, name, since, onData, onError) {
  if (!db || !code) return;
  const reader = { since, onData, onError };
  readers.set(name, reader);
  listen(code);
  deliver(reader); // période plus courte que l'écoute en cours : servie tout de suite
}

/** Retire un lecteur ; sans lecteur, l'écoute s'arrête. */
export function stopReading(name) {
  readers.delete(name);
  if (readers.size) return;
  feed?.stop();
  feed = null;
  last = null;
}
