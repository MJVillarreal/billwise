'use client';

import { readPdf } from '@billwise/reader';
import { processInvoice, type ProcessResult, voucherKey } from '@billwise/shared';
import { FileQuestion, Sparkles, Upload, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/language-provider';
import { configurePdfjs } from '@/lib/pdf';
import type { Sample } from '@/lib/samples';
import { ProcessingSteps, stageTimer } from './processing-steps';
import { ReviewScreen } from './review-screen';

export type ReviewSource =
  { kind: 'sample'; sample: Sample } | { kind: 'upload'; name: string; data: Uint8Array };

interface InvoiceReviewProps {
  source: ReviewSource;
  existingKeys: string[];
  nextId?: string | null;
  onRestart?: () => void;
  /** Offered when the PDF has no readable text, so it can be read with AI instead. */
  onUseAi?: (data: Uint8Array) => void;
}

interface Processed {
  data: Uint8Array;
  result: ProcessResult;
  today: string;
  qrOnly: boolean;
}

export function InvoiceReview({
  source,
  existingKeys,
  nextId,
  onRestart,
  onUseAi,
}: InvoiceReviewProps) {
  const { t } = useLanguage();
  const fileName = source.kind === 'sample' ? source.sample.file : source.name;
  const [stage, setStage] = useState(0);
  const [failed, setFailed] = useState(false);
  const [unreadable, setUnreadable] = useState<{
    reason: 'scanned' | 'unknown';
    data: Uint8Array;
  } | null>(null);
  const [processed, setProcessed] = useState<Processed | null>(null);

  useEffect(() => {
    let cancelled = false;
    const { show, advance } = stageTimer((index) => !cancelled && setStage(index));

    (async () => {
      try {
        const { standardFontDataUrl } = configurePdfjs();
        const today = new Date().toISOString().slice(0, 10);
        show(0);
        let data: Uint8Array;
        if (source.kind === 'sample') {
          const response = await fetch(`/samples/${source.sample.file}`);
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          data = new Uint8Array(await response.arrayBuffer());
        } else {
          data = source.data;
        }
        await advance(1);

        const pdf = await readPdf(data.slice(), {
          standardFontDataUrl,
          onStage: (step) => step === 'qr' && show(2),
        });
        await advance(3);
        const result = processInvoice(pdf, { today, existingKeys: new Set(existingKeys) });
        await advance(4);
        await advance(5);
        if (cancelled) return;
        if (!result.recognized) {
          setUnreadable({ reason: pdf.items.length === 0 ? 'scanned' : 'unknown', data });
          return;
        }
        setProcessed({ data, result, today, qrOnly: pdf.items.length === 0 });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [source, existingKeys]);

  if (failed || unreadable) {
    const message = failed ? t.upload.failed : t.upload.unreadable[unreadable!.reason];
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        {failed ? (
          <XCircle className="mx-auto size-10 text-red-500" />
        ) : (
          <FileQuestion className="mx-auto size-10 text-amber-500" />
        )}
        <p className="mt-4 font-semibold">{message.title}</p>
        <p className="mt-2 text-sm text-muted">{message.text}</p>
        <p className="mt-1 truncate text-xs text-muted">{fileName}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {unreadable && onUseAi && (
            <button
              type="button"
              onClick={() => onUseAi(unreadable.data)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              <Sparkles className="size-4" />
              {t.ai.readWithAi}
            </button>
          )}
          {onRestart && (
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              <Upload className="size-4" />
              {t.upload.another}
            </button>
          )}
          <Link
            href="/demo"
            className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            {t.upload.trySamples}
          </Link>
        </div>
      </div>
    );
  }

  if (!processed) {
    const stages = t.processing.stages;
    return (
      <ProcessingSteps
        title={t.processing.title}
        fileName={fileName}
        labels={[stages.download, stages.text, stages.qr, stages.extract, stages.validate]}
        current={stage}
      />
    );
  }

  return (
    <ReviewScreen
      result={processed.result}
      document={{ type: 'pdf', data: processed.data }}
      existingKeys={existingKeys}
      today={processed.today}
      saveId={
        source.kind === 'sample'
          ? `demo-${source.sample.id}`
          : `upload-${voucherKey(processed.result.data) ?? fileName}`
      }
      sampleId={source.kind === 'sample' ? source.sample.id : undefined}
      extractor="text"
      notice={processed.qrOnly ? t.upload.qrOnly : undefined}
      noticeAction={
        processed.qrOnly && onUseAi
          ? { label: t.ai.readWithAi, onClick: () => onUseAi(processed.data) }
          : undefined
      }
      nextId={nextId}
      onRestart={onRestart}
      restartLabel={t.upload.another}
    />
  );
}
