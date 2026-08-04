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
        <div class="export-choice-grid">
          <section class="export-choice">
            <span class="badge">Privada</span>
            <h3>Copia completa</h3>
            <p>Incluye preguntas, temas, historial, progreso, falladas, favoritas y configuración.</p>
            <div id="complete-export-slot"></div>
          </section>
          <section class="export-choice">
            <span class="badge success">Compartible</span>
            <h3>Banco de preguntas</h3>
            <p>Incluye todas las preguntas y temas, sin historial, progreso ni configuración personal.</p>
            <button class="button secondary export-choice-button" id="export-shareable-bank" type="button">Descargar banco de preguntas</button>
          </section>
        </div>
      </div>
    </dialog>`;
}

function enhanceDataScreen() {
  if (currentPath() !== '/data') return;

  const backupButton = main.querySelector('#export-backup');
  const backupCard = backupButton?.closest('.card');
  if (!backupCard || main.querySelector('#export-data-dialog')) return;

  const headerDescription = main.querySelector('.page-header p');
  if (headerDescription) {
    headerDescription.textContent = 'Importa bancos JSON y crea o restaura copias de tus datos.';
  }

  const backupTitle = backupCard.querySelector('h2');
  const backupDescription = backupCard.querySelector('p');
  const backupActions = backupButton.parentElement;
  const restoreLabel = backupCard.querySelector('label[for="restore-file"]');

  if (backupTitle) backupTitle.textContent = 'Copia de datos';
  if (backupDescription) {
    backupDescription.textContent = 'Descarga una copia completa privada o un banco de preguntas compartible.';
  }
  if (restoreLabel) restoreLabel.textContent = 'Restaurar copia';

  const openButton = document.createElement('button');
  openButton.className = 'button secondary';
  openButton.id = 'open-export-dialog';
  openButton.type = 'button';
  openButton.textContent = 'Elegir copia';
  backupActions.insertBefore(openButton, backupButton);

  const wrapper = document.createElement('div');
  wrapper.innerHTML = exportDialogMarkup().trim();
  const dialog = wrapper.firstElementChild;
  main.append(dialog);

  backupButton.textContent = 'Descargar copia completa';
  backupButton.classList.add('export-choice-button');
  dialog.querySelector('#complete-export-slot').append(backupButton);

  const closeButton = dialog.querySelector('#close-export-dialog');
  const shareableButton = dialog.querySelector('#export-shareable-bank');

  openButton.addEventListener('click', () => {
    dialog.showModal();
    queueMicrotask(() => backupButton.focus());
  });
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('close', () => openButton.focus());
  backupButton.addEventListener('click', () => queueMicrotask(() => dialog.close()));
  shareableButton.addEventListener('click', (event) => exportShareableBankFile(event, dialog));
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
