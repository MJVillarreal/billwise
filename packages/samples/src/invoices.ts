import { cuitCheckDigit, DOC_TYPES } from '@billwise/shared';
import type { Issuer, Recipient, SampleInvoice } from './types.js';

// Fictitious data. CUITs use the 99 range so they do not collide with real taxpayers.
export function cuit(firstTen: string, { wrongCheckDigit = false } = {}): string {
  const check = cuitCheckDigit(firstTen);
  if (check === null) throw new Error(`No valid check digit for ${firstTen}`);
  return `${firstTen}${wrongCheckDigit ? (check + 1) % 10 : check}`;
}

export const restaurant: Recipient = {
  name: 'Restaurante La Higuera SRL',
  docType: DOC_TYPES.CUIT,
  docNumber: cuit('3099123456'),
  ivaCondition: 'IVA Responsable Inscripto',
  address: 'Av. San Martín 1250 - Mendoza',
};

const finalConsumer: Recipient = {
  name: 'Consumidor Final',
  docType: DOC_TYPES.FINAL_CONSUMER,
  docNumber: '0',
  ivaCondition: 'Consumidor Final',
};

export const losAndes: Issuer = {
  name: 'Distribuidora Los Andes SRL',
  cuit: cuit('3099451207'),
  address: 'Ruta 40 Km 3520 - Luján de Cuyo, Mendoza',
  ivaCondition: 'IVA Responsable Inscripto',
  grossIncome: '0712-998451-3',
  activityStart: '2014-03-01',
};

export const cerroAzul: Issuer = {
  name: 'Bodega Cerro Azul SA',
  cuit: cuit('3099233418'),
  address: 'Carril Godoy Cruz 4410 - Maipú, Mendoza',
  ivaCondition: 'IVA Responsable Inscripto',
  grossIncome: '0712-992334-1',
  activityStart: '2009-08-15',
};

const lavadero: Issuer = {
  name: 'Lavadero Industrial del Oeste SA',
  cuit: cuit('3099874562', { wrongCheckDigit: true }),
  address: 'Calle Boulogne Sur Mer 875 - Las Heras, Mendoza',
  ivaCondition: 'IVA Responsable Inscripto',
  grossIncome: '0712-998745-6',
  activityStart: '2018-05-02',
};

export const aconcagua: Issuer = {
  name: 'Imprenta Aconcagua SRL',
  cuit: cuit('3099615094'),
  address: 'Patricias Mendocinas 2210 - Mendoza',
  ivaCondition: 'IVA Responsable Inscripto',
  grossIncome: '0712-996150-9',
  activityStart: '2011-11-10',
};

export const elMolino: Issuer = {
  name: 'Bazar El Molino SA',
  cuit: cuit('3099307726'),
  address: 'Av. Las Heras 640 - Mendoza',
  ivaCondition: 'IVA Responsable Inscripto',
  grossIncome: '0712-993077-2',
  activityStart: '2016-02-20',
};

export const luciaBenitez: Issuer = {
  name: 'Lucía Benítez',
  cuit: cuit('2799482613'),
  address: 'Belgrano 1388 - Godoy Cruz, Mendoza',
  ivaCondition: 'Responsable Monotributo',
  grossIncome: 'Exento',
  activityStart: '2021-07-01',
};

const invoiceA: SampleInvoice = {
  id: 'invoice-a-valid',
  scenario: {
    es: 'Factura A correcta: todo en verde, lista sin revisión.',
    en: 'Valid A invoice: every field checks out.',
  },
  expectedIssues: [],
  copy: 'ORIGINAL',
  letter: 'A',
  pointOfSale: 3,
  number: 12345,
  issueDate: '2026-09-30',
  saleCondition: 'Cuenta Corriente',
  issuer: losAndes,
  recipient: restaurant,
  items: [
    {
      description: 'Aceite de oliva extra virgen x 5 L',
      quantity: 4,
      unit: 'unidades',
      unitPrice: 38500,
      ivaRate: 21,
    },
    {
      description: 'Harina 000 x 25 kg',
      quantity: 6,
      unit: 'unidades',
      unitPrice: 21300,
      ivaRate: 10.5,
    },
    { description: 'Queso mozzarella', quantity: 12, unit: 'kg', unitPrice: 9850, ivaRate: 21 },
  ],
  otherTaxes: [{ description: 'Percepción IIBB Mendoza', amount: 8000 }],
  cae: '76391245873016',
  caeDueDate: '2026-10-10',
};

