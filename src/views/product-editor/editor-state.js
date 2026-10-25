// Kookia — Fiche produit : état (produit en cours, lieu, type de date).

import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';
import { applyKnownPrice } from './editor-price.js';

/** Prépare le produit affiché et l'état de la fiche (ajout ou modification). */
export function createEditorContext({ product = null, draft = null, mode = 'manual', filePromise = null, shoppingItemId = null, barcode = '' } = {}) {
  const isNew = !product;
  const p = {
    id: crypto.randomUUID(), name: '', expiry: S.isoInDays(7), category: 'autre', quantity: '', count: 1,
    barcode: '', addedBy: '', createdAt: 0, image: '', imageUrl: '', unitPrice: null,
    location: ui.location || 'frigo', dateKind: '', frozenAt: '',
    ...(draft ?? {}), ...(product ?? {})
  };
  const view = {
    dateTouched: !isNew, locationTouched: !isNew || Boolean(draft?.location), categoryTouched: !isNew || Boolean(draft?.category),
    busy: '', info: '', error: '', sameProductId: null,
    priceText: S.priceInputValue(p.unitPrice), priceTouched: false, priceSuggested: false, take: null,
    userCategory: false, userLocation: false // catégorie ou lieu changés à la main (mémoire des corrections)
  };
  if (isNew && p.name && !draft?.category) {
    // Nom déjà connu (article de courses rangé) : catégorie et lieu retenus ou proposés, date estimée pour un fruit ou un légume.
    const memo = store.rememberedPlacement(p);
    const category = memo.category ?? S.guessCategory(p.name);
    if (category) p.category = category;
    const place = draft?.location ? null : memo.location ?? (category ? S.defaultLocationFor(category, p.name, p.location) : null);
    if (place) p.location = place;
  }
  const ctx = { p, view, isNew, shoppingItemId, draft, mode, filePromise, barcode, sheet: null };
  applyKnownPrice(ctx); // nom déjà connu (article de courses rangé) : dernier prix payé
  if (!p.dateKind) setKind(ctx, isNew ? defaultKind(p) : R.KINDS_BY_LOCATION[p.location][0]);
  return ctx;
}

/** Type de date d'un nouveau produit à ce lieu : estimée si le produit s'y prête, sinon le premier du lieu. */
function defaultKind(p) {
  const kinds = R.KINDS_BY_LOCATION[p.location] ?? ['dlc'];
  return p.name && S.isDateEstimated(p) && kinds.includes('estimee') ? 'estimee' : kinds[0];
}

/** Catégorie ou lieu trouvés (nom tapé, code-barres) : la date estimée suit, tant qu'elle n'a pas été saisie. */
export function followCategoryDate(ctx) {
  const { p, view } = ctx;
  if (view.dateTouched) return;
  const kinds = R.KINDS_BY_LOCATION[p.location] ?? [];
  const kind = S.dateKindOf(p);
  if (S.isDateEstimated(p) && (kind === 'dlc' || kind === 'aucune' || kind === 'estimee') && kinds.includes('estimee')) setKind(ctx, 'estimee');
  else if (!S.isDateEstimated(p) && kind === 'estimee' && kinds[0] !== 'estimee') setKind(ctx, kinds[0]);
}

/** Date choisie à la main : pour un produit du frigo estimé en attendant, c'est celle de l'emballage (DLC). */
export function enterDate(ctx, iso) {
  const { p, view } = ctx;
  p.expiry = iso;
  view.dateTouched = true;
  if (S.dateKindOf(p) === 'estimee' && S.fridgeEstimable(p.category, p.location)) p.dateKind = 'dlc';
}

/** Change le type de date et prépare une date cohérente (estimée, congélation, aucune). */
export function setKind(ctx, kind) {
  const { p, view, isNew } = ctx;
  p.dateKind = kind;
  if (kind === 'estimee' && !view.dateTouched) p.expiry = S.isoInDays(store.estimatedDays(p));
  if (kind === 'congele') {
    p.frozenAt = S.hasDate(p.frozenAt) ? p.frozenAt : S.isoInDays(0);
    p.expiry = S.freezerLimit(p.category, p.frozenAt);
  }
  if (kind === 'aucune') p.expiry = '';
  if (kind === 'dlc' && isNew && !view.dateTouched) p.expiry = S.isoInDays(7); // date par défaut, annoncée comme telle
}

export function setLocation(ctx, location) {
  const { p, view } = ctx;
  const previous = { ...p };
  p.location = location;
  const kinds = R.KINDS_BY_LOCATION[location];
  const kind = S.dateKindOf(p);
  if (!kinds.includes(kind) || (kind === 'estimee' && !S.isDateEstimated(p) && kinds[0] !== 'estimee')) {
    view.dateTouched = false;
    setKind(ctx, S.isDateEstimated(p) && kinds.includes('estimee') ? 'estimee' : kinds[0]);
  } else {
    followEstimate(ctx, previous);
  }
}

/** Fruits & légumes : rangés au frigo ou non (la date estimée suit). */
export function setCold(ctx, cold) {
  const previous = { ...ctx.p };
  ctx.p.cold = cold;
  followEstimate(ctx, previous);
}

/**
 * Date estimée qui suit le rangement (au frais ou non), tant qu'elle n'a pas été changée à la main :
 * nouveau produit, depuis aujourd'hui ; produit en stock, depuis son ajout, si sa date était encore l'estimation.
 */
function followEstimate(ctx, previous) {
  const { p, view, isNew } = ctx;
  if (S.dateKindOf(p) !== 'estimee' || S.keptCold(p) === S.keptCold(previous)) return;
  if (isNew) {
    if (!view.dateTouched) p.expiry = S.isoInDays(store.estimatedDays(p));
  } else if (p.expiry === S.estimatedExpiry(previous)) {
    p.expiry = S.estimatedExpiry(p); // date jamais changée à la main (ni avant, ni dans cette fiche)
  }
}

/** Une date lue sur l'emballage : DDM au placard ou au congélateur, date limite au frigo. */
export function applyReadDate(ctx, date) {
  const { p, view } = ctx;
  p.expiry = date;
  view.dateTouched = true;
  if (p.location === 'placard' || p.location === 'congelateur') p.dateKind = 'ddm';
  else if (p.location === 'frigo' && S.dateKindOf(p) === 'estimee') p.dateKind = 'dlc';
}
