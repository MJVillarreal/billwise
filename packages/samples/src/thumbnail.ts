import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import type { Canvas, SKRSContext2D } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const standardFontDataUrl = `${dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'))}/standard_fonts/`;

export async function renderThumbnail(pdf: Uint8Array, width = 480): Promise<Buffer> {
  const task = getDocument({ data: pdf, standardFontDataUrl, verbosity: 0 });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
    const factory = doc.canvasFactory as {
      create(w: number, h: number): { canvas: Canvas; context: SKRSContext2D };
    };
    const { canvas, context } = factory.create(viewport.width, viewport.height);
    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;
    return canvas.encode('webp', 82);
  } finally {
    await task.destroy();
  }
}
