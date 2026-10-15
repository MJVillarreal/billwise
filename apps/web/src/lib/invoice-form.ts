import { type InvoiceData, type InvoiceField, parseAmount, parseDate } from '@billwise/shared';
import { formatAmountInput, formatDateInput } from './format';

export type FormValues = Record<string, string>;

export const ivaKey = (rate: number) => `iva:${rate}`;

/** Form inputs that map to a validated invoice field. */
export const FORM_FIELDS: Record<string, InvoiceField> = {
  voucherType: 'voucherType',
  pointOfSale: 'pointOfSale',
  number: 'number',
  issueDate: 'issueDate',
  issuerCuit: 'issuer.cuit',
  recipientDoc: 'recipient.docNumber',
  netTaxed: 'netTaxed',
  total: 'total',
  cae: 'cae',
  caeDueDate: 'caeDueDate',
};

export function toForm(data: InvoiceData): FormValues {
  const values: FormValues = {
    voucherType: data.voucherType === null ? '' : String(data.voucherType),
    pointOfSale: data.pointOfSale ?? '',
    number: data.number ?? '',
    issueDate: formatDateInput(data.issueDate),
    issuerCuit: data.issuer.cuit ?? '',
    issuerName: data.issuer.name ?? '',
    recipientDoc: data.recipient.docNumber ?? '',
    recipientName: data.recipient.name ?? '',
    netTaxed: formatAmountInput(data.netTaxed),
    otherTaxes: formatAmountInput(data.otherTaxes),
    total: formatAmountInput(data.total),
    cae: data.cae ?? '',
    caeDueDate: formatDateInput(data.caeDueDate),
  };
  for (const line of data.iva) values[ivaKey(line.rate)] = formatAmountInput(line.amount);
  return values;
}

export function fromForm(values: FormValues, base: InvoiceData): InvoiceData {
  const text = (key: string) => values[key]?.trim() || null;
  const amount = (key: string) => {
    const value = text(key);
    return value === null ? null : parseAmount(value);
  };
  const date = (key: string) => {
    const value = text(key);
    return value === null ? null : (parseDate(value) ?? value);
  };

  return {
    ...base,
    voucherType: text('voucherType') === null ? null : Number(values.voucherType),
    pointOfSale: text('pointOfSale'),
    number: text('number'),
    issueDate: date('issueDate'),
    issuer: { cuit: text('issuerCuit'), name: text('issuerName') },
    recipient: { ...base.recipient, docNumber: text('recipientDoc'), name: text('recipientName') },
    netTaxed: amount('netTaxed'),
    otherTaxes: amount('otherTaxes'),
    total: amount('total'),
    cae: text('cae'),
    caeDueDate: date('caeDueDate'),
    iva: base.iva.map((line) => ({ rate: line.rate, amount: amount(ivaKey(line.rate)) ?? 0 })),
  };
}
