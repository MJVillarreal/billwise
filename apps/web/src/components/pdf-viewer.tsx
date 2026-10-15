'use client';

import type { Box, InvoiceField, Severity } from '@billwise/shared';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { getDocument, type PDFDocumentProxy } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/i18n/language-provider';
import { configurePdfjs } from '@/lib/pdf';

export interface Highlight {
  field: InvoiceField;
  label: string;
  box: Box;
  status: Severity | 'ok';
}

interface PdfViewerProps {
  data: Uint8Array;
  highlights: Highlight[];
  activeField: InvoiceField | null;
  onSelect: (field: InvoiceField) => void;
}

const STATUS_STYLES: Record<Highlight['status'], string> = {
  ok: 'border-emerald-500/70 bg-emerald-400/10',
  warning: 'border-amber-500 bg-amber-300/25',
  error: 'border-red-500 bg-red-400/20',
};

const ZOOM_STEPS = [1, 1.25, 1.5, 2];

export function PdfViewer({ data, highlights, activeField, onSelect }: PdfViewerProps) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [width, setWidth] = useState(0);
  const [zoomIndex, setZoomIndex] = useState(0);

  useEffect(() => {
    const { standardFontDataUrl } = configurePdfjs();
    const task = getDocument({ data: data.slice(), standardFontDataUrl, verbosity: 0 });
    task.promise.then(setDoc).catch(() => setDoc(null));
    return () => {
      task.destroy();
    };
  }, [data]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!activeField) return;
    const element = containerRef.current?.querySelector(`[data-field="${activeField}"]`);
    element?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  }, [activeField]);

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
      <div ref={containerRef} className="flex-1 overflow-auto p-3">
        {doc &&
          width > 0 &&
          Array.from({ length: doc.numPages }, (_, index) => (
            <PdfPage
              key={index}
              doc={doc}
              pageNumber={index + 1}
              width={(width - 24) * zoom}
              highlights={highlights.filter((highlight) => highlight.box.page === index + 1)}
              activeField={activeField}
              onSelect={onSelect}
              label={t.review.page(index + 1)}
            />
          ))}
      </div>
    </div>
  );
}

interface PdfPageProps {
  doc: PDFDocumentProxy;
  pageNumber: number;
  width: number;
  highlights: Highlight[];
  activeField: InvoiceField | null;
  onSelect: (field: InvoiceField) => void;
  label: string;
}

function PdfPage({
  doc,
  pageNumber,
  width,
  highlights,
  activeField,
  onSelect,
  label,
}: PdfPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(0);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let renderTask: { cancel: () => void } | null = null;

    doc.getPage(pageNumber).then((page) => {
      if (cancelled || !canvasRef.current) return;
      const base = page.getViewport({ scale: 1 });
      const nextScale = width / base.width;
      const ratio = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: nextScale * ratio });
      const canvas = canvasRef.current;
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      setScale(nextScale);
      setHeight(base.height * nextScale);
      const task = page.render({ canvas, viewport });
      renderTask = task;
      task.promise.catch(() => {});
    });

    return () => {
      cancelled = true;
      renderTask?.cancel();
    };
  }, [doc, pageNumber, width]);

  return (
    <div
      className="relative mx-auto mb-3 bg-white shadow-sm"
      style={{ width, height: height || undefined }}
      aria-label={label}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
      {scale > 0 &&
        highlights.map(({ field, label: fieldLabel, box, status }) => {
          const active = field === activeField;
          return (
            <button
              key={field}
              type="button"
              data-field={field}
              onClick={() => onSelect(field)}
              className={`absolute rounded-sm border-2 transition ${STATUS_STYLES[status]} ${
                active ? 'ring-4 ring-brand/40' : 'hover:ring-2 hover:ring-brand/30'
              }`}
              style={{
                left: box.x * scale - 3,
                top: box.y * scale - 3,
                width: box.width * scale + 6,
                height: box.height * scale + 6,
              }}
              aria-label={fieldLabel}
              title={fieldLabel}
            />
          );
        })}
    </div>
  );
}
