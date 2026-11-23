// Tests : fiches accessibles (nom annoncé par VoiceOver, focus à l'ouverture et au retour, Échap pour fermer).
import { test, expect, vi } from 'vitest';
import { html } from '../../src/components/html.js';
import { openSheet } from '../../src/components/sheet.js';

test('Fiche : nommée par son titre, focus dedans puis rendu au bouton, Échap la ferme', async () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'requestAnimationFrame'] });
  document.body.innerHTML = '<main id="screen"><button id="opener">Ouvrir</button><input id="field"></main>';
  const opener = document.getElementById('opener');
  opener.focus();
  let closed = 0;
  const sheet = openSheet({ render: () => html`<header><h2>Modifier le produit</h2></header><div class="sheet-body"></div>`, onClose: () => { closed++; } });
  const title = sheet.panel.querySelector('h2');
  expect(sheet.panel.getAttribute('role')).toBe('dialog');
  expect(sheet.panel.getAttribute('aria-labelledby')).toBe(title.id);
  await vi.advanceTimersByTimeAsync(40);
  expect(document.activeElement).toBe(sheet.panel);

  sheet.update(); // redessinée : toujours nommée
  expect(sheet.panel.getAttribute('aria-labelledby')).toBe(sheet.panel.querySelector('h2').id);

  sheet.panel.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  expect(closed).toBe(1);
  expect(document.activeElement).toBe(opener);

  // Ouverte depuis un champ : le focus n'y retourne pas (le clavier de l'iPhone se rouvrirait).
  const field = document.getElementById('field');
  field.focus();
  const second = openSheet({ render: () => html`<p>Sans titre</p>` });
  expect(second.panel.hasAttribute('aria-labelledby')).toBe(false);
  await vi.advanceTimersByTimeAsync(40);
  second.close();
  expect(document.activeElement).not.toBe(field);
  vi.useRealTimers();
});