export const sampleInvoices: SampleInvoice[] = [
  invoiceA,
  {
    id: 'invoice-b-final-consumer',
    scenario: {
      es: 'Factura B a consumidor final, con el IVA contenido informado.',
      en: 'B invoice to a final consumer, showing the IVA included in the price.',
    },
    expectedIssues: [],
    copy: 'ORIGINAL',
    letter: 'B',
    pointOfSale: 2,
    number: 48127,
    issueDate: '2026-09-18',
    saleCondition: 'Contado',
    issuer: elMolino,
    recipient: finalConsumer,
    items: [
      {
        description: 'Juego de cuchillos de cocina',
        quantity: 2,
        unit: 'unidades',
        unitPrice: 24200,
        ivaRate: 21,
      },
      {
        description: 'Tabla de picar de madera',
        quantity: 3,
        unit: 'unidades',
        unitPrice: 8470,
        ivaRate: 21,
      },
    ],
    otherTaxes: [],
    cae: '76385512094437',
    caeDueDate: '2026-09-28',
  },
  {
    id: 'invoice-c-monotributo',
    scenario: {
      es: 'Factura C de monotributista: no discrimina IVA.',
      en: 'C invoice from a small taxpayer (monotributo): no IVA breakdown.',
    },
    expectedIssues: [],
    copy: 'ORIGINAL',
    letter: 'C',
    pointOfSale: 1,
    number: 214,
    issueDate: '2026-09-05',
    saleCondition: 'Transferencia Bancaria',
    issuer: luciaBenitez,
    recipient: restaurant,
    items: [
      {
        description: 'Diseño de carta y menú digital',
        quantity: 1,
        unit: 'servicio',
        unitPrice: 185000,
        ivaRate: 0,
      },
    ],
    otherTaxes: [],
    cae: '76364870215529',
    caeDueDate: '2026-09-15',
  },
  {
    id: 'invoice-total-mismatch',
    scenario: {
      es: 'El total impreso no cierra: neto + IVA ≠ total.',
      en: 'The printed total does not add up: net + IVA ≠ total.',
    },
    expectedIssues: ['total_mismatch'],
    copy: 'ORIGINAL',
    letter: 'A',
    pointOfSale: 5,
    number: 3391,
    issueDate: '2026-09-24',
    saleCondition: 'Cuenta Corriente',
    issuer: cerroAzul,
    recipient: restaurant,
    items: [
      {
        description: 'Malbec Reserva 2023 caja x 6',
        quantity: 10,
        unit: 'cajas',
        unitPrice: 42000,
        ivaRate: 21,
      },
    ],
    otherTaxes: [],
    cae: '76388906631247',
    caeDueDate: '2026-10-04',
    printed: { total: 505800 },
  },
  {
    id: 'invoice-invalid-cuit',
    scenario: {
      es: 'El CUIT del emisor tiene mal el dígito verificador.',
      en: "The issuer's CUIT has a wrong check digit.",
    },
    expectedIssues: ['invalid_cuit'],
    copy: 'ORIGINAL',
    letter: 'A',
    pointOfSale: 4,
    number: 7750,
    issueDate: '2026-09-12',
    saleCondition: 'Cuenta Corriente',
    issuer: lavadero,
    recipient: restaurant,
    items: [
      {
        description: 'Lavado y planchado de mantelería',
        quantity: 120,
        unit: 'unidades',
        unitPrice: 1150,
        ivaRate: 21,
      },
    ],
    otherTaxes: [],
    cae: '76379930148862',
    caeDueDate: '2026-09-22',
  },
  {
    id: 'invoice-qr-mismatch',
    scenario: {
      es: 'El QR dice otro número de comprobante que el impreso: gana el QR y el campo queda dudoso.',
      en: 'The QR has a different voucher number than the printed one: the QR wins and the field is flagged.',
    },
    expectedIssues: ['qr_mismatch'],
    copy: 'ORIGINAL',
    letter: 'A',
    pointOfSale: 2,
    number: 872,
    issueDate: '2026-09-21',
    saleCondition: 'Contado',
    issuer: aconcagua,
    recipient: restaurant,
    items: [
      {
        description: 'Cartas de menú impresas a color',
        quantity: 40,
        unit: 'unidades',
        unitPrice: 3200,
        ivaRate: 21,
      },
    ],
    otherTaxes: [],
    cae: '76386011257734',
    caeDueDate: '2026-10-01',
    printed: { number: 827 },
  },
  {
    id: 'invoice-photo-ai',
    scenario: {
      es: 'Foto sacada con el celular: la lee la IA (Gemini) y se cruza con el QR. El resultado está guardado para no gastar cuota.',
      en: 'Phone photo: read by AI (Gemini) and checked against the QR. The result is stored so it does not use quota.',
    },
    expectedIssues: [],
    copy: 'ORIGINAL',
    letter: 'A',
    pointOfSale: 5,
    number: 3412,
    issueDate: '2026-10-08',
    saleCondition: 'Cuenta Corriente',
    issuer: cerroAzul,
    recipient: restaurant,
    items: [
      {
        description: 'Malbec Reserva 2023 caja x 6',
        quantity: 6,
        unit: 'cajas',
        unitPrice: 42000,
        ivaRate: 21,
      },
      {
        description: 'Torrontés 2025 caja x 6',
        quantity: 4,
        unit: 'cajas',
        unitPrice: 31500,
        ivaRate: 21,
      },
    ],
    otherTaxes: [{ description: 'Percepción IIBB Mendoza', amount: 7560 }],
    cae: '76393318840275',
    caeDueDate: '2026-10-18',
    photo: true,
  },
  {
    ...invoiceA,
    id: 'invoice-a-duplicate',
    scenario: {
      es: 'La misma factura A subida de nuevo (copia DUPLICADO): se detecta como repetida.',
      en: 'The same A invoice uploaded again (DUPLICADO copy): detected as a duplicate.',
    },
    expectedIssues: ['duplicate'],
    copy: 'DUPLICADO',
  },
];
