import { parseAmount, parseDate } from './amount.js';
import { normalizeCuit } from './cuit.js';
import { emptyInvoice, type InvoiceData, type InvoiceField } from './invoice.js';
import { type Box, type TextItem, unionBox } from './text-item.js';
import { DOC_TYPES, INVOICE_VOUCHER_CODES, type InvoiceLetter } from './voucher.js';

const LINE_TOLERANCE = 2;

export interface TextParseResult {
  data: InvoiceData;
  locations: Partial<Record<InvoiceField, Box>>;
  /** How many fields were found, to tell whether the layout was recognized. */
  recognized: number;
}

interface LabeledValue {
  label: string;
  value: string;
  items: TextItem[];
}

const normalizeLabel = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/:$/, '')
    .trim();

/**
 * Reads invoices that follow the ARCA electronic invoice layout: "Label:" followed by its value on
 * the same line. Unknown layouts return few recognized fields instead of guessing.
 */
export function parseInvoiceText(items: TextItem[]): TextParseResult {
  const data = emptyInvoice();
  const locations: Partial<Record<InvoiceField, Box>> = {};
  let recognized = 0;

  const set = (field: InvoiceField, entry: LabeledValue, apply: () => boolean) => {
    if (!apply()) return;
    recognized++;
    const box = unionBox(entry.items);
    if (box && !locations[field]) locations[field] = box;
  };

  let cuitCount = 0;
  for (const entry of labeledValues(items)) {
    const { label, value } = entry;

    if (label === 'punto de venta') {
      set('pointOfSale', entry, () => assign(digits(value), (v) => (data.pointOfSale = v)));
    } else if (label === 'comp. nro' || label === 'comp nro' || label === 'nro') {
      set('number', entry, () => assign(digits(value), (v) => (data.number = v)));
    } else if (label === 'fecha de emision') {
      set('issueDate', entry, () => assign(parseDate(value), (v) => (data.issueDate = v)));
    } else if (label === 'cuit') {
      cuitCount++;
      const cuit = normalizeCuit(value) || null;
      if (cuitCount === 1) {
        set('issuer.cuit', entry, () => assign(cuit, (v) => (data.issuer.cuit = v)));
      } else if (cuitCount === 2) {
        set('recipient.docNumber', entry, () =>
          assign(cuit, (v) => {
            data.recipient.docNumber = v;
            data.recipient.docType = DOC_TYPES.CUIT;
          }),
        );
      }
    } else if (label === 'dni') {
      set('recipient.docNumber', entry, () =>
        assign(digits(value), (v) => {
          data.recipient.docNumber = v;
          data.recipient.docType = DOC_TYPES.DNI;
        }),
      );
    } else if (label === 'razon social') {
      data.issuer.name ??= value || null;
    } else if (label === 'apellido y nombre / razon social') {
      data.recipient.name ??= value || null;
    } else if (label === 'importe neto gravado') {
      set('netTaxed', entry, () => assign(parseAmount(value), (v) => (data.netTaxed = v)));
    } else if (label === 'importe neto no gravado') {
      assign(parseAmount(value), (v) => (data.nonTaxed = v));
    } else if (label === 'importe exento') {
      assign(parseAmount(value), (v) => (data.exempt = v));
    } else if (label.startsWith('iva ') && label.endsWith('%')) {
      const rate = parseAmount(label.slice(4, -1));
      const amount = parseAmount(value);
      if (rate !== null && amount !== null && amount !== 0) {
        set('iva', entry, () => (data.iva.push({ rate, amount }), true));
      }
    } else if (label === 'importe otros tributos') {
      assign(parseAmount(value), (v) => (data.otherTaxes = v));
    } else if (label === 'importe total') {
      set('total', entry, () => assign(parseAmount(value), (v) => (data.total = v)));
    } else if (label === 'cae n°' || label === 'cae nro' || label === 'cae') {
      set('cae', entry, () => assign(digits(value), (v) => (data.cae = v)));
    } else if (label === 'fecha de vto. de cae' || label === 'vto. de cae') {
      set('caeDueDate', entry, () => assign(parseDate(value), (v) => (data.caeDueDate = v)));
    }
  }

  const voucher = findVoucherType(items);
  if (voucher) {
    data.voucherType = voucher.code;
    locations.voucherType = voucher.box;
    recognized++;
  }

  return { data, locations, recognized };
}

function assign<T>(value: T | null, apply: (value: T) => void): boolean {
  if (value === null) return false;
  apply(value);
  return true;
}

function digits(text: string): string | null {
  const only = text.replace(/\D/g, '');
  return only === '' ? null : only;
}

function groupLines(items: TextItem[]): TextItem[][] {
  const sorted = [...items].sort(
    (a, b) => a.page - b.page || a.y + a.height - (b.y + b.height) || a.x - b.x,
  );
  const lines: TextItem[][] = [];
  for (const item of sorted) {
    const line = lines.at(-1);
    const reference = line?.[0];
    const sameLine =
      reference &&
      reference.page === item.page &&
      Math.abs(reference.y + reference.height - (item.y + item.height)) <= LINE_TOLERANCE;
    if (line && sameLine) line.push(item);
    else lines.push([item]);
  }
  return lines.map((line) => line.sort((a, b) => a.x - b.x));
}

function labeledValues(items: TextItem[]): LabeledValue[] {
  const result: LabeledValue[] = [];
  for (const line of groupLines(items)) {
    let current: LabeledValue | null = null;
    for (const item of line) {
      const inline = item.text.match(/^([^:]+:)\s*(.+)$/);
      if (item.text.endsWith(':')) {
        current = { label: normalizeLabel(item.text), value: '', items: [] };
        result.push(current);
      } else if (inline && !/^\d/.test(item.text)) {
        result.push({ label: normalizeLabel(inline[1]), value: inline[2].trim(), items: [item] });
        current = null;
      } else if (current) {
        current.value = current.value ? `${current.value} ${item.text}` : item.text;
        current.items.push(item);
      }
    }
  }
  return result;
}

function findVoucherType(items: TextItem[]): { code: number; box: Box } | null {
  for (const item of items) {
    const match = item.text.match(/^cod\.?\s*(\d{1,3})$/i);
    if (match) return { code: Number(match[1]), box: item };
  }
  const letter = items
    .filter((item) => /^[ABC]$/.test(item.text))
    .sort((a, b) => b.height - a.height)[0];
  if (letter && letter.height >= 16) {
    return { code: INVOICE_VOUCHER_CODES[letter.text as InvoiceLetter], box: letter };
  }
  return null;
}
