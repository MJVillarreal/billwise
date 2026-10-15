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
  const qr = input.qrText ? decodeArcaQr(input.qrText) : null;
  const reconciled = qr
    ? reconcileWithQr(parsed.data, qr)
    : { data: parsed.data, issues: [], fromQr: [] };
  const validation = validateInvoice(reconciled.data, options);

  const issues = [...reconciled.issues, ...validation.issues];

  return {
    data: reconciled.data,
    qr,
    issues,
    fields: worstSeverityByField(issues),
    fromQr: reconciled.fromQr,
    locations: parsed.locations,
    recognized: qr !== null || parsed.recognized >= MIN_RECOGNIZED_FIELDS,
  };
}
