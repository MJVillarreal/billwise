'use client';

import { ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/i18n/language-provider';

const ZOOM_STEPS = [1, 1.5, 2, 3];

export function ImageViewer({ url }: { url: string }) {
  const { t } = useLanguage();
  const [zoomIndex, setZoomIndex] = useState(0);
  const zoom = ZOOM_STEPS[zoomIndex];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
      <div className="flex items-center justify-end gap-1 border-b border-slate-200 bg-white px-2 py-1.5">
        <button
          type="button"
          onClick={() => setZoomIndex((index) => Math.max(index - 1, 0))}
          disabled={zoomIndex === 0}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          aria-label={t.review.zoomOut}
          title={t.review.zoomOut}
        >
          <ZoomOut className="size-4" />
        </button>
        <span className="w-12 text-center text-xs tabular-nums text-muted">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => setZoomIndex((index) => Math.min(index + 1, ZOOM_STEPS.length - 1))}
          disabled={zoomIndex === ZOOM_STEPS.length - 1}
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          aria-label={t.review.zoomIn}
          title={t.review.zoomIn}
        >
          <ZoomIn className="size-4" />
        </button>
      </div>
      <div className="flex-1 overflow-auto p-3">
        {/* A local object URL: next/image cannot optimize it. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt=""
          className="mx-auto block max-w-none bg-white shadow-sm"
          style={{ width: `${zoom * 100}%` }}
        />
      </div>
    </div>
  );
}
