import { INVOICE_VOUCHER_CODES } from '@billwise/shared';
import {
  degrees,
  grayscale,
  PDFDocument,
  type PDFFont,
  type PDFPage,
  StandardFonts,
} from 'pdf-lib';
import QRCode from 'qrcode';
import { formatAmount, formatDate, formatRate, padNumber } from './format.js';
import { itemSubtotal, round2 } from './totals.js';
import type { InvoiceTotals, IvaRate, SampleInvoice } from './types.js';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 28;
const RIGHT = PAGE_WIDTH - MARGIN;
const CENTER = PAGE_WIDTH / 2;
const IVA_RATES: IvaRate[] = [27, 21, 10.5, 5, 2.5, 0];

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
}

class Painter {
  constructor(
    private page: PDFPage,
    private fonts: Fonts,
  ) {}

  text(value: string, x: number, y: number, { size = 8.5, bold = false } = {}) {
    this.page.drawText(value, { x, y, size, font: bold ? this.fonts.bold : this.fonts.regular });
  }

  textRight(value: string, right: number, y: number, { size = 8.5, bold = false } = {}) {
    const font = bold ? this.fonts.bold : this.fonts.regular;
    this.text(value, right - font.widthOfTextAtSize(value, size), y, { size, bold });
  }

  textCenter(value: string, center: number, y: number, { size = 8.5, bold = false } = {}) {
    const font = bold ? this.fonts.bold : this.fonts.regular;
    this.text(value, center - font.widthOfTextAtSize(value, size) / 2, y, { size, bold });
  }

  field(label: string, value: string, x: number, y: number, size = 8.5) {
    this.text(label, x, y, { size, bold: true });
    this.text(value, x + this.fonts.bold.widthOfTextAtSize(label, size) + 3, y, { size });
  }

  box(x: number, y: number, width: number, height: number, fill?: number) {
    this.page.drawRectangle({
      x,
      y,
      width,
      height,
      borderColor: grayscale(0),
      borderWidth: 0.8,
      color: fill === undefined ? undefined : grayscale(fill),
    });
  }

  line(x1: number, y1: number, x2: number, y2: number) {
    this.page.drawLine({ start: { x: x1, y: y1 }, end: { x: x2, y: y2 }, thickness: 0.8 });
  }
}

const money = (value: number) => `$ ${formatAmount(value)}`;
const quantity = (value: number) => formatAmount(value);

export async function renderInvoice(
  invoice: SampleInvoice,
  totals: InvoiceTotals,
  qrText: string,
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create({ updateMetadata: false });
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
  };
  const p = new Painter(page, fonts);

  page.drawText('SAMPLE / EJEMPLO', {
    x: 95,
    y: 225,
    size: 54,
    font: fonts.bold,
    color: grayscale(0.5),
    opacity: 0.12,
    rotate: degrees(35),
  });

  drawHeader(p, invoice);
  drawRecipient(p, invoice);
  const lastRowY = drawItems(p, invoice);
  drawOtherTaxes(p, invoice, lastRowY);
  drawTotals(p, invoice, totals);
  await drawFooter(pdf, page, p, invoice, qrText);

  return pdf.save();
}

function drawHeader(p: Painter, invoice: SampleInvoice) {
  const { issuer, letter } = invoice;
  const contentWidth = RIGHT - MARGIN;

  p.box(MARGIN, 800, contentWidth, 20);
  p.textCenter(invoice.copy, CENTER, 806, { size: 11, bold: true });

  p.box(MARGIN, 650, contentWidth, 150);
  p.box(CENTER - 23, 754, 46, 46, 1);
  p.textCenter(letter, CENTER, 770, { size: 30, bold: true });
  p.textCenter(`COD. ${padNumber(INVOICE_VOUCHER_CODES[letter], 3)}`, CENTER, 758, {
    size: 7,
    bold: true,
  });
  p.line(CENTER, 650, CENTER, 754);

  const left = MARGIN + 10;
  p.text(issuer.name, left, 765, { size: 13, bold: true });
  p.field('Razón Social:', issuer.name, left, 725);
  p.field('Domicilio Comercial:', issuer.address, left, 708, 8);
  p.field('Condición frente al IVA:', issuer.ivaCondition, left, 691);

  const right = CENTER + 33;
  p.text('FACTURA', right, 770, { size: 18, bold: true });
  const number = invoice.printed?.number ?? invoice.number;
  p.field('Punto de Venta:', padNumber(invoice.pointOfSale, 5), right, 745);
  p.field('Comp. Nro:', padNumber(number, 8), right + 120, 745);
  p.field('Fecha de Emisión:', formatDate(invoice.issueDate), right, 728);
  p.field('CUIT:', issuer.cuit, right, 703);
  p.field('Ingresos Brutos:', issuer.grossIncome, right, 688);
  p.field('Fecha de Inicio de Actividades:', formatDate(issuer.activityStart), right, 673);
}

