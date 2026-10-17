// Kookia — Foyer partagé : créer, rejoindre, quitter.

import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { t } from '../../services/i18n/i18n.js';
import { db, ensureFirebase, signIn, withTimeout } from './connection.js';
import { generateHouseholdCode, normalizeHouseholdCode, parseInvitation } from './household-codes.js';
import { updateSettings } from './settings.js';
import { state } from './state.js';
import { start, stop } from './sync.js';

export async function createHousehold() {
  if (!ensureFirebase()) throw new Error(t('home.noConfig'));
  await withTimeout(signIn(), 20_000, t('home.signIn'));
  const code = generateHouseholdCode();
  await withTimeout(
    setDoc(doc(db, 'foyers', code), { createdAt: serverTimestamp(), createdBy: state.settings.userName }),
    20_000, t('home.silent')
  );
  setHousehold(code);
  return code;
}

/** Accepte un code (« K7M2Q-XP9RT ») ou une invitation complète (« FRIGO1.… »). */
export async function joinHousehold(input) {
  const invitation = parseInvitation(input);
  if (invitation && !window.FIREBASE_CONFIG?.apiKey) {
    updateSettings({ firebaseConfig: invitation.config });
  }
  const code = invitation?.code ?? normalizeHouseholdCode(input);
  if (!code) throw new Error(t('home.badCode'));
  if (!ensureFirebase()) throw new Error(t('home.noConfigInvite'));
  await withTimeout(signIn(), 20_000, t('home.signIn'));
  const snapshot = await withTimeout(getDoc(doc(db, 'foyers', code)), 20_000, t('home.silent'));
  if (!snapshot.exists()) throw new Error(t('home.notFound'));
  setHousehold(code);
}

function setHousehold(code) {
  stop();
  state.products = [];
  state.shopping = [];
  state.recipes = [];
  state.error = null;
  updateSettings({ householdCode: code });
  start();
}

export function leaveHousehold() {
  stop();
  state.products = [];
  state.shopping = [];
  state.recipes = [];
  updateSettings({ householdCode: '', onboardingDone: false });
}
