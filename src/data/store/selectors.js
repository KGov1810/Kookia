// Kookia — Vues dérivées de l'état (tris, filtres, compteurs).

import { splitItemName } from '../../services/quantities/quantities.js';
import { stockStatus } from '../../services/stock/stock-status.js';
import { nameMatchScore } from '../../services/text/text.js';
import { state } from './state.js';

export function sortedProducts() {
  return [...state.products].sort((a, b) => a.expiry.localeCompare(b.expiry) || a.name.localeCompare(b.name, 'fr'));
}

export function productStatus(product) {
  return stockStatus(product, state.settings.alertDays);
}

/** Produits par lieu de rangement ('' = tous). */
export function productsIn(location = '') {
  return sortedProducts().filter((p) => !location || (p.location || 'frigo') === location);
}

/** Produits en stock qui ressemblent à un article de courses (anti-achat en double). */
export function stockMatches(name) {
  const base = splitItemName(name).base;
  return state.products.filter((p) => nameMatchScore(base, p.name) > 0);
}

/** Périmés + à vérifier + à consommer vite (hors produits dont la date est à compléter). */
export function urgentProducts() {
  return sortedProducts().filter((p) => ['expired', 'check', 'soon'].includes(productStatus(p)));
}

/** Produits ajoutés sans date (ex. depuis un ticket de caisse). */
export function pendingProducts() {
  return sortedProducts().filter((p) => productStatus(p) === 'pending');
}

/** À consommer vite ou à vérifier (date estimée ou « de préférence » dépassée) : à utiliser en priorité. */
export function soonProducts() {
  return sortedProducts().filter((p) => ['soon', 'check'].includes(productStatus(p)));
}

export function productById(id) {
  return state.products.find((p) => p.id === id) ?? null;
}

export function uncheckedCount() {
  return state.shopping.filter((i) => !i.checked).length;
}

// Utilisé par l'interface pour la pastille de l'icône.
export function badgeCount() {
  return urgentProducts().length;
}

/** Vrai si une clé API Claude est enregistrée sur cet iPhone. */
export function hasClaudeKey() {
  return Boolean(state.settings.claudeKey);
}

/**
 * Prénom de l'autre personne du foyer, d'après ce qu'elle a ajouté (stock et courses) ; '' si inconnu.
 * Le plus fréquent l'emporte, à égalité le plus récent.
 */
export function partnerName() {
  const me = (state.settings.userName || '').trim().toLowerCase();
  const seen = new Map();
  for (const item of [...state.products, ...state.shopping]) {
    const name = (item.addedBy || '').trim();
    if (!name || name.toLowerCase() === me) continue;
    const entry = seen.get(name) ?? { count: 0, last: 0 };
    seen.set(name, { count: entry.count + 1, last: Math.max(entry.last, item.createdAt || 0) });
  }
  return [...seen].sort((a, b) => b[1].count - a[1].count || b[1].last - a[1].last)[0]?.[0] ?? '';
}
