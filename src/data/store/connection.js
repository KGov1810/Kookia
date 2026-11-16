// Kookia — Connexion à Firebase.

import { initializeFirestore, memoryLocalCache, persistentLocalCache } from 'firebase/firestore';
import {
  browserLocalPersistence, browserSessionPersistence, indexedDBLocalPersistence, initializeAuth, signInAnonymously
} from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from './household-codes.js';

let app = null;

export let auth = null;

export let db = null;

export function ensureFirebase() {
  if (db) return true;
  const config = firebaseConfig();
  if (!config) return false;
  app = initializeApp(config);
  // Comme getAuth, sans le code des connexions par fenêtre ou redirection (Google, Apple…) : seule la connexion
  // anonyme sert. Mêmes lieux d'enregistrement, dans le même ordre : l'iPhone garde son identifiant.
  auth = initializeAuth(app, { persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence] });
  try {
    db = initializeFirestore(app, { localCache: persistentLocalCache(), ignoreUndefinedProperties: true });
  } catch {
    db = initializeFirestore(app, { localCache: memoryLocalCache(), ignoreUndefinedProperties: true });
  }
  return true;
}

export async function signIn() {
  await auth.authStateReady();
  if (!auth.currentUser) await signInAnonymously(auth);
}

export function withTimeout(promise, ms, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}
