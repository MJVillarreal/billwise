import { createRequire } from 'node:module';
import { dirname } from 'node:path';
import { type Canvas, createCanvas, loadImage, type SKRSContext2D } from '@napi-rs/canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

const standardFontDataUrl = `${dirname(createRequire(import.meta.url).resolve('pdfjs-dist/package.json'))}/standard_fonts/`;

const WIDTH = 2100;
const HEIGHT = 2800;
const PAPER_SCALE = 3;
const ROTATION = (-2.2 * Math.PI) / 180;

function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function renderPaper(pdf: Uint8Array): Promise<Canvas> {
  const task = getDocument({ data: pdf, standardFontDataUrl, verbosity: 0 });
  const doc = await task.promise;
  try {
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: PAPER_SCALE });
    const canvas = createCanvas(Math.floor(viewport.width), Math.floor(viewport.height));
    const context = canvas.getContext('2d');
    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;
    return canvas;
  } finally {
    await task.destroy();
  }
}

function drawTable(context: SKRSContext2D, random: () => number) {
  const base = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  base.addColorStop(0, '#6b4a33');
  base.addColorStop(1, '#4a3122');
  context.fillStyle = base;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  for (let i = 0; i < 140; i++) {
    const y = random() * HEIGHT;
    context.strokeStyle = `rgba(${random() > 0.5 ? '40,24,14' : '120,86,60'},${0.08 + random() * 0.1})`;
    context.lineWidth = 2 + random() * 8;
    context.beginPath();
    context.moveTo(0, y);
    context.bezierCurveTo(
      WIDTH / 3,
      y + (random() - 0.5) * 60,
      (2 * WIDTH) / 3,
      y + (random() - 0.5) * 60,
      WIDTH,
      y + (random() - 0.5) * 40,
    );
    context.stroke();
  }
}

/** Light falls from the top left, as from a window, and the phone's flash leaves a hot spot. */
function drawLighting(context: SKRSContext2D) {
  const shade = context.createLinearGradient(0, 0, WIDTH, HEIGHT);
  shade.addColorStop(0, 'rgba(255,248,235,0.10)');
  shade.addColorStop(0.6, 'rgba(0,0,0,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.22)');
  context.fillStyle = shade;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const vignette = context.createRadialGradient(
    WIDTH / 2,
    HEIGHT / 2,
    HEIGHT * 0.35,
    WIDTH / 2,
    HEIGHT / 2,
    HEIGHT * 0.8,
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
  context.fillStyle = vignette;
  context.fillRect(0, 0, WIDTH, HEIGHT);
}

function addGrain(context: SKRSContext2D, random: () => number) {
  const image = context.getImageData(0, 0, WIDTH, HEIGHT);
  const { data } = image;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (random() - 0.5) * 14;
    data[i] = Math.max(0, Math.min(255, data[i] + noise + 3));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise - 4));
  }
  context.putImageData(image, 0, 0);
}

/** Renders the invoice as if photographed on a table with a phone. Deterministic. */
export async function renderPhoto(pdf: Uint8Array): Promise<Buffer> {
  const random = mulberry32(8);
  const paper = await renderPaper(pdf);
  const canvas = createCanvas(WIDTH, HEIGHT);
  const context = canvas.getContext('2d');

  drawTable(context, random);

  const scale = (HEIGHT * 0.9) / paper.height;
  const width = paper.width * scale;
  const height = paper.height * scale;

  context.save();
  context.translate(WIDTH / 2 + 10, HEIGHT / 2 + 15);
  context.rotate(ROTATION);
  context.shadowColor = 'rgba(0,0,0,0.45)';
  context.shadowBlur = 45;
  context.shadowOffsetX = 18;
  context.shadowOffsetY = 26;
  context.fillStyle = '#f7f5ef';
  context.fillRect(-width / 2, -height / 2, width, height);
  context.shadowColor = 'transparent';
  context.globalCompositeOperation = 'multiply';
  context.drawImage(paper, -width / 2, -height / 2, width, height);
  context.globalCompositeOperation = 'source-over';

  const fold = context.createLinearGradient(-width / 2, 0, width / 2, 0);
  fold.addColorStop(0.48, 'rgba(0,0,0,0)');
  fold.addColorStop(0.5, 'rgba(0,0,0,0.05)');
  fold.addColorStop(0.53, 'rgba(255,255,255,0.04)');
  fold.addColorStop(0.56, 'rgba(0,0,0,0)');
  context.fillStyle = fold;
  context.fillRect(-width / 2, -height / 2, width, height);
  context.restore();

  drawLighting(context);
  addGrain(context, random);

  return canvas.encode('jpeg', 86);
}

export async function photoThumbnail(photo: Buffer, width = 480): Promise<Buffer> {
  const image = await loadImage(photo);
  const canvas = createCanvas(width, Math.round((image.height * width) / image.width));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.encode('webp', 82);
}
