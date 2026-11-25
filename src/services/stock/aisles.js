// Kookia — Rayons du magasin : rayon d'une catégorie, ordre choisi par le foyer, liste de courses rangée par rayon.

import { AISLES, AISLE_IDS } from '../../data/reference/aisles.js';

/** Rayon d'une catégorie (« fromage » → crèmerie) ; « autre » si la catégorie est inconnue. */
export function aisleOfCategory(category) {
  return AISLES.find((a) => a.categories.includes(category))?.id ?? 'autre';
}

/** Ordre des rayons : celui du foyer (rayons inconnus ignorés), complété des rayons manquants dans l'ordre type. */
export function orderedAisles(order) {
  const chosen = Array.isArray(order) ? [...new Set(order.filter((id) => AISLE_IDS.includes(id)))] : [];
  return [...chosen, ...AISLE_IDS.filter((id) => !chosen.includes(id))];
}

/** Monte (delta = -1) ou descend (+1) un rayon ; l'ordre est renvoyé inchangé au bout de la liste. */
export function moveAisle(order, id, delta) {
  const list = orderedAisles(order);
  const from = list.indexOf(id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= list.length) return list;
  [list[from], list[to]] = [list[to], list[from]];
  return list;
}

/** Ordre type : celui de la liste des rayons (un ordre enregistré identique n'a pas besoin d'être gardé). */
export function isDefaultAisleOrder(order) {
  return orderedAisles(order).every((id, i) => id === AISLE_IDS[i]);
}

/**
 * Regroupe des articles par rayon, dans l'ordre choisi : [{ aisle, items }], sans rayon vide.
 * aisleOf(item) donne le rayon d'un article ; l'ordre des articles d'un rayon est gardé.
 */
export function groupByAisle(items, aisleOf, order) {
  const groups = new Map(orderedAisles(order).map((id) => [id, []]));
  items.forEach((item) => {
    const aisle = aisleOf(item);
    groups.get(AISLE_IDS.includes(aisle) ? aisle : 'autre').push(item);
  });
  return [...groups].filter(([, list]) => list.length).map(([aisle, list]) => ({ aisle, items: list }));
}
