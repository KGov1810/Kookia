// Kookia — Reconnaissance d'un produit en photo par Claude.

import { CATEGORY_IDS } from '../../data/reference/categories.js';
import { addDays, parseISODate, startOfDay, toISODate } from '../dates/dates.js';
import { normalizeCategory } from '../stock/categorization.js';
import { callTool } from './client.js';

/** Analyse la photo d'un produit : { isFood, name, category, quantity, expiry } */
export async function analyzeProduct({ key, model, base64 }) {
  const categoryIds = CATEGORY_IDS;
  const input = await callTool({
    key, model,
    system: 'Tu identifies des produits alimentaires photographiés pour une application anti-gaspillage française. Sois précis et prudent.',
    tool: {
      name: 'decrire_produit',
      description: 'Décrit le produit alimentaire visible sur la photo.',
      input_schema: {
        type: 'object',
        properties: {
          est_alimentaire: { type: 'boolean' },
          nom: { type: 'string', description: 'Nom court en français : type de produit + marque si visible (ex. Yaourt nature Danone).' },
          categorie: { type: 'string', enum: categoryIds },
          quantite: { type: 'string', description: 'Poids, volume ou nombre si visible, sinon chaîne vide.' },
          date_peremption: { type: 'string', description: 'Date DLC/DDM lisible au format AAAA-MM-JJ, sinon chaîne vide.' }
        },
        required: ['est_alimentaire', 'nom', 'categorie', 'quantite', 'date_peremption']
      }
    },
    content: [
      { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
      {
        type: 'text',
        text: `Identifie ce produit alimentaire photographié. Nous sommes le ${toISODate(new Date())}.
Si une date de péremption (« à consommer jusqu'au », « à consommer de préférence avant », DLC, DDM, EXP) est lisible, donne-la au format AAAA-MM-JJ ; si seuls le mois et l'année figurent, prends le dernier jour du mois.
N'invente jamais de date : laisse une chaîne vide si elle n'est pas lisible.`
      }
    ],
    maxTokens: 1024,
    timeoutMs: 60_000
  });

  let expiry = null;
  const date = parseISODate(input.date_peremption);
  if (date) {
    const start = startOfDay();
    const max = new Date(start.getFullYear() + 5, start.getMonth(), start.getDate());
    if (date >= addDays(start, -60) && date <= max) expiry = toISODate(date);
  }
  return {
    isFood: input.est_alimentaire !== false,
    name: (input.nom ?? '').trim(),
    category: categoryIds.includes(input.categorie) ? input.categorie : normalizeCategory(input.categorie, input.nom),
    quantity: (input.quantite ?? '').trim(),
    expiry
  };
}
