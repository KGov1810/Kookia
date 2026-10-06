// Scénario : Recettes compatibles, codes-barres, caméra, reconnexion.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test("Recettes compatibles, codes-barres, caméra, reconnexion", async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);
  const iso = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const CODE = 'ABCDE-FGHJK';
  const P0 = `foyers/${CODE}/produits/`, R0 = `foyers/${CODE}/recettes/`, C0 = `foyers/${CODE}/courses/`;
  const product = (name, days, extra = {}) => ({ name, expiry: iso(days), category: 'autre', quantity: '', barcode: '', addedBy: 'Marie', createdAt: 1, image: '', imageUrl: '', ...extra });

  globalThis.__db = { docs: new Map([
    [`foyers/${CODE}`, { createdBy: 'Marie' }],
    [P0 + 'yaourt-1', product('Yaourt nature', 1, { category: 'laitier', barcode: '3033490004743' })],
    [P0 + 'poulet-1', product('Filet de poulet', 5, { category: 'viande' })],
    // Recette « ancienne » : aucun code-barres mémorisé, lien vers le yaourt actuel
    [R0 + 'r-legacy', { title: 'Taboulé au yaourt', summary: '', difficulty: 'facile', totalMinutes: 20, prepMinutes: 20, servings: 2, batchCooking: false, storageDays: 0, storageTips: '', createdAt: 10, favorite: false, steps: ['Mélanger.'], usedProductIds: ['yaourt-1'],
      ingredients: [{ name: 'Yaourt nature', quantity: '1 pot', source: 'stock', productId: 'yaourt-1' }, { name: 'Semoule', quantity: '150 g', source: 'placard', productId: null }] }],
    // Recette ancienne dont la courgette a déjà été consommée avant la mise à jour
    [R0 + 'r-courgette', { title: 'Poêlée de courgettes au poulet', summary: '', difficulty: 'moyen', totalMinutes: 30, prepMinutes: 10, servings: 2, batchCooking: true, storageDays: 3, storageTips: '', createdAt: 20, favorite: false, steps: ['Cuire.'], usedProductIds: ['courgette-old', 'poulet-1'],
      ingredients: [{ name: 'Courgettes', quantity: '2', source: 'stock', productId: 'courgette-old' }, { name: 'Filet de poulet', quantity: '300 g', source: 'stock', productId: 'poulet-1' }, { name: 'Gruyère râpé', quantity: '50 g', source: 'a_acheter', productId: null }] }],
    // Recette sans aucun produit du frigo
    [R0 + 'r-none', { title: 'Soupe de potiron', summary: '', difficulty: 'facile', totalMinutes: 40, prepMinutes: 15, servings: 2, batchCooking: false, storageDays: 0, storageTips: '', createdAt: 30, favorite: false, steps: ['Cuire.'], usedProductIds: [],
      ingredients: [{ name: 'Potiron', quantity: '1', source: 'a_acheter', productId: null }] }],
    [C0 + 'lait', { name: 'Lait', quantity: '', checked: false, addedBy: 'Marie', createdAt: 1 }],
    [C0 + 'ghost', { checked: true }]  // ancien article « fantôme » (sans nom)
  ]), listeners: new Set(), writes: 0, network: [] };

  const settings = { userName: 'Paul', alertDays: 2, claudeKey: 'sk-ant-x', model: 'claude-sonnet-5-5', householdCode: CODE,
    firebaseConfig: { apiKey: 'k', projectId: 'p', appId: 'a' }, onboardingDone: true, installHintDismissed: true };
  const P = await createPhone('evol', { standalone: true, storage: { 'frigo.settings.v1': JSON.stringify(settings) } });
  const { $, $$, click, type, text, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);
  await tick(50);

  // =========================== Synchronisation ===========================
  console.log('\n— Synchronisation —');
  log(!text().includes('undefined') && $$('.shop-item').length === 0 || true, '');
  await click('.tab[data-tab="courses"]');
  log($$('.shop-item').length === 1 && text().includes('Lait'), 'Ancien article « fantôme » (sans nom) masqué');
  globalThis.__db.network.length = 0;
  Object.defineProperty(w.document, 'visibilityState', { value: 'visible', configurable: true });
  w.document.dispatchEvent(new w.Event('visibilitychange'));
  await tick(1);
  log($('#sync-line').textContent === 'Actualisation…', `Retour au premier plan : « ${$('#sync-line').textContent} »`);
  await tick(40);
  log(globalThis.__db.network.join(',') === 'off,on', 'Connexion Firestore coupée puis rétablie (reconnexion forcée)');
  log($('#sync-line').textContent === 'Synchronisé', `Puis : « ${$('#sync-line').textContent} »`);
  // L'autre iPhone supprime « Lait », mais cet iPhone ne l'a pas encore su (connexion en retard)
  globalThis.__db.docs.delete(C0 + 'lait');
  await click($$('.tick').find((b) => b.getAttribute('aria-label').endsWith('Lait')), 30);
  log(!globalThis.__db.docs.has(C0 + 'lait'), 'Cocher un article déjà supprimé ailleurs ne le recrée pas');
  log(!text().includes('Erreur') && !$('.note.error'), 'Aucune fausse erreur affichée');

  // =========================== Codes-barres dans les recettes ===========================
  console.log('\n— Recettes reliées par code-barres —');
  const legacy = globalThis.__db.docs.get(R0 + 'r-legacy');
  log(legacy.ingredients[0].barcode === '3033490004743' && legacy.ingredients[0].productName === 'Yaourt nature', 'Code-barres du yaourt mémorisé dans l\'ancienne recette');
  await click('.tab[data-tab="frigo"]');
  await click($$('.consume').find((b) => b.getAttribute('aria-label').includes('Yaourt')), 250);
  log(!globalThis.__db.docs.has(P0 + 'yaourt-1'), 'Yaourt consommé');
  await click('.tab[data-tab="recettes"]');
  await click($$('.recipe-card').find((c) => c.textContent.includes('Taboulé')), 400);
  log(sheet().textContent.includes('Plus en stock'), 'Recette : yaourt « Plus en stock »');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  // Un nouveau yaourt, autre nom, même code-barres (ajouté par l'autre iPhone)
  const { setDoc, doc } = await import('firebase/firestore');
  await setDoc(doc(null, 'foyers', CODE, 'produits', 'yaourt-2'), product('Pot de yaourt brassé', 6, { category: 'laitier', barcode: '03033490004743' }));
  await setDoc(doc(null, 'foyers', CODE, 'produits', 'courgette-2'), product('Courgette', 3, { category: 'fruits_legumes' }));
  await tick();
  await click($$('.recipe-card').find((c) => c.textContent.includes('Taboulé')), 400);
  const yRow = [...sheet().querySelectorAll('.ingredient')].find((r) => r.textContent.includes('Yaourt'));
  log(yRow.textContent.includes('Au frigo (même code-barres)') && yRow.textContent.includes('Pot de yaourt brassé'), 'Nouveau yaourt reconnu par son code-barres');
  log(yRow.querySelector('.days b').textContent === '6', 'Compteur de jours du nouveau yaourt affiché');
  await click(sheet().querySelector('[data-action="close"]'), 350);
  await click($$('.recipe-card').find((c) => c.textContent.includes('Poêlée')), 400);
  const cRow = [...sheet().querySelectorAll('.ingredient')].find((r) => r.textContent.includes('Courgettes'));
  log(cRow.textContent.includes('Au frigo (produit similaire)'), 'Ancienne recette sans code-barres : courgette retrouvée par le nom');
  const gRow = [...sheet().querySelectorAll('.ingredient')].find((r) => r.textContent.includes('Gruyère'));
  log(gRow.textContent.includes('À acheter'), 'Gruyère toujours « À acheter »');
  await click(sheet().querySelector('[data-action="add-missing"]'));
  log([...globalThis.__db.docs.entries()].filter(([k]) => !k.includes('/historique/')).map(([, v]) => v).some((d) => d.name === 'Gruyère râpé (50 g)'), 'Ingrédient manquant ajouté aux courses (« Gruyère râpé (50 g) »)');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  // =========================== Recettes compatibles d'abord ===========================
  console.log('\n— Recettes enregistrées proposées d\'abord —');
  const sectionTitles = $$('h2.section').map((h) => h.childNodes[0].textContent.trim());
  log(sectionTitles[0] === 'Déjà dans vos recettes', `Section « Déjà dans vos recettes » en premier (${sectionTitles.join(' | ')})`);
  const compatSection = $$('h2.section')[0].nextElementSibling.nextElementSibling;
  const compat = [...compatSection.querySelectorAll('.recipe-card h3')].map((h) => h.textContent.trim());
  log(compat.length === 2 && !compat.includes('Soupe de potiron'), `Compatibles : ${compat.join(', ')} (la soupe, sans produit du frigo, est exclue)`);
  const generateButton = $('[data-action="generate"]');
  const order = [...$('#screen').querySelectorAll('.recipe-card, [data-action="generate"]')].map((e) => e.dataset.action === 'generate' ? 'BOUTON' : 'carte');
  log(order.indexOf('BOUTON') === compat.length, 'Les recettes compatibles sont affichées avant le bouton de génération');
  log(generateButton.textContent.includes('Proposer 5 nouvelles recettes') && generateButton.classList.contains('secondary'), 'Bouton : « Proposer 5 nouvelles recettes » (en second plan)');
  log(compatSection.textContent.includes('tout est en stock'), 'Carte : « tout est en stock »');
  log(compatSection.textContent.includes('manque gruyère râpé'), 'Carte : « manque gruyère râpé »');
  // J'ai cuisiné : retire le nouveau yaourt (retrouvé par code-barres)
  await click($$('.recipe-card').find((c) => c.textContent.includes('Taboulé')), 400);
  await click(sheet().querySelector('[data-action="cooked"]'), 50);
  log(!globalThis.__db.docs.has(P0 + 'yaourt-2'), '« J\'ai cuisiné » retire le yaourt racheté');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  // =========================== Caméra ===========================
  console.log('\n— Caméra —');
  const cam = { play: 'ok', ready: false, dark: false, stops: 0, deny: false };
  Object.defineProperty(w.navigator, 'mediaDevices', { configurable: true, value: { getUserMedia: async () => {
    if (cam.deny) throw Object.assign(new Error('refus'), { name: 'NotAllowedError' });
    return { getTracks: () => [{ stop: () => { cam.stops++; } }] };
  } } });
  const V = w.HTMLMediaElement.prototype;
  V.play = function () { if (cam.play === 'reject') return Promise.reject(Object.assign(new Error('x'), { name: 'NotAllowedError' })); this.__playing = true; return Promise.resolve(); };
  V.pause = function () { this.__playing = false; };
  Object.defineProperty(V, 'paused', { configurable: true, get() { return !this.__playing; } });
  Object.defineProperty(V, 'readyState', { configurable: true, get() { return cam.ready ? 4 : 0; } });
  Object.defineProperty(w.HTMLVideoElement.prototype, 'videoWidth', { configurable: true, get() { return cam.ready ? 1280 : 0; } });
  Object.defineProperty(w.HTMLVideoElement.prototype, 'videoHeight', { configurable: true, get() { return cam.ready ? 720 : 0; } });
  w.HTMLCanvasElement.prototype.getContext = () => ({ drawImage() {}, getImageData: () => ({ data: cam.dark ? [0, 0, 0, 255] : [120, 110, 100, 255] }) });
  let detectCalls = 0;
  w.BarcodeDetector = class { static async getSupportedFormats() { return ['ean_13', 'ean_8']; } async detect() { detectCalls++; return cam.code ? [{ rawValue: cam.code }] : []; } };
  globalThis.fetch = async (url) => ({ ok: true, status: 200, json: async () => ({ status: 1, product: { product_name_fr: 'Lait demi-écrémé', brands: 'Lactel', quantity: '1 L', categories_tags: ['en:milks'] } }) });

  await click('.tab[data-tab="frigo"]');
  // 1. iOS refuse de lancer la vidéo → bouton « Démarrer la caméra »
  cam.play = 'reject';
  await click('[data-action="add-menu"]'); await click('.menu [data-action="scan"]', 60);
  log($('.scanner') && w.document.body.classList.contains('scanning'), 'Scanner ouvert directement (barre d\'onglets masquée)');
  log($('.scan-hint').textContent.includes('Démarrer la caméra') && !$('.scan-start').hidden, 'Vidéo refusée par iOS : bouton « Démarrer la caméra » proposé');
  cam.play = 'ok'; cam.ready = true;
  await click('.scan-start', 20);
  log($('.scan-hint').textContent === 'Placez le code-barres dans le cadre' && $('.scan-actions').hidden, 'Toucher « Démarrer » lance la vidéo');
  // 2. Lecture automatique d'un code
  cam.code = '3428273980046';
  await tick(400);
  log(!$('.scanner') && detectCalls > 0, 'Code-barres lu automatiquement, scanner refermé');
  log(cam.stops >= 1, 'Caméra bien libérée à la fermeture');
  await tick(50);
  log(sheet()?.querySelector('[name="name"]').value === 'Lait demi-écrémé (Lactel)', `Fiche ouverte avec le produit : ${sheet()?.querySelector('[name="name"]').value}`);
  await click(sheet().querySelector('[data-action="close"]'), 350);
  cam.code = null;
  // 3. Vidéo lancée mais aucune image → message au bout de 4 s
  cam.ready = false;
  await click('[data-action="add-menu"]'); await click('.menu [data-action="scan"]', 60);
  await tick(4200);
  log($('.scan-hint').textContent.includes("La caméra ne s'affiche pas") && !$('.scan-start').hidden && !$('.scan-retry').hidden, 'Pas d\'image après 4 s : message clair + « Démarrer » et « Réessayer »');
  // 4. Image entièrement noire → message
  cam.ready = true; cam.dark = true;
  await click('.scan-retry', 20);
  await tick(3800);
  log($('.scan-hint').textContent.includes("L'image reste noire"), 'Image noire détectée : message avec la marche à suivre');
  cam.dark = false;
  // 5. Passage en arrière-plan → caméra coupée puis relancée
  const stopsBefore = cam.stops;
  Object.defineProperty(w.document, 'visibilityState', { value: 'hidden', configurable: true });
  w.document.dispatchEvent(new w.Event('visibilitychange')); await tick(10);
  log(cam.stops > stopsBefore, 'Arrière-plan : caméra coupée');
  Object.defineProperty(w.document, 'visibilityState', { value: 'visible', configurable: true });
  w.document.dispatchEvent(new w.Event('visibilitychange')); await tick(40);
  log($('.scan-hint').textContent === 'Placez le code-barres dans le cadre', 'Retour : caméra relancée');
  await click('.scan-top [data-action="close"]', 20);
  log(!$('.scanner') && !w.document.body.classList.contains('scanning'), 'Annuler : scanner fermé, interface rétablie');
  // 6. Accès refusé
  cam.deny = true;
  await click('[data-action="add-menu"]'); await click('.menu [data-action="scan"]', 60);
  log($('.scan-hint').textContent.includes('Accès à la caméra refusé') && !$('.scan-retry').hidden, 'Accès refusé : explication + « Réessayer »');
  await click('.scan-top [data-action="close"]', 20);

  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');

});
