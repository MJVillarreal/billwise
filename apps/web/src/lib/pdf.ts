import { GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

export function configurePdfjs(): { standardFontDataUrl: string } {
  if (!GlobalWorkerOptions.workerSrc) {
    GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
  }
  return { standardFontDataUrl: `${window.location.origin}/pdfjs/standard_fonts/` };
}
