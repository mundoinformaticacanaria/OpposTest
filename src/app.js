import { buildTest, calculateResult, descendantTopicIds } from './core/quiz-engine.js';
import {
  createBackup,
  getSettings,
  importBank,
  loadStudyData,
  restoreBackup,
  saveAttempt,
  saveSettings,
  toggleFavorite
} from './data/repository.js';

const main = document.querySelector('#main');
const toast = document.querySelector('#toast');
let data;
let settings;
let session = null;
let lastResult = null;
let toastTimer;

start().catch((error) => {
  console.error(error);
  main.innerHTML = `<div class="notice danger"><strong>No se pudo iniciar OpposTest.</strong><br>${escapeHtml(error.message)}</div>`;
});

async function start() {
  [data, settings] = await Promise.all([loadStudyData(), getSettings()]);
  window.addEventListener('hashchange', renderRoute);
  document.addEventListener('click', handleGlobalClick);
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => console.warn('Service worker:', error));
  }
  renderRoute();
}

function currentPath() {
  return (location.hash.slice(1) || '/').split('?')[0];
}

function renderRoute() {
  const path = currentPath();
  updateNavigation(path);

  if (path === '/') return renderHome();
  if (path === '/create') return renderCreateTest();
  if (path === '/test') return session ? renderTest() : navigate('/create');
  if (path === '/result') return lastResult ? renderResult() : navigate('/history');
  if (path === '/bank') return renderBank();
  if (path === '/history') return renderHistory();
  if (path === '/data') return renderData();
  navigate('/');
}

