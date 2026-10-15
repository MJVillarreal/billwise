import { describe, expect, it } from 'vitest';
import { parseAmount, parseDate } from './amount.js';

describe('parseAmount', () => {
  it.each([
    ['$ 478.581,00', 478581],
    ['478.581,00', 478581],
    ['$ 0,00', 0],
    ['13.419,5', 13419.5],
    ['1.234.567,89', 1234567.89],
    ['1234.56', 1234.56],
    ['12.345', 12345],
    ['-1.000,00', -1000],
  ])('parses %s', (text, expected) => {
    expect(parseAmount(text)).toBe(expected);
  });

  it.each(['', 'abc', '$', '12a'])('returns null for %j', (text) => {
    expect(parseAmount(text)).toBeNull();
  });
});

describe('parseDate', () => {
  it('converts DD/MM/YYYY to ISO', () => {
    expect(parseDate('30/09/2026')).toBe('2026-09-30');
    expect(parseDate(' 1/2/2026 ')).toBe('2026-02-01');
  });

  it('returns null for other formats', () => {
    expect(parseDate('2026-09-30')).toBeNull();
  });
});
