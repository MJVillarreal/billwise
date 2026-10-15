import { isValidCuit, normalizeCuit } from './cuit.js';
import {
  type InvoiceData,
  type InvoiceField,
  IVA_RATES,
  type Severity,
  type ValidationIssue,
} from './invoice.js';
import { DOC_TYPES, letterFromVoucherCode } from './voucher.js';

const AMOUNT_TOLERANCE = 1;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export interface ValidationOptions {
  /** Today's date as YYYY-MM-DD. */
  today: string;
  /** Voucher keys of invoices already loaded, to detect duplicates. */
  existingKeys?: ReadonlySet<string>;
}

export interface ValidationResult {
  issues: ValidationIssue[];
  fields: Partial<Record<InvoiceField, Severity>>;
}

export function voucherKey(data: InvoiceData): string | null {
  const { issuer, voucherType, pointOfSale, number } = data;
  if (!issuer.cuit || voucherType === null || !pointOfSale || !number) return null;
  return [normalizeCuit(issuer.cuit), voucherType, Number(pointOfSale), Number(number)].join('|');
}

export function validateInvoice(data: InvoiceData, options: ValidationOptions): ValidationResult {
  const issues = [
    ...checkRequired(data),
    ...checkIdentifiers(data),
    ...checkDates(data, options.today),
    ...checkLetter(data),
    ...checkAmounts(data),
    ...checkDuplicate(data, options.existingKeys),
  ];
  return { issues, fields: worstSeverityByField(issues) };
}

function checkRequired(data: InvoiceData): ValidationIssue[] {
  const required: [InvoiceField, unknown][] = [
    ['voucherType', data.voucherType],
    ['pointOfSale', data.pointOfSale],
    ['number', data.number],
    ['issueDate', data.issueDate],
    ['issuer.cuit', data.issuer.cuit],
    ['total', data.total],
    ['cae', data.cae],
  ];
  return required
    .filter(([, value]) => value === null || value === '')
    .map(([field]) => ({ field, severity: 'warning', code: 'missing' }));
}

function checkIdentifiers(data: InvoiceData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const format = (field: InvoiceField, value: string | null, pattern: RegExp) => {
    if (value && !pattern.test(value)) {
      issues.push({ field, severity: 'error', code: 'invalid_format', params: { value } });
    }
  };

  format('pointOfSale', data.pointOfSale, /^\d{4,5}$/);
  format('number', data.number, /^\d{8}$/);
  format('cae', data.cae, /^\d{14}$/);

  if (data.voucherType !== null && letterFromVoucherCode(data.voucherType) === null) {
    issues.push({
      field: 'voucherType',
      severity: 'error',
      code: 'unknown_voucher_type',
      params: { value: data.voucherType },
    });
  }
  if (data.issuer.cuit && !isValidCuit(data.issuer.cuit)) {
    issues.push({ field: 'issuer.cuit', severity: 'error', code: 'invalid_cuit' });
  }
  const { docType, docNumber } = data.recipient;
  if (docType === DOC_TYPES.CUIT && docNumber && !isValidCuit(docNumber)) {
    issues.push({ field: 'recipient.docNumber', severity: 'error', code: 'invalid_cuit' });
  }
  return issues;
}

function checkDates(data: InvoiceData, today: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { issueDate, caeDueDate } = data;

  if (issueDate && !ISO_DATE.test(issueDate)) {
    issues.push({
      field: 'issueDate',
      severity: 'error',
      code: 'invalid_format',
      params: { value: issueDate },
    });
  } else if (issueDate && issueDate > today) {
    issues.push({ field: 'issueDate', severity: 'error', code: 'future_date' });
  }

  if (caeDueDate && !ISO_DATE.test(caeDueDate)) {
    issues.push({
      field: 'caeDueDate',
      severity: 'error',
      code: 'invalid_format',
      params: { value: caeDueDate },
    });
  } else if (caeDueDate && issueDate && ISO_DATE.test(issueDate) && caeDueDate < issueDate) {
    issues.push({ field: 'caeDueDate', severity: 'error', code: 'cae_due_before_issue' });
  }
  return issues;
}

function checkLetter(data: InvoiceData): ValidationIssue[] {
  const letter = data.voucherType === null ? null : letterFromVoucherCode(data.voucherType);
  const ivaTotal = data.iva.reduce((acc, line) => acc + line.amount, 0);

  if (letter === 'C' && ivaTotal > 0) {
    return [{ field: 'iva', severity: 'error', code: 'c_with_iva' }];
  }
  if (letter === 'A' && ivaTotal === 0 && (data.netTaxed ?? 0) > 0) {
    return [{ field: 'iva', severity: 'warning', code: 'a_without_iva' }];
  }
  return [];
}

function checkAmounts(data: InvoiceData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const line of data.iva) {
    if (!(IVA_RATES as readonly number[]).includes(line.rate)) {
      issues.push({
        field: 'iva',
        severity: 'error',
        code: 'invalid_iva_rate',
        params: { rate: line.rate },
      });
    }
  }

  const { netTaxed, total } = data;
  if (netTaxed === null) return issues;

  // IVA lines only print the tax, so each one implies its taxable base.
  const taxedLines = data.iva.filter((line) => line.rate > 0);
  const hasZeroRate = data.iva.some((line) => line.rate === 0);
  if (taxedLines.length > 0 && !hasZeroRate) {
    const impliedNet = taxedLines.reduce((acc, line) => acc + (line.amount * 100) / line.rate, 0);
    if (Math.abs(impliedNet - netTaxed) > AMOUNT_TOLERANCE * taxedLines.length) {
      issues.push({
        field: 'iva',
        severity: 'warning',
        code: 'iva_net_mismatch',
        params: { expected: round2(impliedNet), actual: netTaxed },
      });
    }
  }

  if (total !== null) {
    const ivaTotal = data.iva.reduce((acc, line) => acc + line.amount, 0);
    const expected = round2(
      netTaxed + ivaTotal + (data.otherTaxes ?? 0) + (data.nonTaxed ?? 0) + (data.exempt ?? 0),
    );
    if (Math.abs(expected - total) > AMOUNT_TOLERANCE) {
      issues.push({
        field: 'total',
        severity: 'error',
        code: 'total_mismatch',
        params: { expected, actual: total },
      });
    }
  }
  return issues;
}

function checkDuplicate(data: InvoiceData, existingKeys?: ReadonlySet<string>): ValidationIssue[] {
  const key = voucherKey(data);
  if (key && existingKeys?.has(key)) {
    return [{ field: 'invoice', severity: 'error', code: 'duplicate' }];
  }
  return [];
}

export function worstSeverityByField(
  issues: ValidationIssue[],
): Partial<Record<InvoiceField, Severity>> {
  const fields: Partial<Record<InvoiceField, Severity>> = {};
  for (const issue of issues) {
    if (fields[issue.field] !== 'error') fields[issue.field] = issue.severity;
  }
  return fields;
}

const round2 = (value: number) => Math.round(value * 100) / 100;
