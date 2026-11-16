// Kookia — Menu « + » d'ajout de produits : Scanner, Ticket de caisse, Fruits et légumes, Autre produit.

import { html } from '../../components/html.js';
import { I } from '../../components/icons.js';
import { openSheet } from '../../components/sheet.js';
import { hasClaudeKey } from '../../data/store/selectors.js';
import { t } from '../../services/i18n/i18n.js';
import { lazy } from '../app/lazy.js';
import { openEditor } from '../product-editor/product-editor.js';
// Le scanner est chargé d'avance : iOS n'accorde la caméra que dans le geste qui l'ouvre, sans attente.
import { openBatchScan } from '../scanner/batch-scan.js';

const openProduceSheet = lazy(() => import('../produce/produce-sheet.js'), 'openProduceSheet');
const openReceipt = lazy(() => import('../receipt/receipt-sheet.js'), 'openReceipt');

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
      // Ticket : la fiche s'ouvre d'abord, « Photographier le ticket » ouvre ensuite le choix des photos.
      ticket: () => {
        sheet.close();
        openReceipt();
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
