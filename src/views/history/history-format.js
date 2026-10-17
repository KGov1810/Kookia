// Kookia — Mise en forme des entrées de l'historique.

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';


export const HISTORY_ICON = {
  ajout: () => I.plus, modification: () => I.pencil, consommation: () => I.check, suppression: () => I.trash, jete: () => I.trash, congelation: () => I.snow, entame: () => I.gauge,
  annulation: () => I.refresh, rangement: () => I.jar, panier: () => I.cart, ticket: () => I.receipt,
  generation: () => I.sparkle, planning: () => I.calendar, favori: () => I.star, 'favori-retire': () => I.star
};

/** « Marie a consommé Yaourt » : la phrase de l'action, dans la langue de cet iPhone (le nom en gras). */
export function historySentence(entry) {
  const key = `hist.${entry.scope}:${entry.action}`;
  const template = t(key) === key ? t('hist.stock:modification') : t(key);
  const [before, after] = template.split('{n}');
  const name = entry.nameRich ? S.richText(entry.nameRich, entry.clientAt) : entry.name;
  return html`<strong>${entry.by || t('hist.someone')}</strong> ${before}<strong>${name}</strong>${after}`;
}

/** Détails : notés neutres (lus dans cette langue) ou, pour les anciennes entrées, en français. */
export function historyDetails(entry) {
  const details = entry.rich ? entry.rich.map((d) => S.richText(d, entry.clientAt)) : entry.details ?? [];
  return details.filter(Boolean);
}

export function historyDay(ms) {
  const day = S.startOfDay(new Date(ms));
  const today = S.startOfDay();
  const diff = Math.round((today - day) / 86_400_000);
  if (diff === 0) return t('week.today');
  if (diff === 1) return t('hist.yesterday');
  return S.capitalize(new Date(ms).toLocaleDateString(S.localeTag(), { weekday: 'long', day: 'numeric', month: 'long' }));
}
