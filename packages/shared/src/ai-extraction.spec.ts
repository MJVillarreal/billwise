import { describe, expect, it } from 'vitest';
import { aiExtractionToInvoice } from './ai-extraction.js';
import { emptyInvoice } from './invoice.js';
import { processExtractedInvoice } from './process.js';

const answer = {
  voucherLetter: 'A',
  pointOfSale: '3',
  number: '12345',
  issueDate: '2026-09-30',
  issuerCuit: '30-71234567-1',
  issuerName: ' Distribuidora Ejemplo SRL ',
  recipientDocType: 'CUIT',
  recipientDocNumber: '20-12345678-6',
  recipientName: 'Cliente Ejemplo',
  currency: 'pes',
  netTaxed: 400000,
  nonTaxed: null,
  exempt: null,
  iva: [
    { rate: 21, amount: 57162 },
    { rate: 10.5, amount: 13419 },
    { rate: 27, amount: 0 },
  ],
  otherTaxes: 8000,
  total: 478581,
  cae: '76391245873016',
  caeDueDate: '2026-10-10',
};

describe('aiExtractionToInvoice', () => {
  it('maps the model answer to the invoice model', () => {
    expect(aiExtractionToInvoice(answer)).toEqual({
      voucherType: 1,
      pointOfSale: '00003',
      number: '00012345',
      issueDate: '2026-09-30',
      issuer: { cuit: '30712345671', name: 'Distribuidora Ejemplo SRL' },
      recipient: { docType: 80, docNumber: '20123456786', name: 'Cliente Ejemplo' },
      currency: 'PES',
      netTaxed: 400000,
      nonTaxed: null,
      exempt: null,
      iva: [
        { rate: 21, amount: 57162 },
        { rate: 10.5, amount: 13419 },
      ],
      otherTaxes: 8000,
      total: 478581,
      cae: '76391245873016',
      caeDueDate: '2026-10-10',
    });
  });

  it('drops malformed values instead of trusting them', () => {
    const data = aiExtractionToInvoice({
      ...answer,
      voucherLetter: 'X',
      issueDate: '30/09/2026',
      total: '478.581,00',
      iva: [{ rate: 19, amount: 100 }, 'nonsense'],
    });
    expect(data.voucherType).toBeNull();
    expect(data.issueDate).toBeNull();
    expect(data.total).toBeNull();
    expect(data.iva).toEqual([]);
  });

  it('turns currency symbols into ARCA codes', () => {
    expect(aiExtractionToInvoice({ ...answer, currency: '$' }).currency).toBe('PES');
    expect(aiExtractionToInvoice({ ...answer, currency: 'U$S' }).currency).toBe('DOL');
  });

  it('ignores the document number of a final consumer', () => {
    const data = aiExtractionToInvoice({
      ...answer,
      recipientDocType: 'FINAL_CONSUMER',
      recipientDocNumber: '0',
    });
    expect(data.recipient).toEqual({ docType: 99, docNumber: null, name: 'Cliente Ejemplo' });
  });

  it('returns an empty invoice for anything that is not an object', () => {
    expect(aiExtractionToInvoice(null)).toEqual(emptyInvoice());
    expect(aiExtractionToInvoice('invoice')).toEqual(emptyInvoice());
  });
});

describe('processExtractedInvoice', () => {
  it('validates extracted data like any other reading', () => {
    const data = aiExtractionToInvoice({ ...answer, total: 470000 });
    const result = processExtractedInvoice(data, null, { today: '2026-10-15' });
    expect(result.recognized).toBe(true);
    expect(result.issues.map((issue) => issue.code)).toEqual(['total_mismatch']);
  });

  it('does not recognize an answer with almost no fields', () => {
    const result = processExtractedInvoice(emptyInvoice(), null, {});
    expect(result.recognized).toBe(false);
  });
});
