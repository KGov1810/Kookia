// Kookia — Traductions : la langue de cet iPhone, t('clé', { n, nom }) et les formats de date et de nombre.
// Chaque texte des dictionnaires est [français, anglais, espagnol, portugais] ; un texte qui dépend d'un nombre
// est une paire [singulier, pluriel], choisie selon les règles de la langue (en français, 0 et 1 sont au singulier).

import { STRINGS } from '../../data/reference/i18n/index.js';
import { LANGUAGES, LANGUAGE_IDS } from '../../data/reference/i18n/languages.js';

let current = 'fr';
const rules = new Map();
const lists = new Map();

/** Langue de l'iPhone si l'app la connaît, sinon le français. */
export function detectLanguage(preferred = globalThis.navigator?.languages ?? [globalThis.navigator?.language ?? 'fr']) {
  for (const tag of preferred) {
    const id = String(tag).toLowerCase().split('-')[0];
    if (LANGUAGE_IDS.includes(id)) return id;
  }
  return 'fr';
}

/** Langue choisie dans Réglages ('' = celle de l'iPhone). Renvoie vrai si elle a changé. */
export function setLanguage(choice = '') {
  const next = LANGUAGE_IDS.includes(choice) ? choice : detectLanguage();
  const changed = next !== current;
  current = next;
  if (globalThis.document?.documentElement) globalThis.document.documentElement.lang = next;
  return changed;
}

export function language() {
  return current;
}

/** Format des dates et des nombres de la langue : « fr-FR », « en-US », « es-419 », « pt-BR ». */
export function localeTag(lang = current) {
  return LANGUAGES.find((l) => l.id === lang)?.tag ?? 'fr-FR';
}

function pluralIndex(n, lang) {
  if (!rules.has(lang)) rules.set(lang, new Intl.PluralRules(localeTag(lang)));
  return rules.get(lang).select(n) === 'one' ? 0 : 1;
}

/** Texte traduit ; {n}, {name}… sont remplacés par les valeurs données. Texte manquant : le français. */
export function t(key, params = {}, lang = current) {
  const entry = STRINGS[key];
  if (!entry) return key;
  let text = entry[LANGUAGE_IDS.indexOf(lang)] ?? entry[0];
  if (Array.isArray(text)) text = text[pluralIndex(Number(params.n) || 0, lang)];
  return text.replace(/\{(\w+)\}/g, (match, name) => (params[name] ?? match));
}

/** « Courgettes, comté et crème », « zucchini, cheese and cream »… */
export function listText(items, lang = current) {
  if (!lists.has(lang)) lists.set(lang, new Intl.ListFormat(localeTag(lang), { type: 'conjunction' }));
  return lists.get(lang).format(items.map(String));
}
