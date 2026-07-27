import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTest, calculateResult, descendantTopicIds } from '../src/core/quiz-engine.js';

const topics = [
  { id: 'informatica', name: 'Informática', parent_id: null },
  { id: 'redes', name: 'Redes', parent_id: 'informatica' }
];
const questions = [
  { id: 'q1', topic_ids: ['redes'], correct_option_id: 'A' },
  { id: 'q2', topic_ids: ['otro'], correct_option_id: 'B' }
];

test('seleccionar un padre incluye sus descendientes', () => {
  assert.deepEqual([...descendantTopicIds(topics, ['informatica'])].sort(), ['informatica', 'redes']);
});

test('filtra preguntas falladas por tema', () => {
  const progress = new Map([['q1', { pending_review: true }], ['q2', { pending_review: true }]]);
  const result = buildTest({ questions, topics, progressByQuestion: progress, selectedTopicIds: ['informatica'], mode: 'failed', count: 10, random: () => 0.5 });
  assert.deepEqual(result.questions.map((question) => question.id), ['q1']);
});

test('calcula aciertos, fallos, omisiones y penalización', () => {
  const result = calculateResult({
    questions: [
      { id: 'q1', correct_option_id: 'A' },
      { id: 'q2', correct_option_id: 'B' },
      { id: 'q3', correct_option_id: 'C' }
    ],
    answers: { q1: 'A', q2: 'A' },
    penalty: 0.33
  });
  assert.equal(result.correct, 1);
  assert.equal(result.incorrect, 1);
  assert.equal(result.omitted, 1);
  assert.equal(result.score, 0.67);
});
