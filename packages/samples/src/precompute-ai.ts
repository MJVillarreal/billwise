import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { extractWithGemini } from '@billwise/shared';
import { sampleInvoices } from './invoices.js';

const SAMPLES_DIR = resolve(import.meta.dirname, '../../../apps/web/public/samples');
const AI_RESULTS_DIR = resolve(import.meta.dirname, '../ai-results');
const MAX_SIDE = 1600;

async function apiKey(): Promise<string | undefined> {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  try {
    const env = await readFile(resolve(import.meta.dirname, '../../../apps/web/.env'), 'utf8');
    return env.match(/^GEMINI_API_KEY=(.*)$/m)?.[1]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

/** Same resize the browser applies before sending a photo. */
async function asUploaded(photo: Buffer): Promise<string> {
  const image = await loadImage(photo);
  const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
  const canvas = createCanvas(Math.round(image.width * scale), Math.round(image.height * scale));
  canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
  return (await canvas.encode('jpeg', 85)).toString('base64');
}

async function main() {
  const key = await apiKey();
  if (!key) throw new Error('Set GEMINI_API_KEY or add it to apps/web/.env');
  await mkdir(AI_RESULTS_DIR, { recursive: true });

  for (const invoice of sampleInvoices.filter((sample) => sample.photo)) {
    const photo = await readFile(resolve(SAMPLES_DIR, `${invoice.id}.jpg`));
    const result = await extractWithGemini(
      [{ mimeType: 'image/jpeg', base64: await asUploaded(photo) }],
      {
        apiKey: key,
      },
    );
    if (!result.ok) throw new Error(`Gemini failed for ${invoice.id}: ${result.reason}`);

    const stored = {
      model: result.model,
      date: new Date().toISOString().slice(0, 10),
      answer: result.answer,
    };
    await writeFile(
      resolve(AI_RESULTS_DIR, `${invoice.id}.json`),
      `${JSON.stringify(stored, null, 2)}\n`,
    );
    console.log(`  ${invoice.id}: read with ${result.model}`);
  }
}

await main();
