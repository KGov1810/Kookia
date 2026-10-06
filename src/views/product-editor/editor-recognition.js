// Kookia — Fiche produit : code-barres, photo du produit et lecture de la date.

import { longDate } from '../../components/product-visuals.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
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
  return run(ctx, 'Recherche du produit…', async () => {
    p.barcode = digits;
    let info;
    try {
      info = await S.lookupBarcode(digits);
    } catch {
      throw new Error('Recherche impossible (connexion internet ?). Saisissez le nom à la main.');
    }
    if (!info) {
      view.error = `Code ${digits} inconnu d'Open Food Facts : saisissez le nom ou prenez le produit en photo.`;
      return;
    }
    p.name = info.name;
    p.category = info.category;
    view.categoryTouched = true; // catégorie d'Open Food Facts : ne pas la remplacer
    if (!p.quantity && info.quantity) {
      const split = S.splitCount(info.quantity);
      p.quantity = split.quantity;
      if ((p.count ?? 1) === 1) p.count = split.count;
    }
    if (!p.image && info.imageUrl) p.imageUrl = info.imageUrl;
    if (!view.locationTouched) {
      const place = S.defaultLocationFor(info.category, info.name);
      if (place) setLocation(ctx, place);
    }
    if (S.dateKindOf(p) === 'congele') p.expiry = S.freezerLimit(p.category, p.frozenAt);
    view.sameProductId = state.products.find((x) => x.id !== p.id && x.barcode
      && S.normalizeBarcode(x.barcode) === S.normalizeBarcode(digits))?.id ?? null;
    view.info = 'Produit trouvé. Indiquez le nombre et la date de péremption (ou touchez « Lire la date »).';
  });
}

export function handleProductPhoto(ctx, file) {
  const { p, view } = ctx;
  const message = hasClaudeKey() ? 'Claude analyse la photo…' : "Lecture de la date… (le premier usage télécharge l'outil de lecture)";
  return run(ctx, message, async () => {
    p.image = await S.thumbnail(file);
    p.imageUrl = '';
    if (hasClaudeKey()) {
      const { base64 } = await S.resizeImage(file, 1568, 0.8);
      const result = await S.analyzeProduct({ ...claude(), base64 });
      if (!result.isFood) {
        view.error = 'Claude ne reconnaît pas de produit alimentaire sur cette photo.';
        return;
      }
      if (result.name) p.name = result.name;
      p.category = result.category;
      view.categoryTouched = true; // catégorie reconnue par Claude
      if (!view.locationTouched) {
        const place = S.defaultLocationFor(result.category, result.name);
        if (place) setLocation(ctx, place);
      }
      if (!p.quantity && result.quantity) {
        const split = S.splitCount(result.quantity);
        p.quantity = split.quantity;
        if ((p.count ?? 1) === 1) p.count = split.count;
      }
      if (result.expiry) {
        applyReadDate(ctx, result.expiry);
        view.info = "Produit et date reconnus : vérifiez-les avant d'enregistrer.";
      } else {
        view.info = 'Produit reconnu. Date illisible : touchez « Lire la date » pour la photographier de près, ou saisissez-la.';
      }
    } else {
      const date = S.parseExpiryDate(await S.recognizeText(file));
      if (date) {
        applyReadDate(ctx, date);
        view.info = `Date lue : ${longDate(date)}. Vérifiez-la, puis saisissez le nom du produit.`;
      } else {
        view.info = "Sans clé Claude, la photo ne permet pas d'identifier le produit : saisissez son nom ou scannez le code-barres.";
      }
    }
  });
}

export function handleDatePhoto(ctx, file) {
  const { view } = ctx;
  return run(ctx, hasClaudeKey() ? 'Claude lit la date…' : "Lecture de la date… (le premier usage télécharge l'outil de lecture)", async () => {
    let date = null;
    let by = '';
    if (hasClaudeKey()) {
      const { base64 } = await S.resizeImage(file, 1568, 0.85);
      date = (await S.analyzeProduct({ ...claude(), base64 })).expiry;
      by = ' par Claude';
    } else {
      date = S.parseExpiryDate(await S.recognizeText(file));
    }
    if (date) {
      applyReadDate(ctx, date);
      view.info = `Date lue${by} : ${longDate(date)}. Vérifiez-la.`;
    } else {
      view.error = 'Date illisible. Essayez une photo plus nette et bien éclairée, ou saisissez-la.';
    }
  });
}
