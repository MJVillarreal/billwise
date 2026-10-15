'use client';

import { letterFromVoucherCode } from '@billwise/shared';
import { FileSpreadsheet, FileText, RotateCcw } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useLanguage } from '@/i18n/language-provider';
import { exportCsv, exportExcel } from '@/lib/export';
import { formatDateInput, formatMoney } from '@/lib/format';
import {
  type InvoiceStatus,
  invoiceStatus,
  invoiceTotals,
  resetDemo,
  useInvoices,
} from '@/lib/invoice-store';
import { StatusBadge } from './status-badge';

const STATUSES: InvoiceStatus[] = ['ready', 'review', 'error'];

export function InvoiceList() {
  const { t } = useLanguage();
  const invoices = useInvoices();
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status');

  const [status, setStatus] = useState<string>(
    initialStatus === 'pending' || STATUSES.includes(initialStatus as InvoiceStatus)
      ? initialStatus!
      : '',
  );
  const [supplier, setSupplier] = useState('');
  const [month, setMonth] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  const rows = useMemo(
    () =>
      invoices
        .map((invoice) => ({ invoice, status: invoiceStatus(invoice) }))
        .sort((a, b) =>
          (b.invoice.data.issueDate ?? '').localeCompare(a.invoice.data.issueDate ?? ''),
        ),
    [invoices],
  );

  const suppliers = useMemo(
    () =>
      [...new Set(rows.map(({ invoice }) => invoice.data.issuer.name ?? ''))]
        .filter(Boolean)
        .sort(),
    [rows],
  );
  const months = useMemo(
    () =>
      [...new Set(rows.map(({ invoice }) => invoice.data.issueDate?.slice(0, 7) ?? ''))].filter(
        Boolean,
      ),
    [rows],
  );

  const filtered = rows.filter(
    (row) =>
      (!status || (status === 'pending' ? row.status !== 'ready' : row.status === status)) &&
      (!supplier || row.invoice.data.issuer.name === supplier) &&
      (!month || row.invoice.data.issueDate?.startsWith(month)),
  );

  const filteredIds = filtered.map(({ invoice }) => invoice.id);
  const selectedVisible = selected.filter((id) => filteredIds.includes(id));
  const toExport = (
    selectedVisible.length > 0
      ? filtered.filter(({ invoice }) => selectedVisible.includes(invoice.id))
      : filtered
  ).map(({ invoice }) => invoice);

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  const allSelected = filteredIds.length > 0 && selectedVisible.length === filteredIds.length;

  const runExport = async (format: 'excel' | 'csv') => {
    setExporting(true);
    try {
      if (format === 'excel') await exportExcel(toExport, t);
      else exportCsv(toExport, t);
    } finally {
      setExporting(false);
    }
  };

  const monthLabel = (value: string) => {
    const [year, monthNumber] = value.split('-').map(Number);
    return new Date(Date.UTC(year, monthNumber - 1, 1)).toLocaleDateString(t.locale, {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const selectClass =
    'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20';

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t.invoices.title}</h1>
          <p className="mt-2 max-w-2xl text-muted">{t.invoices.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => runExport('excel')}
            disabled={exporting || toExport.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            <FileSpreadsheet className="size-4" />
            {t.invoices.exportExcel}
          </button>
          <button
            type="button"
            onClick={() => runExport('csv')}
            disabled={exporting || toExport.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
          >
            <FileText className="size-4" />
            {t.invoices.exportCsv}
          </button>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-2">
        <select
          aria-label={t.invoices.filters.status}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className={selectClass}
        >
          <option value="">
            {t.invoices.filters.status}: {t.invoices.filters.all}
          </option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {t.invoices.statuses[value]}
            </option>
          ))}
          <option value="pending">
            {t.invoices.statuses.review} + {t.invoices.statuses.error}
          </option>
        </select>
        <select
          aria-label={t.invoices.filters.supplier}
          value={supplier}
          onChange={(event) => setSupplier(event.target.value)}
          className={selectClass}
        >
          <option value="">{t.invoices.filters.allSuppliers}</option>
          {suppliers.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label={t.invoices.filters.month}
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className={selectClass}
        >
          <option value="">{t.invoices.filters.allMonths}</option>
          {months.map((value) => (
            <option key={value} value={value}>
              {monthLabel(value)}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-muted">
          {t.invoices.count(filtered.length, rows.length)}
          {selectedVisible.length > 0 && ` · ${t.invoices.selected(selectedVisible.length)}`}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted">{t.invoices.exportHint}</p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wider text-muted">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  aria-label={t.invoices.selectAll}
                  checked={allSelected}
                  onChange={() =>
                    setSelected(
                      allSelected
                        ? selected.filter((id) => !filteredIds.includes(id))
                        : [...new Set([...selected, ...filteredIds])],
                    )
                  }
                  className="size-4 accent-brand"
                />
              </th>
              <th className="px-3 py-3">{t.invoices.columns.date}</th>
              <th className="px-3 py-3">{t.invoices.columns.voucher}</th>
              <th className="px-3 py-3">{t.invoices.columns.supplier}</th>
              <th className="px-3 py-3 text-right">{t.invoices.columns.net}</th>
              <th className="px-3 py-3 text-right">{t.invoices.columns.iva}</th>
              <th className="px-3 py-3 text-right">{t.invoices.columns.total}</th>
              <th className="px-3 py-3">{t.invoices.columns.status}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(({ invoice, status: rowStatus }) => {
              const { data } = invoice;
              const totals = invoiceTotals(data);
              const letter =
                data.voucherType === null ? '?' : letterFromVoucherCode(data.voucherType);
              const checked = selected.includes(invoice.id);
              return (
                <tr key={invoice.id} className={checked ? 'bg-ice/50' : 'hover:bg-slate-50'}>
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`${data.issuer.name} ${data.number}`}
                      checked={checked}
                      onChange={() => toggle(invoice.id)}
                      className="size-4 accent-brand"
                    />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                    {formatDateInput(data.issueDate)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                    <span className="mr-1.5 inline-flex size-5 items-center justify-center rounded bg-navy text-[11px] font-bold text-white">
                      {letter}
                    </span>
                    {data.pointOfSale}-{data.number}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5">
                    {data.issuer.name}
                    {invoice.origin === 'demo' && (
                      <span className="ml-2 rounded bg-brand/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand">
                        {t.invoices.demoBadge}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                    {formatMoney(totals.net, t.locale)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                    {formatMoney(totals.iva, t.locale)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums">
                    {formatMoney(totals.total, t.locale)}
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={rowStatus} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-10 text-center text-muted">
                  {t.invoices.empty}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => window.confirm(t.invoices.resetConfirm) && resetDemo()}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-navy"
      >
        <RotateCcw className="size-4" />
        {t.invoices.reset}
      </button>
    </div>
  );
}
