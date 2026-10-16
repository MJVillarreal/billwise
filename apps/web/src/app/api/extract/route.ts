import { aiExtractionToInvoice } from '@billwise/shared';
import { type NextRequest, NextResponse } from 'next/server';
import { DAILY_AI_LIMIT, QUOTA_COOKIE, quotaCookie, usedToday } from '@/lib/server/ai-quota';
import { extractWithGemini } from '@/lib/server/gemini';

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 2.5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const aiEnabled = () => Boolean(process.env.GEMINI_API_KEY);

export async function GET(request: NextRequest) {
  const used = usedToday(request.cookies.get(QUOTA_COOKIE)?.value);
  return NextResponse.json({ enabled: aiEnabled(), remaining: DAILY_AI_LIMIT - used });
}

export async function POST(request: NextRequest) {
  if (!aiEnabled()) return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 });

  const used = usedToday(request.cookies.get(QUOTA_COOKIE)?.value);
  if (used >= DAILY_AI_LIMIT) {
    return NextResponse.json({ error: 'daily_limit', remaining: 0 }, { status: 429 });
  }

  let images: File[];
  try {
    images = (await request.formData()).getAll('images').filter((entry) => entry instanceof File);
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }
  const valid =
    images.length > 0 &&
    images.length <= MAX_IMAGES &&
    images.every((image) => ALLOWED_TYPES.includes(image.type) && image.size <= MAX_IMAGE_BYTES);
  if (!valid) return NextResponse.json({ error: 'bad_request' }, { status: 400 });

  const result = await extractWithGemini(
    await Promise.all(
      images.map(async (image) => ({
        mimeType: image.type,
        base64: Buffer.from(await image.arrayBuffer()).toString('base64'),
      })),
    ),
  );

  if (!result.ok) {
    const status = result.reason === 'quota' ? 429 : 503;
    const error = result.reason === 'quota' ? 'quota_exhausted' : 'ai_unavailable';
    return NextResponse.json({ error }, { status });
  }

  const remaining = DAILY_AI_LIMIT - (used + 1);
  const response = NextResponse.json({ data: aiExtractionToInvoice(result.answer), remaining });
  response.cookies.set(QUOTA_COOKIE, quotaCookie(used + 1), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 2,
  });
  return response;
}
