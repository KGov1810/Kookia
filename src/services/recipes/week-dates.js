// Kookia — Dates du planning de la semaine : jour, semaine en toutes lettres, jour du planning aujourd'hui.

import { language, localeTag, t } from '../i18n/i18n.js';

function dayDate(start, day) {
  const [y, m, d] = start.split('-').map(Number);
  return new Date(y, m - 1, d + day);
}

/** « mercredi 15 octobre » pour le jour d'indice 2 à partir de start (AAAA-MM-JJ) ; lang : 'fr' pour Claude. */
export function weekDayLabel(start, day, options = { weekday: 'long', day: 'numeric', month: 'long' }, lang) {
  return dayDate(start, day).toLocaleDateString(localeTag(lang), options);
}

/** « Du 14 au 20 octobre », « Du 28 septembre au 4 octobre » ; « October 14 – 20 » dans les autres langues. */
export function weekRangeLabel(start, lang = language()) {
  const options = { day: 'numeric', month: 'long' };
  if (lang !== 'fr') {
    const format = new Intl.DateTimeFormat(localeTag(lang), options);
    if (format.formatRange) return format.formatRange(dayDate(start, 0), dayDate(start, 6));
  }
  const first = weekDayLabel(start, 0, options, lang);
  const last = weekDayLabel(start, 6, options, lang);
  const sameMonth = first.split(' ').slice(1).join(' ') === last.split(' ').slice(1).join(' ');
  return t('week.range', { from: sameMonth ? first.split(' ')[0] : first, to: last }, lang);
}

/** Jour du planning correspondant à aujourd'hui (0 = premier jour ; négatif avant, 7 et plus après la semaine). */
export function planDayIndex(start, today = new Date()) {
  const [y, m, d] = start.split('-').map(Number);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((now - new Date(y, m - 1, d)) / 86_400_000);
}
