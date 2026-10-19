// Kookia — Scanner plusieurs produits : un bip par produit, la liste se remplit en bas de l'écran, puis
// « Vérifier N produits » ouvre la fiche de vérification (comme pour un ticket).

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { openBatchReview } from './batch-review.js';
import { openScanner, refreshTray } from './scanner.js';

/** Produit trouvé par Open Food Facts : catégorie et lieu retenus pour lui s'il y en a, unités d'un pack (« 4 x 125 g »). */
function describe(entry, info) {
  const memo = store.rememberedPlacement({ name: info.name, barcode: entry.code });
  const category = memo.category ?? info.category;
  const split = S.splitCount(info.quantity);
  entry.units = Math.max(1, split.count || 1);
  Object.assign(entry, {
    status: 'found', name: info.name, category, quantity: split.quantity, imageUrl: info.imageUrl,
    location: memo.location ?? S.defaultLocationFor(category, info.name, 'frigo') ?? 'frigo'
  });
  if (!entry.countTouched) entry.count = entry.scans * entry.units;
  if (!entry.selectedTouched) entry.selected = true;
}

function lineLabel(entry) {
  if (entry.status === 'loading') return t('multi.searching');
  if (entry.status === 'unknown') return t('multi.unknown', { code: entry.code });
  if (entry.status === 'offline') return t('multi.offline', { code: entry.code });
  return entry.name;
}

function trayLine(entry, index) {
  const thumb = entry.imageUrl ? html`<img src="${entry.imageUrl}" alt="">` : R.category(entry.category).emoji;
  return html`
    <div class="tray-line ${entry.status}">
      <span class="tray-thumb" aria-hidden="true">${entry.status === 'loading' ? html`<span class="spinner"></span>` : thumb}</span>
      <span class="tray-name">${lineLabel(entry)}</span>
      <b>× ${entry.scans}</b>
      <button data-action="tray-plus" data-index="${index}" aria-label="${t('multi.plus', { name: entry.name || entry.code })}">${I.plus}</button>
    </div>`;
}

/** Ouvre le scanner en rafale (menu +). */
export function openBatchScan() {
  const entries = []; // le plus récent en premier
  let review = null;
  const changed = () => {
    refreshTray(sc);
    // Fiche de vérification déjà ouverte (recherche encore en cours) : mise à jour, sauf pendant une saisie.
    const typing = document.activeElement?.matches?.('input, select') && review?.panel.contains(document.activeElement);
    if (review?.isOpen && !typing) review.update();
  };
  const addScan = (entry) => {
    entry.scans += 1;
    if (!entry.countTouched) entry.count = entry.scans * entry.units;
    changed();
  };

  const sc = openScanner((code) => {
    const digits = String(code).replace(/\D/g, '');
    const same = entries.find((e) => e.code === digits);
    if (same) return addScan(same);
    const entry = { code: digits, scans: 1, units: 1, count: 1, status: 'loading', name: '', category: 'autre', quantity: '', imageUrl: '', location: 'frigo', selected: false };
    entries.unshift(entry);
    changed();
    S.lookupBarcode(digits)
      .then((info) => (info ? describe(entry, info) : (entry.status = 'unknown')))
      .catch(() => { entry.status = 'offline'; })
      .finally(changed);
  }, {
    continuous: true,
    tray: () => (entries.length ? html`${entries.map(trayLine)}<p class="tray-hint">${t('multi.trayHint')}</p>` : ''),
    doneLabel: () => (entries.length ? t('multi.done', { n: entries.length }) : ''),
    onDone: () => {
      if (entries.length) review = openBatchReview(entries);
    },
    actions: {
      'tray-plus': (el) => {
        const entry = entries[Number(el.dataset.index)];
        if (entry) addScan(entry);
      }
    }
  });
  return sc;
}
