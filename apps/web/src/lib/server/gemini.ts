import { extractWithGemini as extract, type InlineImage } from '@billwise/shared';

export function extractWithGemini(images: InlineImage[]) {
  const models = process.env.GEMINI_MODELS?.split(',')
    .map((model) => model.trim())
    .filter(Boolean);
  return extract(images, {
    apiKey: process.env.GEMINI_API_KEY,
    models: models?.length ? models : undefined,
  });
}
