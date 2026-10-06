// Kookia — Code du foyer, invitation et configuration Firebase.

import { state } from './state.js';

const CONFIG_KEYS = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];

export function firebaseConfig() {
  const fromFile = window.FIREBASE_CONFIG;
  if (fromFile?.apiKey && fromFile?.projectId && fromFile?.appId) return fromFile;
  return state.settings.firebaseConfig;
}

/** Accepte le bloc « const firebaseConfig = { … } » copié depuis la console, ou du JSON. */
export function parseFirebaseConfig(text) {
  const config = {};
  for (const key of CONFIG_KEYS) {
    const match = new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']+)["']`).exec(text ?? '');
    if (match) config[key] = match[1].trim();
  }
  return config.apiKey && config.projectId && config.appId ? config : null;
}

// Invitation = code du foyer + configuration Firebase, pour le second iPhone.
const INVITE_PREFIX = 'FRIGO1.';

export function invitationCode() {
  const payload = JSON.stringify({ h: state.settings.householdCode, c: firebaseConfig() });
  const base64 = btoa(unescape(encodeURIComponent(payload)));
  return INVITE_PREFIX + base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function parseInvitation(text) {
  const match = /FRIGO1\.([A-Za-z0-9_-]+)/.exec(text ?? '');
  if (!match) return null;
  try {
    let base64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
    const code = normalizeHouseholdCode(payload.h);
    if (!code || !payload.c?.apiKey || !payload.c?.projectId) return null;
    return { code, config: payload.c };
  } catch {
    return null;
  }
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateHouseholdCode() {
  const values = crypto.getRandomValues(new Uint32Array(10));
  const chars = [...values].map((v) => CODE_ALPHABET[v % CODE_ALPHABET.length]).join('');
  return `${chars.slice(0, 5)}-${chars.slice(5)}`;
}

export function normalizeHouseholdCode(input) {
  const cleaned = String(input ?? '').toUpperCase().split('').filter((c) => CODE_ALPHABET.includes(c)).join('');
  return cleaned.length === 10 ? `${cleaned.slice(0, 5)}-${cleaned.slice(5)}` : null;
}
