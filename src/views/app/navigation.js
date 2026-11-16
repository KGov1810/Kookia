// Kookia — Navigation entre les écrans, sans dépendre des écrans eux-mêmes.
// Les écrans s'enregistrent au démarrage (router.js) : ils peuvent ainsi appeler showTab ou render sans boucle d'import.

import { fmt } from '../../components/html.js';
import { state } from '../../data/store/state.js';
import { setLanguage } from '../../services/i18n/i18n.js';
import { updateChrome } from './chrome.js';
import { screen, ui } from './ui-state.js';

let screens = { views: {}, needsOnboarding: () => false, renderOnboarding: () => {} };

/** Enregistre les écrans des onglets et l'accueil (appelé une fois, par router.js). */
export function registerScreens(next) {
  screens = next;
}

/** Écran d'un onglet. */
export function viewFor(tab) {
  return screens.views[tab];
}

export function needsOnboarding() {
  return screens.needsOnboarding();
}

export function renderOnboarding() {
  screens.renderOnboarding();
}

export function render() {
  setLanguage(state.settings.language);
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
  if (name === 'recettes') { // à chaque visite : Réalisables d'abord, sans badge « Nouvelle »
    ui.recipeNote = null;
    ui.freshIds = new Set();
    ui.recipeTab = '';
  }
  render();
  window.scrollTo(0, 0);
}
