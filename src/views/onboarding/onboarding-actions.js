// Kookia — Actions de l'Accueil : installation, connexion, foyer.

import * as store from '../../data/store/index.js';
import { render } from '../app/router.js';
import { ui } from '../app/ui-state.js';
import { onboardingConnect, onboardingCreate, onboardingJoin } from './onboarding.js';

/** Actions des boutons (attribut data-action). */
export const onboardingActions = {
  'dismiss-install': () => store.updateSettings({ installHintDismissed: true }),
  connect: () => onboardingConnect(),
  create: () => onboardingCreate(),
  join: () => onboardingJoin(),
  start: () => {
    store.updateSettings({ onboardingDone: true });
    ui.tab = 'frigo';
    render();
  }
};
