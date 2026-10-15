import { reconcileWithQr, validateInvoice, voucherKey } from '@billwise/shared';
import { describe, expect, it } from 'vitest';
import { buildHistory } from './history.js';
import { sampleInvoices } from './invoices.js';
import { printedInvoice, qrPayload } from './manifest.js';
import { computeTotals } from './totals.js';

describe('invoice history', () => {
  const history = buildHistory();

  it('is the same on every run', () => {
    expect(buildHistory()).toEqual(history);
  });

  it('spans six months up to the current one', () => {
    const months = new Set(history.map((entry) => entry.data.issueDate?.slice(0, 7)));
    expect([...months].sort()).toEqual([
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
      '2026-10',
    ]);
  });

  it('leaves two invoices to review and one with an error', () => {
    const results = history.map((entry) => validateInvoice(entry.data, { today: '2026-10-15' }));
    const codes = results.flatMap((result) => result.issues.map((issue) => issue.code)).sort();
    expect(codes).toEqual(['missing', 'missing', 'total_mismatch']);
  });

  it('never shares a voucher key with the gallery samples', () => {
    const historyKeys = new Set(history.map((entry) => voucherKey(entry.data)));
    for (const invoice of sampleInvoices) {
      const totals = computeTotals(invoice);
      const data = reconcileWithQr(
        printedInvoice(invoice, totals),
        qrPayload(invoice, totals),
      ).data;
      expect(historyKeys.has(voucherKey(data))).toBe(false);
    }
  });
});
