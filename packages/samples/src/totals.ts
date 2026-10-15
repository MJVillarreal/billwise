import type { InvoiceTotals, IvaRate, SampleInvoice } from './types.js';

export const round2 = (value: number) => Math.round(value * 100) / 100;

export function itemSubtotal(item: { quantity: number; unitPrice: number }): number {
  return round2(item.quantity * item.unitPrice);
}

export function computeTotals(invoice: SampleInvoice): InvoiceTotals {
  const netByRate: Partial<Record<IvaRate, number>> = {};
  const ivaByRate: Partial<Record<IvaRate, number>> = {};
  let subtotal = 0;
  let ivaContained = 0;

  for (const item of invoice.items) {
    const amount = itemSubtotal(item);
    subtotal += amount;
    if (invoice.letter === 'A') {
      netByRate[item.ivaRate] = round2((netByRate[item.ivaRate] ?? 0) + amount);
    } else if (invoice.letter === 'B') {
      ivaContained += amount - amount / (1 + item.ivaRate / 100);
    }
  }

  for (const [rate, net] of Object.entries(netByRate)) {
    ivaByRate[Number(rate) as IvaRate] = round2((net * Number(rate)) / 100);
  }

  const netTaxed = invoice.letter === 'A' ? round2(subtotal) : 0;
  const ivaTotal = round2(Object.values(ivaByRate).reduce((acc, value) => acc + value, 0));
  const otherTaxesTotal = round2(invoice.otherTaxes.reduce((acc, tax) => acc + tax.amount, 0));

  return {
    netByRate,
    ivaByRate,
    netTaxed,
    ivaTotal,
    ivaContained: round2(ivaContained),
    subtotal: round2(subtotal),
    otherTaxesTotal,
    total: round2(subtotal + ivaTotal + otherTaxesTotal),
  };
}
