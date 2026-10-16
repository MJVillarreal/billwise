import { EXTRACTION_PROMPT, EXTRACTION_SCHEMA } from '@billwise/shared';

const DEFAULT_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
const TIMEOUT_MS = 40_000;

export interface InlineImage {
  mimeType: string;
  base64: string;
}

export type GeminiResult =
  | { ok: true; answer: unknown; model: string }
  | { ok: false; reason: 'not_configured' | 'quota' | 'unavailable' | 'error' };

function models(): string[] {
  const configured = process.env.GEMINI_MODELS?.split(',').map((model) => model.trim());
  return configured?.filter(Boolean).length ? configured.filter(Boolean) : DEFAULT_MODELS;
}

/**
 * Asks Gemini for the invoice fields. Free-tier models are retired or overloaded from time to
 * time, so each configured model is tried in order before giving up.
 */
export async function extractWithGemini(images: InlineImage[]): Promise<GeminiResult> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ok: false, reason: 'not_configured' };

  let quotaHit = false;
  for (const model of models()) {
    let response: Response;
    try {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
          signal: AbortSignal.timeout(TIMEOUT_MS),
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  { text: EXTRACTION_PROMPT },
                  ...images.map((image) => ({
                    inline_data: { mime_type: image.mimeType, data: image.base64 },
                  })),
                ],
              },
            ],
            generationConfig: {
              responseMimeType: 'application/json',
              responseJsonSchema: EXTRACTION_SCHEMA,
              temperature: 0,
            },
          }),
        },
      );
    } catch {
      continue;
    }

    if (response.status === 429) {
      quotaHit = true;
      continue;
    }
    if (!response.ok) continue;

    try {
      const body = await response.json();
      const text = body?.candidates?.[0]?.content?.parts?.[0]?.text;
      return { ok: true, answer: JSON.parse(text), model };
    } catch {
      return { ok: false, reason: 'error' };
    }
  }

  return { ok: false, reason: quotaHit ? 'quota' : 'unavailable' };
}
