'use client';

import { Check, Loader2 } from 'lucide-react';

interface ProcessingStepsProps {
  title: string;
  fileName: string;
  labels: string[];
  current: number;
}

export function ProcessingSteps({ title, fileName, labels, current }: ProcessingStepsProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-1 truncate text-sm text-muted">{fileName}</p>
        <ol className="mt-6 space-y-3">
          {labels.map((label, index) => {
            const done = index < current;
            const active = index === current;
            return (
              <li key={label} className="flex items-center gap-3 text-sm">
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
                  {label}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand transition-all duration-500"
            style={{ width: `${(Math.min(current, labels.length) / labels.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/** Keeps each stage on screen long enough to be read, since the real work is often instant. */
export function stageTimer(onStage: (index: number) => void, minMs = 450) {
  let startedAt = Date.now();
  const show = (index: number) => {
    onStage(index);
    startedAt = Date.now();
  };
  const advance = async (index: number) => {
    const remaining = Math.max(minMs - (Date.now() - startedAt), 0);
    await new Promise((resolve) => setTimeout(resolve, remaining));
    show(index);
  };
  return { show, advance };
}
