import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { encodeArcaQr } from '@billwise/shared';
import { buildHistory } from './history.js';
import { sampleInvoices } from './invoices.js';
import { printedInvoice, qrPayload } from './manifest.js';
import { photoThumbnail, renderPhoto } from './photo.js';
import { renderInvoice } from './render.js';
import { renderThumbnail } from './thumbnail.js';
import { computeTotals } from './totals.js';

const OUT_DIR = resolve(import.meta.dirname, '../../../apps/web/public/samples');
const AI_RESULTS_DIR = resolve(import.meta.dirname, '../ai-results');

async function storedAi(id: string): Promise<unknown> {
  try {
    return JSON.parse(await readFile(resolve(AI_RESULTS_DIR, `${id}.json`), 'utf8'));
  } catch {
    return undefined;
  }
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });

  const manifest = [];
  for (const invoice of sampleInvoices) {
    const totals = computeTotals(invoice);
    const qr = qrPayload(invoice, totals);
    const file = `${invoice.id}.pdf`;

    const thumbnail = `${invoice.id}.webp`;
    const pdf = await renderInvoice(invoice, totals, encodeArcaQr(qr));
    await writeFile(resolve(OUT_DIR, file), pdf);
    const photo = invoice.photo ? `${invoice.id}.jpg` : undefined;
    if (photo) {
      const image = await renderPhoto(pdf.slice());
      await writeFile(resolve(OUT_DIR, photo), image);
      await writeFile(resolve(OUT_DIR, thumbnail), await photoThumbnail(image));
    } else {
      await writeFile(resolve(OUT_DIR, thumbnail), await renderThumbnail(pdf.slice()));
    }
    manifest.push({
      id: invoice.id,
      file,
      thumbnail,
      photo,
      ai: photo ? await storedAi(invoice.id) : undefined,
      scenario: invoice.scenario,
      expectedIssues: invoice.expectedIssues,
      letter: invoice.letter,
      printed: printedInvoice(invoice, totals),
      qr,
    });
    console.log(`  ${file}`);
  }

  await writeFile(resolve(OUT_DIR, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  const history = buildHistory();
  await writeFile(resolve(OUT_DIR, 'history.json'), `${JSON.stringify(history, null, 2)}\n`);
  console.log(`  history.json (${history.length} invoices)`);
  console.log(`Generated ${manifest.length} invoices in ${OUT_DIR}`);
}

await main();
