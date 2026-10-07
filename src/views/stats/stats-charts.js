// Kookia — Statistiques : graphiques mois par mois et par catégorie (HTML et CSS, sans bibliothèque).

import { html, raw } from '../../components/html.js';
import * as R from '../../data/reference/index.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';

/** Hauteur ou largeur d'une barre en % (une petite valeur reste visible). */
function share(value, max) {
  if (!max || value <= 0) return 0;
  return Math.max(3, Math.round((value / max) * 1000) / 10);
}

function monthSentence(row) {
  return `${S.monthLabel(row.month, { long: true })} : ${S.formatEuro(row.spent)} dépensés et ${S.formatEuro(row.wasted)} jetés`;
}

/** Barres par mois : dépensé (vert) et jeté (rouge). Toucher un mois affiche ses montants. */
export function monthSection(movements, allMovements) {
  if (ui.stats.period === 'mois') return '';
  const months = S.periodMonths(ui.stats.period, allMovements);
  const rows = S.monthlyTotals(movements, months);
  const max = Math.max(0, ...rows.map((r) => Math.max(r.spent, r.wasted)));
  const picked = rows.find((r) => r.month === ui.stats.month) ?? rows.at(-1);
  return html`
    <h2 class="section">Mois par mois</h2>
    <section class="group stats-months">
      <div class="month-chart" role="group" aria-label="Dépensé et jeté par mois">
        ${rows.map((row) => html`
          <button class="month-col" data-action="stats-month" data-value="${row.month}" aria-pressed="${String(row === picked)}" aria-label="${monthSentence(row)}">
            <span class="bars" aria-hidden="true">
              <i class="spent" style="${raw(`height: ${share(row.spent, max)}%`)}"></i><i class="waste" style="${raw(`height: ${share(row.wasted, max)}%`)}"></i>
            </span>
            <small>${S.monthLabel(row.month, { narrow: rows.length > 6 })}</small>
          </button>`)}
      </div>
      <p class="month-detail">${monthSentence(picked)}.</p>
      <p class="stats-legend" aria-hidden="true"><span class="spent">Dépensé</span><span class="waste">Jeté</span></p>
    </section>`;
}

/** Dépenses par catégorie, de la plus grosse à la plus petite. Toucher une ligne filtre sur la catégorie. */
export function categorySection(movements) {
  const rows = S.categoryTotals(movements);
  if (!rows.length) return '';
  const max = Math.max(...rows.map((r) => r.spent));
  return html`
    <h2 class="section">Dépenses par catégorie</h2>
    <section class="group stats-categories">
      ${rows.map((row) => {
        const cat = R.category(row.category);
        return html`
          <button class="cat-row" data-action="stats-category" data-value="cat:${cat.id}" aria-label="${cat.label} : ${S.formatEuro(row.spent)} dépensés${row.wasted ? `, ${S.formatEuro(row.wasted)} jetés` : ''}. Filtrer sur cette catégorie">
            <span class="cat-head"><span>${cat.emoji} ${cat.label}</span><b>${S.formatEuro(row.spent)}</b></span>
            <span class="cat-bar" aria-hidden="true"><i style="${raw(`width: ${share(row.spent, max)}%`)}"></i></span>
            ${row.wasted ? html`<small class="cat-waste">Jeté : ${S.formatEuro(row.wasted)}</small>` : ''}
          </button>`;
      })}
    </section>`;
}
