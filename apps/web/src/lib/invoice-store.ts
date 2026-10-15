import { type InvoiceData, validateInvoice, voucherKey } from '@billwise/shared';
import { useSyncExternalStore } from 'react';
import historyJson from '../../public/samples/history.json';

const STORAGE_KEY = 'billwise.invoices';
const CHANGE_EVENT = 'billwise:invoices';

export type InvoiceStatus = 'ready' | 'review' | 'error';

export interface StoredInvoice {
  id: string;
  data: InvoiceData;
  origin: 'history' | 'demo';
  sampleId?: string;
  confirmed: boolean;
}

const history: StoredInvoice[] = (historyJson as { id: string; data: InvoiceData }[]).map(
  (entry) => ({
    id: entry.id,
    data: entry.data,
    origin: 'history',
    confirmed: validateInvoice(entry.data, {}).issues.length === 0,
  }),
);

let cachedRaw: string | null | undefined;
let cachedInvoices: StoredInvoice[] = history;

function readSaved(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getSnapshot(): StoredInvoice[] {
  const raw = readSaved();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    let saved: StoredInvoice[] = [];
    try {
      saved = raw ? (JSON.parse(raw) as StoredInvoice[]) : [];
    } catch {}
    cachedInvoices = [...history, ...saved];
  }
  return cachedInvoices;
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function writeSaved(saved: StoredInvoice[]) {
  try {
    if (saved.length === 0) localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
  } catch {}
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useInvoices(): StoredInvoice[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => history);
}

/** Saves a confirmed invoice, replacing an earlier save of the same voucher. */
export function saveInvoice(invoice: StoredInvoice) {
  const key = voucherKey(invoice.data);
  const saved = getSnapshot().filter(
    (entry) => entry.origin === 'demo' && entry.id !== invoice.id && voucherKey(entry.data) !== key,
  );
  writeSaved([...saved, invoice]);
}

export function resetDemo() {
  writeSaved([]);
}

export function invoiceStatus(invoice: StoredInvoice): InvoiceStatus {
  const { issues } = validateInvoice(invoice.data, {});
  if (issues.some((issue) => issue.severity === 'error')) return 'error';
  if (issues.length > 0 || !invoice.confirmed) return 'review';
  return 'ready';
}

export function invoiceTotals(data: InvoiceData) {
  const iva = data.iva.reduce((acc, line) => acc + line.amount, 0);
  return { iva, total: data.total ?? 0, net: data.netTaxed ?? (data.total ?? 0) - iva };
}
