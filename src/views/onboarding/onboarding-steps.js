// Kookia — Étapes de l'accueil.

import { fmt, html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
import { t } from '../../services/i18n/i18n.js';
import { ui } from '../app/ui-state.js';

function obMessage() {
  const m = ui.onboarding.message;
  return m ? html`<p class="note ${m.kind}">${m.text}</p>` : '';
}

export const ONBOARDING = {
  install: () => html`
    <div class="welcome">
      <img src="icon-180.png" alt="">
      <h1>Kookia</h1>
      <p>${t('ob.pitch')}</p>
    </div>
    <h2 class="section">${t('ob.installTitle')}</h2>
    <ol class="steps-install">
      <li><span>${raw(t('ob.install1', { icon: `<span class="inline-icon">${fmt(I.share)}</span>` }))}</span></li>
      <li><span>${raw(t('ob.install2'))}</span></li>
      <li><span>${raw(t('ob.install3'))}</span></li>
    </ol>
    <p class="hint">${t('ob.installHint')}</p>
    <button class="link" data-action="dismiss-install">${t('ob.inSafari')}</button>`,

  connect: () => html`
    <header class="top"><h1>${t('ob.connectTitle')}</h1></header>
    <p class="hint">${t('ob.connectHint')}</p>
    <section class="group">
      <label class="field stack">
        <span>${raw(t('ob.connectLabel'))}</span>
        <textarea id="connect-text" placeholder="FRIGO1.… ou const firebaseConfig = { … }" autocapitalize="off" autocorrect="off" spellcheck="false">${ui.onboarding.text}</textarea>
      </label>
    </section>
    ${obMessage()}
    <button class="primary" data-action="connect">${t('ob.continue')}</button>`,

  household: () => {
    const o = ui.onboarding;
    return html`
      <header class="top"><h1>${t('ob.householdTitle')}</h1></header>
      <section class="group">
        <label class="field"><span>${t('ob.firstName')}</span><input id="ob-name" value="${o.name || state.settings.userName}" placeholder="${t('ob.firstNamePlaceholder')}" autocomplete="given-name"></label>
      </section>
      ${o.invite
        ? html`
          <p class="note ok">${t('ob.inviteFound')}</p>
          <button class="primary" data-action="join" ${o.busy ? raw('disabled') : ''}>${o.busy ? html`<span class="spinner"></span>${t('ob.connecting')}` : t('ob.join')}</button>`
        : html`
          <h2 class="section">${t('ob.first')}</h2>
          <button class="primary" data-action="create" ${o.busy ? raw('disabled') : ''}>${o.busy ? html`<span class="spinner"></span>${t('ob.connecting')}` : html`${I.plus}${t('ob.create')}`}</button>
          <h2 class="section">${t('ob.second')}</h2>
          <section class="group">
            <label class="field stack"><span>${t('ob.codeReceived')}</span>
              <textarea id="join-text" placeholder="FRIGO1.…" autocapitalize="off" autocorrect="off" spellcheck="false">${o.joinText}</textarea>
            </label>
          </section>
          <button class="secondary" data-action="join" ${o.busy ? raw('disabled') : ''}>${t('ob.join')}</button>`}
      ${obMessage()}`;
  },

  created: () => html`
    <div class="welcome">
      <div class="emoji" aria-hidden="true">🎉</div>
      <h1>${t('ob.createdTitle')}</h1>
      <p>${t('ob.createdText')}</p>
    </div>
    <div class="code-box long">${store.invitationCode()}</div>
    <div class="row-actions inline">
      <button class="secondary" data-action="share-invite">${I.share}${t('ob.send')}</button>
      <button class="secondary" data-action="copy-invite">${I.copy}${t('ob.copy')}</button>
    </div>
    <p class="hint">${t('ob.codeHint', { code: state.settings.householdCode })}</p>
    <button class="primary" data-action="start">${t('ob.start')}</button>`
};
