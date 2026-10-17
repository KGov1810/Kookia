// Tests : Recettes et Semaine traduites (durées, semaine, listes, régimes, origines) ; Claude reste en français.
import { test, expect } from 'vitest';
import { dietName, difficultyName, formatMinutes, inSentence, listText, originName, setLanguage, weekDayLabel, weekRangeLabel } from '../../src/services/index.js';

const plain = (text) => text.replace(/[   ]/g, ' ');

test('Recettes et Semaine en anglais, espagnol et portugais', () => {
  const check = (cond, msg) => expect.soft(Boolean(cond), msg).toBe(true);
  setLanguage('en');
  check(formatMinutes(75) === '1 hr 15 min' && formatMinutes(45) === '45 min', `EN : ${formatMinutes(75)}`);
  check(plain(weekRangeLabel('2026-10-14')) === 'October 14 – 20', `EN : ${weekRangeLabel('2026-10-14')}`);
  check(listText(['Courgettes', 'Comté', 'Crème']) === 'Courgettes, Comté, and Crème', 'EN : liste « and »');
  check(dietName('vegetarien') === 'Vegetarian' && difficultyName('facile') === 'Easy' && inSentence(originName('italienne')) === 'Italian', 'EN : régime, difficulté, origine');
  check(weekDayLabel('2026-10-14', 1, { weekday: 'long' }, 'fr') === 'jeudi', 'Jour du planning en français pour Claude');
  setLanguage('es');
  check(plain(weekRangeLabel('2026-09-28')) === '28 de septiembre – 4 de octubre' && listText(['a', 'b']) === 'a y b' && inSentence(originName('italienne')) === 'italiana', `ES : ${weekRangeLabel('2026-09-28')}`);
  setLanguage('pt');
  check(formatMinutes(120) === '2 h' && dietName('omnivore') === 'Carne, peixe' && originName('bresilienne') === 'Brasileira', 'PT : durée, régime, origine');
  setLanguage('fr');
  check(formatMinutes(75) === '1 h 15' && weekRangeLabel('2026-10-14') === 'Du 14 au 20 octobre' && weekRangeLabel('2026-09-28') === 'Du 28 septembre au 4 octobre', 'FR inchangé');
  check(listText(['Courgettes', 'Comté', 'Crème']) === 'Courgettes, Comté et Crème', 'FR : liste « et »');
});
