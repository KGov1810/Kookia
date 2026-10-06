// Kookia — Écoute en temps réel et reconnexion.

import { collection, disableNetwork, enableNetwork, onSnapshot } from 'firebase/firestore';
import { db, ensureFirebase, signIn } from './connection.js';
import { errorMessage } from './errors.js';
import { purgeHistory } from './history.js';
import { firebaseConfig } from './household-codes.js';
import { toProduct, toRecipe, toShoppingItem } from './mappers.js';
import { rememberRecipeLinks } from './recipes.js';
import { emit, state } from './state.js';

let unsubscribers = [];

const meta = {};

export async function start() {
  const code = state.settings.householdCode;
  if (!code || unsubscribers.length || !ensureFirebase()) return;
  try {
    await signIn();
  } catch (error) {
    state.error = errorMessage(error);
    emit('sync');
    return;
  }
  if (unsubscribers.length) return;
  const listen = (name, key, map) => onSnapshot(
    collection(db, 'foyers', code, name),
    { includeMetadataChanges: true },
    (snapshot) => {
      state[key] = snapshot.docs.map((d) => map(d.id, d.data())).filter(Boolean);
      meta[key] = { fromCache: snapshot.metadata.fromCache, pending: snapshot.metadata.hasPendingWrites };
      const metas = Object.values(meta);
      state.fromCache = metas.some((m) => m.fromCache);
      state.pending = metas.some((m) => m.pending);
      if (!snapshot.metadata.fromCache) {
        state.error = null;
        state.lastSync = new Date();
        if (key === 'products' || key === 'recipes') rememberRecipeLinks(state.products);
      }
      emit(key);
    },
    (error) => {
      state.error = errorMessage(error);
      stop();
      emit('sync');
    }
  );
  purgeHistory();
  unsubscribers = [
    listen('produits', 'products', toProduct),
    listen('courses', 'shopping', toShoppingItem),
    listen('recettes', 'recipes', toRecipe)
  ];
  state.connected = true;
  emit('sync');
}

export function stop() {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
  state.connected = false;
}

/**
 * Force Firestore à rétablir sa connexion.
 * Quand l'app passe en arrière-plan, iOS la met en pause et coupe la connexion
 * sans prévenir. Au retour, Firestore peut mettre de longues minutes à s'en rendre
 * compte : pendant ce temps, l'iPhone affiche d'anciennes données et garde ses
 * propres modifications en attente. On coupe donc puis rétablit le réseau.
 */
let refreshing = null;

async function refreshConnection() {
  if (!db || refreshing) return refreshing;
  state.reconnecting = true;
  emit('sync');
  refreshing = (async () => {
    try {
      await disableNetwork(db);
      await enableNetwork(db);
    } catch (error) {
      console.warn('Reconnexion Firestore :', error);
    } finally {
      state.reconnecting = false;
      refreshing = null;
      emit('sync');
    }
  })();
  return refreshing;
}

/** Retour au premier plan ou retour du réseau. */
export async function resume() {
  if (!state.connected) {
    await start();
    return;
  }
  await refreshConnection();
}

/** Bouton « Se reconnecter » des Réglages. */
export async function reconnect() {
  stop();
  state.error = null;
  emit('sync');
  await refreshConnection();
  await start();
}

export function syncLabel() {
  if (!firebaseConfig()) return 'Firebase non configuré';
  if (!state.settings.householdCode) return 'Aucun foyer';
  if (state.error) return 'Erreur de synchronisation';
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return state.pending ? 'Hors ligne, envoi en attente' : 'Hors ligne';
  }
  if (state.reconnecting) return 'Actualisation…';
  if (!state.connected || (state.fromCache && !state.lastSync)) return 'Connexion…';
  if (state.fromCache) return state.pending ? 'Hors ligne, envoi en attente' : 'Hors ligne';
  if (state.pending) return 'Envoi en cours…';
  return 'Synchronisé';
}
