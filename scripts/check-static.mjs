import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const requiredFiles = [
  'index.html',
  'styles.css',
  'styles/export-dialog.css',
  'manifest.webmanifest',
  'service-worker.js',
  'src/app.js',
  'src/core/export-bank.js',
  'src/core/quiz-engine.js',
  'src/core/validate-bank.js',
  'src/data/db.js',
  'src/data/repository.js',
  'src/ui/export-data.js',
  'samples/demo-bank.json',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png'
];

const missing = requiredFiles.filter((file) => !existsSync(resolve(file)));
if (missing.length) {
  console.error(`Faltan archivos: ${missing.join(', ')}`);
  process.exit(1);
}

JSON.parse(readFileSync('manifest.webmanifest', 'utf8'));
JSON.parse(readFileSync('samples/demo-bank.json', 'utf8'));
JSON.parse(readFileSync('bank.schema.json', 'utf8'));
console.log('Estructura estática y archivos JSON válidos.');
