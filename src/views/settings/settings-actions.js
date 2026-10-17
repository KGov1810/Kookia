// Kookia — Actions de l'écran Réglages : alertes, clé Claude, foyer, pastille.

import { copyText, shareText } from '../../components/platform.js';
import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import { updateAppBadge } from '../app/chrome.js';
import { rerenderKeepScroll } from '../app/router.js';
import { ui } from '../app/ui-state.js';
import { inviteMessage, renderProfile, settingsView } from './settings-view.js';

/** Actions des boutons (attribut data-action). */
export const settingsActions = {
  'alert-minus': () => store.updateSettings({ alertDays: Math.max(0, state.settings.alertDays - 1) }),
  'alert-plus': () => store.updateSettings({ alertDays: Math.min(7, state.settings.alertDays + 1) }),
  'kcal-minus': () => store.updateSettings({ lightMaxKcal: Math.max(250, (state.settings.lightMaxKcal || 500) - 50) }),
  'kcal-plus': () => store.updateSettings({ lightMaxKcal: Math.min(1000, (state.settings.lightMaxKcal || 500) + 50) }),
  'save-key': () => {
    const key = document.getElementById('key-input')?.value.trim() ?? '';
    if (!key.startsWith('sk-')) {
      toast(t('settings.keyInvalid'));
      return;
    }
    store.updateSettings({ claudeKey: key });
    toast(t('settings.keyStored'));
  },
  'delete-key': () => {
    if (window.confirm(t('settings.keyConfirmDelete'))) store.updateSettings({ claudeKey: '' });
  },
  'share-invite': () => shareText(inviteMessage()),
  'copy-invite': () => copyText(store.invitationCode()),
  leave: () => {
    if (window.confirm(t('settings.leaveConfirm'))) {
      store.leaveHousehold();
    }
  },
  reconnect: () => store.reconnect(),
  'open-advanced': () => {
    ui.settingsPage = 'advanced';
    rerenderKeepScroll();
    window.scrollTo(0, 0);
  },
  'close-advanced': () => {
    ui.settingsPage = '';
    rerenderKeepScroll();
  },
  'edit-name': () => {
    ui.editName = true;
    renderProfile();
    document.getElementById('name-input')?.focus();
  },
  'done-name': () => {
    const value = document.getElementById('name-input')?.value.trim() ?? '';
    ui.editName = false;
    if (value && value !== state.settings.userName) store.updateSettings({ userName: value });
    renderProfile();
  },
  'set-theme': (el) => store.updateSettings({ theme: el.dataset.value }),
  'enable-badge': async () => {
    try {
      await Notification.requestPermission();
    } catch {
      // ancien Safari : rien à faire
    }
    updateAppBadge();
    settingsView.update('badge');
  }
};
