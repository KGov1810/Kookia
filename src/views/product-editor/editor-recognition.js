// Kookia — Fiche produit : code-barres, photo du produit et lecture de la date.

import { longDate } from '../../components/product-visuals.js';
import * as store from '../../data/store/index.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { t } from '../../services/i18n/i18n.js';
import { applyKnownPrice } from './editor-price.js';
import { applyReadDate, setLocation } from './editor-state.js';

const claude = () => ({ key: state.settings.claudeKey, model: state.settings.model });

export async function run(ctx, message, task) {
  const { view } = ctx;
  view.busy = message;
  view.info = '';
  view.error = '';
  ctx.sheet.update();
  try {
    await task();
  } catch (error) {
    view.error = error?.message || String(error);
  } finally {
    view.busy = '';
    if (ctx.sheet.isOpen) ctx.sheet.update();
  }
}

export function handleBarcode(ctx, code) {
  const { p, view } = ctx;
  const digits = String(code).replace(/\D/g, '');
  if (!digits) return;
  return run(ctx, t('rec.searching'), async () => {
    p.barcode = digits;
    let info;
    try {
      info = await S.lookupBarcode(digits);
    } catch {
      throw new Error(t('rec.offline'));
    }
    if (!info) {
      view.error = t('rec.unknownCode', { code: digits });
      return;
    }
    p.name = info.name;
    // Correction déjà faite pour ce produit : elle passe avant Open Food Facts.
    const memo = store.rememberedPlacement(p);
    p.category = memo.category ?? info.category;
    view.categoryTouched = true; // catégorie retenue ou d'Open Food Facts : ne pas la remplacer
    if (!p.quantity && info.quantity) {
      const split = S.splitCount(info.quantity);
      p.quantity = split.quantity;
      if ((p.count ?? 1) === 1) p.count = split.count;
    }
    if (!p.image && info.imageUrl) p.imageUrl = info.imageUrl;
    if (!view.locationTouched) {
      const place = memo.location ?? S.defaultLocationFor(p.category, info.name, p.location);
      if (place) setLocation(ctx, place);
    }
    if (S.dateKindOf(p) === 'congele') p.expiry = S.freezerLimit(p.category, p.frozenAt);
    view.sameProductId = state.products.find((x) => x.id !== p.id && x.barcode
      && S.normalizeBarcode(x.barcode) === S.normalizeBarcode(digits))?.id ?? null;
    applyKnownPrice(ctx);
    view.info = t('rec.found');
  });
}

export function handleProductPhoto(ctx, file) {
  const { p, view } = ctx;
  const message = t(hasClaudeKey() ? 'rec.analyzing' : 'rec.readingDate');
  return run(ctx, message, async () => {
    p.image = await S.thumbnail(file);
    p.imageUrl = '';
    if (hasClaudeKey()) {
      const { base64 } = await S.resizeImage(file, 1568, 0.8);
      const result = await S.analyzeProduct({ ...claude(), base64 });
      if (!result.isFood) {
        view.error = t('rec.notFood');
        return;
      }
      if (result.name) p.name = result.name;
      const memo = store.rememberedPlacement(p);
      p.category = memo.category ?? result.category;
      view.categoryTouched = true; // catégorie retenue ou reconnue par Claude
      if (!view.locationTouched) {
        const place = memo.location ?? S.defaultLocationFor(p.category, p.name, p.location);
        if (place) setLocation(ctx, place);
      }
      if (!p.quantity && result.quantity) {
        const split = S.splitCount(result.quantity);
        p.quantity = split.quantity;
        if ((p.count ?? 1) === 1) p.count = split.count;
      }
      if (result.expiry) {
        applyReadDate(ctx, result.expiry);
        view.info = t('rec.productAndDate');
      } else {
        view.info = t('rec.productNoDate');
      }
    } else {
      const date = S.parseExpiryDate(await S.recognizeText(file));
      if (date) {
        applyReadDate(ctx, date);
        view.info = t('rec.dateThenName', { date: longDate(date) });
      } else {
        view.info = t('rec.noKeyPhoto');
      }
    }
  });
}

export function handleDatePhoto(ctx, file) {
  const { view } = ctx;
  return run(ctx, t(hasClaudeKey() ? 'rec.claudeReadsDate' : 'rec.readingDate'), async () => {
    let date = null;
    let byClaude = false;
    if (hasClaudeKey()) {
      const { base64 } = await S.resizeImage(file, 1568, 0.85);
      date = (await S.analyzeProduct({ ...claude(), base64 })).expiry;
      byClaude = true;
    } else {
      date = S.parseExpiryDate(await S.recognizeText(file));
    }
    if (date) {
      applyReadDate(ctx, date);
      view.info = t(byClaude ? 'rec.dateReadClaude' : 'rec.dateRead', { date: longDate(date) });
    } else {
      view.error = t('rec.dateUnreadable');
    }
  });
}
