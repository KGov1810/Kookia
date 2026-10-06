// Kookia — Réglages propres à chaque iPhone (lecture).

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
  lightMaxKcal: 500     // seuil d'une recette « légère » (kcal par portion)
};

export function loadSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}') };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}
