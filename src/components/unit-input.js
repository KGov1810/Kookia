// Kookia — Champ « chiffre + unité » : le chiffre au clavier numérique, l'unité d'un toucher (g | kg | cl | L).

import { t } from '../services/i18n/i18n.js';
import { fmt, html, raw } from './html.js';

/** Attributs data-* (échappés), communs au champ et aux boutons pour retrouver la ligne concernée. */
function dataAttrs(dataset) {
  return raw(Object.entries(dataset).map(([key, value]) => ` data-${key}="${fmt(value)}"`).join(''));
}

/**
 * amount : chiffre tapé ; unit : unité en surbrillance (null : aucune, pour un ancien texte libre) ;
 * dataset : data-* du champ et des boutons ; inputData : data-* du champ seul ; name : attribut name du champ.
 */
export function unitInput({ amount = '', unit = null, units, dataset = {}, inputData = {}, name = '', label, placeholder = '' }) {
  return html`
    <span class="unit-input">
      <input${name ? raw(` name="${fmt(name)}"`) : ''}${dataAttrs({ ...dataset, ...inputData })} value="${amount}" inputmode="decimal" placeholder="${placeholder}" autocomplete="off" enterkeyhint="done" aria-label="${label}">
      <span class="unit-toggle" role="group" aria-label="${t('common.unit')}">
        ${units.map((u) => html`<button type="button" data-action="set-unit"${dataAttrs(dataset)} data-unit="${u}" aria-pressed="${String(u === unit)}">${u}</button>`)}
      </span>
    </span>`;
}

/** Met l'unité choisie en surbrillance sans tout redessiner (le clavier resterait ouvert). */
export function markUnit(container, unit) {
  container?.querySelectorAll('[data-action="set-unit"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.unit === unit)));
}
