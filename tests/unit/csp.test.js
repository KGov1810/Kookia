// Tests : politique de sécurité du contenu (index.html) et empreintes des bibliothèques du CDN.
// Un script de la page modifié sans mettre à jour son empreinte serait bloqué par l'iPhone : ce test le signale.
import { test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { SCRIPT_INTEGRITY, TESSERACT_URL, ZXING_URL, loadScript } from '../../src/services/device/script-loader.js';

const html = readFileSync('index.html', 'utf8');
const policy = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '';
const directive = (name) => policy.split(';').map((d) => d.trim()).find((d) => d.startsWith(`${name} `)) ?? '';

test('Chaque script de la page a son empreinte dans la politique', () => {
  const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  expect(inline.length).toBe(2);
  for (const code of inline) {
    expect(directive('script-src')).toContain(`'sha256-${createHash('sha256').update(code, 'utf8').digest('base64')}'`);
  }
});

test('Politique : pas de script injecté, pas de plugin, bibliothèques du seul CDN prévu', () => {
  expect(directive('script-src')).not.toContain("'unsafe-inline'");
  expect(directive('script-src')).not.toContain("'unsafe-eval'");
  expect(directive('script-src')).toContain('https://cdn.jsdelivr.net');
  expect(directive('object-src')).toBe("object-src 'none'");
  expect(directive('base-uri')).toBe("base-uri 'self'");
});

test('Bibliothèques du CDN : une empreinte SRI pour chacune', () => {
  for (const url of [ZXING_URL, TESSERACT_URL]) {
    expect(new URL(url).hostname).toBe('cdn.jsdelivr.net');
    expect(url).toMatch(/@\d+\.\d+\.\d+\//); // version figée : l'empreinte ne change pas
    expect(SCRIPT_INTEGRITY[url]).toMatch(/^sha384-[A-Za-z0-9+/]{64}$/);
  }
});

test('Le script ajouté à la page porte son empreinte (vérifiée par le navigateur)', () => {
  loadScript(ZXING_URL).catch(() => {});
  const script = document.head.querySelector(`script[src="${ZXING_URL}"]`);
  expect(script.getAttribute('integrity')).toBe(SCRIPT_INTEGRITY[ZXING_URL]);
  expect(script.getAttribute('crossorigin')).toBe('anonymous');
});
