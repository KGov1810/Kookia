// Scénario : un écran n'est redessiné que pour les données qu'il affiche.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { iso } from '../helpers/dates.js';

test('Redessins : seulement quand les données affichées changent', async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const CODE = 'REDES-SINS2';
  const F = `foyers/${CODE}/`;
  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Kevin' }],
    [F + 'produits/yaourt', { name: 'Yaourts', expiry: iso(8), category: 'laitier', categoryVersion: 2, quantity: '', count: 4,
      location: 'frigo', dateKind: 'dlc', frozenAt: '', barcode: '', addedBy: 'Kevin', createdAt: 1 }]
  ]), listeners: new Set(), writes: 0, network: [] };
  const settings = { userName: 'Kevin', alertDays: 2, claudeKey: '', model: 'claude-sonnet-5-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('redessins', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, click, tick, w } = P;
  const firestore = await import('firebase/firestore');
  await tick(50);
  await click('.tab[data-tab="courses"]'); // « À racheter » : écoute des achats récents
  await click('.tab[data-tab="frigo"]');

  let redraws = 0;
  const observer = new w.MutationObserver(() => { redraws++; });
  const watch = () => { redraws = 0; observer.observe($('#fridge-list'), { childList: true }); };
  const seen = async () => { await tick(); const n = redraws; observer.disconnect(); return n; };

  watch();
  await firestore.setDoc(firestore.doc(null, 'foyers', CODE, 'courses', 'pain'), { name: 'Pain', quantity: '', checked: false, addedBy: 'Marie', createdAt: 2 });
  log(await seen() === 0, 'Article ajouté aux courses par l\'autre iPhone : liste du Stock pas redessinée');

  watch();
  await firestore.disableNetwork();
  const back = firestore.enableNetwork(); // horloge simulée : le réseau revient quand elle avance
  await tick(10);
  await back;
  log(await seen() === 0, 'Réseau coupé puis revenu (mêmes données) : liste pas redessinée');

  watch();
  await click('[data-action="consume"][data-id="yaourt"]', 350);
  log(await seen() >= 1 && $('#fridge-list').textContent.includes('Yaourts'), 'Yaourt consommé : liste redessinée');

  // « Se reconnecter » (Réglages) : les écoutes repartent de zéro, le stock est relu.
  const store = await import('../../src/data/store/index.js');
  const reconnected = store.reconnect();
  await tick(20);
  await reconnected;
  log(store.state.products.length === 1 && store.state.shopping.length === 1, 'Après reconnexion : stock et courses relus');
  log(P.errors.length === 0, `Aucune erreur JavaScript (${P.errors.join(' | ')})`);
});
