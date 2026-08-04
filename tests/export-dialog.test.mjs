import test from 'node:test';
import assert from 'node:assert/strict';
import { exportDialogMarkup } from '../src/ui/export-data.js';

test('el modal agrupa las dos exportaciones acordadas', () => {
  const markup = exportDialogMarkup();

  assert.match(markup, /<dialog[^>]+id="export-data-dialog"/);
  assert.match(markup, /aria-labelledby="export-data-title"/);
  assert.match(markup, /Copia completa/);
  assert.match(markup, /Banco de preguntas/);
  assert.match(markup, /id="complete-export-slot"/);
  assert.match(markup, /id="export-shareable-bank"/);
  assert.match(markup, /aria-label="Cerrar"/);
  assert.equal((markup.match(/<section class="export-choice">/g) ?? []).length, 2);
});

test('el modal distingue la copia privada del banco compartible', () => {
  const markup = exportDialogMarkup();

  assert.match(markup, /historial, progreso, falladas, favoritas y configuración/i);
  assert.match(markup, /sin historial, progreso ni configuración personal/i);
});
