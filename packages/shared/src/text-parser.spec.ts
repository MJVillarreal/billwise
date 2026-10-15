import { describe, expect, it } from 'vitest';
import type { TextItem } from './text-item.js';
import { parseInvoiceText } from './text-parser.js';

let x = 0;
const item = (text: string, y: number, height = 9): TextItem => {
  x += 100;
  return { page: 1, text, x, y, width: 80, height };
};
const line = (y: number, ...texts: string[]) => {
  x = 0;
  return texts.map((text) => item(text, y));
};

const layoutA: TextItem[] = [
  item('A', 60, 30),
  item('COD. 001', 90, 7),
  ...line(100, 'Razón Social:', 'Distribuidora Ejemplo SRL'),
  ...line(120, 'Punto de Venta:', '00003', 'Comp. Nro:', '00012345'),
  ...line(140, 'Fecha de Emisión:', '30/09/2026'),
  ...line(160, 'CUIT:', '30712345671'),
  ...line(220, 'CUIT:', '20123456786', 'Apellido y Nombre / Razón Social:', 'Cliente', 'Ejemplo'),
  ...line(400, 'Importe Neto Gravado:', '$ 400.000,00'),
  ...line(415, 'IVA 21%:', '$ 57.162,00'),
  ...line(430, 'IVA 10,5%:', '$ 13.419,00'),
  ...line(445, 'IVA 0%:', '$ 0,00'),
  ...line(460, 'Importe Otros Tributos:', '$ 8.000,00'),
  ...line(475, 'Importe Total:', '$ 478.581,00'),
  ...line(600, 'CAE N°:', '76391245873016'),
  ...line(615, 'Fecha de Vto. de CAE:', '10/10/2026'),
];

describe('parseInvoiceText', () => {
  it('reads the fields of an ARCA layout', () => {
    const { data, recognized } = parseInvoiceText(layoutA);
    expect(data).toEqual({
      voucherType: 1,
      pointOfSale: '00003',
      number: '00012345',
      issueDate: '2026-09-30',
      issuer: { cuit: '30712345671', name: 'Distribuidora Ejemplo SRL' },
      recipient: { docType: 80, docNumber: '20123456786', name: 'Cliente Ejemplo' },
      currency: null,
      netTaxed: 400000,
      nonTaxed: null,
      exempt: null,
      iva: [
        { rate: 21, amount: 57162 },
        { rate: 10.5, amount: 13419 },
      ],
      otherTaxes: 8000,
      total: 478581,
      cae: '76391245873016',
      caeDueDate: '2026-10-10',
    });
    expect(recognized).toBeGreaterThan(10);
  });

  it('returns where each value is on the page', () => {
    const { locations } = parseInvoiceText(layoutA);
    expect(locations.total).toEqual({ page: 1, x: 200, y: 475, width: 80, height: 9 });
    expect(locations.voucherType).toMatchObject({ y: 90 });
  });

  it('reads label and value printed as a single text item', () => {
    x = 0;
    const { data } = parseInvoiceText([
      item('CUIT: 30-71234567-1', 10),
      item('Importe Total: $ 1.210,00', 30),
    ]);
    expect(data.issuer.cuit).toBe('30712345671');
    expect(data.total).toBe(1210);
  });

  it('falls back to the large letter when there is no voucher code', () => {
    const { data } = parseInvoiceText([item('C', 60, 30)]);
    expect(data.voucherType).toBe(11);
  });

  it('reads a DNI recipient', () => {
    const { data } = parseInvoiceText(line(10, 'DNI:', '12.345.678'));
    expect(data.recipient).toMatchObject({ docType: 96, docNumber: '12345678' });
  });

  it('recognizes nothing in unrelated text', () => {
    const { recognized } = parseInvoiceText(line(10, 'Hola', 'mundo'));
    expect(recognized).toBe(0);
  });
});
