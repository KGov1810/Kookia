// Kookia — Lecture d'un ticket de caisse par Claude.

import { CATEGORY_IDS } from '../../data/reference/categories.js';
import { LOCATIONS } from '../../data/reference/locations.js';
import { cleanPrice, parsePrice } from '../stats/money.js';
import { normalizeCategory } from '../stock/categorization.js';
import { CATEGORY_GUIDE } from './category-guide.js';
import { callTool } from './client.js';

/** Repères des articles de la liste de courses envoyés à Claude : L1, L2… */
const listRef = (index) => `L${index + 1}`;

/**
 * Lit un ticket de caisse (une ou plusieurs photos, de haut en bas).
 * shopping : la liste de courses [{ id, name }], que Claude rapproche des lignes du ticket.
 * Renvoie [{ name, receiptText, category, count, quantity, location, price, food, shoppingId }] :
 * food = false pour un article non alimentaire (hygiène, entretien, animaux…) ;
 * shoppingId = article de la liste acheté (null : aucun ; undefined : Claude n'a pas répondu, rapprochement local).
 * price : montant payé pour la ligne (toutes unités), ou null s'il est illisible.
 * Les dates de péremption ne figurent pas sur un ticket : elles restent « à compléter ».
 */
export async function analyzeReceipt({ key, model, images, shopping = [] }) {
  const categoryIds = CATEGORY_IDS;
  const list = shopping.filter((s) => (s.name ?? '').trim()).slice(0, 80);
  const content = images.map((data) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } }));
  content.push({
    type: 'text',
    text: `${images.length > 1 ? `Voici un ticket de caisse en ${images.length} photos, de haut en bas.` : 'Voici un ticket de caisse.'}
Liste les articles achetés, alimentaires ou non.
- N'inclus pas : remises, consignes, bons d'achat, sous-totaux, totaux, moyens de paiement, rendu de monnaie.
- alimentaire : true pour un aliment ou une boisson destinés aux personnes du foyer. false pour tout le reste : hygiène et beauté, entretien et lessive, emballages et sacs (sacs de congélation, film étirable, papier cuisson ou aluminium, sacs poubelle, sacs de caisse), nourriture et litière pour animaux, compléments alimentaires et parapharmacie, fleurs et plantes, charbon, piles, bougies, vaisselle, textile. Article non alimentaire : categorie « autre », lieu « placard ».
- Développe les abréviations en un nom clair en français (ex. « PDT CONSO 2KG » → nom « Pommes de terre », contenance « 2 kg »).
- nombre : quantité achetée de ce produit (ex. ligne « 2 x 1,19 » ou ligne répétée → 2). Regroupe les lignes identiques.
- contenance : poids ou volume d'une unité s'il est indiqué (« 500 g », « 1 L »), sinon chaîne vide.
- lieu : où ranger le produit à la maison : « frigo » (produits frais), « congelateur » (surgelés, glaces), « placard » (épicerie, conserves, boissons, produits secs, pain), « fruits » (fruits et légumes qui se gardent hors du frigo : bananes, pommes de terre, oignons…).
- prix : montant payé pour ce produit en euros, toutes unités regroupées (ex. « 2 x 1,19 » → 2.38). Déduis une remise immédiate imprimée juste sous le produit. Omets ce champ si le prix est illisible.
- liste : identifiant (${list.length ? `${listRef(0)}, ${listRef(1)}…` : 'aucun'}) de l'article de la liste de courses que cette ligne achète, sinon chaîne vide. Rapproche un article général de sa version précise (« Glace » = « Glace Nutella en pot », « Steak haché » = « Viande hachée 5 % », « Éponges » = « Éponges grattantes x3 »), mais jamais deux produits différents qui partagent un mot (« Pommes » ≠ « Pommes de terre », « Lait » ≠ « Lait de coco », « Oranges » ≠ « Jus d'orange », « Pâtes » ≠ « Pâte feuilletée », « Crème » ≠ « Crème dessert »). Chaque article de la liste correspond au plus à une ligne.
- Si les photos se chevauchent, ne compte pas deux fois la même ligne.
- Si la photo n'est pas un ticket de caisse, renvoie une liste vide.

Liste de courses :
${list.length ? list.map((s, i) => `${listRef(i)} : ${s.name.trim()}`).join('\n') : '(vide)'}

${CATEGORY_GUIDE}`
  });
  const input = await callTool({
    key, model,
    system: 'Tu lis des tickets de caisse de supermarchés français pour une application anti-gaspillage. Sois précis ; n\'invente aucun produit.',
    tool: {
      name: 'lister_produits',
      description: 'Liste les articles du ticket de caisse.',
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
                categorie: { type: 'string', enum: categoryIds, description: 'Identifiant de la catégorie, voir la liste des catégories.' },
                nombre: { type: 'integer', description: "Nombre d'unités achetées (1 par défaut)." },
                contenance: { type: 'string', description: 'Poids ou volume d\'une unité, sinon chaîne vide.' },
                lieu: { type: 'string', enum: ['frigo', 'congelateur', 'placard', 'fruits'] },
                prix: { type: 'number', description: 'Montant payé pour la ligne, en euros (toutes unités). Omis si illisible.' },
                alimentaire: { type: 'boolean', description: 'true : aliment ou boisson du foyer ; false : hygiène, entretien, animaux, emballages, fleurs…' },
                liste: { type: 'string', description: 'Identifiant de l\'article de la liste de courses acheté (L1, L2…), sinon chaîne vide.' }
              },
              required: ['nom', 'texte_ticket', 'categorie', 'nombre', 'contenance', 'lieu', 'alimentaire', 'liste']
            }
          }
        },
        required: ['produits']
      }
    },
    content,
    maxTokens: 16_000, // un long ticket de drive (100 lignes et plus) tient sans être coupé
    timeoutMs: 240_000
  });

  // Un prix renvoyé en texte (« 2,49 ») reste lisible.
  const priceOf = (value) => (typeof value === 'string' ? parsePrice(value) : (Number(value) > 0 ? cleanPrice(value) : null));
  return (input.produits ?? [])
    .filter((item) => (item.nom ?? '').trim())
    .map((item) => ({
      name: item.nom.trim(),
      receiptText: (item.texte_ticket ?? '').trim(),
      category: categoryIds.includes(item.categorie) ? item.categorie : normalizeCategory(item.categorie, item.nom),
      count: Math.min(99, Math.max(1, Math.round(Number(item.nombre) || 1))),
      quantity: (item.contenance ?? '').trim(),
      location: LOCATIONS.some((l) => l.id === item.lieu) ? item.lieu : 'frigo',
      price: priceOf(item.prix),
      food: item.alimentaire !== false,
      shoppingId: typeof item.liste === 'string' ? (list[Number(/^L(\d+)$/i.exec(item.liste.trim())?.[1]) - 1]?.id ?? null) : undefined
    }));
}
