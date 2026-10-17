// Tests : durée des fruits et légumes selon le rangement (au frigo ou non), et date qui suit le rangement.
import { test, expect } from 'vitest';
import { estimatedExpiry, estimateFreshDays, keptCold, promptStock } from '../../src/services/index.js';

test('Fruits et légumes : au frigo ou hors du frigo', () => {
  const check = (cond, msg) => expect.soft(Boolean(cond), msg).toBe(true);
  check(estimateFreshDays('Pommes', 'fruits') === 14 && estimateFreshDays('Pommes', 'frigo') === 45, 'Pommes : 14 jours hors du frigo, 45 au frigo');
  check(estimateFreshDays('Fraises', 'frigo') === 3 && estimateFreshDays('Fraises', 'fruits', '', false) === 1, 'Fraises : 3 jours au frigo, 1 hors du frigo');
  check(estimateFreshDays('Pommes de terre', 'placard') === 45, 'Placard : hors du frigo');
  // « Fruits & légumes » : le choix de la fiche, sinon l'habitude du produit.
  check(keptCold({ name: 'Carottes', location: 'fruits' }) && !keptCold({ name: 'Bananes', location: 'fruits' }), 'Habitude : carottes au frais, bananes non');
  check(keptCold({ name: 'Bananes', location: 'fruits', cold: true }) && !keptCold({ name: 'Carottes', location: 'fruits', cold: false }), 'Choix de la fiche');
  check(keptCold({ name: 'Bananes', location: 'frigo', cold: false }) && !keptCold({ name: 'Carottes', location: 'placard' }), 'Frigo toujours au frais, placard jamais');
  const added = new Date(2026, 9, 10).getTime();
  check(estimatedExpiry({ name: 'Carottes', location: 'fruits', cold: false, createdAt: added }) === '2026-10-15', 'Date estimée comptée depuis l\'ajout (carottes hors du frigo : 5 jours)');
  check(estimatedExpiry({ name: 'Carottes', location: 'fruits', createdAt: added }) === '2026-10-31', 'Carottes au frais : 21 jours');
  check(promptStock({ name: 'Bananes', location: 'fruits', dateKind: 'estimee', expiry: '2026-10-20', createdAt: added }, new Date(2026, 9, 12)).startsWith('avec les fruits et légumes (hors du frigo)'), 'Claude sait si c\'est au frais');
});
