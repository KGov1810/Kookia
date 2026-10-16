// Kookia — Actions déclenchées par les boutons (attribut data-action), tous écrans confondus.

import { openHistory } from '../history/history-sheet.js';
import { onboardingActions } from '../onboarding/onboarding-actions.js';
import { recipesActions } from '../recipes/recipes-actions.js';
import { settingsActions } from '../settings/settings-actions.js';
import { shoppingActions } from '../shopping/shopping-actions.js';
import { statsActions } from '../stats/stats-actions.js';
import { stockActions } from '../stock/stock-actions.js';
import { showTab } from './router.js';

let actions = null;

/** Action correspondant à un nom (assemblée au premier usage, une fois tous les écrans chargés). */
export function getAction(name) {
  actions ??= {
    ...stockActions,
    ...recipesActions,
    ...shoppingActions,
    ...statsActions,
    ...settingsActions,
    ...onboardingActions,
    'open-history': () => openHistory(),
    'open-settings': () => showTab('reglages'),
    'open-stock': () => showTab('frigo')
  };
  return actions[name];
}
