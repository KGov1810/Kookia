// Kookia — Branchement des événements (touchers, saisie, visibilité).

import { setHTML } from '../../components/html.js';
import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';
import { needsOnboarding } from '../onboarding/onboarding.js';
import { stockNote } from '../shopping/shopping-view.js';
import { openAddMenu } from '../stock/add-menu.js';
import { setStatsFilter } from '../stats/stats-actions.js';
import { fridgeList } from '../stock/stock-list.js';
import { wireSwipe } from '../stock/stock-swipe.js';
import { getAction } from './actions.js';
import { updateChrome } from './chrome.js';
import { onStoreChange, showTab, viewFor } from './router.js';
import { screen, ui } from './ui-state.js';

export function wireEvents() {
  wireSwipe(); // avant le toucher des actions : un geste de glisser ne doit pas ouvrir la fiche
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
  });

  screen.addEventListener('submit', (event) => {
    if (event.target.id !== 'add-item') return;
    event.preventDefault();
    const nameInput = document.getElementById('new-item');
    // Un seul champ : « 2 lait » ou « lait x2 » → 2 × Lait ; un poids reste dans le nom (« Farine 1 kg »).
    const { name, quantity } = S.parseShoppingInput(nameInput.value);
    if (!name) {
      if (nameInput.value.trim()) toast("Indiquez l'article à acheter (ex. 2 lait)");
      nameInput.focus();
      return;
    }
    const result = store.addShoppingItem(name, quantity, { updateQuantity: true });
    if (result) {
      nameInput.value = '';
      const inStock = stockNote({ name });
      if (result === 'updated') toast(`${name} : quantité mise à jour (${quantity})`);
      else if (inStock) toast(`${name} : ajouté. ${inStock}, à vérifier avant d'acheter.`);
    } else {
      toast('Déjà dans la liste');
    }
    nameInput.focus();
  });

  document.querySelector('.tabbar').addEventListener('click', (event) => {
    if (event.target.closest('.nav-add')) {
      openAddMenu();
      return;
    }
    const tab = event.target.closest('.tab');
    if (tab) showTab(tab.dataset.tab);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    store.resume();
    if (!needsOnboarding()) {
      store.expireWeekPlan(); // planning de la semaine terminé : effacé
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
