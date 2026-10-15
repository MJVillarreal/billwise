/** Parses amounts as printed on Argentine invoices ("$ 1.234,56"). Also accepts "1234.56". */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/[$\s]/g, '').replace(/^ARS/i, '');
  if (!/^-?[\d.,]+$/.test(cleaned)) return null;

  let normalized: string;
  if (cleaned.includes(',')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (/^-?\d+\.\d{1,2}$/.test(cleaned)) {
    normalized = cleaned;
  } else {
    normalized = cleaned.replace(/\./g, '');
  }

  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export function parseDate(text: string): string | null {
  const match = text.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}
