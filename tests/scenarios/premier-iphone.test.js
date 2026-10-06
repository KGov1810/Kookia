// Scénario : Premier iPhone : connexion, foyer, stock, courses, recettes.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';

test("Premier iPhone : connexion, foyer, stock, courses, recettes", async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);

  // ---- iPhone 1 installé
  const P = await createPhone('phone1', { standalone: true });
  const { $, $$, click, type, text, w, tick } = P;
  log(text().includes('Connexion') && $('#connect-text'), 'Étape connexion Firebase affichée');
  await type('#connect-text', 'n\'importe quoi');
  await click('[data-action="connect"]');
  log(text().includes('Texte non reconnu'), 'Texte invalide refusé avec explication');
  await type('#connect-text', `const firebaseConfig = {
    apiKey: "AIzaSyTEST",
    authDomain: "frigo-test.firebaseapp.com",
    projectId: "frigo-test",
    storageBucket: "frigo-test.firebasestorage.app",
    messagingSenderId: "123",
    appId: "1:123:web:abc"
  };`);
  await click('[data-action="connect"]');
  log(text().includes('Votre foyer') && $('#ob-name'), 'Configuration acceptée → étape foyer');
  await click('[data-action="create"]');
  log(text().includes('Indiquez votre prénom'), 'Prénom obligatoire');
  await type('#ob-name', 'Marie');
  await click('[data-action="create"]', 60);
  log(text().includes('Foyer créé'), 'Foyer créé');
  const invite = $('.code-box').textContent.trim();
  log(/^FRIGO1\.[A-Za-z0-9_-]+$/.test(invite), `Invitation générée (${invite.length} caractères)`);
  await click('[data-action="copy-invite"]');
  log(w.__copied === invite, 'Copie de l\'invitation');
  await click('[data-action="start"]');
  log(!w.document.body.classList.contains('onboarding') && text().includes('Rien en stock pour l\'instant'), 'App principale : stock vide');

  // ---- Ajout manuel d'un produit (expire demain)
  await click('[data-action="add-menu"]');
  log($('.menu') !== null, 'Menu d\'ajout ouvert');
  await click('.menu [data-action="manual"]', 400);
  const sheet = () => $$('.sheet').at(-1);
  log(sheet()?.textContent.includes('Nouveau produit'), 'Fiche « Nouveau produit »');
  log(sheet().querySelector('[data-action="save"]').disabled, 'Bouton Ajouter désactivé sans nom');
  await type(sheet().querySelector('[name="name"]'), 'Yaourt nature');
  log(!sheet().querySelector('[data-action="save"]').disabled, 'Bouton Ajouter activé');
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  await type(sheet().querySelector('[name="expiry"]'), iso(tomorrow), 'change');
  log(sheet().querySelector('.expiry-status').textContent.includes('Expire demain'), 'Statut « Expire demain » mis à jour');
  const cat = sheet().querySelector('[name="category"]'); cat.value = 'laitier'; cat.dispatchEvent(new w.Event('change', { bubbles: true })); await tick();
  await type(sheet().querySelector('[name="quantity"]'), '4 pots');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(text().includes('Yaourt nature') && $('.days.soon'), 'Produit affiché avec compteur orange');
  log($('.days.soon b').textContent === '1' && $('.days.soon small').textContent === 'jour', 'Compteur : 1 jour');
  log(text().includes('1 produit à consommer vite'), 'Bannière « 1 produit à consommer vite »');
  log($('[data-badge="frigo"]').textContent === '1' && !$('[data-badge="frigo"]').hidden, 'Pastille onglet Frigo = 1');

  // ---- Deux autres produits : un périmé, un lointain (via quick +1 mois)
  await click('[data-action="add-menu"]'); await click('.menu [data-action="manual"]', 400);
  await type(sheet().querySelector('[name="name"]'), 'Poulet');
  const past = new Date(); past.setDate(past.getDate() - 2);
  await type(sheet().querySelector('[name="expiry"]'), iso(past), 'change');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  await click('[data-action="add-menu"]'); await click('.menu [data-action="manual"]', 400);
  await type(sheet().querySelector('[name="name"]'), 'Pâtes');
  await click(sheet().querySelector('[data-action="quick"][data-days="30"]'));
  await click(sheet().querySelector('[data-action="save"]'), 350);
  const sections = $$('h2.section').map((h) => h.textContent.replace(/\s+/g, ' ').trim());
  log(JSON.stringify(sections) === JSON.stringify(['Périmés1', 'À consommer vite1', 'En stock1']), `Sections : ${sections.join(' | ')}`);
  log($('.days.expired b').textContent === '2' && $('.days.expired small').textContent === 'jours passés', 'Périmé : « 2 jours passés »');

  // ---- Recherche
  await type('#search', 'pat');
  log($$('.product').length === 1 && text().includes('Pâtes'), 'Recherche sans accent « pat » → Pâtes');
  await type('#search', '');

  // ---- Modifier un produit
  await click($$('.product-main').find((b) => b.textContent.includes('Pâtes')), 400);
  log(sheet().textContent.includes('Modifier le produit') && sheet().textContent.includes('Ajouté par'), 'Fiche de modification');
  await click(sheet().querySelector('[data-action="to-shopping"]'));
  log(sheet().textContent.includes('Ajouté à la liste de courses'), 'Produit ajouté aux courses depuis la fiche');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  // ---- Consommé + annuler
  const before = $$('.product').length;
  await click($$('.consume').find((b) => b.getAttribute('aria-label').includes('Poulet')), 250);
  log($$('.product').length === before - 1 && text().includes('Poulet : retiré du stock'), 'Consommé : produit retiré + message');
  await click('#toast button', 50);
  log($$('.product').length === before, 'Annuler : produit restauré');

  // ---- Courses
  await click('.tab[data-tab="courses"]');
  log(text().includes('Pâtes') && $('[data-badge="courses"]').textContent === '1', 'Courses : article « Pâtes », pastille 1');
  await type('#new-item', 'Tomates');
  $('#add-item').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  await type('#new-item', 'tomates');
  $('#add-item').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  log($$('.shop-item').length === 2 && text().includes('Déjà dans la liste'), 'Doublon refusé (insensible à la casse)');
  await click($$('.tick').find((b) => b.getAttribute('aria-label').endsWith('Tomates')));
  log($('.shop-item.checked')?.textContent.includes('Tomates') && !$('#clear-checked').hidden, 'Article coché → panier');
  await click($$('[data-action="item-to-fridge"]').find((b) => b.getAttribute('aria-label').includes('Tomates')), 400);
  log(sheet().querySelector('[name="name"]').value === 'Tomates', 'Ranger au frigo : fiche pré-remplie');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(!text().includes('Dans le panier'), 'Article retiré des courses après rangement');

  // ---- Réglages
  await click('.tab[data-tab="reglages"]');
  log(text().includes('Marie') || $('[data-setting="userName"]').value === 'Marie', 'Réglages : prénom');
  await click('[data-action="alert-plus"]');
  log($('#alert-days').textContent === '3 jours avant', 'Alerte : 3 jours avant');
  await type('#key-input', 'abc'); await click('[data-action="save-key"]');
  log(text().includes('ne ressemble pas'), 'Clé invalide refusée');
  await type('#key-input', 'sk-ant-test-1234'); await click('[data-action="save-key"]');
  log(text().includes('enregistrée (…1234)'), 'Clé enregistrée');
  log(text().includes('Synchronisé'), `Synchro : ${$('#sync-details').textContent.replace(/\s+/g, ' ').trim()}`);

  const myCards = () => $$('.list').at(-1).querySelectorAll('.recipe-card').length;
  // ---- Recettes (Claude simulé)
  globalThis.fetch = async (url, opts) => {
    const body = JSON.parse(opts.body);
    const prompt = body.messages[0].content[0].text;
    globalThis.__prompt = prompt;
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: { recettes: [
      { titre: 'Gratin de pâtes au yaourt', resume: 'Crémeux et rapide.', difficulte: 'facile', temps_total_minutes: 25, temps_preparation_minutes: 10, portions: 4, batch_cooking: true, conservation_jours: 3, conseils_conservation: 'Boîte hermétique.', ingredients: [
        { nom: 'Yaourt nature', quantite: '2 pots', source: 'stock', ref_stock: 'P1' },
        { nom: 'Pâtes', quantite: '250 g', source: 'stock', ref_stock: 'P2' },
        { nom: 'Gruyère râpé', quantite: '80 g', source: 'a_acheter', ref_stock: '' }], etapes: ['Cuire les pâtes.', 'Mélanger.', 'Gratiner.'] },
      { titre: 'Salade', resume: 'Fraîche.', difficulte: 'moyen', temps_total_minutes: 50, temps_preparation_minutes: 20, portions: 2, batch_cooking: false, conservation_jours: 0, conseils_conservation: '', ingredients: [{ nom: 'Tomates', quantite: '3', source: 'stock', ref_stock: 'P3' }], etapes: ['Couper.'] }
    ] } }] }) };
  };
  await click('.tab[data-tab="recettes"]');
  log(text().includes('Yaourt nature') && $('.chip'), 'Recettes : produits prioritaires présélectionnés');
  await click('[data-action="set-difficulty"][data-value="facile"]');
  log($('[data-action="set-difficulty"][data-value="facile"]').getAttribute('aria-pressed') === 'true', 'Filtre difficulté « Facile »');
  await click('[data-action="generate"]', 80);
  log(globalThis.__prompt.includes('[P1] Yaourt nature') && globalThis.__prompt.includes('difficulté « facile »'), 'Prompt : produit prioritaire + filtre transmis');
  log(!globalThis.__prompt.includes('Poulet'), 'Produit périmé non proposé comme ingrédient secondaire');
  log(myCards() === 1 && text().includes('Gratin de pâtes'), 'Filtre local : seule la recette facile affichée');
  log(text().includes('Utilise 2 produits en stock'), 'Carte : « Utilise 2 produits en stock »');
  await click('[data-action="set-difficulty"][data-value=""]');
  log(myCards() === 2, 'Filtre « Toutes » : 2 recettes');
  await click('[data-action="set-time"][data-value="30"]');
  log(myCards() === 1, 'Filtre 30 min : 1 recette');
  const batch = $('#batch-toggle'); batch.checked = true; batch.dispatchEvent(new w.Event('change', { bubbles: true })); await tick();
  log(myCards() === 1, 'Filtre batch cooking : 1 recette');
  await click('.recipe-card', 400);
  log(sheet().textContent.includes('Cuire les pâtes') && sheet().querySelectorAll('.ingredient').length === 3, 'Détail recette : étapes et ingrédients');
  await click(sheet().querySelector('[data-action="add-missing"]'));
  log(text().includes('1 ingrédient ajouté aux courses'), 'Ingrédient manquant ajouté aux courses');
  await click(sheet().querySelector('[data-action="favorite"]'));
  log(sheet().querySelector('[data-action="favorite"]').getAttribute('aria-pressed') === 'true', 'Recette mise en favori');
  const productsBefore = globalThis.__db.docs.size;
  await click(sheet().querySelector('[data-action="cooked"]'), 50);
  log(text().includes('2 produits mis à jour dans le stock'), 'J\'ai cuisiné : 2 produits retirés');
  await click(sheet().querySelector('[data-action="close"]'), 350);

  console.log('\nErreurs JS :', P.errors.length ? P.errors : 'aucune');

});
