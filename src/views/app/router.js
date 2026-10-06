// Kookia — Affichage des écrans et navigation.

import { fmt } from '../../components/html.js';
import { openSheets } from '../../components/sheet.js';
import { needsOnboarding, renderOnboarding } from '../onboarding/onboarding.js';
import { recipesView } from '../recipes/recipes-view.js';
import { settingsView } from '../settings/settings-view.js';
import { shoppingView } from '../shopping/shopping-view.js';
import { fridgeView } from '../stock/stock-view.js';
import { updateChrome } from './chrome.js';
import { screen, ui } from './ui-state.js';

let views = null;

/** Écran d'un onglet (liste assemblée au premier usage, une fois tous les écrans chargés). */
export function viewFor(tab) {
  views ??= { frigo: fridgeView, recettes: recipesView, courses: shoppingView, reglages: settingsView };
  return views[tab];
}

export function render() {
  const onboarding = needsOnboarding();
  document.body.classList.toggle('onboarding', onboarding);
  if (onboarding) {
    renderOnboarding();
    return;
  }
  const view = viewFor(ui.tab);
  screen.innerHTML = fmt(view.render());
  view.mounted?.();
  updateChrome();
}

export function rerenderKeepScroll() {
  const y = window.scrollY;
  screen.innerHTML = fmt(viewFor(ui.tab).render());
  viewFor(ui.tab).mounted?.();
  window.scrollTo(0, y);
}

export function rerenderIf(tab) {
  if (ui.tab === tab && !document.body.classList.contains('onboarding')) rerenderKeepScroll();
}

export function showTab(name) {
  if (!viewFor(name)) return;
  ui.tab = name;
  if (name === 'recettes') ui.recipeNote = null;
  render();
  window.scrollTo(0, 0);
}

export function onStoreChange(what) {
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
