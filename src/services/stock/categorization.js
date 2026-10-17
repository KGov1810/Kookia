// Kookia — Catégorie et lieu proposés d'après le nom d'un produit.

import { CATEGORY_IDS, categoryFamily } from '../../data/reference/categories.js';
import * as WI from '../../data/reference/category-words-intl.js';
import * as W from '../../data/reference/category-words.js';
import { FOODS } from '../../data/reference/i18n/foods.js';
import { PRODUCE } from '../../data/reference/produce.js';
import { nameMatchScore } from '../text/text.js';

/** Noms d'un fruit ou légume du catalogue : français, puis anglais, espagnol et portugais. */
const produceNames = (item) => [...new Set([item.name, ...(FOODS[`fv.${item.name}`] ?? []).slice(1)])];

/** Fruit ou légume du catalogue correspondant à un nom, dans l'une des 4 langues (« tomates cerises » → Tomates). */
export function produceFor(name) {
  let best = null;
  let bestScore = 0;
  for (const item of PRODUCE) {
    const score = Math.max(...produceNames(item).map((known) => nameMatchScore(name, known)));
    if (score > bestScore) {
      best = item;
      bestScore = score;
    }
  }
  return best;
}

// Vocabulaire normalisé au chargement : mots forts et faibles, expressions (par premier mot).
const STRONG = new Map();
const WEAK = new Map();
const PHRASE_BY_FIRST = new Map();

/** « Pâtés » → pateviande (≠ « pâtes ») ; sinon minuscules, sans accents, au singulier et au masculin. */
function normalizeWord(raw) {
  const lower = raw.toLowerCase();
  if (/^p[aâ]tés?$/.test(lower)) return 'pateviande';
  if (/^th?és?$/.test(lower)) return 'thebev'; // « thé », « té » (≠ « the » anglais)
  const plain = lower.replace(/œ/g, 'oe').replace(/æ/g, 'ae').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const single = plain.length >= 4 ? plain.replace(/[sx]$/, '') : plain;
  return single.length > 4 && single.endsWith('ee') ? single.slice(0, -1) : single; // surgelée → surgele
}

/** Mots du nom, dans l'ordre, petits mots compris (« pain au chocolat ») ; sans marque entre parenthèses. */
export function categoryTokens(name) {
  return String(name ?? '').replace(/\([^)]*\)/g, ' ').split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w && !/^\d/.test(w) && (w.length > 1 || /^[aà]$/i.test(w)))
    .map(normalizeWord);
}

function addPhrase(tokens, id) {
  const list = PHRASE_BY_FIRST.get(tokens[0]) ?? [];
  list.push({ tokens, id });
  list.sort((a, b) => b.tokens.length - a.tokens.length); // la plus longue d'abord
  PHRASE_BY_FIRST.set(tokens[0], list);
}

function addWords(map, table) {
  for (const [id, words] of Object.entries(table)) {
    for (const word of words.split(' ')) {
      const tokens = categoryTokens(word);
      if (tokens.length > 1) addPhrase(tokens, id);
      else if (tokens.length && !map.has(tokens[0])) map.set(tokens[0], id);
    }
  }
}

