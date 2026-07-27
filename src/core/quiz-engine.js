export function shuffle(items, random = Math.random) {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [output[index], output[swapIndex]] = [output[swapIndex], output[index]];
  }
  return output;
}

export function descendantTopicIds(topics, selectedIds) {
  const selected = new Set(selectedIds);
  let changed = true;
  while (changed) {
    changed = false;
    topics.forEach((topic) => {
      if (topic.parent_id && selected.has(topic.parent_id) && !selected.has(topic.id)) {
        selected.add(topic.id);
        changed = true;
      }
    });
  }
  return selected;
}

export function filterQuestions({ questions, topics, progressByQuestion, selectedTopicIds = [], mode = 'normal' }) {
  const expandedTopics = descendantTopicIds(topics, selectedTopicIds);

  return questions.filter((question) => {
    const matchesTopic = expandedTopics.size === 0 || question.topic_ids.some((topicId) => expandedTopics.has(topicId));
    if (!matchesTopic) return false;

    const progress = progressByQuestion.get(question.id);
    if (mode === 'failed') return progress?.pending_review === true;
    if (mode === 'favorites') return progress?.favorite === true;
    return true;
  });
}

export function buildTest(options) {
  const available = filterQuestions(options);
  const requestedCount = Math.max(1, Number(options.count) || 1);
  const selected = shuffle(available, options.random).slice(0, requestedCount);
  return {
    questions: selected,
    availableCount: available.length,
    requestedCount,
    reduced: selected.length < requestedCount
  };
}

export function calculateResult({ questions, answers, penalty = 0 }) {
  let correct = 0;
  let incorrect = 0;
  let omitted = 0;
  const details = questions.map((question) => {
    const selectedOptionId = answers[question.id] ?? null;
    let status = 'omitted';
    if (selectedOptionId == null) {
      omitted += 1;
    } else if (selectedOptionId === question.correct_option_id) {
      correct += 1;
      status = 'correct';
    } else {
      incorrect += 1;
      status = 'incorrect';
    }
    return {
      question_id: question.id,
      selected_option_id: selectedOptionId,
      correct_option_id: question.correct_option_id,
      status
    };
  });

  const safePenalty = Number.isFinite(Number(penalty)) ? Math.max(0, Number(penalty)) : 0;
  return {
    correct,
    incorrect,
    omitted,
    score: Number((correct - incorrect * safePenalty).toFixed(4)),
    penalty: safePenalty,
    details
  };
}
