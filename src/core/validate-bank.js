const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

export function validateBank(payload) {
  const errors = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { ok: false, errors: [{ path: '$', message: 'El contenido debe ser un objeto JSON.' }], bank: null, topics: [], questions: [] };
  }

  if (payload.schema_version !== 1) {
    errors.push({ path: 'schema_version', message: 'La versión compatible es 1.' });
  }

  if (!payload.bank || !isNonEmptyString(payload.bank.id) || !isNonEmptyString(payload.bank.name)) {
    errors.push({ path: 'bank', message: 'El banco debe incluir id y name.' });
  }

  const topics = Array.isArray(payload.topics) ? payload.topics : [];
  const questions = Array.isArray(payload.questions) ? payload.questions : [];

  if (!Array.isArray(payload.topics)) {
    errors.push({ path: 'topics', message: 'Debe ser una lista.' });
  }
  if (!Array.isArray(payload.questions)) {
    errors.push({ path: 'questions', message: 'Debe ser una lista.' });
  }

  const topicIds = new Set();
  topics.forEach((topic, index) => {
    const path = `topics[${index}]`;
    if (!topic || !isNonEmptyString(topic.id) || !isNonEmptyString(topic.name)) {
      errors.push({ path, message: 'Cada tema debe incluir id y name.' });
      return;
    }
    if (topicIds.has(topic.id)) {
      errors.push({ path: `${path}.id`, message: `Tema duplicado: ${topic.id}.` });
    }
    topicIds.add(topic.id);
  });

  topics.forEach((topic, index) => {
    if (topic?.parent_id != null && !topicIds.has(topic.parent_id)) {
      errors.push({ path: `topics[${index}].parent_id`, message: `El tema padre ${topic.parent_id} no existe.` });
    }
  });

  const questionIds = new Set();
  const validQuestions = [];
  questions.forEach((question, index) => {
    const path = `questions[${index}]`;
    const questionErrors = [];

    if (!question || !isNonEmptyString(question.id)) {
      questionErrors.push({ path: `${path}.id`, message: 'La pregunta debe tener un id.' });
    } else if (questionIds.has(question.id)) {
      questionErrors.push({ path: `${path}.id`, message: `Pregunta repetida dentro del archivo: ${question.id}.` });
    } else {
      questionIds.add(question.id);
    }

    if (!isNonEmptyString(question?.statement)) {
      questionErrors.push({ path: `${path}.statement`, message: 'La pregunta debe tener enunciado.' });
    }

    const options = Array.isArray(question?.options) ? question.options : [];
    if (options.length < 2) {
      questionErrors.push({ path: `${path}.options`, message: 'La pregunta debe tener al menos dos opciones.' });
    }

    const optionIds = new Set();
    options.forEach((option, optionIndex) => {
      const optionPath = `${path}.options[${optionIndex}]`;
      if (!option || !isNonEmptyString(option.id) || !isNonEmptyString(option.text)) {
        questionErrors.push({ path: optionPath, message: 'Cada opción debe incluir id y text.' });
        return;
      }
      if (optionIds.has(option.id)) {
        questionErrors.push({ path: `${optionPath}.id`, message: `Opción duplicada: ${option.id}.` });
      }
      optionIds.add(option.id);
    });

    if (!isNonEmptyString(question?.correct_option_id) || !optionIds.has(question.correct_option_id)) {
      questionErrors.push({ path: `${path}.correct_option_id`, message: 'La respuesta correcta no coincide con ninguna opción.' });
    }

    const questionTopicIds = Array.isArray(question?.topic_ids) ? question.topic_ids : [];
    if (questionTopicIds.length === 0) {
      questionErrors.push({ path: `${path}.topic_ids`, message: 'La pregunta debe pertenecer al menos a un tema.' });
    } else {
      questionTopicIds.forEach((topicId) => {
        if (!topicIds.has(topicId)) {
          questionErrors.push({ path: `${path}.topic_ids`, message: `El tema ${topicId} no existe.` });
        }
      });
    }

    if (question?.is_annulled === true) {
      questionErrors.push({ path: `${path}.is_annulled`, message: 'La pregunta está anulada y no se importará.' });
    }

    errors.push(...questionErrors);
    if (questionErrors.length === 0) {
      validQuestions.push(normalizeQuestion(question, payload.bank.id));
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    bank: payload.bank ? { ...payload.bank, schema_version: 1 } : null,
    topics: topics.filter((topic) => topic && isNonEmptyString(topic.id) && isNonEmptyString(topic.name)),
    questions: validQuestions
  };
}

function normalizeQuestion(question, bankId) {
  return {
    id: question.id.trim(),
    statement: question.statement.trim(),
    options: question.options.map((option) => ({ id: option.id.trim(), text: option.text.trim() })),
    correct_option_id: question.correct_option_id.trim(),
    topic_ids: [...new Set(question.topic_ids)],
    bank_id: bankId,
    source: question.source ?? null,
    explanation: question.explanation ?? null,
    legal_reference: question.legal_reference ?? null,
    notes: question.notes ?? null,
    is_annulled: false
  };
}
