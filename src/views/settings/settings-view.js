// Kookia — Écran Réglages.

import { html, raw, setHTML } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { isStandalone } from '../../components/platform.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';

function alertText(days) {
  return days === 0 ? 'le jour même' : `${S.plural(days, 'jour')} avant`;
}

export const settingsView = {
  render() {
    const s = state.settings;
    return html`
      <header class="top"><h1>Réglages</h1></header>

      <section class="group">
        <h2>Profil</h2>
        <label class="field"><span>Votre prénom</span><input data-setting="userName" value="${s.userName}" placeholder="Prénom" autocomplete="given-name"></label>
      </section>

      <section class="group">
        <h2>Alertes de péremption</h2>
        <div class="field"><span>Prévenir</span>
          <div class="stepper">
            <button data-action="alert-minus" aria-label="Un jour de moins">−</button>
            <output id="alert-days">${alertText(s.alertDays)}</output>
            <button data-action="alert-plus" aria-label="Un jour de plus">+</button>
          </div>
        </div>
        <div id="badge-row"></div>
      </section>
      <p class="hint">Les produits à consommer vite sont mis en avant à chaque ouverture. Une application web ne peut pas envoyer de rappel quand elle est fermée : programmez un rappel quotidien « Vérifier le stock » dans l'app Rappels (voir README).</p>

      <section class="group">
        <h2>Recettes et photos (Claude)</h2>
        <div id="claude-key"></div>
        <label class="field"><span>Modèle</span>
          <select id="model">${R.MODELS.map((m) => html`<option value="${m.id}" ${m.id === s.model ? raw('selected') : ''}>${m.label}</option>`)}</select>
        </label>
      </section>
      <p class="hint">Sert à générer les recettes et à reconnaître un produit en photo. Créez une clé sur console.anthropic.com (payée à l'usage : quelques centimes par génération). Elle reste sur cet iPhone.</p>

      <section class="group">
        <h2>Recettes</h2>
        <div class="field"><span class="label-stack">Recette légère<small>Maximum par portion (filtre « Léger »)</small></span>
          <div class="stepper">
            <button data-action="kcal-minus" aria-label="50 kcal de moins">−</button>
            <output id="kcal-max">${s.lightMaxKcal || 500} kcal</output>
            <button data-action="kcal-plus" aria-label="50 kcal de plus">+</button>
          </div>
        </div>
      </section>

      <section class="group"><h2>Foyer partagé</h2><div id="household"></div></section>

      <section class="group">
        <h2>Synchronisation</h2>
        <div id="sync-details"></div>
        <button class="row-button" data-action="reconnect">${I.refresh}Se reconnecter</button>
      </section>

      <section class="group">
        <h2>À propos</h2>
        <div class="field"><span>Données produits</span><a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a></div>
        <p class="plain hint">Base collaborative sous licence ODbL.</p>
      </section>`;
  },
  mounted() {
    this.update('settings');
  },
  update(what) {
    const s = state.settings;
    const days = document.getElementById('alert-days');
    if (days) days.textContent = alertText(s.alertDays);
    const kcal = document.getElementById('kcal-max');
    if (kcal) kcal.textContent = `${s.lightMaxKcal || 500} kcal`;
    setHTML('#badge-row', badgeRow());
    const time = state.lastSync ? state.lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
    setHTML('#sync-details', html`
      <div class="field"><span>État</span><span class="muted">${store.syncLabel()}</span></div>
      <div class="field"><span>Dernière synchro</span><span class="muted">${time}</span></div>
      ${state.error ? html`<p class="note error">${state.error}</p>` : ''}`);
    if (what !== 'settings') return; // ne pas effacer un champ en cours de saisie
    setHTML('#claude-key', s.claudeKey
      ? html`
        <div class="field"><span>Clé API</span><span class="muted">enregistrée (…${s.claudeKey.slice(-4)})</span></div>
        <button class="row-button danger" data-action="delete-key">${I.trash}Supprimer la clé</button>`
      : html`
        <label class="field stack"><span>Clé API</span><input id="key-input" type="password" placeholder="sk-ant-…" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
        <div class="row-actions"><button class="secondary" data-action="save-key">Enregistrer la clé</button></div>`);
    setHTML('#household', s.householdCode
      ? html`
        <div class="field"><span>Code du foyer</span><strong>${s.householdCode}</strong></div>
        <button class="row-button" data-action="share-invite">${I.share}Inviter l'autre iPhone</button>
        <button class="row-button" data-action="copy-invite">${I.copy}Copier le code d'invitation</button>
        <button class="row-button danger" data-action="leave">Quitter ce foyer</button>`
      : html`<p class="plain hint">Aucun foyer.</p>`);
  }
};

function badgeRow() {
  if (!isStandalone() || !('setAppBadge' in navigator) || !('Notification' in window)) return '';
  if (Notification.permission === 'granted') {
    return html`<div class="field"><span>Pastille sur l'icône</span><span class="muted">activée</span></div>`;
  }
  if (Notification.permission === 'denied') {
    return html`<p class="plain hint">Pastille refusée : Réglages de l'iPhone > Notifications > Frigo.</p>`;
  }
  return html`<button class="row-button" data-action="enable-badge">${I.bell}Afficher sur l'icône le nombre de produits à consommer</button>`;
}

export function inviteMessage() {
  const url = location.origin + location.pathname;
  return [
    'Rejoins notre foyer sur Kookia !',
    `1. Ouvre ce lien dans Safari : ${url}`,
    "2. Touche Partager puis « Sur l'écran d'accueil », et ouvre l'app depuis l'écran d'accueil.",
    "3. Colle ce code d'invitation quand l'app le demande :",
    '',
    store.invitationCode()
  ].join('\n');
}
