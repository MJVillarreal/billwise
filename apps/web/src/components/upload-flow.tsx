'use client';

import { voucherKey } from '@billwise/shared';
import { FileUp, ShieldCheck, Sparkles } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/i18n/language-provider';
import { useInvoices } from '@/lib/invoice-store';
import { AiReview, type AiSource } from './ai-review';
import { InvoiceReview, type ReviewSource } from './invoice-review';

const MAX_BYTES = 10 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type Selected = { mode: 'pdf'; source: ReviewSource } | { mode: 'ai'; source: AiSource };

export function UploadFlow() {
  const { t } = useLanguage();
  const invoices = useInvoices();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Selected | null>(null);
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
    const isImage = IMAGE_TYPES.includes(file.type);
    if (!isPdf && !isImage) return setError(t.upload.notPdf);
    if (file.size > MAX_BYTES) return setError(t.upload.tooLarge);

    setError(null);
    setExistingKeys(currentKeys);
    if (isImage) {
      setSelected({ mode: 'ai', source: { kind: 'image', file } });
    } else {
      const data = new Uint8Array(await file.arrayBuffer());
      setSelected({ mode: 'pdf', source: { kind: 'upload', name: file.name, data } });
    }
  };

  const restart = () => {
    setSelected(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (selected?.mode === 'ai') {
    return <AiReview source={selected.source} existingKeys={existingKeys} onRestart={restart} />;
  }

  if (selected?.mode === 'pdf') {
    const name = selected.source.kind === 'upload' ? selected.source.name : '';
    return (
      <InvoiceReview
        source={selected.source}
        existingKeys={existingKeys}
        onRestart={restart}
        onUseAi={(data) => setSelected({ mode: 'ai', source: { kind: 'pdf', name, data } })}
      />
    );
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
            accept="application/pdf,.pdf,image/jpeg,image/png,image/webp"
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
            <Sparkles className="mt-0.5 size-4 shrink-0 text-brand" />
            {t.upload.photosLater}
          </li>
        </ul>
      </div>
    </div>
  );
}
