import { reconcileWithQr, validateInvoice, voucherKey } from '@billwise/shared';
import { describe, expect, it } from 'vitest';
import { sampleInvoices } from './invoices.js';
import { printedInvoice, qrPayload } from './manifest.js';
import { computeTotals } from './totals.js';

describe('validation over the sample invoices', () => {
  const loadedKeys = new Set<string>();
  const results = sampleInvoices.map((invoice) => {
    const totals = computeTotals(invoice);
    const reconciled = reconcileWithQr(printedInvoice(invoice, totals), qrPayload(invoice, totals));
    const validation = validateInvoice(reconciled.data, {
      today: '2026-10-15',
      existingKeys: loadedKeys,
    });
    const key = voucherKey(reconciled.data);
    if (key) loadedKeys.add(key);

    const codes = new Set([...reconciled.issues, ...validation.issues].map((issue) => issue.code));
    return { invoice, codes, data: reconciled.data };
  });

  it.each(results)('$invoice.id finds exactly its expected issues', ({ invoice, codes }) => {
    expect([...codes].sort()).toEqual([...invoice.expectedIssues].sort());
  });

  it('takes the voucher number from the QR when the printed one differs', () => {
    const qrMismatch = results.find(({ invoice }) => invoice.id === 'invoice-qr-mismatch');
    expect(qrMismatch?.data.number).toBe('00000872');
  });
});
