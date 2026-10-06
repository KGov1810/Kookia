// Tests : Statuts, libellés et compteurs du stock.
import { describe, it, test, expect } from 'vitest';
import * as Services from '../../src/services/index.js';
import * as Reference from '../../src/data/reference/index.js';

const S = { ...Services, ...Reference };

test('Statuts, libellés et compteurs du stock', async () => {
  const check = (cond, msg, extra = '') => expect.soft(Boolean(cond), `${msg} ${extra}`.trim()).toBe(true);
  const today = new Date(2026, 9, 1); // 1er octobre 2026
  const iso = (y, m, d) => S.toISODate(new Date(y, m - 1, d));
  const ms = (y, m, d) => new Date(y, m - 1, d).getTime();
  // Statuts selon le type de date
  check(S.stockStatus({ expiry: iso(2026, 9, 29) }, 2, today) === 'expired', 'ancien produit (DLC) dépassé → périmé');
  check(S.stockStatus({ expiry: iso(2026, 9, 29), dateKind: 'ddm' }, 2, today) === 'soon', 'DDM dépassée → à consommer vite, pas périmé');
  check(S.stockStatus({ expiry: iso(2026, 10, 10), dateKind: 'ddm' }, 2, today) === 'soon' && S.stockStatus({ expiry: iso(2026, 11, 10), dateKind: 'ddm' }, 2, today) === 'ok', 'DDM : alerte 14 jours avant');
  check(S.stockStatus({ expiry: iso(2026, 10, 20), dateKind: 'congele' }, 2, today) === 'soon' && S.stockStatus({ expiry: iso(2027, 3, 1), dateKind: 'congele' }, 2, today) === 'ok', 'congelé : alerte 30 jours avant');
  check(S.stockStatus({ dateKind: 'aucune', createdAt: ms(2026, 6, 1) }, 2, today) === 'ok' && S.stockStatus({ dateKind: 'aucune', createdAt: ms(2026, 2, 1) }, 2, today) === 'old', 'sans date : « oublié » après 6 mois');
  check(S.stockStatus({ expiry: '', dateKind: 'dlc' }, 2, today) === 'pending', 'date à compléter');
  check(S.stockStatus({ expiry: iso(2026, 9, 30), dateKind: 'estimee' }, 2, today) === 'soon', 'estimée dépassée → à vérifier (pas périmé)');
  // Libellés
  check(S.stockLabel({ dateKind: 'aucune', location: 'placard', createdAt: ms(2026, 2, 1) }, today) === 'Au placard depuis 8 mois', 'libellé ancienneté', S.stockLabel({ dateKind: 'aucune', location: 'placard', createdAt: ms(2026, 2, 1) }, today));
  check(S.stockLabel({ dateKind: 'congele', frozenAt: iso(2026, 3, 3), expiry: iso(2026, 9, 3) }, today).includes('durée conseillée dépassée'), 'congelé dépassé');
  check(S.stockLabel({ dateKind: 'congele', frozenAt: iso(2026, 9, 3), expiry: iso(2027, 3, 3) }, today) === 'Congelé le 3 septembre, idéalement avant mars 2027', 'libellé congelé', S.stockLabel({ dateKind: 'congele', frozenAt: iso(2026, 9, 3), expiry: iso(2027, 3, 3) }, today));
  check(S.stockShort({ dateKind: 'aucune', createdAt: ms(2026, 9, 21) }, today) === 'depuis 10 jours', 'court : ancienneté');
  // Compteurs
  const c1 = S.stockCounter({ expiry: iso(2027, 4, 1), dateKind: 'congele' }, 2, today);
  check(c1.number === 6 && c1.label === 'mois' && c1.approx, 'compteur congelé : ≈ 6 mois', JSON.stringify(c1));
  const c2 = S.stockCounter({ dateKind: 'aucune', createdAt: ms(2026, 2, 1) }, 2, today);
  check(c2.number === 8 && c2.label === 'mois ici' && c2.cls === 'old', 'compteur placard : 8 mois ici (oublié)', JSON.stringify(c2));
  const c3 = S.stockCounter({ expiry: iso(2026, 10, 4), dateKind: 'estimee' }, 2, today);
  check(c3.number === 3 && c3.approx && c3.cls === 'ok', 'compteur estimé : ≈ 3 jours', JSON.stringify(c3));
  // Estimations
  check(S.freezerLimit('viande', iso(2026, 10, 1)) === iso(2027, 4, 1) && S.freezerLimit('fruits_legumes', iso(2026, 10, 1)) === iso(2027, 10, 1), 'congélateur : viande 6 mois, légumes 12 mois');
  check(S.freezerLimit('viande', iso(2026, 8, 31)) === iso(2027, 2, 28), 'fin de mois gérée (31 août + 6 mois → 28 février)');
  check(S.produceFor('tomates cerises')?.name === 'Tomates' && S.produceFor('Banane')?.name === 'Bananes' && S.produceFor('Pomme de terre')?.name === 'Pommes de terre', 'catalogue : tomates cerises, banane, pomme de terre');
  check(S.produceFor('Pommes')?.name === 'Pommes', '« Pommes » ≠ « Pommes de terre »');
  check(S.estimateFreshDays('Carottes', 'frigo') === 21 && S.estimateFreshDays('Topinambour', 'fruits') === 7, 'durées : carottes 21 j, inconnu 7 j');
  // Prompt
  check(S.promptStock({ dateKind: 'aucune', location: 'placard', createdAt: ms(2026, 2, 1) }, today) === 'au placard depuis 8 mois (pas de date)', 'prompt placard');
  check(S.promptStock({ dateKind: 'congele', location: 'congelateur', frozenAt: iso(2026, 6, 1), expiry: iso(2026, 12, 1) }, today).includes('(à décongeler)'), 'prompt congelé');
  check(S.ORIGINS.some((o) => o.id === 'bresilienne' && o.emoji === '🇧🇷') && S.ORIGINS.length === 17, 'cuisine brésilienne (17 choix)');

});
