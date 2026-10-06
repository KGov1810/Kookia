// Kookia — Quantités d'une recette selon le nombre de personnes.

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

function parseNumber(text) {
  if (!text) return null;
  if (FRACTIONS[text] !== undefined) return FRACTIONS[text];
  const fraction = /^(\d+)\/(\d+)$/.exec(text);
  if (fraction) return Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : null;
  const value = Number(text.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/** Lit « 250 g », « 1/2 oignon », « 1 ½ c. à soupe », « 2 pots » → { value, unit } ou null. */
export function parseAmount(text) {
  const m = /^\s*(\d+\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔])(?:\s*([½¼¾⅓⅔]|\d+\/\d+)(?!\d))?\s*(.*)$/.exec(String(text ?? ''));
  if (!m) return null;
  const whole = parseNumber(m[1]);
  if (whole === null) return null;
  const part = m[2] ? parseNumber(m[2]) : 0;
  return { value: whole + (part ?? 0), unit: m[3].trim() };
}

function formatNumber(value) {
  return String(Math.round(value * 100) / 100).replace('.', ',');
}

/** Arrondi lisible selon l'unité : 437 g → 440 g ; 1,5 oignon → 1 ½ oignon. */
export function formatAmount(value, unit = '') {
  const u = unit.trim();
  const key = u.toLowerCase();
  let text;
  if (key === 'g' || key === 'ml') {
    const step = value >= 100 ? 10 : value >= 20 ? 5 : 1;
    text = String(Math.max(step, Math.round(value / step) * step));
  } else if (key === 'kg' || key === 'l') {
    text = formatNumber(Math.max(0.05, Math.round(value * 20) / 20));
  } else if (key === 'cl') {
    text = String(Math.max(1, Math.round(value)));
  } else {
    // Pièces, pots, cuillères… : au demi près.
    const halves = Math.max(1, Math.round(value * 2));
    const whole = Math.floor(halves / 2);
    text = halves % 2 ? (whole ? `${whole} ½` : '½') : String(whole);
  }
  return u ? `${text} ${u}` : text;
}

/** Quantité d'un ingrédient pour un facteur donné (1 = recette d'origine). */
export function scaleIngredient(ingredient, factor = 1) {
  const original = ingredient.quantity ?? '';
  if (!factor || Math.abs(factor - 1) < 1e-9) return original;
  if (Number(ingredient.amount) > 0) return formatAmount(ingredient.amount * factor, ingredient.unit ?? '');
  const parsed = parseAmount(original);
  return parsed ? formatAmount(parsed.value * factor, parsed.unit) : original; // « une pincée » : inchangé
}
