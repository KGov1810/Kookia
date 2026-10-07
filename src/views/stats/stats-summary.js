// Kookia — Statistiques : résumé de la période, produits sans prix, produits les plus jetés.

import { html, raw } from '../../components/html.js';
import * as S from '../../services/index.js';

function wasteSentence(share) {
  if (share === null) return 'Rien n\'est encore sorti du stock avec un prix connu sur cette période.';
  if (share === 0) return 'Rien de jeté sur cette période.';
  const percent = Math.round(share * 100);
  return `${percent < 1 ? 'Moins de 1' : percent} % de ce qui est sorti du stock a été jeté.`;
}

/** Dépensé en grand, puis la sortie du stock : consommé et jeté, avec la barre de partage. */
export function summaryCard(summary) {
  const share = summary.wasteShare;
  const wastedWidth = share === null ? 0 : Math.max(share > 0 ? 2 : 0, Math.round(share * 1000) / 10);
  return html`
    <section class="stats-summary" aria-label="Résumé de la période">
      <p class="stats-spent"><span>Dépensé</span><strong>${S.formatEuro(summary.spent)}</strong></p>
      <div class="stats-split">
        <p class="stats-out consumed"><span>Consommé</span><b>${S.formatEuro(summary.consumed)}</b></p>
        <p class="stats-out wasted"><span>Jeté</span><b>${S.formatEuro(summary.wasted)}</b></p>
      </div>
      ${share === null ? '' : html`
        <div class="split-bar" aria-hidden="true">
          <i style="${raw(`width: ${100 - wastedWidth}%`)}"></i><i class="waste" style="${raw(`width: ${wastedWidth}%`)}"></i>
        </div>`}
      <p class="stats-share">${wasteSentence(share)}</p>
    </section>`;
}

/** Mouvements sans prix : ils ne sont pas comptés, on le dit. */
export function unpricedNote(summary) {
  const { achat, consomme, jete } = summary.unpriced;
  const parts = [
    achat ? S.plural(achat, 'achat') : '',
    consomme ? S.plural(consomme, 'consommation') : '',
    jete ? S.plural(jete, 'produit jeté', 'produits jetés') : ''
  ].filter(Boolean);
  if (!parts.length) return '';
  return html`<p class="hint">Sans prix, non comptés : ${parts.join(', ')}. Ajoutez le prix dans la fiche d'un produit, ou scannez vos tickets de caisse.</p>`;
}

export function wastedSection(movements) {
  const rows = S.topWasted(movements);
  if (!rows.length) return '';
  return html`
    <h2 class="section">Les plus jetés</h2>
    <section class="group">
      ${rows.map((row) => html`
        <div class="field waste-row">
          <span>${row.name}${row.count > 1 ? html` <small>×${row.count}</small>` : ''}</span>
          <b>${row.priced ? S.formatEuro(row.amount) : html`<small>prix inconnu</small>`}</b>
        </div>`)}
    </section>`;
}

export function emptyState(hasFilters) {
  if (hasFilters) {
    return html`
      <div class="empty small"><p>Rien pour ces filtres sur cette période.</p>
        <button class="secondary" data-action="stats-reset">Retirer les filtres</button></div>`;
  }
  return html`
    <div class="empty">
      <span class="emoji" aria-hidden="true">🧾</span>
      <h2>Pas encore de chiffres</h2>
      <p>Chaque produit ajouté, consommé ou jeté est noté à partir de maintenant, avec son prix s'il est connu.</p>
      <p>Le plus simple pour les prix : scannez vos tickets de caisse (bouton + de l'écran Stock).</p>
    </div>`;
}
