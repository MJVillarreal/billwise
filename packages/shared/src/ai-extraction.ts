import { normalizeCuit } from './cuit.js';
import { emptyInvoice, IVA_RATES, type InvoiceData } from './invoice.js';
import { DOC_TYPES, INVOICE_VOUCHER_CODES, type InvoiceLetter } from './voucher.js';

export const EXTRACTION_PROMPT = `You read Argentine electronic invoices (facturas electrónicas issued under ARCA, formerly AFIP).
Extract the fields exactly as printed on the document and answer with the JSON schema.

Rules:
- Never guess. If a field is not visible or not legible, use null.
- Amounts are numbers with a dot as decimal separator. Argentine invoices print "1.234.567,89", which is 1234567.89.
- Dates are YYYY-MM-DD. Argentine invoices print DD/MM/YYYY.
- CUIT, document numbers, point of sale, voucher number and CAE are digits only, without dashes or spaces.
- voucherLetter is the big letter in the box at the top center (A, B or C).
- netTaxed is "Importe Neto Gravado". B and C invoices do not show it: use null.
- iva has one entry per IVA rate with a non-zero amount (e.g. "IVA 21%: $ 57.162,00"). C invoices have none.
- otherTaxes is "Importe Otros Tributos" (perceptions and other taxes), 0 if printed as zero.
- recipientDocType is CUIT, DNI or FINAL_CONSUMER ("Consumidor Final").
- currency is the ARCA code: PES for Argentine pesos (also when only "$" is printed), DOL for US dollars.
- If the invoice has several pages, the totals are on the last page.
- If the image is not an invoice, return every field as null.`;

const nullable = (type: 'string' | 'number') => ({ type: [type, 'null'] });

/** JSON Schema for the model's structured output. */
export const EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    voucherLetter: { type: ['string', 'null'], enum: ['A', 'B', 'C', null] },
    pointOfSale: nullable('string'),
    number: nullable('string'),
    issueDate: nullable('string'),
    issuerCuit: nullable('string'),
    issuerName: nullable('string'),
    recipientDocType: { type: ['string', 'null'], enum: ['CUIT', 'DNI', 'FINAL_CONSUMER', null] },
    recipientDocNumber: nullable('string'),
    recipientName: nullable('string'),
    currency: nullable('string'),
    netTaxed: nullable('number'),
    nonTaxed: nullable('number'),
    exempt: nullable('number'),
    iva: {
      type: 'array',
      items: {
        type: 'object',
        properties: { rate: { type: 'number' }, amount: { type: 'number' } },
        required: ['rate', 'amount'],
      },
    },
    otherTaxes: nullable('number'),
    total: nullable('number'),
    cae: nullable('string'),
    caeDueDate: nullable('string'),
  },
  required: [
    'voucherLetter',
    'pointOfSale',
    'number',
    'issueDate',
    'issuerCuit',
    'issuerName',
    'recipientDocType',
    'recipientDocNumber',
    'recipientName',
    'currency',
    'netTaxed',
    'nonTaxed',
    'exempt',
    'iva',
    'otherTaxes',
    'total',
    'cae',
    'caeDueDate',
  ],
} as const;

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() !== '' ? value.trim() : null;

const digits = (value: unknown, pad?: number): string | null => {
  const only = text(value)?.replace(/\D/g, '') ?? '';
  if (only === '') return null;
  return pad ? only.padStart(pad, '0') : only;
};

const amount = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) / 100 : null;

const isoDate = (value: unknown): string | null => {
  const date = text(value);
  return date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
};

function currencyCode(value: unknown): string | null {
  const code = text(value)?.toUpperCase();
  if (!code) return null;
  if (['$', 'ARS', 'PESOS', 'PESO'].includes(code)) return 'PES';
  if (['USD', 'U$S', 'US$', 'DOLARES', 'DÓLARES'].includes(code)) return 'DOL';
  return code;
}

const DOC_TYPE_CODES: Record<string, number> = {
  CUIT: DOC_TYPES.CUIT,
  DNI: DOC_TYPES.DNI,
  FINAL_CONSUMER: DOC_TYPES.FINAL_CONSUMER,
};

/** Turns the model's answer into the invoice model, dropping anything malformed instead of trusting it. */
export function aiExtractionToInvoice(raw: unknown): InvoiceData {
  const data = emptyInvoice();
  if (typeof raw !== 'object' || raw === null) return data;
  const r = raw as Record<string, unknown>;

  const letter = text(r.voucherLetter)?.toUpperCase();
  if (letter && letter in INVOICE_VOUCHER_CODES) {
    data.voucherType = INVOICE_VOUCHER_CODES[letter as InvoiceLetter];
  }

  const pointOfSale = digits(r.pointOfSale);
  data.pointOfSale =
    pointOfSale && pointOfSale.length <= 5 ? pointOfSale.padStart(5, '0') : pointOfSale;
  const number = digits(r.number);
  data.number = number && number.length <= 8 ? number.padStart(8, '0') : number;
  data.issueDate = isoDate(r.issueDate);

  const issuerCuit = text(r.issuerCuit);
  data.issuer = {
    cuit: issuerCuit ? normalizeCuit(issuerCuit) || null : null,
    name: text(r.issuerName),
  };

  const docType = text(r.recipientDocType);
  data.recipient = {
    docType: docType && docType in DOC_TYPE_CODES ? DOC_TYPE_CODES[docType] : null,
    docNumber: docType === 'FINAL_CONSUMER' ? null : digits(r.recipientDocNumber),
    name: text(r.recipientName),
  };

  data.currency = currencyCode(r.currency);
  data.netTaxed = amount(r.netTaxed);
  data.nonTaxed = amount(r.nonTaxed);
  data.exempt = amount(r.exempt);
  data.otherTaxes = amount(r.otherTaxes);
  data.total = amount(r.total);
  data.cae = digits(r.cae);
  data.caeDueDate = isoDate(r.caeDueDate);

  if (Array.isArray(r.iva)) {
    data.iva = r.iva
      .map((line) => {
        const entry = (line ?? {}) as Record<string, unknown>;
        return { rate: amount(entry.rate), amount: amount(entry.amount) };
      })
      .filter(
        (line): line is { rate: number; amount: number } =>
          line.rate !== null &&
          line.amount !== null &&
          line.amount !== 0 &&
          (IVA_RATES as readonly number[]).includes(line.rate),
      );
  }

  return data;
}
