// Kookia — Catégorie et rangement d'un nom de produit que l'app ne reconnaît pas (dernier recours).

import { CATEGORY_IDS } from '../../data/reference/categories.js';
import { LOCATIONS } from '../../data/reference/locations.js';
import { CATEGORY_GUIDE } from './category-guide.js';
import { callTool } from './client.js';

/** Modèle rapide et économique : une catégorie ne demande pas plus. */
export const CATEGORIZE_MODEL = 'claude-haiku-4-5';

/** Renvoie { category, location } (chacun null s'il n'est pas sûr). */
export async function categorizeProduct({ key, name }) {
  const input = await callTool({
    key,
    model: CATEGORIZE_MODEL,
    system: 'Tu ranges les courses alimentaires d\'un foyer (noms en français, anglais, espagnol ou portugais). Réponds avec l\'outil, sans rien inventer.',
    tool: {
      name: 'ranger_produit',
      description: 'Donne la catégorie et le lieu de rangement habituel du produit.',
      input_schema: {
        type: 'object',
        properties: {
          categorie: { type: 'string', enum: CATEGORY_IDS, description: 'Identifiant de la catégorie, voir la liste.' },
          lieu: { type: 'string', enum: LOCATIONS.map((l) => l.id), description: 'frigo (frais), congelateur (surgelés), placard (épicerie, conserves, boissons), fruits (fruits et légumes hors du frigo).' }
        },
        required: ['categorie', 'lieu']
      }
    },
    content: [{ type: 'text', text: `Produit : « ${name.trim()} »\n\n${CATEGORY_GUIDE}\nSi ce n'est pas un aliment ou si tu ne le connais pas, réponds « autre ».` }],
    maxTokens: 200,
    timeoutMs: 15_000
  });
  const category = CATEGORY_IDS.includes(input.categorie) && input.categorie !== 'autre' ? input.categorie : null;
  const location = LOCATIONS.some((l) => l.id === input.lieu) && category ? input.lieu : null;
  return { category, location };
}
