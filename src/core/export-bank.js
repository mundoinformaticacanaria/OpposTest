import { validateBank } from './validate-bank.js';

const EXPORTED_BANK_NAME = 'Banco exportado de OpposTest';
const EXPORTED_BANK_DESCRIPTION = 'Banco compartible generado por OpposTest. No incluye historial, progreso, falladas, favoritas ni configuración.';

export function buildShareableBank({ topics, questions, now = new Date() }) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('No hay preguntas cargadas para exportar.');
  }
  if (!Array.isArray(topics)) {
    throw new Error('No se pueden exportar las preguntas porque la lista de temas no es válida.');
  }

  const instant = normalizeDate(now);
  const date = instant.toISOString().slice(0, 10);
  const payload = {
    schema_version: 1,
    bank: {
      id: `oppostest-export-${date}`,
      name: EXPORTED_BANK_NAME,
      generated_at: instant.toISOString(),
      description: EXPORTED_BANK_DESCRIPTION
    },
    topics: topics.map(cloneJsonValue),
    questions: questions.map((question) => {
      const exportedQuestion = cloneJsonValue(question);
      delete exportedQuestion.bank_id;
      return exportedQuestion;
    })
  };

  const validation = validateBank(payload);
  if (!validation.ok) {
    const details = validation.errors
      .slice(0, 3)
      .map((error) => `${error.path}: ${error.message}`)
      .join(' ');
    throw new Error(`No se puede generar un banco compatible. ${details}`);
  }

  return payload;
}

export function shareableBankFilename(now = new Date()) {
  return `oppostest-bank-${normalizeDate(now).toISOString().slice(0, 10)}.json`;
}

function normalizeDate(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('La fecha de exportación no es válida.');
  }
  return date;
}

function cloneJsonValue(value) {
  return JSON.parse(JSON.stringify(value));
}
