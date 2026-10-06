// Kookia — Menu « + » d'ajout de produits.

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { pickImage } from '../../components/platform.js';
import { openSheet } from '../../components/sheet.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { openProduceSheet } from '../produce/produce-sheet.js';
import { openEditor } from '../product-editor/product-editor.js';
import { openReceipt } from '../receipt/receipt-sheet.js';
import { openScanner } from '../scanner/scanner.js';

/** Ouvre le scanner tout de suite (dans le geste de l'utilisateur), puis la fiche avec le code lu. */
export function scanThenEdit() {
  openScanner((code) => openEditor({ barcode: code }));
}

export function openAddMenu() {
  const hasKey = hasClaudeKey();
  const sheet = openSheet({
    render: () => html`
      <div class="menu">
        <button class="menu-item" data-action="scan">${I.barcode}<span>Scanner un code-barres<small>Nom et photo retrouvés automatiquement</small></span></button>
        <button class="menu-item" data-action="photo">${I.camera}<span>Prendre le produit en photo<small>${hasKey ? 'Claude reconnaît le produit et sa date' : "Lecture de la date sur l'emballage"}</small></span></button>
        <button class="menu-item" data-action="produce">${I.apple}<span>Fruits et légumes<small>Sans code-barres : choisissez dans la liste</small></span></button>
        <button class="menu-item" data-action="ticket">${I.receipt}<span>Scanner un ticket de caisse<small>${hasKey ? 'Tous les produits des courses d\'un coup' : 'Nécessite une clé Claude (Réglages)'}</small></span></button>
        <button class="menu-item" data-action="manual">${I.pencil}<span>Saisir à la main</span></button>
        <button class="secondary" data-action="close">Annuler</button>
      </div>`,
    actions: {
      scan: () => {
        sheet.close();
        scanThenEdit();
      },
      photo: () => {
        const filePromise = pickImage({ camera: true }); // dans le geste, sinon iOS refuse
        sheet.close();
        openEditor({ mode: 'photo', filePromise });
      },
      manual: () => {
        sheet.close();
        openEditor({ mode: 'manual' });
      },
      produce: () => {
        sheet.close();
        openProduceSheet();
      },
      ticket: () => {
        // Photo choisie dans le geste (règle d'iOS) ; sans clé, la fiche explique quoi faire.
        const filePromise = hasKey ? pickImage({ camera: false }) : null;
        sheet.close();
        openReceipt(filePromise);
      }
    }
  });
}
