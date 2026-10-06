// Scénario : Messages d'erreur de configuration Firebase.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test("Messages d'erreur de configuration Firebase", async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  globalThis.__db = { docs: new Map(), listeners: new Set(), writes: 0 };
  const config = 'apiKey: "AIzaX", authDomain: "a", projectId: "p", storageBucket: "s", messagingSenderId: "1", appId: "1:1:web:1"';

  let P = await createPhone('err1', { standalone: false });
  await P.click('[data-action="dismiss-install"]');
  log(P.text().includes('Connexion'), 'Continuer dans Safari → étape connexion');
  await P.type('#connect-text', config); await P.click('[data-action="connect"]');
  await P.type('#ob-name', 'Léa');
  globalThis.__authError = Object.assign(new Error('x'), { code: 'auth/admin-restricted-operation' });
  await P.click('[data-action="create"]', 60);
  log(P.text().includes('Activez la connexion « Anonyme »'), 'Connexion anonyme désactivée : consigne claire');
  globalThis.__authError = Object.assign(new Error('x'), { code: 'auth/configuration-not-found' });
  await P.click('[data-action="create"]', 60);
  log(P.text().includes("Authentication n'est pas activé"), 'Authentication non initialisé : consigne claire');
  globalThis.__authError = null;
  await P.type('#join-text', 'ZZZZZ-ZZZZZ');
  await P.click('[data-action="join"]', 60);
  log(P.text().includes('Aucun foyer ne correspond'), 'Code de foyer inexistant : message clair');
  await P.type('#join-text', 'abc');
  await P.click('[data-action="join"]', 60);
  log(P.text().includes('Code invalide'), 'Code mal formé : message clair');
  log(P.errors.length === 0, `Erreurs JS : ${P.errors.length ? P.errors : 'aucune'}`);

});
