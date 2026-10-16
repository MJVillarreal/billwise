'use client';

import {
  aiExtractionToInvoice,
  processExtractedInvoice,
  type ProcessResult,
} from '@billwise/shared';
import { XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useLanguage } from '@/i18n/language-provider';
import { prepareImage } from '@/lib/prepare-image';
import type { Sample } from '@/lib/samples';
import { ProcessingSteps, stageTimer } from './processing-steps';
import { ReviewScreen } from './review-screen';

interface StoredAiReviewProps {
  sample: Sample & { photo: string; ai: NonNullable<Sample['ai']> };
  existingKeys: string[];
  nextId: string | null;
}

interface Ready {
  result: ProcessResult;
  url: string;
  today: string;
}

/** The sample photo runs through the real pipeline, except the Gemini call, whose answer is stored. */
export function StoredAiReview({ sample, existingKeys, nextId }: StoredAiReviewProps) {
  const { t } = useLanguage();
  const [stage, setStage] = useState(0);
  const [ready, setReady] = useState<Ready | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let url: string | null = null;
    const { show, advance } = stageTimer((index) => !cancelled && setStage(index));

    (async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        show(0);
        const response = await fetch(`/samples/${sample.photo}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const prepared = await prepareImage(await response.blob());
        url = prepared.preview ?? null;
        await advance(1);
        await advance(2);
        const data = aiExtractionToInvoice(sample.ai.answer);
        await advance(3);
        const result = processExtractedInvoice(data, prepared.qrText, {
          today,
          existingKeys: new Set(existingKeys),
        });
        await advance(4);
        if (cancelled || !url) return;
        setReady({ result, url, today });
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [sample, existingKeys]);

  if (failed) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <XCircle className="mx-auto size-10 text-red-500" />
        <p className="mt-4 font-semibold">{t.upload.failed.title}</p>
        <Link href="/demo" className="mt-6 inline-block font-semibold text-brand">
          {t.review.back}
        </Link>
      </div>
    );
  }

  if (!ready) {
    const stages = t.ai.stages;
    return (
      <ProcessingSteps
        title={t.ai.processingTitle}
        fileName={sample.photo}
        labels={[stages.prepare, stages.qr, t.ai.storedStage, stages.validate]}
        current={stage}
      />
    );
  }

  return (
    <ReviewScreen
      result={ready.result}
      document={{ type: 'image', url: ready.url }}
      existingKeys={existingKeys}
      today={ready.today}
      saveId={`demo-${sample.id}`}
      sampleId={sample.id}
      extractor="ai"
      notice={t.ai.storedNotice(sample.ai.model, sample.ai.date)}
      nextId={nextId}
    />
  );
}
