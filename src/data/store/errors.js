// Kookia — Messages d'erreur compréhensibles.

import { t } from '../../services/i18n/i18n.js';
import { emit, state } from './state.js';

export function errorMessage(error) {
  const code = error?.code ?? '';
  switch (code) {
    case 'permission-denied':
      return t('error.denied');
    case 'unavailable':
      return t('error.unavailable');
    case 'not-found':
    case 'failed-precondition':
      return t('error.noDatabase');
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return t('error.anonymous');
    case 'auth/configuration-not-found':
      return t('error.noAuth');
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return t('error.badConfig');
    case 'auth/network-request-failed':
      return t('error.network');
    default:
      return error?.message ?? String(error);
  }
}

/** Échec d'une écriture : message dans l'app (bandeau d'erreur, Réglages). */
export function reportWriteError(error) {
  state.error = errorMessage(error);
  emit('sync');
}

/**
 * Refus des règles Firestore pour les statistiques ou les mémoires du foyer (règles pas encore mises à jour) :
 * message clair dans l'onglet Stats, le stock fonctionne quand même. Renvoie vrai si c'était le cas.
 */
export function reportStatsDenied(error) {
  if (error?.code !== 'permission-denied') return false;
  state.movementsError = t('stats.denied');
  emit('movements');
  return true;
}

/** Statistiques et mémoires du foyer (prix, catégories, dates, langues) : refus des règles, ou autre erreur affichée. */
export function reportMemoryError(error) {
  if (!reportStatsDenied(error)) reportWriteError(error);
}
