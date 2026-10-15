import type { InvoiceField, IssueCode } from '@billwise/shared';

export type Language = 'es' | 'en';

type IssueMessage = (params: Record<string, string | number>) => string;

export interface Messages {
  locale: string;
  nav: { samples: string; invoices: string; dashboard: string; howItWorks: string; github: string };
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
    confirm: string;
    saved: string;
    savedMessage: string;
    viewInvoices: string;
    confirmDisabled: string;
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
  invoices: {
    title: string;
    subtitle: string;
    count: (shown: number, total: number) => string;
    selected: (n: number) => string;
    exportExcel: string;
    exportCsv: string;
    exportHint: string;
    reset: string;
    resetConfirm: string;
    filters: {
      status: string;
      supplier: string;
      month: string;
      all: string;
      allSuppliers: string;
      allMonths: string;
    };
    statuses: { ready: string; review: string; error: string };
    columns: {
      date: string;
      voucher: string;
      supplier: string;
      cuit: string;
      net: string;
      iva: string;
      otherTaxes: string;
      total: string;
      cae: string;
      status: string;
    };
    demoBadge: string;
    empty: string;
    selectAll: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    totalSpend: string;
    ivaCredit: string;
    ivaCreditHint: string;
    invoiceCount: string;
    pending: string;
    pendingLink: string;
    byMonth: string;
    byMonthHint: string;
    topSuppliers: string;
    topSuppliersHint: string;
    showData: string;
    month: string;
    supplier: string;
    amount: string;
  };
  fields: Record<
    Exclude<InvoiceField, 'invoice'> | 'issuerName' | 'recipientName' | 'otherTaxes',
    string
  >;
  issues: Record<IssueCode, IssueMessage>;
  upload: {
    eyebrow: string;
    title: string;
    subtitle: string;
    drop: string;
    choose: string;
    privacy: string;
    limits: string;
    photosLater: string;
    notPdf: string;
    tooLarge: string;
    another: string;
    trySamples: string;
    failed: { title: string; text: string };
    unreadable: Record<'scanned' | 'unknown', { title: string; text: string }>;
    galleryCta: { title: string; text: string; action: string };
    qrOnly: string;
  };
  demoCompany: { label: string; fictitious: string };
  footer: string;
}

const es: Messages = {
  locale: 'es-AR',
  nav: {
    samples: 'Ejemplos',
    invoices: 'Facturas',
    dashboard: 'Dashboard',
    howItWorks: 'Cómo funciona',
    github: 'GitHub',
  },
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
    confirm: 'Confirmar',
    saved: 'Confirmada',
    savedMessage: 'La factura quedó guardada en tus facturas.',
    viewInvoices: 'Ver facturas',
    confirmDisabled: 'Corregí los errores para poder confirmarla.',
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
  invoices: {
    title: 'Facturas',
    subtitle:
      'Las facturas cargadas en la demo: un historial ficticio de seis meses más las que confirmes desde los ejemplos.',
    count: (shown, total) => `${shown} de ${total} facturas`,
    selected: (n) => `${n} seleccionadas`,
    exportExcel: 'Exportar Excel',
    exportCsv: 'Exportar CSV',
    exportHint: 'Se exportan las seleccionadas o, si no hay, todas las del filtro.',
    reset: 'Reiniciar demo',
    resetConfirm: '¿Borrar las facturas que confirmaste en la demo?',
    filters: {
      status: 'Estado',
      supplier: 'Proveedor',
      month: 'Mes',
      all: 'Todos',
      allSuppliers: 'Todos los proveedores',
      allMonths: 'Todos los meses',
    },
    statuses: { ready: 'Lista', review: 'Para revisar', error: 'Con errores' },
    columns: {
      date: 'Fecha',
      voucher: 'Comprobante',
      supplier: 'Proveedor',
      cuit: 'CUIT',
      net: 'Neto',
      iva: 'IVA',
      otherTaxes: 'Otros tributos',
      total: 'Total',
      cae: 'CAE',
      status: 'Estado',
    },
    demoBadge: 'Demo',
    empty: 'No hay facturas con estos filtros.',
    selectAll: 'Seleccionar todas',
  },
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Gastos a partir de las facturas cargadas.',
    totalSpend: 'Gasto total',
    ivaCredit: 'IVA crédito fiscal',
    ivaCreditHint: 'De facturas A sin errores',
    invoiceCount: 'Facturas',
    pending: 'Pendientes de revisar',
    pendingLink: 'Ver pendientes',
    byMonth: 'Gasto por mes',
    byMonthHint: 'Total facturado por mes, con IVA y otros tributos.',
    topSuppliers: 'Principales proveedores',
    topSuppliersHint: 'Total facturado en el período.',
    showData: 'Ver datos',
    month: 'Mes',
    supplier: 'Proveedor',
    amount: 'Importe',
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
  upload: {
    eyebrow: 'Tu factura',
    title: 'Probá con una factura tuya',
    subtitle:
      'Subí una factura electrónica en PDF, tal como la descargás de ARCA o te la manda tu proveedor.',
    drop: 'Arrastrá el PDF acá',
    choose: 'Elegir archivo',
    privacy: 'Tu archivo no sale de tu dispositivo: se lee en este navegador.',
    limits: 'Solo PDF, hasta 10 MB.',
    photosLater: 'Las fotos y los escaneos se van a poder leer con IA más adelante.',
    notPdf: 'Ese archivo no es un PDF.',
    tooLarge: 'El archivo pesa más de 10 MB.',
    another: 'Subir otra',
    trySamples: 'Ver los ejemplos',
    failed: {
      title: 'No se pudo abrir el archivo',
      text: 'Puede estar dañado o protegido con contraseña.',
    },
    unreadable: {
      scanned: {
        title: 'Parece un escaneo o una foto',
        text: 'El PDF no tiene texto ni un QR que se pueda leer. Este tipo de archivo se va a procesar con IA.',
      },
      unknown: {
        title: 'No reconocimos el formato',
        text: 'No encontramos el QR de ARCA ni los datos de una factura electrónica. Preferimos avisarte antes que mostrarte datos inventados.',
      },
    },
    qrOnly:
      'El PDF es una imagen, sin texto: los datos salen del QR de ARCA. La razón social y el detalle de IVA se van a poder leer con IA.',
    galleryCta: {
      title: '¿Tenés una factura en PDF?',
      text: 'Probá Billwise con una factura tuya. Se lee en tu navegador y no sale de tu dispositivo.',
      action: 'Subir factura',
    },
  },
  demoCompany: { label: 'Empresa de la demo', fictitious: 'ficticia' },
  footer:
    'Proyecto de portfolio. Las facturas de la demo son ficticias y no tienen validez fiscal.',
};

