// Kookia — Statistiques : graphiques mois par mois et par catégorie (HTML et CSS, sans bibliothèque).

import { html, raw } from '../../components/html.js';
import * as R from '../../data/reference/index.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';

/** Largeur d'une barre en % (une petite valeur reste visible). */
function share(value, max) {
  if (!max || value <= 0) return 0;
  return Math.max(3, Math.round((value / max) * 1000) / 10);
}

function monthSentence(row) {
  return `${S.monthLabel(row.month, { long: true })} : ${S.formatEuro(row.spent)} dépensés et ${S.formatEuro(row.wasted)} jetés`;
}

/** Graduations « rondes » de l'axe : 0, 50, 100, 150 € pour un maximum de 129 €. */
function niceTicks(max) {
  if (max <= 0) return [0, 5, 10];
  const raw = max / 3;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((v) => v >= raw);
  const top = Math.ceil(max / step) * step;
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => Math.round(i * step * 100) / 100);
}

/**
 * Dépensé par mois : une seule série, le mois choisi en vert, les autres en gris. Toucher un mois affiche
 * ses montants (dépensé et jeté) ; « Tableau » donne les chiffres de chaque mois.
 */
export function monthSection(movements, allMovements) {
  if (ui.stats.period === 'mois') return '';
  const months = S.periodMonths(ui.stats.period, allMovements);
  const rows = S.monthlyTotals(movements, months);
  const ticks = niceTicks(Math.max(0, ...rows.map((r) => r.spent)));
  const top = ticks.at(-1);
  const picked = rows.find((r) => r.month === ui.stats.month) ?? rows.at(-1);
  const toggle = html`<button class="pill-btn" data-action="stats-table" aria-pressed="${String(ui.stats.table)}">${ui.stats.table ? 'Graphique' : 'Tableau'}</button>`;
  const chart = html`
    <div class="month-plot">
      ${ticks.map((t) => html`<span class="month-tick" style="${raw(`bottom: calc(26px + ${(t / top) * 100} * (100% - 26px) / 100)`)}" aria-hidden="true"><i>${t ? `${String(t).replace('.', ',')} €` : '0'}</i></span>`)}
      <div class="month-chart" role="group" aria-label="Dépensé par mois">
        ${rows.map((row) => html`
          <button class="month-col" data-action="stats-month" data-value="${row.month}" aria-pressed="${String(row === picked)}" aria-label="${monthSentence(row)}">
            <span class="bars" aria-hidden="true"><i class="spent" style="${raw(`height: ${row.spent > 0 ? Math.max(2, (row.spent / top) * 100) : 0}%`)}"></i></span>
            <small>${S.monthLabel(row.month, { narrow: rows.length > 6 })}</small>
          </button>`)}
      </div>
    </div>`;
  const table = html`
    <table class="month-table">
      <thead><tr><th scope="col">Mois</th><th scope="col">Dépensé</th><th scope="col">Jeté</th></tr></thead>
      <tbody>${[...rows].reverse().map((row) => html`<tr><th scope="row">${S.monthLabel(row.month, { long: true })}</th><td>${S.formatEuro(row.spent)}</td><td>${S.formatEuro(row.wasted)}</td></tr>`)}</tbody>
    </table>`;
  return html`
    <div class="section-row"><h2 class="section">Dépensé par mois</h2>${toggle}</div>
    <section class="group stats-months">
      ${ui.stats.table ? table : html`<p class="month-detail" aria-live="polite">${monthSentence(picked)}.</p>${chart}`}
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
