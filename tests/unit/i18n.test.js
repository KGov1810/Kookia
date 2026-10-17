// Tests : traductions (dictionnaires complets, pluriels, langue de l'iPhone, formats).
import { test, expect } from 'vitest';
import { STRINGS } from '../../src/data/reference/i18n/index.js';
import { detectLanguage, formatDate, formatEuro, localeTag, setLanguage, t } from '../../src/services/index.js';

const placeholders = (text) => [...String(text).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

test('Dictionnaires : 4 langues pour chaque texte, mêmes {valeurs}, pluriels complets', () => {
  const check = (cond, msg) => expect.soft(Boolean(cond), msg).toBe(true);
  for (const [key, entry] of Object.entries(STRINGS)) {
    check(Array.isArray(entry) && entry.length === 4, `${key} : 4 traductions`);
    const plural = Array.isArray(entry[0]);
    entry.forEach((text, i) => {
      if (plural) {
        check(Array.isArray(text) && text.length === 2 && text.every((x) => x.trim()), `${key} [${i}] : singulier et pluriel`);
        check(placeholders(text[1]) === placeholders(entry[0][1]), `${key} [${i}] : mêmes valeurs`);
      } else {
        check(typeof text === 'string' && text.trim(), `${key} [${i}] : texte`);
        check(placeholders(text) === placeholders(entry[0]), `${key} [${i}] : mêmes valeurs ({…})`);
      }
    });
  }
});

test('Langue : celle de l\'iPhone, pluriels, formats, retour au français', () => {
  const check = (cond, msg) => expect.soft(Boolean(cond), msg).toBe(true);
  check(detectLanguage(['pt-BR', 'en']) === 'pt' && detectLanguage(['de-DE', 'es-MX']) === 'es' && detectLanguage(['de-DE']) === 'fr', 'Langue de l\'iPhone (sinon français)');
  setLanguage('en');
  check(t('tab.recipes') === 'Recipes' && t('settings.daysBefore', { n: 1 }) === '1 day before' && t('settings.daysBefore', { n: 3 }) === '3 days before', `Anglais : ${t('settings.daysBefore', { n: 3 })}`);
  check(t('sync.okWith', { name: 'Marie' }) === 'Synced with Marie', 'Valeurs remplacées');
  check(localeTag() === 'en-US' && formatEuro(2.5) === '€2.50' && formatDate('2026-10-22', { day: 'numeric', month: 'long' }) === 'October 22', `Formats anglais : ${formatEuro(2.5)}, ${formatDate('2026-10-22', { day: 'numeric', month: 'long' })}`);
  setLanguage('es');
  check(t('tab.shopping') === 'Compras' && localeTag() === 'es-419', 'Espagnol d\'Amérique latine');
  setLanguage('pt');
  check(t('settings.daysBefore', { n: 2 }) === '2 dias antes' && localeTag() === 'pt-BR', 'Portugais du Brésil');
  setLanguage('fr');
  check(t('settings.daysBefore', { n: 0 }) === '0 jour avant' && formatEuro(2.5) === '2,50 €' && t('clé.inconnue') === 'clé.inconnue', 'Français : 0 au singulier, euros, clé inconnue rendue telle quelle');
});
