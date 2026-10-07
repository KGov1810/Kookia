// Kookia — Branchement des événements (touchers, saisie, visibilité).

import { setHTML } from '../../components/html.js';
import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';
import { needsOnboarding } from '../onboarding/onboarding.js';
import { stockNote } from '../shopping/shopping-view.js';
import { setStatsFilter } from '../stats/stats-actions.js';
import { fridgeList } from '../stock/stock-list.js';
import { getAction } from './actions.js';
import { updateChrome } from './chrome.js';
import { onStoreChange, rerenderKeepScroll, showTab, viewFor } from './router.js';
import { screen, ui } from './ui-state.js';

export function wireEvents() {
  screen.addEventListener('click', (event) => {
    const target = event.target.closest('[data-action]');
    if (!target || !screen.contains(target)) return;
    const handler = getAction(target.dataset.action);
    if (!handler) return;
    event.preventDefault();
    handler(target, event);
  });

  screen.addEventListener('input', (event) => {
    const t = event.target;
    if (t.id === 'new-qty') {
      const clean = S.sanitizeCount(t.value);
      if (t.value !== clean) t.value = clean;
      return;
    }
    if (t.id === 'search') {
      ui.search = t.value;
      setHTML('#fridge-list', fridgeList());
    } else if (t.id === 'connect-text') {
      ui.onboarding.text = t.value;
    } else if (t.id === 'join-text') {
      ui.onboarding.joinText = t.value;
    } else if (t.id === 'ob-name') {
      ui.onboarding.name = t.value;
    }
  });

  screen.addEventListener('change', (event) => {
    const t = event.target;
    if (t.dataset.setting === 'userName') store.updateSettings({ userName: t.value.trim() });
    else if (t.id === 'model') store.updateSettings({ model: t.value });
    else if (t.dataset.statsFilter) setStatsFilter(t.dataset.statsFilter, t.value);
    else if (t.id === 'batch-toggle' || t.id === 'light-toggle') {
      if (t.id === 'batch-toggle') ui.filters.batchOnly = t.checked;
      else ui.filters.light = t.checked;
      ui.recipeNote = null;
      rerenderKeepScroll();
    }
  });

  screen.addEventListener('submit', (event) => {
    if (event.target.id !== 'add-item') return;
    event.preventDefault();
    const nameInput = document.getElementById('new-item');
    const qtyInput = document.getElementById('new-qty');
    const name = nameInput.value.trim();
    const qty = S.sanitizeCount(qtyInput.value);
    if (!name) {
      if (qty) toast("Indiquez l'article à acheter");
      nameInput.focus();
      return;
    }
    const result = store.addShoppingItem(name, qty, { updateQuantity: true });
    if (result) {
      nameInput.value = '';
      qtyInput.value = '';
      const inStock = stockNote({ name });
      if (result === 'updated') toast(`${name} : quantité mise à jour (${qty})`);
      else if (inStock) toast(`${name} : ajouté. ${inStock}, à vérifier avant d'acheter.`);
    } else {
      toast('Déjà dans la liste');
    }
    nameInput.focus();
  });

  document.querySelector('.tabbar').addEventListener('click', (event) => {
    const tab = event.target.closest('.tab');
    if (tab) showTab(tab.dataset.tab);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    store.resume();
    if (!needsOnboarding()) {
      viewFor(ui.tab).update?.('time'); // les jours restants changent après minuit
      updateChrome();
    }
  });
  window.addEventListener('online', () => {
    store.resume(); // rétablit tout de suite la connexion Firestore
    onStoreChange('sync');
  });
  window.addEventListener('offline', () => onStoreChange('sync'));
}
