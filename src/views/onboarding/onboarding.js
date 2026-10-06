// Kookia — Accueil : installation, connexion, foyer.

import { fmt } from '../../components/html.js';
import { isStandalone } from '../../components/platform.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { render } from '../app/router.js';
import { screen, ui } from '../app/ui-state.js';
import { ONBOARDING } from './onboarding-steps.js';

export function needsOnboarding() {
  const s = state.settings;
  return !store.firebaseConfig() || !s.householdCode || !s.onboardingDone;
}

function onboardingStep() {
  const s = state.settings;
  if (!isStandalone() && !s.installHintDismissed && !s.householdCode) return 'install';
  if (!store.firebaseConfig()) return 'connect';
  if (!s.householdCode) return 'household';
  return 'created';
}

export function renderOnboarding() {
  screen.innerHTML = fmt(ONBOARDING[onboardingStep()]());
}

function onboardingName() {
  const value = document.getElementById('ob-name')?.value ?? ui.onboarding.name;
  return (value || state.settings.userName || '').trim();
}

export async function onboardingCreate() {
  const name = onboardingName();
  if (!name) {
    ui.onboarding.message = { kind: 'warn', text: 'Indiquez votre prénom.' };
    renderOnboarding();
    return;
  }
  store.updateSettings({ userName: name });
  ui.onboarding.busy = true;
  ui.onboarding.message = null;
  renderOnboarding();
  try {
    await store.createHousehold();
  } catch (error) {
    ui.onboarding.message = { kind: 'error', text: store.errorMessage(error) };
  }
  ui.onboarding.busy = false;
  render();
}

export async function onboardingJoin() {
  const name = onboardingName();
  const input = ui.onboarding.invite || document.getElementById('join-text')?.value || ui.onboarding.joinText;
  if (!name) {
    ui.onboarding.message = { kind: 'warn', text: 'Indiquez votre prénom.' };
    renderOnboarding();
    return;
  }
  if (!input.trim()) {
    ui.onboarding.message = { kind: 'warn', text: "Collez le code d'invitation reçu de l'autre iPhone." };
    renderOnboarding();
    return;
  }
  store.updateSettings({ userName: name });
  ui.onboarding.busy = true;
  ui.onboarding.message = null;
  renderOnboarding();
  try {
    await store.joinHousehold(input);
    ui.onboarding.invite = '';
    store.updateSettings({ onboardingDone: true });
  } catch (error) {
    ui.onboarding.message = { kind: 'error', text: store.errorMessage(error) };
  }
  ui.onboarding.busy = false;
  render();
}

export function onboardingConnect() {
  const text = document.getElementById('connect-text')?.value ?? ui.onboarding.text;
  ui.onboarding.text = text;
  const invite = store.parseInvitation(text);
  if (invite) {
    ui.onboarding.invite = text;
    ui.onboarding.message = null;
    store.updateSettings({ firebaseConfig: invite.config });
    render();
    return;
  }
  const config = store.parseFirebaseConfig(text);
  if (config) {
    ui.onboarding.message = null;
    store.updateSettings({ firebaseConfig: config });
    render();
    return;
  }
  ui.onboarding.message = {
    kind: 'warn',
    text: "Texte non reconnu. Collez le code d'invitation (il commence par FRIGO1.) ou le bloc de configuration Firebase complet."
  };
  renderOnboarding();
}
