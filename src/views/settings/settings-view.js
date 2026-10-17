// Kookia — Écran Réglages.

import { html, raw, setHTML } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { isStandalone } from '../../components/platform.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';

function alertText(days) {
  return days === 0 ? 'le jour même' : `${S.plural(days, 'jour')} avant`;
}

/** Réglages, ou la sous-page « Avancé » (modèle, synchronisation, à propos). */
export const settingsView = {
  render() {
    return ui.settingsPage === 'advanced' ? advancedPage() : mainPage();
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
    setHTML('#theme-switch', themeSwitch(s.theme));
    const time = state.lastSync ? state.lastSync.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
    setHTML('#sync-details', html`
      <div class="field"><span>État</span><span class="muted">${store.syncLabel()}</span></div>
      <div class="field"><span>Dernière synchro</span><span class="muted">${time}</span></div>
      ${state.error ? html`<p class="note error">${state.error}</p>` : ''}`);
    if (['products', 'shopping', 'sync'].includes(what) && !ui.editName) renderProfile(); // « Foyer partagé avec Marie »
    if (what !== 'settings') return; // ne pas effacer un champ en cours de saisie
    if (!ui.editName) renderProfile();
    setHTML('#claude-key', s.claudeKey
      ? html`
        <div class="field"><span>Clé API</span><span class="muted">Enregistrée, finit par ${s.claudeKey.slice(-4)}</span></div>
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

function mainPage() {
  const s = state.settings;
  return html`
    <header class="top"><button class="back" data-action="open-stock">${I.chevron}Stock</button><div class="top-row"><h1>Réglages</h1></div>
      <div class="profile-card" id="profile-card"></div></header>
    <div class="settings-page">
      <h2 class="section">Apparence</h2>
      <section class="group">
        <div class="segmented theme-switch" id="theme-switch" role="group" aria-label="Thème"></div>
        <div class="field"><span class="label-stack">Animations<small>Plus douces si l'iPhone le demande</small></span><span class="value">Automatique</span></div>
      </section>

      <h2 class="section">Alertes de péremption</h2>
      <section class="group">
        <div class="field"><span>Prévenir</span>
          <div class="stepper">
            <button data-action="alert-minus" aria-label="Un jour de moins">−</button>
            <output id="alert-days">${alertText(s.alertDays)}</output>
            <button data-action="alert-plus" aria-label="Un jour de plus">+</button>
          </div>
        </div>
        <div id="badge-row"></div>
      </section>
      <p class="hint">Une app web ne peut pas envoyer de rappel une fois fermée : programmez « Vérifier le stock » chaque jour dans l'app Rappels.</p>

      <h2 class="section">Recettes et photos (Claude)</h2>
      <section class="group">
        <div id="claude-key"></div>
        <div class="field"><span class="label-stack">Recette légère<small>Maximum par portion (filtre « Léger »)</small></span>
          <div class="stepper">
            <button data-action="kcal-minus" aria-label="50 kcal de moins">−</button>
            <output id="kcal-max">${s.lightMaxKcal || 500} kcal</output>
            <button data-action="kcal-plus" aria-label="50 kcal de plus">+</button>
          </div>
        </div>
      </section>
      <p class="hint">La clé sert aux recettes, au ticket de caisse et à la reconnaissance en photo. Créez-la sur console.anthropic.com (quelques centimes par usage) ; elle reste sur cet iPhone.</p>

      <h2 class="section">Foyer partagé</h2>
      <section class="group"><div id="household"></div></section>

      <button class="group advanced-row" data-action="open-advanced">
        <span class="label-stack">Avancé<small>Modèle, synchronisation, à propos${state.error ? ' · erreur de synchronisation' : ''}</small></span>${I.chevron}
      </button>
    </div>`;
}

function advancedPage() {
  const s = state.settings;
  return html`
    <header class="top"><button class="back" data-action="close-advanced">${I.chevron}Réglages</button><div class="top-row"><h1>Avancé</h1></div></header>
    <div class="settings-page">
      <h2 class="section">Claude</h2>
      <section class="group">
        <label class="field"><span>Modèle Claude</span>
          <select id="model">${R.MODELS.map((m) => html`<option value="${m.id}" ${m.id === s.model ? raw('selected') : ''}>${m.label}</option>`)}</select>
        </label>
      </section>
      <h2 class="section">Synchronisation</h2>
      <section class="group">
        <div id="sync-details"></div>
        <button class="row-button" data-action="reconnect">${I.refresh}Se reconnecter</button>
      </section>
      <h2 class="section">À propos</h2>
      <section class="group">
        <div class="field"><span>Données produits</span><a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a></div>
        <p class="plain hint">Base collaborative sous licence ODbL.</p>
      </section>
    </div>`;
}

/** Profil dans le bandeau : l'initiale, le prénom et avec qui le foyer est partagé ; « Modifier » change le prénom. */
export function renderProfile() {
  const s = state.settings;
  const name = s.userName.trim();
  const partner = store.partnerName();
  const sub = !s.householdCode ? 'Aucun foyer' : partner ? `Foyer partagé avec ${partner}` : 'Invitez l\'autre iPhone dans « Foyer partagé »';
  setHTML('#profile-card', ui.editName
    ? html`
      <span class="avatar big" aria-hidden="true">${name.charAt(0).toUpperCase() || '?'}</span>
      <input data-setting="userName" id="name-input" value="${name}" placeholder="Votre prénom" autocomplete="given-name" enterkeyhint="done" aria-label="Votre prénom">
      <button class="head-pill" data-action="done-name">OK</button>`
    : html`
      <span class="avatar big" aria-hidden="true">${name.charAt(0).toUpperCase() || '?'}</span>
      <span class="profile-text"><b>${name || 'Sans prénom'}</b><small>${sub}</small></span>
      <button class="head-pill" data-action="edit-name" aria-label="Modifier le prénom">Modifier</button>`);
}

/** Clair, Sombre ou Automatique (comme l'iPhone) : choix propre à cet iPhone. */
function themeSwitch(theme = 'auto') {
  return [['light', 'Clair'], ['dark', 'Sombre'], ['auto', 'Automatique']].map(([id, label]) =>
    html`<button data-action="set-theme" data-value="${id}" aria-pressed="${String(theme === id)}">${label}</button>`);
}

function badgeRow() {
  if (!isStandalone() || !('setAppBadge' in navigator) || !('Notification' in window)) return '';
  if (Notification.permission === 'granted') {
    return html`<div class="field"><span>Pastille sur l'icône</span><span class="muted">activée</span></div>`;
  }
  if (Notification.permission === 'denied') {
    return html`<p class="plain hint">Pastille refusée : Réglages de l'iPhone > Notifications > Kookia.</p>`;
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