function updateNavigation(path) {
  document.querySelectorAll('.desktop-nav a, .mobile-nav a').forEach((link) => {
    const href = link.getAttribute('href')?.replace('#', '') ?? '';
    const active = href === path || (path === '/test' && href === '/create') || (path === '/result' && href === '/history');
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

function navigate(path) {
  location.hash = `#${path}`;
}

function progressMap() {
  return new Map(data.progress.map((item) => [item.question_id, item]));
}

function topicMap() {
  return new Map(data.topics.map((topic) => [topic.id, topic]));
}

function stats() {
  const progress = progressMap();
  return {
    questions: data.questions.length,
    pending: [...progress.values()].filter((item) => item.pending_review).length,
    favorites: [...progress.values()].filter((item) => item.favorite).length,
    attempts: data.attempts.length
  };
}

function renderHome() {
  const summary = stats();
  const empty = data.questions.length === 0;
  main.innerHTML = `
    <section class="hero">
      <div class="card hero-primary">
        <span class="badge">MVP local-first</span>
        <h1>Estudia lo que necesitas reforzar.</h1>
        <p>Crea test por temas, recupera tus preguntas falladas y conserva el progreso en este dispositivo.</p>
        <div class="hero-actions">
          <a class="button primary" href="#/create">Crear un test</a>
          <a class="button secondary" href="#/data">Importar preguntas</a>
        </div>
      </div>
      <div class="card">
        <h2>Acceso rápido</h2>
        <div class="quick-actions">
          <a class="quick-action" href="#/create?mode=failed"><span>Repasar falladas</span><strong>${summary.pending}</strong></a>
          <a class="quick-action" href="#/create?mode=favorites"><span>Practicar favoritas</span><strong>${summary.favorites}</strong></a>
          <a class="quick-action" href="#/history"><span>Ver historial</span><strong>${summary.attempts}</strong></a>
        </div>
      </div>
    </section>

    ${empty ? `
      <div class="notice warning">
        <strong>El banco está vacío.</strong> Importa un archivo JSON o carga la demostración para probar el flujo completo.
      </div>
    ` : ''}

    <section class="grid cards" aria-label="Resumen">
      ${statCard(summary.questions, 'Preguntas')}
      ${statCard(summary.pending, 'Pendientes')}
      ${statCard(summary.favorites, 'Favoritas')}
      ${statCard(summary.attempts, 'Test realizados')}
    </section>
  `;
}

function statCard(value, label) {
  return `<article class="card stat-card"><strong>${value}</strong><span>${escapeHtml(label)}</span></article>`;
}

function requestedMode() {
  const params = new URLSearchParams(location.hash.split('?')[1] ?? '');
  const value = params.get('mode');
  return ['normal', 'failed', 'favorites'].includes(value) ? value : 'normal';
}

function renderCreateTest() {
  if (data.questions.length === 0) {
    main.innerHTML = `
      ${pageHeader('Nuevo test', 'Primero necesitas un banco de preguntas.')}
      <div class="empty-state">
        <p>No hay preguntas disponibles.</p>
        <a class="button primary" href="#/data">Importar preguntas</a>
      </div>`;
    return;
  }

  const mode = requestedMode();
  main.innerHTML = `
    ${pageHeader('Nuevo test', 'Selecciona el tipo de repaso, uno o varios temas y el número de preguntas.')}
    <form id="create-test-form" class="grid two">
      <section class="card form-grid">
        <fieldset>
          <legend>Modalidad</legend>
          <div class="choice-list">
            ${modeChoice('normal', 'Test normal', 'Preguntas aleatorias del banco.', mode)}
            ${modeChoice('failed', 'Preguntas falladas', 'Solo preguntas pendientes de repaso.', mode)}
            ${modeChoice('favorites', 'Preguntas favoritas', 'Solo preguntas marcadas con estrella.', mode)}
          </div>
        </fieldset>
        <label class="field">
          <span>Número de preguntas</span>
          <input id="question-count" name="count" type="number" min="1" max="500" value="${Number(settings.default_question_count) || 20}" required>
          <small id="availability-text"></small>
        </label>
        <button class="button primary" type="submit">Comenzar test</button>
      </section>
      <section class="card">
        <fieldset>
          <legend>Temas</legend>
          <p class="meta-text">Sin seleccionar temas se utilizará todo el banco. Un tema superior incluye sus subtemas.</p>
          <div class="topic-tree">
            ${renderTopicCheckboxes()}
          </div>
        </fieldset>
      </section>
    </form>
  `;

  const form = document.querySelector('#create-test-form');
  form.addEventListener('change', updateAvailability);
  form.addEventListener('submit', startNewTest);
  updateAvailability();
}

function modeChoice(value, title, description, selected) {
  return `
    <label class="choice">
      <input type="radio" name="mode" value="${value}" ${value === selected ? 'checked' : ''}>
      <span><strong>${escapeHtml(title)}</strong><br><small>${escapeHtml(description)}</small></span>
    </label>`;
}

function topicDepth(topic) {
  const topics = topicMap();
  let depth = 0;
  let current = topic;
  const visited = new Set();
  while (current?.parent_id && topics.has(current.parent_id) && !visited.has(current.parent_id)) {
    visited.add(current.parent_id);
    depth += 1;
    current = topics.get(current.parent_id);
  }
  return depth;
}

function sortedTopics() {
  const children = new Map();
  data.topics.forEach((topic) => {
    const parent = topic.parent_id ?? '__root__';
    if (!children.has(parent)) children.set(parent, []);
    children.get(parent).push(topic);
  });
  children.forEach((items) => items.sort((a, b) => a.name.localeCompare(b.name, 'es')));
  const ordered = [];
  const append = (parentId) => {
    (children.get(parentId) ?? []).forEach((topic) => {
      ordered.push(topic);
      append(topic.id);
    });
  };
  append('__root__');
  return ordered;
}

function renderTopicCheckboxes() {
  return sortedTopics().map((topic) => `
    <label class="choice topic-item" style="--depth:${topicDepth(topic)}">
      <input type="checkbox" name="topics" value="${escapeAttribute(topic.id)}">
      <span>${escapeHtml(topic.name)}</span>
    </label>`).join('') || '<div class="empty-state">No hay temas.</div>';
}

function formSelection() {
  const form = document.querySelector('#create-test-form');
  if (!form) return { mode: 'normal', topicIds: [], count: 20 };
  const formData = new FormData(form);
  return {
    mode: formData.get('mode') ?? 'normal',
    topicIds: formData.getAll('topics'),
    count: Number(formData.get('count')) || 1
  };
}

function currentBuild() {
  const selection = formSelection();
  return {
    selection,
    result: buildTest({
      questions: data.questions,
      topics: data.topics,
      progressByQuestion: progressMap(),
      selectedTopicIds: selection.topicIds,
      mode: selection.mode,
      count: selection.count
    })
  };
}

function updateAvailability() {
  const output = document.querySelector('#availability-text');
  if (!output) return;
  const { result } = currentBuild();
  output.textContent = `${result.availableCount} preguntas disponibles con estos filtros.`;
}

function startNewTest(event) {
  event.preventDefault();
  const { selection, result } = currentBuild();
  if (result.questions.length === 0) {
    showToast('No hay preguntas disponibles con esos filtros.');
    return;
  }
  session = {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    mode: selection.mode,
    topicIds: selection.topicIds,
    questions: result.questions,
    index: 0,
    answers: {}
  };
  if (result.reduced) showToast(`Solo había ${result.availableCount} preguntas disponibles.`);
  navigate('/test');
}

function renderTest() {
  const question = session.questions[session.index];
  const selected = session.answers[question.id] ?? null;
  const progress = progressMap().get(question.id);
  const percent = ((session.index + 1) / session.questions.length) * 100;

  main.innerHTML = `
    <section class="test-shell">
      <div class="test-topbar">
        <span><strong>${session.index + 1}</strong> de ${session.questions.length}</span>
        <button class="favorite-button ${progress?.favorite ? 'active' : ''}" id="favorite-current" type="button" aria-label="${progress?.favorite ? 'Quitar de favoritas' : 'Añadir a favoritas'}" title="Marcar como favorita">★</button>
      </div>
      <div class="progress-track" aria-label="Progreso del test"><div class="progress-bar" style="width:${percent}%"></div></div>
      <article class="card question-card">
        <div class="question-number">Pregunta ${session.index + 1}</div>
        <h1 class="question-title">${escapeHtml(question.statement)}</h1>
        <div class="option-list" role="radiogroup" aria-label="Opciones de respuesta">
          ${question.options.map((option) => `
            <label class="option">
              <input type="radio" name="answer" value="${escapeAttribute(option.id)}" ${selected === option.id ? 'checked' : ''}>
              <span class="option-id">${escapeHtml(option.id)}</span>
              <span>${escapeHtml(option.text)}</span>
            </label>`).join('')}
        </div>
      </article>
      <div class="test-actions">
        <button class="button secondary" id="previous-question" type="button" ${session.index === 0 ? 'disabled' : ''}>Anterior</button>
        <button class="button secondary" id="next-question" type="button" ${session.index === session.questions.length - 1 ? 'disabled' : ''}>Siguiente</button>
        <button class="button primary finish" id="finish-test" type="button">Finalizar</button>
      </div>
    </section>`;

  document.querySelectorAll('input[name="answer"]').forEach((input) => {
    input.addEventListener('change', () => {
      session.answers[question.id] = input.value;
    });
  });
  document.querySelector('#previous-question').addEventListener('click', () => changeQuestion(-1));
  document.querySelector('#next-question').addEventListener('click', () => changeQuestion(1));
  document.querySelector('#finish-test').addEventListener('click', finishTest);
  document.querySelector('#favorite-current').addEventListener('click', async () => {
    await toggleFavorite(question.id);
    data = await loadStudyData();
    renderTest();
  });
}

function changeQuestion(delta) {
  session.index = Math.min(session.questions.length - 1, Math.max(0, session.index + delta));
  renderTest();
  main.focus();
}

async function finishTest() {
  const omitted = session.questions.filter((question) => !session.answers[question.id]).length;
  if (omitted > 0 && !window.confirm(`Quedan ${omitted} preguntas sin responder. ¿Finalizar igualmente?`)) return;

  const result = calculateResult({ questions: session.questions, answers: session.answers, penalty: settings.penalty_per_wrong });
  const attempt = await saveAttempt({
    id: session.id,
    startedAt: session.startedAt,
    mode: session.mode,
    topicIds: session.topicIds,
    questions: session.questions,
    answers: session.answers,
    result
  });
  lastResult = { attempt, result, questions: session.questions, answers: { ...session.answers } };
  data = await loadStudyData();
  session = null;
  navigate('/result');
}

function renderResult() {
  const { result, questions, answers } = lastResult;
  main.innerHTML = `
    ${pageHeader('Resultado', 'Revisa qué has acertado y qué queda pendiente de repaso.')}
    <section class="result-summary">
      ${resultBox(result.correct, 'Aciertos')}
      ${resultBox(result.incorrect, 'Fallos')}
      ${resultBox(result.omitted, 'Sin responder')}
      ${resultBox(formatScore(result.score), 'Puntuación')}
    </section>
    <div class="hero-actions">
      <a class="button primary" href="#/create?mode=failed">Repasar falladas</a>
      <a class="button secondary" href="#/create">Nuevo test</a>
      <a class="button secondary" href="#/history">Ver historial</a>
    </div>
    <section class="list" style="margin-top:1.25rem">
      ${questions.map((question, index) => renderReviewItem(question, answers[question.id], result.details[index])).join('')}
    </section>`;
}

function resultBox(value, label) {
  return `<div class="result-box"><strong>${escapeHtml(String(value))}</strong><span>${escapeHtml(label)}</span></div>`;
}

function renderReviewItem(question, selectedId, detail) {
  return `
    <article class="list-item review-item ${detail.status}">
      <div class="list-item-header">
        <h3>${escapeHtml(question.statement)}</h3>
        <span class="badge ${detail.status === 'correct' ? 'success' : detail.status === 'incorrect' ? 'danger' : 'warning'}">${statusLabel(detail.status)}</span>
      </div>
      <ol class="review-options">
        ${question.options.map((option) => {
          const classes = [selectedId === option.id ? 'selected' : '', question.correct_option_id === option.id ? 'correct-answer' : ''].filter(Boolean).join(' ');
          const annotations = [selectedId === option.id ? 'tu respuesta' : '', question.correct_option_id === option.id ? 'correcta' : ''].filter(Boolean).join(', ');
          return `<li class="${classes}"><strong>${escapeHtml(option.id)}.</strong> ${escapeHtml(option.text)}${annotations ? ` <small>(${annotations})</small>` : ''}</li>`;
        }).join('')}
      </ol>
      ${question.explanation ? `<p><strong>Explicación:</strong> ${escapeHtml(question.explanation)}</p>` : ''}
      ${question.legal_reference ? `<p><strong>Referencia:</strong> ${escapeHtml(question.legal_reference)}</p>` : ''}
    </article>`;
}

function statusLabel(status) {
  return status === 'correct' ? 'Correcta' : status === 'incorrect' ? 'Fallada' : 'Omitida';
}

function formatScore(value) {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 }).format(value);
}

function renderBank() {
  const topics = topicMap();
  const progress = progressMap();
  main.innerHTML = `
    ${pageHeader('Banco de preguntas', 'Consulta, busca y filtra el contenido disponible en este dispositivo.')}
    <div class="toolbar card">
      <label class="field"><span>Buscar</span><input id="bank-search" type="search" placeholder="Texto del enunciado o identificador"></label>
      <label class="field"><span>Tema</span><select id="bank-topic"><option value="">Todos</option>${sortedTopics().map((topic) => `<option value="${escapeAttribute(topic.id)}">${'— '.repeat(topicDepth(topic))}${escapeHtml(topic.name)}</option>`).join('')}</select></label>
      <label class="choice"><input id="bank-pending" type="checkbox"><span>Solo falladas</span></label>
      <label class="choice"><input id="bank-favorites" type="checkbox"><span>Solo favoritas</span></label>
    </div>
    <p id="bank-count" class="meta-text"></p>
    <section id="bank-list" class="list"></section>`;

  const renderList = () => {
    const search = document.querySelector('#bank-search').value.trim().toLocaleLowerCase('es');
    const topicId = document.querySelector('#bank-topic').value;
    const pending = document.querySelector('#bank-pending').checked;
    const favorites = document.querySelector('#bank-favorites').checked;
    const filtered = data.questions.filter((question) => {
      const itemProgress = progress.get(question.id);
      const matchesSearch = !search || `${question.id} ${question.statement}`.toLocaleLowerCase('es').includes(search);
      const selectedTopics = topicId ? descendantTopicIds(data.topics, [topicId]) : new Set();
      const matchesTopic = !topicId || question.topic_ids.some((id) => selectedTopics.has(id));
      const matchesPending = !pending || itemProgress?.pending_review;
      const matchesFavorite = !favorites || itemProgress?.favorite;
      return matchesSearch && matchesTopic && matchesPending && matchesFavorite;
    });

    document.querySelector('#bank-count').textContent = `${filtered.length} preguntas mostradas de ${data.questions.length}.`;
    document.querySelector('#bank-list').innerHTML = filtered.length ? filtered.slice(0, 500).map((question) => {
      const itemProgress = progress.get(question.id);
      return `
        <article class="list-item">
          <div class="list-item-header">
            <h3>${escapeHtml(question.statement)}</h3>
            <button class="favorite-button ${itemProgress?.favorite ? 'active' : ''}" type="button" data-favorite-id="${escapeAttribute(question.id)}" aria-label="Cambiar favorita">★</button>
          </div>
          <div class="meta">
            <span class="badge">${escapeHtml(question.id)}</span>
            ${question.topic_ids.map((id) => `<span class="badge">${escapeHtml(topics.get(id)?.name ?? id)}</span>`).join('')}
            ${itemProgress?.pending_review ? '<span class="badge danger">Pendiente</span>' : ''}
            ${itemProgress?.times_shown ? `<span class="badge">${itemProgress.correct_count} aciertos · ${itemProgress.incorrect_count} fallos</span>` : ''}
          </div>
        </article>`;
    }).join('') : '<div class="empty-state">No hay preguntas que coincidan con los filtros.</div>';
  };

  ['bank-search', 'bank-topic', 'bank-pending', 'bank-favorites'].forEach((id) => {
    document.querySelector(`#${id}`).addEventListener('input', renderList);
    document.querySelector(`#${id}`).addEventListener('change', renderList);
  });
  renderList();
}

function renderHistory() {
  main.innerHTML = `
    ${pageHeader('Historial', 'Cada test conserva su modalidad, resultado y preguntas utilizadas.')}
    <section class="list">
      ${data.attempts.length ? data.attempts.map((attempt) => `
        <article class="list-item">
          <div class="list-item-header">
            <div>
              <h3>${escapeHtml(modeLabel(attempt.mode))} · ${attempt.question_ids.length} preguntas</h3>
              <div class="meta">
                <span class="badge">${formatDate(attempt.finished_at)}</span>
                <span class="badge success">${attempt.correct} aciertos</span>
                <span class="badge danger">${attempt.incorrect} fallos</span>
                <span class="badge warning">${attempt.omitted} omitidas</span>
                <span class="badge">Puntuación ${formatScore(attempt.score)}</span>
              </div>
            </div>
            <button class="button secondary" type="button" data-repeat-attempt="${escapeAttribute(attempt.id)}">Repetir</button>
          </div>
        </article>`).join('') : '<div class="empty-state">Todavía no has realizado ningún test.</div>'}
    </section>`;
}

function modeLabel(mode) {
  return ({ normal: 'Test normal', failed: 'Preguntas falladas', favorites: 'Favoritas', repeat: 'Repetición' })[mode] ?? mode;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

async function repeatAttempt(attemptId) {
  const attempt = data.attempts.find((item) => item.id === attemptId);
  if (!attempt) return;
  const questionsById = new Map(data.questions.map((question) => [question.id, question]));
  const questions = attempt.question_ids.map((id) => questionsById.get(id)).filter(Boolean);
  if (questions.length === 0) {
    showToast('Las preguntas de ese test ya no están disponibles.');
    return;
  }
  session = {
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString(),
    mode: 'repeat',
    topicIds: attempt.topic_ids ?? [],
    questions,
    index: 0,
    answers: {}
  };
  navigate('/test');
}

function renderData() {
  main.innerHTML = `
    ${pageHeader('Datos y configuración', 'Importa bancos JSON y conserva una copia de todo tu progreso.')}
    <section class="data-actions">
      <article class="card">
        <h2>Importar banco</h2>
        <p>Añade preguntas desde un archivo compatible. Los identificadores existentes se omiten.</p>
        <label class="button primary" for="bank-file">Seleccionar JSON</label>
        <input class="file-input" id="bank-file" type="file" accept="application/json,.json">
      </article>
      <article class="card">
        <h2>Demostración</h2>
        <p>Carga cuatro preguntas ficticias para probar la aplicación. No sirven como material de estudio.</p>
        <button class="button secondary" id="load-demo" type="button">Cargar demostración</button>
      </article>
      <article class="card">
        <h2>Copia de seguridad</h2>
        <p>Incluye preguntas, temas, historial, falladas, favoritas y configuración.</p>
        <div class="hero-actions">
          <button class="button secondary" id="export-backup" type="button">Exportar</button>
          <label class="button secondary" for="restore-file">Restaurar</label>
          <input class="file-input" id="restore-file" type="file" accept="application/json,.json">
        </div>
      </article>
    </section>

    <section class="card" style="margin-top:1rem">
      <h2>Preferencias del test</h2>
      <form id="settings-form" class="grid two">
        <label class="field">
          <span>Número habitual de preguntas</span>
          <input name="default_question_count" type="number" min="1" max="500" value="${Number(settings.default_question_count) || 20}">
        </label>
        <label class="field">
          <span>Penalización por fallo</span>
          <input name="penalty_per_wrong" type="number" min="0" step="0.01" value="${Number(settings.penalty_per_wrong) || 0}">
          <small>Ejemplo: 0,33 resta un tercio de punto por cada fallo.</small>
        </label>
        <div><button class="button primary" type="submit">Guardar preferencias</button></div>
      </form>
    </section>

    <section id="import-report" style="margin-top:1rem"></section>`;

  document.querySelector('#bank-file').addEventListener('change', handleBankFile);
  document.querySelector('#restore-file').addEventListener('change', handleRestoreFile);
  document.querySelector('#load-demo').addEventListener('click', loadDemoBank);
  document.querySelector('#export-backup').addEventListener('click', exportBackupFile);
  document.querySelector('#settings-form').addEventListener('submit', handleSettings);
}

async function handleBankFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    const report = await importBank(payload);
    data = await loadStudyData();
    renderImportReport(report);
    showToast(`${report.imported} preguntas importadas.`);
  } catch (error) {
    renderImportError(error);
  } finally {
    event.target.value = '';
  }
}

