'use client';

import {
  type InvoiceField,
  letterFromVoucherCode,
  type ProcessResult,
  type Severity,
  type ValidationIssue,
  validateInvoice,
  worstSeverityByField,
} from '@billwise/shared';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Braces,
  Check,
  CheckCircle2,
  CircleAlert,
  Info,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';
import { useLanguage } from '@/i18n/language-provider';
import { FORM_FIELDS, type FormValues, fromForm, ivaKey, toForm } from '@/lib/invoice-form';
import { saveInvoice } from '@/lib/invoice-store';
import { ImageViewer } from './image-viewer';
import { type Highlight, PdfViewer } from './pdf-viewer';

export type ReviewDocument = { type: 'pdf'; data: Uint8Array } | { type: 'image'; url: string };

interface ReviewScreenProps {
  result: ProcessResult;
  document: ReviewDocument;
  existingKeys: string[];
  today: string;
  saveId: string;
  sampleId?: string;
  extractor: 'text' | 'ai';
  notice?: string;
  noticeAction?: { label: string; onClick: () => void };
  nextId?: string | null;
  onRestart?: () => void;
  restartLabel?: string;
}

type Status = Severity | 'ok';

export function ReviewScreen(props: ReviewScreenProps) {
  const {
    result,
    document: file,
    existingKeys,
    today,
    saveId,
    sampleId,
    extractor,
    notice,
  } = props;
  const { noticeAction, nextId, onRestart, restartLabel } = props;
  const { t } = useLanguage();
  const [values, setValues] = useState<FormValues>(() => toForm(result.data));
  const [editedKeys, setEditedKeys] = useState<string[]>([]);
  const [activeField, setActiveField] = useState<InvoiceField | null>(null);
  const [showJson, setShowJson] = useState(false);
  const [saved, setSaved] = useState(false);

  const live = useMemo(() => {
    const data = fromForm(values, result.data);
    const editedFields = new Set(editedKeys.map((key) => FORM_FIELDS[key]).filter(Boolean));
    const qrNotes = result.issues.filter(
      (issue) => issue.code === 'qr_mismatch' && !editedFields.has(issue.field),
    );
    const validation = validateInvoice(data, { today, existingKeys: new Set(existingKeys) });
    const issues = [...qrNotes, ...validation.issues];
    return { data, issues, fields: worstSeverityByField(issues) };
  }, [result, values, editedKeys, today, existingKeys]);

  const statusOf = (field: InvoiceField): Status => live.fields[field] ?? 'ok';
  const errors = live.issues.filter((issue) => issue.severity === 'error').length;
  const warnings = live.issues.filter((issue) => issue.severity === 'warning').length;
  const overall: Status = errors > 0 ? 'error' : warnings > 0 ? 'warning' : 'ok';
  const letter =
    live.data.voucherType === null ? null : letterFromVoucherCode(live.data.voucherType);
  const otherSource = extractor === 'ai' ? t.ai.source : t.review.sources.text;

  const highlights: Highlight[] = Object.entries(result.locations).map(([field, box]) => ({
    field: field as InvoiceField,
    label: t.fields[field as Exclude<InvoiceField, 'invoice'>],
    box: box!,
    status: statusOf(field as InvoiceField),
  }));

  const confirm = () => {
    saveInvoice({ id: saveId, data: live.data, origin: 'demo', sampleId, confirmed: true });
    setSaved(true);
  };

  const update = (key: string, value: string) => {
    setSaved(false);
    setValues((current) => ({ ...current, [key]: value }));
    setEditedKeys((current) => (current.includes(key) ? current : [...current, key]));
  };

  const selectFromPdf = (field: InvoiceField) => {
    setActiveField(field);
    document.querySelector<HTMLElement>(`[data-invoice-field="${field}"]`)?.focus();
  };

  const rowProps = (key: string, field: InvoiceField | null) => ({
    id: key,
    value: values[key] ?? '',
    onChange: (value: string) => update(key, value),
    onFocus: () => field && result.locations[field] && setActiveField(field),
    status: field ? statusOf(field) : ('ok' as Status),
    issues: field ? live.issues.filter((issue) => issue.field === field) : [],
    source:
      field && values[key]
        ? result.fromQr.includes(field)
          ? t.review.sources.qr
          : otherSource
        : null,
    edited: editedKeys.includes(key),
    active: field !== null && field === activeField,
    field,
  });

  const invoiceIssues = live.issues.filter((issue) => issue.field === 'invoice');

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {onRestart ? (
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-navy"
            >
              <ArrowLeft className="size-4" />
              {restartLabel}
            </button>
          ) : (
            <Link
              href="/demo"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-navy"
            >
              <ArrowLeft className="size-4" />
              {t.review.back}
            </Link>
          )}
          <h1 className="mt-2 text-2xl font-bold tracking-tight">
            {t.review.invoice} {letter ?? '?'} {live.data.pointOfSale ?? '-----'}-
            {live.data.number ?? '--------'}
          </h1>
          <p className="text-sm text-muted">{live.data.issuer.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={overall} />
          <button
            type="button"
            onClick={() => setShowJson((value) => !value)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <Braces className="size-4" />
            {showJson ? t.review.hideJson : t.review.showJson}
          </button>
          {nextId && (
            <Link
              href={`/demo/${nextId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50"
            >
              {t.review.next}
              <ArrowRight className="size-4" />
            </Link>
          )}
          <button
            type="button"
            onClick={confirm}
            disabled={errors > 0 || saved}
            title={errors > 0 ? t.review.confirmDisabled : undefined}
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Check className="size-4" />
            {saved ? t.review.saved : t.review.confirm}
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm text-muted">
        {t.review.summary(errors, warnings)}
        {errors > 0 && ` ${t.review.confirmDisabled}`}
      </p>

      {notice && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-brand/20 bg-ice px-4 py-3 text-sm text-slate-700">
          <Info className="mt-0.5 size-4 shrink-0 text-brand" />
          <span className="flex-1">{notice}</span>
          {noticeAction && (
            <button
              type="button"
              onClick={noticeAction.onClick}
              className="shrink-0 font-semibold text-brand hover:text-brand-dark"
            >
              {noticeAction.label}
            </button>
          )}
        </div>
      )}

      {saved && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0" />
            {t.review.savedMessage}
          </span>
          <Link href="/demo/invoices" className="font-semibold underline-offset-2 hover:underline">
            {t.review.viewInvoices}
          </Link>
        </div>
      )}

      {invoiceIssues.map((issue) => (
        <div
          key={issue.code}
          className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          <XCircle className="size-4 shrink-0" />
          {t.issues[issue.code](issue.params ?? {})}
        </div>
      ))}

      {showJson && (
        <pre className="mt-4 max-h-80 overflow-auto rounded-xl bg-navy p-4 font-mono text-xs leading-relaxed text-ice">
          {JSON.stringify(live.data, null, 2)}
        </pre>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="h-[65vh] lg:sticky lg:top-20 lg:h-[calc(100vh-6.5rem)]">
          {file.type === 'pdf' ? (
            <PdfViewer
              data={file.data}
              highlights={highlights}
              activeField={activeField}
              onSelect={selectFromPdf}
            />
          ) : (
            <ImageViewer url={file.url} />
          )}
        </div>

        <div className="space-y-5">
          <Section title={t.review.sections.voucher}>
            <FieldRow label={t.fields.voucherType} {...rowProps('voucherType', 'voucherType')}>
              <select
                id="input-voucherType"
                data-invoice-field="voucherType"
                value={values.voucherType ?? ''}
                onChange={(event) => update('voucherType', event.target.value)}
                onFocus={() => setActiveField('voucherType')}
                className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm"
              >
                <option value="" disabled>
                  -
                </option>
                <option value="1">Factura A (001)</option>
                <option value="6">Factura B (006)</option>
                <option value="11">Factura C (011)</option>
              </select>
            </FieldRow>
            <FieldRow label={t.fields.pointOfSale} {...rowProps('pointOfSale', 'pointOfSale')} />
            <FieldRow label={t.fields.number} {...rowProps('number', 'number')} />
            <FieldRow label={t.fields.issueDate} {...rowProps('issueDate', 'issueDate')} />
          </Section>

          <Section title={t.review.sections.issuer}>
            <FieldRow label={t.fields['issuer.cuit']} {...rowProps('issuerCuit', 'issuer.cuit')} />
            <FieldRow label={t.fields.issuerName} {...rowProps('issuerName', null)} />
          </Section>

          <Section title={t.review.sections.recipient}>
            <FieldRow
              label={t.fields['recipient.docNumber']}
              {...rowProps('recipientDoc', 'recipient.docNumber')}
            />
            <FieldRow label={t.fields.recipientName} {...rowProps('recipientName', null)} />
          </Section>

          <Section title={t.review.sections.amounts}>
            {letter === 'A' && (
              <FieldRow label={t.fields.netTaxed} {...rowProps('netTaxed', 'netTaxed')} />
            )}
            {result.data.iva.length > 0 ? (
              result.data.iva.map((line, index) => (
                <FieldRow
                  key={line.rate}
                  label={`${t.fields.iva} ${String(line.rate).replace('.', ',')}%`}
                  {...rowProps(ivaKey(line.rate), 'iva')}
                  issues={index === 0 ? live.issues.filter((issue) => issue.field === 'iva') : []}
                  field={index === 0 ? 'iva' : null}
                />
              ))
            ) : (
              <p className="px-1 text-sm text-muted">{t.review.noIva}</p>
            )}
            <FieldRow label={t.fields.otherTaxes} {...rowProps('otherTaxes', null)} />
            <FieldRow label={t.fields.total} {...rowProps('total', 'total')} emphasis />
          </Section>

          <Section title={t.review.sections.authorization}>
            <FieldRow label={t.fields.cae} {...rowProps('cae', 'cae')} />
            <FieldRow label={t.fields.caeDueDate} {...rowProps('caeDueDate', 'caeDueDate')} />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

const STATUS_ICON = {
  ok: <CheckCircle2 className="size-4 text-emerald-500" />,
  warning: <AlertTriangle className="size-4 text-amber-500" />,
  error: <CircleAlert className="size-4 text-red-500" />,
};

interface FieldRowProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onFocus: () => void;
  status: Status;
  issues: ValidationIssue[];
  source: string | null;
  edited: boolean;
  active: boolean;
  field: InvoiceField | null;
  emphasis?: boolean;
  children?: ReactNode;
}

function FieldRow(props: FieldRowProps) {
  const { t } = useLanguage();
  const { id, label, value, onChange, onFocus, status, issues, source, edited, active, field } =
    props;
  const { emphasis, children } = props;
  const inputId = `input-${id}`;

  const border =
    status === 'error'
      ? 'border-red-300 bg-red-50/60'
      : status === 'warning'
        ? 'border-amber-300 bg-amber-50/60'
        : active
          ? 'border-brand/40 bg-ice/40'
          : 'border-transparent';

  return (
    <div className={`rounded-lg border px-2 py-1.5 transition ${border}`}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 sm:grid-cols-[8.5rem_minmax(0,1fr)_auto]">
        <label htmlFor={inputId} className="col-span-2 text-sm text-muted sm:col-span-1">
          {label}
        </label>
        {children ?? (
          <input
            id={inputId}
            data-invoice-field={field ?? undefined}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onFocus={onFocus}
            className={`w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm tabular-nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 ${
              emphasis ? 'font-semibold' : ''
            }`}
          />
        )}
        <span className="flex items-center gap-1.5">
          {source && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${
                !edited && source === 'QR'
                  ? 'bg-brand/10 text-brand'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              {edited ? t.review.edited : source}
            </span>
          )}
          {STATUS_ICON[status]}
        </span>
      </div>
      {issues.map((issue) => (
        <p
          key={`${issue.code}-${JSON.stringify(issue.params)}`}
          className={`mt-1 text-xs sm:pl-[9rem] ${issue.severity === 'error' ? 'text-red-700' : 'text-amber-700'}`}
        >
          {t.issues[issue.code](issue.params ?? {})}
        </p>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: Status }) {
  const { t } = useLanguage();
  const styles = {
    ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    warning: 'bg-amber-50 text-amber-800 ring-amber-200',
    error: 'bg-red-50 text-red-700 ring-red-200',
  };
  const label = {
    ok: t.review.status.ready,
    warning: t.review.status.review,
    error: t.review.status.errors,
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-1 ${styles[status]}`}
    >
      {STATUS_ICON[status]}
      {label[status]}
    </span>
  );
}
