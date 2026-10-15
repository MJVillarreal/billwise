import { describe, expect, it } from 'vitest';
import type { ArcaQrData } from './arca-qr.js';
import { emptyInvoice, type InvoiceData } from './invoice.js';
import { reconcileWithQr } from './qr-reconcile.js';

const qr: ArcaQrData = {
  ver: 1,
  fecha: '2026-09-30',
  cuit: 30712345671,
  ptoVta: 3,
  tipoCmp: 1,
  nroCmp: 12345,
  importe: 478581,
  moneda: 'PES',
  ctz: 1,
  tipoDocRec: 80,
  nroDocRec: 20123456786,
  tipoCodAut: 'E',
  codAut: 76391245873016,
};

const printed: InvoiceData = {
  ...emptyInvoice(),
  voucherType: 1,
  pointOfSale: '00003',
  number: '00012345',
  issueDate: '2026-09-30',
  issuer: { cuit: '30-71234567-1', name: 'Distribuidora Ejemplo SRL' },
  recipient: { docType: 80, docNumber: '20-12345678-6', name: 'Cliente Ejemplo' },
  currency: 'PES',
  total: 478581,
  cae: '76391245873016',
};

describe('reconcileWithQr', () => {
  it('keeps the printed data when it matches the QR', () => {
    const result = reconcileWithQr(printed, qr);
    expect(result.data).toEqual(printed);
    expect(result.issues).toEqual([]);
    expect(result.fromQr).toEqual([]);
  });

  it('fills missing fields from the QR without flagging them', () => {
    const result = reconcileWithQr(emptyInvoice(), qr);
    expect(result.data).toMatchObject({
      voucherType: 1,
      pointOfSale: '00003',
      number: '00012345',
      issueDate: '2026-09-30',
      issuer: { cuit: '30712345671' },
      recipient: { docType: 80, docNumber: '20123456786' },
      total: 478581,
      cae: '76391245873016',
      currency: 'PES',
    });
    expect(result.issues).toEqual([]);
    expect(result.fromQr).toHaveLength(9);
  });

  it('uses the QR value and flags the field when they disagree', () => {
    const result = reconcileWithQr({ ...printed, number: '00012354' }, qr);
    expect(result.data.number).toBe('00012345');
    expect(result.fromQr).toEqual(['number']);
    expect(result.issues).toEqual([
      {
        field: 'number',
        severity: 'warning',
        code: 'qr_mismatch',
        params: { printed: '00012354', qr: 12345 },
      },
    ]);
  });

  it('compares amounts with cent precision', () => {
    expect(reconcileWithQr({ ...printed, total: 478581.004 }, qr).issues).toEqual([]);
    expect(reconcileWithQr({ ...printed, total: 478580 }, qr).issues).toHaveLength(1);
  });

  it('skips the recipient for final consumers', () => {
    const result = reconcileWithQr(printed, { ...qr, tipoDocRec: 99, nroDocRec: 0 });
    expect(result.data.recipient).toEqual(printed.recipient);
  });

  it('takes the recipient document type from the QR when it is missing', () => {
    const recipient = { docType: null, docNumber: null, name: 'Consumidor Final' };
    const result = reconcileWithQr(
      { ...printed, recipient },
      { ...qr, tipoDocRec: 99, nroDocRec: 0 },
    );
    expect(result.data.recipient.docType).toBe(99);
  });

  it('does not modify the input', () => {
    const input = { ...printed, number: '00012354' };
    reconcileWithQr(input, qr);
    expect(input.number).toBe('00012354');
  });
});
