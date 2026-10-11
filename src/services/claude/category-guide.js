// Kookia — Description des catégories pour Claude : l'identifiant seul (« patisserie ») est ambigu.

import { CATEGORIES } from '../../data/reference/categories.js';

export const CATEGORY_GUIDE = `Catégories (identifiant : contenu, exemples) :
${CATEGORIES.map((c) => `- ${c.id} : ${c.label}${c.hint ? ` (${c.hint})` : ''}`).join('\n')}
Choisis la catégorie d'après ce qu'est le produit, pas d'après un goût ou un usage cité dans son nom (« farine spéciale sauces » → patisserie).`;
