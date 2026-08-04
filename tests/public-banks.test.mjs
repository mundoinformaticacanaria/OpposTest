import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateBank } from '../src/core/validate-bank.js';
import { loadDialogMarkup } from '../src/ui/export-data.js';

const publicBanks = [
  { file: 'banks/gobcan-a1-ti-2026.json', questions: 86 },
  { file: 'banks/gobcan-a2-ti-2026.json', questions: 86 },
  { file: 'banks/scs-a1-informatica-estabilizacion-2022.json', questions: 600 },
  { file: 'banks/scs-a2-informatica-estabilizacion-2022.json', questions: 540 }
];

for (const bank of publicBanks) {
  test(`${bank.file} es importable por OpposTest`, () => {
    const payload = JSON.parse(readFileSync(bank.file, 'utf8'));
    const result = validateBank(payload);

    assert.equal(result.ok, true, JSON.stringify(result.errors, null, 2));
    assert.equal(result.questions.length, bank.questions);
    assert.equal(payload.questions.length, bank.questions);
    assert.equal('progress' in payload, false);
    assert.equal('attempts' in payload, false);
    assert.equal('settings' in payload, false);
  });
}

test('los bancos públicos reúnen 1.312 preguntas', () => {
  const total = publicBanks.reduce((sum, bank) => {
    const payload = JSON.parse(readFileSync(bank.file, 'utf8'));
    return sum + payload.questions.length;
  }, 0);

  assert.equal(total, 1312);
});

test('el modal de carga enlaza el catálogo público de GitHub', () => {
  const markup = loadDialogMarkup();

  assert.match(markup, /github\.com\/mundoinformaticacanaria\/OpposTest\/tree\/main\/banks/);
  assert.match(markup, /Descarga bancos públicos desde GitHub/);
  assert.match(markup, /target="_blank"/);
  assert.match(markup, /rel="noopener noreferrer"/);
});
