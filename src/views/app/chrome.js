// Kookia — Barre d'onglets et pastilles.

import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import { ui } from './ui-state.js';

/** Couleur de la barre d'état : celle du bandeau vert du haut. */
const HEAD_COLOR = { light: '#12463E', dark: '#16362F' };

const TAB_LABEL = { frigo: 'tab.stock', recettes: 'tab.recipes', courses: 'tab.shopping', stats: 'tab.stats' };

export function updateChrome() {
  document.querySelector('.tabbar')?.setAttribute('aria-label', t('nav.label'));
  document.querySelector('.nav-add')?.setAttribute('aria-label', t('nav.add'));
  document.querySelectorAll('.tab').forEach((tab) => {
    const label = tab.querySelector('span');
    if (label && TAB_LABEL[tab.dataset.tab]) label.textContent = t(TAB_LABEL[tab.dataset.tab]);
    if (tab.dataset.tab === ui.tab) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  setTabBadge('frigo', store.urgentProducts().length, false);
  setTabBadge('courses', store.uncheckedCount(), true);
  updateAppBadge();
  applyTheme();
}

/** Apparence choisie dans Réglages : forcée en clair ou en sombre, ou comme l'iPhone. */
export function applyTheme(theme = state.settings.theme) {
  const forced = theme === 'light' || theme === 'dark' ? theme : '';
  const root = document.documentElement;
  if (forced) root.dataset.theme = forced;
  else delete root.dataset.theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.content = HEAD_COLOR[forced || (meta.media.includes('dark') ? 'dark' : 'light')];
  });
}

function setTabBadge(name, count, calm) {
  const badge = document.querySelector(`[data-badge="${name}"]`);
  if (!badge) return;
  badge.hidden = count === 0;
  badge.textContent = count > 99 ? '99+' : String(count);
  badge.classList.toggle('calm', calm);
}

export function updateAppBadge() {
  if (!('setAppBadge' in navigator)) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const count = store.badgeCount();
  const request = count ? navigator.setAppBadge(count) : navigator.clearAppBadge();
  request?.catch?.(() => {});
}
