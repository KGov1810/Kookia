// Tests : régimes des recettes (viande ou poisson, végétarien, vegan) et équilibre demandé à Claude.
import { describe, it, expect } from 'vitest';
import { DIETS } from '../../src/data/reference/recipe-options.js';
import { filterLines, matchesFilters } from '../../src/services/recipes/recipe-filters.js';

const recipe = (diet) => ({ title: 'Plat', summary: '', ingredients: [], difficulty: 'facile', totalMinutes: 20, diet, kcal: 500 });
const text = (filters) => filterLines(filters).join('\n');

describe('régimes', () => {
  it('quatre choix : Tous, Viande ou poisson, Végétarien, Vegan', () => {
    expect(DIETS.map((d) => d.id)).toEqual(['', 'omnivore', 'vegetarien', 'vegan']);
  });

  it('filtre des recettes affichées', () => {
    const all = ['omnivore', 'vegetarien', 'vegan'].map(recipe);
    const shown = (diet) => all.filter((r) => matchesFilters(r, { diet })).map((r) => r.diet);
    expect(shown('')).toEqual(['omnivore', 'vegetarien', 'vegan']);
    expect(shown('omnivore')).toEqual(['omnivore']);
    expect(shown('vegetarien')).toEqual(['vegetarien', 'vegan']);
    expect(shown('vegan')).toEqual(['vegan']);
  });

  it('sans filtre : au moins 2 recettes avec viande ou poisson, achetables si le stock n\'en a pas', () => {
    const t = text({});
    expect(t).toContain('Équilibre : au moins 2 des recettes contiennent de la viande, de la volaille, du poisson ou des fruits de mer');
    expect(t).toContain('congélateur');
    expect(t).toContain("s'il n'y en a pas, prévois-les dans les ingrédients à acheter");
    expect(t).not.toContain('Toutes les recettes doivent contenir de la viande');
  });

  it('avec une envie libre, l\'équilibre passe après l\'envie', () => {
    expect(text({ wish: 'salade de fruits' })).toContain("Équilibre (sauf si l'envie de l'utilisateur ne s'y prête pas)");
  });

  it('« Viande, poisson » : toutes les recettes en contiennent', () => {
    const t = text({ diet: 'omnivore' });
    expect(t).toContain('Toutes les recettes doivent contenir de la viande, de la volaille, du poisson ou des fruits de mer');
    expect(t).not.toContain('Équilibre');
  });

  it('végétarien ou vegan : pas de consigne viande', () => {
    for (const diet of ['vegetarien', 'vegan']) {
      expect(text({ diet })).not.toMatch(/Équilibre|doivent contenir de la viande/);
    }
  });
});
