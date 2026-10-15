import type { InvoiceField, IssueCode } from '@billwise/shared';

export type Language = 'es' | 'en';

type IssueMessage = (params: Record<string, string | number>) => string;

export interface Messages {
  locale: string;
  nav: { samples: string; howItWorks: string; github: string };
  landing: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    trySamples: string;
    howItWorks: string;
    privacy: string;
    stepsTitle: string;
    steps: { title: string; text: string }[];
  };
  gallery: {
    eyebrow: string;
    title: string;
    subtitle: string;
    open: string;
    total: string;
    batchNote: string;
  };
  processing: {
    title: string;
    stages: { download: string; text: string; qr: string; extract: string; validate: string };
    failed: string;
  };
  review: {
    invoice: string;
    back: string;
    next: string;
    status: { ready: string; review: string; errors: string };
    summary: (errors: number, warnings: number) => string;
    sections: {
      voucher: string;
      issuer: string;
      recipient: string;
      amounts: string;
      authorization: string;
    };
    sources: { qr: string; text: string };
    fromQr: (printed: string | number) => string;
    zoomIn: string;
    zoomOut: string;
    showJson: string;
    hideJson: string;
    invoiceIssues: string;
    edited: string;
    noIva: string;
    page: (n: number) => string;
  };
  fields: Record<
    Exclude<InvoiceField, 'invoice'> | 'issuerName' | 'recipientName' | 'otherTaxes',
    string
  >;
  issues: Record<IssueCode, IssueMessage>;
  footer: string;
}

