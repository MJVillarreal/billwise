import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import {
  type InvoiceField,
  processInvoice,
  type ProcessResult,
  type ValidationIssue,
} from '@billwise/shared';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readPdf } from './read-pdf.js';

const standardFontDataUrl = `${dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'))}/standard_fonts/`;

const FIELDS: [string, InvoiceField, (r: ProcessResult) => unknown][] = [
  ['Voucher type', 'voucherType', (r) => r.data.voucherType],
  ['Point of sale', 'pointOfSale', (r) => r.data.pointOfSale],
  ['Number', 'number', (r) => r.data.number],
  ['Issue date', 'issueDate', (r) => r.data.issueDate],
  ['Issuer', 'issuer.cuit', (r) => `${r.data.issuer.cuit ?? '-'}  ${r.data.issuer.name ?? ''}`],
  [
    'Recipient',
    'recipient.docNumber',
    (r) => `${r.data.recipient.docNumber ?? '-'}  ${r.data.recipient.name ?? ''}`,
  ],
  ['Currency', 'currency', (r) => r.data.currency],
  ['Net taxed', 'netTaxed', (r) => r.data.netTaxed],
  ['IVA', 'iva', (r) => r.data.iva.map((line) => `${line.rate}%: ${line.amount}`).join('  ')],
  ['Total', 'total', (r) => r.data.total],
  ['CAE', 'cae', (r) => r.data.cae],
  ['CAE due date', 'caeDueDate', (r) => r.data.caeDueDate],
];

const COLORS = { ok: '\x1b[32m', warning: '\x1b[33m', error: '\x1b[31m', reset: '\x1b[0m' };
const HIGHLIGHT = { ok: '#16a34a', warning: '#eab308', error: '#dc2626' };

function describeIssue({ code, field, params = {} }: ValidationIssue): string {
  const messages: Record<string, string> = {
    missing: 'not found',
    invalid_format: `invalid format (${params.value})`,
    invalid_cuit: 'invalid CUIT check digit',
    unknown_voucher_type: `unknown voucher type ${params.value}`,
    future_date: 'issue date is in the future',
    cae_due_before_issue: 'CAE due date is before the issue date',
    total_mismatch: `total does not add up: expected ${params.expected}, printed ${params.actual}`,
    iva_net_mismatch: `IVA implies a net of ${params.expected}, printed ${params.actual}`,
    invalid_iva_rate: `IVA rate ${params.rate}% does not exist`,
    c_with_iva: 'C invoices do not itemize IVA',
    a_without_iva: 'A invoice without IVA',
    qr_mismatch: `printed ${params.printed}, QR says ${params.qr} (QR wins)`,
    duplicate: 'invoice already loaded',
  };
  return `${field}: ${messages[code] ?? code}`;
}

async function saveHighlights(bytes: Uint8Array, result: ProcessResult, output: string) {
  const task = getDocument({ data: bytes, standardFontDataUrl, verbosity: 0 });
  const doc = await task.promise;
  const page = await doc.getPage(1);
  const scale = 1.5;
  const viewport = page.getViewport({ scale });
  const factory = doc.canvasFactory as {
    create(
      w: number,
      h: number,
    ): {
      canvas: { toBuffer(type: string): Buffer };
      context: CanvasRenderingContext2D;
    };
  };
  const { canvas, context } = factory.create(viewport.width, viewport.height);
  await page.render({
    canvas: canvas as unknown as HTMLCanvasElement,
    canvasContext: context,
    viewport,
  }).promise;

  for (const [field, box] of Object.entries(result.locations)) {
    if (!box || box.page !== 1) continue;
    const color = HIGHLIGHT[result.fields[field as InvoiceField] ?? 'ok'];
    const rect = [
      box.x * scale - 3,
      box.y * scale - 3,
      box.width * scale + 6,
      box.height * scale + 6,
    ] as const;
    context.fillStyle = `${color}33`;
    context.fillRect(...rect);
    context.strokeStyle = color;
    context.lineWidth = 3;
    context.strokeRect(...rect);
  }
  writeFileSync(output, canvas.toBuffer('image/png'));
  await task.destroy();
}

async function main() {
  const args = process.argv.slice(2);
  const imageIndex = args.indexOf('--image');
  const image = imageIndex >= 0 ? args.splice(imageIndex, 2)[1] : null;
  const [file] = args;
  if (!file) {
    console.error('Usage: npm run read -- <invoice.pdf> [--image highlights.png]');
    process.exit(1);
  }

  // npm runs workspace scripts from the package folder; paths are relative to where it was called.
  const baseDir = process.env.INIT_CWD ?? process.cwd();
  const bytes = new Uint8Array(readFileSync(resolve(baseDir, file)));

  const started = Date.now();
  const pdf = await readPdf(bytes.slice(), { standardFontDataUrl });
  const result = processInvoice(pdf, { today: new Date().toISOString().slice(0, 10) });

  console.log(`\n${file}`);
  console.log(
    `${pdf.pages.length} page(s), ${pdf.items.length} text items, QR ${pdf.qrText ? 'found' : 'not found'}, ${Date.now() - started} ms\n`,
  );
  if (!result.recognized) {
    console.log(
      'Layout not recognized: no QR and too few fields. A scanned document needs the AI reader.\n',
    );
  }

  for (const [label, field, value] of FIELDS) {
    const status = result.fields[field] ?? 'ok';
    const source = result.fromQr.includes(field) ? 'QR' : 'text';
    const shown = String(value(result) ?? '-');
    console.log(
      `  ${label.padEnd(14)} ${shown.padEnd(46)} ${COLORS[status]}${status.padEnd(8)}${COLORS.reset} ${source}`,
    );
  }

  console.log(result.issues.length ? '\nIssues:' : '\nNo issues found.');
  for (const issue of result.issues) {
    console.log(
      `  ${COLORS[issue.severity]}${issue.severity}${COLORS.reset}  ${describeIssue(issue)}`,
    );
  }

  if (image) {
    const output = resolve(baseDir, image);
    await saveHighlights(bytes, result, output);
    console.log(`\nHighlights saved to ${output}`);
  }
  console.log();
}

await main();
