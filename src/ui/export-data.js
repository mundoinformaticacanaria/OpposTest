import { buildShareableBank, shareableBankFilename } from '../core/export-bank.js';
import { loadStudyData } from '../data/repository.js';

const main = typeof document !== 'undefined' ? document.querySelector('#main') : null;
let toastTimer;

if (main && typeof MutationObserver !== 'undefined') {
  const observer = new MutationObserver(enhanceDataScreen);
  observer.observe(main, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => queueMicrotask(enhanceDataScreen));
  enhanceDataScreen();
}

export function loadDialogMarkup() {
  return `
    <dialog class="data-dialog" id="load-data-dialog" aria-labelledby="load-data-title">
      <div class="dialog-shell">
        <header class="dialog-header">
          <div>
            <h2 id="load-data-title">Carga de datos</h2>
            <p>Elige qué tipo de archivo quieres cargar.</p>
          </div>
          <button class="dialog-close" id="close-load-dialog" type="button" aria-label="Cerrar">×</button>
        </header>
        <div class="data-choice-grid">
          <section class="data-choice">
            <span class="badge success">Añade contenido</span>
            <h3>Importar banco de preguntas</h3>
            <p>Añade preguntas y temas al contenido actual sin borrar tu historial ni tu progreso.</p>
            <button class="button secondary data-choice-button" id="select-bank-file" type="button">Seleccionar banco de preguntas</button>
            <div class="data-file-slot" id="bank-file-slot"></div>
          </section>
          <section class="data-choice">
            <span class="badge warning">Sustituye datos</span>
            <h3>Restaurar copia completa</h3>
            <p>Sustituye los datos actuales por las preguntas, temas, historial, progreso y configuración de la copia. Se solicitará confirmación.</p>
            <button class="button secondary data-choice-button" id="select-restore-file" type="button">Seleccionar copia completa</button>
            <div class="data-file-slot" id="restore-file-slot"></div>
          </section>
        </div>
      </div>
    </dialog>`;
}

export function exportDialogMarkup() {
  return `
    <dialog class="data-dialog" id="export-data-dialog" aria-labelledby="export-data-title">
      <div class="dialog-shell">
        <header class="dialog-header">
          <div>
            <h2 id="export-data-title">Copia de datos</h2>
            <p>Elige qué tipo de archivo necesitas descargar.</p>
          </div>
          <button class="dialog-close" id="close-export-dialog" type="button" aria-label="Cerrar">×</button>
        </header>
        <div class="data-choice-grid">
          <section class="data-choice">
            <span class="badge">Privada</span>
            <h3>Copia completa</h3>
            <p>Incluye preguntas, temas, historial, progreso, falladas, favoritas y configuración.</p>
            <div class="data-action-slot" id="complete-export-slot"></div>
          </section>
          <section class="data-choice">
            <span class="badge success">Compartible</span>
            <h3>Banco de preguntas</h3>
            <p>Incluye todas las preguntas y temas, sin historial, progreso ni configuración personal.</p>
            <button class="button secondary data-choice-button" id="export-shareable-bank" type="button">Descargar banco de preguntas</button>
          </section>
        </div>
      </div>
    </dialog>`;
}

