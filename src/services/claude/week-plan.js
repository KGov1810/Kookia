// Kookia — Planning de la semaine par Claude : des recettes pour les repas choisis, en utilisant le stock
// intelligemment (ce qui périme d'abord, achats partagés, restes du soir, batch cooking) et les courses regroupées.

import { filterLines } from '../recipes/recipe-filters.js';
import { callTool } from './client.js';
import { parseRecipe, shoppingLines, stockDescriber } from './recipe-parse.js';
import { RECIPE_SYSTEM, RECIPE_TOOL } from './recipe-schema.js';

export const MEALS = ['midi', 'soir'];

const RECIPE_ITEM = RECIPE_TOOL.input_schema.properties.recettes.items;

const WEEK_TOOL = {
  name: 'planifier_semaine',
  description: 'Enregistre le planning des repas de la semaine.',
  input_schema: {
    type: 'object',
    properties: {
      strategie: { type: 'string', description: 'Deux phrases au plus : comment la semaine utilise le stock.' },
      recettes: {
        type: 'array',
        items: { ...RECIPE_ITEM, properties: { ref: { type: 'string', description: 'R1, R2…' }, ...RECIPE_ITEM.properties }, required: ['ref', ...RECIPE_ITEM.required] }
      },
      repas: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            jour: { type: 'string', description: 'J1, J2…' },
            repas: { type: 'string', enum: MEALS },
            recette: { type: 'string', description: 'Référence de la recette (R1…). Pour des restes : la recette du dîner de la veille.' },
            restes: { type: 'boolean', description: 'true : on mange les restes de cette recette, cuisinée la veille au soir.' }
          },
          required: ['jour', 'repas', 'recette', 'restes']
        }
      },
      batch: {
        type: 'object',
        description: 'Séance de batch cooking (seulement si elle est demandée).',
        properties: {
          jour: { type: 'string' },
          duree_minutes: { type: 'integer' },
          etapes: { type: 'array', items: { type: 'string' } },
          recettes: { type: 'array', items: { type: 'string' }, description: 'Recettes avancées par la séance (R1…).' }
        },
        required: ['jour', 'duree_minutes', 'etapes', 'recettes']
      },
      courses: {
        type: 'array',
        description: 'Tout ce qu\'il faut acheter pour la semaine, regroupé.',
        items: { type: 'object', properties: { nom: { type: 'string' }, quantite: { type: 'string' } }, required: ['nom', 'quantite'] }
      }
    },
    required: ['strategie', 'recettes', 'repas', 'courses']
  }
};

/** « J3 (mercredi 15 octobre) » pour le jour d'indice 2 à partir de start (AAAA-MM-JJ). */
export function weekDayLabel(start, day, options = { weekday: 'long', day: 'numeric', month: 'long' }) {
  const [y, m, d] = start.split('-').map(Number);
  return new Date(y, m - 1, d + day).toLocaleDateString('fr-FR', options);
}

function strategyLines({ leftovers, batchDay, start, servings }) {
  const lines = [
    "Ce qui périme d'abord : place les recettes qui utilisent les produits les plus proches de leur date (et les produits entamés) dans les premiers jours ; garde pour la fin de semaine ce qui se conserve (placard, congélateur, légumes qui se gardent). Un produit du congélateur se sort la veille : indique-le dans les étapes de la recette.",
    "Ingrédients partagés : chaque ingrédient acheté doit servir dans plusieurs recettes et être utilisé en entier (une botte de persil, un pot de crème, un paquet de lardons) ; évite les achats pour une seule recette. Jusqu'à 4 ingrédients à acheter par recette, de préférence partagés.",
    'Varie la semaine : pas deux fois le même type de plat, alterne viandes, poissons et plats végétariens selon le régime demandé.'
  ];
  if (leftovers) {
    lines.push(`Restes : pour un midi qui suit un soir planifié, prévois de préférence les restes de ce dîner (restes = true, recette = celle du dîner de la veille) quand le plat se réchauffe ou se mange froid ; ce dîner est alors préparé pour ${servings * 2} portions (portions = ${servings * 2}).`);
  }
  if (batchDay !== null && batchDay !== undefined) {
    lines.push(`Batch cooking : prévois une séance de préparation le J${batchDay + 1} (${weekDayLabel(start, batchDay)}), de 1 h à 2 h 30, qui avance plusieurs recettes de la semaine (cuire céréales et légumineuses, préparer sauces, légumes, marinades) ; décris-la dans batch et allège les étapes des recettes concernées (« utiliser le riz cuit le ${weekDayLabel(start, batchDay, { weekday: 'long' })} »).`);
  }
  return lines;
}

