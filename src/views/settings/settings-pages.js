// Kookia — Réglages : la page principale et les sous-pages « Ordre des rayons » et « Avancé » (structure ; les
// contenus vivants sont remplis par settings-view.js).

import { html, raw } from '../../components/html.js';
import { stepper } from '../../components/stepper.js';
import { I } from '../../components/icons.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
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
        <div class="field"><span>${t('settings.warn')}</span>${stepper({ actions: ['alert-minus', 'alert-plus'], id: 'alert-days', value: alertText(s.alertDays), labels: [t('settings.dayLess'), t('settings.dayMore')] })}</div>
        <div id="badge-row"></div>
      </section>
      <p class="hint">${t('settings.remindersHint')}</p>

      <h2 class="section">${t('settings.shopping')}</h2>
      <button class="group advanced-row aisles-row" data-action="open-aisles">
        <span class="label-stack">${t('settings.aisles')}<small>${t(S.isDefaultAisleOrder(state.aisleOrder) ? 'settings.aislesTypical' : 'settings.aislesCustom')}</small></span>${I.chevron}
      </button>

      <h2 class="section">${t('settings.claude')}</h2>
      <section class="group">
        <div id="claude-key"></div>
        <div class="field"><span class="label-stack">${t('settings.light.recipe')}<small>${t('settings.light.hint')}</small></span>
          ${stepper({ actions: ['kcal-minus', 'kcal-plus'], id: 'kcal-max', value: `${s.lightMaxKcal || 500} kcal`, labels: [t('settings.kcalLess'), t('settings.kcalMore')] })}
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

/** Rayons dans l'ordre du foyer, chacun avec « monter » et « descendre ». */
export function aisleRows() {
  const order = store.aisleOrder();
  return order.map((id, i) => {
    const name = t(`aisle.${id}`);
    const aisle = R.AISLES.find((a) => a.id === id);
    return html`
      <div class="field aisle-row"><span><span aria-hidden="true">${aisle.emoji}</span> ${name}</span>
        <span class="aisle-moves">
          <button class="aisle-up" data-action="aisle-up" data-id="${id}" aria-label="${t('settings.aisleUp', { name })}" ${i === 0 ? raw('disabled') : ''}>${I.chevron}</button>
          <button class="aisle-down" data-action="aisle-down" data-id="${id}" aria-label="${t('settings.aisleDown', { name })}" ${i === order.length - 1 ? raw('disabled') : ''}>${I.chevron}</button>
        </span>
      </div>`;
  });
}

export function aislesPage() {
  return html`
    <header class="top"><button class="back" data-action="close-advanced">${I.chevron}${t('settings.title')}</button><div class="top-row"><h1>${t('settings.aisles')}</h1></div></header>
    <div class="settings-page">
      <p class="hint aisles-hint">${t('settings.aislesHint')}</p>
      <section class="group" id="aisle-order">${aisleRows()}</section>
      <section class="group"><button class="row-button" data-action="aisles-reset" ${S.isDefaultAisleOrder(state.aisleOrder) ? raw('disabled') : ''}>${I.refresh}${t('settings.aislesReset')}</button></section>
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
