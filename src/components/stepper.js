// Kookia — Boutons « − valeur + » (nombre d'unités, portions, personnes, jours…).

import { dataAttrs, fmt, html, raw } from './html.js';

/**
 * actions : [moins, plus] (data-action des boutons) ; labels : [moins, plus] (lus par VoiceOver) ;
 * canLess / canMore : faux à la limite (bouton grisé) ; data : data-* des deux boutons (la ligne concernée) ;
 * id : de la valeur ; live : valeur annoncée quand elle change ; small : version compacte (listes).
 */
export function stepper({ actions: [minus, plus], value, labels: [less, more], canLess = true, canMore = true, data = {}, id = '', live = false, small = false }) {
  const disabled = (enabled) => (enabled ? '' : raw(' disabled'));
  return html`
    <div class="stepper${small ? ' small' : ''}">
      <button data-action="${minus}"${dataAttrs(data)} aria-label="${less}"${disabled(canLess)}>−</button>
      <output${id ? raw(` id="${fmt(id)}"`) : ''}${live ? raw(' aria-live="polite"') : ''}>${value}</output>
      <button data-action="${plus}"${dataAttrs(data)} aria-label="${more}"${disabled(canMore)}>+</button>
    </div>`;
}
