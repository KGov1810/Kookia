// Scénario : Second iPhone : invitation, code-barres, photo, erreurs Claude, synchronisation.
import { test, expect } from 'vitest';
import { createPhone } from '../helpers/phone.js';
import { readAllCss, readProjectFile } from '../helpers/files.js';

test("Second iPhone : invitation, code-barres, photo, erreurs Claude, synchronisation", async () => {
  const log = (ok, msg) => expect.soft(Boolean(ok), msg).toBe(true);

  // Base partagée héritée du premier iPhone
  globalThis.__db = { docs: new Map(JSON.parse(readProjectFile('tests/fixtures/phone1-db.json'))), listeners: new Set(), writes: 0 };
  const invite = readProjectFile('tests/fixtures/phone1-invite.txt').trim();

  const P = await createPhone('phone2', { standalone: true });
  const { $, $$, click, type, text, w, tick } = P;
  const sheet = () => $$('.sheet').at(-1);

  // ---- Rejoindre avec un message d'invitation complet collé tel quel
  log(text().includes('Connexion'), 'Second iPhone : étape connexion');
  const message = `Rejoins notre Frigo partagé !\n1. Ouvre ce lien dans Safari : https://exemple.github.io/frigo/\n3. Colle ce code :\n\n${invite}`;
  await type('#connect-text', message);
  await click('[data-action="connect"]');
  log(text().includes('Invitation reconnue'), 'Invitation reconnue au milieu du message');
  await type('#ob-name', 'Paul');
  await click('[data-action="join"]', 80);
  log(!w.document.body.classList.contains('onboarding'), 'Foyer rejoint → app principale');
  log(text().includes('Pâtes') && text().includes('Poulet'), 'Les produits du premier iPhone apparaissent');
  log(JSON.parse(w.localStorage.getItem('frigo.settings.v1')).firebaseConfig.projectId === 'frigo-test', 'Configuration Firebase reprise de l\'invitation');

  // ---- Code-barres via Open Food Facts (réseau simulé) + saisie manuelle dans le scanner
  globalThis.fetch = async (url) => {
    if (String(url).includes('openfoodfacts')) {
      if (String(url).includes('3017620422003')) {
        return { ok: true, status: 200, json: async () => ({ status: 1, product: { product_name_fr: 'Pâte à tartiner', brands: 'Nutella,Ferrero', quantity: '400 g', categories_tags: ['en:spreads'], image_front_small_url: 'https://images.openfoodfacts.org/x.jpg' } }) };
      }
      return { ok: false, status: 404, json: async () => ({ status: 0 }) };
    }
    throw new Error('réseau inattendu ' + url);
  };
  await click('[data-action="add-menu"]');
  await click('.menu [data-action="scan"]', 450);
  log($('.scanner') !== null, 'Scanner ouvert (caméra indisponible dans le test)');
  await tick(50);
  log($('.scan-hint').textContent.includes('tapez les chiffres') || $('.scan-hint').textContent.includes('cadre'), `Message scanner : ${$('.scan-hint').textContent}`);
  await type('.scan-manual input', '301762');
  $('.scan-manual').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick();
  log($('.scan-hint').textContent.includes('8 ou 13 chiffres'), 'Code trop court refusé');
  await type('.scan-manual input', '3017620422003');
  $('.scan-manual').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick(80);
  log(!$('.scanner'), 'Scanner refermé');
  log(sheet().querySelector('[name="name"]').value === 'Pâte à tartiner (Nutella)', `Nom trouvé : ${sheet().querySelector('[name="name"]').value}`);
  log(sheet().querySelector('[name="quantity"]').value === '400 g' && sheet().querySelector('[name="category"]').value === 'sucre', 'Quantité et catégorie remplies (pâte à tartiner → biscuits, chocolat et petit-déjeuner)');
  log(sheet().querySelector('.thumb img')?.getAttribute('src').includes('openfoodfacts'), 'Photo Open Food Facts affichée');
  log(sheet().textContent.includes('Produit trouvé'), 'Message « Produit trouvé »');
  await click(sheet().querySelector('[data-action="scan"]'), 60);
  await type('.scan-manual input', '12345678');
  $('.scan-manual').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true })); await tick(80);
  log(sheet().textContent.includes('inconnu d\'Open Food Facts'), 'Code inconnu : message clair');
  await click(sheet().querySelector('[data-action="save"]'), 350);
  log(text().includes('Pâte à tartiner'), 'Produit enregistré');

  // ---- Photo analysée par Claude (image et canvas simulés)
  w.HTMLCanvasElement.prototype.getContext = () => ({ fillRect() {}, drawImage() {}, set fillStyle(v) {} });
  w.HTMLCanvasElement.prototype.toDataURL = () => 'data:image/jpeg;base64,QUJD';
  globalThis.URL.createObjectURL = () => 'blob:fake'; globalThis.URL.revokeObjectURL = () => {};
  globalThis.Image = class { set src(v) { this.naturalWidth = 4000; this.naturalHeight = 3000; setTimeout(() => this.onload(), 1); } };
  const settings = JSON.parse(w.localStorage.getItem('frigo.settings.v1'));
  w.localStorage.setItem('frigo.settings.v1', JSON.stringify(settings));
  await click('.tab[data-tab="reglages"]');
  await type('#key-input', 'sk-ant-paul-9999'); await click('[data-action="save-key"]');
  let claudeCalls = 0;
  globalThis.fetch = async (url, opts) => {
    claudeCalls++;
    const body = JSON.parse(opts.body);
    log(body.messages[0].content[0].type === 'image' && body.messages[0].content[0].source.data === 'QUJD', 'Image envoyée à Claude en base64');
    return { ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: { est_alimentaire: true, nom: 'Jambon blanc Herta', categorie: 'viande', quantite: '4 tranches', date_peremption: '2099-01-01' } }] }) };
  };
  // Simule le choix d'une photo : on intercepte la création de l'input fichier
  const origCreate = w.document.createElement.bind(w.document);
  w.document.createElement = (tag) => {
    const el = origCreate(tag);
    if (tag === 'input') el.click = () => setTimeout(() => {
      Object.defineProperty(el, 'files', { value: [new w.File(['x'], 'photo.jpg', { type: 'image/jpeg' })] });
      el.dispatchEvent(new w.Event('change'));
    }, 5);
    return el;
  };
  await click('.tab[data-tab="frigo"]');
  await click('[data-action="add-menu"]');
  await click('.menu [data-action="photo"]', 500);
  log(sheet().querySelector('[name="name"]').value === 'Jambon blanc Herta', `Claude : produit reconnu (${sheet().querySelector('[name="name"]').value})`);
  log(sheet().textContent.includes('Date illisible'), 'Date hors plage (2099) ignorée → message');
  log(sheet().querySelector('.thumb img')?.getAttribute('src').startsWith('data:image/jpeg'), 'Vignette de la photo enregistrée');
  globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ stop_reason: 'tool_use', content: [{ type: 'tool_use', input: { est_alimentaire: true, nom: '', categorie: 'viande', quantite: '', date_peremption: new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10) } }] }) });
  await click(sheet().querySelector('[data-action="date-photo"]'), 300);
  log(sheet().textContent.includes('Date lue par Claude') && sheet().querySelector('.expiry-status').textContent.includes('Expire dans 5 jours'), 'Lecture de la date par Claude');
  await click(sheet().querySelector('[data-action="save"]'), 350);

  // ---- Erreurs Claude
  globalThis.fetch = async () => ({ ok: false, status: 400, json: async () => ({ error: { message: 'Your credit balance is too low to access the Anthropic API.' } }) });
  await click('.tab[data-tab="recettes"]');
  await click('[data-action="generate"]', 80);
  log(text().includes('Crédit Claude épuisé'), 'Crédit épuisé : message clair');
  globalThis.fetch = async () => { throw new TypeError('Load failed'); };
  await click('[data-action="generate"]', 80);
  log(text().includes('Connexion à Claude impossible'), 'Hors ligne : message clair');
  log($$('.recipe-card').length >= 1 && text().includes('Gratin'), 'Recettes du premier iPhone visibles');

  // ---- Synchro : un changement fait « par l'autre iPhone » apparaît en direct
  await click('.tab[data-tab="frigo"]');
  const code = JSON.parse(w.localStorage.getItem('frigo.settings.v1')).householdCode;
  const { setDoc, doc } = await import('firebase/firestore');
  await setDoc(doc(null, 'foyers', code, 'produits', 'x-remote'), { name: 'Salade verte', expiry: new Date().toISOString().slice(0, 10), category: 'fruits_legumes', quantity: '', barcode: '', addedBy: 'Marie', createdAt: 1, image: '', imageUrl: '' });
  await tick();
  log(text().includes('Salade verte') && text().includes('par Marie'), 'Produit ajouté par l\'autre iPhone affiché en direct');
  log($$('.product').find((p) => p.textContent.includes('Salade'))?.querySelector('.days small').textContent === 'dernier jour', 'Compteur « dernier jour »');

  // ---- Quitter le foyer → retour à l'accueil
  await click('.tab[data-tab="reglages"]');
  await click('[data-action="leave"]', 50);
  log(w.document.body.classList.contains('onboarding') && text().includes('Votre foyer'), 'Quitter le foyer → accueil');

  console.log('\nAppels Claude :', claudeCalls, '| Erreurs JS :', P.errors.length ? P.errors : 'aucune');

});
