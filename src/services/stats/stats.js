// Kookia — Calculs des statistiques : dépensé, consommé, jeté, par mois et par catégorie.
// Un mouvement : { type: 'achat' | 'consomme' | 'jete', name, category, location, count, unitPrice, by, clientAt }.

import { category } from '../../data/reference/categories.js';
import { nameKey } from '../text/text.js';
import { cleanPrice, lineAmount, roundCents } from './money.js';
import { monthKey } from './periods.js';

const KEY_OF_TYPE = { achat: 'spent', consomme: 'consumed', jete: 'wasted' };

export function movementAmount(movement) {
  return lineAmount(movement.unitPrice, movement.count);
}

/** Montant exact (sans arrondi) : les sommes s'arrondissent à la fin, pas part par part (0,375 + 1,125 = 1,50). */
function exactAmount(movement) {
  const price = cleanPrice(movement.unitPrice);
  return price === null ? null : price * (Number(movement.count) > 0 ? Number(movement.count) : 1);
}

const rounded = (row) => ({ ...row, spent: roundCents(row.spent), consumed: roundCents(row.consumed), wasted: roundCents(row.wasted) });

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
  const amount = exactAmount(movement);
  if (key && amount !== null) totals[key] += amount;
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
  return { ...rounded(totals), wasteShare: out > 0 ? totals.wasted / out : null, unpriced };
}

/** Dépensé et jeté pour chaque mois demandé (mois sans mouvement : 0). */
export function monthlyTotals(movements, months) {
  const rows = new Map(months.map((month) => [month, { month, ...emptyTotals() }]));
  for (const m of movements) {
    const row = rows.get(monthKey(m.clientAt));
    if (row) add(row, m);
  }
  return [...rows.values()].map(rounded);
}

/** Par catégorie : dépensé et jeté, de la plus grosse dépense à la plus petite. */
export function categoryTotals(movements) {
  const rows = new Map();
  for (const m of movements) {
    const id = category(m.category).id;
    if (!rows.has(id)) rows.set(id, { category: id, ...emptyTotals() });
    add(rows.get(id), m);
  }
  return [...rows.values()].map(rounded)
    .filter((r) => r.spent > 0 || r.wasted > 0)
    .sort((a, b) => b.spent - a.spent || b.wasted - a.wasted);
}

/** Produits les plus jetés (regroupés par nom), en euros puis en nombre. */
export function topWasted(movements, limit = 5) {
  const rows = new Map();
  for (const m of movements.filter((x) => x.type === 'jete')) {
    const key = nameKey(m.name); // « Yaourts nature » et « Yaourt nature » : une seule ligne
    const row = rows.get(key) ?? { name: m.name, count: 0, amount: 0, priced: false };
    const amount = exactAmount(m);
    row.count = Math.round((row.count + m.count) * 1000) / 1000;
    if (amount !== null) {
      row.amount += amount;
      row.priced = true;
    }
    rows.set(key, row);
  }
  return [...rows.values()].map((r) => ({ ...r, amount: roundCents(r.amount) }))
    .sort((a, b) => b.amount - a.amount || b.count - a.count).slice(0, limit);
}

/** Prénoms présents dans les mouvements, par ordre alphabétique. */
export function peopleIn(movements) {
  return [...new Set(movements.map((m) => m.by || "Quelqu'un"))].sort((a, b) => a.localeCompare(b, 'fr'));
}
