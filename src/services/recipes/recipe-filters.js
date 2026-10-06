// Kookia — Filtres des recettes et consignes correspondantes pour Claude.

import { originOf } from '../../data/reference/origins.js';
import { daysUntil, hasDate } from '../dates/dates.js';
import { nameTokens } from '../text/text.js';

/** Nombre maximal d'ingrédients à acheter par recette. */
export function maxPurchases(filters) {
  return (filters.origins?.length || (filters.wish ?? '').trim()) ? 6 : 2;
}

function recipeText(recipe) {
  return [recipe.title, recipe.summary, ...(recipe.ingredients ?? []).map((i) => i.name)].join(' ');
}

export function isBatchFriendly(recipe) {
  return recipe.batchCooking && recipe.storageDays >= 2;
}

export function matchesFilters(recipe, filters) {
  if (filters.difficulty && recipe.difficulty !== filters.difficulty) return false;
  if (filters.maxMinutes && recipe.totalMinutes > filters.maxMinutes) return false;
  if (filters.batchOnly && !isBatchFriendly(recipe)) return false;
  // Les recettes sans régime ni calories (créées avant) sont écartées par prudence.
  if (filters.diet === 'vegan' && recipe.diet !== 'vegan') return false;
  if (filters.diet === 'vegetarien' && !['vegetarien', 'vegan'].includes(recipe.diet)) return false;
  if (filters.light && !(recipe.kcal > 0 && recipe.kcal <= (filters.lightMax || 500))) return false;
  const origins = filters.origins ?? [];
  if (origins.length) {
    if (!recipe.origin) return false;
    const worldTour = origins.includes('monde');
    if (worldTour ? recipe.origin === 'francaise' : !origins.includes(recipe.origin)) return false;
  }
  // Envie libre (« nouilles », « couscous ») : au moins un de ses mots dans la recette.
  const wish = nameTokens(filters.wish ?? '');
  if (wish.length) {
    const words = new Set(nameTokens(recipeText(recipe)));
    if (!wish.some((w) => words.has(w))) return false;
  }
  return true;
}

/** Recettes enregistrées avant l'arrivée du régime et des calories. */
export function lacksNutrition(recipe) {
  return !recipe.diet || !(recipe.kcal > 0);
}

/** Recette masquée faute d'une information apparue après sa création (régime, calories, origine). */
export function lacksTagsFor(recipe, filters) {
  if ((filters.diet || filters.light) && lacksNutrition(recipe)) return true;
  return Boolean(filters.origins?.length) && !recipe.origin;
}

export function formatMinutes(minutes) {
  if (minutes < 60) return `${Math.max(0, minutes)} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

export function filterLines(filters) {
  const lines = [];
  lines.push(filters.difficulty
    ? `Toutes les recettes doivent être de difficulté « ${filters.difficulty} ».`
    : 'Varie les niveaux de difficulté, avec une majorité de recettes faciles.');
  if (filters.maxMinutes) {
    lines.push(`Temps total (préparation + cuisson) inférieur ou égal à ${filters.maxMinutes} minutes pour chaque recette.`);
  }
  const origins = (filters.origins ?? []).filter((id) => id !== 'monde').map((id) => originOf(id)?.label.toLowerCase()).filter(Boolean);
  if (filters.origins?.includes('monde')) {
    lines.push('Tour du monde : 5 recettes de cuisines du monde toutes différentes (pas de cuisine française).');
  } else if (origins.length === 1) {
    lines.push(`Toutes les recettes doivent être de cuisine ${origins[0]}.`);
  } else if (origins.length > 1) {
    lines.push(`Cuisines demandées : ${origins.join(', ')}. Répartis les recettes entre ces origines (au moins une de chaque si possible).`);
  }
  if ((filters.wish ?? '').trim()) {
    lines.push(`Envie de l'utilisateur : « ${filters.wish.trim()} ». Toutes les recettes doivent y répondre.`);
  }
  if (maxPurchases(filters) > 2) {
    lines.push(`Recettes fidèles à leur cuisine d'origine : utilise les produits du frigo quand ils s'y prêtent, mais tu peux prévoir jusqu'à ${maxPurchases(filters)} ingrédients à acheter par recette (sauces, épices, féculents typiques).`);
  }
  if (filters.diet === 'vegetarien') {
    lines.push('Toutes les recettes doivent être végétariennes : ni viande, ni poisson, ni fruits de mer (œufs et produits laitiers autorisés). Ignore les produits du frigo incompatibles.');
  } else if (filters.diet === 'vegan') {
    lines.push("Toutes les recettes doivent être vegan : aucun produit d'origine animale (ni viande, poisson, œufs, lait, beurre, crème, fromage, miel). Ignore les produits du frigo incompatibles.");
  }
  if (filters.light) {
    lines.push(`Recettes légères : au plus ${filters.lightMax || 500} kcal par portion.`);
  }
  lines.push(filters.batchOnly
    ? 'Toutes les recettes doivent convenir au batch cooking : préparées en plusieurs portions et se conservant au moins 3 jours au réfrigérateur (batch_cooking = true, conservation_jours ≥ 3).'
    : 'Inclue au moins une recette adaptée au batch cooking (se conserve plusieurs jours).');
  return lines;
}

function promptExpiry(iso) {
  if (!hasDate(iso)) return 'date de péremption non renseignée';
  const days = daysUntil(iso);
  if (days < 0) return `date dépassée depuis ${-days} j`;
  if (days === 0) return "expire aujourd'hui";
  if (days === 1) return 'expire demain';
  return `expire dans ${days} j`;
}
