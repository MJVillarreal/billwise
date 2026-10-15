const amountFormat = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatAmount = (value: number) => amountFormat.format(value);

export const formatRate = (rate: number) => `${String(rate).replace('.', ',')}%`;

export const padNumber = (value: number, length: number) => String(value).padStart(length, '0');

export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}
