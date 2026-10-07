// Kookia — Calculs des statistiques : dépensé, consommé, jeté, par mois et par catégorie.
// Un mouvement : { type: 'achat' | 'consomme' | 'jete', name, category, location, count, unitPrice, by, clientAt }.

import { category } from '../../data/reference/categories.js';
import { nameTokens } from '../text/text.js';
import { lineAmount, roundCents } from './money.js';
import { monthKey } from './periods.js';

const KEY_OF_TYPE = { achat: 'spent', consomme: 'consumed', jete: 'wasted' };

export function movementAmount(movement) {
  return lineAmount(movement.unitPrice, movement.count);
}

/**
 * Filtres : what = '' (tout), « rayon:Frais » ou « cat:fromage » ;
 * location = lieu de rangement ; person = prénom de qui a fait l'action.
 */
export function filterMovements(movements, { what = '', location = '', person = '' } = {}) {
  return movements.filter((m) => {
    if (location && m.location !== location) return false;
    if (person && (m.by || "Quelqu'un") !== person) return false;
    if (what.startsWith('rayon:')) return category(m.category).group === what.slice(6);
    if (what.startsWith('cat:')) return m.category === what.slice(4);
    return true;
  });
}

function emptyTotals() {
  return { spent: 0, consumed: 0, wasted: 0 };
}

function add(totals, movement) {
  const key = KEY_OF_TYPE[movement.type];
  const amount = movementAmount(movement);
  if (key && amount !== null) totals[key] = roundCents(totals[key] + amount);
}

/** Totaux de la période, part jetée et mouvements sans prix (non comptés). */
export function summarize(movements) {
  const totals = emptyTotals();
  const unpriced = { achat: 0, consomme: 0, jete: 0 };
  for (const m of movements) {
    if (movementAmount(m) === null) {
      if (m.type in unpriced) unpriced[m.type] += 1;
    } else {
      add(totals, m);
    }
  }
  const out = totals.consumed + totals.wasted;
  return { ...totals, wasteShare: out > 0 ? totals.wasted / out : null, unpriced };
}

/** Dépensé et jeté pour chaque mois demandé (mois sans mouvement : 0). */
export function monthlyTotals(movements, months) {
  const rows = new Map(months.map((month) => [month, { month, ...emptyTotals() }]));
  for (const m of movements) {
    const row = rows.get(monthKey(m.clientAt));
    if (row) add(row, m);
  }
  return [...rows.values()];
}

/** Par catégorie : dépensé et jeté, de la plus grosse dépense à la plus petite. */
export function categoryTotals(movements) {
  const rows = new Map();
  for (const m of movements) {
    const id = category(m.category).id;
    if (!rows.has(id)) rows.set(id, { category: id, ...emptyTotals() });
    add(rows.get(id), m);
  }
  return [...rows.values()]
    .filter((r) => r.spent > 0 || r.wasted > 0)
    .sort((a, b) => b.spent - a.spent || b.wasted - a.wasted);
}

/** Produits les plus jetés (regroupés par nom), en euros puis en nombre. */
export function topWasted(movements, limit = 5) {
  const rows = new Map();
  for (const m of movements.filter((x) => x.type === 'jete')) {
    const key = nameTokens(m.name).sort().join(' ') || m.name.toLowerCase();
    const row = rows.get(key) ?? { name: m.name, count: 0, amount: 0, priced: false };
    const amount = movementAmount(m);
    row.count += m.count;
    if (amount !== null) {
      row.amount = roundCents(row.amount + amount);
      row.priced = true;
    }
    rows.set(key, row);
  }
  return [...rows.values()].sort((a, b) => b.amount - a.amount || b.count - a.count).slice(0, limit);
}

/** Prénoms présents dans les mouvements, par ordre alphabétique. */
export function peopleIn(movements) {
  return [...new Set(movements.map((m) => m.by || "Quelqu'un"))].sort((a, b) => a.localeCompare(b, 'fr'));
}
