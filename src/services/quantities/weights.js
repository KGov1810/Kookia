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
