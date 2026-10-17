// Kookia — Écoute en temps réel et reconnexion.

import { collection, disableNetwork, enableNetwork, onSnapshot } from 'firebase/firestore';
import { db, ensureFirebase, signIn } from './connection.js';
import { errorMessage } from './errors.js';
import { purgeHistory } from './history.js';
import { firebaseConfig } from './household-codes.js';
import { toProduct, toRecipe, toShoppingItem } from './mappers.js';
import { stopMovements } from './movements.js';
import { listenPrices } from './prices.js';
import { rememberRecipeLinks } from './recipes.js';
import { partnerName } from './selectors.js';
import { emit, state } from './state.js';
import { t } from '../../services/i18n/i18n.js';

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
    listen('recettes', 'recipes', toRecipe),
    listenPrices(code)
  ];
  state.connected = true;
  emit('sync');
}

export function stop() {
  unsubscribers.forEach((u) => u());
  unsubscribers = [];
  stopMovements();
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
  if (!firebaseConfig()) return t('sync.noFirebase');
  if (!state.settings.householdCode) return t('sync.noHousehold');
  if (state.error) return t('sync.error');
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return t(state.pending ? 'sync.offlinePending' : 'sync.offline');
  }
  if (state.reconnecting) return t('sync.refreshing');
  if (!state.connected || (state.fromCache && !state.lastSync)) return t('sync.connecting');
  if (state.fromCache) return t(state.pending ? 'sync.offlinePending' : 'sync.offline');
  if (state.pending) return t('sync.sending');
  const partner = partnerName();
  return partner ? t('sync.okWith', { name: partner }) : t('sync.ok');
}
