import { exportAllStores, getAll, getOne, openDatabase, putOne, replaceAllStores, runTransaction } from './db.js';
import { validateBank } from '../core/validate-bank.js';

export async function importBank(payload) {
  const validation = validateBank(payload);
  const fatalErrors = validation.errors.filter((error) => !error.path.startsWith('questions['));
  if (!validation.bank || fatalErrors.length > 0) {
    return {
      imported: 0,
      duplicates: [],
      rejected: validation.errors,
      bank: validation.bank,
      processed: Array.isArray(payload?.questions) ? payload.questions.length : 0
    };
  }

  const result = await runTransaction(['banks', 'topics', 'questions'], async (stores, requestToPromise) => {
    const duplicates = [];
    const importedIds = [];

    stores.banks.put({ ...validation.bank, imported_at: new Date().toISOString() });
    validation.topics.forEach((topic) => stores.topics.put(topic));

    for (const question of validation.questions) {
      const existing = await requestToPromise(stores.questions.get(question.id));
      if (existing) {
        duplicates.push(question.id);
      } else {
        stores.questions.put(question);
        importedIds.push(question.id);
      }
    }

    return { duplicates, importedIds };
  });

  return {
    bank: validation.bank,
    imported: result.importedIds.length,
    duplicates: result.duplicates,
    rejected: validation.errors,
    processed: Array.isArray(payload.questions) ? payload.questions.length : 0
  };
}

export async function loadStudyData() {
  await openDatabase();
  const [banks, topics, questions, progress, attempts] = await Promise.all([
    getAll('banks'),
    getAll('topics'),
    getAll('questions'),
    getAll('progress'),
    getAll('attempts')
  ]);
  return {
    banks,
    topics,
    questions,
    progress,
    attempts: attempts.sort((a, b) => b.finished_at.localeCompare(a.finished_at))
  };
}

export async function getSettings() {
  const stored = await getOne('settings', 'preferences');
  return {
    key: 'preferences',
    default_question_count: 20,
    penalty_per_wrong: 0,
    ...stored
  };
}

export async function saveSettings(settings) {
  return putOne('settings', { ...settings, key: 'preferences' });
}

export async function toggleFavorite(questionId) {
  const existing = (await getOne('progress', questionId)) ?? emptyProgress(questionId);
  existing.favorite = !existing.favorite;
  await putOne('progress', existing);
  return existing.favorite;
}

export async function saveAttempt({ id, startedAt, mode, topicIds, questions, answers, result }) {
  const finishedAt = new Date().toISOString();
  const attempt = {
    id,
    started_at: startedAt,
    finished_at: finishedAt,
    mode,
    topic_ids: topicIds,
    question_ids: questions.map((question) => question.id),
    answers,
    correct: result.correct,
    incorrect: result.incorrect,
    omitted: result.omitted,
    score: result.score,
    penalty: result.penalty
  };

  await runTransaction(['attempts', 'progress'], async (stores, requestToPromise) => {
    stores.attempts.put(attempt);
    for (const detail of result.details) {
      const progress = (await requestToPromise(stores.progress.get(detail.question_id))) ?? emptyProgress(detail.question_id);
      progress.times_shown += 1;
      progress.last_answered_at = finishedAt;
      if (detail.status === 'correct') {
        progress.correct_count += 1;
        if (mode === 'failed') progress.pending_review = false;
      } else if (detail.status === 'incorrect') {
        progress.incorrect_count += 1;
        progress.pending_review = true;
        progress.last_failed_at = finishedAt;
      } else {
        progress.omitted_count += 1;
      }
      stores.progress.put(progress);
    }
  });

  return attempt;
}

function emptyProgress(questionId) {
  return {
    question_id: questionId,
    times_shown: 0,
    correct_count: 0,
    incorrect_count: 0,
    omitted_count: 0,
    last_answered_at: null,
    last_failed_at: null,
    pending_review: false,
    favorite: false
  };
}

export async function createBackup() {
  return {
    backup_schema_version: 1,
    app: 'OpposTest',
    created_at: new Date().toISOString(),
    data: await exportAllStores()
  };
}

export async function restoreBackup(payload) {
  if (!payload || payload.app !== 'OpposTest' || payload.backup_schema_version !== 1 || !payload.data) {
    throw new Error('El archivo no es una copia de seguridad compatible de OpposTest.');
  }
  await replaceAllStores(payload.data);
}
