// Kookia — Noms affichés des lieux, catégories, rayons, types de date et fruits et légumes, dans la langue de l'iPhone.
// Les données gardent l'identifiant (ou le nom français) ; Claude reçoit toujours les noms français.

import { category } from '../../data/reference/categories.js';
import { LANGUAGES } from '../../data/reference/i18n/languages.js';
import { locationOf } from '../../data/reference/locations.js';
import { language, localeTag, t } from './i18n.js';

/** « Frigo », « Fridge »… */
export function placeName(id, lang) {
  return t(`loc.${locationOf(id).id}`, {}, lang);
}

/** « au frigo », « in the fridge »… */
export function placeAt(id, lang) {
  return t(`at.${locationOf(id).id}`, {}, lang);
}

export function categoryName(id, lang) {
  return t(`cat.${category(id).id}`, {}, lang);
}

export function groupName(group, lang) {
  return t(`group.${group}`, {}, lang);
}

/** « Jusqu'au (DLC) », « Use by »… */
export function kindName(kind, lang) {
  return t(`kind.${kind}`, {}, lang);
}

/** Nom d'un fruit ou légume du catalogue (nom français en entrée) ; un nom inconnu reste tel quel. */
export function produceName(name, lang) {
  const key = `fv.${name}`;
  const text = t(key, {}, lang);
  return text === key ? name : text;
}

/** Cuisine : « Italienne », « Italian »… (« Tour du monde » pour 'monde'). */
export function originName(id, lang) {
  return t(`origin.${id}`, {}, lang);
}

/** Régime : « Végétarien », « Vegetarian »… ('' : tous). */
export function dietName(id, lang) {
  return t(`diet.${id ?? ''}`, {}, lang);
}

export function difficultyName(id, lang) {
  const key = `difficulty.${id ?? ''}`;
  const text = t(key, {}, lang);
  return text === key ? String(id ?? '') : text;
}

/** Nom au milieu d'une phrase : en minuscule (« cuisine italienne »), sauf en anglais (« Italian cuisine »). */
export function inSentence(text, lang = language()) {
  return lang === 'en' ? String(text ?? '') : String(text ?? '').toLocaleLowerCase(localeTag(lang));
}

/** « Français », « English »… (nom de la langue dans cette langue). */
export function languageLabel(id) {
  return LANGUAGES.find((l) => l.id === id)?.label ?? String(id ?? '');
}

export function capitalize(text) {
  return String(text ?? '').replace(/^./, (c) => c.toUpperCase());
}
