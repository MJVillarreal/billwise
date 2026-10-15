import type { TextItem } from '@billwise/shared';
import jsQRImport from 'jsqr';
import {
  getDocument,
  type PDFDocumentProxy,
  type PDFPageProxy,
} from 'pdfjs-dist/legacy/build/pdf.mjs';

type JsQR = typeof jsQRImport.default;
// jsqr is a CommonJS bundle: depending on the bundler the function is the import itself or its default.
const jsQR: JsQR =
  (jsQRImport as unknown as { default?: JsQR }).default ?? (jsQRImport as unknown as JsQR);

interface CanvasFactory {
  create(
    width: number,
    height: number,
  ): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D };
  destroy(target: { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D }): void;
}

const QR_RENDER_SCALES = [3, 4];

export interface ReadPdfOptions {
  /** Where pdf.js finds its standard fonts, needed to render pages. */
  standardFontDataUrl?: string;
  maxPages?: number;
}

export interface PdfPage {
  number: number;
  width: number;
  height: number;
}

export interface ReadPdfResult {
  pages: PdfPage[];
  items: TextItem[];
  qrText: string | null;
}

export async function readPdf(
  data: Uint8Array,
  options: ReadPdfOptions = {},
): Promise<ReadPdfResult> {
  const task = getDocument({
    data,
    standardFontDataUrl: options.standardFontDataUrl,
    verbosity: 0,
  });
  const doc = await task.promise;

  try {
    const pageCount = Math.min(doc.numPages, options.maxPages ?? 5);
    const pages: PdfPage[] = [];
    const items: TextItem[] = [];

    for (let number = 1; number <= pageCount; number++) {
      const page = await doc.getPage(number);
      const { width, height } = page.getViewport({ scale: 1 });
      pages.push({ number, width, height });
      items.push(...(await textItems(page, number, height)));
    }

    return { pages, items, qrText: await findQr(doc, pageCount) };
  } finally {
    await task.destroy();
  }
}

async function textItems(
  page: PDFPageProxy,
  number: number,
  pageHeight: number,
): Promise<TextItem[]> {
  const content = await page.getTextContent();
  const items: TextItem[] = [];

  for (const item of content.items) {
    if (!('str' in item) || item.str.trim() === '') continue;
    const [scaleX, skewY, , , x, baseline] = item.transform;
    // Rotated text, like a watermark, is not part of the invoice data.
    if (Math.abs(skewY) > 0.01 || scaleX <= 0) continue;

    items.push({
      page: number,
      text: item.str.trim(),
      x,
      y: pageHeight - baseline - item.height,
      width: item.width,
      height: item.height,
    });
  }
  return items;
}

/** The QR is usually on the last page, so pages are scanned from the end. */
async function findQr(doc: PDFDocumentProxy, pageCount: number): Promise<string | null> {
  const canvasFactory = doc.canvasFactory as CanvasFactory;
  for (let number = pageCount; number >= 1; number--) {
    const page = await doc.getPage(number);
    for (const scale of QR_RENDER_SCALES) {
      const viewport = page.getViewport({ scale });
      const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;

      const image = context.getImageData(0, 0, viewport.width, viewport.height);
      const result = jsQR(image.data, image.width, image.height);
      canvasFactory.destroy({ canvas, context });
      if (result) return result.data;
    }
  }
  return null;
}
