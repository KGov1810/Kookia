// Kookia — Valeur du stock actuel : total, détail par lieu, montant à consommer vite.
// Calculée sur les produits en stock qui ont un prix (aucune lecture Firebase en plus).

import { LOCATIONS, locationOf } from '../../data/reference/locations.js';
import { stockStatus } from '../stock/stock-status.js';
import { lineAmount, roundCents } from './money.js';

export function stockValue(products, alertDays = 2, today = new Date()) {
  const places = new Map(LOCATIONS.map((loc) => [loc.id, { location: loc.id, amount: 0, count: 0 }]));
  const out = { total: 0, soon: 0, soonCount: 0, unpriced: 0, count: products.length };
  for (const product of products) {
    const place = places.get(locationOf(product.location).id);
    place.count += 1;
    const amount = lineAmount(product.unitPrice, product.count ?? 1);
    if (amount === null) {
      out.unpriced += 1;
      continue;
    }
    place.amount = roundCents(place.amount + amount);
    out.total = roundCents(out.total + amount);
    if (stockStatus(product, alertDays, today) === 'soon') {
      out.soon = roundCents(out.soon + amount);
      out.soonCount += 1;
    }
  }
  return { ...out, places: [...places.values()].filter((p) => p.count > 0) };
}
