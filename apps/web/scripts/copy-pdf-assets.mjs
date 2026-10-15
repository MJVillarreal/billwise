import { cpSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';

const pdfjsDir = dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'));
const target = resolve(import.meta.dirname, '../public/pdfjs');

mkdirSync(target, { recursive: true });
cpSync(resolve(pdfjsDir, 'legacy/build/pdf.worker.min.mjs'), resolve(target, 'pdf.worker.min.mjs'));
cpSync(resolve(pdfjsDir, 'standard_fonts'), resolve(target, 'standard_fonts'), { recursive: true });
