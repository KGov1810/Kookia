// Kookia — Messages d'erreur compréhensibles.

export function errorMessage(error) {
  const code = error?.code ?? '';
  switch (code) {
    case 'permission-denied':
      return 'Accès refusé par Firebase : vérifiez les règles Firestore (README, étape 1).';
    case 'unavailable':
      return 'Pas de connexion : les modifications seront envoyées au retour du réseau.';
    case 'not-found':
    case 'failed-precondition':
      return 'Base Firestore introuvable : créez-la dans la console Firebase (README, étape 1).';
    case 'auth/operation-not-allowed':
    case 'auth/admin-restricted-operation':
      return 'Activez la connexion « Anonyme » dans Firebase > Authentication (README, étape 1).';
    case 'auth/configuration-not-found':
      return 'Authentication n\'est pas activé dans la console Firebase (README, étape 1).';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'Configuration Firebase invalide : recopiez-la depuis la console Firebase.';
    case 'auth/network-request-failed':
      return 'Pas de connexion internet.';
    default:
      return error?.message ?? String(error);
  }
}
