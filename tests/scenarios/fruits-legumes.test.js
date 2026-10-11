// Scénario : fruits et légumes de la grille, avec poids total et prix payé par ligne.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test('Fruits et légumes : poids et prix', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'FRUIT-LEGUM';
  const F = `foyers/${CODE}/`;
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [F + 'prix/memoire', { prices: { 'nom:pomme': { price: 0.6, at: 1 } } }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('fruits-legumes', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $$, click, type } = P;
  const sheet = () => $$('.sheet').at(-1);
  const chip = (name) => [...sheet().querySelectorAll('.produce-chip')].find((c) => c.dataset.name === name);
  const field = (name, kind) => [...sheet().querySelectorAll(`[data-field="${kind}"]`)].find((i) => i.dataset.name === name);
  const hint = (name) => [...sheet().querySelectorAll('[data-hint]')].find((h) => h.dataset.hint === name);
  const plus = (name) => [...sheet().querySelectorAll('[data-action="plus"]')].find((b) => b.dataset.name === name);
  const units = (name) => [...sheet().querySelectorAll('[data-action="set-unit"]')].filter((b) => b.dataset.name === name);
  const unit = (name, u) => units(name).find((b) => b.dataset.unit === u);
  const pressed = (name) => units(name).find((b) => b.getAttribute('aria-pressed') === 'true')?.dataset.unit;
  const docs = (sub) => [...globalThis.__db.docs.entries()].filter(([k]) => k.startsWith(F + sub + '/')).map(([k, v]) => ({ id: k.split('/').pop(), ...v }));
  const product = (name) => docs('produits').find((d) => d.name === name);
  await P.tick(80);

  await click('[data-action="add-menu"]');
  await click(sheet().querySelector('[data-action="produce"]'), 400);
  for (let i = 0; i < 3; i += 1) await click(chip('Pommes'));
  log(field('Pommes', 'weight') && field('Pommes', 'price'), 'Chaque ligne a un champ « Poids total » et un champ « Prix payé »');
  log(field('Pommes', 'price').value === '1,80', `Prix proposé : dernier prix × 3 = ${field('Pommes', 'price').value}`);
  log(hint('Pommes').textContent === '0,60 € pièce · dernier prix payé, à vérifier', `Aide : « ${hint('Pommes').textContent} »`);
  log(units('Pommes').map((b) => b.dataset.unit).join('|') === 'g|kg' && pressed('Pommes') === 'kg', 'Boutons g | kg, kilo choisi par défaut');
  log(field('Pommes', 'weight').getAttribute('inputmode') === 'decimal', 'Clavier numérique pour le chiffre');
  await type(field('Pommes', 'weight'), '1,2');
  log(hint('Pommes').textContent.startsWith('1,2 kg au total, ≈ 400 g pièce'), `Chiffre seul + kg : « ${hint('Pommes').textContent} »`);

  await click(chip('Carottes'));
  await click(chip('Carottes'));
  log(field('Carottes', 'price').value === '' && hint('Carottes').hidden, 'Produit jamais acheté : pas de prix proposé');
  await type(field('Carottes', 'price'), '2');
  await click(plus('Carottes'));
  log(field('Carottes', 'price').value === '2' && hint('Carottes').textContent === '0,67 € pièce', 'Prix tapé gardé quand le nombre change (2 € pour 3 = 0,67 € pièce)');
  log(field('Pommes', 'weight').value === '1,2' && pressed('Pommes') === 'kg', 'Le poids déjà tapé reste après un nouvel affichage');
  await type(field('Carottes', 'weight'), 'un sac');
  log(hint('Carottes').textContent.startsWith('Poids illisible'), 'Poids illisible signalé tout de suite');
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  log(sheet().textContent.includes('Poids illisible pour Carottes') && !product('Pommes'), 'Ajout bloqué avec un message clair, rien d\'enregistré');
  await type(field('Carottes', 'weight'), '800');
  await click(unit('Carottes', 'g'));
  log(pressed('Carottes') === 'g' && hint('Carottes').textContent.startsWith('800 g au total, ≈ 267 g pièce'), 'Toucher « g » : 800 g au total, ≈ 267 g pièce');
  log(field('Carottes', 'weight').value === '800', 'Le chiffre reste après le choix de l\'unité');

  await click(chip('Bananes'));
  await type(field('Bananes', 'price'), '1,9x');
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);
  log(sheet().textContent.includes('Prix illisible pour Bananes'), 'Prix illisible : message clair');
  await type(field('Bananes', 'price'), '1,90');
  await type(field('Bananes', 'weight'), '1,1');
  await click(sheet().querySelector('.sheet-body [data-action="confirm"]'), 350);

  log(product('Pommes')?.count === 3 && product('Pommes').quantity === '400 g' && product('Pommes').unitPrice === 0.6, 'Pommes : 3 × 400 g, 0,60 € pièce');
  log(product('Carottes')?.count === 3 && product('Carottes').quantity === '267 g' && product('Carottes').unitPrice === 0.667, 'Carottes : 3 × 267 g, 2 € ÷ 3');
  log(product('Bananes')?.count === 1 && product('Bananes').quantity === '1,1 kg' && product('Bananes').unitPrice === 1.9, 'Une seule pièce : 1,1 kg, 1,90 €');
  const buy = docs('mouvements').find((m) => m.name === 'Pommes');
  log(buy?.type === 'achat' && buy.count === 3 && buy.unitPrice === 0.6, 'Statistiques : achat de 3 pommes à 0,60 €');
  log(globalThis.__db.docs.get(F + 'prix/memoire').prices['nom:carotte']?.price === 0.667, 'Prix des carottes mémorisé pour la prochaine fois');
  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');
  log(!P.errors.length, 'Aucune erreur JS');
});
