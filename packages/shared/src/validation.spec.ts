import { describe, expect, it } from 'vitest';
import { emptyInvoice, type InvoiceData } from './invoice.js';
import { validateInvoice, voucherKey } from './validation.js';

const TODAY = '2026-10-15';

function invoiceA(overrides: Partial<InvoiceData> = {}): InvoiceData {
  return {
    ...emptyInvoice(),
    voucherType: 1,
    pointOfSale: '00003',
    number: '00012345',
    issueDate: '2026-09-30',
    issuer: { cuit: '30-71234567-1', name: 'Distribuidora Ejemplo SRL' },
    recipient: { docType: 80, docNumber: '20123456786', name: 'Cliente Ejemplo' },
    currency: 'PES',
    netTaxed: 400000,
    iva: [
      { rate: 21, amount: 57162 },
      { rate: 10.5, amount: 13419 },
    ],
    otherTaxes: 8000,
    total: 478581,
    cae: '76391245873016',
    caeDueDate: '2026-10-10',
    ...overrides,
  };
}

const codes = (data: InvoiceData, existingKeys?: Set<string>) =>
  validateInvoice(data, { today: TODAY, existingKeys }).issues.map((issue) => issue.code);

describe('validateInvoice', () => {
  it('returns no issues for a consistent A invoice', () => {
    const result = validateInvoice(invoiceA(), { today: TODAY });
    expect(result.issues).toEqual([]);
    expect(result.fields).toEqual({});
  });

  it('flags missing required fields as warnings', () => {
    const result = validateInvoice(emptyInvoice(), { today: TODAY });
    expect(result.issues.every((issue) => issue.code === 'missing')).toBe(true);
    expect(result.fields).toMatchObject({
      total: 'warning',
      cae: 'warning',
      'issuer.cuit': 'warning',
    });
  });

  describe('identifiers', () => {
    it('rejects an invalid issuer CUIT', () => {
      expect(codes(invoiceA({ issuer: { cuit: '30712345672', name: null } }))).toEqual([
        'invalid_cuit',
      ]);
    });

    it('rejects an invalid recipient CUIT', () => {
      const recipient = { docType: 80, docNumber: '20123456787', name: null };
      expect(codes(invoiceA({ recipient }))).toEqual(['invalid_cuit']);
    });

    it('ignores the recipient document when it is not a CUIT', () => {
      const recipient = { docType: 96, docNumber: '12345678', name: null };
      expect(codes(invoiceA({ recipient }))).toEqual([]);
    });

    it('checks point of sale, number and CAE formats', () => {
      expect(codes(invoiceA({ pointOfSale: '3', number: '12345', cae: '123' }))).toEqual([
        'invalid_format',
        'invalid_format',
        'invalid_format',
      ]);
    });

    it('accepts 4 and 5 digit points of sale', () => {
      expect(codes(invoiceA({ pointOfSale: '0003' }))).toEqual([]);
    });

    it('rejects voucher types that are not A, B or C invoices', () => {
      expect(codes(invoiceA({ voucherType: 99 }))).toEqual(['unknown_voucher_type']);
    });
  });

  describe('dates', () => {
    it('rejects a future issue date', () => {
      expect(codes(invoiceA({ issueDate: '2026-10-16', caeDueDate: '2026-10-26' }))).toEqual([
        'future_date',
      ]);
    });

    it('rejects a CAE due date before the issue date', () => {
      expect(codes(invoiceA({ caeDueDate: '2026-09-29' }))).toEqual(['cae_due_before_issue']);
    });

    it('rejects malformed dates', () => {
      expect(codes(invoiceA({ issueDate: '30/09/2026' }))).toEqual(['invalid_format']);
    });
  });

  describe('letter rules', () => {
    it('rejects IVA on a C invoice', () => {
      const data = invoiceA({ voucherType: 11, netTaxed: null, iva: [{ rate: 21, amount: 100 }] });
      expect(codes(data)).toEqual(['c_with_iva']);
    });

    it('warns about an A invoice without IVA', () => {
      const data = invoiceA({ iva: [], otherTaxes: 0, total: 400000 });
      expect(codes(data)).toEqual(['a_without_iva']);
    });
  });

  describe('amounts', () => {
    it('flags a total that does not add up', () => {
      const result = validateInvoice(invoiceA({ total: 478081 }), { today: TODAY });
      expect(result.issues).toEqual([
        {
          field: 'total',
          severity: 'error',
          code: 'total_mismatch',
          params: { expected: 478581, actual: 478081 },
        },
      ]);
      expect(result.fields.total).toBe('error');
    });

    it('tolerates rounding differences of up to one peso', () => {
      expect(codes(invoiceA({ total: 478581.9 }))).toEqual([]);
    });

    it('includes non taxed and exempt amounts in the total', () => {
      expect(codes(invoiceA({ nonTaxed: 1000, exempt: 500, total: 480081 }))).toEqual([]);
    });

    it('warns when IVA does not match the taxed net amount', () => {
      const iva = [
        { rate: 21, amount: 60000 },
        { rate: 10.5, amount: 13419 },
      ];
      expect(codes(invoiceA({ iva, total: 481419 }))).toEqual(['iva_net_mismatch']);
    });

    it('skips the IVA check when there is a 0% line', () => {
      const iva = [
        { rate: 21, amount: 57162 },
        { rate: 10.5, amount: 13419 },
        { rate: 0, amount: 0 },
      ];
      expect(codes(invoiceA({ iva, netTaxed: 450000, total: 528581 }))).toEqual([]);
    });

    it('rejects IVA rates that do not exist', () => {
      expect(codes(invoiceA({ iva: [{ rate: 19, amount: 76000 }], total: 484000 }))).toContain(
        'invalid_iva_rate',
      );
    });
  });

  describe('duplicates', () => {
    it('flags an invoice whose voucher key was already loaded', () => {
      const key = voucherKey(invoiceA());
      expect(codes(invoiceA(), new Set([key as string]))).toEqual(['duplicate']);
    });
  });
});

describe('voucherKey', () => {
  it('ignores CUIT dashes and leading zeros', () => {
    const a = voucherKey(invoiceA());
    const b = voucherKey(
      invoiceA({
        issuer: { cuit: '30712345671', name: null },
        pointOfSale: '0003',
        number: '12345',
      }),
    );
    expect(a).toBe('30712345671|1|3|12345');
    expect(b).toBe(a);
  });

  it('returns null when a key field is missing', () => {
    expect(voucherKey(invoiceA({ number: null }))).toBeNull();
  });
});
