// Kookia — Périodes des statistiques (mois calendaires, heure locale).

export const STATS_PERIODS = [
  { id: 'mois', label: 'Ce mois', months: 1 },
  { id: '3mois', label: '3 mois', months: 3 },
  { id: '12mois', label: '12 mois', months: 12 },
  { id: 'tout', label: 'Tout', months: 0 }
];

export const DEFAULT_STATS_PERIOD = '12mois';

/** « 2026-10 » pour une date (ou un instant en millisecondes). */
export function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Début de la période (1er du mois, minuit), en millisecondes ; 0 pour « Tout ». */
export function periodStart(id, now = new Date()) {
  const period = STATS_PERIODS.find((p) => p.id === id) ?? STATS_PERIODS[0];
  if (!period.months) return 0;
  return new Date(now.getFullYear(), now.getMonth() - (period.months - 1), 1).getTime();
}

/** Mois de la période, du plus ancien au plus récent (« Tout » : depuis le premier mouvement). */
export function periodMonths(id, movements = [], now = new Date()) {
  const start = periodStart(id, now);
  const first = start || Math.min(now.getTime(), ...movements.map((m) => m.clientAt));
  const cursor = new Date(new Date(first).getFullYear(), new Date(first).getMonth(), 1);
  const end = monthKey(now);
  const months = [];
  while (monthKey(cursor) <= end && months.length < 600) {
    months.push(monthKey(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

/** « Octobre 2026 » (long), « oct » (court) ou « O » (une lettre, quand les mois sont nombreux). */
export function monthLabel(key, { long = false, narrow = false } = {}) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  if (long) {
    const text = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
  if (narrow) return date.toLocaleDateString('fr-FR', { month: 'narrow' }).toUpperCase();
  return date.toLocaleDateString('fr-FR', { month: 'short' }).replace(/\.$/, '');
}
