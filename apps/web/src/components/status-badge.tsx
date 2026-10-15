'use client';

import { AlertTriangle, CheckCircle2, CircleAlert } from 'lucide-react';
import { useLanguage } from '@/i18n/language-provider';
import type { InvoiceStatus } from '@/lib/invoice-store';

const STYLES: Record<InvoiceStatus, string> = {
  ready: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  review: 'bg-amber-50 text-amber-800 ring-amber-200',
  error: 'bg-red-50 text-red-700 ring-red-200',
};

const ICONS = {
  ready: CheckCircle2,
  review: AlertTriangle,
  error: CircleAlert,
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useLanguage();
  const Icon = ICONS[status];
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${STYLES[status]}`}
    >
      <Icon className="size-3.5" />
      {t.invoices.statuses[status]}
    </span>
  );
}
