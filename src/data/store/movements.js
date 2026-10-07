// Kookia — Mouvements du stock (achats, consommations, produits jetés) pour les statistiques.
// Écrits à part : si les règles Firestore ne les autorisent pas encore, le stock fonctionne quand même.

import { collection, deleteDoc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { cleanPrice } from '../../services/stats/money.js';
import { auth, db } from './connection.js';
import { errorMessage } from './errors.js';
import { toMovement } from './mappers.js';
import { emit, state } from './state.js';
import { canWrite, ref } from './writes.js';

const DENIED = "Les statistiques ne sont pas encore autorisées : recollez les règles Firestore (fichier firestore.rules, README).";

/** Refus des règles Firestore : message clair dans l'onglet Stats. Renvoie vrai si c'était le cas. */
export function reportStatsDenied(error) {
  if (error?.code !== 'permission-denied') return false;
  state.movementsError = DENIED;
  emit('movements');
  return true;
}

// Derniers mouvements de chaque produit, pour « Annuler » (consommé ou jeté).
const undoable = new Map();

/** Note un mouvement ; product porte name, category, location, unitPrice (et id). */
export function recordMovement(type, product, count = 1) {
  if (!canWrite()) return '';
  const id = crypto.randomUUID();
  setDoc(ref('mouvements', id), {
    type,
    name: (product.name ?? '').trim(),
    productId: product.id ?? '',
    category: product.category || 'autre',
    location: product.location || 'frigo',
    count: Math.max(1, Math.round(Number(count) || 1)),
    unitPrice: cleanPrice(product.unitPrice),
    by: state.settings.userName || '',
    uid: auth?.currentUser?.uid ?? '',
    clientAt: Date.now(),
    at: serverTimestamp()
  }).catch(reportStatsDenied);
  if (type !== 'achat' && product.id) {
    const list = undoable.get(product.id) ?? [];
    list.push(id);
    undoable.set(product.id, list.slice(-20));
  }
  return id;
}

/** « Annuler » : efface le dernier mouvement noté pour chacun de ces produits. */
export function cancelLastMovements(productIds) {
  if (!canWrite()) return;
  for (const productId of productIds) {
    const id = undoable.get(productId)?.pop();
    if (id) deleteDoc(ref('mouvements', id)).catch(() => {});
  }
}

let watched = null; // { code, since, stop }

/** Écoute les mouvements depuis « since » (ms). Sans effet si c'est déjà le cas. */
export function watchMovements(since) {
  const code = state.settings.householdCode;
  if (!db || !code) return;
  if (watched && watched.code === code && watched.since === since) return;
  watched?.stop();
  state.movementsLoaded = false;
  const q = query(collection(db, 'foyers', code, 'mouvements'), where('clientAt', '>=', since));
  const stop = onSnapshot(q, (snapshot) => {
    state.movements = snapshot.docs.map((d) => toMovement(d.id, d.data())).filter(Boolean);
    state.movementsLoaded = true;
    state.movementsError = null;
    emit('movements');
  }, (error) => {
    state.movements = [];
    state.movementsLoaded = true;
    if (!reportStatsDenied(error)) {
      state.movementsError = errorMessage(error);
      emit('movements');
    }
  });
  watched = { code, since, stop };
}

export function stopMovements() {
  watched?.stop();
  watched = null;
  state.movements = [];
  state.movementsLoaded = false;
}
