import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBank } from '../src/core/validate-bank.js';

const validPayload = {
  schema_version: 1,
  bank: { id: 'test', name: 'Banco' },
  topics: [{ id: 'tema', name: 'Tema', parent_id: null }],
  questions: [{
    id: 'q-1',
    statement: 'Pregunta',
    options: [{ id: 'A', text: 'Sí' }, { id: 'B', text: 'No' }],
    correct_option_id: 'A',
    topic_ids: ['tema'],
    is_annulled: false
  }]
};

test('acepta un banco válido', () => {
  const result = validateBank(validPayload);
  assert.equal(result.ok, true);
  assert.equal(result.questions.length, 1);
  assert.equal(result.questions[0].bank_id, 'test');
});

test('rechaza una respuesta correcta inexistente', () => {
  const payload = structuredClone(validPayload);
  payload.questions[0].correct_option_id = 'C';
  const result = validateBank(payload);
  assert.equal(result.ok, false);
  assert.match(result.errors.map((error) => error.message).join(' '), /respuesta correcta/i);
});

test('rechaza una pregunta sin tema', () => {
  const payload = structuredClone(validPayload);
  payload.questions[0].topic_ids = [];
  const result = validateBank(payload);
  assert.equal(result.ok, false);
  assert.match(result.errors.map((error) => error.message).join(' '), /al menos a un tema/i);
});