async function loadDemoBank() {
  try {
    const response = await fetch('./samples/demo-bank.json');
    if (!response.ok) throw new Error('No se pudo leer el banco de demostración.');
    const report = await importBank(await response.json());
    data = await loadStudyData();
    renderImportReport(report);
    showToast(`${report.imported} preguntas de demostración importadas.`);
  } catch (error) {
    renderImportError(error);
  }
}

function renderImportReport(report) {
  const container = document.querySelector('#import-report');
  if (!container) return;
  container.innerHTML = `
    <article class="card">
      <h2>Resultado de importación</h2>
      <div class="grid cards">
        ${statCard(report.processed ?? 0, 'Procesadas')}
        ${statCard(report.imported, 'Importadas')}
        ${statCard(report.duplicates.length, 'Duplicadas')}
        ${statCard(report.rejected.length, 'Rechazos')}
      </div>
      ${report.duplicates.length ? `<h3>Duplicadas omitidas</h3><div class="code-block">${escapeHtml(report.duplicates.join('\n'))}</div>` : ''}
      ${report.rejected.length ? `<h3>Problemas detectados</h3><div class="code-block">${escapeHtml(report.rejected.map((item) => `${item.path}: ${item.message}`).join('\n'))}</div>` : ''}
    </article>`;
}

