import { letterFromVoucherCode } from '@billwise/shared';
import type { Messages } from '@/i18n/messages';
import { invoiceStatus, type StoredInvoice } from './invoice-store';

type Cell = string | number | null;

interface ExportTable {
  headers: string[];
  rows: Cell[][];
  amountColumns: number[];
}

function buildTable(invoices: StoredInvoice[], t: Messages): ExportTable {
  const rates = [
    ...new Set(invoices.flatMap((invoice) => invoice.data.iva.map((line) => line.rate))),
  ].sort((a, b) => b - a);
  const c = t.invoices.columns;
  const headers = [
    c.date,
    t.fields.voucherType,
    t.fields.pointOfSale,
    t.fields.number,
    c.cuit,
    c.supplier,
    t.fields.netTaxed,
    ...rates.map((rate) => `${c.iva} ${String(rate).replace('.', ',')}%`),
    c.otherTaxes,
    c.total,
    c.cae,
    c.status,
  ];

  const rows = invoices.map(({ data, ...rest }) => {
    const letter = data.voucherType === null ? null : letterFromVoucherCode(data.voucherType);
    return [
      data.issueDate,
      letter,
      data.pointOfSale,
      data.number,
      data.issuer.cuit,
      data.issuer.name,
      data.netTaxed,
      ...rates.map((rate) => data.iva.find((line) => line.rate === rate)?.amount ?? null),
      data.otherTaxes,
      data.total,
      data.cae,
      t.invoices.statuses[invoiceStatus({ data, ...rest })],
    ];
  });

  const firstAmount = 6;
  const amountColumns = Array.from({ length: rates.length + 4 - 1 }, (_, i) => firstAmount + i);
  return { headers, rows, amountColumns };
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

const fileStamp = () => new Date().toISOString().slice(0, 10);

/** Standard CSV (comma separated, dot decimals) for other systems; Excel users get the .xlsx. */
export function exportCsv(invoices: StoredInvoice[], t: Messages) {
  const { headers, rows } = buildTable(invoices, t);
  const escape = (value: Cell) => {
    const text = value === null ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\r\n');
  download(
    new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }),
    `billwise-${fileStamp()}.csv`,
  );
}

export async function exportExcel(invoices: StoredInvoice[], t: Messages) {
  const { headers, rows, amountColumns } = buildTable(invoices, t);
  const { default: ExcelJS } = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Billwise';
  const sheet = workbook.addWorksheet(t.invoices.title, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.addRow(headers);
  for (const row of rows) {
    sheet.addRow(
      row.map((value, index) => (index === 0 && value ? new Date(`${value}T00:00:00Z`) : value)),
    );
  }

  const header = sheet.getRow(1);
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
  sheet.getColumn(1).numFmt = 'dd/mm/yyyy';
  for (const column of amountColumns) sheet.getColumn(column + 1).numFmt = '#,##0.00';
  sheet.columns.forEach((column, index) => {
    const longest = Math.max(...[headers, ...rows].map((row) => String(row[index] ?? '').length));
    column.width = Math.min(Math.max(longest + 2, 10), 40);
  });
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: headers.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  download(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `billwise-${fileStamp()}.xlsx`,
  );
}
