import { isValidCuit } from '@billwise/shared';
import { describe, expect, it } from 'vitest';
import { sampleInvoices } from './invoices.js';
import { computeTotals } from './totals.js';

const byId = (id: string) => {
  const invoice = sampleInvoices.find((sample) => sample.id === id);
  if (!invoice) throw new Error(`Missing sample ${id}`);
  return invoice;
};

describe('sample invoices', () => {
  it('have unique ids', () => {
    const ids = sampleInvoices.map((invoice) => invoice.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('use valid CUITs except in the invalid CUIT scenario', () => {
    for (const invoice of sampleInvoices) {
      const expectsInvalid = invoice.expectedIssues.includes('invalid_cuit');
      expect(isValidCuit(invoice.issuer.cuit)).toBe(!expectsInvalid);
      if (invoice.recipient.docType === 80)
        expect(isValidCuit(invoice.recipient.docNumber)).toBe(true);
    }
  });

  it('only print a different total in the total mismatch scenario', () => {
    for (const invoice of sampleInvoices) {
      const printed = invoice.printed?.total ?? computeTotals(invoice).total;
      const mismatch = printed !== computeTotals(invoice).total;
      expect(mismatch).toBe(invoice.expectedIssues.includes('total_mismatch'));
    }
  });

  it('only print a different number than the QR in the QR mismatch scenario', () => {
    for (const invoice of sampleInvoices) {
      const mismatch =
        invoice.printed?.number !== undefined && invoice.printed.number !== invoice.number;
      expect(mismatch).toBe(invoice.expectedIssues.includes('qr_mismatch'));
    }
  });

  it('repeat the voucher key of the valid A invoice in the duplicate scenario', () => {
    const key = (id: string) => {
      const { issuer, letter, pointOfSale, number } = byId(id);
      return [issuer.cuit, letter, pointOfSale, number].join('|');
    };
    expect(key('invoice-a-duplicate')).toBe(key('invoice-a-valid'));
  });

  it('compute A invoice totals with IVA per rate and other taxes', () => {
    const totals = computeTotals(byId('invoice-a-valid'));
    expect(totals.netTaxed).toBe(400000);
    expect(totals.ivaByRate).toEqual({ 21: 57162, 10.5: 13419 });
    expect(totals.otherTaxesTotal).toBe(8000);
    expect(totals.total).toBe(478581);
  });

  it('compute the IVA contained in B invoices', () => {
    const totals = computeTotals(byId('invoice-b-final-consumer'));
    expect(totals.total).toBe(73810);
    expect(totals.ivaContained).toBe(12810);
  });
});
