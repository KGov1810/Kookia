// Kookia — Menu « + » d'ajout de produits.

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { pickImage } from '../../components/platform.js';
import { openSheet } from '../../components/sheet.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { t } from '../../services/i18n/i18n.js';
import { openProduceSheet } from '../produce/produce-sheet.js';
import { openEditor } from '../product-editor/product-editor.js';
import { openReceipt } from '../receipt/receipt-sheet.js';
import { openBatchScan } from '../scanner/batch-scan.js';
import { openScanner } from '../scanner/scanner.js';

/** Ouvre le scanner tout de suite (dans le geste de l'utilisateur), puis la fiche avec le code lu. */
export function scanThenEdit() {
  openScanner((code) => openEditor({ barcode: code }));
}

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
        <button class="menu-item" data-action="scan-many">${I.barcode}<span>${t('add.scanMany')}<small>${t('add.scanManyHint')}</small></span></button>
        <button class="menu-item" data-action="photo">${I.camera}<span>${t('add.photo')}<small>${t(hasKey ? 'add.photoClaude' : 'add.photoDate')}</small></span></button>
        <button class="menu-item" data-action="produce">${I.apple}<span>${t('add.produce')}<small>${t('add.produceHint')}</small></span></button>
        <button class="menu-item" data-action="ticket">${I.receipt}<span>${t('add.ticket')}<small>${t(hasKey ? 'add.ticketHint' : 'add.needsKey')}</small></span></button>
        <button class="menu-item" data-action="manual">${I.pencil}<span>${t('add.manual')}</span></button>
        <button class="secondary" data-action="close">${t('common.cancel')}</button>
      </div>`,
    actions: {
      scan: () => {
        sheet.close();
        scanThenEdit();
      },
      'scan-many': () => {
        sheet.close();
        openBatchScan(); // ouvert dans le geste (caméra acceptée par iOS)
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
        sheet.close();
        openTicket();
      }
    }
  });
}