const en: Messages = {
  locale: 'en-US',
  nav: {
    samples: 'Samples',
    invoices: 'Invoices',
    dashboard: 'Dashboard',
    howItWorks: 'How it works',
    github: 'GitHub',
  },
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
    confirm: 'Confirm',
    saved: 'Confirmed',
    savedMessage: 'The invoice was saved to your invoices.',
    viewInvoices: 'View invoices',
    confirmDisabled: 'Fix the errors to confirm it.',
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
  invoices: {
    title: 'Invoices',
    subtitle:
      'Invoices loaded in the demo: six months of fictitious history plus the samples you confirm.',
    count: (shown, total) => `${shown} of ${total} invoices`,
    selected: (n) => `${n} selected`,
    exportExcel: 'Export Excel',
    exportCsv: 'Export CSV',
    exportHint: 'Exports the selected invoices or, if none, everything in the filter.',
    reset: 'Reset demo',
    resetConfirm: 'Delete the invoices you confirmed in the demo?',
    filters: {
      status: 'Status',
      supplier: 'Supplier',
      month: 'Month',
      all: 'All',
      allSuppliers: 'All suppliers',
      allMonths: 'All months',
    },
    statuses: { ready: 'Ready', review: 'Needs review', error: 'Has errors' },
    columns: {
      date: 'Date',
      voucher: 'Voucher',
      supplier: 'Supplier',
      cuit: 'CUIT',
      net: 'Net',
      iva: 'IVA',
      otherTaxes: 'Other taxes',
      total: 'Total',
      cae: 'CAE',
      status: 'Status',
    },
    demoBadge: 'Demo',
    empty: 'No invoices match these filters.',
    selectAll: 'Select all',
  },
  dashboard: {
    title: 'Dashboard',
    subtitle: 'Spending built from the loaded invoices.',
    totalSpend: 'Total spend',
    ivaCredit: 'IVA tax credit',
    ivaCreditHint: 'From A invoices without errors',
    invoiceCount: 'Invoices',
    pending: 'Pending review',
    pendingLink: 'See pending',
    byMonth: 'Spend by month',
    byMonthHint: 'Total invoiced per month, including IVA and other taxes.',
    topSuppliers: 'Top suppliers',
    topSuppliersHint: 'Total invoiced in the period.',
    showData: 'Show data',
    month: 'Month',
    supplier: 'Supplier',
    amount: 'Amount',
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
  upload: {
    eyebrow: 'Your invoice',
    title: 'Try one of your invoices',
    subtitle: 'Upload an electronic invoice PDF, as downloaded from ARCA or sent by your supplier.',
    drop: 'Drop the PDF here',
    choose: 'Choose file',
    privacy: 'Your file never leaves your device: it is read in this browser.',
    limits: 'PDF only, up to 10 MB.',
    photosLater: 'Photos and scans will be read with AI later on.',
    notPdf: 'That file is not a PDF.',
    tooLarge: 'The file is larger than 10 MB.',
    another: 'Upload another',
    trySamples: 'See the samples',
    failed: {
      title: 'The file could not be opened',
      text: 'It may be damaged or password protected.',
    },
    unreadable: {
      scanned: {
        title: 'This looks like a scan or a photo',
        text: 'The PDF has no readable text or QR code. Files like this will be processed with AI.',
      },
      unknown: {
        title: 'Layout not recognized',
        text: 'We could not find the ARCA QR code or the fields of an electronic invoice. We would rather tell you than show made-up data.',
      },
    },
    qrOnly:
      'This PDF is an image with no text: the data comes from the ARCA QR code. The company name and IVA breakdown will be read with AI.',
    galleryCta: {
      title: 'Have an invoice PDF?',
      text: 'Try Billwise with one of your own invoices. It is read in your browser and never leaves your device.',
      action: 'Upload invoice',
    },
  },
  demoCompany: { label: 'Demo company', fictitious: 'fictitious' },
  footer: 'Portfolio project. Demo invoices are fictitious and have no tax validity.',
};

function fmt(value: string | number): string {
  const number = Number(value);
  return Number.isFinite(number)
    ? `$ ${number.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : String(value);
}

export const messages: Record<Language, Messages> = { es, en };
