import type { ArcaQrData, InvoiceLetter } from '@billwise/shared';

export type IvaRate = 0 | 2.5 | 5 | 10.5 | 21 | 27;

export interface Issuer {
  name: string;
  cuit: string;
  address: string;
  ivaCondition: string;
  grossIncome: string;
  activityStart: string;
}

export interface Recipient {
  name: string;
  docType: 80 | 96 | 99;
  docNumber: string;
  ivaCondition: string;
  address?: string;
}

export interface Item {
  description: string;
  quantity: number;
  unit: string;
  /** Net price for A invoices, final price (IVA included) for B and C. */
  unitPrice: number;
  ivaRate: IvaRate;
}

export interface OtherTax {
  description: string;
  amount: number;
}

export type ExpectedIssue = 'invalid_cuit' | 'total_mismatch' | 'qr_mismatch' | 'duplicate';

export interface SampleInvoice {
  id: string;
  scenario: { es: string; en: string };
  expectedIssues: ExpectedIssue[];
  copy: 'ORIGINAL' | 'DUPLICADO';
  letter: InvoiceLetter;
  pointOfSale: number;
  number: number;
  issueDate: string;
  saleCondition: string;
  issuer: Issuer;
  recipient: Recipient;
  items: Item[];
  otherTaxes: OtherTax[];
  cae: string;
  caeDueDate: string;
  printed?: { total?: number; number?: number };
  qr?: Partial<ArcaQrData>;
}

export interface InvoiceTotals {
  netByRate: Partial<Record<IvaRate, number>>;
  ivaByRate: Partial<Record<IvaRate, number>>;
  netTaxed: number;
  ivaTotal: number;
  /** IVA included in the price (B invoices, consumer transparency regime). */
  ivaContained: number;
  subtotal: number;
  otherTaxesTotal: number;
  total: number;
}