function enhanceDataScreen() {
  if (currentPath() !== '/data') return;

  const bankInput = main.querySelector('#bank-file');
  const restoreInput = main.querySelector('#restore-file');
  const backupButton = main.querySelector('#export-backup');
  const bankCard = bankInput?.closest('.card');
  const backupCard = backupButton?.closest('.card');

  if (!bankInput || !restoreInput || !backupButton || !bankCard || !backupCard) return;
  if (main.querySelector('#load-data-dialog') || main.querySelector('#export-data-dialog')) return;

  const headerDescription = main.querySelector('.page-header p');
  if (headerDescription) {
    headerDescription.textContent = 'Carga bancos, restaura copias y descarga tus datos de forma segura.';
  }

  const bankLabel = bankCard.querySelector('label[for="bank-file"]');
  const restoreLabel = backupCard.querySelector('label[for="restore-file"]');
  const bankTitle = bankCard.querySelector('h2');
  const bankDescription = bankCard.querySelector('p');
  const backupTitle = backupCard.querySelector('h2');
  const backupDescription = backupCard.querySelector('p');
  const backupActions = backupButton.parentElement;

  if (bankTitle) bankTitle.textContent = 'Carga de datos';
  if (bankDescription) {
    bankDescription.textContent = 'Importa un banco de preguntas o restaura una copia completa.';
  }
  if (backupTitle) backupTitle.textContent = 'Copia de datos';
  if (backupDescription) {
    backupDescription.textContent = 'Descarga una copia completa privada o un banco de preguntas compartible.';
  }

  const loadActions = document.createElement('div');
  loadActions.className = 'hero-actions';
  const openLoadButton = createButton('open-load-dialog', 'Elegir archivo');
  loadActions.append(openLoadButton);
  bankCard.append(loadActions);

  const openExportButton = createButton('open-export-dialog', 'Elegir copia');
  backupActions.append(openExportButton);

  bankLabel?.remove();
  restoreLabel?.remove();

  const loadDialog = createDialog(loadDialogMarkup());
  const exportDialog = createDialog(exportDialogMarkup());
  main.append(loadDialog, exportDialog);

  loadDialog.querySelector('#bank-file-slot').append(bankInput);
  loadDialog.querySelector('#restore-file-slot').append(restoreInput);

  backupButton.textContent = 'Descargar copia completa';
  backupButton.classList.add('data-choice-button');
  exportDialog.querySelector('#complete-export-slot').append(backupButton);

  const selectBankButton = loadDialog.querySelector('#select-bank-file');
  const selectRestoreButton = loadDialog.querySelector('#select-restore-file');
  const shareableButton = exportDialog.querySelector('#export-shareable-bank');

  selectBankButton.addEventListener('click', () => bankInput.click());
  selectRestoreButton.addEventListener('click', () => restoreInput.click());
  bankInput.addEventListener('change', () => closeAfterSelection(loadDialog, bankInput));
  restoreInput.addEventListener('change', () => closeAfterSelection(loadDialog, restoreInput));

  setupDialog({
    dialog: loadDialog,
    openButton: openLoadButton,
    closeButton: loadDialog.querySelector('#close-load-dialog'),
    initialFocus: selectBankButton
  });
  setupDialog({
    dialog: exportDialog,
    openButton: openExportButton,
    closeButton: exportDialog.querySelector('#close-export-dialog'),
    initialFocus: backupButton
  });

  backupButton.addEventListener('click', () => queueMicrotask(() => exportDialog.close()));
  shareableButton.addEventListener('click', (event) => exportShareableBankFile(event, exportDialog));
}

function createButton(id, text) {
  const button = document.createElement('button');
  button.className = 'button secondary';
  button.id = id;
  button.type = 'button';
  button.textContent = text;
  return button;
}

function createDialog(markup) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML = markup.trim();
  return wrapper.firstElementChild;
}

function setupDialog({ dialog, openButton, closeButton, initialFocus }) {
  openButton.addEventListener('click', () => {
    dialog.showModal();
    queueMicrotask(() => initialFocus.focus());
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => openButton.focus());
}

function closeAfterSelection(dialog, input) {
  if (input.files?.length && dialog.open) dialog.close();
}

async function exportShareableBankFile(event, dialog) {
  const button = event.currentTarget;
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  try {
    const studyData = await loadStudyData();
    const now = new Date();
    const bank = buildShareableBank({
      topics: studyData.topics,
      questions: studyData.questions,
      now
    });
    downloadJson(shareableBankFilename(now), bank);
    dialog.close();
    showToast(`Banco de preguntas preparado con ${bank.questions.length} preguntas.`);
  } catch (error) {
    showToast(error.message || 'No se pudo preparar el banco de preguntas.');
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
}

function currentPath() {
  return (location.hash.slice(1) || '/').split('?')[0];
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function showToast(message) {
  const toast = document.querySelector('#toast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 4200);
}
