// Kookia — Barre d'onglets et pastilles.

import * as store from '../../data/store/index.js';
import { ui } from './ui-state.js';

export function updateChrome() {
  document.querySelectorAll('.tab').forEach((tab) => {
    if (tab.dataset.tab === ui.tab) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });
  setTabBadge('frigo', store.urgentProducts().length, false);
  setTabBadge('courses', store.uncheckedCount(), true);
  updateAppBadge();
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
