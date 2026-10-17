// Kookia — Réglages : la page principale et la sous-page « Avancé » (structure ; les contenus vivants sont
// remplis par settings-view.js).

import { html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import * as R from '../../data/reference/index.js';
import { state } from '../../data/store/state.js';
import * as S from '../../services/index.js';

const t = S.t;

export function alertText(days) {
  return days === 0 ? t('settings.sameDay') : t('settings.daysBefore', { n: days });
}

/** Langue : comme l'iPhone (par défaut) ou une des quatre langues, écrites dans leur propre langue. */
function languageField() {
  const choice = state.settings.language || '';
  const auto = R.LANGUAGES.find((l) => l.id === S.detectLanguage())?.label ?? 'Français';
  return html`
    <label class="field"><span>${t('settings.language')}</span>
      <select id="language" aria-label="${t('settings.language')}">
        <option value="" ${choice ? '' : raw('selected')}>${t('settings.languageAuto', { lang: auto })}</option>
        ${R.LANGUAGES.map((l) => html`<option value="${l.id}" lang="${l.id}" ${choice === l.id ? raw('selected') : ''}>${l.label}</option>`)}
      </select>
    </label>`;
}

function stepper(minus, plus, id, value, [lessLabel, moreLabel]) {
  return html`
    <div class="stepper">
      <button data-action="${minus}" aria-label="${lessLabel}">−</button>
      <output id="${id}">${value}</output>
      <button data-action="${plus}" aria-label="${moreLabel}">+</button>
    </div>`;
}

export function mainPage() {
  const s = state.settings;
  return html`
    <header class="top"><button class="back" data-action="open-stock">${I.chevron}${t('tab.stock')}</button><div class="top-row"><h1>${t('settings.title')}</h1></div>
      <div class="profile-card" id="profile-card"></div></header>
    <div class="settings-page">
      <h2 class="section">${t('settings.appearance')}</h2>
      <section class="group">
        <div class="segmented theme-switch" id="theme-switch" role="group" aria-label="${t('settings.themeLabel')}"></div>
        ${languageField()}
        <div class="field"><span class="label-stack">${t('settings.animations')}<small>${t('settings.animationsHint')}</small></span><span class="value">${t('settings.auto')}</span></div>
      </section>

      <h2 class="section">${t('settings.alerts')}</h2>
      <section class="group">
        <div class="field"><span>${t('settings.warn')}</span>${stepper('alert-minus', 'alert-plus', 'alert-days', alertText(s.alertDays), [t('settings.dayLess'), t('settings.dayMore')])}</div>
        <div id="badge-row"></div>
      </section>
      <p class="hint">${t('settings.remindersHint')}</p>

      <h2 class="section">${t('settings.claude')}</h2>
      <section class="group">
        <div id="claude-key"></div>
        <div class="field"><span class="label-stack">${t('settings.light.recipe')}<small>${t('settings.light.hint')}</small></span>
          ${stepper('kcal-minus', 'kcal-plus', 'kcal-max', `${s.lightMaxKcal || 500} kcal`, [t('settings.kcalLess'), t('settings.kcalMore')])}
        </div>
      </section>
      <p class="hint">${t('settings.keyHint')}</p>

      <h2 class="section">${t('settings.household')}</h2>
      <section class="group"><div id="household"></div></section>

      <button class="group advanced-row" data-action="open-advanced">
        <span class="label-stack">${t('settings.advanced')}<small>${t('settings.advancedHint')}${state.error ? t('settings.advancedError') : ''}</small></span>${I.chevron}
      </button>
    </div>`;
}

export function advancedPage() {
  const s = state.settings;
  return html`
    <header class="top"><button class="back" data-action="close-advanced">${I.chevron}${t('settings.title')}</button><div class="top-row"><h1>${t('settings.advanced')}</h1></div></header>
    <div class="settings-page">
      <h2 class="section">Claude</h2>
      <section class="group">
        <label class="field"><span>${t('settings.model')}</span>
          <select id="model">${R.MODELS.map((m) => html`<option value="${m.id}" ${m.id === s.model ? raw('selected') : ''}>${m.name} (${t(m.note)})</option>`)}</select>
        </label>
      </section>
      <h2 class="section">${t('settings.sync')}</h2>
      <section class="group">
        <div id="sync-details"></div>
        <button class="row-button" data-action="reconnect">${I.refresh}${t('settings.reconnect')}</button>
      </section>
      <h2 class="section">${t('settings.about')}</h2>
      <section class="group">
        <div class="field"><span>${t('settings.productData')}</span><a href="https://world.openfoodfacts.org" target="_blank" rel="noopener">Open Food Facts</a></div>
        <p class="plain hint">${t('settings.odbl')}</p>
      </section>
    </div>`;
}
