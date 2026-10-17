// Kookia — Langues du foyer : chaque iPhone note la sienne (foyers/{code}/prix/langues), lue par les deux.
// Claude écrit les recettes et le planning dans toutes ces langues. Rangé dans « prix » : déjà autorisé par les règles.

import { setDoc } from 'firebase/firestore';
import { language } from '../../services/i18n/i18n.js';
import { LANGUAGE_IDS } from '../reference/i18n/languages.js';
import { auth } from './connection.js';
import { reportStatsDenied } from './movements.js';
import { state } from './state.js';
import { canWrite, ref } from './writes.js';

const RECENT_MS = 60 * 86_400_000; // un iPhone qui n'a pas ouvert l'app depuis 60 jours ne compte plus
let published = '';

/** Note la langue de cet iPhone dans le foyer (une fois par lancement, et à chaque changement de langue). */
export function publishLanguage() {
  const uid = auth?.currentUser?.uid;
  if (!canWrite() || !uid) return;
  const key = `${state.settings.householdCode}:${uid}:${language()}`;
  if (published === key) return;
  published = key;
  const member = { lang: language(), name: state.settings.userName || '', at: Date.now() };
  setDoc(ref('prix', 'langues'), { members: { [uid]: member } }, { merge: true }).catch(reportStatsDenied);
}

/** Langues du foyer : celle de cet iPhone d'abord, puis celles des autres iPhone (récents). */
export function householdLanguages() {
  const now = Date.now();
  const others = Object.values(state.languages ?? {})
    .filter((m) => m && LANGUAGE_IDS.includes(m.lang) && now - (Number(m.at) || 0) < RECENT_MS)
    .map((m) => m.lang);
  return [...new Set([language(), ...others])];
}
