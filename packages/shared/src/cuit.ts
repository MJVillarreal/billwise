const WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

export function normalizeCuit(value: string): string {
  return value.replace(/\D/g, '');
}

export function formatCuit(value: string): string {
  const digits = normalizeCuit(value);
  return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
}

/** Returns the check digit for the first 10 digits, or null when no valid one exists. */
export function cuitCheckDigit(firstTen: string): number | null {
  if (!/^\d{10}$/.test(firstTen)) return null;
  const sum = WEIGHTS.reduce((acc, weight, i) => acc + weight * Number(firstTen[i]), 0);
  const check = 11 - (sum % 11);
  if (check === 10) return null;
  return check === 11 ? 0 : check;
}

export function isValidCuit(value: string): boolean {
  const digits = normalizeCuit(value);
  if (!/^\d{11}$/.test(digits)) return false;
  return cuitCheckDigit(digits.slice(0, 10)) === Number(digits[10]);
}