const es: Messages = {
  locale: 'es-AR',
  nav: { samples: 'Ejemplos', howItWorks: 'Cómo funciona', github: 'GitHub' },
  landing: {
    eyebrow: 'Procesamiento inteligente de facturas',
    title: 'De la factura al dato,',
    titleAccent: 'en segundos.',
    subtitle:
      'Billwise lee facturas electrónicas argentinas, toma los datos del QR de ARCA y del texto, controla cada uno con las reglas fiscales y te marca qué revisar.',
    trySamples: 'Probar con facturas de ejemplo',
    howItWorks: 'Cómo funciona',
    privacy: 'Los ejemplos son ficticios y se procesan en tu navegador.',
    stepsTitle: 'Cómo funciona',
    steps: [
      {
        title: 'Subís la factura',
        text: 'En PDF, tal como la descargás de ARCA o de tu proveedor.',
      },
      {
        title: 'Lee el QR y el texto',
        text: 'El QR es el dato autorizado; el texto completa el resto.',
      },
      { title: 'Valida cada dato', text: 'CUIT, totales, IVA por alícuota, fechas y duplicados.' },
      {
        title: 'Revisás lo dudoso',
        text: 'Ves en la factura de dónde salió cada valor y lo corregís.',
      },
    ],
  },
  gallery: {
    eyebrow: 'Demo',
    title: 'Facturas de ejemplo',
    subtitle:
      'Facturas ficticias generadas para la demo. Cada una muestra un caso distinto: abrila y mirá qué detecta Billwise.',
    open: 'Abrir',
    total: 'Total',
    batchNote:
      'Se procesan como un lote, en este orden: por eso la última se detecta como repetida.',
  },
  processing: {
    title: 'Procesando la factura',
    stages: {
      download: 'Abriendo el archivo',
      text: 'Leyendo el texto',
      qr: 'Buscando el QR de ARCA',
      extract: 'Extrayendo los datos',
      validate: 'Validando',
    },
    failed: 'No se pudo leer el archivo.',
  },
  review: {
    invoice: 'Factura',
    back: 'Ejemplos',
    next: 'Siguiente ejemplo',
    status: { ready: 'Lista', review: 'Para revisar', errors: 'Con errores' },
    summary: (errors, warnings) =>
      errors === 0 && warnings === 0
        ? 'Todos los datos son consistentes.'
        : [
            errors && `${errors} ${errors === 1 ? 'error' : 'errores'}`,
            warnings && `${warnings} ${warnings === 1 ? 'dato dudoso' : 'datos dudosos'}`,
          ]
            .filter(Boolean)
            .join(' y '),
    sections: {
      voucher: 'Comprobante',
      issuer: 'Emisor',
      recipient: 'Receptor',
      amounts: 'Importes',
      authorization: 'Autorización',
    },
    sources: { qr: 'QR', text: 'Texto' },
    fromQr: (printed) => `Tomado del QR. En el papel dice ${printed}.`,
    zoomIn: 'Acercar',
    zoomOut: 'Alejar',
    showJson: 'Ver JSON',
    hideJson: 'Ocultar JSON',
    invoiceIssues: 'Factura',
    edited: 'Editado',
    noIva: 'Sin IVA discriminado',
    page: (n) => `Página ${n}`,
  },
  fields: {
    voucherType: 'Tipo',
    pointOfSale: 'Punto de venta',
    number: 'Número',
    issueDate: 'Fecha de emisión',
    'issuer.cuit': 'CUIT',
    issuerName: 'Razón social',
    'recipient.docNumber': 'Documento',
    recipientName: 'Razón social',
    currency: 'Moneda',
    netTaxed: 'Neto gravado',
    iva: 'IVA',
    otherTaxes: 'Otros tributos',
    total: 'Total',
    cae: 'CAE',
    caeDueDate: 'Vencimiento del CAE',
  },
  issues: {
    missing: () => 'No se encontró en la factura.',
    invalid_format: ({ value }) => `Formato inválido: ${value}.`,
    invalid_cuit: () => 'El dígito verificador del CUIT no es válido.',
    unknown_voucher_type: ({ value }) => `Tipo de comprobante desconocido (${value}).`,
    future_date: () => 'La fecha de emisión es futura.',
    cae_due_before_issue: () => 'El CAE vence antes de la fecha de emisión.',
    total_mismatch: ({ expected, actual }) =>
      `El total no cierra: neto + IVA + tributos da ${fmt(expected)} y la factura dice ${fmt(actual)}.`,
    iva_net_mismatch: ({ expected, actual }) =>
      `El IVA corresponde a un neto de ${fmt(expected)}, pero el neto impreso es ${fmt(actual)}.`,
    invalid_iva_rate: ({ rate }) => `No existe la alícuota de IVA del ${rate}%.`,
    c_with_iva: () => 'Una factura C no discrimina IVA.',
    a_without_iva: () => 'Factura A sin IVA discriminado.',
    qr_mismatch: ({ printed, qr }) =>
      `En el papel dice ${printed} y el QR dice ${qr}. Se usa el QR.`,
    duplicate: () => 'Esta factura ya fue cargada.',
  },
  footer:
    'Proyecto de portfolio. Las facturas de la demo son ficticias y no tienen validez fiscal.',
};

