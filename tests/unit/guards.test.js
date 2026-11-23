// Tests : garde-fous contre deux erreurs silencieuses (un bouton qui déclenche l'action d'un autre écran,
// un texte affiché sous forme de clé).
import { test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { STRINGS } from '../../src/data/reference/i18n/index.js';

const SRC = path.join(process.cwd(), 'src');

function sourceFiles(dir = SRC, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (full.endsWith('.js')) out.push(full);
  }
  return out;
}

test('Actions des écrans : aucun nom en double (la seconde remplacerait la première sans prévenir)', async () => {
  const screens = {
    stock: (await import('../../src/views/stock/stock-actions.js')).stockActions,
    recettes: (await import('../../src/views/recipes/recipes-actions.js')).recipesActions,
    courses: (await import('../../src/views/shopping/shopping-actions.js')).shoppingActions,
    stats: (await import('../../src/views/stats/stats-actions.js')).statsActions,
    reglages: (await import('../../src/views/settings/settings-actions.js')).settingsActions,
    accueil: (await import('../../src/views/onboarding/onboarding-actions.js')).onboardingActions
  };
  const owners = {};
  for (const [screen, actions] of Object.entries(screens)) {
    for (const name of Object.keys(actions)) (owners[name] ??= []).push(screen);
  }
  const shared = Object.entries(owners).filter(([, list]) => list.length > 1).map(([name, list]) => `${name} : ${list.join(', ')}`);
  expect(shared).toEqual([]);
});

test('Textes : chaque t(\'clé\') du code existe dans les dictionnaires', () => {
  const missing = [];
  for (const file of sourceFiles()) {
    for (const [, key] of fs.readFileSync(file, 'utf8').matchAll(/\bt\(\s*'([a-zA-Z0-9_.]+)'/g)) {
      if (!STRINGS[key]) missing.push(`${path.relative(SRC, file)} : ${key}`);
    }
  }
  expect(missing).toEqual([]);
});
