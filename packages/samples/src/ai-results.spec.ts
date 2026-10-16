import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { aiExtractionToInvoice, processExtractedInvoice } from '@billwise/shared';
import { describe, expect, it } from 'vitest';
import { sampleInvoices } from './invoices.js';
import { printedInvoice } from './manifest.js';
import { computeTotals } from './totals.js';

const photoSamples = sampleInvoices.filter((invoice) => invoice.photo);

describe('stored AI results', () => {
  it('exist for every photo sample', () => {
    expect(photoSamples.length).toBeGreaterThan(0);
  });

  it.each(photoSamples)('$id matches the invoice it was read from', (invoice) => {
    const stored = JSON.parse(
      readFileSync(resolve(import.meta.dirname, `../ai-results/${invoice.id}.json`), 'utf8'),
    );
    const data = aiExtractionToInvoice(stored.answer);
    const expected = printedInvoice(invoice, computeTotals(invoice));

    expect({ ...data, nonTaxed: null, exempt: null }).toEqual(expected);
    expect(processExtractedInvoice(data, null, { today: '2026-10-16' }).issues).toEqual([]);
  });
});
