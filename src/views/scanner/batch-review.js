// Kookia — Scanner plusieurs produits : fiche de vérification (nom, nombre, lieu ; décocher), puis ajout au stock.
// Code inconnu ou sans réseau : la ligne attend un nom, et se coche toute seule quand on le tape.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { openSheet } from '../../components/sheet.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { showTab } from '../app/router.js';

const kept = (entries) => entries.filter((e) => e.selected && e.name.trim());

function line(entry, index) {
  const thumb = entry.imageUrl ? html`<img src="${entry.imageUrl}" alt="">` : R.category(entry.category).emoji;
  const note = entry.status === 'loading' ? t('multi.searching')
    : entry.status === 'unknown' ? t('multi.unknown', { code: entry.code })
      : entry.status === 'offline' ? t('multi.offline', { code: entry.code }) : entry.quantity;
  return html`
    <div class="receipt-line batch-line ${entry.selected ? '' : 'off'}">
      <button class="pick-box" role="checkbox" aria-checked="${String(entry.selected)}" data-action="toggle-line" data-index="${index}" aria-label="${t('multi.line', { name: entry.name || entry.code })}"><span class="box">${I.check}</span></button>
      <span class="thumb">${thumb}</span>
      <div class="receipt-fields">
        <input data-field="name" data-index="${index}" value="${entry.name}" placeholder="${t('multi.typeName')}" aria-label="${t('editor.productName')}" autocomplete="off">
        ${note ? html`<small>${note}</small>` : ''}
        <div class="receipt-place">
          <div class="stepper small">
            <button data-action="line-minus" data-index="${index}" aria-label="${t('editor.oneLess')}" ${entry.count <= 1 ? raw('disabled') : ''}>−</button>
            <output>${entry.count}</output>
            <button data-action="line-plus" data-index="${index}" aria-label="${t('editor.oneMore')}">+</button>
          </div>
          <select class="receipt-location" data-field="location" data-index="${index}" aria-label="${t('stock.place')}">
            ${R.LOCATIONS.map((loc) => html`<option value="${loc.id}" ${entry.location === loc.id ? raw('selected') : ''}>${S.placeName(loc.id)}</option>`)}
          </select>
        </div>
      </div>
    </div>`;
}

/** Ajoute au stock les lignes cochées (date adaptée au lieu, comme pour un ticket) et ouvre le Stock. */
function confirm(entries, sheet) {
  const chosen = kept(entries);
  if (!chosen.length) return;
  const items = chosen.map((e) => ({
    name: e.name.trim(), category: e.category, quantity: e.quantity, count: e.count, location: e.location,
    barcode: e.code, imageUrl: e.imageUrl, unitPrice: store.lastKnownPrice({ name: e.name, barcode: e.code })
  }));
  const added = store.addReceiptProducts(items, [], { source: 'scan' });
  chosen.filter((e) => e.locationTouched).forEach((e) => store.rememberPlacement({ name: e.name, barcode: e.code }, { location: e.location }));
  sheet.close();
  if (!added) return;
  const toFill = items.some((i) => i.location === 'frigo' && S.manualDate(i.category));
  toast(`${t('multi.added', { n: added })}${toFill ? t('away.datesToFill') : ''}`);
  showTab('frigo');
}

/** Ouvre la vérification ; renvoie la fiche (mise à jour quand une recherche en cours aboutit). */
export function openBatchReview(entries) {
  const confirmLabel = () => (kept(entries).length ? t('multi.addN', { n: kept(entries).length }) : t('ticket.add'));
  const confirmButtons = () => html`<button class="primary" data-action="confirm" ${kept(entries).length ? '' : raw('disabled')}>${I.check}<span>${confirmLabel()}</span></button>`;
  // Pendant la saisie d'un nom : boutons mis à jour sur place (les remplacer ferait perdre le toucher sur « Ajouter »).
  const refreshButtons = () => {
    sheet.panel.querySelectorAll('[data-action="confirm"]').forEach((button) => { button.disabled = !kept(entries).length; });
    const label = sheet.panel.querySelector('#batch-confirm span');
    if (label) label.textContent = confirmLabel();
  };
  const sheet = openSheet({
    tall: true,
    render: () => html`
      <header class="sheet-head">
        <button class="link" data-action="close">${t('common.cancel')}</button>
        <h2>${t('multi.title')}</h2>
        <button class="link strong" data-action="confirm" ${kept(entries).length ? '' : raw('disabled')}>${t('common.ok')}</button>
      </header>
      <div class="sheet-body">
        <p class="hint">${t('multi.hint')}</p>
        <section class="group">${entries.map(line)}</section>
        <div id="batch-confirm">${confirmButtons()}</div>
      </div>`,
    actions: {
      'toggle-line': (el) => {
        const entry = entries[Number(el.dataset.index)];
        entry.selected = !entry.selected;
        entry.selectedTouched = true;
        sheet.update();
      },
      'line-minus': (el) => {
        const entry = entries[Number(el.dataset.index)];
        entry.count = Math.max(1, entry.count - 1);
        entry.countTouched = true;
        sheet.update();
      },
      'line-plus': (el) => {
        const entry = entries[Number(el.dataset.index)];
        entry.count += 1;
        entry.countTouched = true;
        sheet.update();
      },
      confirm: () => confirm(entries, sheet)
    },
    onInput: (event) => {
      const entry = entries[Number(event.target.dataset.index)];
      if (!entry) return;
      if (event.target.dataset.field === 'name' && event.type === 'input') {
        entry.name = event.target.value;
        // Nom tapé pour un code inconnu : la ligne se coche (sans tout redessiner, le clavier resterait ouvert).
        if (entry.name.trim() && !entry.selectedTouched && !entry.selected) {
          entry.selected = true;
          const row = event.target.closest('.batch-line');
          row?.classList.remove('off');
          row?.querySelector('.pick-box')?.setAttribute('aria-checked', 'true');
        }
        refreshButtons();
      } else if (event.target.dataset.field === 'location' && event.type === 'change') {
        entry.location = event.target.value;
        entry.locationTouched = true;
      }
    }
  });
  return sheet;
}
