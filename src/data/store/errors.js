// Kookia — Messages d'erreur compréhensibles.

import { t } from '../../services/i18n/i18n.js';

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
