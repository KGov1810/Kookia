// Kookia — Fiche produit : catégorie, lieu et date proposés d'après le nom.

import { fmt } from '../../components/html.js';
import { thumb } from '../../components/product-visuals.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { dateSection } from './editor-date-section.js';
import { suggestPrice } from './editor-price.js';
import { refreshQuantityUnit } from './editor-quantity.js';
import { followCategoryDate, setLocation } from './editor-state.js';

// Réponses de Claude pour les noms non reconnus, le temps de la session (un seul appel par nom).
const asked = new Map();

/**
 * Applique une catégorie proposée (et le lieu retenu ou habituel) sans tout redessiner,
 * pour ne pas perdre le toucher en cours. Renvoie vrai si la date doit être redessinée.
 */
export function applyCategory(ctx, category, rememberedLocation = null) {
  const { p, view } = ctx;
  const panel = ctx.sheet.panel;
  let changed = false;
  if (category !== p.category) {
    p.category = category;
    changed = true;
    const select = panel.querySelector('[name="category"]');
    if (select) select.value = category;
    const thumbEl = panel.querySelector('.name-row .thumb');
    if (thumbEl && !p.image && !p.imageUrl) thumbEl.outerHTML = fmt(thumb(p));
    refreshQuantityUnit(ctx); // kg pour un fruit ou un légume, g sinon (si aucune unité n'a été choisie)
  }
  const place = view.locationTouched ? null : rememberedLocation ?? S.defaultLocationFor(category, p.name, p.location);
  if (place && place !== p.location) {
    setLocation(ctx, place);
    changed = true;
    panel.querySelectorAll('[data-action="set-loc"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.value === p.location)));
  }
  // Fruits, légumes, pain et produits du frigo (hors viande, poisson…) : date estimée ; l'inverse pour les autres.
  const before = `${S.dateKindOf(p)} ${p.expiry}`;
  followCategoryDate(ctx);
  return changed || before !== `${S.dateKindOf(p)} ${p.expiry}`;
}

function refreshDate(ctx, changed) {
  const { p, view } = ctx;
  if (S.dateKindOf(p) === 'estimee' && !view.dateTouched) {
    p.expiry = S.isoInDays(store.estimatedDays(p));
    changed = true;
  }
  if (S.dateKindOf(p) === 'congele') p.expiry = S.freezerLimit(p.category, p.frozenAt);
  const section = ctx.sheet.panel.querySelector('#date-section');
  if (changed && section) section.outerHTML = fmt(dateSection(ctx));
}

/** Nom inconnu de l'app : Claude propose la catégorie et le lieu (clé Claude nécessaire). */
function askClaude(ctx) {
  const name = ctx.p.name.trim();
  if (!name || !store.hasClaudeKey()) return;
  const id = name.toLowerCase();
  if (!asked.has(id)) {
    asked.set(id, S.categorizeProduct({ key: state.settings.claudeKey, name }).catch(() => ({ category: null, location: null })));
  }
  asked.get(id).then(({ category, location }) => {
    // Fiche fermée, nom changé ou catégorie choisie entre-temps : on ne touche à rien.
    if (!category || !ctx.sheet.panel.isConnected || ctx.p.name.trim() !== name || ctx.view.categoryTouched) return;
    refreshDate(ctx, applyCategory(ctx, category, location));
  });
}

/**
 * Après la saisie du nom : catégorie et lieu retenus pour ce produit (corrections passées),
 * sinon proposés d'après le nom (« Lentilles » → Légumineuses), sinon demandés à Claude.
 */
export function suggestFromName(ctx) {
  const { p, view, isNew } = ctx;
  let changed = false;
  if (isNew && !view.categoryTouched) {
    const memo = store.rememberedPlacement(p);
    const category = memo.category ?? S.guessCategory(p.name);
    if (category) changed = applyCategory(ctx, category, memo.location ?? null);
    else askClaude(ctx);
  }
  refreshDate(ctx, changed);
  suggestPrice(ctx);
}
