// Kookia — Actions de l'écran Réglages : alertes, clé Claude, foyer, pastille.

import { copyText, shareText } from '../../components/platform.js';
import { toast } from '../../components/toast.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { updateAppBadge } from '../app/chrome.js';
import { inviteMessage, settingsView } from './settings-view.js';

/** Actions des boutons (attribut data-action). */
export const settingsActions = {
  'alert-minus': () => store.updateSettings({ alertDays: Math.max(0, state.settings.alertDays - 1) }),
  'alert-plus': () => store.updateSettings({ alertDays: Math.min(7, state.settings.alertDays + 1) }),
  'kcal-minus': () => store.updateSettings({ lightMaxKcal: Math.max(250, (state.settings.lightMaxKcal || 500) - 50) }),
  'kcal-plus': () => store.updateSettings({ lightMaxKcal: Math.min(1000, (state.settings.lightMaxKcal || 500) + 50) }),
  'save-key': () => {
    const key = document.getElementById('key-input')?.value.trim() ?? '';
    if (!key.startsWith('sk-')) {
      toast('Ce texte ne ressemble pas à une clé Claude (elle commence par sk-ant-).');
      return;
    }
    store.updateSettings({ claudeKey: key });
    toast('Clé enregistrée');
  },
  'delete-key': () => {
    if (window.confirm('Supprimer la clé Claude de cet iPhone ?')) store.updateSettings({ claudeKey: '' });
  },
  'share-invite': () => shareText(inviteMessage()),
  'copy-invite': () => copyText(store.invitationCode()),
  leave: () => {
    if (window.confirm("Quitter ce foyer ? Les données restent dans le foyer : vous pourrez le rejoindre avec le code d'invitation.")) {
      store.leaveHousehold();
    }
  },
  reconnect: () => store.reconnect(),
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
