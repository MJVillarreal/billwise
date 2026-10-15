'use client';

import { voucherKey } from '@billwise/shared';
import { FileUp, ImageOff, ShieldCheck } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/i18n/language-provider';
import { useInvoices } from '@/lib/invoice-store';
import { InvoiceReview, type ReviewSource } from './invoice-review';

const MAX_BYTES = 10 * 1024 * 1024;

export function UploadFlow() {
  const { t } = useLanguage();
  const invoices = useInvoices();
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<ReviewSource | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  // Taken when a file is chosen, so confirming the upload does not re-run the review.
  const [existingKeys, setExistingKeys] = useState<string[]>([]);
  const currentKeys = useMemo(
    () =>
      invoices
        .map((invoice) => voucherKey(invoice.data))
        .filter((key): key is string => key !== null),
    [invoices],
  );

  const accept = async (file: File | undefined) => {
    if (!file) return;
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) return setError(t.upload.notPdf);
    if (file.size > MAX_BYTES) return setError(t.upload.tooLarge);

    setError(null);
    setExistingKeys(currentKeys);
    setSource({ kind: 'upload', name: file.name, data: new Uint8Array(await file.arrayBuffer()) });
  };

  const restart = () => {
    setSource(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (source) {
    return <InvoiceReview source={source} existingKeys={existingKeys} onRestart={restart} />;
  }

  return (
    <div className="bg-slate-50">
      <div className="mx-auto w-full max-w-3xl px-4 py-12">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand">
          {t.upload.eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{t.upload.title}</h1>
        <p className="mt-3 text-muted">{t.upload.subtitle}</p>

        <label
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void accept(event.dataTransfer.files[0]);
          }}
          className={`mt-8 flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-14 text-center transition ${
            dragging ? 'border-brand bg-ice' : 'border-slate-300 bg-white hover:border-brand/60'
          }`}
        >
          <span className="flex size-14 items-center justify-center rounded-full bg-ice text-brand">
            <FileUp className="size-7" strokeWidth={1.75} />
          </span>
          <span className="mt-4 font-semibold">{t.upload.drop}</span>
          <span className="mt-3 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white">
            {t.upload.choose}
          </span>
          <span className="mt-3 text-xs text-muted">{t.upload.limits}</span>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => void accept(event.target.files?.[0])}
          />
        </label>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        <ul className="mt-6 space-y-2 text-sm text-muted">
          <li className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            {t.upload.privacy}
          </li>
          <li className="flex items-start gap-2">
            <ImageOff className="mt-0.5 size-4 shrink-0" />
            {t.upload.photosLater}
          </li>
        </ul>
      </div>
    </div>
  );
}
