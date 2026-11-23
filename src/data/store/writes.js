// Kookia — Écritures Firestore (file d'attente hors ligne gérée par Firestore).

import { doc } from 'firebase/firestore';
import { db } from './connection.js';
import { reportWriteError } from './errors.js';
import { state } from './state.js';

export function ref(name, id) {
  return doc(db, 'foyers', state.settings.householdCode, name, id);
}

export function canWrite() {
  return Boolean(db && state.settings.householdCode);
}

export function write(promise) {
  promise.catch((error) => {
    // Document déjà supprimé par l'autre iPhone : rien à signaler.
    if (error?.code === 'not-found') return;
    reportWriteError(error);
  });
}
