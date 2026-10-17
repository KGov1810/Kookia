// Kookia — Langues des textes écrits par Claude : celle de l'iPhone qui demande, plus celles des autres iPhone du foyer.
// Les consignes restent en français ; seuls les textes destinés à l'utilisateur changent de langue.

import { LANGUAGE_IDS } from '../../data/reference/i18n/languages.js';

const NAMES = { fr: 'français', en: 'anglais (États-Unis)', es: 'espagnol (Amérique latine)', pt: 'portugais (Brésil)' };

export function languageName(id) {
  return NAMES[id] ?? NAMES.fr;
}

/** ['en', 'fr'] → langue principale 'en', traductions ['fr'] (langues inconnues ignorées, français par défaut). */
export function splitLanguages(langs = ['fr']) {
  const known = [...new Set(langs.filter((l) => LANGUAGE_IDS.includes(l)))];
  const [base = 'fr', ...others] = known;
  return { base, others };
}

/** Consignes de langue d'une demande de recettes ; extra : autres champs à écrire dans la langue (planning). */
export function languageLines(langs, extra = '') {
  const { base, others } = splitLanguages(langs);
  const lines = [`Langue : écris tous les textes destinés au foyer (titre, resume, conseils_conservation, nom et quantite des ingrédients, etapes${extra}) en ${languageName(base)} ; unités dans l'usage de cette langue.`];
  if (others.length) {
    lines.push(`Traductions : le foyer lit aussi ${others.map(languageName).join(' et ')}. Ajoute dans traductions une entrée par langue (${others.join(', ')}) : les mêmes textes traduits, les ingrédients dans le même ordre, quantités et unités dans l'usage de la langue.`);
  }
  return lines;
}

/** Une traduction de recette (outil) : mêmes textes, autre langue. */
export const TRANSLATION_ITEM = {
  type: 'object',
  properties: {
    langue: { type: 'string', enum: LANGUAGE_IDS },
    titre: { type: 'string' },
    resume: { type: 'string' },
    conseils_conservation: { type: 'string' },
    ingredients: {
      type: 'array',
      description: 'Dans le même ordre que les ingrédients de la recette.',
      items: { type: 'object', properties: { nom: { type: 'string' }, quantite: { type: 'string' }, unite: { type: 'string' } }, required: ['nom', 'quantite', 'unite'] }
    },
    etapes: { type: 'array', items: { type: 'string' } }
  },
  required: ['langue', 'titre', 'resume', 'conseils_conservation', 'ingredients', 'etapes']
};

/** Traductions reçues → { en: { title, summary, storageTips, ingredients: [{ name, quantity, unit }], steps } }. */
export function parseTranslations(list, langs) {
  const { others } = splitLanguages(langs);
  const out = {};
  for (const tr of Array.isArray(list) ? list : []) {
    if (!others.includes(tr?.langue) || out[tr.langue]) continue;
    out[tr.langue] = {
      title: String(tr.titre ?? '').trim(),
      summary: String(tr.resume ?? '').trim(),
      storageTips: String(tr.conseils_conservation ?? '').trim(),
      ingredients: (tr.ingredients ?? []).map((i) => ({ name: String(i?.nom ?? '').trim(), quantity: String(i?.quantite ?? '').trim(), unit: String(i?.unite ?? '').trim() })),
      steps: (tr.etapes ?? []).map((s) => String(s ?? '').trim()).filter(Boolean)
    };
  }
  return out;
}
