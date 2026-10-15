import type { ArcaQrData } from './arca-qr.js';
import { normalizeCuit } from './cuit.js';
import type { InvoiceData, InvoiceField, ValidationIssue } from './invoice.js';

export interface ReconcileResult {
  data: InvoiceData;
  issues: ValidationIssue[];
  fromQr: InvoiceField[];
}

interface Comparison {
  field: InvoiceField;
  printed: string | number | null;
  qr: string | number;
  same: (printed: string | number, qr: string | number) => boolean;
  apply: (data: InvoiceData, qr: string | number) => void;
}

const asNumber = (value: string | number) => Number(String(value).replace(/\D/g, ''));
const sameNumber = (a: string | number, b: string | number) => asNumber(a) === asNumber(b);
const sameAmount = (a: string | number, b: string | number) =>
  Math.abs(Number(a) - Number(b)) < 0.01;
const sameText = (a: string | number, b: string | number) => String(a) === String(b);

/** The QR is the authorized record: when it disagrees with the printed text, the QR wins. */
export function reconcileWithQr(printed: InvoiceData, qr: ArcaQrData): ReconcileResult {
  const data: InvoiceData = structuredClone(printed);
  const issues: ValidationIssue[] = [];
  const fromQr: InvoiceField[] = [];

  const comparisons: Comparison[] = [
    {
      field: 'issuer.cuit',
      printed: printed.issuer.cuit,
      qr: String(qr.cuit),
      same: (a, b) => normalizeCuit(String(a)) === normalizeCuit(String(b)),
      apply: (d, v) => (d.issuer.cuit = String(v)),
    },
    {
      field: 'voucherType',
      printed: printed.voucherType,
      qr: qr.tipoCmp,
      same: sameNumber,
      apply: (d, v) => (d.voucherType = Number(v)),
    },
    {
      field: 'pointOfSale',
      printed: printed.pointOfSale,
      qr: qr.ptoVta,
      same: sameNumber,
      apply: (d, v) => (d.pointOfSale = String(v).padStart(5, '0')),
    },
    {
      field: 'number',
      printed: printed.number,
      qr: qr.nroCmp,
      same: sameNumber,
      apply: (d, v) => (d.number = String(v).padStart(8, '0')),
    },
    {
      field: 'issueDate',
      printed: printed.issueDate,
      qr: qr.fecha,
      same: sameText,
      apply: (d, v) => (d.issueDate = String(v)),
    },
    {
      field: 'total',
      printed: printed.total,
      qr: qr.importe,
      same: sameAmount,
      apply: (d, v) => (d.total = Number(v)),
    },
    {
      field: 'currency',
      printed: printed.currency,
      qr: qr.moneda,
      same: sameText,
      apply: (d, v) => (d.currency = String(v)),
    },
    {
      field: 'cae',
      printed: printed.cae,
      qr: String(qr.codAut),
      same: sameNumber,
      apply: (d, v) => (d.cae = String(v)),
    },
  ];

  if (qr.nroDocRec !== undefined && qr.nroDocRec !== 0) {
    comparisons.push({
      field: 'recipient.docNumber',
      printed: printed.recipient.docNumber,
      qr: String(qr.nroDocRec),
      same: sameNumber,
      apply: (d, v) => {
        d.recipient.docNumber = String(v);
        d.recipient.docType ??= qr.tipoDocRec ?? null;
      },
    });
  }

  if (data.recipient.docType === null && qr.tipoDocRec !== undefined) {
    data.recipient.docType = qr.tipoDocRec;
  }

  for (const { field, printed: value, qr: qrValue, same, apply } of comparisons) {
    if (value !== null && value !== '' && same(value, qrValue)) continue;

    apply(data, qrValue);
    fromQr.push(field);
    if (value !== null && value !== '') {
      issues.push({
        field,
        severity: 'warning',
        code: 'qr_mismatch',
        params: { printed: value, qr: qrValue },
      });
    }
  }

  return { data, issues, fromQr };
}
