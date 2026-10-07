// Kookia — Lecture d'un ticket de caisse par Claude.

import { CATEGORY_IDS } from '../../data/reference/categories.js';
import { LOCATIONS } from '../../data/reference/locations.js';
import { cleanPrice } from '../stats/money.js';
import { normalizeCategory } from '../stock/categorization.js';
import { callTool } from './client.js';

/**
 * Lit un ticket de caisse (une ou plusieurs photos, de haut en bas).
 * Renvoie les produits alimentaires : [{ name, receiptText, category, count, quantity, location, price }].
 * price : montant payé pour la ligne (toutes unités), ou null s'il est illisible.
 * Les dates de péremption ne figurent pas sur un ticket : elles restent « à compléter ».
 */
export async function analyzeReceipt({ key, model, images }) {
  const categoryIds = CATEGORY_IDS;
  const content = images.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } }));
  content.push({
    type: 'text',
    text: `${images.length > 1 ? `Voici un ticket de caisse en ${images.length} photos, de haut en bas.` : 'Voici un ticket de caisse.'}
Liste uniquement les produits alimentaires et les boissons achetés.
- Ignore : hygiène, entretien, sacs, remises, consignes, bons d'achat, sous-totaux, totaux, moyens de paiement.
- Développe les abréviations en un nom clair en français (ex. « PDT CONSO 2KG » → nom « Pommes de terre », contenance « 2 kg »).
- nombre : quantité achetée de ce produit (ex. ligne « 2 x 1,19 » ou ligne répétée → 2). Regroupe les lignes identiques.
- contenance : poids ou volume d'une unité s'il est indiqué (« 500 g », « 1 L »), sinon chaîne vide.
- lieu : où ranger le produit à la maison : « frigo » (produits frais), « congelateur » (surgelés), « placard » (épicerie, conserves, boissons, produits secs), « fruits » (fruits et légumes qui se gardent hors du frigo : bananes, pommes de terre, oignons…).
- prix : montant payé pour ce produit en euros, toutes unités regroupées (ex. « 2 x 1,19 » → 2.38). Déduis une remise immédiate imprimée juste sous le produit. Omets ce champ si le prix est illisible.
- Si les photos se chevauchent, ne compte pas deux fois la même ligne.
- Si la photo n'est pas un ticket de caisse, renvoie une liste vide.`
  });
  const input = await callTool({
    key, model,
    system: 'Tu lis des tickets de caisse de supermarchés français pour une application anti-gaspillage. Sois précis ; n\'invente aucun produit.',
    tool: {
      name: 'lister_produits',
      description: 'Liste les produits alimentaires du ticket de caisse.',
      input_schema: {
        type: 'object',
        properties: {
          produits: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                nom: { type: 'string', description: 'Nom clair en français.' },
                texte_ticket: { type: 'string', description: 'Libellé tel qu\'imprimé sur le ticket.' },
                categorie: { type: 'string', enum: categoryIds },
                nombre: { type: 'integer', description: "Nombre d'unités achetées (1 par défaut)." },
                contenance: { type: 'string', description: 'Poids ou volume d\'une unité, sinon chaîne vide.' },
                lieu: { type: 'string', enum: ['frigo', 'congelateur', 'placard', 'fruits'] },
                prix: { type: 'number', description: 'Montant payé pour la ligne, en euros (toutes unités). Omis si illisible.' }
              },
              required: ['nom', 'texte_ticket', 'categorie', 'nombre', 'contenance', 'lieu']
            }
          }
        },
        required: ['produits']
      }
    },
    content,
    maxTokens: 4000,
    timeoutMs: 120_000
  });

  return (input.produits ?? [])
    .filter((item) => (item.nom ?? '').trim())
    .map((item) => ({
      name: item.nom.trim(),
      receiptText: (item.texte_ticket ?? '').trim(),
      category: categoryIds.includes(item.categorie) ? item.categorie : normalizeCategory(item.categorie, item.nom),
      count: Math.min(99, Math.max(1, Math.round(Number(item.nombre) || 1))),
      quantity: (item.contenance ?? '').trim(),
      location: LOCATIONS.some((l) => l.id === item.lieu) ? item.lieu : 'frigo',
      price: Number(item.prix) > 0 ? cleanPrice(item.prix) : null
    }));
}
