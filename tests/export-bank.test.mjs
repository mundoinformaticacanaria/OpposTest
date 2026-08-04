import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareableBank, shareableBankFilename } from '../src/core/export-bank.js';
import { validateBank } from '../src/core/validate-bank.js';

const topics = [
  { id: 'informatica', name: 'Informática', parent_id: null },
  { id: 'redes', name: 'Redes', parent_id: 'informatica' }
];

const questions = [{
  id: 'demo-q001',
  statement: '¿Qué protocolo se usa para resolver nombres de dominio?',
  options: [
    { id: 'A', text: 'DNS' },
    { id: 'B', text: 'HTTP' }
  ],
  correct_option_id: 'A',
  topic_ids: ['redes'],
  bank_id: 'banco-privado',
  source: null,
  explanation: null,
  legal_reference: null,
  notes: null,
  is_annulled: false
}];

const now = new Date('2026-08-04T08:15:30.000Z');

test('genera un banco compartible válido con todas las preguntas y temas', () => {
  const bank = buildShareableBank({ topics, questions, now });
  const validation = validateBank(bank);

  assert.equal(validation.ok, true);
  assert.equal(bank.schema_version, 1);
  assert.equal(bank.bank.id, 'oppostest-export-2026-08-04');
  assert.equal(bank.bank.name, 'Banco exportado de OpposTest');
  assert.equal(bank.topics.length, 2);
  assert.equal(bank.questions.length, 1);
  assert.equal(bank.questions[0].bank_id, undefined);
});

test('no incluye estructuras de copia privada', () => {
  const bank = buildShareableBank({ topics, questions, now });

  for (const privateKey of ['data', 'banks', 'progress', 'attempts', 'settings']) {
    assert.equal(Object.hasOwn(bank, privateKey), false);
  }
});

test('genera el nombre de archivo acordado', () => {
  assert.equal(shareableBankFilename(now), 'oppostest-bank-2026-08-04.json');
});

test('impide exportar un banco vacío', () => {
  assert.throws(
    () => buildShareableBank({ topics, questions: [], now }),
    /No hay preguntas cargadas/i
  );
});

test('impide exportar datos que no forman un banco válido', () => {
  assert.throws(
    () => buildShareableBank({ topics: [], questions, now }),
    /No se puede generar un banco compatible/i
  );
});
