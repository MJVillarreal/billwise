import { describe, expect, it } from 'vitest';
import { cuitCheckDigit, formatCuit, isValidCuit, normalizeCuit } from './cuit.js';

describe('normalizeCuit', () => {
  it('strips dashes and spaces', () => {
    expect(normalizeCuit('30-71234567-1')).toBe('30712345671');
    expect(normalizeCuit(' 20 12345678 6 ')).toBe('20123456786');
  });
});

describe('formatCuit', () => {
  it('formats as XX-XXXXXXXX-X', () => {
    expect(formatCuit('30712345671')).toBe('30-71234567-1');
  });
});

describe('cuitCheckDigit', () => {
  it('computes the check digit', () => {
    expect(cuitCheckDigit('2012345678')).toBe(6);
    expect(cuitCheckDigit('3071234567')).toBe(1);
  });

  it('returns 0 when the remainder is 0', () => {
    expect(cuitCheckDigit('3000000009')).toBe(0);
  });

  it('returns null when no check digit is possible', () => {
    expect(cuitCheckDigit('2000000001')).toBeNull();
  });

  it('returns null for malformed input', () => {
    expect(cuitCheckDigit('123')).toBeNull();
  });
});

describe('isValidCuit', () => {
  it('accepts CUITs with a correct check digit', () => {
    expect(isValidCuit('20123456786')).toBe(true);
    expect(isValidCuit('30-71234567-1')).toBe(true);
    expect(isValidCuit('30000000090')).toBe(true);
  });

  it('rejects a wrong check digit', () => {
    expect(isValidCuit('20123456787')).toBe(false);
  });

  it('rejects CUITs whose check digit would be 10', () => {
    expect(isValidCuit('20000000010')).toBe(false);
  });

  it('rejects malformed input', () => {
    expect(isValidCuit('')).toBe(false);
    expect(isValidCuit('2012345678')).toBe(false);
    expect(isValidCuit('2012345678a')).toBe(false);
  });
});
