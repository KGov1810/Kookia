// Kookia — Génération de recettes par Claude.

import { category } from '../../data/reference/categories.js';
import { originOf } from '../../data/reference/origins.js';
import { quantityLabel } from '../quantities/quantities.js';
import { filterLines } from '../recipes/recipe-filters.js';
import { promptStock } from '../stock/stock-status.js';
import { nameMatchScore } from '../text/text.js';
import { callTool } from './client.js';
import { RECIPE_SYSTEM, RECIPE_TOOL } from './recipe-schema.js';

/**
 * priority / others : produits { id, name, quantity, category, expiry }
 * shopping : articles { name, quantity, checked }
 */
export async function generateRecipes({ key, model, priority, others, shopping, filters, servings = 2, count = 5 }) {
  const refs = new Map();
  let index = 0;
  const describe = (p) => {
    index += 1;
    refs.set(`P${index}`, p.id);
    const parts = [`[P${index}] ${p.name}`];
    if (quantityLabel(p)) parts.push(`quantité : ${quantityLabel(p)}`);
    parts.push(category(p.category).label.toLowerCase(), promptStock(p));
    return `- ${parts.join(' – ')}`;
  };
  const priorityLines = priority.map(describe);
  const otherLines = others.map(describe);
  const shoppingLines = shopping.map((i) => `- ${i.name}${i.quantity ? ` (${i.quantity})` : ''}${i.checked ? ' – déjà acheté' : ''}`);
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
    shoppingLines.length ? shoppingLines.join('\n') : '(vide)',
    '',
    'CONTRAINTES :',
    `- Propose exactement ${count} recettes variées (pas deux fois le même type de plat).`,
    `- Pour ${servings} personne${servings > 1 ? 's' : ''} (portions = ${servings}, sauf batch cooking).`,
    ...(priorityLines.length ? ["- Chaque recette doit utiliser au moins un produit prioritaire ; l'ensemble des recettes doit couvrir tous les produits prioritaires utilisables."] : []),
    ...filterLines(filters).map((l) => `- ${l}`),
    '',
    "Réponds uniquement avec l'outil proposer_recettes."
  ].join('\n');

  const input = await callTool({
    key, model, system: RECIPE_SYSTEM, tool: RECIPE_TOOL,
    content: [{ type: 'text', text: prompt }], maxTokens: 8000, timeoutMs: 180_000
  });

  const all = [...priority, ...others];
  const now = Date.now();
  return (input.recettes ?? []).map((r, i) => {
    const ingredients = (r.ingredients ?? []).map((item) => {
      let source = ['stock', 'courses', 'placard', 'a_acheter'].includes(item.source) ? item.source : 'a_acheter';
      const ref = String(item.ref_stock ?? '').replace(/[[\]\s]/g, '').toUpperCase();
      let product = all.find((p) => p.id === refs.get(ref)) ?? null;
      if (!product && source === 'stock') {
        product = all
          .map((p) => ({ p, score: nameMatchScore(item.nom, p.name) }))
          .filter((x) => x.score > 0)
          .sort((a, b) => b.score - a.score)[0]?.p ?? null;
      }
      if (product) source = 'stock';
      return {
        name: item.nom ?? '',
        quantity: item.quantite ?? '',
        amount: Number(item.valeur) > 0 ? Number(item.valeur) : null,
        unit: String(item.unite ?? '').trim(),
        source,
        productId: product?.id ?? null,
        // Mémorisés pour retrouver le produit s'il est racheté plus tard.
        barcode: product?.barcode ?? '',
        productName: product?.name ?? '',
        category: product?.category ?? ''
      };
    });
    return {
      id: crypto.randomUUID(),
      title: r.titre ?? 'Recette',
      summary: r.resume ?? '',
      difficulty: ['facile', 'moyen', 'difficile'].includes(r.difficulte) ? r.difficulte : 'moyen',
      totalMinutes: Number(r.temps_total_minutes) || 30,
      prepMinutes: Number(r.temps_preparation_minutes) || 15,
      servings: Number(r.portions) || servings,
      diet: ['vegan', 'vegetarien', 'omnivore'].includes(r.regime) ? r.regime : 'omnivore',
      origin: originOf(r.origine) ? r.origine : 'autre',
      kcal: Number(r.calories_par_portion) > 0 ? Math.round(Number(r.calories_par_portion)) : null,
      batchCooking: Boolean(r.batch_cooking),
      storageDays: Number(r.conservation_jours) || 0,
      storageTips: r.conseils_conservation ?? '',
      ingredients,
      steps: r.etapes ?? [],
      usedProductIds: [...new Set(ingredients.map((x) => x.productId).filter(Boolean))],
      createdAt: now - i, // conserve l'ordre de Claude
      favorite: false
    };
  });
}
