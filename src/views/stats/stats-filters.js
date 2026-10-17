// Kookia — Statistiques : période et filtres (produits, lieu, personne).

import { html, raw } from '../../components/html.js';
import * as R from '../../data/reference/index.js';
import { t } from '../../services/i18n/i18n.js';
import * as S from '../../services/index.js';
import { ui } from '../app/ui-state.js';

export function periodPicker() {
  return S.STATS_PERIODS.map((period) => html`<button data-action="stats-period" data-value="${period.id}" aria-pressed="${String(ui.stats.period === period.id)}">${t(`period.${period.id}`)}</button>`);
}

function option(value, label, current) {
  return html`<option value="${value}" ${value === current ? raw('selected') : ''}>${label}</option>`;
}

/** Rayons et catégories présents dans les mouvements (plus le choix en cours, s'il n'y est plus). */
function whatOptions(movements) {
  const current = ui.stats.what;
  const present = new Set(movements.map((m) => R.category(m.category).id));
  if (current.startsWith('cat:')) present.add(current.slice(4));
  const groups = R.CATEGORY_GROUPS.filter((g) => R.CATEGORIES.some((c) => c.group === g && present.has(c.id)) || current === `rayon:${g}`);
  return html`
    ${option('', t('sfilter.allProducts'), current)}
    <optgroup label="${t('sfilter.aisles')}">${groups.map((g) => option(`rayon:${g}`, t('sfilter.aisle', { name: S.groupName(g) }), current))}</optgroup>
    ${groups.map((g) => html`<optgroup label="${S.groupName(g)}">${R.CATEGORIES
      .filter((c) => c.group === g && present.has(c.id))
      .map((c) => option(`cat:${c.id}`, `${c.emoji} ${S.categoryName(c.id)}`, current))}</optgroup>`)}`;
}

/** Filtres en pastilles sur une ligne (listes de choix d'iOS) ; une pastille utilisée est mise en avant. */
export function filterFields(movements) {
  const people = S.peopleIn(movements);
  if (ui.stats.person && !people.includes(ui.stats.person)) people.push(ui.stats.person);
  const { what, location, person } = ui.stats;
  return html`
    <div class="chips stats-filters" role="group" aria-label="${t('sfilter.aria')}">
      <select class="filter-select" data-stats-filter="what" data-active="${String(Boolean(what))}" aria-label="${t('sfilter.products')}">${whatOptions(movements)}</select>
      <select class="filter-select" data-stats-filter="location" data-active="${String(Boolean(location))}" aria-label="${t('sfilter.place')}">
        ${option('', t('sfilter.allPlaces'), location)}${R.LOCATIONS.map((loc) => option(loc.id, S.placeName(loc.id), location))}
      </select>
      ${people.length > 1 ? html`<select class="filter-select" data-stats-filter="person" data-active="${String(Boolean(person))}" aria-label="${t('sfilter.person')}">
        ${option('', t('sfilter.everyone'), person)}${people.map((name) => option(name, name, person))}
      </select>` : ''}
      ${what || location || person ? html`<button class="chip" data-action="stats-reset">${t('stats.reset')}</button>` : ''}
    </div>`;
}
