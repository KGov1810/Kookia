// Kookia — Poids ou volume total d'un lot (« 1,2 kg » pour 6 pommes), réparti par pièce.

const NUMBER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

const UNITS = [
  [/^(kg|kgs|kilos?|kilogrammes?)$/i, 'g', 1000],
  [/^(g|gr|grs|grammes?)$/i, 'g', 1],
  [/^(l|litres?)$/i, 'ml', 1000],
  [/^cl$/i, 'ml', 10],
  [/^ml$/i, 'ml', 1]
];

/**
 * « 1,2 kg » → { base: 'g', amount: 1200 }. Un nombre seul est lu en kilos s'il est petit
 * (« 1,2 » → 1,2 kg), en grammes sinon (« 800 » → 800 g). null si illisible.
 */
export function parseWeight(text) {
  const m = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]*)\.?$/.exec(String(text ?? '').trim());
  if (!m) return null;
  const value = Number(m[1].replace(',', '.'));
  if (!(value > 0)) return null;
  if (!m[2]) return value >= 50 ? { base: 'g', amount: value } : { base: 'g', amount: value * 1000 };
  const unit = UNITS.find(([pattern]) => pattern.test(m[2]));
  return unit ? { base: unit[1], amount: value * unit[2] } : null;
}

/** 200 g, 1,25 kg, 330 ml, 1,5 L. */
export function formatWeight({ base, amount }) {
  if (amount >= 1000) return `${NUMBER.format(amount / 1000)} ${base === 'g' ? 'kg' : 'L'}`;
  return `${Math.max(1, Math.round(amount))} ${base}`;
}

/**
 * Poids total d'un lot → poids d'une pièce, tel qu'enregistré (« 6 × 200 g »).
 * '' si rien n'est saisi ; null si illisible alors qu'il faut le répartir.
 * Une seule pièce : le texte est gardé (mis en forme s'il est lisible).
 */
export function weightPerPiece(text, count = 1) {
  const typed = String(text ?? '').trim();
  if (!typed) return '';
  const weight = parseWeight(typed);
  const pieces = Math.max(1, Math.round(Number(count) || 1));
  if (!weight) return pieces === 1 ? typed : null;
  return formatWeight({ ...weight, amount: weight.amount / pieces });
}

/** Unités proposées : fruits et légumes (poids seulement), autres produits (poids et liquides). */
export const PRODUCE_UNITS = ['g', 'kg'];
export const QUANTITY_UNITS = ['g', 'kg', 'cl', 'L'];

const CANONICAL = [[/^(kg|kgs|kilos?|kilogrammes?)$/i, 'kg'], [/^(g|gr|grs|grammes?)$/i, 'g'],
  [/^(l|litres?)$/i, 'L'], [/^cl$/i, 'cl'], [/^ml$/i, 'ml']];

/** Unité par défaut : le kilo pour les fruits et légumes, le gramme pour le reste. */
export function defaultUnit(category) {
  return category === 'fruits' || category === 'legumes' ? 'kg' : 'g';
}

/** « 1,2 » ou « 1.2 » → 1.2 ; null si ce n'est pas un nombre positif. */
export function amountValue(text) {
  const clean = String(text ?? '').trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(clean)) return null;
  const value = Number(clean);
  return value > 0 ? value : null;
}

/** Chiffre et unité → texte enregistré (« 1,2 kg ») ; '' si rien n'est tapé ; null si le chiffre est illisible. */
export function joinAmount(amount, unit) {
  if (!String(amount ?? '').trim()) return '';
  const value = amountValue(amount);
  return value === null ? null : `${String(value).replace('.', ',')} ${unit}`;
}

/**
 * Texte enregistré → { amount: '1,2', unit: 'kg' } dans les unités proposées (330 ml → 33 cl),
 * { amount: '500', unit: null } pour un nombre seul, ou null si le texte ne s'y prête pas (« 1 pot »).
 */
export function splitAmount(text, units = QUANTITY_UNITS) {
  const typed = String(text ?? '').trim();
  if (!typed) return { amount: '', unit: null };
  const m = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Z]*)\.?$/.exec(typed);
  if (!m) return null;
  const value = Number(m[1].replace(',', '.'));
  if (!m[2]) return { amount: String(value).replace('.', ','), unit: null };
  let unit = CANONICAL.find(([pattern]) => pattern.test(m[2]))?.[1];
  let amount = value;
  if (unit === 'ml' && !units.includes('ml') && units.includes('cl')) [unit, amount] = ['cl', value / 10];
  if (!unit || !units.includes(unit)) return null;
  return { amount: String(Math.round(amount * 1000) / 1000).replace('.', ','), unit };
}

/** Unités d'une ligne : g et kg pour les fruits et légumes, g, kg, cl et L pour le reste. */
export function unitsFor(category) {
  return category === 'fruits' || category === 'legumes' ? PRODUCE_UNITS : QUANTITY_UNITS;
}

/** Poids lu sur un ticket → { qtyAmount, qtyUnit, qtyLegacy, quantity } pour le champ chiffre + unité. */
export function receiptAmount(text, category) {
  const split = splitAmount(text, unitsFor(category));
  const typed = String(text ?? '').trim();
  if (!split) return { qtyAmount: typed, qtyUnit: null, qtyLegacy: true, quantity: typed };
  const unit = split.unit ?? defaultUnit(category);
  return { qtyAmount: split.amount, qtyUnit: unit, qtyLegacy: false, quantity: joinAmount(split.amount, unit) ?? '' };
}
