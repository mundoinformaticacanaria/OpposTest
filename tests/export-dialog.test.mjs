import test from 'node:test';
import assert from 'node:assert/strict';
import { exportDialogMarkup, loadDialogMarkup } from '../src/ui/export-data.js';

test('el modal de carga distingue banco y copia completa', () => {
  const markup = loadDialogMarkup();

  assert.match(markup, /id="load-data-dialog"/);
  assert.match(markup, /Importar banco de preguntas/);
  assert.match(markup, /Restaurar copia completa/);
  assert.match(markup, /id="select-bank-file"/);
  assert.match(markup, /id="select-restore-file"/);
  assert.match(markup, /sin borrar tu historial ni tu progreso/i);
  assert.match(markup, /Se solicitará confirmación/i);
  assert.equal((markup.match(/<section class="data-choice">/g) ?? []).length, 2);
});

test('el modal de copia mantiene las dos descargas', () => {
  const markup = exportDialogMarkup();

  assert.match(markup, /id="export-data-dialog"/);
  assert.match(markup, /Copia completa/);
  assert.match(markup, /Banco de preguntas/);
  assert.match(markup, /id="complete-export-slot"/);
  assert.match(markup, /id="export-shareable-bank"/);
  assert.equal((markup.match(/<section class="data-choice">/g) ?? []).length, 2);
});

test('ambos modales están etiquetados y tienen cierre visible', () => {
  for (const markup of [loadDialogMarkup(), exportDialogMarkup()]) {
    assert.match(markup, /aria-labelledby=/);
    assert.match(markup, /aria-label="Cerrar"/);
  }
});