function drawRecipient(p: Painter, invoice: SampleInvoice) {
  const { recipient } = invoice;
  const left = MARGIN + 10;

  p.box(MARGIN, 570, RIGHT - MARGIN, 70);
  if (recipient.docType !== 99) {
    p.field(recipient.docType === 80 ? 'CUIT:' : 'DNI:', recipient.docNumber, left, 622);
  }
  p.field('Apellido y Nombre / Razón Social:', recipient.name, 200, 622);
  p.field('Condición frente al IVA:', recipient.ivaCondition, left, 604);
  if (recipient.address) p.field('Domicilio:', recipient.address, 300, 604);
  p.field('Condición de venta:', invoice.saleCondition, left, 586);
}

function drawItems(p: Painter, invoice: SampleInvoice): number {
  const isA = invoice.letter === 'A';
  const columns = isA
    ? { quantity: 270, unit: 278, price: 380, subtotal: 445, rate: 505, withIva: RIGHT - 4 }
    : { quantity: 330, unit: 338, price: 470, subtotal: RIGHT - 4, rate: 0, withIva: 0 };

  p.box(MARGIN, 545, RIGHT - MARGIN, 16, 0.85);
  const headerY = 550;
  const header = { size: 7.5, bold: true };
  p.text('Producto / Servicio', MARGIN + 4, headerY, header);
  p.textRight('Cantidad', columns.quantity, headerY, header);
  p.text('U. Medida', columns.unit, headerY, header);
  p.textRight('Precio Unit.', columns.price, headerY, header);
  p.textRight('Subtotal', columns.subtotal, headerY, header);
  if (isA) {
    p.textRight('Alícuota IVA', columns.rate, headerY, header);
    p.textRight('Subtotal c/IVA', columns.withIva, headerY, header);
  }

  let y = 530;
  for (const item of invoice.items) {
    const subtotal = itemSubtotal(item);
    p.text(item.description, MARGIN + 4, y);
    p.textRight(quantity(item.quantity), columns.quantity, y);
    p.text(item.unit, columns.unit, y);
    p.textRight(formatAmount(item.unitPrice), columns.price, y);
    p.textRight(formatAmount(subtotal), columns.subtotal, y);
    if (isA) {
      p.textRight(formatRate(item.ivaRate), columns.rate, y);
      p.textRight(formatAmount(round2(subtotal * (1 + item.ivaRate / 100))), columns.withIva, y);
    }
    y -= 16;
  }
  return y;
}

function drawOtherTaxes(p: Painter, invoice: SampleInvoice, lastRowY: number) {
  if (invoice.otherTaxes.length === 0) return;
  let y = Math.min(lastRowY - 20, 280);
  p.text('Otros tributos', MARGIN + 4, y, { bold: true });
  for (const tax of invoice.otherTaxes) {
    y -= 15;
    p.text(tax.description, MARGIN + 4, y);
    p.textRight(money(tax.amount), 270, y);
  }
}

function drawTotals(p: Painter, invoice: SampleInvoice, totals: InvoiceTotals) {
  const labelRight = 480;
  const total = invoice.printed?.total ?? totals.total;
  const rows: [string, number][] =
    invoice.letter === 'A'
      ? [
          ['Importe Neto Gravado:', totals.netTaxed],
          ...IVA_RATES.map((rate): [string, number] => [
            `IVA ${formatRate(rate)}:`,
            totals.ivaByRate[rate] ?? 0,
          ]),
          ['Importe Otros Tributos:', totals.otherTaxesTotal],
        ]
      : [
          ['Subtotal:', totals.subtotal],
          ['Importe Otros Tributos:', totals.otherTaxesTotal],
        ];

  let y = 280;
  for (const [label, value] of rows) {
    p.textRight(label, labelRight, y, { bold: true });
    p.textRight(money(value), RIGHT - 4, y);
    y -= 15;
  }
  p.textRight('Importe Total:', labelRight, y - 2, { size: 10, bold: true });
  p.textRight(money(total), RIGHT - 4, y - 2, { size: 10, bold: true });

  if (invoice.letter === 'B') {
    p.box(MARGIN, 160, RIGHT - MARGIN, 32);
    p.text('Régimen de Transparencia Fiscal al Consumidor (Ley 27.743)', MARGIN + 8, 179, {
      size: 8,
      bold: true,
    });
    p.field('IVA Contenido:', money(totals.ivaContained), MARGIN + 8, 166, 8);
  }
}

async function drawFooter(
  pdf: PDFDocument,
  page: PDFPage,
  p: Painter,
  invoice: SampleInvoice,
  qrText: string,
) {
  p.line(MARGIN, 150, RIGHT, 150);

  const png = await QRCode.toBuffer(qrText, { errorCorrectionLevel: 'M', margin: 1, width: 360 });
  const qrImage = await pdf.embedPng(png);
  page.drawImage(qrImage, { x: MARGIN, y: 48, width: 92, height: 92 });

  p.text('Comprobante de ejemplo', MARGIN + 104, 118, { size: 11, bold: true });
  p.text(
    'Documento ficticio generado para la demo de Billwise. Sin validez fiscal.',
    MARGIN + 104,
    104,
    {
      size: 7,
    },
  );

  p.field('CAE N°:', invoice.cae, 410, 118);
  p.field('Fecha de Vto. de CAE:', formatDate(invoice.caeDueDate), 410, 103);
  p.textCenter('Pág. 1/1', CENTER, 30, { size: 8 });
}
