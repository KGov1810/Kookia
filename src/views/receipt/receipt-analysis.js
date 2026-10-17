// Kookia — Ticket de caisse : photos, lecture par Claude et ajout au stock.

import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { showTab } from '../app/router.js';
import { removals as listRemovals, selected } from './receipt-render.js';

export async function addPhoto(ctx, file) {
  const { view } = ctx;
  try {
    const { dataUrl, base64 } = await S.resizeImage(file, 1568, 0.85);
    view.photos.push({ preview: dataUrl, base64 });
    view.error = '';
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
    view.stage = 'review';
  } catch (error) {
    view.error = error?.message || String(error);
  } finally {
    view.busy = '';
    if (ctx.sheet.isOpen) ctx.sheet.update();
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
