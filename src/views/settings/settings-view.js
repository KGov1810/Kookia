// Kookia — Écran Réglages : les contenus vivants (profil, thème, clé Claude, foyer, synchronisation).

import { html, setHTML } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { isStandalone } from '../../components/platform.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';
import { advancedPage, alertText, mainPage } from './settings-pages.js';

const t = S.t;

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
    const time = state.lastSync ? state.lastSync.toLocaleTimeString(S.localeTag(), { hour: '2-digit', minute: '2-digit' }) : '—';
    setHTML('#sync-details', html`
      <div class="field"><span>${t('settings.syncState')}</span><span class="muted">${store.syncLabel()}</span></div>
      <div class="field"><span>${t('settings.lastSync')}</span><span class="muted">${time}</span></div>
      ${state.error ? html`<p class="note error">${state.error}</p>` : ''}`);
    if (['products', 'shopping', 'sync'].includes(what) && !ui.editName) renderProfile(); // « Foyer partagé avec Marie »
    if (what !== 'settings') return; // ne pas effacer un champ en cours de saisie
    if (!ui.editName) renderProfile();
    setHTML('#claude-key', s.claudeKey
      ? html`
        <div class="field"><span>${t('settings.apiKey')}</span><span class="muted">${t('settings.keySaved', { last: s.claudeKey.slice(-4) })}</span></div>
        <button class="row-button danger" data-action="delete-key">${I.trash}${t('settings.keyDelete')}</button>`
      : html`
        <label class="field stack"><span>${t('settings.apiKey')}</span><input id="key-input" type="password" placeholder="sk-ant-…" autocomplete="off" autocapitalize="off" spellcheck="false"></label>
        <div class="row-actions"><button class="secondary" data-action="save-key">${t('settings.keySave')}</button></div>`);
    setHTML('#household', s.householdCode
      ? html`
        <div class="field"><span>${t('settings.householdCode')}</span><strong>${s.householdCode}</strong></div>
        <button class="row-button" data-action="share-invite">${I.share}${t('settings.invite')}</button>
        <button class="row-button" data-action="copy-invite">${I.copy}${t('settings.copyInvite')}</button>
        <button class="row-button danger" data-action="leave">${t('settings.leave')}</button>`
      : html`<p class="plain hint">${t('settings.noHousehold')}</p>`);
  }
};

/** Profil dans le bandeau : l'initiale, le prénom et avec qui le foyer est partagé ; « Modifier » change le prénom. */
export function renderProfile() {
  const s = state.settings;
  const name = s.userName.trim();
  const partner = store.partnerName();
  const sub = !s.householdCode ? t('sync.noHousehold') : partner ? t('settings.sharedWith', { name: partner }) : t('settings.inviteHint');
  setHTML('#profile-card', ui.editName
    ? html`
      <span class="avatar big" aria-hidden="true">${name.charAt(0).toUpperCase() || '?'}</span>
      <input data-setting="userName" id="name-input" value="${name}" placeholder="${t('settings.yourName')}" autocomplete="given-name" enterkeyhint="done" aria-label="${t('settings.yourName')}">
      <button class="head-pill" data-action="done-name">${t('common.ok')}</button>`
    : html`
      <span class="avatar big" aria-hidden="true">${name.charAt(0).toUpperCase() || '?'}</span>
      <span class="profile-text"><b>${name || t('settings.noName')}</b><small>${sub}</small></span>
      <button class="head-pill" data-action="edit-name" aria-label="${t('settings.editName')}">${t('common.edit')}</button>`);
}

/** Clair, Sombre ou Automatique (comme l'iPhone) : choix propre à cet iPhone. */
function themeSwitch(theme = 'auto') {
  return [['light', 'settings.light'], ['dark', 'settings.dark'], ['auto', 'settings.auto']].map(([id, key]) =>
    html`<button data-action="set-theme" data-value="${id}" aria-pressed="${String(theme === id)}">${t(key)}</button>`);
}

function badgeRow() {
  if (!isStandalone() || !('setAppBadge' in navigator) || !('Notification' in window)) return '';
  if (Notification.permission === 'granted') {
    return html`<div class="field"><span>${t('settings.badge')}</span><span class="muted">${t('settings.badgeOn')}</span></div>`;
  }
  if (Notification.permission === 'denied') {
    return html`<p class="plain hint">${t('settings.badgeDenied')}</p>`;
  }
  return html`<button class="row-button" data-action="enable-badge">${I.bell}${t('settings.badgeEnable')}</button>`;
}

export function inviteMessage() {
  const url = location.origin + location.pathname;
  return [t('invite.title'), t('invite.step1', { url }), t('invite.step2'), t('invite.step3'), '', store.invitationCode()].join('\n');
}
