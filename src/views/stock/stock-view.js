// Kookia — Écran Stock.

import { html, setHTML } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { LOCATION_ICON } from '../../components/product-visuals.js';
import { errorNote, syncLine } from '../../components/status.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';
import { fridgeList } from './stock-list.js';

export const fridgeView = {
  render() {
    return html`
      <header class="top">
        <div class="top-row"><div><h1>Stock</h1><p class="sync" id="sync-line"></p></div>
          <div class="top-actions"><button class="icon-btn" data-action="open-history" aria-label="Historique des changements">${I.history}</button>${settingsButton()}</div></div>
        <label class="search" id="search-box">${I.search}<input id="search" type="search" placeholder="Rechercher un produit" value="${ui.search}" autocomplete="off" enterkeyhint="search" aria-label="Rechercher un produit"></label>
        <div id="fridge-alert"></div>
      </header>
      <div id="fridge-error"></div>
      <div class="chips location-filter" id="location-filter" role="group" aria-label="Lieu de rangement"></div>
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

/** Bandeau compact : combien sont à consommer vite (le détail est juste en dessous) + idées recettes. */
function fridgeAlert() {
  const urgent = store.urgentProducts();
  if (!urgent.length) return '';
  const expired = urgent.filter((p) => store.productStatus(p) === 'expired').length;
  const title = expired === urgent.length
    ? `${S.plural(urgent.length, 'produit')} périmé${urgent.length > 1 ? 's' : ''}`
    : `${S.plural(urgent.length, 'produit')} à consommer vite`;
  const detail = expired && expired < urgent.length ? `Dont ${expired} périmé${expired > 1 ? 's' : ''}, à vérifier` : '';
  return html`
    <button class="alert-card ${expired === urgent.length ? 'expired' : ''}" data-action="go-recipes">
      <span><strong>${title}</strong>${detail ? html`<small>${detail}</small>` : ''}</span>
      <em>${I.sparkle}Idées recettes</em>
    </button>`;
}

/** Réglages : l'initiale du prénom, en haut du Stock (la barre du bas garde les 4 onglets et le +). */
function settingsButton() {
  const initial = state.settings.userName.trim().charAt(0).toUpperCase();
  return html`<button class="avatar" data-action="open-settings" aria-label="Réglages">${initial || I.sliders}</button>`;
}

/** Filtre par lieu : Tout, Frigo, Congélateur, Placard, Fruits & légumes (avec le nombre de produits). */
function locationFilter() {
  if (!state.products.length) return '';
  const chips = [{ id: '', label: 'Tout' }, ...R.LOCATIONS];
  return chips.map((loc) => {
    const count = store.productsIn(loc.id).length;
    return html`<button class="chip filter-chip" data-action="set-location" data-value="${loc.id}" aria-pressed="${String(ui.location === loc.id)}">${loc.id ? LOCATION_ICON[loc.id]() : ''}${loc.label}<i>${count}</i></button>`;
  });
}
