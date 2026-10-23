// Kookia — Achats fréquents : ce que le foyer achète souvent (mouvements « achat »), pour « À racheter ».

import { toISODate } from '../dates/dates.js';
import { nameKey, nameTokens } from '../text/text.js';

/**
 * Même produit, au sens large : tous les mots du nom le plus court figurent dans l'autre (« Œufs » et « Œufs plein
 * air », « Pain » et « Pain de mie »). Sert à ne pas proposer ce qui est déjà en stock ou sur la liste.
 */
export function sameItem(a, b) {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.length || !tb.length) return false;
  const [small, large] = ta.length <= tb.length ? [ta, new Set(tb)] : [tb, new Set(ta)];
  return small.every((word) => large.has(word));
}

/**
 * Produits achetés au moins « minTimes » jours différents (un ticket avec 4 yaourts compte une fois), du plus
 * souvent au moins souvent, puis du plus récent : [{ key, name, times, last }]. Le nom est celui du dernier achat.
 */
export function frequentPurchases(purchases, { minTimes = 2 } = {}) {
  const groups = new Map();
  for (const p of purchases) {
    if (p.type !== 'achat' || !p.name?.trim()) continue;
    const key = nameKey(p.name); // « Yaourts nature » = « Yaourt nature »
    if (!key) continue;
    const group = groups.get(key) ?? { key, name: p.name.trim(), days: new Set(), last: 0 };
    group.days.add(toISODate(new Date(p.clientAt)));
    if (p.clientAt >= group.last) {
      group.last = p.clientAt;
      group.name = p.name.trim();
    }
    groups.set(key, group);
  }
  return [...groups.values()]
    .map(({ key, name, days, last }) => ({ key, name, times: days.size, last }))
    .filter((g) => g.times >= minTimes)
    .sort((a, b) => b.times - a.times || b.last - a.last);
}
