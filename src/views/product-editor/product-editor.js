// Kookia — Fiche produit (ajout / modification) : ouverture et lancement automatique.

import { openSheet } from '../../components/sheet.js';
import { editorActions } from './editor-actions.js';
import { handleEditorInput } from './editor-input.js';
import { handleBarcode, handleProductPhoto } from './editor-recognition.js';
import { renderEditor } from './editor-render.js';
import { createEditorContext } from './editor-state.js';

/**
 * Ouvre la fiche d'un produit. Options : product (modification), draft (pré-remplissage),
 * mode, filePromise (photo déjà choisie), shoppingItemId (article rangé), barcode (code lu).
 */
export function openEditor(options = {}) {
  const ctx = createEditorContext(options);
  const { p, isNew, mode, filePromise, barcode } = ctx;
  ctx.sheet = openSheet({
    tall: true,
    render: () => renderEditor(ctx),
    actions: editorActions(ctx),
    onInput: (event) => handleEditorInput(ctx, event)
  });

  // Lancement automatique selon le choix fait dans le menu « + ».
  if (barcode) handleBarcode(ctx, barcode);
  if (filePromise) {
    filePromise.then((file) => {
      if (file && ctx.sheet.isOpen) handleProductPhoto(ctx, file);
    });
  }
  if (mode === 'manual' && isNew && !p.name && !barcode) {
    setTimeout(() => ctx.sheet.panel.querySelector('[name="name"]')?.focus(), 350);
  }
  return ctx.sheet;
}
