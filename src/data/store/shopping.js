// Kookia — Liste de courses.

import { setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { sanitizeCount, splitItemName, toShoppingEntry } from '../../services/quantities/quantities.js';
import { db } from './connection.js';
import { logChange } from './history.js';
import { state } from './state.js';
import { canWrite, ref, write } from './writes.js';

/**
 * Ajoute un article. Renvoie 'added', 'updated' (article déjà présent dont la
 * quantité a été remplacée, si updateQuantity) ou false (déjà présent).
 */
export function addShoppingItem(name, quantity = '', { updateQuantity = false, log = true } = {}) {
  const raw = String(quantity ?? '').trim();
  // La quantité enregistrée est toujours un nombre ; un poids (« 400 g ») rejoint le nom.
  const entry = /^\d*$/.test(raw)
    ? { name: (name ?? '').trim(), quantity: sanitizeCount(raw) }
    : toShoppingEntry(name, raw);
  const trimmed = entry.name;
  const amount = entry.quantity;
  if (!trimmed || !canWrite()) return false;
  const base = splitItemName(trimmed).base;
  const existing = state.shopping.find((i) => !i.checked
    && splitItemName(i.name).base.localeCompare(base, 'fr', { sensitivity: 'base' }) === 0);
  if (existing) {
    if (updateQuantity && amount && amount !== existing.quantity) {
      updateShoppingItem(existing.id, { quantity: amount }, { log });
      return 'updated';
    }
    return false;
  }
  const id = crypto.randomUUID();
  if (log) logChange({ scope: 'courses', action: 'ajout', name: trimmed, itemId: id, details: [amount ? `quantité : ${amount}` : ''] });
  write(setDoc(ref('courses', id), {
    name: trimmed, quantity: amount, checked: false, addedBy: state.settings.userName, createdAt: Date.now()
  }));
  return 'added';
}

/** Modifie le nom et/ou la quantité d'un article. */
export function updateShoppingItem(id, patch, { log = true } = {}) {
  if (!canWrite()) return;
  const data = {};
  if (patch.name !== undefined && patch.name.trim()) data.name = patch.name.trim();
  if (patch.quantity !== undefined) data.quantity = sanitizeCount(patch.quantity);
  const item = state.shopping.find((i) => i.id === id);
  if (log && item) {
    const changes = [];
    if (data.name !== undefined && data.name !== item.name) changes.push(`Nom : ${item.name} → ${data.name}`);
    if (data.quantity !== undefined && data.quantity !== (item.quantity ?? '')) changes.push(`Quantité : ${item.quantity || '—'} → ${data.quantity || '—'}`);
    if (changes.length) logChange({ scope: 'courses', action: 'modification', name: data.name ?? item.name, itemId: id, details: changes });
  }
  if (Object.keys(data).length) write(updateDoc(ref('courses', id), data));
}

export function toggleShoppingItem(id) {
  const item = state.shopping.find((i) => i.id === id);
  if (!item || !canWrite()) return;
  // updateDoc et non setDoc : si l'autre iPhone vient de supprimer l'article,
  // on ne recrée pas un article vide (« fantôme »).
  write(updateDoc(ref('courses', id), { checked: !item.checked }));
}

/** reason 'rangement' : article acheté et rangé dans le stock. */
export function deleteShoppingItems(ids, { log = true, reason = '' } = {}) {
  if (!canWrite() || !ids.length) return;
  if (log) {
    state.shopping.filter((i) => ids.includes(i.id)).forEach((i) => logChange({
      scope: 'courses', action: reason === 'rangement' ? 'rangement' : 'suppression', name: i.name, itemId: i.id,
      details: [i.quantity ? `quantité : ${i.quantity}` : '']
    }));
  }
  const batch = writeBatch(db);
  ids.forEach((id) => batch.delete(ref('courses', id)));
  write(batch.commit());
}

export function clearCheckedShopping() {
  const checked = state.shopping.filter((i) => i.checked);
  if (!checked.length) return;
  logChange({ scope: 'courses', action: 'panier', name: `${checked.length} article${checked.length > 1 ? 's' : ''}`, details: [checked.map((i) => i.name).join(', ')] });
  deleteShoppingItems(checked.map((i) => i.id), { log: false });
}
