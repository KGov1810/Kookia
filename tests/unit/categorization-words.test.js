// Tests : catégorie d'après le nom (mot principal, expressions, vocabulaire), code-barres et Claude en recours.
import { describe, it, expect } from 'vitest';
import { PHRASES, STRONG_WORDS, WEAK_WORDS } from '../../src/data/reference/category-words.js';
import { categorizeProduct, CATEGORIZE_MODEL } from '../../src/services/claude/categorize.js';
import { CATEGORY_GUIDE } from '../../src/services/claude/category-guide.js';
import { lookupBarcode } from '../../src/services/external/open-food-facts.js';
import { categoryTokens, guessCategory } from '../../src/services/stock/categorization.js';

// Noms qui étaient mal classés avant (le mot principal n'était pas pris en compte, vocabulaire trop court).
const fixed = {
  'Farine de blé fluide spéciale sauces': 'patisserie', 'Sucre glace': 'patisserie', 'Chocolat pâtissier': 'patisserie',
  'Pain au chocolat': 'boulangerie', 'Lapin': 'viande', 'Filet mignon': 'viande', 'Paleron': 'viande', 'Rumsteck': 'viande',
  'Faux-filet': 'viande', 'Cordon bleu': 'volaille', 'Tournedos': 'viande', 'Osso bucco': 'viande', 'Kebab': 'viande',
  'Andouillette': 'charcuterie', 'Lait de coco': 'conserves', 'Crème de marrons': 'sucre', 'Maïs doux': 'conserves',
  'Petits pois carottes': 'conserves', 'Coca-Cola': 'boisson', 'Thé vert': 'boisson', 'Hummus': 'traiteur', 'Magret de canard': 'volaille'
};

// Noms jamais vus pendant la mise au point du vocabulaire.
const fresh = {
  'Steak haché pur bœuf 15% MG (Charal)': 'viande', 'Côtes de porc échine': 'viande', 'Gésiers de canard confits': 'volaille',
  'Blanc de poulet rôti tranches': 'volaille', 'Filets de maquereaux à la moutarde': 'poisson', 'Dos de cabillaud': 'poisson',
  'Pavé de saumon': 'poisson', 'Escalopes de veau': 'viande', 'Brochettes de dinde': 'volaille', 'Saucisses de Toulouse': 'charcuterie',
  'Fromage râpé spécial pizza': 'fromage', 'Beurre demi-sel': 'laitier', 'Yaourts aux fruits': 'laitier', 'Œufs plein air x12': 'oeufs',
  'Farine de sarrasin': 'patisserie', 'Sucre roux de canne': 'patisserie', 'Chocolat au lait': 'sucre', 'Biscuits fourrés chocolat': 'sucre',
  'Haricots blancs à la tomate en conserve': 'conserves', 'Tomates concassées en boîte': 'conserves', 'Huile de tournesol': 'condiments',
  'Vinaigre de cidre': 'condiments', 'Bouillon cube volaille': 'condiments', 'Chips saveur barbecue': 'snacks', 'Abricots secs': 'fruits_secs',
  'Vin rouge Bordeaux': 'boisson', 'Thé glacé pêche': 'boisson', 'Lait d\'amande sans sucre': 'boisson', 'Haricots verts surgelés': 'surgele',
  'Pizza surgelée 4 fromages': 'surgele', 'Pain complet tranché': 'boulangerie', 'Lasagnes bolognaise': 'traiteur', 'Persil plat': 'legumes',
  'Pois cassés': 'legumineuses', 'Fond de veau': 'condiments', 'Levure boulangère': 'patisserie', 'Crème glacée vanille': 'surgele',
  'Noix de muscade': 'condiments', 'Noix de Saint-Jacques': 'poisson', 'Pâté de foie': 'charcuterie', 'Pâtes complètes': 'feculents'
};

