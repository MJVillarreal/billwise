export type InvoiceLetter = 'A' | 'B' | 'C';

/** Invoice voucher codes from ARCA's system tables. */
export const INVOICE_VOUCHER_CODES: Record<InvoiceLetter, number> = {
  A: 1,
  B: 6,
  C: 11,
};

export function letterFromVoucherCode(code: number): InvoiceLetter | null {
  const entry = Object.entries(INVOICE_VOUCHER_CODES).find(([, value]) => value === code);
  return entry ? (entry[0] as InvoiceLetter) : null;
}

/** Recipient document types from ARCA's system tables. */
export const DOC_TYPES = {
  CUIT: 80,
  DNI: 96,
  FINAL_CONSUMER: 99,
} as const;
