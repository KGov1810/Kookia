// Kookia — Écran Stock.

import { html, setHTML } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { errorNote, syncLine } from '../../components/status.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { t } from '../../services/i18n/i18n.js';
import { ui } from '../app/ui-state.js';
import { fridgeList } from './stock-list.js';

export const fridgeView = {
  render() {
    return html`
      <header class="top">
        <div class="top-row"><div><h1>${t('tab.stock')}</h1><p class="sync" id="sync-line"></p></div>
          <div class="top-actions"><button class="icon-btn" data-action="open-history" aria-label="${t('stock.history')}">${I.history}</button>${settingsButton()}</div></div>
        <label class="search" id="search-box">${I.search}<input id="search" type="search" placeholder="${t('stock.search')}" value="${ui.search}" autocomplete="off" enterkeyhint="search" aria-label="${t('stock.search')}"></label>
        <div id="fridge-alert"></div>
      </header>
      <div id="fridge-error"></div>
      <div class="chips location-filter" id="location-filter" role="group" aria-label="${t('stock.place')}"></div>
      <div id="fridge-list"></div>`;
  },
  mounted() {
    this.update();
  },
  update() {
    syncLine();
    setHTML('#fridge-error', errorNote());
    setHTML('#fridge-alert', fridgeAlert());
    setHTML('#location-filter', locationFilter());
    setHTML('#fridge-list', fridgeList());
    const box = document.getElementById('search-box');
    if (box) box.hidden = state.products.length === 0;
  }
};

/** Bandeau compact : combien de produits sont à sauver (le détail est juste en dessous) + idées recettes. */
function fridgeAlert() {
  const urgent = store.urgentProducts();
  if (!urgent.length) return '';
  const expired = urgent.filter((p) => store.productStatus(p) === 'expired').length;
  const all = expired === urgent.length;
  const title = t(all ? 'stock.allExpired' : 'stock.toSave', { n: urgent.length });
  const check = urgent.filter((p) => store.productStatus(p) === 'check').length;
  const parts = [expired ? t('stock.nExpired', { n: expired }) : '', check ? t('stock.nCheck', { n: check }) : ''].filter(Boolean);
  const detail = all ? t('stock.checkBeforeThrowing') : parts.length ? t('stock.including', { list: parts.join(', ') }) : t('stock.allGood');
  return html`
    <button class="alert-card ${all ? 'expired' : ''}" data-action="go-recipes">
      <span><strong>${title}</strong><small>${detail}</small></span>
      <em>${I.sparkle}${t('stock.recipeIdeas')}</em>
    </button>`;
}

/** Réglages : l'initiale du prénom, en haut du Stock (la barre du bas garde les 4 onglets et le +). */
function settingsButton() {
  const initial = state.settings.userName.trim().charAt(0).toUpperCase();
  return html`<button class="avatar" data-action="open-settings" aria-label="${t('settings.title')}">${initial || I.sliders}</button>`;
}

/** Filtre par lieu : Tout, Frigo, Congélateur, Placard, Fruits & légumes (avec le nombre de produits). */
function locationFilter() {
  if (!state.products.length) return '';
  const chips = [{ id: '', label: t('stock.all') }, ...R.LOCATIONS.map((l) => ({ id: l.id, label: S.placeName(l.id) }))];
  return chips.map((loc) => {
    const count = store.productsIn(loc.id).length;
    return html`<button class="chip filter-chip" data-action="set-location" data-value="${loc.id}" aria-pressed="${String(ui.location === loc.id)}">${loc.label}<i>${count}</i></button>`;
  });
}
