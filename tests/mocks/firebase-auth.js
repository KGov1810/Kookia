// Simulation de firebase/auth pour les tests (connexion anonyme).
export const indexedDBLocalPersistence = { type: 'LOCAL' };
export const browserLocalPersistence = { type: 'LOCAL' };
export const browserSessionPersistence = { type: 'SESSION' };
export function initializeAuth() { return globalThis.__auth ??= { currentUser: null, async authStateReady() {} }; }
export async function signInAnonymously(auth) {
  if (globalThis.__authError) throw globalThis.__authError;
  auth.currentUser = { uid: 'anon-1' }; return { user: auth.currentUser };
}
