'use client';

import {
  type InvoiceData,
  processExtractedInvoice,
  type ProcessResult,
  voucherKey,
} from '@billwise/shared';
import { AlertTriangle, ShieldAlert, Sparkles, Upload } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/language-provider';
import { type Prepared, prepareImage, preparePdf } from '@/lib/prepare-image';
import { ProcessingSteps, stageTimer } from './processing-steps';
import { type ReviewDocument, ReviewScreen } from './review-screen';

export type AiSource =
  { kind: 'image'; file: File } | { kind: 'pdf'; name: string; data: Uint8Array };

type AiError = 'daily_limit' | 'quota_exhausted' | 'ai_unavailable' | 'failed' | 'not_invoice';

type Phase =
  | { name: 'checking' }
  | { name: 'consent'; enabled: boolean; remaining: number }
  | { name: 'processing'; stage: number }
  | { name: 'error'; error: AiError }
  | { name: 'review'; result: ProcessResult; document: ReviewDocument; today: string };

interface AiReviewProps {
  source: AiSource;
  existingKeys: string[];
  onRestart: () => void;
}

export function AiReview({ source, existingKeys, onRestart }: AiReviewProps) {
  const { t } = useLanguage();
  const fileName = source.kind === 'image' ? source.file.name : source.name;
  const [phase, setPhase] = useState<Phase>({ name: 'checking' });

  useEffect(() => {
    let cancelled = false;
    fetch('/api/extract')
      .then((response) => response.json())
      .then((status: { enabled: boolean; remaining: number }) => {
        if (!cancelled) setPhase({ name: 'consent', ...status });
      })
      .catch(() => !cancelled && setPhase({ name: 'consent', enabled: false, remaining: 0 }));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (phase.name !== 'review' || phase.document.type !== 'image') return;
    const url = phase.document.url;
    return () => URL.revokeObjectURL(url);
  }, [phase]);

  const run = async () => {
    const { show, advance } = stageTimer((stage) => setPhase({ name: 'processing', stage }));
    const today = new Date().toISOString().slice(0, 10);
    show(0);

    let prepared: Prepared;
    try {
      prepared =
        source.kind === 'image' ? await prepareImage(source.file) : await preparePdf(source.data);
    } catch {
      setPhase({ name: 'error', error: 'failed' });
      return;
    }
    await advance(1);
    await advance(2);

    const form = new FormData();
    prepared.images.forEach((image, index) =>
      form.append('images', image, `page-${index + 1}.jpg`),
    );
    let data: InvoiceData;
    try {
      const response = await fetch('/api/extract', { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok) {
        if (prepared.preview) URL.revokeObjectURL(prepared.preview);
        setPhase({ name: 'error', error: (body.error as AiError) ?? 'ai_unavailable' });
        return;
      }
      data = body.data;
    } catch {
      setPhase({ name: 'error', error: 'ai_unavailable' });
      return;
    }

    await advance(3);
    const result = processExtractedInvoice(data, prepared.qrText, {
      today,
      existingKeys: new Set(existingKeys),
    });
    await advance(4);
    if (!result.recognized) {
      setPhase({ name: 'error', error: 'not_invoice' });
      return;
    }
    const document: ReviewDocument =
      source.kind === 'image'
        ? { type: 'image', url: prepared.preview! }
        : { type: 'pdf', data: source.data };
    setPhase({ name: 'review', result, document, today });
  };

  if (phase.name === 'checking') {
    return <div className="flex-1" />;
  }

  if (phase.name === 'consent') {
    const available = phase.enabled && phase.remaining > 0;
    return (
      <div className="mx-auto w-full max-w-lg px-4 py-14">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="flex size-11 items-center justify-center rounded-full bg-ice text-brand">
            <Sparkles className="size-5" />
          </span>
          <h1 className="mt-4 text-xl font-semibold">{t.ai.consentTitle}</h1>
          <p className="mt-1 truncate text-sm text-muted">{fileName}</p>
          <p className="mt-4 text-sm text-slate-700">{t.ai.consentText}</p>
          <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 size-4 shrink-0" />
            {t.ai.privacy}
          </p>
          <p className="mt-4 text-sm font-medium">
            {!phase.enabled
              ? t.ai.disabled
              : phase.remaining > 0
                ? t.ai.remaining(phase.remaining)
                : t.ai.noneLeft}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {available ? (
              <button
                type="button"
                onClick={run}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                <Sparkles className="size-4" />
                {t.ai.start}
              </button>
            ) : (
              <Link
                href="/demo"
                className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                {t.upload.trySamples}
              </Link>
            )}
            <button
              type="button"
              onClick={onRestart}
              className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
            >
              {t.ai.cancel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase.name === 'processing') {
    const stages = t.ai.stages;
    return (
      <ProcessingSteps
        title={t.ai.processingTitle}
        fileName={fileName}
        labels={[stages.prepare, stages.qr, stages.send, stages.validate]}
        current={phase.stage}
      />
    );
  }

  if (phase.name === 'error') {
    const message = t.ai.errors[phase.error];
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <AlertTriangle className="mx-auto size-10 text-amber-500" />
        <p className="mt-4 font-semibold">{message.title}</p>
        <p className="mt-2 text-sm text-muted">{message.text}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/demo"
            className="inline-flex items-center rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            {t.upload.trySamples}
          </Link>
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            <Upload className="size-4" />
            {t.upload.another}
          </button>
        </div>
      </div>
    );
  }

  return (
    <ReviewScreen
      result={phase.result}
      document={phase.document}
      existingKeys={existingKeys}
      today={phase.today}
      saveId={`upload-${voucherKey(phase.result.data) ?? fileName}`}
      extractor="ai"
      notice={t.ai.notice}
      onRestart={onRestart}
      restartLabel={t.upload.another}
    />
  );
}
