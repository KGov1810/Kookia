// Kookia — Dates au format AAAA-MM-JJ (heure locale).

export const DAY = 86_400_000;

export function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseISODate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!match) return null;
  return makeDate(Number(match[1]), Number(match[2]), Number(match[3]));
}

export function addDays(date, days) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

export function isoInDays(days, today = new Date()) {
  return toISODate(addDays(startOfDay(today), days));
}

/** Jours calendaires restants (négatif si la date est dépassée). */
export function daysUntil(iso, today = new Date()) {
  const date = parseISODate(iso);
  if (!date) return 0;
  return Math.round((date - startOfDay(today)) / DAY);
}

export function hasDate(iso) {
  return parseISODate(iso) !== null;
}

export function makeDate(year, month, day) {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

export function addMonths(date, months) {
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

export function formatDate(iso, options = { day: 'numeric', month: 'short' }) {
  const date = parseISODate(iso);
  return date ? date.toLocaleDateString('fr-FR', options) : '';
}

/** 'expired' | 'soon' | 'ok' | 'pending' (date à compléter). */
export function statusOf(iso, alertDays, today = new Date()) {
  if (!hasDate(iso)) return 'pending';
  const days = daysUntil(iso, today);
  if (days < 0) return 'expired';
  if (days <= Math.max(0, alertDays)) return 'soon';
  return 'ok';
}

export function expiryLabel(iso, today = new Date()) {
  if (!hasDate(iso)) return 'Date à compléter';
  const days = daysUntil(iso, today);
  if (days < -1) return `Périmé depuis ${-days} jours`;
  if (days === -1) return 'Périmé depuis hier';
  if (days === 0) return "Expire aujourd'hui";
  if (days === 1) return 'Expire demain';
  if (days <= 30) return `Expire dans ${days} jours`;
  return `Jusqu'au ${formatDate(iso, { day: 'numeric', month: 'long', year: 'numeric' })}`;
}
