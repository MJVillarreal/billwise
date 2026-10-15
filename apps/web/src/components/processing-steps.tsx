'use client';

import { Check, Loader2 } from 'lucide-react';
import { useLanguage } from '@/i18n/language-provider';

export const STAGES = ['download', 'text', 'qr', 'extract', 'validate'] as const;
export type Stage = (typeof STAGES)[number];

export function ProcessingSteps({ current, fileName }: { current: number; fileName: string }) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">{t.processing.title}</h1>
        <p className="mt-1 truncate text-sm text-muted">{fileName}</p>
        <ol className="mt-6 space-y-3">
          {STAGES.map((stage, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li key={stage} className="flex items-center gap-3 text-sm">
                <span
                  className={`flex size-6 items-center justify-center rounded-full transition ${
                    done
                      ? 'bg-brand text-white'
                      : active
                        ? 'bg-ice text-brand'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {done ? (
                    <Check className="size-3.5" strokeWidth={3} />
                  ) : active ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>
                <span className={done || active ? 'font-medium text-navy' : 'text-slate-400'}>
                  {t.processing.stages[stage]}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${(Math.min(current, STAGES.length) / STAGES.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
