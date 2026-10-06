// Kookia — Lecture de la date de péremption dans un texte OCR.

import { addDays, makeDate, startOfDay, toISODate } from './dates.js';

const POSITIVE = ['consommer', 'dlc', 'ddm', 'dluo', 'exp', 'avant', 'jusqu', 'best before',
  'use by', 'bbe', 'peremption', 'preference', 'a conso'];

const NEGATIVE = ['emball', 'fabriq', 'produit le', 'fab.', 'abattu', 'peche le'];

const SEP = String.raw`(?:\s?[.\/\-]\s?|\s)`;

const NUMERIC = new RegExp(String.raw`(?<!\d)(\d{1,2})${SEP}(\d{1,2})${SEP}(\d{4}|\d{2})(?!\d)`, 'g');

const ISO = /(?<!\d)(\d{4})[.\/\-](\d{1,2})[.\/\-](\d{1,2})(?!\d)/g;

const MONTH_NAME = /(?<!\d)(\d{1,2})(?:er)?\s*([a-z]{3,9})\.?\s*(\d{4}|\d{2})(?!\d)/g;

const MONTH_YEAR = /(?<![\d.\/\-])(\d{1,2})\s?[.\/\-]\s?(\d{4})(?!\d)/g;

const MONTHS = [['janv', 1], ['jan', 1], ['fev', 2], ['feb', 2], ['mar', 3], ['avr', 4], ['apr', 4],
  ['mai', 5], ['may', 5], ['juin', 6], ['jun', 6], ['juil', 7], ['jul', 7], ['aou', 8], ['aug', 8],
  ['sep', 9], ['oct', 10], ['nov', 11], ['dec', 12]];

function normalizeLine(line) {
  return line
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    // Confusions fréquentes de l'OCR au milieu d'une date : O→0, l/i→1.
    .replace(/(?<=[\d.\/\-])[o](?=[\d.\/\-])/g, '0')
    .replace(/(?<=[\d.\/\-])[li](?=[\d.\/\-])/g, '1');
}

function expandYear(raw) {
  if (raw.length === 2) return 2000 + Number(raw);
  if (raw.length === 4) return Number(raw);
  return null;
}

function datesInLine(line) {
  const found = [];
  for (const m of line.matchAll(NUMERIC)) {
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = expandYear(m[3]);
    const bonus = m[3].length === 4 ? 1 : 0;
    const date = makeDate(year, month, day);
    if (date) found.push({ date, bonus });
    else {
      const us = makeDate(year, day, month); // format américain MM/JJ, moins probable
      if (us) found.push({ date: us, bonus: bonus - 1 });
    }
  }
  for (const m of line.matchAll(ISO)) {
    const date = makeDate(Number(m[1]), Number(m[2]), Number(m[3]));
    if (date) found.push({ date, bonus: 1 });
  }
  for (const m of line.matchAll(MONTH_NAME)) {
    const month = MONTHS.find(([prefix]) => m[2].startsWith(prefix))?.[1];
    if (!month) continue;
    const date = makeDate(expandYear(m[3]), month, Number(m[1]));
    if (date) found.push({ date, bonus: 1 });
  }
  for (const m of line.matchAll(MONTH_YEAR)) {
    const month = Number(m[1]);
    const year = Number(m[2]);
    if (month < 1 || month > 12) continue;
    found.push({ date: new Date(year, month, 0), bonus: -1 }); // dernier jour du mois
  }
  return found;
}

/**
 * Renvoie la date de péremption la plus probable (« AAAA-MM-JJ ») ou null.
 * Privilégie les dates précédées de « à consommer », « DLC », « EXP »…
 * et écarte « emballé le », « fabriqué le ».
 */
export function parseExpiryDate(lines, today = new Date()) {
  const start = startOfDay(today);
  const min = addDays(start, -60);
  const max = new Date(start.getFullYear() + 5, start.getMonth(), start.getDate());
  const normalized = lines.map(normalizeLine);
  const candidates = [];

  normalized.forEach((line, index) => {
    const previous = index > 0 ? normalized[index - 1] : '';
    let context = 0;
    if (POSITIVE.some((k) => line.includes(k))) context += 3;
    else if (POSITIVE.some((k) => previous.includes(k))) context += 2;
    if (NEGATIVE.some((k) => line.includes(k))) context -= 3;

    for (const { date, bonus } of datesInLine(line)) {
      if (date < min || date > max) continue;
      const score = 1 + context + bonus + (date >= start ? 1 : 0);
      candidates.push({ date, score });
    }
  });

  candidates.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    const aFuture = a.date >= start;
    const bFuture = b.date >= start;
    if (aFuture !== bFuture) return aFuture ? -1 : 1;
    return Math.abs(a.date - start) - Math.abs(b.date - start);
  });
  return candidates.length ? toISODate(candidates[0].date) : null;
}
