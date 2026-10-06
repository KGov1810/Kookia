// Kookia — Ticket de caisse : photos, lecture par Claude et ajout au stock.

import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { showTab } from '../app/router.js';
import { selected } from './receipt-render.js';

export async function addPhoto(ctx, file) {
  const { view } = ctx;
  try {
    const { dataUrl, base64 } = await S.resizeImage(file, 1568, 0.85);
    view.photos.push({ preview: dataUrl, base64 });
    view.error = '';
  } catch (error) {
    view.error = error?.message || 'Photo illisible.';
  }
  if (ctx.sheet.isOpen) ctx.sheet.update();
}

export async function analyze(ctx) {
  const { view } = ctx;
  if (!view.photos.length || view.busy) return;
  view.busy = view.photos.length > 1 ? `Claude lit les ${view.photos.length} photos du ticket…` : 'Claude lit le ticket…';
  view.error = '';
  ctx.sheet.update();
  try {
    const items = await S.analyzeReceipt({
      key: state.settings.claudeKey,
      model: state.settings.model,
      images: view.photos.map((p) => p.base64)
    });
    // Repère les articles de la liste de courses achetés (chacun au plus une fois).
    const used = new Set();
    view.items = items.map((item) => {
      const match = state.shopping.find((s) => !used.has(s.id)
        && (S.nameMatchScore(s.name, item.name) > 0 || S.nameMatchScore(s.name, item.receiptText) > 0));
      if (match) used.add(match.id);
      return { ...item, selected: true, shoppingId: match?.id ?? null, shoppingName: match?.name ?? '' };
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
  if (!items.length) return;
  const shoppingIds = items.map((i) => i.shoppingId).filter(Boolean);
  const added = store.addReceiptProducts(items, shoppingIds);
  ctx.sheet.close();
  toast(`${S.plural(added, 'produit ajouté', 'produits ajoutés')} au stock`);
  showTab('frigo');
}
