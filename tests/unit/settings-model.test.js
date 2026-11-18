// Le modèle enregistré sur l'iPhone reste un modèle proposé dans Réglages.
import { afterEach, expect, test } from 'vitest';
import { MODELS } from '../../src/data/reference/models.js';
import { loadSettings, SETTINGS_KEY } from '../../src/data/store/settings-storage.js';

afterEach(() => localStorage.clear());

const modelAfter = (model) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ userName: 'Kevin', model }));
  return loadSettings().model;
};

test('Réglages proposent Sonnet 5.5 et Haiku 5.5', () => {
  expect(MODELS.map((m) => m.id)).toEqual(['claude-sonnet-5-5', 'claude-haiku-5-5']);
});

test('Haiku 4.5 enregistré passe à Haiku 5.5, un modèle inconnu au modèle conseillé', () => {
  expect(modelAfter('claude-haiku-4-5')).toBe('claude-haiku-5-5');
  expect(modelAfter('claude-3-opus')).toBe('claude-sonnet-5-5');
  expect(modelAfter('claude-haiku-5-5')).toBe('claude-haiku-5-5');
  expect(modelAfter(undefined)).toBe('claude-sonnet-5-5');
});
