// Kookia — Ticket de caisse : photos, lecture par Claude et ajout au stock.

import { fmt, html } from '../../components/html.js';
import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { showTab } from '../app/router.js';
import { MAX_PHOTOS, removals as listRemovals, selected } from './receipt-render.js';

/** Photos choisies d'un coup (un même long ticket, de haut en bas) : ajoutées dans l'ordre, 10 au plus en tout. */
export async function addPhotos(ctx, files) {
  ctx.view.error = ''; // une photo illisible de ce choix reste signalée, même si les suivantes passent
  const kept = files.slice(0, Math.max(0, MAX_PHOTOS - ctx.view.photos.length));
  for (const file of kept) await addPhoto(ctx, file);
  if (files.length > kept.length) toast(t('ticket.tooMany', { n: MAX_PHOTOS }));
}

async function addPhoto(ctx, file) {
  const { view } = ctx;
  try {
    const { dataUrl, base64 } = await S.resizeImage(file, 1568, 0.85);
    view.photos.push({ preview: dataUrl, base64, file }); // file : l'original, pour découper les images nettes
  } catch (error) {
    view.error = error?.message || t('device.badPhoto');
  }
  if (ctx.sheet.isOpen) ctx.sheet.update();
}

/** Article de la liste acheté : celui indiqué par Claude, sinon rapprochement local (chaque article au plus une fois). */
function shoppingFor(item, used) {
  const candidates = state.shopping.filter((s) => s.name && !used.has(s.id));
  const match = item.shoppingId !== undefined
    ? candidates.find((s) => s.id === item.shoppingId)
    : candidates.find((s) => S.matchesShoppingItem(s.name, item));
  if (match) used.add(match.id);
  return match ?? null;
}

export async function analyze(ctx) {
  const { view } = ctx;
  if (!view.photos.length || view.busy) return;
  view.busy = t('ticket.reading', { n: view.photos.length });
  view.error = '';
  ctx.sheet.update();
  try {
    const items = await S.analyzeReceipt({
      key: state.settings.claudeKey,
      model: state.settings.model,
      images: view.photos.map((p) => p.base64),
      shopping: state.shopping.map((s) => ({ id: s.id, name: s.name }))
    });
    const used = new Set();
    view.items = items.map((item) => {
      const match = shoppingFor(item, used);
      // Corrections déjà faites pour ce produit : elles passent avant la proposition de Claude.
      const memo = item.food ? store.rememberedPlacement(item) : {};
      const category = memo.category ?? item.category;
      return {
        ...item, category, location: memo.location ?? item.location, ...S.receiptAmount(item.quantity, category),
        priceText: S.priceInputValue(item.price),
        selected: item.food, // non alimentaire : grisé et décoché, mais on peut le cocher
        shoppingId: match?.id ?? null, shoppingName: match?.name ?? '', removeFromList: Boolean(match)
      };
    });
    await cutImages(view);
    view.stage = 'review';
    findImages(ctx); // ticket papier : photos cherchées sur Open Food Facts pendant la vérification
  } catch (error) {
    view.error = error?.message || String(error);
  } finally {
    view.busy = '';
    if (ctx.sheet.isOpen) ctx.sheet.update();
  }
}

/** Capture de commande en ligne : l'image de chaque produit est découpée sur la photo (une illisible est ignorée). */
async function cutImages(view) {
  for (const item of view.items) {
    if (item.box && !view.photos[item.box.photo]) item.why = `Cadre : photo n°${item.box.photo + 1} inexistante`;
  }
  for (const [index, photo] of view.photos.entries()) {
    const items = view.items.filter((item) => item.box?.photo === index);
    if (!items.length) continue;
    let error = '';
    const images = await S.cropImages(photo.file, items.map((item) => item.box)).catch((e) => { error = e?.message || String(e); return []; });
    items.forEach((item, i) => {
      item.image = images[i] ?? '';
      item.why = item.image ? '' : `Découpe impossible : ${error || 'image vide'}`;
    });
  }
}

const MAX_SEARCHES = 10; // Open Food Facts : 10 recherches par minute, au-delà les lignes gardent leur emoji

/**
 * Aliments de marque sans image : leur photo cherchée par nom et marque, une à une ; la ligne la montre dès qu'elle
 * arrive. Sans marque (« Tomates »), pas de recherche : le risque de montrer un autre produit est trop grand.
 */
async function findImages(ctx) {
  const missing = ctx.view.items.filter((item) => item.food && item.brand && !item.image).slice(0, MAX_SEARCHES);
  for (const item of ctx.view.items) {
    if (!item.image && !missing.includes(item)) item.why = `${item.why ?? ''} · OFF : pas de recherche (${item.food ? 'sans marque' : 'non alimentaire'})`;
  }
  for (const item of missing) {
    if (!ctx.sheet.isOpen || ctx.view.stage !== 'review') return;
    let error = '';
    item.imageUrl = await S.searchProductImage(item.name, item.brand).catch((e) => { error = e?.message || String(e); return ''; });
    item.why = `${item.why ?? ''}${item.imageUrl ? '' : ` · OFF : ${error || 'aucun résultat'}`}`;
    const index = ctx.view.items.indexOf(item);
    const thumb = ctx.sheet.panel.querySelector(`[data-thumb="${index}"]`);
    const why = ctx.sheet.panel.querySelector(`[data-why="${index}"]`);
    if (why) why.textContent = item.why;
    // Sur place, sans tout redessiner : un nom ou un prix en cours de saisie garde le clavier.
    if (item.imageUrl && thumb) thumb.innerHTML = fmt(html`<img src="${item.imageUrl}" alt="">`);
  }
}

export function confirmItems(ctx) {
  const items = selected(ctx);
  const removals = listRemovals(ctx).map((i) => i.shoppingId);
  if (!items.length && !removals.length) return;
  // Prix de la ligne → prix d'une unité (le nombre a pu être corrigé à la vérification).
  const priced = items.map((i) => ({ ...i, unitPrice: i.price === null ? null : S.cleanPrice(i.price / Math.max(1, i.count)) }));
  const added = items.length ? store.addReceiptProducts(priced, removals) : 0;
  if (!items.length) store.deleteShoppingItems(removals, { reason: 'rangement' });
  items.filter((i) => i.locationTouched).forEach((i) => store.rememberPlacement(i, { location: i.location }));
  ctx.sheet.close();
  const parts = [added ? t('ticket.added', { n: added }) : '', removals.length ? t('ticket.removed', { n: removals.length }) : ''];
  toast(parts.filter(Boolean).join(' · '));
  if (added) showTab('frigo');
}