/**
 * products : stock (sans les périmés), du plus urgent au moins urgent ; shopping : liste de courses ;
 * slots : [{ day: 0..6, meal: 'midi' | 'soir' }] ; start : AAAA-MM-JJ du jour 0 ; batchDay : jour de la séance ou null.
 * Renvoie { strategy, recipes, slots: [{ day, meal, recipeId, leftovers }], batch, shopping: [{ name, quantity }] }.
 */
export async function generateWeekPlan({ key, model, products, shopping, filters, servings = 2, slots, start, leftovers = false, batchDay = null }) {
  const { refs, describe } = stockDescriber();
  const stockLines = products.map(describe);
  const listLines = shoppingLines(shopping);
  const days = [...new Set(slots.map((s) => s.day))].sort((a, b) => a - b);
  const wanted = days.map((day) => `- J${day + 1} (${weekDayLabel(start, day)}) : ${MEALS.filter((meal) => slots.some((s) => s.day === day && s.meal === meal)).join(' et ')}`);
  const prompt = [
    `Nous sommes le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}.`,
    '',
    'STOCK DE LA MAISON (du plus urgent au moins urgent) :',
    stockLines.length ? stockLines.join('\n') : '(vide)',
    '',
    'LISTE DE COURSES (articles prévus ou achetés, utilisables) :',
    listLines.length ? listLines.join('\n') : '(vide)',
    '',
    `REPAS À PLANIFIER (${slots.length}, et seulement ceux-là) :`,
    ...wanted,
    '',
    'CONTRAINTES :',
    `- Pour ${servings} personne${servings > 1 ? 's' : ''} (portions = ${servings}, sauf restes ou batch cooking).`,
    '- Chaque repas listé apparaît exactement une fois dans repas, avec une recette (ou des restes).',
    ...strategyLines({ leftovers, batchDay, start, servings }).map((l) => `- ${l}`),
    ...filterLines(filters).map((l) => `- ${l}`),
    "- courses : tout ce qu'il faut acheter (source « a_acheter ») pour la semaine, regroupé et additionné (« Crème fraîche » – « 2 × 20 cl »), sans ce qui est déjà au stock ni dans la liste de courses.",
    '',
    "Réponds uniquement avec l'outil planifier_semaine."
  ].join('\n');

  const input = await callTool({
    key, model, system: RECIPE_SYSTEM, tool: WEEK_TOOL,
    content: [{ type: 'text', text: prompt }], maxTokens: 16_000, timeoutMs: 300_000
  });

  const now = Date.now();
  const byRef = new Map();
  const recipes = (input.recettes ?? []).map((r, i) => {
    const recipe = parseRecipe(r, { products, refs, servings, createdAt: now - i });
    byRef.set(String(r.ref ?? '').trim().toUpperCase(), recipe.id);
    return recipe;
  });
  const dayOf = (text) => Number(/^J(\d+)$/i.exec(String(text ?? '').trim())?.[1]) - 1;
  const asked = new Set(slots.map((s) => `${s.day}-${s.meal}`));
  const seen = new Set();
  const planSlots = (input.repas ?? []).map((r) => ({
    day: dayOf(r.jour), meal: r.repas, recipeId: byRef.get(String(r.recette ?? '').trim().toUpperCase()) ?? null, leftovers: r.restes === true
  })).filter((s) => {
    const key = `${s.day}-${s.meal}`;
    if (!asked.has(key) || seen.has(key) || !s.recipeId) return false;
    seen.add(key);
    return true;
  });
  const batch = input.batch && batchDay !== null && batchDay !== undefined ? {
    day: Number.isInteger(dayOf(input.batch.jour)) && dayOf(input.batch.jour) >= 0 ? dayOf(input.batch.jour) : batchDay,
    minutes: Number(input.batch.duree_minutes) || 90,
    steps: (input.batch.etapes ?? []).filter(Boolean),
    recipeIds: (input.batch.recettes ?? []).map((ref) => byRef.get(String(ref).trim().toUpperCase())).filter(Boolean)
  } : null;
  return {
    strategy: String(input.strategie ?? '').trim(),
    recipes: recipes.filter((r) => planSlots.some((s) => s.recipeId === r.id)),
    slots: planSlots.sort((a, b) => a.day - b.day || MEALS.indexOf(a.meal) - MEALS.indexOf(b.meal)),
    batch,
    shopping: (input.courses ?? []).map((c) => ({ name: String(c.nom ?? '').trim(), quantity: String(c.quantite ?? '').trim() })).filter((c) => c.name)
  };
}