describe('catégorie d\'après le nom', () => {
  it.each(Object.entries(fixed))('corrigé : %j → %s', (name, expected) => expect(guessCategory(name)).toBe(expected));
  it.each(Object.entries(fresh))('inédit : %j → %s', (name, expected) => expect(guessCategory(name)).toBe(expected));

  it('le premier aliment nommé l\'emporte ; un morceau seul (« steak », « filet ») passe après', () => {
    expect(guessCategory('Sauce bolognaise au bœuf')).toBe('condiments');
    expect(guessCategory('Rôti de dinde')).toBe('volaille');
    expect(guessCategory('Steak de thon')).toBe('poisson');
    expect(guessCategory('Steak haché')).toBe('viande');
  });

  it('mots normalisés : accents, pluriel, féminin, « pâté » ≠ « pâtes »', () => {
    expect(categoryTokens('Pâtés')).toEqual(['pateviande']);
    expect(categoryTokens('Pâtes')).toEqual(['pate']);
    expect(categoryTokens('Surgelées')).toEqual(['surgele']);
    expect(categoryTokens('Jus d\'orange (Tropicana)')).toEqual(['jus', 'orange']);
  });

  it('vocabulaire : aucun mot rangé dans deux catégories', () => {
    const seen = new Map();
    const tables = [STRONG_WORDS, WEAK_WORDS, Object.fromEntries(Object.entries(PHRASES).map(([id, list]) => [id, list.join('|')]))];
    for (const [index, table] of tables.entries()) {
      for (const [id, words] of Object.entries(table)) {
        for (const word of words.split(index === 2 ? '|' : ' ')) {
          const key = categoryTokens(word).join(' ');
          if (index < 2 && seen.has(key) && seen.get(key) !== id) throw new Error(`« ${word} » : ${seen.get(key)} et ${id}`);
          seen.set(key, id);
        }
      }
    }
  });
});

describe('code-barres et Claude', () => {
  const offAnswer = (product) => async () => ({ ok: true, status: 200, json: async () => ({ status: 1, product }) });

  it('Open Food Facts sans catégorie : celle du nom (au lieu de « Autre »)', async () => {
    globalThis.fetch = offAnswer({ product_name_fr: 'Rumsteck', categories_tags: [] });
    expect((await lookupBarcode('3250390000000')).category).toBe('viande');
    globalThis.fetch = offAnswer({ product_name_fr: 'Truc mystère', categories_tags: [] });
    expect((await lookupBarcode('3250390000000')).category).toBe('autre');
    globalThis.fetch = offAnswer({ product_name_fr: 'Farine fluide', categories_tags: ['en:plant-based-foods', 'fr:farines-de-ble'] });
    expect((await lookupBarcode('3250390000000')).category).toBe('patisserie');
  });

  it('Claude reçoit le sens de chaque catégorie, avec des exemples', () => {
    expect(CATEGORY_GUIDE).toContain('- patisserie : Farine, sucre et pâtisserie (ingrédients pour cuisiner et pâtisser : farine');
    expect(CATEGORY_GUIDE).toContain('« farine spéciale sauces » → patisserie');
  });

  it('nom inconnu : Claude propose catégorie et lieu, avec le modèle économique', async () => {
    let body = null;
    const answer = (input) => async (_url, opts) => {
      body = JSON.parse(opts.body);
      return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input }] }) };
    };
    globalThis.fetch = answer({ categorie: 'condiments', lieu: 'placard' });
    expect(await categorizeProduct({ key: 'k', name: 'Gomasio' })).toEqual({ category: 'condiments', location: 'placard' });
    expect(body.model).toBe(CATEGORIZE_MODEL);
    expect(body.messages[0].content[0].text).toContain('Produit : « Gomasio »');
    globalThis.fetch = answer({ categorie: 'autre', lieu: 'placard' });
    expect(await categorizeProduct({ key: 'k', name: 'Éponge' })).toEqual({ category: null, location: null });
  });
});
