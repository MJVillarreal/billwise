import {
  type ArcaQrData,
  type InvoiceData,
  type InvoiceLetter,
  reconcileWithQr,
  voucherKey,
} from '@billwise/shared';
import manifest from '../../public/samples/manifest.json';

export interface Sample {
  id: string;
  file: string;
  thumbnail: string;
  letter: InvoiceLetter;
  scenario: { es: string; en: string };
  expectedIssues: string[];
  printed: InvoiceData;
  qr: ArcaQrData;
  photo?: string;
  ai?: { model: string; date: string; answer: unknown };
}

export const samples = manifest as unknown as Sample[];

export function findSample(id: string): Sample | undefined {
  return samples.find((sample) => sample.id === id);
}

/** The gallery behaves as a batch loaded in order, so earlier samples count as already loaded. */
export function keysLoadedBefore(id: string): string[] {
  const index = samples.findIndex((sample) => sample.id === id);
  return samples
    .slice(0, Math.max(index, 0))
    .map((sample) => voucherKey(reconcileWithQr(sample.printed, sample.qr).data))
    .filter((key): key is string => key !== null);
}
