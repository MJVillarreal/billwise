import { type ArcaQrData, decodeArcaQr } from './arca-qr.js';
import type { InvoiceData, InvoiceField, Severity, ValidationIssue } from './invoice.js';
import { reconcileWithQr } from './qr-reconcile.js';
import { parseInvoiceText } from './text-parser.js';
import type { Box, TextItem } from './text-item.js';
import { type ValidationOptions, validateInvoice, worstSeverityByField } from './validation.js';

const MIN_RECOGNIZED_FIELDS = 4;

export interface ProcessInput {
  items: TextItem[];
  qrText: string | null;
}

export interface ProcessResult {
  data: InvoiceData;
  qr: ArcaQrData | null;
  issues: ValidationIssue[];
  fields: Partial<Record<InvoiceField, Severity>>;
  fromQr: InvoiceField[];
  locations: Partial<Record<InvoiceField, Box>>;
  /** False when neither the text nor the QR could be read, e.g. a scanned document. */
  recognized: boolean;
}

export function processInvoice(input: ProcessInput, options: ValidationOptions): ProcessResult {
  const parsed = parseInvoiceText(input.items);
  return finish(parsed.data, input.qrText, options, {
    locations: parsed.locations,
    recognized: parsed.recognized >= MIN_RECOGNIZED_FIELDS,
  });
}

/** Same checks for data that was already extracted by another reader, such as the AI. */
export function processExtractedInvoice(
  data: InvoiceData,
  qrText: string | null,
  options: ValidationOptions,
): ProcessResult {
  const required = [data.voucherType, data.number, data.issuer.cuit, data.total, data.cae];
  return finish(data, qrText, options, {
    locations: {},
    recognized: required.filter((value) => value !== null).length >= 3,
  });
}

function finish(
  data: InvoiceData,
  qrText: string | null,
  options: ValidationOptions,
  extracted: { locations: ProcessResult['locations']; recognized: boolean },
): ProcessResult {
  const qr = qrText ? decodeArcaQr(qrText) : null;
  const reconciled = qr ? reconcileWithQr(data, qr) : { data, issues: [], fromQr: [] };
  const issues = [...reconciled.issues, ...validateInvoice(reconciled.data, options).issues];

  return {
    data: reconciled.data,
    qr,
    issues,
    fields: worstSeverityByField(issues),
    fromQr: reconciled.fromQr,
    locations: extracted.locations,
    recognized: qr !== null || extracted.recognized,
  };
}
