// Kookia — Historique des changements.

import { collection, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import { formatDate } from '../../services/dates/dates.js';
import { quantityLabel } from '../../services/quantities/quantities.js';
import { stockShort } from '../../services/stock/stock-status.js';
import { category } from '../reference/categories.js';
import { DATE_KINDS, locationOf } from '../reference/locations.js';
import { auth, db } from './connection.js';
import { errorMessage } from './errors.js';
import { updateSettings } from './settings.js';
import { emit, state } from './state.js';
import { canWrite, ref } from './writes.js';

export const HISTORY_DAYS = 90;

const DAY_MS = 86_400_000;

/**
 * Note une action dans foyers/{code}/historique. Écriture séparée : si elle échoue
 * (ex. règles Firestore pas encore mises à jour), la modification elle-même réussit.
 */
export function logChange(entry) {
  if (!canWrite()) return;
  const data = {
    scope: entry.scope,
    action: entry.action,
    name: entry.name ?? '',
    itemId: entry.itemId ?? '',
    details: (entry.details ?? []).filter(Boolean).slice(0, 12),
    by: state.settings.userName || '',
    uid: auth?.currentUser?.uid ?? '',
    clientAt: Date.now(),
    at: serverTimestamp()
  };
  setDoc(ref('historique', crypto.randomUUID()), data).catch((error) => {
    if (error?.code === 'permission-denied') {
      state.historyError = "L'historique n'est pas encore autorisé : recollez les règles Firestore (fichier firestore.rules, README).";
      emit('history');
    }
  });
}

// Champs suivis dans le détail d'une modification (ajouter un champ = ajouter une ligne).
const TRACKED_FIELDS = [
  ['name', 'Nom', (v) => v],
  ['location', 'Lieu', (v) => locationOf(v).label],
  ['category', 'Catégorie', (v) => category(v).label],
  ['count', 'Nombre', (v) => String(v ?? 1)],
  ['quantity', 'Poids', (v) => v || '—'],
  ['dateKind', 'Type de date', (v) => DATE_KINDS[v]?.label ?? v],
  ['expiry', 'Date', (v) => (v ? formatDate(v, { day: 'numeric', month: 'short', year: 'numeric' }) : 'à compléter')],
  ['frozenAt', 'Congelé le', (v) => (v ? formatDate(v, { day: 'numeric', month: 'short' }) : '—')]
];

export function productDiff(before, after) {
  const changes = [];
  for (const [field, label, show] of TRACKED_FIELDS) {
    const a = before[field] ?? '';
    const b = after[field] ?? '';
    if (String(a) !== String(b)) changes.push(`${label} : ${show(a)} → ${show(b)}`);
  }
  if ((before.image || before.imageUrl || '') !== (after.image || after.imageUrl || '')) changes.push('Photo modifiée');
  return changes;
}

export function productSummary(p) {
  return [quantityLabel(p), locationOf(p.location).label, stockShort(p)].filter(Boolean).join(', ');
}

/** Écoute les dernières entrées (les plus récentes d'abord). Renvoie la fonction d'arrêt. */
export function listenHistory(count, callback) {
  if (!db || !state.settings.householdCode) return () => {};
  const q = query(collection(db, 'foyers', state.settings.householdCode, 'historique'), orderBy('clientAt', 'desc'), limit(count));
  return onSnapshot(q, (snapshot) => {
    state.historyError = null;
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => {
    state.historyError = error?.code === 'permission-denied'
      ? "L'historique n'est pas encore autorisé : recollez les règles Firestore (fichier firestore.rules, README)."
      : errorMessage(error);
    callback([]);
  });
}

/** Supprime les entrées de plus de 90 jours (au plus une fois par jour et par iPhone). */
export async function purgeHistory() {
  if (!canWrite()) return;
  const last = state.settings.historyPurgedAt ?? 0;
  if (Date.now() - last < DAY_MS) return;
  try {
    const cutoff = Date.now() - HISTORY_DAYS * DAY_MS;
    const old = await getDocs(query(collection(db, 'foyers', state.settings.householdCode, 'historique'), where('clientAt', '<', cutoff), limit(300)));
    if (old.docs.length) {
      const batch = writeBatch(db);
      old.docs.forEach((d) => batch.delete(d.ref ?? ref('historique', d.id)));
      await batch.commit();
    }
    updateSettings({ historyPurgedAt: Date.now() });
  } catch {
    // nouvel essai au prochain lancement
  }
}