function renderImportError(error) {
  const container = document.querySelector('#import-report');
  if (container) container.innerHTML = `<div class="notice danger"><strong>No se pudo importar:</strong> ${escapeHtml(error.message)}</div>`;
  showToast('El archivo no se pudo importar.');
}

async function exportBackupFile() {
  const backup = await createBackup();
  downloadJson(`oppostest-backup-${new Date().toISOString().slice(0, 10)}.json`, backup);
  showToast('Copia de seguridad preparada.');
}

async function handleRestoreFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const payload = JSON.parse(await file.text());
    if (!window.confirm('La restauración sustituirá todos los datos actuales de este dispositivo. ¿Continuar?')) return;
    await restoreBackup(payload);
    [data, settings] = await Promise.all([loadStudyData(), getSettings()]);
    showToast('Copia restaurada correctamente.');
    renderData();
  } catch (error) {
    renderImportError(error);
  } finally {
    event.target.value = '';
  }
}

async function handleSettings(event) {
  event.preventDefault();
  const values = Object.fromEntries(new FormData(event.currentTarget));
  settings = await saveSettings({
    default_question_count: Math.max(1, Number(values.default_question_count) || 20),
    penalty_per_wrong: Math.max(0, Number(values.penalty_per_wrong) || 0)
  });
  showToast('Preferencias guardadas.');
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

async function handleGlobalClick(event) {
  const favoriteButton = event.target.closest('[data-favorite-id]');
  if (favoriteButton) {
    await toggleFavorite(favoriteButton.dataset.favoriteId);
    data = await loadStudyData();
    renderBank();
    return;
  }

  const repeatButton = event.target.closest('[data-repeat-attempt]');
  if (repeatButton) {
    await repeatAttempt(repeatButton.dataset.repeatAttempt);
  }
}

function pageHeader(title, description) {
  return `<header class="page-header"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></header>`;
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, '&#96;');
}
