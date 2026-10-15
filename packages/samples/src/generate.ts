import { mkdir, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { encodeArcaQr } from '@billwise/shared';
import { sampleInvoices } from './invoices.js';
import { printedInvoice, qrPayload } from './manifest.js';
import { renderInvoice } from './render.js';
import { computeTotals } from './totals.js';

const OUT_DIR = resolve(import.meta.dirname, '../../../apps/web/public/samples');

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
      letter: invoice.letter,
      printed: printedInvoice(invoice, totals),
      qr,
    });
    console.log(`  ${file}`);
  }

  await writeFile(resolve(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${manifest.length} invoices in ${OUT_DIR}`);
}

await main();
