// Kookia — Texte : pluriels, durées, mots significatifs, ressemblance de noms.

export function plural(count, singular, pluralForm) {
  return `${count} ${count > 1 ? (pluralForm ?? `${singular}s`) : singular}`;
}

/** « 3 jours », « 5 mois », « 2 ans ». */
export function durationText(days) {
  if (days < 60) return plural(days, 'jour');
  if (days < 730) return `${Math.round(days / 30.4)} mois`;
  return plural(Math.floor(days / 365), 'an');
}

const STOPWORDS = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'a', 'en', 'et', 'un', 'une',
  'bio', 'avec', 'sans', 'pour', 'sur', 'the', 'and', 'of']);

/** Mots significatifs d'un nom : sans accents, sans marque entre parenthèses, au singulier. */
export function nameTokens(name) {
  const text = String(name ?? '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/œ/gi, 'oe').replace(/æ/gi, 'ae')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // Mots composés gardés entiers : « demi-écrémé », « pâte à tartiner ».
    .replace(/([a-z])\s*-\s*([a-z])/g, '$1-$2')
    .replace(/([a-z]{3,})\s+a\s+([a-z]{3,})/g, '$1-a-$2');
  return [...new Set(text.split(/[^a-z0-9-]+/)
    .map((t) => t.replace(/^-+|-+$/g, ''))
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
    .map((t) => (t.length > 3 ? t.replace(/[sx]$/, '') : t)))];
}

/**
 * Score de ressemblance entre deux noms (0 = différents).
 * Tous les mots du nom le plus court doivent figurer dans l'autre, et couvrir au moins
 * la moitié de ses mots : « Yaourt nature » ≈ « Yaourt nature (Danone) », mais
 * « Crème » ≠ « Crème dessert au chocolat ».
 */
export function nameMatchScore(a, b) {
  const ta = nameTokens(a);
  const tb = nameTokens(b);
  if (!ta.length || !tb.length) return 0;
  const [small, large] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const largeSet = new Set(large);
  if (!small.every((t) => largeSet.has(t))) return 0;
  const score = small.length / large.length;
  return score >= 0.5 ? score : 0;
}

export function normalizeBarcode(code) {
  return String(code ?? '').replace(/\D/g, '').replace(/^0+/, '');
}

export const simplify = (text) => String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
