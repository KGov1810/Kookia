// Kookia — Historique des changements.

import { collection, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, where, writeBatch } from 'firebase/firestore';
import { t } from '../../services/i18n/i18n.js';
import { isRich, richFrench } from '../../services/i18n/rich.js';
import { dateKindOf } from '../../services/stock/stock-dates.js';
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
 * Nom et détails peuvent être des valeurs neutres (services/i18n/rich.js) : ils sont notés en français
 * (details, name) et tels quels (rich, nameRich), pour que chaque iPhone les lise dans sa langue.
 */
export function logChange(entry) {
  if (!canWrite()) return;
  const at = Date.now();
  const rich = (entry.details ?? []).filter(Boolean).slice(0, 12);
  const data = {
    scope: entry.scope,
    action: entry.action,
    name: richFrench(entry.name ?? '', at),
    itemId: entry.itemId ?? '',
    details: rich.map((d) => richFrench(d, at)).filter(Boolean),
    ...(rich.some(isRich) ? { rich } : {}),
    ...(isRich(entry.name) ? { nameRich: entry.name } : {}),
    by: state.settings.userName || '',
    uid: auth?.currentUser?.uid ?? '',
    clientAt: at,
    at: serverTimestamp()
  };
  setDoc(ref('historique', crypto.randomUUID()), data).catch((error) => {
    if (error?.code === 'permission-denied') {
      state.historyError = "L'historique n'est pas encore autorisé : recollez les règles Firestore (fichier firestore.rules, README).";
      emit('history');
    }
  });
}

// Champs suivis dans le détail d'une modification (ajouter un champ = ajouter une ligne) : valeurs neutres.
const TRACKED_FIELDS = [
  ['name', (v) => v],
  ['location', (v) => ({ loc: v })],
  ['category', (v) => ({ cat: v })],
  ['count', (v) => String(v ?? 1)],
  ['quantity', (v) => v || '—'],
  ['dateKind', (v) => ({ kind: v })],
  ['expiry', (v) => (v ? { date: v, f: 'dmy' } : { k: 'hist.toFill' })],
  ['frozenAt', (v) => (v ? { date: v, f: 'dm' } : '—')],
  ['unitPrice', (v) => (v === '' || v === null ? '—' : { euro: v })]
];

/** « Date : 3 oct. 2026 → 10 oct. 2026 », « Lieu : Frigo → Congélateur »… */
export function productDiff(before, after) {
  const changes = [];
  for (const [field, show] of TRACKED_FIELDS) {
    const a = before[field] ?? '';
    const b = after[field] ?? '';
    if (String(a) !== String(b)) changes.push({ k: 'hist.change', p: { field: { k: `hfield.${field}` }, from: show(a), to: show(b) } });
  }
  if ((before.image || before.imageUrl || '') !== (after.image || after.imageUrl || '')) changes.push({ k: 'hist.photo' });
  return changes;
}

/** « 2 × 500 g, Placard, depuis 3 jours » : nombre et poids, lieu, état court. */
export function productSummary(p) {
  const short = { dateKind: dateKindOf(p), expiry: p.expiry ?? '', frozenAt: p.frozenAt ?? '', createdAt: p.createdAt ?? Date.now() };
  return { join: [{ qty: { count: p.count ?? 1, quantity: p.quantity ?? '' } }, { loc: p.location }, { short }] };
}

/** Phrase « a 2 produits », « 5 repas »… pour le nom d'une action groupée. */
export function countName(key, n) {
  return { k: key, p: { n } };
}

/** Écoute les dernières entrées (les plus récentes d'abord). Renvoie la fonction d'arrêt. */
export function listenHistory(count, callback) {
  if (!db || !state.settings.householdCode) return () => {};
  const q = query(collection(db, 'foyers', state.settings.householdCode, 'historique'), orderBy('clientAt', 'desc'), limit(count));
  return onSnapshot(q, (snapshot) => {
    state.historyError = null;
    callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
  }, (error) => {
    state.historyError = error?.code === 'permission-denied' ? t('hist.denied') : errorMessage(error);
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
