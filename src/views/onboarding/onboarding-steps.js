// Kookia — Étapes de l'accueil.

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import * as store from '../../data/store/index.js';
import { state } from '../../data/store/state.js';
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
      <p>Tout ce qu'il y a à manger à la maison, partagé à deux : frigo, congélateur, placard, fruits et légumes. Moins d'oublis, moins de gaspillage, et des recettes avec ce que vous avez.</p>
    </div>
    <h2 class="section">Installez d'abord l'app</h2>
    <ol class="steps-install">
      <li><span>Touchez <strong>Partager</strong> <span class="inline-icon">${I.share}</span> dans la barre de Safari.</span></li>
      <li><span>Choisissez <strong>Sur l'écran d'accueil</strong>, puis <strong>Ajouter</strong>.</span></li>
      <li><span>Ouvrez <strong>Kookia</strong> depuis l'écran d'accueil pour continuer.</span></li>
    </ol>
    <p class="hint">L'app installée garde ses propres données : faites la configuration depuis l'écran d'accueil, pas dans Safari.</p>
    <button class="link" data-action="dismiss-install">Continuer dans Safari quand même</button>`,

  connect: () => html`
    <header class="top"><h1>Connexion</h1></header>
    <p class="hint">Le partage entre les deux iPhone passe par votre base Firebase gratuite.</p>
    <section class="group">
      <label class="field stack">
        <span><strong>Second iPhone</strong> : collez le code d'invitation reçu.<br><strong>Premier iPhone</strong> : collez la configuration Firebase (README, étape 1).</span>
        <textarea id="connect-text" placeholder="FRIGO1.… ou const firebaseConfig = { … }" autocapitalize="off" autocorrect="off" spellcheck="false">${ui.onboarding.text}</textarea>
      </label>
    </section>
    ${obMessage()}
    <button class="primary" data-action="connect">Continuer</button>`,

  household: () => {
    const o = ui.onboarding;
    return html`
      <header class="top"><h1>Votre foyer</h1></header>
      <section class="group">
        <label class="field"><span>Votre prénom</span><input id="ob-name" value="${o.name || state.settings.userName}" placeholder="Prénom" autocomplete="given-name"></label>
      </section>
      ${o.invite
        ? html`
          <p class="note ok">Invitation reconnue. Touchez « Rejoindre » pour retrouver le stock partagé du foyer.</p>
          <button class="primary" data-action="join" ${o.busy ? raw('disabled') : ''}>${o.busy ? html`<span class="spinner"></span>Connexion…` : 'Rejoindre le foyer'}</button>`
        : html`
          <h2 class="section">Premier iPhone</h2>
          <button class="primary" data-action="create" ${o.busy ? raw('disabled') : ''}>${o.busy ? html`<span class="spinner"></span>Connexion…` : html`${I.plus}Créer un foyer`}</button>
          <h2 class="section">Second iPhone</h2>
          <section class="group">
            <label class="field stack"><span>Code d'invitation reçu</span>
              <textarea id="join-text" placeholder="FRIGO1.…" autocapitalize="off" autocorrect="off" spellcheck="false">${o.joinText}</textarea>
            </label>
          </section>
          <button class="secondary" data-action="join" ${o.busy ? raw('disabled') : ''}>Rejoindre le foyer</button>`}
      ${obMessage()}`;
  },

  created: () => html`
    <div class="welcome">
      <div class="emoji" aria-hidden="true">🎉</div>
      <h1>Foyer créé</h1>
      <p>Sur le second iPhone, installez l'app puis collez ce code d'invitation.</p>
    </div>
    <div class="code-box long">${store.invitationCode()}</div>
    <div class="row-actions inline">
      <button class="secondary" data-action="share-invite">${I.share}Envoyer</button>
      <button class="secondary" data-action="copy-invite">${I.copy}Copier</button>
    </div>
    <p class="hint">Code du foyer : ${state.settings.householdCode}. L'invitation reste disponible dans Réglages > Foyer partagé.</p>
    <button class="primary" data-action="start">Commencer</button>`
};
