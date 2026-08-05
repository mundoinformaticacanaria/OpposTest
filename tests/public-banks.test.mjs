import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateBank } from '../src/core/validate-bank.js';

const specs = [
  ['banks/gobcan-a1-ti-l26-2026.json', 86],
  ['banks/gobcan-a2-tinl26-2026.json', 86],
  ['banks/scs-a1-informatica-estabilizacion-2022.json', 600],
  ['banks/scs-ttm-informatica-estabilizacion-2022.json', 540]
];

const forbiddenKeys = new Set([
  'attempts', 'history', 'progress', 'favorites', 'favourites', 'failed',
  'settings', 'preferences', 'answers', 'user_answers', 'study_data'
]);

function findForbiddenKeys(value, path = '$', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => findForbiddenKeys(item, `${path}[${index}]`, findings));
    return findings;
  }
  if (!value || typeof value !== 'object') return findings;
  for (const [key, child] of Object.entries(value)) {
    if (forbiddenKeys.has(key.toLowerCase())) findings.push(`${path}.${key}`);
    findForbiddenKeys(child, `${path}.${key}`, findings);
  }
  return findings;
}

test('los bancos públicos son válidos, independientes y suman 1.312 preguntas', async () => {
  const globalIds = new Set();
  let total = 0;

  for (const [filename, expectedQuestions] of specs) {
    const bank = JSON.parse(await readFile(filename, 'utf8'));
    const validation = validateBank(bank);
    assert.deepEqual(validation.errors, [], `${filename}: ${validation.errors?.join('; ')}`);
    assert.equal(bank.questions.length, expectedQuestions, filename);
    assert.ok(bank.topics.length > 0, filename);
    assert.equal(findForbiddenKeys(bank).length, 0, filename);

    const topicIds = new Set(bank.topics.map((topic) => topic.id));
    for (const question of bank.questions) {
      assert.ok(!question.id.startsWith('demo-'), question.id);
      assert.ok(!globalIds.has(question.id), `Identificador duplicado: ${question.id}`);
      globalIds.add(question.id);
      for (const topicId of question.topic_ids) {
        assert.ok(topicIds.has(topicId), `${question.id} referencia el tema inexistente ${topicId}`);
      }
    }
    total += bank.questions.length;
  }

  assert.equal(total, 1312);
});
