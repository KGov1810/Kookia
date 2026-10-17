// Kookia — Traduction d'une recette déjà enregistrée, pour un iPhone du foyer qui lit une autre langue.

import { callTool } from './client.js';
import { languageName, parseTranslations, TRANSLATION_ITEM } from './languages.js';

const TRANSLATE_TOOL = {
  name: 'traduire_recette',
  description: 'Enregistre la recette traduite.',
  input_schema: { type: 'object', properties: { traduction: TRANSLATION_ITEM }, required: ['traduction'] }
};

/** Renvoie { title, summary, storageTips, ingredients: [{ name, quantity, unit }], steps } dans la langue lang, ou null. */
export async function translateRecipe({ key, model, recipe, lang }) {
  const source = {
    titre: recipe.title,
    resume: recipe.summary ?? '',
    conseils_conservation: recipe.storageTips ?? '',
    ingredients: (recipe.ingredients ?? []).map((i) => ({ nom: i.name, quantite: i.quantity ?? '', unite: i.unit ?? '' })),
    etapes: recipe.steps ?? []
  };
  const prompt = [
    `Traduis cette recette en ${languageName(lang)} (langue = ${lang}), pour un foyer qui cuisine dans cette langue.`,
    "Garde les ingrédients dans le même ordre et le même nombre d'étapes ; quantités et unités dans l'usage de la langue (valeurs inchangées) ; n'ajoute et ne retire rien.",
    '',
    JSON.stringify(source),
    '',
    "Réponds uniquement avec l'outil traduire_recette."
  ].join('\n');
  const input = await callTool({
    key, model, system: 'Tu traduis des recettes de cuisine avec naturel et précision.', tool: TRANSLATE_TOOL,
    content: [{ type: 'text', text: prompt }], maxTokens: 4000, timeoutMs: 90_000
  });
  return parseTranslations([{ ...input.traduction, langue: lang }], [recipe.lang || 'fr', lang])[lang] ?? null;
}
