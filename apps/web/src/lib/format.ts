export function formatMoney(value: number | null, locale: string): string {
  if (value === null) return '-';
  return `$ ${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatAmountInput(value: number | null): string {
  if (value === null) return '';
  return value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatDateInput(isoDate: string | null): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}
