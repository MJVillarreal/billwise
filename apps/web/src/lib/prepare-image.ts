import { findQrInPixels, readPdf } from '@billwise/reader';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { configurePdfjs } from './pdf';

const MAX_SIDE = 1600;
const QR_SIDE = 4000;
const MAX_PDF_PAGES = 3;

export interface Prepared {
  images: Blob[];
  qrText: string | null;
  preview?: string;
}

function drawScaled(source: CanvasImageSource, width: number, height: number, maxSide: number) {
  const scale = Math.min(1, maxSide / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

const toJpeg = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('toBlob'))),
      'image/jpeg',
      0.85,
    ),
  );

/** Photos are resized before upload: smaller requests, and serverless limits stay out of reach. */
export async function prepareImage(file: Blob): Promise<Prepared> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const forQr = drawScaled(bitmap, bitmap.width, bitmap.height, QR_SIDE);
    const qrPixels = forQr.context.getImageData(0, 0, forQr.canvas.width, forQr.canvas.height);
    const qrText = findQrInPixels(qrPixels.data, qrPixels.width, qrPixels.height);

    const { canvas } = drawScaled(bitmap, bitmap.width, bitmap.height, MAX_SIDE);
    const jpeg = await toJpeg(canvas);
    return { images: [jpeg], qrText, preview: URL.createObjectURL(jpeg) };
  } finally {
    bitmap.close();
  }
}

export async function preparePdf(data: Uint8Array): Promise<Prepared> {
  const { standardFontDataUrl } = configurePdfjs();
  const { qrText } = await readPdf(data.slice(), { standardFontDataUrl });
  const task = getDocument({ data: data.slice(), standardFontDataUrl, verbosity: 0 });
  const doc = await task.promise;
  try {
    const images: Blob[] = [];
    for (let number = 1; number <= Math.min(doc.numPages, MAX_PDF_PAGES); number++) {
      const page = await doc.getPage(number);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: MAX_SIDE / Math.max(base.width, base.height) });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      await page.render({ canvas, viewport }).promise;
      images.push(await toJpeg(canvas));
    }
    return { images, qrText };
  } finally {
    await task.destroy();
  }
}
