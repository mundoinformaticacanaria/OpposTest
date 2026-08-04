import { buildShareableBank, shareableBankFilename } from '../core/export-bank.js';
import { loadStudyData } from '../data/repository.js';

const main = document.querySelector('#main');
let toastTimer;

if (main) {
  const observer = new MutationObserver(enhanceDataScreen);
  observer.observe(main, { childList: true, subtree: true });
  window.addEventListener('hashchange', () => queueMicrotask(enhanceDataScreen));
  enhanceDataScreen();
}

function enhanceDataScreen() {
  if (currentPath() !== '/data') return;

  const backupButton = main.querySelector('#export-backup');
  const backupCard = backupButton?.closest('.card');
  if (!backupCard || main.querySelector('#export-shareable-bank')) return;

  const headerDescription = main.querySelector('.page-header p');
  if (headerDescription) {
    headerDescription.textContent = 'Importa bancos JSON, comparte tus preguntas o conserva una copia completa de tu progreso.';
  }

  const backupTitle = backupCard.querySelector('h2');
  const backupDescription = backupCard.querySelector('p');
  if (backupTitle) backupTitle.textContent = 'Copia completa';
  if (backupDescription) backupDescription.textContent = 'Incluye preguntas, temas, historial, falladas, favoritas y configuración. Úsala como copia privada.';
  backupButton.textContent = 'Exportar copia completa';

  const shareableCard = document.createElement('article');
  shareableCard.className = 'card';
  shareableCard.innerHTML = `
    <h2>Banco compartible</h2>
    <p>Exporta todas las preguntas y temas en un JSON importable, sin historial, progreso, falladas, favoritas ni configuración.</p>
    <button class="button secondary" id="export-shareable-bank" type="button">Exportar banco compartible</button>`;
  backupCard.before(shareableCard);
  shareableCard.querySelector('#export-shareable-bank').addEventListener('click', exportShareableBankFile);
}

async function exportShareableBankFile(event) {
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
    showToast(`Banco compartible preparado con ${bank.questions.length} preguntas.`);
  } catch (error) {
    showToast(error.message || 'No se pudo preparar el banco compartible.');
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
