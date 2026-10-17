// Kookia — Statistiques : sorti du stock sur la période, produits sans prix, produits les plus jetés.

import { html, raw } from '../../components/html.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';

function wasteSentence(share) {
  if (share === null) return t('out.noPrice');
  if (share === 0) return t('out.noWaste');
  const percent = Math.round(share * 100);
  return t('out.share', { percent: percent < 1 ? t('out.lessThan1') : percent });
}

/** « sur 12 mois », « ce mois-ci », « depuis le début » : la période choisie, en clair. */
export function periodPhrase(period) {
  return ['mois', '3mois', '12mois', 'tout'].includes(period) ? t(`phrase.${period}`) : '';
}

/** Sorti du stock : la barre consommé / jeté, la légende avec les montants, la part jetée. */
export function summaryCard(summary, period) {
  const share = summary.wasteShare;
  const wastedWidth = share === null ? 0 : Math.max(share > 0 ? 2 : 0, Math.round(share * 1000) / 10);
  return html`
    <section class="stats-summary" aria-label="${t('out.title', { period: periodPhrase(period) })}">
      <h2>${t('out.title', { period: periodPhrase(period) })}</h2>
      ${share === null ? '' : html`
        <div class="split-bar" aria-hidden="true">
          ${wastedWidth < 100 ? html`<i style="${raw(`width: ${100 - wastedWidth}%`)}"></i>` : ''}${wastedWidth > 0 ? html`<i class="waste" style="${raw(`width: ${wastedWidth}%`)}"></i>` : ''}
        </div>`}
      <div class="stats-split">
        <p class="stats-out consumed"><i class="swatch" aria-hidden="true"></i><span>${t('out.consumed')}</span><b>${S.formatEuro(summary.consumed)}</b></p>
        <p class="stats-out wasted"><i class="swatch" aria-hidden="true"></i><span>${t('out.wasted')}</span><b>${S.formatEuro(summary.wasted)}</b></p>
      </div>
      <p class="stats-share">${wasteSentence(share)}</p>
    </section>`;
}

/** Mouvements sans prix : ils ne sont pas comptés, on le dit. */
export function unpricedNote(summary) {
  const { achat, consomme, jete } = summary.unpriced;
  const parts = [
    achat ? t('unpriced.purchases', { n: achat }) : '',
    consomme ? t('unpriced.consumed', { n: consomme }) : '',
    jete ? t('unpriced.wasted', { n: jete }) : ''
  ].filter(Boolean);
  if (!parts.length) return '';
  return html`<p class="hint">${t('unpriced.note', { list: parts.join(', ') })}</p>`;
}

export function wastedSection(movements) {
  const rows = S.topWasted(movements);
  if (!rows.length) return '';
  return html`
    <h2 class="section">${t('wasted.title')}</h2>
    <section class="group">
      ${rows.map((row) => html`
        <div class="field waste-row">
          <span>${row.name}${row.count !== 1 ? html` <small>×${(Math.round(row.count * 100) / 100).toLocaleString(S.localeTag())}</small>` : ''}</span>
          <b>${row.priced ? S.formatEuro(row.amount) : html`<small>${t('wasted.unknown')}</small>`}</b>
        </div>`)}
    </section>`;
}

export function emptyState(hasFilters) {
  if (hasFilters) {
    return html`
      <div class="empty small"><p>${t('stats.noMatch')}</p>
        <button class="secondary" data-action="stats-reset">${t('stats.reset')}</button></div>`;
  }
  return html`
    <div class="empty">
      <span class="emoji" aria-hidden="true">🧾</span>
      <h2>${t('stats.emptyTitle')}</h2>
      <p>${t('stats.emptyText')}</p>
      <p>${t('stats.emptyTip')}</p>
    </div>`;
}
