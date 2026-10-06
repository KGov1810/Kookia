// Scénario : ouverture dans Safari (app pas encore installée).
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test('Safari : écran « Installez d\'abord l\'app »', async () => {
  const P = await createPhone('safari', { standalone: false });
  expect(P.text()).toContain("Installez d'abord l'app");
  expect(P.w.document.body.classList.contains('onboarding'), 'barre d\'onglets masquée pendant l\'accueil').toBe(true);
});
