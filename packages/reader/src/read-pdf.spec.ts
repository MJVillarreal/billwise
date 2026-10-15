import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import {
  type ArcaQrData,
  type InvoiceData,
  type ProcessResult,
  processInvoice,
  reconcileWithQr,
  voucherKey,
} from '@billwise/shared';
import { describe, expect, it } from 'vitest';
import { type ReadPdfResult, readPdf } from './read-pdf.js';

interface ManifestEntry {
  id: string;
  file: string;
  expectedIssues: string[];
  printed: InvoiceData;
  qr: ArcaQrData;
}

const SAMPLES_DIR = resolve(import.meta.dirname, '../../../apps/web/public/samples');
const standardFontDataUrl = `${dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'))}/standard_fonts/`;
const manifest: ManifestEntry[] = JSON.parse(
  readFileSync(resolve(SAMPLES_DIR, 'manifest.json'), 'utf8'),
);

const byRate = (data: InvoiceData) => ({
  ...data,
  iva: [...data.iva].sort((a, b) => a.rate - b.rate),
});

describe('reading the sample invoices', async () => {
  const loadedKeys = new Set<string>();
  const results: { entry: ManifestEntry; pdf: ReadPdfResult; result: ProcessResult }[] = [];
  for (const entry of manifest) {
    const pdf = await readPdf(new Uint8Array(readFileSync(resolve(SAMPLES_DIR, entry.file))), {
      standardFontDataUrl,
    });
    const result = processInvoice(pdf, { today: '2026-10-15', existingKeys: loadedKeys });
    const key = voucherKey(result.data);
    if (key) loadedKeys.add(key);
    results.push({ entry, pdf, result });
  }

  it.each(results)('$entry.id reads the QR', ({ entry, result }) => {
    expect(result.qr).toEqual(entry.qr);
  });

  it.each(results)('$entry.id extracts every field', ({ entry, result }) => {
    const expected = reconcileWithQr(entry.printed, entry.qr).data;
    expect(byRate(result.data)).toEqual(byRate(expected));
  });

  it.each(results)('$entry.id finds exactly its expected issues', ({ entry, result }) => {
    const codes = [...new Set(result.issues.map((issue) => issue.code))].sort();
    expect(codes).toEqual([...entry.expectedIssues].sort());
  });

  it.each(results)('$entry.id locates the total on the page', ({ result, pdf }) => {
    const box = result.locations.total;
    expect(box).toBeDefined();
    expect(box!.y).toBeGreaterThan(pdf.pages[0].height / 2);
  });

  it('ignores the rotated watermark', () => {
    const texts = results.flatMap(({ pdf }) => pdf.items.map((item) => item.text));
    expect(texts).not.toContain('SAMPLE / EJEMPLO');
  });
});
