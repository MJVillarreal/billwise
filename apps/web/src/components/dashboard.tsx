'use client';

import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useLanguage } from '@/i18n/language-provider';
import { formatMoney } from '@/lib/format';
import { invoiceStatus, invoiceTotals, useInvoices } from '@/lib/invoice-store';

const BRAND = '#4f6bff';
const GRID = '#e2e8f0';
const AXIS_TEXT = '#64748b';

export function Dashboard() {
  const { t } = useLanguage();
  const invoices = useInvoices();

  const stats = useMemo(() => {
    const byMonth = new Map<string, number>();
    const bySupplier = new Map<string, number>();
    let total = 0;
    let ivaCredit = 0;
    let pending = 0;

    for (const invoice of invoices) {
      const { data } = invoice;
      const amounts = invoiceTotals(data);
      const status = invoiceStatus(invoice);
      const month = data.issueDate?.slice(0, 7);
      total += amounts.total;
      if (month) byMonth.set(month, (byMonth.get(month) ?? 0) + amounts.total);
      const supplier = data.issuer.name ?? '-';
      bySupplier.set(supplier, (bySupplier.get(supplier) ?? 0) + amounts.total);
      if (data.voucherType === 1 && status !== 'error') ivaCredit += amounts.iva;
      if (status !== 'ready') pending++;
    }

    return {
      total,
      ivaCredit,
      pending,
      count: invoices.length,
      months: [...byMonth.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, amount]) => ({ month, amount })),
      suppliers: [...bySupplier.entries()]
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
        .map(([supplier, amount]) => ({ supplier, amount })),
    };
  }, [invoices]);

  const monthLabel = (value: string, style: 'short' | 'long' = 'short') => {
    const [year, month] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString(t.locale, {
      month: style,
      ...(style === 'long' ? { year: 'numeric' } : {}),
      timeZone: 'UTC',
    });
  };

  const compact = (value: number) =>
    `$ ${value.toLocaleString(t.locale, { notation: 'compact', maximumFractionDigits: 1 })}`;

  return (
    <div className="bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight">{t.dashboard.title}</h1>
        <p className="mt-2 text-muted">{t.dashboard.subtitle}</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label={t.dashboard.totalSpend} value={formatMoney(stats.total, t.locale)} />
          <StatTile
            label={t.dashboard.ivaCredit}
            value={formatMoney(stats.ivaCredit, t.locale)}
            hint={t.dashboard.ivaCreditHint}
          />
          <StatTile label={t.dashboard.invoiceCount} value={String(stats.count)} />
          <StatTile
            label={t.dashboard.pending}
            value={String(stats.pending)}
            action={
              stats.pending > 0 && (
                <Link
                  href="/demo/invoices?status=pending"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  {t.dashboard.pendingLink}
                  <ArrowRight className="size-4" />
                </Link>
              )
            }
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <ChartCard
            className="lg:col-span-3"
            title={t.dashboard.byMonth}
            hint={t.dashboard.byMonthHint}
            table={{
              headers: [t.dashboard.month, t.dashboard.amount],
              rows: stats.months.map(({ month, amount }) => [
                monthLabel(month, 'long'),
                formatMoney(amount, t.locale),
              ]),
            }}
            showData={t.dashboard.showData}
          >
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.months} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke={GRID} />
                <XAxis
                  dataKey="month"
                  tickFormatter={(value: string) => monthLabel(value)}
                  tickLine={false}
                  axisLine={{ stroke: GRID }}
                  tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                />
                <YAxis
                  tickFormatter={compact}
                  tickLine={false}
                  axisLine={false}
                  width={64}
                  tick={{ fill: AXIS_TEXT, fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: '#e8effd', opacity: 0.6 }}
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      value={payload?.[0]?.value}
                      label={monthLabel(String(label ?? ''), 'long')}
                      locale={t.locale}
                    />
                  )}
                />
                <Bar dataKey="amount" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            className="lg:col-span-2"
            title={t.dashboard.topSuppliers}
            hint={t.dashboard.topSuppliersHint}
            table={{
              headers: [t.dashboard.supplier, t.dashboard.amount],
              rows: stats.suppliers.map(({ supplier, amount }) => [
                supplier,
                formatMoney(amount, t.locale),
              ]),
            }}
            showData={t.dashboard.showData}
          >
            <ul className="space-y-3">
              {stats.suppliers.map(({ supplier, amount }) => (
                <li key={supplier} className="group">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate">{supplier}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{compact(amount)}</span>
                  </div>
                  <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${(amount / (stats.suppliers[0]?.amount || 1)) * 100}%` }}
                      title={formatMoney(amount, t.locale)}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
  action,
}: {
  label: string;
  value: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

function ChartCard({
  title,
  hint,
  className,
  table,
  showData,
  children,
}: {
  title: string;
  hint: string;
  className?: string;
  table: { headers: string[]; rows: string[][] };
  showData: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white p-5 ${className ?? ''}`}>
      <h2 className="font-semibold">{title}</h2>
      <p className="mt-0.5 text-sm text-muted">{hint}</p>
      <div className="mt-5">{children}</div>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-muted hover:text-navy">{showData}</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              {table.headers.map((header, index) => (
                <th key={header} className={`py-1 ${index > 0 ? 'text-right' : ''}`}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row) => (
              <tr key={row[0]} className="border-t border-slate-100">
                {row.map((cell, index) => (
                  <td
                    key={index}
                    className={`py-1.5 ${index > 0 ? 'text-right tabular-nums' : ''}`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

function ChartTooltip({
  active,
  value,
  label,
  locale,
}: {
  active?: boolean;
  value: unknown;
  label: string;
  locale: string;
}) {
  if (!active || value === undefined) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="text-xs text-muted">{label}</p>
      <p className="font-semibold tabular-nums">{formatMoney(Number(value), locale)}</p>
    </div>
  );
}
