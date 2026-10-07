// Kookia — Mise en forme des entrées de l'historique.

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import * as S from '../../services/index.js';

const HISTORY_TEXT = {
  'stock:ajout': 'a ajouté {n}',
  'stock:modification': 'a modifié {n}',
  'stock:consommation': 'a consommé {n}',
  'stock:jete': 'a jeté {n}',
  'stock:congelation': 'a congelé {n}',
  'stock:suppression': 'a retiré {n} du stock',
  'stock:annulation': 'a annulé une action sur {n}',
  'stock:ticket': 'a ajouté {n} depuis un ticket de caisse',
  'courses:ajout': 'a ajouté {n} aux courses',
  'courses:modification': 'a modifié {n} dans les courses',
  'courses:suppression': 'a supprimé {n} des courses',
  'courses:rangement': 'a acheté et rangé {n}',
  'courses:panier': 'a vidé le panier ({n})',
  'recettes:generation': 'a généré {n}',
  'recettes:suppression': 'a supprimé la recette {n}',
  'recettes:favori': 'a mis {n} en favori',
  'recettes:favori-retire': 'a retiré {n} des favoris'
};

export const HISTORY_ICON = {
  ajout: () => I.plus, modification: () => I.pencil, consommation: () => I.check, suppression: () => I.trash, jete: () => I.trash, congelation: () => I.snow,
  annulation: () => I.refresh, rangement: () => I.jar, panier: () => I.cart, ticket: () => I.receipt,
  generation: () => I.sparkle, favori: () => I.star, 'favori-retire': () => I.star
};

export function historySentence(entry) {
  const template = HISTORY_TEXT[`${entry.scope}:${entry.action}`] ?? 'a modifié {n}';
  const [before, after] = template.split('{n}');
  return html`<strong>${entry.by || "Quelqu'un"}</strong> ${before}<strong>${entry.name}</strong>${after}`;
}

export function historyDay(ms) {
  const day = S.startOfDay(new Date(ms));
  const today = S.startOfDay();
  const diff = Math.round((today - day) / 86_400_000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  const text = new Date(ms).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  return text.charAt(0).toUpperCase() + text.slice(1);
}
