// Kookia — Fruits et légumes sans code-barres.

import { fmt, html, raw } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { openSheet } from '../../components/sheet.js';
import { toast } from '../../components/toast.js';
import * as R from '../../data/reference/index.js';
import * as store from '../../data/store/index.js';
import * as S from '../../services/index.js';
import { simplify } from '../../services/text/text.js';

/** Grille de fruits et légumes courants : chaque toucher ajoute 1 ; lieu et date estimée automatiques. */
export function openProduceSheet() {
  const picked = new Map(); // nom → { item, count }
  let query = '';

  const sheet = openSheet({
    tall: true,
    render,
    actions: {
      add: (el) => {
        const item = R.PRODUCE.find((x) => x.name === el.dataset.name)
          ?? { name: el.dataset.name, emoji: '🥬', place: 'fruits', days: S.estimateFreshDays(el.dataset.name, 'fruits') };
        const entry = picked.get(item.name) ?? { item, count: 0 };
        entry.count = Math.min(99, entry.count + 1);
        picked.set(item.name, entry);
        sheet.update();
      },
      minus: (el) => {
        const entry = picked.get(el.dataset.name);
        if (!entry) return;
        entry.count -= 1;
        if (entry.count <= 0) picked.delete(el.dataset.name);
        sheet.update();
      },
      plus: (el) => {
        const entry = picked.get(el.dataset.name);
        if (entry) entry.count = Math.min(99, entry.count + 1);
        sheet.update();
      },
      confirm: () => {
        const entries = [...picked.values()];
        if (!entries.length) return;
        entries.forEach(({ item, count }) => store.saveProduct({
          id: crypto.randomUUID(),
          name: item.name,
          category: item.type ?? S.guessCategory(item.name) ?? 'legumes',
          quantity: '',
          count,
          location: item.place,
          dateKind: 'estimee',
          expiry: S.isoInDays(item.days),
          frozenAt: ''
        }));
        sheet.close();
        toast(`${S.plural(entries.length, 'produit ajouté', 'produits ajoutés')} (dates estimées)`);
      }
    },
    onInput: (event) => {
      if (event.target.name !== 'produce-search') return;
      query = event.target.value;
      const results = sheet.panel.querySelector('#produce-results');
      if (results) results.innerHTML = fmt(grid());
    }
  });

  function grid() {
    const q = simplify(query.trim());
    const items = R.PRODUCE.filter((x) => !q || simplify(x.name).includes(q));
    const custom = q && !R.PRODUCE.some((x) => simplify(x.name) === q)
      ? html`<button class="produce-chip custom" data-action="add" data-name="${query.trim()}">${I.plus}Ajouter « ${query.trim()} »</button>` : '';
    return html`${items.map((x) => html`<button class="produce-chip" data-action="add" data-name="${x.name}" aria-label="Ajouter ${x.name}"><span aria-hidden="true">${x.emoji}</span>${x.name}${picked.get(x.name) ? html`<b>${picked.get(x.name).count}</b>` : ''}</button>`)}${custom}`;
  }

  function render() {
    const entries = [...picked.values()];
    const total = entries.length;
    return html`
      <header class="sheet-head">
        <button class="link" data-action="close">Annuler</button>
        <h2>Fruits et légumes</h2>
        <button class="link strong" data-action="confirm" ${total ? '' : raw('disabled')}>Ajouter</button>
      </header>
      <div class="sheet-body">
        ${total ? html`
          <section class="group">
            <h2>Sélection</h2>
            ${entries.map(({ item, count }) => html`
              <div class="field"><span class="label-stack">${item.emoji} ${item.name}<small>${R.locationOf(item.place).label}, se garde ≈ ${S.durationText(item.days)}</small></span>
                <div class="stepper small">
                  <button data-action="minus" data-name="${item.name}" aria-label="Un ${item.name} de moins">−</button>
                  <output>${count}</output>
                  <button data-action="plus" data-name="${item.name}" aria-label="Un ${item.name} de plus">+</button>
                </div>
              </div>`)}
          </section>
          <button class="primary" data-action="confirm">${I.check}Ajouter ${S.plural(total, 'produit')} au stock</button>` : html`
          <p class="hint">Touchez ce que vous avez acheté (plusieurs fois pour en ajouter plusieurs). Le lieu et une date de conservation estimée sont choisis automatiquement ; modifiables ensuite.</p>`}
        <label class="search produce-search">${I.search}<input name="produce-search" type="search" placeholder="Chercher ou taper un nom" value="${query}" autocomplete="off" aria-label="Chercher un fruit ou un légume"></label>
        <div class="produce-grid" id="produce-results">${grid()}</div>
      </div>`;
  }
}
