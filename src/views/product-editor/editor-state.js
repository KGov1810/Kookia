// Kookia — Fiche produit : état (produit en cours, lieu, type de date).

import * as R from '../../data/reference/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';

/** Prépare le produit affiché et l'état de la fiche (ajout ou modification). */
export function createEditorContext({ product = null, draft = null, mode = 'manual', filePromise = null, shoppingItemId = null, barcode = '' } = {}) {
  const isNew = !product;
  const p = {
    id: crypto.randomUUID(), name: '', expiry: S.isoInDays(7), category: 'autre', quantity: '', count: 1,
    barcode: '', addedBy: '', createdAt: 0, image: '', imageUrl: '',
    location: ui.location || 'frigo', dateKind: '', frozenAt: '',
    ...(draft ?? {}), ...(product ?? {})
  };
  const view = { dateTouched: !isNew, locationTouched: !isNew || Boolean(draft?.location), categoryTouched: !isNew || Boolean(draft?.category), busy: '', info: '', error: '', sameProductId: null };
  if (isNew && !draft?.location && p.name) {
    // Fruit ou légume reconnu (ex. rangé depuis la liste de courses) : son lieu habituel, date estimée.
    const produce = S.produceFor(p.name);
    if (produce) {
      p.location = produce.place;
      p.category = produce.type;
      p.dateKind = 'estimee';
    }
  }
  const ctx = { p, view, isNew, shoppingItemId, draft, mode, filePromise, barcode, sheet: null };
  if (!p.dateKind) setKind(ctx, R.KINDS_BY_LOCATION[p.location][0]);
  if (!isNew && S.dateKindOf(p) !== 'aucune' && !S.hasDate(p.expiry)) view.info = 'Date à compléter : saisissez-la, ou touchez « Lire la date » pour la photographier.';
  return ctx;
}

/** Change le type de date et prépare une date cohérente (estimée, congélation, aucune). */
export function setKind(ctx, kind) {
  const { p, view, isNew } = ctx;
  p.dateKind = kind;
  if (kind === 'estimee' && !view.dateTouched) p.expiry = S.isoInDays(S.estimateFreshDays(p.name, p.location));
  if (kind === 'congele') {
    p.frozenAt = S.hasDate(p.frozenAt) ? p.frozenAt : S.isoInDays(0);
    p.expiry = S.freezerLimit(p.category, p.frozenAt);
  }
  if (kind === 'aucune') p.expiry = '';
  if (kind === 'dlc' && isNew && !view.dateTouched) p.expiry = S.isoInDays(7); // date par défaut, annoncée comme telle
}

export function setLocation(ctx, location) {
  const { p, view } = ctx;
  p.location = location;
  const kinds = R.KINDS_BY_LOCATION[location];
  if (!kinds.includes(S.dateKindOf(p))) {
    view.dateTouched = false;
    setKind(ctx, kinds[0]);
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

/** Mise à jour du statut sans tout redessiner (le sélecteur de date d'iOS resterait sinon bloqué). */
export function refreshStatus(ctx) {
  const { p } = ctx;
  const status = ctx.sheet.panel.querySelector('.expiry-status');
  if (status) {
    status.className = `expiry-status ${S.stockStatus(p, state.settings.alertDays)}`;
    status.textContent = S.stockLabel(p);
  }
}
