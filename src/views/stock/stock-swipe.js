// Kookia — Stock : glisser une ligne de produit.
// Vers la droite : consommé (une unité, avec Annuler). Vers la gauche : fait apparaître « Entamé » et « Jeté ».
// Le défilement vertical reste celui de Safari (touch-action: pan-y) ; un geste vertical annule le glisser.

import { screen } from '../app/ui-state.js';
import { consume } from './stock-list.js';

const CONSUME_AT = 96; // px vers la droite pour consommer
const OPEN_AT = 48;    // px vers la gauche pour montrer les boutons
const START = 10;      // px avant de décider : glisser ou défiler

let drag = null;
let openRow = null;
let swallowClickUntil = 0;

const buttonsWidth = (row) => row.querySelector('.swipe-buttons')?.offsetWidth || 168;

function place(row, x, animate) {
  const front = row.querySelector('.product-front');
  if (!front) return;
  front.style.transition = animate ? '' : 'none';
  front.style.transform = x ? `translateX(${x}px)` : '';
  row.classList.toggle('swipe-right', x > 0);
  row.classList.toggle('swipe-left', x < 0);
}

/** Referme la ligne dont les boutons sont visibles. */
export function closeSwipedRow() {
  if (!openRow) return;
  place(openRow, 0, true);
  openRow.classList.remove('open');
  openRow = null;
}

function onDown(event) {
  const front = event.target.closest?.('.product-front');
  if (!front || event.button > 0) return;
  const row = front.closest('.product');
  if (openRow && openRow !== row) closeSwipedRow();
  drag = { row, x0: event.clientX, y0: event.clientY, x: 0, active: false, base: row === openRow ? -buttonsWidth(row) : 0 };
}

function onMove(event) {
  if (!drag) return;
  const dx = event.clientX - drag.x0;
  const dy = event.clientY - drag.y0;
  if (!drag.active) {
    if (Math.abs(dy) > START && Math.abs(dy) >= Math.abs(dx)) {
      drag = null; // défilement vertical
      return;
    }
    if (Math.abs(dx) < START || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    drag.active = true;
    try {
      drag.row.querySelector('.product-front').setPointerCapture?.(event.pointerId);
    } catch {
      // pas de capture (ancien Safari) : le geste fonctionne quand même
    }
  }
  const max = buttonsWidth(drag.row);
  let x = drag.base + dx;
  if (drag.base < 0) x = Math.min(x, 0); // ligne ouverte : glisser à droite la referme seulement
  if (x < -max) x = -max - (-max - x) / 3; // résistance au-delà des boutons
  if (x > CONSUME_AT) x = CONSUME_AT + (x - CONSUME_AT) / 3;
  drag.x = x;
  place(drag.row, x, false);
}

function onUp() {
  if (!drag) return;
  const { row, x, active, base } = drag;
  drag = null;
  if (!active) return;
  swallowClickUntil = Date.now() + 450; // pas d'ouverture de fiche à la fin du geste
  if (base === 0 && x >= CONSUME_AT) {
    place(row, 0, true);
    consume(row.dataset.id);
  } else if (x <= -OPEN_AT) {
    place(row, -buttonsWidth(row), true);
    row.classList.add('open');
    openRow = row;
  } else {
    place(row, 0, true);
    row.classList.remove('open');
    if (openRow === row) openRow = null;
  }
}

function onCancel() {
  if (drag?.active) place(drag.row, drag.base, true);
  drag = null;
}

/** Branché une fois sur l'écran (les lignes sont recréées à chaque mise à jour). */
export function wireSwipe() {
  screen.addEventListener('pointerdown', onDown);
  screen.addEventListener('pointermove', onMove);
  screen.addEventListener('pointerup', onUp);
  screen.addEventListener('pointercancel', onCancel);
  // Avant les actions : le « clic » qui termine un geste, ou un toucher ailleurs quand des boutons sont visibles,
  // ne fait que refermer (pas d'ouverture de fiche). « Entamé » et « Jeté » restent toujours actifs.
  screen.addEventListener('click', (event) => {
    if (openRow && !openRow.isConnected) openRow = null; // liste redessinée entre-temps
    if (event.target.closest('.swipe-buttons')) return;
    const justSwiped = Date.now() < swallowClickUntil;
    if (!justSwiped && !openRow) return;
    if (!justSwiped) closeSwipedRow();
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
}
