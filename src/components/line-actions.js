// Kookia — Lignes à vérifier avant l'ajout au stock (ticket, scan de plusieurs produits, « Tout ranger ») :
// cocher ou décocher, un de moins, un de plus (1 à 99).

/** Actions des boutons d'une ligne (data-index) ; lines() renvoie la liste en cours, update() redessine la fiche. */
export function lineActions(lines, update) {
  const change = (fn) => (el) => {
    const line = lines()[Number(el.dataset.index)];
    if (!line) return;
    fn(line);
    update();
  };
  return {
    'toggle-line': change((line) => {
      line.selected = !line.selected;
      line.selectedTouched = true; // décochée à la main : un nom tapé ne la recoche pas
    }),
    'line-minus': change((line) => {
      line.count = Math.max(1, line.count - 1);
      line.countTouched = true;
    }),
    'line-plus': change((line) => {
      line.count = Math.min(99, line.count + 1);
      line.countTouched = true;
    })
  };
}
