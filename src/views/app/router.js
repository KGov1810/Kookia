// Kookia — Assemblage des écrans et réaction aux changements de données.

import { openSheets } from '../../components/sheet.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { setLanguage } from '../../services/i18n/i18n.js';
import { needsOnboarding, renderOnboarding } from '../onboarding/onboarding.js';
import { recipesView } from '../recipes/recipes-view.js';
import { settingsView } from '../settings/settings-view.js';
import { shoppingView } from '../shopping/shopping-view.js';
import { statsView } from '../stats/stats-view.js';
import { fridgeView } from '../stock/stock-view.js';
import { updateChrome } from './chrome.js';
import { registerScreens, render, viewFor } from './navigation.js';
import { ui } from './ui-state.js';

registerScreens({
  views: { frigo: fridgeView, recettes: recipesView, courses: shoppingView, stats: statsView, reglages: settingsView },
  needsOnboarding,
  renderOnboarding
});

export function onStoreChange(what) {
  if (what === 'settings' && setLanguage(state.settings.language)) {
    store.publishLanguage(); // l'autre iPhone le sait : les prochaines recettes seront aussi dans cette langue
    render(); // nouvelle langue : tout l'écran est redessiné
    return;
  }
  const onboarding = needsOnboarding();
  if (onboarding !== document.body.classList.contains('onboarding')) {
    render();
    return;
  }
  if (onboarding) {
    if (what === 'settings' || what === 'sync') renderOnboarding();
    return;
  }
  viewFor(ui.tab).update?.(what);
  updateChrome();
  openSheets.forEach((sheet) => sheet.onData?.(what));
}
