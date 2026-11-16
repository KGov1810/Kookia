// Kookia — Écrans rares chargés à leur premier usage (ticket, scanner, fruits et légumes, planning, historique) :
// le démarrage de l'app n'a pas à les lire. Le service worker les garde en cache : ils s'ouvrent aussi hors ligne.

import { toast } from '../../components/toast.js';
import { t } from '../../services/i18n/i18n.js';

const loading = new Set();

/**
 * Fonction qui charge le module (load : () => import('…')) puis appelle sa fonction name avec les mêmes arguments.
 * Un échec de chargement (page restée sur une ancienne version, réseau coupé sans cache) est signalé par un message.
 */
export function lazy(load, name) {
  return (...args) => {
    const pending = load().then((module) => module[name](...args), (error) => {
      console.error(error);
      toast(t('common.loadFailed'));
    });
    loading.add(pending);
    pending.finally(() => loading.delete(pending));
    return pending;
  };
}

/** Attend les écrans en cours de chargement (tests). */
export function lazyLoaded() {
  return Promise.all(loading);
}
