// Kookia — Réglages propres à chaque iPhone (lecture).

import { MODELS, REPLACED_MODELS } from '../reference/models.js';

export const SETTINGS_KEY = 'frigo.settings.v1';

const DEFAULT_SETTINGS = {
  userName: '',
  alertDays: 2,
  claudeKey: '',
  model: 'claude-sonnet-5-5',
  householdCode: '',
  firebaseConfig: null,
  onboardingDone: false,
  installHintDismissed: false,
  servings: 2,          // nombre de personnes proposé pour les recettes
  lightMaxKcal: 500,    // seuil d'une recette « légère » (kcal par portion)
  theme: 'auto',        // apparence : 'auto' (comme l'iPhone), 'light' ou 'dark'
  language: ''          // langue : '' (celle de l'iPhone), 'fr', 'en', 'es' ou 'pt'
};

/** Modèle proposé : un ancien modèle passe à son remplaçant, un modèle inconnu au modèle conseillé. */
function offeredModel(model) {
  if (MODELS.some((m) => m.id === model)) return model;
  return REPLACED_MODELS[model] ?? DEFAULT_SETTINGS.model;
}

export function loadSettings() {
  try {
    const settings = { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
    return { ...settings, model: offeredModel(settings.model) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
