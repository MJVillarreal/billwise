export const IVA_RATES = [0, 2.5, 5, 10.5, 21, 27] as const;

export interface IvaLine {
  rate: number;
  amount: number;
}

export interface InvoiceData {
  voucherType: number | null;
  pointOfSale: string | null;
  number: string | null;
  issueDate: string | null;
  issuer: { cuit: string | null; name: string | null };
  recipient: { docType: number | null; docNumber: string | null; name: string | null };
  currency: string | null;
  netTaxed: number | null;
  nonTaxed: number | null;
  exempt: number | null;
  iva: IvaLine[];
  otherTaxes: number | null;
  total: number | null;
  cae: string | null;
  caeDueDate: string | null;
}

export type InvoiceField =
  | 'invoice'
  | 'voucherType'
  | 'pointOfSale'
  | 'number'
  | 'issueDate'
  | 'issuer.cuit'
  | 'recipient.docNumber'
  | 'currency'
  | 'netTaxed'
  | 'iva'
  | 'total'
  | 'cae'
  | 'caeDueDate';

export type IssueCode =
  | 'missing'
  | 'invalid_format'
  | 'invalid_cuit'
  | 'unknown_voucher_type'
  | 'future_date'
  | 'cae_due_before_issue'
  | 'total_mismatch'
  | 'iva_net_mismatch'
  | 'invalid_iva_rate'
  | 'c_with_iva'
  | 'a_without_iva'
  | 'qr_mismatch'
  | 'duplicate';

export type Severity = 'warning' | 'error';

export interface ValidationIssue {
  field: InvoiceField;
  severity: Severity;
  code: IssueCode;
  params?: Record<string, string | number>;
}

export function emptyInvoice(): InvoiceData {
  return {
    voucherType: null,
    pointOfSale: null,
    number: null,
    issueDate: null,
    issuer: { cuit: null, name: null },
    recipient: { docType: null, docNumber: null, name: null },
    currency: null,
    netTaxed: null,
    nonTaxed: null,
    exempt: null,
    iva: [],
    otherTaxes: null,
    total: null,
    cae: null,
    caeDueDate: null,
  };
}
