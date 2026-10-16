import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const QUOTA_COOKIE = 'billwise_ai';
export const DAILY_AI_LIMIT = 2;

function secret(): string {
  const base = process.env.AI_QUOTA_SECRET ?? process.env.GEMINI_API_KEY ?? 'billwise-local';
  return createHash('sha256').update(`billwise-quota:${base}`).digest('hex');
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

/** Today in Argentina, where the daily limit resets. */
export function quotaDay(now = new Date()): string {
  return now.toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
}

/**
 * How many AI readings this visitor used today, from a signed cookie. An invalid cookie counts as
 * zero: clearing cookies resets the count anyway, and this way rotating the secret blocks nobody.
 */
export function usedToday(cookie: string | undefined, day = quotaDay()): number {
  if (!cookie) return 0;
  const [payload, signature] = cookie.split('.');
  if (!payload || !signature) return 0;

  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return 0;

  const [cookieDay, count] = Buffer.from(payload, 'base64url').toString().split('|');
  return cookieDay === day ? Math.min(Number(count) || 0, DAILY_AI_LIMIT) : 0;
}

export function quotaCookie(used: number, day = quotaDay()): string {
  const payload = Buffer.from(`${day}|${used}`).toString('base64url');
  return `${payload}.${sign(payload)}`;
}
