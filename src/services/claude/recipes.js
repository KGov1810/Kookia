// Kookia — Génération de recettes par Claude.

import { filterLines } from '../recipes/recipe-filters.js';
import { callTool } from './client.js';
import { languageLines } from './languages.js';
import { parseRecipe, shoppingLines, stockDescriber } from './recipe-parse.js';
import { RECIPE_SYSTEM, RECIPE_TOOL } from './recipe-schema.js';

/**
 * priority / others : produits { id, name, quantity, category, expiry }
 * shopping : articles { name, quantity, checked } ; langs : langues du foyer (celle de l'iPhone d'abord).
 */
export async function generateRecipes({ key, model, priority, others, shopping, filters, servings = 2, count = 5, extraLines = [], langs = ['fr'] }) {
  const { refs, describe } = stockDescriber();
  const priorityLines = priority.map(describe);
  const otherLines = others.map(describe);
  const listLines = shoppingLines(shopping);
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const prompt = [
    `Nous sommes le ${today}.`,
    '',
    'PRODUITS À UTILISER EN PRIORITÉ (proches de leur date) :',
    priorityLines.length ? priorityLines.join('\n') : '(aucun : pioche librement dans le stock)',
    '',
    'AUTRES PRODUITS DISPONIBLES À LA MAISON (frigo, congélateur, placard, fruits et légumes) :',
    otherLines.length ? otherLines.join('\n') : '(aucun)',
    '',
    'LISTE DE COURSES (articles prévus ou achetés, utilisables) :',
    listLines.length ? listLines.join('\n') : '(vide)',
    '',
    'CONTRAINTES :',
    `- Propose exactement ${count} recettes variées (pas deux fois le même type de plat).`,
    `- Pour ${servings} personne${servings > 1 ? 's' : ''} (portions = ${servings}, sauf batch cooking).`,
    ...(priorityLines.length ? ["- Chaque recette doit utiliser au moins un produit prioritaire ; l'ensemble des recettes doit couvrir tous les produits prioritaires utilisables."] : []),
    ...filterLines(filters).map((l) => `- ${l}`),
    ...extraLines.map((l) => `- ${l}`),
    ...languageLines(langs).map((l) => `- ${l}`),
    '',
    "Réponds uniquement avec l'outil proposer_recettes."
  ].join('\n');

  const input = await callTool({
    key, model, system: RECIPE_SYSTEM, tool: RECIPE_TOOL,
    // Chaque langue en plus ajoute environ 75 % de texte à écrire.
    content: [{ type: 'text', text: prompt }], maxTokens: Math.min(20_000, Math.round(8000 * (1 + 0.75 * (langs.length - 1)))), timeoutMs: langs.length > 1 ? 240_000 : 180_000
  });

  const products = [...priority, ...others];
  const now = Date.now();
  // createdAt décroissant : conserve l'ordre de Claude
  return (input.recettes ?? []).map((r, i) => parseRecipe(r, { products, refs, servings, createdAt: now - i, langs }));
}
