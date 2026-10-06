// Kookia — Réglages propres à chaque iPhone (modification).

import { SETTINGS_KEY } from './settings-storage.js';
import { emit, state } from './state.js';

export function updateSettings(patch) {
  Object.assign(state.settings, patch);
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(state.settings));
  } catch {
    // stockage indisponible (navigation privée) : les réglages restent en mémoire
  }
  emit('settings');
}
