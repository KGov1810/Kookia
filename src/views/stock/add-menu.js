// Kookia — Menu « + » d'ajout de produits : Scanner, Ticket de caisse, Fruits et légumes, Autre produit.

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { openSheet } from '../../components/sheet.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { t } from '../../services/i18n/i18n.js';
import { openProduceSheet } from '../produce/produce-sheet.js';
import { openEditor } from '../product-editor/product-editor.js';
import { openReceipt } from '../receipt/receipt-sheet.js';
import { openBatchScan } from '../scanner/batch-scan.js';

/**
 * Ticket de caisse : la fiche s'ouvre d'abord ; « Photographier le ticket » ouvre ensuite le menu de l'iPhone
 * (photothèque, appareil photo, fichier), placé sous le bouton. Sans clé, la fiche explique quoi faire.
 */
export function openTicket() {
  openReceipt(null);
}

export function openAddMenu() {
  const hasKey = hasClaudeKey();
  const sheet = openSheet({
    render: () => html`
      <div class="menu">
        <button class="menu-item" data-action="scan">${I.barcode}<span>${t('add.scan')}<small>${t('add.scanHint')}</small></span></button>
        <button class="menu-item" data-action="ticket">${I.receipt}<span>${t('add.ticket')}<small>${t(hasKey ? 'add.ticketHint' : 'add.needsKey')}</small></span></button>
        <button class="menu-item" data-action="produce">${I.apple}<span>${t('add.produce')}<small>${t('add.produceHint')}</small></span></button>
        <button class="menu-item" data-action="manual">${I.pencil}<span>${t('add.other')}<small>${t('add.otherHint')}</small></span></button>
        <button class="secondary" data-action="close">${t('common.cancel')}</button>
      </div>`,
    actions: {
      scan: () => {
        sheet.close();
        openBatchScan(); // ouvert dans le geste (caméra acceptée par iOS)
      },
      ticket: () => {
        sheet.close();
        openTicket();
      },
      produce: () => {
        sheet.close();
        openProduceSheet();
      },
      // La fiche propose aussi « Photo du produit » (reconnu par Claude, ou date lue) et « Code-barres ».
      manual: () => {
        sheet.close();
        openEditor({ mode: 'manual' });
      }
    }
  });
}
