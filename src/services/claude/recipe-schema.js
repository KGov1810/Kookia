// Kookia — Consignes et format de réponse des recettes.

import { ORIGINS } from '../../data/reference/origins.js';

export const RECIPE_SYSTEM = `Tu es un chef cuisinier français spécialisé dans la cuisine anti-gaspillage du quotidien, pour un foyer de deux personnes.
Règles :
- Utilise en priorité les produits proches de leur date, puis les autres produits du frigo et ceux de la liste de courses.
- Les basiques du placard sont supposés disponibles (sel, poivre, huiles, vinaigre, farine, sucre, épices courantes, herbes séchées, ail, oignon, moutarde, bouillon cube) : source « placard ».
- Tout autre ingrédient nécessaire est en source « a_acheter » ; limite-les au strict minimum (2 au maximum par recette, sauf si les contraintes en autorisent davantage).
- Pour chaque ingrédient venant du frigo, renseigne ref_stock avec la référence exacte (ex. « P3 ») ; pour la liste de courses, source « courses ».
- Pense aussi aux produits présents depuis longtemps (placard, congélateur) pour éviter qu'ils soient oubliés. Un produit du congélateur doit être décongelé : indique-le dans les étapes.
- Sécurité alimentaire : une date limite (DLC) dépassée interdit le produit ; un produit dont seule la DDM est dépassée ne peut être utilisé que s'il s'agit d'une DDM (épicerie sèche, conserves, biscuits, pâtes…) après vérification de son aspect, et tu le signales dans le résumé. N'utilise jamais une viande, un poisson, un produit laitier frais ou un plat traiteur dont la date est dépassée.
- Temps réalistes (préparation + cuisson). Respecte le nombre de personnes demandé ; en batch cooking, prévois 2 à 3 repas pour ce nombre de personnes et indique le total dans portions.
- Pour chaque ingrédient, donne la quantité en texte (quantite) et, si elle est chiffrable, sa valeur numérique (valeur) et son unité (unite : g, kg, ml, cl, L, c. à soupe, c. à café, ou le nom de l'unité comme « pot », vide pour des pièces). valeur = 0 si non chiffrable (« une pincée »).
- regime : « vegan » si aucun produit d'origine animale, « vegetarien » si ni viande ni poisson ni fruits de mer (œufs et laitages autorisés), sinon « omnivore ». Sois strict (bouillon, gélatine, anchois comptent).
- calories_par_portion : estimation réaliste des kilocalories d'une portion.
- conservation_jours : durée réaliste au réfrigérateur en boîte hermétique (0 si le plat se mange tout de suite) ; précise dans conseils_conservation comment conserver, réchauffer, et si le plat se congèle.
- Étapes courtes et claires, une action par étape, en français.`;

export const RECIPE_TOOL = {
  name: 'proposer_recettes',
  description: "Enregistre les recettes proposées à l'utilisateur.",
  input_schema: {
    type: 'object',
    properties: {
      recettes: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            titre: { type: 'string' },
            resume: { type: 'string', description: 'Une ou deux phrases appétissantes.' },
            difficulte: { type: 'string', enum: ['facile', 'moyen', 'difficile'] },
            temps_total_minutes: { type: 'integer', description: 'Préparation + cuisson, en minutes.' },
            temps_preparation_minutes: { type: 'integer' },
            portions: { type: 'integer', description: 'Nombre total de portions.' },
            regime: { type: 'string', enum: ['vegan', 'vegetarien', 'omnivore'] },
            origine: { type: 'string', enum: [...ORIGINS.filter((o) => o.id !== 'monde').map((o) => o.id), 'autre'], description: "Cuisine d'origine de la recette." },
            calories_par_portion: { type: 'integer', description: 'Estimation en kcal pour une portion.' },
            batch_cooking: { type: 'boolean', description: 'true si la recette se prépare en quantité et se conserve plusieurs jours.' },
            conservation_jours: { type: 'integer', description: 'Jours de conservation au réfrigérateur après préparation.' },
            conseils_conservation: { type: 'string' },
            ingredients: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nom: { type: 'string' },
                  quantite: { type: 'string', description: 'Quantité lisible, ex. « 250 g », « 2 pots », « une pincée ».' },
                  valeur: { type: 'number', description: 'Valeur numérique de la quantité (0 si non chiffrable).' },
                  unite: { type: 'string', description: 'Unité de valeur : g, kg, ml, cl, L, c. à soupe, c. à café, pot… ; vide pour des pièces.' },
                  source: { type: 'string', enum: ['stock', 'courses', 'placard', 'a_acheter'] },
                  ref_stock: { type: 'string', description: 'Référence du produit du frigo (ex. P3), sinon chaîne vide.' }
                },
                required: ['nom', 'quantite', 'valeur', 'unite', 'source', 'ref_stock']
              }
            },
            etapes: { type: 'array', items: { type: 'string' } }
          },
          required: ['titre', 'resume', 'difficulte', 'temps_total_minutes', 'temps_preparation_minutes',
            'portions', 'regime', 'origine', 'calories_par_portion', 'batch_cooking', 'conservation_jours', 'conseils_conservation',
            'ingredients', 'etapes']
        }
      }
    },
    required: ['recettes']
  }
};
