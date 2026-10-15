import { type ArcaQrData, INVOICE_VOUCHER_CODES, type InvoiceData } from '@billwise/shared';
import { padNumber } from './format.js';
import type { InvoiceTotals, SampleInvoice } from './types.js';

export function qrPayload(invoice: SampleInvoice, totals: InvoiceTotals): ArcaQrData {
  const { recipient } = invoice;
  return {
    ver: 1,
    fecha: invoice.issueDate,
    cuit: Number(invoice.issuer.cuit),
    ptoVta: invoice.pointOfSale,
    tipoCmp: INVOICE_VOUCHER_CODES[invoice.letter],
    nroCmp: invoice.number,
    importe: invoice.printed?.total ?? totals.total,
    moneda: 'PES',
    ctz: 1,
    tipoDocRec: recipient.docType,
    nroDocRec: Number(recipient.docNumber),
    tipoCodAut: 'E',
    codAut: Number(invoice.cae),
    ...invoice.qr,
  };
}

export function printedInvoice(invoice: SampleInvoice, totals: InvoiceTotals): InvoiceData {
  const isA = invoice.letter === 'A';
  return {
    voucherType: INVOICE_VOUCHER_CODES[invoice.letter],
    pointOfSale: padNumber(invoice.pointOfSale, 5),
    number: padNumber(invoice.printed?.number ?? invoice.number, 8),
    issueDate: invoice.issueDate,
    issuer: { cuit: invoice.issuer.cuit, name: invoice.issuer.name },
    recipient: {
      docType: invoice.recipient.docType,
      docNumber: invoice.recipient.docType === 99 ? null : invoice.recipient.docNumber,
      name: invoice.recipient.name,
    },
    currency: 'PES',
    netTaxed: isA ? totals.netTaxed : null,
    nonTaxed: null,
    exempt: null,
    iva: Object.entries(totals.ivaByRate).map(([rate, amount]) => ({ rate: Number(rate), amount })),
    otherTaxes: totals.otherTaxesTotal,
    total: invoice.printed?.total ?? totals.total,
    cae: invoice.cae,
    caeDueDate: invoice.caeDueDate,
  };
}
