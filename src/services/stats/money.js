// Kookia — Prix : lecture d'une saisie (« 2,49 », « 2.49 € »), arrondi et affichage en euros.

const EURO = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

/** Prix enregistrable (nombre ≥ 0, au dixième de centime) ou null s'il est inconnu. */
export function cleanPrice(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0 || n >= 100_000) return null;
  return Math.round(n * 1000) / 1000;
}

export function roundCents(value) {
  return Math.round(value * 100) / 100;
}

/** Saisie libre → prix, ou null (champ vide ou illisible). */
export function parsePrice(text) {
  const clean = String(text ?? '')
    .replace(/[€\s\u00a0\u202f]/g, '')
    .replace(/eur(os?)?$/i, '')
    .replace(',', '.');
  if (!clean || !/^\d+(\.\d+)?$/.test(clean)) return null;
  return cleanPrice(Number(clean));
}

/** « 2,49 € » (espaces insécables remplacés par des espaces simples). */
export function formatEuro(value) {
  return EURO.format(roundCents(Number(value) || 0)).replace(/[\u00a0\u202f]/g, ' ');
}

/** Valeur du champ de saisie : « 2,49 », ou vide si le prix est inconnu. */
export function priceInputValue(value) {
  const price = cleanPrice(value);
  return price === null ? '' : roundCents(price).toFixed(2).replace('.', ',');
}

/** Montant d'un lot : prix unitaire × nombre (null si le prix est inconnu). */
export function lineAmount(unitPrice, count = 1) {
  const price = cleanPrice(unitPrice);
  return price === null ? null : roundCents(price * Math.max(1, Number(count) || 1));
}
