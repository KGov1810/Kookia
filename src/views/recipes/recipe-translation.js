// Kookia — Recette qui n'existe pas encore dans la langue de cet iPhone (ancienne recette, ou écrite avant
// que l'autre iPhone change de langue) : Claude la traduit à l'ouverture, une seule fois pour le foyer.

import { html } from '../../components/html.js';
import * as store from '../../data/store/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';

const attempts = new Map(); // « id:langue » → 'busy' | 'done' | message d'erreur (une tentative par lancement)

/** Lance la traduction si besoin ; onChange redessine la fiche (début et fin). */
export function translateIfNeeded(id, onChange) {
  const recipe = state.recipes.find((r) => r.id === id);
  const lang = S.language();
  const key = `${id}:${lang}`;
  if (!recipe || !hasClaudeKey() || !S.lacksLanguage(recipe, lang) || attempts.has(key)) return;
  attempts.set(key, 'busy');
  onChange();
  S.translateRecipe({ key: state.settings.claudeKey, model: state.settings.model, recipe, lang })
    .then((translation) => {
      store.saveRecipeTranslation(id, lang, translation);
      attempts.set(key, 'done');
    })
    .catch((error) => attempts.set(key, error?.message || String(error)))
    .finally(() => onChange());
}

/** Bandeau de la fiche : traduction en cours, impossible, ou sans clé Claude (la recette reste dans sa langue). */
export function translationNote(recipe) {
  const lang = S.language();
  if (!recipe || !S.lacksLanguage(state.recipes.find((r) => r.id === recipe.id), lang)) return '';
  const status = attempts.get(`${recipe.id}:${lang}`);
  if (status === 'busy') return html`<p class="note ok translating"><span class="spinner"></span>${t('detail.translating')}</p>`;
  if (!hasClaudeKey()) return html`<p class="hint">${t('detail.noKeyTranslate', { language: S.languageLabel(S.recipeLanguage(recipe)) })}</p>`;
  if (status && status !== 'done') return html`<p class="note warn">${t('detail.translateFailed', { problem: status })}</p>`;
  return '';
}
