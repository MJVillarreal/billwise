import { DOC_TYPES, INVOICE_VOUCHER_CODES, type InvoiceData } from '@billwise/shared';
import { padNumber } from './format.js';
import {
  aconcagua,
  cerroAzul,
  cuit,
  elMolino,
  losAndes,
  luciaBenitez,
  restaurant,
} from './invoices.js';
import { round2 } from './totals.js';
import type { Issuer } from './types.js';

export interface HistoryInvoice {
  id: string;
  data: InvoiceData;
}

interface Supplier {
  issuer: Issuer;
  letter: 'A' | 'C';
  pointOfSale: number;
  firstNumber: number;
  netRange: [number, number];
  reducedRateShare?: number;
  grossIncomePerception?: number;
}

const donRamon: Issuer = {
  name: 'Carnicería Don Ramón SRL',
  cuit: cuit('3099550017'),
  address: 'Mitre 455 - Mendoza',
  ivaCondition: 'IVA Responsable Inscripto',
  grossIncome: '0712-995500-1',
  activityStart: '2012-04-01',
};

// Points of sale differ from the gallery samples so confirmed samples never collide with the history.
const SUPPLIERS: Supplier[] = [
  {
    issuer: losAndes,
    letter: 'A',
    pointOfSale: 4,
    firstNumber: 11870,
    netRange: [280000, 520000],
    reducedRateShare: 0.35,
    grossIncomePerception: 0.02,
  },
  {
    issuer: donRamon,
    letter: 'A',
    pointOfSale: 1,
    firstNumber: 5120,
    netRange: [180000, 360000],
    reducedRateShare: 1,
  },
  { issuer: cerroAzul, letter: 'A', pointOfSale: 6, firstNumber: 3260, netRange: [150000, 450000] },
  { issuer: aconcagua, letter: 'A', pointOfSale: 3, firstNumber: 790, netRange: [40000, 140000] },
  { issuer: elMolino, letter: 'A', pointOfSale: 3, firstNumber: 47710, netRange: [30000, 120000] },
  {
    issuer: luciaBenitez,
    letter: 'C',
    pointOfSale: 2,
    firstNumber: 190,
    netRange: [90000, 185000],
  },
];

const MONTHS = ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'];

/** Deterministic pseudo-random numbers, so the generated history never changes between runs. */
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildHistory(): HistoryInvoice[] {
  const random = mulberry32(2026);
  const between = (min: number, max: number) => min + random() * (max - min);
  const history: HistoryInvoice[] = [];

  SUPPLIERS.forEach((supplier, supplierIndex) => {
    let number = supplier.firstNumber;
    for (const month of MONTHS) {
      if (supplier.issuer === aconcagua && (month === '2026-06' || month === '2026-08')) continue;
      const lastDay = month === '2026-10' ? 12 : 28;
      const issueDate = `${month}-${padNumber(Math.floor(between(1, lastDay)), 2)}`;
      const net = Math.round(between(...supplier.netRange) / 100) * 100;

      let netTaxed: number | null = null;
      let iva: InvoiceData['iva'] = [];
      let otherTaxes = 0;
      let total = net;

      if (supplier.letter === 'A') {
        const reduced = round2(net * (supplier.reducedRateShare ?? 0));
        const standard = round2(net - reduced);
        iva = [
          { rate: 21, amount: round2(standard * 0.21) },
          { rate: 10.5, amount: round2(reduced * 0.105) },
        ].filter((line) => line.amount > 0);
        netTaxed = net;
        otherTaxes = round2(net * (supplier.grossIncomePerception ?? 0));
        total = round2(net + iva.reduce((acc, line) => acc + line.amount, 0) + otherTaxes);
      }

      number += Math.floor(between(3, 40));
      history.push({
        id: `history-${supplierIndex + 1}-${month}`,
        data: {
          voucherType: INVOICE_VOUCHER_CODES[supplier.letter],
          pointOfSale: padNumber(supplier.pointOfSale, 5),
          number: padNumber(number, 8),
          issueDate,
          issuer: { cuit: supplier.issuer.cuit, name: supplier.issuer.name },
          recipient: {
            docType: DOC_TYPES.CUIT,
            docNumber: restaurant.docNumber,
            name: restaurant.name,
          },
          currency: 'PES',
          netTaxed,
          nonTaxed: null,
          exempt: null,
          iva,
          otherTaxes,
          total,
          cae: String(Math.floor(between(7.6e13, 7.7e13))),
          caeDueDate: addDays(issueDate, 10),
        },
      });
    }
  });

  history.sort((a, b) => (a.data.issueDate ?? '').localeCompare(b.data.issueDate ?? ''));

  // A few recent invoices still need a look, so the dashboard has pending work.
  const recentA = history.filter((entry) => entry.data.voucherType === 1).slice(-5);
  recentA[0].data.cae = null;
  recentA[2].data.cae = null;
  recentA[4].data.total = round2((recentA[4].data.total ?? 0) - 1500);

  return history;
}