addWords(STRONG, W.STRONG_WORDS);
addWords(WEAK, W.WEAK_WORDS);
for (const [id, phrases] of Object.entries(W.PHRASES)) phrases.forEach((text) => addPhrase(categoryTokens(text), id));
// Fruits et légumes du catalogue (et leurs traductions), puis le vocabulaire des autres langues.
for (const item of PRODUCE) {
  for (const known of produceNames(item)) {
    const tokens = categoryTokens(known);
    if (tokens.length > 1) addPhrase(tokens, item.type);
    if (tokens.length && !STRONG.has(tokens[0])) STRONG.set(tokens[0], item.type);
  }
}
addWords(STRONG, WI.STRONG_WORDS_INTL);
addWords(WEAK, WI.WEAK_WORDS_INTL);
for (const [id, phrases] of Object.entries(WI.PHRASES_INTL)) phrases.forEach((text) => addPhrase(categoryTokens(text), id));
const wordSet = (...texts) => new Set(texts.join(' ').split(' ').map(normalizeWord));
const QUALIFIERS = wordSet(W.QUALIFIER_WORDS, WI.QUALIFIER_WORDS_INTL);
const FROZEN = wordSet(W.FROZEN_WORDS, WI.FROZEN_WORDS_INTL);
const CONTAINERS = wordSet(W.CONTAINER_WORDS, WI.CONTAINER_WORDS_INTL);
const DRIED = wordSet(W.DRIED_WORDS, WI.DRIED_WORDS_INTL);
// Produits qu'une boîte ou un bocal fait passer en « Conserves » (pas une confiture en pot).
const CANNABLE = new Set(['fruits', 'legumes', 'poisson', 'viande', 'volaille', 'legumineuses', 'traiteur', 'feculents', null]);

function phraseAt(tokens, i) {
  return (PHRASE_BY_FIRST.get(tokens[i]) ?? []).find((ph) => ph.tokens.every((t, k) => tokens[i + k] === t)) ?? null;
}

/** Premier aliment nommé : expression ou mot fort ; à défaut, premier mot faible (« steak », « filet »). */
function headCategory(tokens) {
  let weak = null;
  for (let i = 0; i < tokens.length; i += 1) {
    const strong = phraseAt(tokens, i)?.id ?? STRONG.get(tokens[i]);
    if (strong) return strong;
    weak ??= WEAK.get(tokens[i]) ?? null;
  }
  return weak;
}

/**
 * Catégorie proposée d'après le nom, ou null si rien de sûr. Le premier aliment nommé l'emporte :
 * « Farine spéciale sauces » → farine, « Sauce au poivre » → sauce, « Rôti de dinde » → volaille.
 */
export function guessCategory(name) {
  const tokens = categoryTokens(name);
  if (!tokens.length) return null;
  const cut = tokens.findIndex((t, i) => i > 0 && QUALIFIERS.has(t));
  const head = headCategory(cut > 0 ? tokens.slice(0, cut) : tokens) ?? produceFor(name)?.type ?? null;
  if (tokens.some((t) => FROZEN.has(t))) return 'surgele';
  if (CANNABLE.has(head) && tokens.some((t) => CONTAINERS.has(t))) return 'conserves';
  if ((head === 'fruits' || head === 'legumes') && tokens.some((t) => DRIED.has(t))) return 'fruits_secs';
  return head;
}

const FRIDGE = new Set(['viande', 'volaille', 'charcuterie', 'poisson', 'oeufs', 'laitier', 'fromage', 'traiteur']);

/**
 * Reclasse un produit enregistré avec une ancienne catégorie trop large
 * (« Fruits et légumes », « Produits laitiers et œufs », « Viande et charcuterie », « Épicerie »).
 */
export function normalizeCategory(id, name) {
  const guess = guessCategory(name);
  const sameFamily = guess && categoryFamily(guess) === categoryFamily(id);
  switch (id) {
    case 'fruits_legumes': return sameFamily ? guess : 'legumes';
    case 'laitier': case 'viande': case 'epicerie': return sameFamily ? guess : id;
    default: return CATEGORY_IDS.includes(id) ? id : (guess ?? 'autre');
  }
}

/** Lieu habituel selon la catégorie (null = garder le lieu choisi). Ne sort jamais un produit du congélateur. */
export function defaultLocationFor(categoryId, name = '', current = '') {
  if (categoryId === 'surgele') return 'congelateur';
  if (current === 'congelateur') return null;
  if (categoryFamily(categoryId) === 'epicerie' || categoryId === 'boisson' || categoryId === 'boulangerie') return 'placard';
  if (categoryId === 'fruits' || categoryId === 'legumes') return produceFor(name)?.place ?? (categoryId === 'fruits' ? 'fruits' : 'frigo');
  if (FRIDGE.has(categoryId)) return 'frigo';
  return null;
}