const en: Messages = {
  locale: 'en-US',
  nav: { samples: 'Samples', howItWorks: 'How it works', github: 'GitHub' },
  landing: {
    eyebrow: 'Intelligent document processing',
    title: 'From invoices',
    titleAccent: 'to insights.',
    subtitle:
      'Billwise reads Argentine electronic invoices, takes the data from the ARCA QR code and the printed text, checks every field against tax rules and flags what needs a second look.',
    trySamples: 'Try sample invoices',
    howItWorks: 'How it works',
    privacy: 'Samples are fictitious and processed in your browser.',
    stepsTitle: 'How it works',
    steps: [
      { title: 'Upload', text: 'A PDF invoice, as downloaded from ARCA or your supplier.' },
      {
        title: 'Read the QR and text',
        text: 'The QR is the authorized record; the text fills in the rest.',
      },
      { title: 'Validate', text: 'CUIT, totals, IVA per rate, dates and duplicates.' },
      { title: 'Review', text: 'See where each value came from and fix what is off.' },
    ],
  },
  gallery: {
    eyebrow: 'Demo',
    title: 'Sample invoices',
    subtitle:
      'Fictitious invoices generated for the demo. Each one shows a different case: open it and see what Billwise catches.',
    open: 'Open',
    total: 'Total',
    batchNote:
      'They are processed as a batch in this order, which is why the last one is flagged as a duplicate.',
  },
  processing: {
    title: 'Processing invoice',
    stages: {
      download: 'Opening the file',
      text: 'Reading the text',
      qr: 'Looking for the ARCA QR',
      extract: 'Extracting the data',
      validate: 'Validating',
    },
    failed: 'The file could not be read.',
  },
  review: {
    invoice: 'Invoice',
    back: 'Samples',
    next: 'Next sample',
    status: { ready: 'Ready', review: 'Needs review', errors: 'Has errors' },
    summary: (errors, warnings) =>
      errors === 0 && warnings === 0
        ? 'All fields are consistent.'
        : [
            errors && `${errors} ${errors === 1 ? 'error' : 'errors'}`,
            warnings && `${warnings} ${warnings === 1 ? 'field to check' : 'fields to check'}`,
          ]
            .filter(Boolean)
            .join(' and '),
    sections: {
      voucher: 'Voucher',
      issuer: 'Issuer',
      recipient: 'Recipient',
      amounts: 'Amounts',
      authorization: 'Authorization',
    },
    sources: { qr: 'QR', text: 'Text' },
    fromQr: (printed) => `Taken from the QR. The paper says ${printed}.`,
    zoomIn: 'Zoom in',
    zoomOut: 'Zoom out',
    showJson: 'View JSON',
    hideJson: 'Hide JSON',
    invoiceIssues: 'Invoice',
    edited: 'Edited',
    noIva: 'No IVA breakdown',
    page: (n) => `Page ${n}`,
  },
  fields: {
    voucherType: 'Type',
    pointOfSale: 'Point of sale',
    number: 'Number',
    issueDate: 'Issue date',
    'issuer.cuit': 'CUIT',
    issuerName: 'Company name',
    'recipient.docNumber': 'Document',
    recipientName: 'Company name',
    currency: 'Currency',
    netTaxed: 'Net taxed',
    iva: 'IVA',
    otherTaxes: 'Other taxes',
    total: 'Total',
    cae: 'CAE',
    caeDueDate: 'CAE due date',
  },
  issues: {
    missing: () => 'Not found on the invoice.',
    invalid_format: ({ value }) => `Invalid format: ${value}.`,
    invalid_cuit: () => 'The CUIT check digit is not valid.',
    unknown_voucher_type: ({ value }) => `Unknown voucher type (${value}).`,
    future_date: () => 'The issue date is in the future.',
    cae_due_before_issue: () => 'The CAE expires before the issue date.',
    total_mismatch: ({ expected, actual }) =>
      `The total does not add up: net + IVA + taxes is ${fmt(expected)} but the invoice says ${fmt(actual)}.`,
    iva_net_mismatch: ({ expected, actual }) =>
      `The IVA matches a net amount of ${fmt(expected)}, but the printed net is ${fmt(actual)}.`,
    invalid_iva_rate: ({ rate }) => `There is no ${rate}% IVA rate.`,
    c_with_iva: () => 'C invoices do not itemize IVA.',
    a_without_iva: () => 'A invoice without itemized IVA.',
    qr_mismatch: ({ printed, qr }) =>
      `The paper says ${printed} and the QR says ${qr}. The QR is used.`,
    duplicate: () => 'This invoice was already loaded.',
  },
  footer: 'Portfolio project. Demo invoices are fictitious and have no tax validity.',
};

function fmt(value: string | number): string {
  const number = Number(value);
  return Number.isFinite(number)
    ? `$ ${number.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : String(value);
}

export const messages: Record<Language, Messages> = { es, en };
