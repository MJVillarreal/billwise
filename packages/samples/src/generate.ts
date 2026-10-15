import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { type ArcaQrData, encodeArcaQr, INVOICE_VOUCHER_CODES } from '@billwise/shared';
import { sampleInvoices } from './invoices.js';
import { renderInvoice } from './render.js';
import { computeTotals } from './totals.js';
import type { InvoiceTotals, IvaRate, SampleInvoice } from './types.js';

const OUT_DIR = resolve(import.meta.dirname, '../../../apps/web/public/samples');

function qrPayload(invoice: SampleInvoice, totals: InvoiceTotals): ArcaQrData {
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

function printedFields(invoice: SampleInvoice, totals: InvoiceTotals) {
  return {
    letter: invoice.letter,
    voucherType: INVOICE_VOUCHER_CODES[invoice.letter],
    pointOfSale: invoice.pointOfSale,
    number: invoice.printed?.number ?? invoice.number,
    issueDate: invoice.issueDate,
    issuer: {
      name: invoice.issuer.name,
      cuit: invoice.issuer.cuit,
      ivaCondition: invoice.issuer.ivaCondition,
    },
    recipient: {
      name: invoice.recipient.name,
      docType: invoice.recipient.docType,
      docNumber: invoice.recipient.docNumber,
    },
    currency: 'PES',
    netTaxed: totals.netTaxed,
    iva: Object.entries(totals.ivaByRate).map(([rate, amount]) => ({
      rate: Number(rate) as IvaRate,
      amount,
    })),
    ivaContained: totals.ivaContained,
    otherTaxes: invoice.otherTaxes,
    total: invoice.printed?.total ?? totals.total,
    cae: invoice.cae,
    caeDueDate: invoice.caeDueDate,
  };
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const manifest = [];
  for (const invoice of sampleInvoices) {
    const totals = computeTotals(invoice);
    const qr = qrPayload(invoice, totals);
    const file = `${invoice.id}.pdf`;

    await writeFile(resolve(OUT_DIR, file), await renderInvoice(invoice, totals, encodeArcaQr(qr)));
    manifest.push({
      id: invoice.id,
      file,
      scenario: invoice.scenario,
      expectedIssues: invoice.expectedIssues,
      printed: printedFields(invoice, totals),
      qr,
    });
    console.log(`  ${file}`);
  }

  await writeFile(resolve(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${manifest.length} invoices in ${OUT_DIR}`);
}

await main();
